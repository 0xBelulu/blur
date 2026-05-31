/**
 * Monte Carlo 校准工具
 *
 * 用途：当修改题库后，重新计算每个原型的余弦相似度基线 μ 和标准差 σ。
 * 输出格式可直接粘贴到 src/utils/blurEngine.js 的 RANDOM_BASELINES / RANDOM_STDS。
 *
 * 用法：node scripts/compute-baselines.js [--trials 20000] [--apply]
 *   --apply: 自动更新 blurEngine.js 中的常量
 */

import { ARCHETYPE_PROFILES } from "../src/data/archetypeProfiles.js";
import { questions } from "../src/data/questions.js";
import fs from "fs";
import path from "path";

const DIMENSION_KEYS = [
  "energySource", "sensorySensitivity", "emotionalLatency",
  "cognitiveRange", "boundaryClarity", "temporalDepth",
  "changeAffinity", "closureTolerance", "processingDepth", "expressivity",
];

const args = process.argv.slice(2);
let TRIALS = 20000;
let APPLY = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--trials") { TRIALS = parseInt(args[i + 1], 10) || 20000; i++; }
  if (args[i] === "--apply") APPLY = true;
}

const archetypeKeys = Object.keys(ARCHETYPE_PROFILES);

function randomSingle(q) {
  const opts = q.options;
  const idx = Math.floor(Math.random() * opts.length);
  return { questionId: q.id, type: "single", optionId: opts[idx].id };
}

function randomScale(q) {
  const val = Math.floor(Math.random() * 5) + 1;
  return { questionId: q.id, type: "scale", value: val };
}

function randomRank(q) {
  const arr = [0, 1, 2, 3];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { questionId: q.id, type: "rank", rankOrder: arr };
}

function accumulateDimensions(answers) {
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

function normalizeDimensions(dims) {
  const absValues = Object.values(dims).map((v) => Math.abs(v));
  const max = Math.max(...absValues, 0.01);
  const normalized = {};
  for (const key of DIMENSION_KEYS) {
    normalized[key] = Math.max(-1, Math.min(1, (dims[key] || 0) / max));
  }
  return normalized;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (const key of DIMENSION_KEYS) {
    const av = a[key] || 0, bv = b[key] || 0;
    dot += av * bv; normA += av * av; normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom < 0.0001 ? 0 : dot / denom;
}

/* ── Monte Carlo ────────────────────────────────────────── */
const rawSims = {};
for (const k of archetypeKeys) rawSims[k] = new Array(TRIALS);

const progressInterval = Math.max(1, Math.floor(TRIALS / 20));
for (let t = 0; t < TRIALS; t++) {
  const answers = questions.map((q) => {
    if (q.type === "single") return randomSingle(q);
    if (q.type === "scale") return randomScale(q);
    if (q.type === "rank") return randomRank(q);
    return null;
  });
  const raw = accumulateDimensions(answers);
  const vec = normalizeDimensions(raw);
  for (const k of archetypeKeys) {
    rawSims[k][t] = cosineSimilarity(vec, ARCHETYPE_PROFILES[k].vector);
  }
  if ((t + 1) % progressInterval === 0) process.stdout.write(".");
}
console.log(" done");

/* ── Compute μ and σ ────────────────────────────────────── */
const baselines = {}, perArchStd = {};
for (const k of archetypeKeys) {
  const sum = rawSims[k].reduce((a, b) => a + b, 0);
  baselines[k] = sum / TRIALS;
  let sumSq = 0;
  for (const v of rawSims[k]) sumSq += (v - baselines[k]) ** 2;
  perArchStd[k] = Math.sqrt(sumSq / TRIALS);
}

/* ── Report ─────────────────────────────────────────────── */
console.log("\n── Calibration ──────────────────────────────────");
const sortedKeys = [...archetypeKeys].sort((a, b) => baselines[b] - baselines[a]);
for (const k of sortedKeys) {
  console.log(`  ${k.padEnd(12)} μ = ${baselines[k].toFixed(4)}  σ = ${perArchStd[k].toFixed(4)}`);
}

/* ── Apply to blurEngine.js ────────────────────────────── */
if (APPLY) {
  const enginePath = path.resolve("src/utils/blurEngine.js");
  let code = fs.readFileSync(enginePath, "utf-8");

  const baselineLines = sortedKeys.map(k => `  ${k}: ${baselines[k].toFixed(4)},`).join("\n");
  const reBaselines = /const RANDOM_BASELINES = \{[\s\S]*?\};/;
  code = code.replace(reBaselines, `const RANDOM_BASELINES = {\n${baselineLines}\n};`);

  const stdKeys = [...archetypeKeys].sort((a, b) => perArchStd[b] - perArchStd[a]);
  const stdLines = stdKeys.map(k => `  ${k}: ${perArchStd[k].toFixed(4)},`).join("\n");
  const reStds = /const RANDOM_STDS = \{[\s\S]*?\};/;
  code = code.replace(reStds, `const RANDOM_STDS = {\n${stdLines}\n};`);

  fs.writeFileSync(enginePath, code, "utf-8");
  console.log("\n  ✅ Applied to src/utils/blurEngine.js");
} else {
  console.log("\n  Run with --apply to auto-update blurEngine.js");
  console.log("  Or copy-paste the following:\n");

  console.log("const RANDOM_BASELINES = {");
  for (const k of sortedKeys) console.log(`  ${k}: ${baselines[k].toFixed(4)},`);
  console.log("};\n");

  const stdKeys = [...archetypeKeys].sort((a, b) => perArchStd[b] - perArchStd[a]);
  console.log("const RANDOM_STDS = {");
  for (const k of stdKeys) console.log(`  ${k}: ${perArchStd[k].toFixed(4)},`);
  console.log("};");
}

/* ── Quick verification ──────────────────────────────────── */
function softmax(scores, temperature) {
  const expVals = scores.map((s) => Math.exp(s / temperature));
  const sum = expVals.reduce((a, b) => a + b, 0);
  return expVals.map((e) => e / sum);
}

const wins = {};
for (const k of archetypeKeys) wins[k] = 0;
const T = 2.0;
for (let t = 0; t < Math.min(TRIALS, 5000); t++) {
  const zScores = archetypeKeys.map((k) => (rawSims[k][t] - baselines[k]) / perArchStd[k]);
  const probs = softmax(zScores, T);
  const maxIdx = probs.indexOf(Math.max(...probs));
  wins[archetypeKeys[maxIdx]]++;
}

console.log("\n── Quick win-rate check (T=2.0, 5000 trials) ─────");
for (const k of archetypeKeys) {
  const pct = ((wins[k] || 0) / Math.min(TRIALS, 5000) * 100).toFixed(1);
  console.log(`  ${k.padEnd(12)} ${pct}%`);
}
