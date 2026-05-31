const fs = require('fs');
const path = require('path');

const TRAIT_DIMENSION_MAP = {
  shielded: { boundaryClarity: 1.0, expressivity: -0.6 },
  softedge: { boundaryClarity: -0.8, expressivity: -0.3 },
  filtered: { sensorySensitivity: -0.8, boundaryClarity: 0.4 },
  vague: { closureTolerance: 1.0, cognitiveRange: 0.4 },
  misty: { expressivity: -0.9, boundaryClarity: 0.5 },
  guarded: { expressivity: -0.9, energySource: -0.4 },
  faded: { temporalDepth: 0.8, expressivity: -0.4 },
  saturated: { sensorySensitivity: 1.0, energySource: -0.3 },
  acute: { sensorySensitivity: 1.0, expressivity: 0.4 },
  reverberant: { processingDepth: 0.8, emotionalLatency: 0.6 },
  overwhelming: { sensorySensitivity: 0.9, expressivity: 0.3 },
  thunder: { expressivity: 0.8, sensorySensitivity: 0.6 },
  loud: { expressivity: 1.0 },
  adrift: { changeAffinity: 1.0, energySource: -0.7 },
  fleeing: { changeAffinity: 0.9, boundaryClarity: -0.4 },
  unmoored: { changeAffinity: 0.8, boundaryClarity: -0.6 },
  shifting: { changeAffinity: 1.0, boundaryClarity: -0.3 },
  tidal: { changeAffinity: 0.6, temporalDepth: -0.5, emotionalLatency: 0.4 },
  fluid: { changeAffinity: 0.8, boundaryClarity: -0.4 },
  patient: { temporalDepth: 0.9, processingDepth: 0.5 },
  sunken: { processingDepth: 0.9, emotionalLatency: 0.5 },
  abyssal: { processingDepth: 1.0, temporalDepth: 0.4 },
  sedimentary: { temporalDepth: 0.9, processingDepth: 0.6 },
  stilled: { energySource: -0.9, expressivity: -0.7 },
  deepwatch: { processingDepth: 0.9, expressivity: -0.5 },
  manifold: { cognitiveRange: 1.0 },
  equivocal: { closureTolerance: 0.9, cognitiveRange: 0.5 },
  prismatic: { cognitiveRange: 1.0, sensorySensitivity: 0.4 },
  refracted: { cognitiveRange: 0.7, changeAffinity: 0.3 },
  suspended: { emotionalLatency: 0.6, closureTolerance: 0.8 },
  dissolving: { boundaryClarity: -1.0 },
  permeable: { boundaryClarity: -0.8, sensorySensitivity: 0.5 },
  osmotic: { boundaryClarity: -0.9, sensorySensitivity: 0.3 },
  blended: { boundaryClarity: -0.9, cognitiveRange: 0.3 },
  absorbing: { sensorySensitivity: 0.9, boundaryClarity: -0.6 },
  seeping: { boundaryClarity: -0.7, changeAffinity: 0.4 },
  latent: { emotionalLatency: 0.9, expressivity: -0.3 },
  delayed: { emotionalLatency: 1.0 },
  inverse: { cognitiveRange: 0.6, expressivity: -0.5 },
  undeveloped: { emotionalLatency: 0.7, expressivity: -0.6 },
  darkroom: { energySource: -0.9, processingDepth: 0.7 },
  belated: { emotionalLatency: 0.8 },
  oscillating: { changeAffinity: 0.7, emotionalLatency: 0.4 },
  rhythmic: { changeAffinity: 0.8, temporalDepth: -0.3 },
  ebbing: { changeAffinity: 0.5, energySource: -0.7 },
  swelling: { changeAffinity: 0.6, expressivity: 0.7 },
  cyclical: { changeAffinity: 0.8, temporalDepth: -0.4 },
  pulsing: { changeAffinity: 0.5, sensorySensitivity: 0.6 },
  outlined: { boundaryClarity: 1.0, expressivity: -0.5 },
  backlit: { expressivity: -0.8, cognitiveRange: 0.3 },
  partial: { expressivity: -0.7, boundaryClarity: 0.6 },
  angled: { cognitiveRange: 0.7, expressivity: -0.5 },
  shadowed: { expressivity: -0.9 },
  edgeonly: { boundaryClarity: 0.9, expressivity: -0.6 },
};

function convertTraitsToDimensions(traits) {
  const dims = {};
  for (const trait of traits) {
    const map = TRAIT_DIMENSION_MAP[trait];
    if (!map) continue;
    for (const [key, val] of Object.entries(map)) {
      dims[key] = (dims[key] || 0) + val;
    }
  }
  return dims;
}

function dimsToString(dims) {
  const entries = Object.entries(dims)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `      ${k}: ${Math.round(v * 100) / 100},`)
    .join('\n');
  return `{\n${entries}\n    }`;
}

function replaceTraitsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. 替换 options / traits（包括 single 和 rank）
  const optionRegex = /traits:\s*\[([^\]]*)\]/g;
  content = content.replace(optionRegex, (match, inner) => {
    try {
      const traits = JSON.parse(`[${inner.replace(/'/g, '"')}]`);
      if (!Array.isArray(traits)) return match;
      const dims = convertTraitsToDimensions(traits);
      if (Object.keys(dims).length === 0) return match;
      changed = true;
      return `dimensions: ${dimsToString(dims)}`;
    } catch {
      return match;
    }
  });

  // 2. 替换 scale 题的顶级 traits
  // 匹配多行：
  //   traits: [
  //     "xxx", "yyy"
  //   ],
  const scaleRegex = /traits:\s*\[\s*([^\]]*?)\s*\],?/gs;
  content = content.replace(scaleRegex, (match, inner) => {
    try {
      const traits = JSON.parse(`[${inner.replace(/'/g, '"')}]`);
      if (!Array.isArray(traits)) return match;
      const dims = convertTraitsToDimensions(traits);
      if (Object.keys(dims).length === 0) return match;
      changed = true;
      return `dimensions: ${dimsToString(dims)},`;
    } catch {
      return match;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Converted:', filePath);
  } else {
    console.log('No changes:', filePath);
  }
}

const files = [
  path.resolve(__dirname, '../src/data/questions-single.js'),
  path.resolve(__dirname, '../src/data/questions-scale.js'),
  path.resolve(__dirname, '../src/data/questions-rank.js'),
];

for (const f of files) {
  replaceTraitsInFile(f);
}

console.log('Done.');
