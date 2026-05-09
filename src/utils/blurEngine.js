import {
  tagPool,
  archetypeDescriptions,
  DIMENSIONS,
  ARCHETYPE_TRAITS,
  ARCHETYPE_SUPPRESSED,
} from "../data/questions";

export const ARCHETYPE_VECTORS = {
  mist: { pos: [1, 0, -1], color: [180, 185, 195], label: "雾" },
  thunder: { pos: [0, 1, -1], color: [195, 175, 155], label: "雷" },
  tide: { pos: [-1, 0, -1], color: [155, 180, 195], label: "潮汐" },
  abyss: { pos: [0, -1, -1], color: [155, 165, 185], label: "深渊" },
  rainbow: { pos: [0, 0, 1], color: [185, 165, 195], label: "虹" },
};

export const VECTOR_AXES = [
  { key: "x", label: "", color: [180, 185, 195] },
  { key: "y", label: "", color: [195, 175, 155] },
  { key: "z", label: "", color: [155, 180, 195] },
];

export function mapTo3D(scores) {
  const mist = scores?.mist?.score ?? 0.5;
  const thunder = scores?.thunder?.score ?? 0.5;
  const tide = scores?.tide?.score ?? 0.5;
  const abyss = scores?.abyss?.score ?? 0.5;
  const rainbow = scores?.rainbow?.score ?? 0.5;

  return [
    mist - tide,
    thunder - abyss,
    2 * rainbow - 1,
  ];
}

const PALETTE = [
  [180, 185, 195],
  [195, 175, 155],
  [155, 180, 195],
  [155, 165, 185],
  [185, 165, 195],
  [175, 185, 175],
  [195, 185, 165],
  [165, 175, 195],
];

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
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
    return h + (a.optionId ? a.optionId.charCodeAt(0) : 0);
  }, 0);

  const scoredTraits = Object.entries(traitCounts).map(([trait, count]) => {
    const tagInfo = tagPool[trait];
    const weight = tagInfo ? tagInfo.weight : 1;
    const noise = (seededRandom(trait.length + answerHash) - 0.5) * 0.15;
    return {
      trait,
      score: count * weight + noise,
      text: tagInfo ? tagInfo.text : trait,
      detail: tagInfo ? tagInfo.detail : "",
    };
  });

  scoredTraits.sort((a, b) => b.score - a.score);

  const numTags = 5;
  const selectedTags = scoredTraits.slice(0, numTags).map((t) => t.text);
  const selectedTagDetails = scoredTraits.slice(0, numTags).map((t) => ({
    trait: t.trait,
    text: t.text,
    detail: t.detail,
    score: t.score,
  }));

  const { key: archetypeKey, archetype, secondaryArchetype } =
    determineArchetype(scoredTraits);

  const suppressedTraits = determineSuppressedTraits(archetypeKey, scoredTraits);

  const clarity = 0.4 + seededRandom(answerHash + 7) * 0.2;
  const cloudData = generateCloudData(selectedTags.length, clarity, answerHash);

  const dimensionScores = computeDimensionScores(traitCounts);

  return {
    archetype,
    archetypeKey,
    secondaryArchetype,
    tags: selectedTags,
    tagDetails: selectedTagDetails,
    suppressedTraits,
    clarity,
    cloudData,
    scoredTraits: scoredTraits.slice(0, 10),
    dimensionScores,
  };
}

function computeDimensionScores(traitCounts) {
  const rawScores = {};

  Object.entries(DIMENSIONS).forEach(([dimKey, dim]) => {
    let total = 0;
    let maxTotal = 0;
    dim.traits.forEach((trait) => {
      const tagInfo = tagPool[trait];
      const weight = tagInfo ? tagInfo.weight : 1;
      maxTotal += weight * 3; // 假设每特质最多出现3次
      if (traitCounts[trait]) {
        total += traitCounts[trait] * weight;
      }
    });
    rawScores[dimKey] = {
      name: dim.name,
      raw: maxTotal > 0 ? Math.min(total / maxTotal, 1) : 0,
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
    };
  });

  return scores;
}

function determineArchetype(scoredTraits) {
  const archetypeScores = {};

  for (const [key, traits] of Object.entries(ARCHETYPE_TRAITS)) {
    let score = 0;
    for (const st of scoredTraits) {
      if (traits.includes(st.trait)) {
        score += st.score;
      }
    }
    archetypeScores[key] = score;
  }

  // 排序找出最高和次高
  const sorted = Object.entries(archetypeScores).sort((a, b) => b[1] - a[1]);
  const bestKey = sorted[0][0];
  const secondKey = sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null;

  // 如果最高分是0，回退到随机
  if (sorted[0][1] === 0) {
    const keys = Object.keys(archetypeDescriptions);
    const fallbackIndex =
      scoredTraits.reduce((h, t) => h + t.trait.charCodeAt(0), 0) % keys.length;
    return {
      key: keys[fallbackIndex],
      archetype: archetypeDescriptions[keys[fallbackIndex]],
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
      const tagInfo = tagPool[trait];
      const score = traitScoreMap[trait] || 0;
      return {
        trait,
        text: tagInfo ? tagInfo.text : trait,
        detail: tagInfo ? tagInfo.detail : "",
        score,
      };
    })
    .sort((a, b) => a.score - b.score); // 分数越低，越被压抑
}

function generateCloudData(numTags, clarity, seed) {
  const particles = [];
  const vectors = [];

  const numParticles = 45 + Math.floor(seededRandom(seed + 1) * 20);

  for (let i = 0; i < numParticles; i++) {
    const angle = seededRandom(seed + i * 3) * Math.PI * 2;
    const distance = Math.pow(seededRandom(seed + i * 3 + 1), 0.8) * 110 * (1.1 - clarity * 0.25);

    particles.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 2 + seededRandom(seed + i * 3 + 2) * 6,
      opacity: 0.3 + seededRandom(seed + i * 3 + 3) * 0.5,
      color: PALETTE[Math.floor(seededRandom(seed + i * 3 + 4) * PALETTE.length)],
    });
  }

  const numVectors = 3 + Math.floor(seededRandom(seed + 100) * 2);
  for (let i = 0; i < numVectors; i++) {
    const angle = (Math.PI * 2 * i) / numVectors + (seededRandom(seed + 100 + i) - 0.5) * 0.4;
    const length = 60 + seededRandom(seed + 100 + i + 10) * 50;
    vectors.push({
      angle,
      length,
      opacity: 0.3 + seededRandom(seed + 100 + i + 20) * 0.3,
      color: PALETTE[Math.floor(seededRandom(seed + 100 + i + 30) * PALETTE.length)],
    });
  }

  const tagPositions = [];
  for (let i = 0; i < numTags; i++) {
    const angle = (Math.PI * 2 * i) / numTags + (seededRandom(seed + 200 + i) - 0.5) * 0.3;
    const distance = 100 + seededRandom(seed + 200 + i + 10) * 40;
    tagPositions.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      blur: 0.3 + seededRandom(seed + 200 + i + 20) * 1.0,
    });
  }

  return { particles, vectors, tagPositions };
}
