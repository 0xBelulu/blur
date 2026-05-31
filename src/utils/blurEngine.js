import { DIMENSIONS, DIMENSION_KEYS } from "../data/dimensions.js";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles.js";
import { projectTo3D } from "../data/projection.js";

export const ARCHETYPE_VECTORS = {};
export const VECTOR_AXES = [
  { key: "x", label: "", color: [180, 185, 195] },
  { key: "y", label: "", color: [195, 175, 155] },
  { key: "z", label: "", color: [155, 180, 195] },
];

/**
 * 根据 archetypeProfiles 自动生成 3D 空间坐标
 * 新增人格时此处无需手动维护
 */
function initArchetypeVectors() {
  for (const [key, profile] of Object.entries(ARCHETYPE_PROFILES)) {
    const pos = projectTo3D(profile.vector);
    ARCHETYPE_VECTORS[key] = {
      pos,
      color: profile.color,
      label: profile.title,
    };
  }
}
initArchetypeVectors();

export function mapTo3D(userVector) {
  return projectTo3D(userVector);
}

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
function accumulateDimensions(answers, questions) {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
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

function determineArchetype(userVector) {
  const similarities = [];
  for (const [key, profile] of Object.entries(ARCHETYPE_PROFILES)) {
    const sim = cosineSimilarity(userVector, profile.vector);
    similarities.push({ key, sim, profile });
  }
  similarities.sort((a, b) => b.sim - a.sim);

  const best = similarities[0];
  const second = similarities[1];

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
    similarities,
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

export function generateResult(answers, questions) {
  const rawDims = accumulateDimensions(answers, questions);
  const userVector = normalizeDimensions(rawDims);

  const dimensionScores = computeDimensionScores(userVector);

  const { key: archetypeKey, archetype, secondaryArchetype, similarities } =
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
    rawAnswers: answers,
    specialNarratives: [],
  };
}
