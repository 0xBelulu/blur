import { DIMENSIONS, DIMENSION_KEYS } from "../data/dimensions.js";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles.js";
import { questions as defaultQuestions } from "../data/questions.js";
import { getDualSynergy } from "../data/dualArchetypes.js";

/**
 * 评分权重配置
 * - scaleWeights: 以 3 (中立) 为基准的双向对称权重 (1=完全不同意 … 5=完全同意)
 * - rankWeights: 排序题位次权重 (0=最像:+1.0, 1=第二:+0.4, 2=第三:0.0, 3=最不像:-0.6)
 */
export const scaleWeights = [0, -1.2, -0.6, 0.0, 0.6, 1.2];
export const rankWeights = [1.0, 0.4, 0.0, -0.6];

export function getRankWeight(rank) {
  return rankWeights[rank] ?? 0;
}

export function getScaleWeight(scaleValue) {
  return scaleWeights[scaleValue] ?? 0;
}

/**
 * 纯随机回答下每个原型的余弦相似度分布参数（20000 次 Monte Carlo）
 * 校准公式：z[k] = (cos_sim - μ[k]) / σ[k]
 * z-score 标准化后所有原型在随机输入下均值为 0、方差为 1，消除基线偏差
 */
export const RANDOM_BASELINES = {
  salt: 0.2686,
  warmCurrent: 0.2616,
  rainbow: 0.2148,
  tide: 0.0769,
  chime: 0.0210,
  negative: 0.0151,
  kite: -0.0659,
  mist: -0.1152,
  silhouette: -0.1593,
  crystal: -0.2452,
};

export const RANDOM_STDS = {
  crystal: 0.4133,
  salt: 0.4023,
  negative: 0.3967,
  rainbow: 0.3953,
  tide: 0.3806,
  warmCurrent: 0.3439,
  mist: 0.3403,
  kite: 0.3301,
  silhouette: 0.2926,
  chime: 0.2779,
};

export const ARCHETYPE_BASELINES = RANDOM_BASELINES;
export const ARCHETYPE_STDS = RANDOM_STDS;

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
 * 规范化不同格式的 answers 输入（数组或对象映射）
 */
function normalizeAnswers(answers) {
  if (!answers) return [];
  if (Array.isArray(answers)) return answers;
  if (typeof answers === "object") {
    return Object.entries(answers).map(([key, value]) => {
      const qId = isNaN(Number(key)) ? key : Number(key);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return { questionId: value.questionId ?? qId, ...value };
      }
      if (typeof value === "number") {
        return { questionId: qId, type: "scale", value };
      }
      if (typeof value === "string") {
        return { questionId: qId, type: "single", optionId: value };
      }
      if (Array.isArray(value)) {
        return { questionId: qId, type: "rank", rankOrder: value };
      }
      return { questionId: qId, value };
    });
  }
  return [];
}

/**
 * 从原始答案中解析出用户维度的累加值
 */
const questionMapCache = new WeakMap();

function accumulateDimensions(answers, questions = defaultQuestions) {
  const qList = questions || defaultQuestions;
  let questionMap = questionMapCache.get(qList);
  if (!questionMap) {
    questionMap = new Map(qList.map((q) => [q.id, q]));
    questionMapCache.set(qList, questionMap);
  }
  const dims = {};
  const answerList = normalizeAnswers(answers);

  for (const answer of answerList) {
    if (!answer) continue;
    const q = questionMap.get(answer.questionId);
    if (!q) continue;

    const rankList =
      answer.rankOrder ||
      answer.ranking ||
      answer.order ||
      (answer.type === "rank" && Array.isArray(answer.value) ? answer.value : null);

    if (answer.type === "rank" && Array.isArray(rankList)) {
      rankList.forEach((optionTarget, rank) => {
        const option =
          typeof optionTarget === "number"
            ? (q.options?.[optionTarget] ?? q.options?.find((o) => o.id === optionTarget))
            : (q.options?.find((o) => o.id === optionTarget) ??
               (Number.isInteger(Number(optionTarget)) ? q.options?.[Number(optionTarget)] : null) ??
               (typeof optionTarget === "object" ? optionTarget : null));

        if (option?.dimensions) {
          const w = getRankWeight(rank);
          for (const [dk, dv] of Object.entries(option.dimensions)) {
            dims[dk] = (dims[dk] || 0) + dv * w;
          }
        }
      });
    } else if (
      answer.type === "scale" ||
      (q.type === "scale" && typeof (answer.value ?? answer) === "number")
    ) {
      const scaleValue =
        typeof answer.value === "number"
          ? answer.value
          : typeof answer === "number"
            ? answer
            : null;

      if (typeof scaleValue === "number") {
        const weight = getScaleWeight(scaleValue);
        if (q.targetDimension) {
          const polarity = typeof q.polarity === "number" ? q.polarity : 1;
          const effectiveWeight = weight * polarity;
          dims[q.targetDimension] = (dims[q.targetDimension] || 0) + effectiveWeight;
          if (q.dimensions) {
            for (const [dk, dv] of Object.entries(q.dimensions)) {
              if (dk !== q.targetDimension) {
                dims[dk] = (dims[dk] || 0) + dv * weight;
              }
            }
          }
        } else if (q.dimensions) {
          for (const [dk, dv] of Object.entries(q.dimensions)) {
            dims[dk] = (dims[dk] || 0) + dv * weight;
          }
        }
      }
    } else if (q.options) {
      const optionId =
        answer.optionId ??
        answer.selectedOptionId ??
        (typeof answer === "string" ? answer : null) ??
        (typeof answer.value === "string" ? answer.value : null);

      const option =
        optionId != null
          ? (q.options.find((o) => o.id === optionId) ??
             (typeof optionId === "number" ? q.options[optionId] : null))
          : (answer.option && typeof answer.option === "object" ? answer.option : null);

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
      negativeDesc: DIMENSIONS[key].negativeDesc,
      positiveDesc: DIMENSIONS[key].positiveDesc,
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

  // Calibrate: combine z-score with raw cosine similarity to preserve geometric truth
  // Base z-score eliminates baseline noise; raw cosine similarity anchors authentic affinity.
  const calibratedScores = {};
  for (const { key, sim } of similarities) {
    const mu = RANDOM_BASELINES[key] || 0;
    const sigma = RANDOM_STDS[key] || 1;
    const z = (sim - mu) / sigma;
    // Scale raw similarity boost when user shows positive alignment (preserves geometric dominance)
    const simBoost = sim > 0 ? Math.pow(sim, 1.5) * 4.0 : 0;
    calibratedScores[key] = z + simBoost;
  }

  // Safeguard 1: High raw similarity (>= 0.55) must never be overtaken by low raw similarity (<= 0.25)
  const highSimArchetypes = similarities.filter((s) => s.sim >= 0.55);
  if (highSimArchetypes.length > 0) {
    const minHighSimScore = Math.min(...highSimArchetypes.map((s) => calibratedScores[s.key]));
    for (const { key, sim } of similarities) {
      if (sim <= 0.25 && calibratedScores[key] >= minHighSimScore) {
        calibratedScores[key] = minHighSimScore - 0.5;
      }
    }
  }

  // Safeguard 2: Ideal vector match (sim >= 0.95) must always win 1st place
  for (const { key, sim } of similarities) {
    if (sim >= 0.95) {
      let maxOther = -Infinity;
      for (const { key: otherKey } of similarities) {
        if (otherKey !== key && calibratedScores[otherKey] > maxOther) {
          maxOther = calibratedScores[otherKey];
        }
      }
      if (calibratedScores[key] <= maxOther) {
        calibratedScores[key] = maxOther + 1.0;
      }
    }
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
          roleBadge: second.profile.roleBadge,
          roleSummary: second.profile.roleSummary,
          prob: second.prob,
          sim: second.sim,
          profile: second.profile,
        }
      : null,
    similarities: ranked.map((r) => ({
      key: r.key,
      sim: r.sim,
      prob: r.prob,
      profile: r.profile,
    })),
    archetypeProbabilities: ranked.map((r) => ({
      key: r.key,
      prob: r.prob,
    })),
  };
}

export function determineSuppressedTraits(archetypeKey, userVector) {
  const profile = ARCHETYPE_PROFILES[archetypeKey];
  if (!profile) return [];

  const suppressed = profile.suppressedDimensions || [];
  return suppressed
    .map((dimKey) => {
      const score = userVector[dimKey] || 0;
      const info = DIMENSIONS[dimKey];
      const dir = score >= 0 ? "positive" : "negative";
      const shadowData = info?.shadow?.[dir] || {};
      return {
        trait: dimKey,
        text: info.name,
        detail: score > 0 ? info.positive : score < 0 ? info.negative : info.positive,
        score,
        direction: score > 0 ? "positive" : score < 0 ? "negative" : "neutral",
        triggerScene: shadowData.triggerScene || "",
        whyHidden: shadowData.whyHidden || "",
        latentPower: shadowData.latentPower || "",
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

/**
 * 置信度曲线：作答越少，越不该表现得"算出了什么"
 * 0 题 → 0；10 题（基本画像）→ 0.71；30 题 → 0.98
 */
const CONFIDENCE_DECAY = 8;

function confidenceFromCount(count) {
  if (!count || count <= 0) return 0;
  return 1 - Math.exp(-count / CONFIDENCE_DECAY);
}

/**
 * 解算核心（唯一真相源）
 *
 * 所有需要"当前这份答案指向哪些原型"的地方都必须走这里，
 * 不要另写一份评分逻辑。目前有两个消费者：
 *   1. generateResult —— 出结果页
 *   2. 做题页的漂浮 emoji 场 —— 需要随时可解的中间态
 *
 * 返回的 field 按 ARCHETYPE_PROFILES 的固定顺序排列（不是按概率排序），
 * 这样渲染层可以用固定槽位映射，权重变化时不会发生符号跳变。
 */
export function solveProfile(answers, questions = defaultQuestions) {
  const rawDims = accumulateDimensions(answers, questions);
  const userVector = normalizeDimensions(rawDims);
  const answeredCount = normalizeAnswers(answers).filter(Boolean).length;
  const core = determineArchetype(userVector);
  const confidence = confidenceFromCount(answeredCount);

  const probByKey = {};
  for (const item of core.archetypeProbabilities) probByKey[item.key] = item.prob;

  const keys = Object.keys(ARCHETYPE_PROFILES);
  const uniform = 1 / keys.length;

  // 低置信度时向均匀分布回退：没答几题就别假装已经看出你是谁
  const field = keys.map((key) => {
    const prob = probByKey[key] ?? 0;
    const profile = ARCHETYPE_PROFILES[key];
    return {
      key,
      title: profile?.title ?? "",
      symbol: profile?.symbol ?? "·",
      prob,
      weight: confidence * prob + (1 - confidence) * uniform,
    };
  });

  return { userVector, answeredCount, confidence, core, field };
}

export function generateResult(answers, questions = defaultQuestions) {
  const { userVector, core } = solveProfile(answers, questions);

  const { key: archetypeKey, archetype, secondaryArchetype, similarities, archetypeProbabilities } = core;

  const dimensionScores = computeDimensionScores(userVector);

  const suppressedTraits = determineSuppressedTraits(archetypeKey, userVector);

  const topSim1 = similarities[0];
  const topSim2 = similarities[1];
  const probDiff = topSim2 ? Math.abs(topSim1.prob - topSim2.prob) : 1;
  const simDiff = topSim2 ? Math.abs(topSim1.sim - topSim2.sim) : 1;
  const isDualResonance = Boolean(topSim2 && (probDiff <= 0.08 || simDiff <= 0.09));
  const dualSynergy = isDualResonance
    ? getDualSynergy(topSim1.key, topSim2.key, topSim1.profile, topSim2.profile)
    : null;

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
    longDesc:
      userVector[k] > 0
        ? DIMENSIONS[k].positiveDesc
        : userVector[k] < 0
          ? DIMENSIONS[k].negativeDesc
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
    longDesc: d.longDesc,
    score: d.score,
    raw: d.raw,
    direction: d.direction,
  }));

  return {
    archetype,
    archetypeKey,
    primaryArchetype: archetype,
    secondaryArchetype,
    isDualResonance,
    dualSynergy,
    tagDetails,
    topTags: tagDetails,
    suppressedTraits,
    scoredTraits: scoredDims.slice(0, 10),
    dimensionScores,
    userVector,
    similarities,
    archetypeProbabilities,
    archetypeScores: archetypeProbabilities,
    rawAnswers: answers,
    specialNarratives: [],
  };
}
