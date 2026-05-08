import { tagPool, archetypeDescriptions } from "../data/questions";

const PALETTE = [
  [155, 142, 199], // lavender
  [143, 181, 196], // cool blue
  [196, 165, 137], // warm sand
  [196, 155, 165], // muted rose
  [165, 184, 155], // sage
  [184, 165, 196], // soft purple
  [196, 184, 165], // warm gray
  [165, 196, 184], // mint
  [196, 175, 155], // peachy
  [175, 165, 196], // dusty blue
];

function getRandomColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export function generateResult(answers) {
  const traitCounts = {};

  answers.forEach((answer) => {
    answer.traits.forEach((trait) => {
      traitCounts[trait] = (traitCounts[trait] || 0) + 1;
    });
  });

  const scoredTraits = Object.entries(traitCounts).map(([trait, count]) => {
    const tagInfo = tagPool[trait];
    const weight = tagInfo ? tagInfo.weight : 1;
    const noise = (Math.random() - 0.5) * 0.5;
    return {
      trait,
      score: count * weight + noise,
      text: tagInfo ? tagInfo.text : trait,
    };
  });

  scoredTraits.sort((a, b) => b.score - a.score);

  const numTags = 5 + Math.floor(Math.random() * 3);
  const selectedTags = scoredTraits.slice(0, numTags).map((t) => t.text);

  const topTraits = scoredTraits.slice(0, 3).map((t) => t.trait);
  const archetype = determineArchetype(topTraits);

  const clarity = 0.35 + Math.random() * 0.3;
  const cloudData = generateCloudData(selectedTags.length, clarity);

  return {
    archetype,
    tags: selectedTags,
    clarity,
    cloudData,
  };
}

function determineArchetype(traits) {
  const traitSet = new Set(traits);

  if (
    traitSet.has("philosophical") ||
    traitSet.has("abstract") ||
    traitSet.has("wonder") ||
    traitSet.has("mysterious")
  ) {
    return archetypeDescriptions.dreamer;
  }

  if (
    traitSet.has("observant") ||
    traitSet.has("detached") ||
    traitSet.has("observer") ||
    traitSet.has("guarded")
  ) {
    return archetypeDescriptions.watcher;
  }

  if (
    traitSet.has("escapist") ||
    traitSet.has("wandering") ||
    traitSet.has("restless") ||
    traitSet.has("transient")
  ) {
    return archetypeDescriptions.wanderer;
  }

  if (
    traitSet.has("introspective") ||
    traitSet.has("reflective") ||
    traitSet.has("lonely") ||
    traitSet.has("nostalgic")
  ) {
    return archetypeDescriptions.echo;
  }

  const archetypes = Object.values(archetypeDescriptions);
  return archetypes[Math.floor(Math.random() * archetypes.length)];
}

function generateCloudData(numTags, clarity) {
  const particles = [];
  const vectors = [];

  // Fewer, larger particles for cleaner look
  const numParticles = 40 + Math.floor(Math.random() * 25);

  for (let i = 0; i < numParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.pow(Math.random(), 0.8) * 110 * (1.1 - clarity * 0.25);

    particles.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 2 + Math.random() * 6,
      opacity: 0.3 + Math.random() * 0.5,
      color: getRandomColor(),
    });
  }

  // Fewer vectors, more decorative
  const numVectors = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numVectors; i++) {
    const angle = (Math.PI * 2 * i) / numVectors + (Math.random() - 0.5) * 0.4;
    const length = 60 + Math.random() * 50;
    vectors.push({
      angle,
      length,
      opacity: 0.3 + Math.random() * 0.3,
      color: getRandomColor(),
    });
  }

  // Tag positions
  const tagPositions = [];
  for (let i = 0; i < numTags; i++) {
    const angle = (Math.PI * 2 * i) / numTags + (Math.random() - 0.5) * 0.3;
    const distance = 100 + Math.random() * 40;
    tagPositions.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      blur: 0.3 + Math.random() * 1.0,
    });
  }

  return { particles, vectors, tagPositions };
}
