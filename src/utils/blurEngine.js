import { tagPool, archetypeDescriptions, DIMENSIONS } from "../data/questions";

const PALETTE = [
  [155, 142, 199],
  [143, 181, 196],
  [196, 165, 137],
  [196, 155, 165],
  [165, 184, 155],
  [184, 165, 196],
  [196, 184, 165],
  [165, 196, 184],
  [196, 175, 155],
  [175, 165, 196],
];

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateResult(answers) {
  const traitCounts = {};

  answers.forEach((answer) => {
    answer.traits.forEach((trait) => {
      traitCounts[trait] = (traitCounts[trait] || 0) + 1;
    });
  });

  const answerHash = answers.reduce((h, a) => h + a.optionId.charCodeAt(0), 0);

  const scoredTraits = Object.entries(traitCounts).map(([trait, count]) => {
    const tagInfo = tagPool[trait];
    const weight = tagInfo ? tagInfo.weight : 1;
    const noise = (seededRandom(trait.length + answerHash) - 0.5) * 0.2;
    return {
      trait,
      score: count * weight + noise,
      text: tagInfo ? tagInfo.text : trait,
      detail: tagInfo ? tagInfo.detail : "",
    };
  });

  scoredTraits.sort((a, b) => b.score - a.score);

  const numTags = 6;
  const selectedTags = scoredTraits.slice(0, numTags).map((t) => t.text);
  const selectedTagDetails = scoredTraits.slice(0, numTags).map((t) => ({
    trait: t.trait,
    text: t.text,
    detail: t.detail,
    score: t.score,
  }));

  const topTraits = scoredTraits.slice(0, 3).map((t) => t.trait);
  const { key: archetypeKey, archetype } = determineArchetype(topTraits);

  const clarity = 0.45 + seededRandom(answerHash + 7) * 0.15;
  const cloudData = generateCloudData(selectedTags.length, clarity, answerHash);

  const dimensionScores = computeDimensionScores(traitCounts);

  return {
    archetype,
    archetypeKey,
    tags: selectedTags,
    tagDetails: selectedTagDetails,
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
      maxTotal += weight;
      if (traitCounts[trait]) {
        total += traitCounts[trait] * weight;
      }
    });
    rawScores[dimKey] = {
      name: dim.name,
      raw: maxTotal > 0 ? total / maxTotal : 0,
    };
  });

  const rawValues = Object.values(rawScores).map((d) => d.raw);
  const maxRaw = Math.max(...rawValues, 0.01);

  const scores = {};
  Object.entries(rawScores).forEach(([dimKey, dim]) => {
    const normalized = dim.raw / maxRaw;
    const display = 0.3 + normalized * 0.7;
    scores[dimKey] = {
      name: dim.name,
      score: display,
    };
  });

  return scores;
}

function determineArchetype(traits) {
  const traitSet = new Set(traits);

  if (
    traitSet.has("philosophical") ||
    traitSet.has("abstract") ||
    traitSet.has("wonder") ||
    traitSet.has("mysterious")
  ) {
    return { key: "dreamer", archetype: archetypeDescriptions.dreamer };
  }

  if (
    traitSet.has("observant") ||
    traitSet.has("detached") ||
    traitSet.has("observer") ||
    traitSet.has("guarded")
  ) {
    return { key: "watcher", archetype: archetypeDescriptions.watcher };
  }

  if (
    traitSet.has("escapist") ||
    traitSet.has("wandering") ||
    traitSet.has("restless") ||
    traitSet.has("transient")
  ) {
    return { key: "wanderer", archetype: archetypeDescriptions.wanderer };
  }

  if (
    traitSet.has("introspective") ||
    traitSet.has("reflective") ||
    traitSet.has("lonely") ||
    traitSet.has("nostalgic")
  ) {
    return { key: "echo", archetype: archetypeDescriptions.echo };
  }

  if (
    traitSet.has("enigmatic") ||
    traitSet.has("empty") ||
    traitSet.has("obscure") ||
    traitSet.has("layered") ||
    traitSet.has("withdrawn") ||
    traitSet.has("suggestive")
  ) {
    return { key: "ghost", archetype: archetypeDescriptions.ghost };
  }

  const keys = Object.keys(archetypeDescriptions);
  const fallbackIndex = traits.reduce((h, t) => h + t.charCodeAt(0), 0) % keys.length;
  const fallbackKey = keys[fallbackIndex];
  return { key: fallbackKey, archetype: archetypeDescriptions[fallbackKey] };
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
