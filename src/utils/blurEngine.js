import { tagPool, archetypeDescriptions } from "../data/questions";

export function generateResult(answers) {
  // Collect all traits from selected options
  const traitCounts = {};

  answers.forEach((answer) => {
    answer.traits.forEach((trait) => {
      traitCounts[trait] = (traitCounts[trait] || 0) + 1;
    });
  });

  // Pick top traits with some randomness and weight adjustment
  const scoredTraits = Object.entries(traitCounts).map(([trait, count]) => {
    const tagInfo = tagPool[trait];
    const weight = tagInfo ? tagInfo.weight : 1;
    // Add some noise for "blur" effect
    const noise = (Math.random() - 0.5) * 0.5;
    return {
      trait,
      score: count * weight + noise,
      text: tagInfo ? tagInfo.text : trait,
    };
  });

  scoredTraits.sort((a, b) => b.score - a.score);

  // Select 4-6 tags with slight randomness
  const numTags = 4 + Math.floor(Math.random() * 3);
  const selectedTags = scoredTraits.slice(0, numTags).map((t) => t.text);

  // Determine archetype based on top traits
  const topTraits = scoredTraits.slice(0, 3).map((t) => t.trait);
  const archetype = determineArchetype(topTraits);

  // Generate cloud data (fixed clarity for visual consistency)
  const clarity = 0.4 + Math.random() * 0.3;
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

  // Default
  const archetypes = Object.values(archetypeDescriptions);
  return archetypes[Math.floor(Math.random() * archetypes.length)];
}

function generateCloudData(numTags, clarity) {
  const particles = [];
  const vectors = [];
  const numParticles = 80 + Math.floor(Math.random() * 40);

  // Generate center cluster
  for (let i = 0; i < numParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 120 * (1.2 - clarity * 0.4);
    const spread = 30 + Math.random() * 50;

    particles.push({
      x: Math.cos(angle) * distance + (Math.random() - 0.5) * spread,
      y: Math.sin(angle) * distance + (Math.random() - 0.5) * spread,
      size: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.5,
      color: getRandomColor(),
    });
  }

  // Generate vectors (arrows/lines representing dimensions)
  const numVectors = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numVectors; i++) {
    const angle = (Math.PI * 2 * i) / numVectors + (Math.random() - 0.5) * 0.5;
    const length = 60 + Math.random() * 80;
    vectors.push({
      angle,
      length,
      opacity: 0.4 + Math.random() * 0.3,
      color: getRandomColor(),
    });
  }

  // Tag positions around the cloud
  const tagPositions = [];
  for (let i = 0; i < numTags; i++) {
    const angle = (Math.PI * 2 * i) / numTags + (Math.random() - 0.5) * 0.3;
    const distance = 100 + Math.random() * 60;
    tagPositions.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      blur: 0.5 + Math.random() * 1.5,
    });
  }

  return { particles, vectors, tagPositions };
}

function getRandomColor() {
  const colors = [
    "#9b8ec7", // lavender
    "#8fb5c4", // cool blue
    "#c4a589", // warm sand
    "#c49ba5", // muted rose
    "#a5b89b", // sage
    "#b8a5c4", // soft purple
    "#c4b8a5", // warm gray
    "#a5c4b8", // mint
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
