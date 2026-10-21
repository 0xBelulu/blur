#!/usr/bin/env node

/**
 * 重算星图的二维投影基底，并（可选）写回 shared/projection.js。
 *
 *   node scripts/compute-projection.js            # 只打印诊断，不改文件
 *   node scripts/compute-projection.js --apply    # 写入 <generated> 区块
 *
 * 采样是确定性的（固定种子的 mulberry32），同样的代码重跑得到同样的系数，
 * 否则每次重算都会让整张图轻微挪动，历史位置就失去意义了。
 *
 * 投影只保留约 64% 的方差：PC1 ≈ 向内/向外，PC2 ≈ 安定/流动。
 * 所以界面必须把位置说成近似——这一点写在 shared/projection.js 的注释里。
 */

import { readFileSync, writeFileSync } from "node:fs";
import { questions } from "../src/data/questions.js";
import { generateResult } from "../src/utils/blurEngine.js";
import { DIMENSION_KEYS } from "../shared/dimensions.js";

const TRIALS = 20000;
const SEED = 20261021;
const TARGET = new URL("../shared/projection.js", import.meta.url);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(SEED);
const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** 随机作答，形状与 Test.jsx 存下来的 answers 一致。 */
function randomAnswers() {
  return questions.map((question) => {
    if (question.type === "scale") {
      return { questionId: question.id, type: "scale", value: 1 + Math.floor(random() * 5) };
    }
    if (question.type === "rank") {
      return { questionId: question.id, type: "rank", rankOrder: shuffle(question.options.map((o) => o.id)) };
    }
    return {
      questionId: question.id,
      type: "single",
      optionId: question.options[Math.floor(random() * question.options.length)].id,
    };
  });
}

const vectors = [];
for (let i = 0; i < TRIALS; i += 1) {
  const { userVector } = generateResult(randomAnswers(), questions);
  vectors.push(DIMENSION_KEYS.map((key) => userVector[key]));
}

const mean = DIMENSION_KEYS.map((_, d) => vectors.reduce((sum, v) => sum + v[d], 0) / vectors.length);
const covariance = Array.from({ length: DIMENSION_KEYS.length }, () => new Array(DIMENSION_KEYS.length).fill(0));
for (const vector of vectors) {
  for (let a = 0; a < DIMENSION_KEYS.length; a += 1) {
    for (let b = 0; b < DIMENSION_KEYS.length; b += 1) {
      covariance[a][b] += (vector[a] - mean[a]) * (vector[b] - mean[b]);
    }
  }
}
for (let a = 0; a < DIMENSION_KEYS.length; a += 1) {
  for (let b = 0; b < DIMENSION_KEYS.length; b += 1) covariance[a][b] /= vectors.length;
}

/** 幂迭代 + 收缩：10 维小矩阵，够用且没有依赖。 */
function principalComponent(matrix) {
  let vector = DIMENSION_KEYS.map((_, i) => Math.sin(i + 1) + 0.5);
  let eigenvalue = 0;
  for (let iteration = 0; iteration < 1500; iteration += 1) {
    const next = matrix.map((row) => row.reduce((sum, x, j) => sum + x * vector[j], 0));
    eigenvalue = Math.hypot(...next);
    vector = next.map((x) => x / eigenvalue);
  }
  return { vector, eigenvalue };
}

const totalVariance = covariance.reduce((sum, row, i) => sum + row[i], 0);
let residual = covariance.map((row) => [...row]);
const components = [];
for (let c = 0; c < 2; c += 1) {
  const { vector, eigenvalue } = principalComponent(residual);
  components.push({ vector, share: eigenvalue / totalVariance });
  residual = residual.map((row, i) => row.map((x, j) => x - eigenvalue * vector[i] * vector[j]));
}

// 特征向量的正负号没有意义，取向由人约定。这里固定成：
//   x 正 = 表达 / 外放；y 正 = 流动 / 开放。
const orient = (vector, key) => {
  const index = DIMENSION_KEYS.indexOf(key);
  return vector[index] < 0 ? vector.map((x) => -x) : vector;
};
const axes = {
  x: orient(components[0].vector, "expressivity"),
  y: orient(components[1].vector, "changeAffinity"),
};

const project = (vector) => [
  axes.x.reduce((sum, w, i) => sum + w * (vector[i] - mean[i]), 0),
  axes.y.reduce((sum, w, i) => sum + w * (vector[i] - mean[i]), 0),
];

// 0.5% / 99.5% 分位：让极少数的极端值被夹住，而不是把整张图压扁。
const quantile = (list, q) => {
  const sorted = [...list].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))];
};
const projected = vectors.map(project);
const spanOf = (index) => Math.max(
  Math.abs(quantile(projected.map((p) => p[index]), 0.005)),
  Math.abs(quantile(projected.map((p) => p[index]), 0.995)),
);
const span = Math.ceil(Math.max(spanOf(0), spanOf(1)) * 100) / 100;

const round = (value) => Number(value.toFixed(3));
const meanLine = mean.map(round).join(", ");
const xLine = axes.x.map(round).join(", ");
const yLine = axes.y.map(round).join(", ");

const block = [
  "// <generated>",
  `export const PROJECTION_MEAN = [${meanLine}];`,
  "export const PROJECTION_AXES = {",
  `  x: [${xLine}],`,
  `  y: [${yLine}],`,
  "};",
  "/** 两个轴共用的缩放：同一个系数，平面上的距离比例才不会被拉歪。 */",
  `export const PROJECTION_SPAN = ${span};`,
  "// </generated>",
].join("\n");

console.log(`采样 ${TRIALS} 份随机作答（种子 ${SEED}）`);
components.forEach((component, index) => {
  const top = component.vector
    .map((value, i) => [DIMENSION_KEYS[i], value])
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 4)
    .map(([key, value]) => `${key} ${value >= 0 ? "+" : ""}${value.toFixed(2)}`)
    .join("  ");
  console.log(`PC${index + 1} 方差占比 ${(component.share * 100).toFixed(1)}%  ${top}`);
});
console.log(`二维累计 ${((components[0].share + components[1].share) * 100).toFixed(1)}%`);
console.log(`缩放 PROJECTION_SPAN = ${span}（x 轴 ${spanOf(0).toFixed(2)} / y 轴 ${spanOf(1).toFixed(2)}）`);

const inside = projected.filter(([x, y]) => Math.abs(x) <= span && Math.abs(y) <= span).length;
console.log(`落在图内的样本 ${((inside / projected.length) * 100).toFixed(1)}%（其余被夹到边缘）`);

if (!process.argv.includes("--apply")) {
  console.log("\n未写入。加 --apply 写回 shared/projection.js。");
} else {
  const source = readFileSync(TARGET, "utf8");
  const next = source.replace(/\/\/ <generated>[\s\S]*?\/\/ <\/generated>/, block);
  if (next === source) throw new Error("没有找到 <generated> 区块，未写入");
  writeFileSync(TARGET, next);
  console.log("\n已写入 shared/projection.js");
}
