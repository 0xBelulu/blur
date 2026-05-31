import { questions } from "../src/data/questions.js";

const dimExposure = {};
const dimOptionCount = {};

for (const q of questions) {
  if (q.type === "scale" && q.dimensions) {
    for (const [dk, dv] of Object.entries(q.dimensions)) {
      dimExposure[dk] = (dimExposure[dk] || 0) + Math.abs(dv);
      dimOptionCount[dk] = (dimOptionCount[dk] || 0) + 1;
    }
  } else if (q.options) {
    for (const opt of q.options) {
      if (opt.dimensions) {
        for (const [dk, dv] of Object.entries(opt.dimensions)) {
          dimExposure[dk] = (dimExposure[dk] || 0) + Math.abs(dv);
          dimOptionCount[dk] = (dimOptionCount[dk] || 0) + 1;
        }
      }
    }
  }
}

console.log("=== 题库维度暴露量分析 ===");
console.log("维度              总绝对权重  涉及选项数  平均权重");
const sorted = Object.entries(dimExposure).sort((a, b) => b[1] - a[1]);
for (const [dim, total] of sorted) {
  const count = dimOptionCount[dim];
  const avg = total / count;
  console.log(`${dim.padEnd(18)} ${total.toFixed(1).padStart(8)} ${String(count).padStart(8)} ${avg.toFixed(2)}`);
}

// Also analyze by archetype-like direction (positive vs negative)
console.log("\n=== 维度极性偏向分析 ===");
console.log("维度              正向总权重  负向总权重  净偏向");
const dimPolarity = {};
for (const q of questions) {
  if (q.type === "scale" && q.dimensions) {
    for (const [dk, dv] of Object.entries(q.dimensions)) {
      if (!dimPolarity[dk]) dimPolarity[dk] = { pos: 0, neg: 0 };
      if (dv > 0) dimPolarity[dk].pos += dv;
      else dimPolarity[dk].neg += Math.abs(dv);
    }
  } else if (q.options) {
    for (const opt of q.options) {
      if (opt.dimensions) {
        for (const [dk, dv] of Object.entries(opt.dimensions)) {
          if (!dimPolarity[dk]) dimPolarity[dk] = { pos: 0, neg: 0 };
          if (dv > 0) dimPolarity[dk].pos += dv;
          else dimPolarity[dk].neg += Math.abs(dv);
        }
      }
    }
  }
}

for (const [dim, { pos, neg }] of Object.entries(dimPolarity).sort((a, b) => (b[1].pos + b[1].neg) - (a[1].pos + a[1].neg))) {
  const net = pos - neg;
  console.log(`${dim.padEnd(18)} ${pos.toFixed(1).padStart(8)} ${neg.toFixed(1).padStart(8)} ${(net > 0 ? '+' : '').padStart(4)}${net.toFixed(1)}`);
}
