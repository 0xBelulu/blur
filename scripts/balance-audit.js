import { ARCHETYPE_PROFILES } from "../src/data/archetypeProfiles.js";
import { questions } from "../src/data/questions.js";

const DIMENSION_KEYS = [
  "energySource",
  "sensorySensitivity",
  "emotionalLatency",
  "cognitiveRange",
  "boundaryClarity",
  "temporalDepth",
  "changeAffinity",
  "closureTolerance",
  "processingDepth",
  "expressivity",
];

const OVER_REP_THRESHOLD = 0.20;
const UNDER_REP_THRESHOLD = 0.05;

/* ── Calibrated softmax matching (mirrors blurEngine) ──── */
const RANDOM_BASELINES = {
  rainbow: 0.5993,
  tide: 0.5010,
  negative: 0.4039,
  warmCurrent: 0.2885,
  mist: 0.2806,
  salt: 0.2754,
  kite: 0.2260,
  chime: 0.1807,
  silhouette: 0.1657,
  crystal: -0.2159,
};
const RANDOM_STDS = {
  silhouette: 0.1050,
  mist: 0.1041,
  chime: 0.1035,
  salt: 0.0908,
  tide: 0.0908,
  negative: 0.0839,
  crystal: 0.0797,
  warmCurrent: 0.0786,
  kite: 0.0764,
  rainbow: 0.0492,
};
const SOFTMAX_TEMPERATURE = 2.0;

function softmax(scores, temperature) {
  const expScores = {};
  let sum = 0;
  for (const key of Object.keys(scores)) {
    expScores[key] = Math.exp(scores[key] / temperature);
    sum += expScores[key];
  }
  const probs = {};
  for (const key of Object.keys(expScores)) {
    probs[key] = expScores[key] / sum;
  }
  return probs;
}

/* ── CLI args ────────────────────────────────────────────── */
const args = process.argv.slice(2);
let TRIALS = 5000;
let STRATEGY = "pureRandom";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--trials" || args[i] === "-t") {
    TRIALS = parseInt(args[i + 1], 10) || 5000;
    i++;
  }
  if (args[i] === "--strategy" || args[i] === "-s") {
    STRATEGY = args[i + 1] || "pureRandom";
    i++;
  }
}

/* ── Random answer generators ────────────────────────────── */
function randomSingle(q) {
  const opts = q.options;
  const idx = Math.floor(Math.random() * opts.length);
  return { questionId: q.id, type: "single", optionId: opts[idx].id };
}

function randomScale(q, strategy) {
  let val;
  if (strategy === "realistic") {
    const r = Math.random();
    if (r < 0.10) val = 1;
    else if (r < 0.35) val = 2;
    else if (r < 0.65) val = 3;
    else if (r < 0.90) val = 4;
    else val = 5;
  } else {
    val = Math.floor(Math.random() * 5) + 1;
  }
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

function generateAnswers(strategy) {
  return questions.map((q) => {
    if (q.type === "single") return randomSingle(q);
    if (q.type === "scale") return randomScale(q, strategy);
    if (q.type === "rank") return randomRank(q);
    return null;
  });
}

/* ── Dimension accumulation (mirrors blurEngine) ────────── */
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

/* ── Cosine similarity ─────────────────────────────────── */
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const key of DIMENSION_KEYS) {
    const av = a[key] || 0;
    const bv = b[key] || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < 0.0001) return 0;
  return dot / denom;
}

function determineArchetype(userVector, profiles) {
  const similarities = [];
  for (const [key, profile] of Object.entries(profiles)) {
    const sim = cosineSimilarity(userVector, profile.vector);
    similarities.push({ key, sim });
  }
  similarities.sort((a, b) => b.sim - a.sim);

  // Calibrated z-score + softmax (mirrors blurEngine)
  const calibrated = {};
  for (const { key, sim } of similarities) {
    const mu = RANDOM_BASELINES[key] || 0;
    const sigma = RANDOM_STDS[key] || 1;
    calibrated[key] = (sim - mu) / sigma;
  }
  const probs = softmax(calibrated, SOFTMAX_TEMPERATURE);

  return Object.entries(probs)
    .sort((a, b) => b[1] - a[1])
    .map(([key, prob]) => ({
      key,
      sim: similarities.find((s) => s.key === key).sim,
      prob,
    }));
}

/* ── Monte-Carlo simulation ─────────────────────────────── */
function runSimulation(trials, strategy, profiles) {
  const counts = {};
  const gaps = [];

  for (let i = 0; i < trials; i++) {
    const answers = generateAnswers(strategy);
    const raw = accumulateDimensions(answers);
    const vec = normalizeDimensions(raw);
    const sims = determineArchetype(vec, profiles);
    const best = sims[0];
    counts[best.key] = (counts[best.key] || 0) + 1;
    gaps.push(sims[0].prob - (sims[1]?.prob || 0));
  }

  return { counts, gaps };
}

/* ── Report helpers ────────────────────────────────────── */
function pad(str, len) {
  return String(str).padEnd(len);
}

function colored(text, color) {
  const codes = { red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m", gray: "\x1b[90m", reset: "\x1b[0m" };
  return `${codes[color] || ""}${text}${codes.reset}`;
}

function generateReport(trials, counts, gaps) {
  const keys = Object.keys(ARCHETYPE_PROFILES);
  const expected = trials / keys.length;

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  人格原型平衡性审计报告`);
  console.log(`  模拟次数: ${trials}  |  策略: ${STRATEGY}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  /* Frequency table */
  console.log(`  ${pad("原型", 10)} ${pad("次数", 8)} ${pad("占比", 8)} ${pad("与均匀偏差", 12)} 状态`);
  console.log(`  ${"─".repeat(55)}`);

  let chi2 = 0;
  const rows = [];

  for (const key of keys) {
    const c = counts[key] || 0;
    const p = c / trials;
    const diff = p - 1 / keys.length;
    chi2 += Math.pow(c - expected, 2) / expected;

    let status = "正常";
    let color = "green";
    if (p > OVER_REP_THRESHOLD) {
      status = "过度代表";
      color = "red";
    } else if (p < UNDER_REP_THRESHOLD) {
      status = "代表不足";
      color = "yellow";
    }

    rows.push({ key, c, p, diff, status, color });
  }

  rows.sort((a, b) => b.p - a.p);

  for (const r of rows) {
    const pct = `${(r.p * 100).toFixed(1)}%`;
    const diffPct = `${(r.diff * 100).toFixed(1)}%`;
    console.log(
      `  ${pad(r.key, 10)} ${pad(r.c, 8)} ${pad(pct, 8)} ${pad(diffPct, 12)}  ${colored(r.status, r.color)}`
    );
  }

  console.log(`\n  ────`);
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  console.log(`  卡方值 (χ²):        ${chi2.toFixed(2)}`);
  console.log(`  平均 1st-2nd 差距:   ${avgGap.toFixed(4)}`);
  console.log(`  ────`);

  return { rows, chi2, avgGap };
}

/* ── Constraint-score (root cause diagnosis) ───────────── */
function computeConstraintScores(profiles) {
  console.log(`\n  原型约束度排名（越低 = 越容易截获随机用户）`);
  console.log(`  ${pad("原型", 10)} ${pad("约束度", 10)} ${pad("向量模长", 10)} 说明`);
  console.log(`  ${"─".repeat(60)}`);

  const scores = [];
  for (const [key, profile] of Object.entries(profiles)) {
    const vec = profile.vector;
    const vals = DIMENSION_KEYS.map((k) => vec[k] || 0);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    const norm = Math.sqrt(vals.reduce((a, b) => a + b * b, 0));
    scores.push({ key, variance, norm });
  }

  scores.sort((a, b) => a.variance - b.variance);

  for (const s of scores) {
    const note = s.variance < 0.08 ? "极低约束 — 天然截获中心区域用户" : s.variance < 0.15 ? "偏低约束" : "";
    console.log(`  ${pad(s.key, 10)} ${pad(s.variance.toFixed(3), 10)} ${pad(s.norm.toFixed(2), 10)}  ${colored(note, s.variance < 0.08 ? "red" : "gray")}`);
  }

  return scores;
}

/* ── Auto-balancing suggestions ────────────────────────── */
function generateSuggestions(trials, counts, profiles) {
  const overRep = Object.entries(counts)
    .filter(([, c]) => c / trials > OVER_REP_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  if (overRep.length === 0) {
    console.log(`\n  ✅ 没有检测到过度代表的原型，当前分布相对平衡。`);
    return;
  }

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  自动平衡建议`);
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`  以下原型被判定为过度代表 (>20%)，对其向量做梯度扫描...\n`);

  const PERTURB = 0.15;
  const PERTURB_TRIALS = 2000;

  for (const key of overRep) {
    const baseProfile = profiles[key];
    const baseVector = baseProfile.vector;
    const baseRate = counts[key] / trials;

    console.log(`  ▶ ${key} (当前占比 ${(baseRate * 100).toFixed(1)}%)`);

    const suggestions = [];

    for (const dim of DIMENSION_KEYS) {
      const original = baseVector[dim];
      if (original === 0) continue;

      // Direction 1: increase magnitude (move away from 0)
      const v1 = { ...baseVector, [dim]: original + Math.sign(original) * PERTURB };
      const p1 = { ...baseProfile, vector: v1 };
      const profiles1 = { ...profiles, [key]: p1 };
      const res1 = runSimulation(PERTURB_TRIALS, STRATEGY, profiles1);
      const rate1 = res1.counts[key] / PERTURB_TRIALS;

      // Direction 2: decrease magnitude (move toward 0)
      const v2 = { ...baseVector, [dim]: original - Math.sign(original) * PERTURB };
      const p2 = { ...baseProfile, vector: v2 };
      const profiles2 = { ...profiles, [key]: p2 };
      const res2 = runSimulation(PERTURB_TRIALS, STRATEGY, profiles2);
      const rate2 = res2.counts[key] / PERTURB_TRIALS;

      const delta1 = rate1 - baseRate;
      const delta2 = rate2 - baseRate;

      // We want changes that *reduce* frequency
      if (delta1 < 0 && delta1 < delta2) {
        suggestions.push({
          dim,
          direction: "增加绝对值",
          delta: delta1,
          from: original,
          to: v1[dim],
        });
      } else if (delta2 < 0 && delta2 < delta1) {
        suggestions.push({
          dim,
          direction: "减小绝对值",
          delta: delta2,
          from: original,
          to: v2[dim],
        });
      }
    }

    // Sort by most negative delta (best reduction)
    suggestions.sort((a, b) => a.delta - b.delta);

    if (suggestions.length === 0) {
      console.log(`    未找到能显著降低其出现率的单维度调整方向。`);
      continue;
    }

    const top = suggestions.slice(0, 3);
    for (const s of top) {
      const pctChange = (s.delta * 100).toFixed(1);
      console.log(
        `    · ${s.dim}: ${s.from.toFixed(2)} → ${s.to.toFixed(2)} (${s.direction}) 预估变化: ${pctChange}%`
      );
    }
  }
}

/* ── Main ──────────────────────────────────────────────── */
console.log(`\n  正在运行蒙特卡洛模拟 (${TRIALS} 次, 策略: ${STRATEGY}) ...`);
const start = Date.now();
const { counts, gaps } = runSimulation(TRIALS, STRATEGY, ARCHETYPE_PROFILES);
const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`  模拟完成，耗时 ${elapsed}s`);

generateReport(TRIALS, counts, gaps);
computeConstraintScores(ARCHETYPE_PROFILES);
generateSuggestions(TRIALS, counts, ARCHETYPE_PROFILES);

console.log(`\n═══════════════════════════════════════════════════════════`);
console.log(`  审计完成`);
console.log(`═══════════════════════════════════════════════════════════\n`);
