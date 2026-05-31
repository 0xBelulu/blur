import { questions } from "../src/data/questions.js";

const DIMENSION_KEYS = [
  "energySource", "sensorySensitivity", "emotionalLatency", "cognitiveRange",
  "boundaryClarity", "temporalDepth", "changeAffinity", "closureTolerance",
  "processingDepth", "expressivity",
];

// Find top contributors for each overexposed dimension
const dimContributors = {};

for (const q of questions) {
  const qLabel = `Q${q.id} (${q.type})`;
  if (q.type === "scale" && q.dimensions) {
    for (const [dk, dv] of Object.entries(q.dimensions)) {
      if (!dimContributors[dk]) dimContributors[dk] = [];
      dimContributors[dk].push({ label: qLabel, text: q.text.substring(0, 40), val: dv });
    }
  } else if (q.options) {
    for (const opt of q.options) {
      if (opt.dimensions) {
        for (const [dk, dv] of Object.entries(opt.dimensions)) {
          if (!dimContributors[dk]) dimContributors[dk] = [];
          dimContributors[dk].push({ label: `${qLabel} opt[${opt.id}]`, text: opt.text.substring(0, 40), val: dv });
        }
      }
    }
  }
}

// Sort by absolute value descending
for (const dim of DIMENSION_KEYS) {
  if (!dimContributors[dim]) continue;
  dimContributors[dim].sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
}

// Print top 10 contributors for overexposed dimensions
const overexposed = ["changeAffinity", "processingDepth", "expressivity", "energySource"];
for (const dim of overexposed) {
  console.log(`\n=== ${dim} 最大贡献者 (Top 15) ===`);
  const list = dimContributors[dim] || [];
  for (const item of list.slice(0, 15)) {
    const sign = item.val > 0 ? "+" : "";
    console.log(`  ${item.label.padEnd(18)} ${sign}${item.val.toFixed(1).padStart(5)}  "${item.text}"`);
  }
}

// Also find questions that have NO negative exposure for these dims
console.log("\n=== 没有负向 changeAffinity 暴露的题目 ===");
for (const q of questions) {
  let hasNeg = false;
  let hasPos = false;
  if (q.type === "scale" && q.dimensions?.changeAffinity !== undefined) {
    if (q.dimensions.changeAffinity < 0) hasNeg = true;
    if (q.dimensions.changeAffinity > 0) hasPos = true;
  } else if (q.options) {
    for (const opt of q.options) {
      if (opt.dimensions?.changeAffinity !== undefined) {
        if (opt.dimensions.changeAffinity < 0) hasNeg = true;
        if (opt.dimensions.changeAffinity > 0) hasPos = true;
      }
    }
  }
  if (hasPos && !hasNeg) {
    console.log(`  Q${q.id} (${q.type}): ${q.text.substring(0, 50)}`);
  }
}
