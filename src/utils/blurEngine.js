import { DIMENSIONS, DIMENSION_KEYS } from "../data/dimensions.js";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles.js";

/**
 * 纯随机回答下每个原型的余弦相似度分布参数（20000 次 Monte Carlo）
 * 校准公式：z[k] = (cos_sim - μ[k]) / σ[k]
 * z-score 标准化后所有原型在随机输入下均值为 0、方差为 1，消除基线偏差
 */
const RANDOM_BASELINES = {
  rainbow: 0.6848,
  drift: 0.5362,
  tide: 0.4824,
  negative: 0.4755,
  still: 0.4131,
  mist: 0.3271,
  salt: 0.3145,
  silhouette: 0.1885,
  chime: 0.1268,
};

const RANDOM_STDS = {
  mist: 0.0949,
  chime: 0.0950,
  drift: 0.0718,
  still: 0.0860,
  rainbow: 0.0432,
  salt: 0.0836,
  negative: 0.0746,
  tide: 0.0846,
  silhouette: 0.0967,
};

/** Softmax 温度，控制概率分布的锐度。T 越大分布越均匀 */
const SOFTMAX_TEMPERATURE = 2.0;

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const key of DIMENSION_KEYS) {
    const av = a[key] || 0;
    const bv = b[key] || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < 0.0001) return 0;
  return dot / denom;
}

/**
 * 从原始答案中解析出用户维度的累加值
 */
const questionMapCache = new WeakMap();

function accumulateDimensions(answers, questions) {
  let questionMap = questionMapCache.get(questions);
  if (!questionMap) {
    questionMap = new Map(questions.map((q) => [q.id, q]));
    questionMapCache.set(questions, questionMap);
  }
  const dims = {};

  for (const answer of answers) {
    if (!answer) continue;
    const q = questionMap.get(answer.questionId);
    if (!q) continue;

    if (answer.type === "rank" && Array.isArray(answer.rankOrder)) {
      const weights = [1.0, 0.6, 0.3, 0.1];
      answer.rankOrder.forEach((optionIndex, rank) => {
        const option = q.options?.[optionIndex];
        if (option?.dimensions) {
          const w = weights[rank] ?? 0;
          for (const [dk, dv] of Object.entries(option.dimensions)) {
            dims[dk] = (dims[dk] || 0) + dv * w;
          }
        }
      });
    } else if (answer.type === "scale" && typeof answer.value === "number") {
      const scaleWeights = [0, 0.4, 0.7, 1.0, 1.3, 1.6];
      const weight = scaleWeights[answer.value] ?? 1.0;
      if (q.dimensions) {
        for (const [dk, dv] of Object.entries(q.dimensions)) {
          dims[dk] = (dims[dk] || 0) + dv * weight;
        }
      }
    } else if (answer.optionId && q.options) {
      const option = q.options.find((o) => o.id === answer.optionId);
      if (option?.dimensions) {
        for (const [dk, dv] of Object.entries(option.dimensions)) {
          dims[dk] = (dims[dk] || 0) + dv;
        }
      }
    }
  }

  return dims;
}

/**
 * 标准化维度到 [-1, 1]
 */
function normalizeDimensions(dims) {
  const absValues = Object.values(dims).map((v) => Math.abs(v));
  const max = Math.max(...absValues, 0.01);
  const normalized = {};
  for (const key of DIMENSION_KEYS) {
    normalized[key] = Math.max(-1, Math.min(1, (dims[key] || 0) / max));
  }
  return normalized;
}

/**
 * 计算维度分数，用于 UI 展示（范围 [0, 1]）
 */
function computeDimensionScores(userVector) {
  const rawValues = DIMENSION_KEYS.map((k) => Math.abs(userVector[k] || 0));
  const maxRaw = Math.max(...rawValues, 0.01);

  const scores = {};
  for (const key of DIMENSION_KEYS) {
    const raw = userVector[key] || 0;
    const normalized = Math.abs(raw) / maxRaw;
    const display = 0.25 + normalized * 0.75;
    scores[key] = {
      name: DIMENSIONS[key].name,
      score: display,
      raw,
      direction: raw > 0 ? "positive" : raw < 0 ? "negative" : "neutral",
      negativeLabel: DIMENSIONS[key].negative,
      positiveLabel: DIMENSIONS[key].positive,
    };
  }
  return scores;
}

function softmax(scores, temperature) {
  const expScores = {};
  let sum = 0;
  for (const key of Object.keys(scores)) {
    expScores[key] = Math.exp(scores[key] / temperature);
    sum += expScores[key];
  }
  const probs = {};
  for (const key of Object.keys(expScores)) {
    probs[key] = expScores[key] / sum;
  }
  return probs;
}

function determineArchetype(userVector) {
  const similarities = [];
  for (const [key, profile] of Object.entries(ARCHETYPE_PROFILES)) {
    const sim = cosineSimilarity(userVector, profile.vector);
    similarities.push({ key, sim, profile });
  }
  similarities.sort((a, b) => b.sim - a.sim);

  // Calibrate: z-score = (sim - μ) / σ, then softmax
  const calibratedScores = {};
  for (const { key, sim } of similarities) {
    const mu = RANDOM_BASELINES[key] || 0;
    const sigma = RANDOM_STDS[key] || 1;
    calibratedScores[key] = (sim - mu) / sigma;
  }
  const probs = softmax(calibratedScores, SOFTMAX_TEMPERATURE);

  const ranked = Object.entries(probs)
    .sort((a, b) => b[1] - a[1])
    .map(([key, prob]) => ({
      key,
      prob,
      sim: similarities.find((s) => s.key === key).sim,
      profile: ARCHETYPE_PROFILES[key],
    }));

  const best = ranked[0];
  const second = ranked[1];

  return {
    key: best.key,
    archetype: best.profile,
    secondaryArchetype: second
      ? {
          key: second.key,
          title: second.profile.title,
          symbol: second.profile.symbol,
        }
      : null,
    similarities: ranked.map((r) => ({
      key: r.key,
      sim: r.sim,
      prob: r.prob,
    })),
    archetypeProbabilities: ranked.map((r) => ({
      key: r.key,
      prob: r.prob,
    })),
  };
}

function determineSuppressedTraits(archetypeKey, userVector) {
  const profile = ARCHETYPE_PROFILES[archetypeKey];
  if (!profile) return [];

  const suppressed = profile.suppressedDimensions || [];
  return suppressed
    .map((dimKey) => {
      const score = userVector[dimKey] || 0;
      const info = DIMENSIONS[dimKey];
      return {
        trait: dimKey,
        text: info.name,
        detail: score > 0 ? info.positive : score < 0 ? info.negative : "",
        score,
        direction: score > 0 ? "positive" : score < 0 ? "negative" : "neutral",
      };
    })
    .sort((a, b) => Math.abs(a.score) - Math.abs(b.score));
}

export const DIMENSION_PAIRS = [
  { key: "energy-express", xKey: "energySource", yKey: "expressivity", label: "能量·表达" },
  { key: "sense-change", xKey: "sensorySensitivity", yKey: "changeAffinity", label: "感知·流动" },
  { key: "cognition-boundary", xKey: "cognitiveRange", yKey: "boundaryClarity", label: "认知·边界" },
  { key: "time-depth", xKey: "temporalDepth", yKey: "processingDepth", label: "沉淀·深度" },
  { key: "emotion-closure", xKey: "emotionalLatency", yKey: "closureTolerance", label: "反应·模糊" },
];

export function generateResult(answers, questions) {
  const rawDims = accumulateDimensions(answers, questions);
  const userVector = normalizeDimensions(rawDims);

  const dimensionScores = computeDimensionScores(userVector);

  const { key: archetypeKey, archetype, secondaryArchetype, similarities, archetypeProbabilities } =
    determineArchetype(userVector);

  const suppressedTraits = determineSuppressedTraits(archetypeKey, userVector);

  // Top 维度（展示用）
  const scoredDims = DIMENSION_KEYS.map((k) => ({
    trait: k,
    text: DIMENSIONS[k].name,
    detail:
      userVector[k] > 0
        ? DIMENSIONS[k].positive
        : userVector[k] < 0
          ? DIMENSIONS[k].negative
          : "",
    score: Math.abs(userVector[k] || 0),
    raw: userVector[k] || 0,
    direction: userVector[k] > 0 ? "positive" : userVector[k] < 0 ? "negative" : "neutral",
  })).sort((a, b) => b.score - a.score);

  const numTags = 5;
  const tagDetails = scoredDims.slice(0, numTags).map((d) => ({
    trait: d.trait,
    text: d.text,
    detail: d.detail,
    score: d.score,
    raw: d.raw,
    direction: d.direction,
  }));

  return {
    archetype,
    archetypeKey,
    secondaryArchetype,
    tagDetails,
    suppressedTraits,
    scoredTraits: scoredDims.slice(0, 10),
    dimensionScores,
    userVector,
    similarities,
    archetypeProbabilities,
    rawAnswers: answers,
    specialNarratives: [],
  };
}
