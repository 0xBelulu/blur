import {
  tagPool,
  archetypeDescriptions,
  DIMENSIONS,
  ARCHETYPE_SUPPRESSED,
} from "../data/questions";

export const ARCHETYPE_VECTORS = {
  mist: { pos: [1, 0, -1], color: [180, 185, 195], label: "雾" },
  chime: { pos: [0, 1, -1], color: [195, 175, 155], label: "风铃" },
  drift: { pos: [-1, 0, -1], color: [155, 180, 195], label: "漂流者" },
  still: { pos: [0, -1, -1], color: [155, 165, 185], label: "静观者" },
  rainbow: { pos: [0, 0, 1], color: [185, 165, 195], label: "虹" },
};

export const VECTOR_AXES = [
  { key: "x", label: "", color: [180, 185, 195] },
  { key: "y", label: "", color: [195, 175, 155] },
  { key: "z", label: "", color: [155, 180, 195] },
];

export function mapTo3D(scores) {
  const to01 = (v) => Math.max(0, Math.min(1, ((v ?? 0.5) - 0.25) / 0.75));

  const mist = to01(scores?.mist?.score);
  const chime = to01(scores?.chime?.score);
  const drift = to01(scores?.drift?.score);
  const still = to01(scores?.still?.score);
  const rainbow = to01(scores?.rainbow?.score);

  return [
    mist - drift,
    chime - still,
    2 * rainbow - 1,
  ];
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getTagInfo(trait) {
  const info = tagPool[trait];
  return {
    weight: info ? info.weight : 1,
    text: info ? info.text : trait,
    detail: info ? info.detail : "",
  };
}

export function generateResult(answers) {
  const traitCounts = {};

  answers.forEach((answer) => {
    if (answer.rankOrder) {
      // 排序题：根据排名给不同权重
      const weights = [1.0, 0.6, 0.3, 0.1];
      answer.rankOrder.forEach((optionIndex, rank) => {
        const option = answer.options[optionIndex];
        if (option && option.traits) {
          option.traits.forEach((trait) => {
            traitCounts[trait] = (traitCounts[trait] || 0) + weights[rank];
          });
        }
      });
    } else if (answer.type === "scale" && answer.traits) {
      // 量表题：1-5分映射到权重
      const scaleWeights = [0, 0.4, 0.7, 1.0, 1.3, 1.6];
      const weight = scaleWeights[answer.value] ?? 1.0;
      answer.traits.forEach((trait) => {
        traitCounts[trait] = (traitCounts[trait] || 0) + weight;
      });
    } else if (answer.traits) {
      // 普通四选一
      answer.traits.forEach((trait) => {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1;
      });
    }
  });

  const answerHash = answers.reduce((h, a) => {
    if (a.rankOrder) {
      return h + a.rankOrder.reduce((s, i) => s + i, 0);
    }
    if (a.type === "scale") {
      return h + (a.value || 0);
    }
    return h + (a.optionId ? a.optionId.charCodeAt(0) : 0);
  }, 0);

  const scoredTraits = Object.entries(traitCounts).map(([trait, count]) => {
    const info = getTagInfo(trait);
    const noise = (seededRandom(trait.length + answerHash) - 0.5) * 0.15;
    return {
      trait,
      score: count * info.weight + noise,
      text: info.text,
      detail: info.detail,
    };
  });

  scoredTraits.sort((a, b) => b.score - a.score);

  const numTags = 5;
  const selectedTagDetails = scoredTraits.slice(0, numTags).map((t) => ({
    trait: t.trait,
    text: t.text,
    detail: t.detail,
    score: t.score,
  }));

  const dimensionScores = computeDimensionScores(traitCounts);

  const { key: archetypeKey, archetype, secondaryArchetype } =
    determineArchetype(dimensionScores);

  const suppressedTraits = determineSuppressedTraits(archetypeKey, scoredTraits);

  return {
    archetype,
    archetypeKey,
    secondaryArchetype,
    tagDetails: selectedTagDetails,
    suppressedTraits,
    scoredTraits: scoredTraits.slice(0, 10),
    dimensionScores,
  };
}

function computeDimensionScores(traitCounts) {
  const rawScores = {};

  Object.entries(DIMENSIONS).forEach(([dimKey, dim]) => {
    let total = 0;
    dim.traits.forEach((trait) => {
      const info = getTagInfo(trait);
      if (traitCounts[trait]) {
        total += traitCounts[trait] * info.weight;
      }
    });
    rawScores[dimKey] = {
      name: dim.name,
      raw: total,
    };
  });

  const rawValues = Object.values(rawScores).map((d) => d.raw);
  const maxRaw = Math.max(...rawValues, 0.01);

  const scores = {};
  Object.entries(rawScores).forEach(([dimKey, dim]) => {
    const normalized = dim.raw / maxRaw;
    const display = 0.25 + normalized * 0.75;
    scores[dimKey] = {
      name: dim.name,
      score: display,
      raw: dim.raw,
    };
  });

  return scores;
}

function determineArchetype(dimensionScores) {
  const sorted = Object.entries(dimensionScores).sort(
    (a, b) => b[1].raw - a[1].raw
  );
  const bestKey = sorted[0][0];
  const secondKey = sorted[1] && sorted[1][1].raw > 0 ? sorted[1][0] : null;

  if (sorted[0][1].raw === 0) {
    const keys = Object.keys(archetypeDescriptions);
    const hash = Object.entries(dimensionScores).reduce(
      (h, [k]) => h + k.charCodeAt(0),
      0
    );
    return {
      key: keys[hash % keys.length],
      archetype: archetypeDescriptions[keys[hash % keys.length]],
      secondaryArchetype: null,
    };
  }

  return {
    key: bestKey,
    archetype: archetypeDescriptions[bestKey],
    secondaryArchetype: secondKey
      ? {
          key: secondKey,
          title: archetypeDescriptions[secondKey].title,
          symbol: archetypeDescriptions[secondKey].symbol,
        }
      : null,
  };
}

function determineSuppressedTraits(archetypeKey, scoredTraits) {
  const suppressedList = ARCHETYPE_SUPPRESSED[archetypeKey] || [];
  const traitScoreMap = Object.fromEntries(
    scoredTraits.map((t) => [t.trait, t.score])
  );

  return suppressedList
    .map((trait) => {
      const info = getTagInfo(trait);
      const score = traitScoreMap[trait] || 0;
      return {
        trait,
        text: info.text,
        detail: info.detail,
        score,
      };
    })
    .sort((a, b) => a.score - b.score); // 分数越低，越被压抑
}

