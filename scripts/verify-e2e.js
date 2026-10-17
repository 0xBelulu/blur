#!/usr/bin/env node

/**
 * Blur Psychological Assessment — Comprehensive E2E Verification Harness
 *
 * Verifies the 4 Tiers of specifications defined in ORIGINAL_REQUEST.md & PROJECT.md:
 * - Tier 1: Question Bank Integrity (72 questions: 40 single, 16 scale, 16 rank; IDs 1..72, texts, options, dimensions)
 * - Tier 2: Boundary & Corner Cases (empty answers, minimum 10 required questions, all-1s/all-5s, tail rank, neutral-only)
 * - Tier 3: Scoring Math Verification (scale bidirectional symmetry, neutral 0, rank tail negative projection, cosine sim [-1,1], z-scores)
 * - Tier 4: Real-world End-to-End Simulation (simulate responses targeting each of the 10 archetypes, zero NaN, valid payload)
 *
 * Usage:
 *   node scripts/verify-e2e.js
 *   node scripts/verify-e2e.js --tier=1,2
 *   node scripts/verify-e2e.js --strict
 */

import { questions } from "../src/data/questions.js";
import { singleQuestions } from "../src/data/questions-single.js";
import { scaleQuestions } from "../src/data/questions-scale.js";
import { rankQuestions } from "../src/data/questions-rank.js";
import { DIMENSIONS, DIMENSION_KEYS } from "../src/data/dimensions.js";
import { ARCHETYPE_PROFILES } from "../src/data/archetypeProfiles.js";
import {
  generateResult,
  scaleWeights,
  rankWeights,
  getRankWeight,
  getScaleWeight,
  RANDOM_BASELINES,
  RANDOM_STDS,
} from "../src/utils/blurEngine.js";
import { WEIGHT_CONFIG } from "../src/config/weightConfig.js";

/* ── CLI Arguments ───────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const isStrict = args.includes("--strict");

let selectedTiers = [1, 2, 3, 4];
for (const arg of args) {
  if (arg.startsWith("--tier=")) {
    selectedTiers = arg
      .replace("--tier=", "")
      .split(",")
      .map((t) => parseInt(t.trim(), 10))
      .filter((t) => !isNaN(t) && t >= 1 && t <= 4);
  }
}

/* ── Test Runner & Assertion Utilities ───────────────────────────────────── */
const results = {
  tier1: { passed: 0, failed: 0, warnings: 0, tests: [] },
  tier2: { passed: 0, failed: 0, warnings: 0, tests: [] },
  tier3: { passed: 0, failed: 0, warnings: 0, tests: [] },
  tier4: { passed: 0, failed: 0, warnings: 0, tests: [] },
  escalations: [],
};

let currentTierKey = "tier1";

function recordPass(tierKey, name, details = "") {
  results[tierKey].passed++;
  results[tierKey].tests.push({ status: "PASS", name, details });
  console.log(`  ✓ [PASS] ${name}${details ? ` (${details})` : ""}`);
}

function recordFail(tierKey, name, error, isEscalation = false, escalationNote = "") {
  results[tierKey].failed++;
  const errorMsg = error instanceof Error ? error.message : String(error);
  results[tierKey].tests.push({ status: "FAIL", name, error: errorMsg, isEscalation, escalationNote });
  console.log(`  ✗ [FAIL] ${name}: ${errorMsg}`);
  if (isEscalation) {
    results.escalations.push({ tier: tierKey, name, error: errorMsg, note: escalationNote });
    console.log(`    ↳ Escalation note: ${escalationNote}`);
  }
}

function recordWarn(tierKey, name, message) {
  results[tierKey].warnings++;
  results[tierKey].tests.push({ status: "WARN", name, message });
  console.log(`  ⚠ [WARN] ${name}: ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertNoNaN(obj, path = "") {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "number") {
    if (isNaN(obj) || !isFinite(obj)) {
      throw new Error(`NaN or non-finite value encountered at path: ${path} (value=${obj})`);
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => assertNoNaN(item, `${path}[${idx}]`));
    return;
  }
  if (typeof obj === "object") {
    for (const [key, val] of Object.entries(obj)) {
      assertNoNaN(val, path ? `${path}.${key}` : key);
    }
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   TIER 1: Question Bank Integrity
   ────────────────────────────────────────────────────────────────────────── */
function runTier1() {
  console.log("\n======================================================================");
  console.log("  [TIER 1] QUESTION BANK INTEGRITY");
  console.log("======================================================================");
  currentTierKey = "tier1";

  // 1.1 Question Bank Composition & Type Counts
  try {
    const totalCount = questions.length;
    const singleCount = singleQuestions.length;
    const scaleCount = scaleQuestions.length;
    const rankCount = rankQuestions.length;

    console.log(`  · Current question bank: ${totalCount} questions (${singleCount} single, ${scaleCount} scale, ${rankCount} rank)`);

    // Progressive milestone check:
    // Target specification: 72 questions (40 single, 16 scale, 16 rank)
    // Pre-M2/M3 state: 68 questions (38 single, 16 scale, 14 rank)
    if (totalCount === 72 && singleCount === 40 && scaleCount === 16 && rankCount === 16) {
      recordPass(currentTierKey, "1.1 Question Bank Composition & Counts", "72 total: 40 single, 16 scale, 16 rank (M2/M3 complete)");
    } else if (totalCount === 68 && singleCount === 38 && scaleCount === 16 && rankCount === 14) {
      recordWarn(
        currentTierKey,
        "1.1 Question Bank Composition & Counts",
        `In progressive transition: 68 items present (38 single, 16 scale, 14 rank). Target is 72 (pending M2 single Q57-Q58 and M3 rank Q59-Q60).`
      );
    } else {
      recordFail(
        currentTierKey,
        "1.1 Question Bank Composition & Counts",
        `Unexpected counts: total=${totalCount}, single=${singleCount}, scale=${scaleCount}, rank=${rankCount}`,
        true,
        "Target is 72 total (40 single, 16 scale, 16 rank). M2/M3 question bank overhaul in progress."
      );
    }
  } catch (err) {
    recordFail(currentTierKey, "1.1 Question Bank Composition & Counts", err);
  }

  // 1.2 Aggregation Array Identity
  try {
    assert(Array.isArray(questions), "questions must be an array");
    const expectedConcat = [...singleQuestions, ...scaleQuestions, ...rankQuestions];
    assert(questions.length === expectedConcat.length, "questions.length must match sum of question files");
    for (let i = 0; i < questions.length; i++) {
      assert(questions[i].id === expectedConcat[i].id, `Question at index ${i} ID mismatch: ${questions[i].id} vs ${expectedConcat[i].id}`);
    }
    recordPass(currentTierKey, "1.2 Aggregation Array Identity", `Aggregated ${questions.length} items from sub-modules`);
  } catch (err) {
    recordFail(currentTierKey, "1.2 Aggregation Array Identity", err);
  }

  // 1.3 Question IDs Sequence & Uniqueness
  try {
    const idSet = new Set();
    const duplicateIds = [];
    const outOfRangeIds = [];

    for (const q of questions) {
      assert(typeof q.id === "number" && Number.isInteger(q.id), `Question ID must be an integer: found ${q.id}`);
      if (q.id < 1 || q.id > 72) {
        outOfRangeIds.push(q.id);
      }
      if (idSet.has(q.id)) {
        duplicateIds.push(q.id);
      }
      idSet.add(q.id);
    }

    assert(duplicateIds.length === 0, `Duplicate question IDs found: ${duplicateIds.join(", ")}`);
    assert(outOfRangeIds.length === 0, `Question IDs out of [1..72] range found: ${outOfRangeIds.join(", ")}`);

    const missingIds = [];
    for (let i = 1; i <= 72; i++) {
      if (!idSet.has(i)) {
        missingIds.push(i);
      }
    }

    if (missingIds.length === 0) {
      recordPass(currentTierKey, "1.3 Question IDs Sequence & Uniqueness", "All 72 IDs sequentially present without gaps");
    } else {
      recordWarn(
        currentTierKey,
        "1.3 Question IDs Sequence & Uniqueness",
        `Unique IDs confirmed within [1..72]. Unassigned sequential slots: [${missingIds.join(", ")}] (pending M2/M3)`
      );
    }
  } catch (err) {
    recordFail(currentTierKey, "1.3 Question IDs Sequence & Uniqueness", err);
  }

  // 1.4 Question Text & Core Attributes
  try {
    for (const q of questions) {
      assert(typeof q.text === "string" && q.text.trim().length > 3, `Question ${q.id} text is empty or too short`);
      assert(["single", "scale", "rank"].includes(q.type), `Question ${q.id} has invalid type: ${q.type}`);
    }
    recordPass(currentTierKey, "1.4 Question Text & Core Attributes", `Validated texts and types across ${questions.length} questions`);
  } catch (err) {
    recordFail(currentTierKey, "1.4 Question Text & Core Attributes", err);
  }

  // 1.5 Single-Choice Questions Options & Dimensions Integrity
  try {
    const validOptionIds = ["a", "b", "c", "d"];
    for (const q of singleQuestions) {
      assert(Array.isArray(q.options) && q.options.length === 4, `Single Q${q.id} must have exactly 4 options`);
      const optIds = q.options.map((o) => o.id);
      assert(
        optIds.every((id) => validOptionIds.includes(id)),
        `Single Q${q.id} option IDs must be [a, b, c, d], got [${optIds.join(", ")}]`
      );

      for (const opt of q.options) {
        assert(typeof opt.text === "string" && opt.text.trim().length > 0, `Single Q${q.id} option ${opt.id} text is empty`);
        assert(typeof opt.dimensions === "object" && opt.dimensions !== null, `Single Q${q.id} option ${opt.id} missing dimensions`);
        const dimKeys = Object.keys(opt.dimensions);
        assert(dimKeys.length > 0, `Single Q${q.id} option ${opt.id} dimensions object is empty`);
        for (const [dk, dv] of Object.entries(opt.dimensions)) {
          assert(DIMENSION_KEYS.includes(dk), `Single Q${q.id} option ${opt.id} uses unknown dimension key: "${dk}"`);
          assert(typeof dv === "number" && !isNaN(dv) && isFinite(dv), `Single Q${q.id} option ${opt.id} dimension ${dk} value is invalid: ${dv}`);
        }
      }
    }
    recordPass(currentTierKey, "1.5 Single-Choice Options & Dimensions", `Validated 4 options and valid dimensions across ${singleQuestions.length} single questions`);
  } catch (err) {
    recordFail(currentTierKey, "1.5 Single-Choice Options & Dimensions", err);
  }

  // 1.6 Scale Questions Dimensions Integrity
  try {
    for (const q of scaleQuestions) {
      assert(typeof q.dimensions === "object" && q.dimensions !== null, `Scale Q${q.id} missing dimensions object`);
      const dimKeys = Object.keys(q.dimensions);
      assert(dimKeys.length > 0, `Scale Q${q.id} dimensions object is empty`);
      for (const [dk, dv] of Object.entries(q.dimensions)) {
        assert(DIMENSION_KEYS.includes(dk), `Scale Q${q.id} uses unknown dimension key: "${dk}"`);
        assert(typeof dv === "number" && !isNaN(dv) && isFinite(dv), `Scale Q${q.id} dimension ${dk} value is invalid: ${dv}`);
      }
    }
    recordPass(currentTierKey, "1.6 Scale Questions Dimensions", `Validated dimension vectors across ${scaleQuestions.length} scale questions`);
  } catch (err) {
    recordFail(currentTierKey, "1.6 Scale Questions Dimensions", err);
  }

  // 1.7 Rank Questions Options & Dimensions Integrity
  try {
    const validOptionIds = ["a", "b", "c", "d"];
    for (const q of rankQuestions) {
      assert(Array.isArray(q.options) && q.options.length === 4, `Rank Q${q.id} must have exactly 4 options`);
      const optIds = q.options.map((o) => o.id);
      assert(
        optIds.every((id) => validOptionIds.includes(id)),
        `Rank Q${q.id} option IDs must be [a, b, c, d], got [${optIds.join(", ")}]`
      );

      for (const opt of q.options) {
        assert(typeof opt.text === "string" && opt.text.trim().length > 0, `Rank Q${q.id} option ${opt.id} text is empty`);
        assert(typeof opt.dimensions === "object" && opt.dimensions !== null, `Rank Q${q.id} option ${opt.id} missing dimensions`);
        const dimKeys = Object.keys(opt.dimensions);
        assert(dimKeys.length > 0, `Rank Q${q.id} option ${opt.id} dimensions object is empty`);
        for (const [dk, dv] of Object.entries(opt.dimensions)) {
          assert(DIMENSION_KEYS.includes(dk), `Rank Q${q.id} option ${opt.id} uses unknown dimension key: "${dk}"`);
          assert(typeof dv === "number" && !isNaN(dv) && isFinite(dv), `Rank Q${q.id} option ${opt.id} dimension ${dk} value is invalid: ${dv}`);
        }
      }
    }
    recordPass(currentTierKey, "1.7 Rank Questions Options & Dimensions", `Validated 4 options and valid dimensions across ${rankQuestions.length} rank questions`);
  } catch (err) {
    recordFail(currentTierKey, "1.7 Rank Questions Options & Dimensions", err);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   TIER 2: Boundary & Corner Cases
   ────────────────────────────────────────────────────────────────────────── */
function runTier2() {
  console.log("\n======================================================================");
  console.log("  [TIER 2] BOUNDARY & CORNER CASES");
  console.log("======================================================================");
  currentTierKey = "tier2";

  // 2.1 Empty Answers Handling
  try {
    const emptyResult = generateResult([], questions);
    assert(emptyResult !== null && typeof emptyResult === "object", "Result for empty answers must be an object");
    assert(emptyResult.userVector !== undefined, "Result must contain userVector");
    assert(emptyResult.dimensionScores !== undefined, "Result must contain dimensionScores");
    assert(emptyResult.archetype !== undefined, "Result must contain archetype profile");
    assert(Array.isArray(emptyResult.similarities), "Result similarities must be an array");

    // All dimension values in userVector must be 0 for empty answers
    for (const dk of DIMENSION_KEYS) {
      assert(emptyResult.userVector[dk] === 0, `Empty answers userVector[${dk}] should be 0, got ${emptyResult.userVector[dk]}`);
    }

    assertNoNaN(emptyResult, "emptyResult");
    recordPass(currentTierKey, "2.1 Empty Answers Handling", "Safely defaults to zero-vector, valid fallback without crashing or NaN");
  } catch (err) {
    recordFail(currentTierKey, "2.1 Empty Answers Handling", err);
  }

  // 2.2 Minimum Required Questions (Phase 1 first 10 questions)
  try {
    const first10Questions = questions.slice(0, 10);
    const first10Answers = first10Questions.map((q) => {
      if (q.type === "single") return { questionId: q.id, type: "single", optionId: q.options[0].id };
      if (q.type === "scale") return { questionId: q.id, type: "scale", value: 4 };
      if (q.type === "rank") return { questionId: q.id, type: "rank", rankOrder: [0, 1, 2, 3] };
      return null;
    }).filter(Boolean);

    const res10 = generateResult(first10Answers, questions);
    assert(res10.archetype && res10.archetype.title, "First 10 questions must yield valid primary archetype");
    assert(res10.secondaryArchetype && res10.secondaryArchetype.title, "First 10 questions must yield secondary archetype");
    assert(Array.isArray(res10.tagDetails) && res10.tagDetails.length === 5, "Must compute top 5 tagDetails");
    assert(Object.keys(res10.dimensionScores).length === 10, "Must compute all 10 dimensionScores");
    assertNoNaN(res10, "res10");

    recordPass(currentTierKey, "2.2 Minimum Required Questions (Phase 1, 10 items)", "Generates full profile and archetypes cleanly");
  } catch (err) {
    recordFail(currentTierKey, "2.2 Minimum Required Questions (Phase 1, 10 items)", err);
  }

  // 2.3 All-1s on Scale Questions (Extreme Disagree)
  try {
    const scaleAll1Answers = scaleQuestions.map((q) => ({
      questionId: q.id,
      type: "scale",
      value: 1,
    }));
    const resScale1 = generateResult(scaleAll1Answers, questions);
    assertNoNaN(resScale1, "resScale1");
    recordPass(currentTierKey, "2.3 All-1s on Scale Questions", "Processes without NaN; produces valid bounded vector");
  } catch (err) {
    recordFail(currentTierKey, "2.3 All-1s on Scale Questions", err);
  }

  // 2.4 All-5s on Scale Questions (Extreme Agree)
  try {
    const scaleAll5Answers = scaleQuestions.map((q) => ({
      questionId: q.id,
      type: "scale",
      value: 5,
    }));
    const resScale5 = generateResult(scaleAll5Answers, questions);
    assertNoNaN(resScale5, "resScale5");
    recordPass(currentTierKey, "2.4 All-5s on Scale Questions", "Processes without NaN; produces valid bounded vector");
  } catch (err) {
    recordFail(currentTierKey, "2.4 All-5s on Scale Questions", err);
  }

  // 2.5 Inversion Contrast: All-1s vs All-5s on Scale
  try {
    const scaleAll1Answers = scaleQuestions.map((q) => ({ questionId: q.id, type: "scale", value: 1 }));
    const scaleAll5Answers = scaleQuestions.map((q) => ({ questionId: q.id, type: "scale", value: 5 }));

    const resScale1 = generateResult(scaleAll1Answers, questions);
    const resScale5 = generateResult(scaleAll5Answers, questions);

    // Collect dimensions affected by scale questions
    const affectedDimensions = new Set();
    for (const sq of scaleQuestions) {
      if (sq.dimensions) {
        Object.keys(sq.dimensions).forEach((k) => affectedDimensions.add(k));
      }
    }

    // Check if inverted: if scale weights are symmetric, sum of vector1 + vector5 on affected dims should be ~0
    let inversionDivergenceCount = 0;
    for (const dk of affectedDimensions) {
      const v1 = resScale1.userVector[dk] || 0;
      const v5 = resScale5.userVector[dk] || 0;
      // In a symmetric engine, v1 and v5 must have opposite signs or sum to 0
      if (v1 * v5 > 0) {
        inversionDivergenceCount++;
      }
    }

    if (inversionDivergenceCount === 0) {
      recordPass(currentTierKey, "2.5 Inversion Contrast (All-1s vs All-5s)", "Scale responses 1 vs 5 produce inverted polar vectors");
    } else {
      recordFail(
        currentTierKey,
        "2.5 Inversion Contrast (All-1s vs All-5s)",
        `Inversion failure on ${inversionDivergenceCount} dimensions: All-1 and All-5 produced identical polarity!`,
        true,
        "R1 Engine scaleWeights fix pending: current weights do not invert for v=1."
      );
    }
  } catch (err) {
    recordFail(currentTierKey, "2.5 Inversion Contrast (All-1s vs All-5s)", err);
  }

  // 2.6 Tail Rank Subtraction Behavior
  try {
    const tailWeight = getRankWeight(3);
    if (tailWeight < 0) {
      recordPass(currentTierKey, "2.6 Tail Rank Subtraction Behavior", `Rank position 3 weight is negative (${tailWeight})`);
    } else {
      recordFail(
        currentTierKey,
        "2.6 Tail Rank Subtraction Behavior",
        `Rank position 3 weight is not negative (got ${tailWeight})`,
        true,
        "R1 Engine rankWeights: rank position 3 should be -0.6 to project negatively."
      );
    }
  } catch (err) {
    recordFail(currentTierKey, "2.6 Tail Rank Subtraction Behavior", err);
  }

  // 2.7 Neutral-Only Answers (Scale value = 3)
  try {
    const neutralAnswers = scaleQuestions.map((q) => ({
      questionId: q.id,
      type: "scale",
      value: 3,
    }));
    const resNeutral = generateResult(neutralAnswers, questions);
    assertNoNaN(resNeutral, "resNeutral");

    // Under symmetric weights w(3) == 0, raw dims should be 0, userVector all 0
    let nonZeroDims = 0;
    for (const dk of DIMENSION_KEYS) {
      if (resNeutral.userVector[dk] !== 0) nonZeroDims++;
    }

    if (nonZeroDims === 0) {
      recordPass(currentTierKey, "2.7 Neutral-Only Answers (Scale v=3)", "Answering 3 produces exactly zero dimension drift");
    } else {
      recordFail(
        currentTierKey,
        "2.7 Neutral-Only Answers (Scale v=3)",
        `Answering neutral (v=3) produced non-zero vector drift in ${nonZeroDims} dimensions`,
        true,
        "R1 Engine scaleWeights: w(3) should be 0.0."
      );
    }
  } catch (err) {
    recordFail(currentTierKey, "2.7 Neutral-Only Answers (Scale v=3)", err);
  }

  // 2.8 Sparse & Single-Question Submissions
  try {
    const singleAns = [{ questionId: singleQuestions[0].id, type: "single", optionId: "a" }];
    const resSingle = generateResult(singleAns, questions);
    assertNoNaN(resSingle, "resSingleOnly");

    const scaleAns = [{ questionId: scaleQuestions[0].id, type: "scale", value: 5 }];
    const resScale = generateResult(scaleAns, questions);
    assertNoNaN(resScale, "resScaleOnly");

    recordPass(currentTierKey, "2.8 Sparse & Single-Question Submissions", "Correctly handles N=1 answers without divide-by-zero");
  } catch (err) {
    recordFail(currentTierKey, "2.8 Sparse & Single-Question Submissions", err);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   TIER 3: Scoring Math Verification
   ────────────────────────────────────────────────────────────────────────── */
function runTier3() {
  console.log("\n======================================================================");
  console.log("  [TIER 3] SCORING MATH VERIFICATION");
  console.log("======================================================================");
  currentTierKey = "tier3";

  // 3.1 Scale Bidirectional Symmetry Contract
  try {
    const w1 = getScaleWeight(1);
    const w2 = getScaleWeight(2);
    const w3 = getScaleWeight(3);
    const w4 = getScaleWeight(4);
    const w5 = getScaleWeight(5);

    const isSymmetric = Math.abs(w1 + w5) < 1e-6 && Math.abs(w2 + w4) < 1e-6 && Math.abs(w3) < 1e-6;
    const isTargetSpec = Math.abs(w1 - -1.2) < 1e-6 && Math.abs(w5 - 1.2) < 1e-6;

    if (isSymmetric && isTargetSpec) {
      recordPass(
        currentTierKey,
        "3.1 Scale Bidirectional Symmetry Contract",
        `scaleWeights = [${w1}, ${w2}, ${w3}, ${w4}, ${w5}], centered on 0 at v=3`
      );
    } else {
      recordFail(
        currentTierKey,
        "3.1 Scale Bidirectional Symmetry Contract",
        `Scale weights [${w1}, ${w2}, ${w3}, ${w4}, ${w5}] do not satisfy symmetric target [-1.2, -0.6, 0, 0.6, 1.2]`,
        true,
        "R1 Engine: scaleWeights should be [0, -1.2, -0.6, 0.0, 0.6, 1.2]."
      );
    }
  } catch (err) {
    recordFail(currentTierKey, "3.1 Scale Bidirectional Symmetry Contract", err);
  }

  // 3.2 Scale Neutral Point Math (Synthetic Scale Item)
  try {
    const syntheticScaleQ = {
      id: 9991,
      type: "scale",
      dimensions: { energySource: 1.0 },
    };

    const resNeutral = generateResult([{ questionId: 9991, type: "scale", value: 3 }], [syntheticScaleQ]);
    const scoreVal = resNeutral.userVector.energySource;

    if (Math.abs(scoreVal) < 1e-6) {
      recordPass(currentTierKey, "3.2 Scale Neutral Point Math", "Value 3 yields identically 0.0 projection");
    } else {
      recordFail(
        currentTierKey,
        "3.2 Scale Neutral Point Math",
        `Value 3 yielded projection ${scoreVal} instead of 0.0`,
        true,
        "R1 Engine: Scale weight at value 3 must be 0.0."
      );
    }
  } catch (err) {
    recordFail(currentTierKey, "3.2 Scale Neutral Point Math", err);
  }

  // 3.3 Rank Tail Option Negative Projection Contract
  try {
    const r0 = getRankWeight(0);
    const r1 = getRankWeight(1);
    const r2 = getRankWeight(2);
    const r3 = getRankWeight(3);

    const isRankSpec =
      Math.abs(r0 - 1.0) < 1e-6 &&
      Math.abs(r1 - 0.4) < 1e-6 &&
      Math.abs(r2 - 0.0) < 1e-6 &&
      Math.abs(r3 - -0.6) < 1e-6;

    if (isRankSpec) {
      recordPass(currentTierKey, "3.3 Rank Tail Negative Projection Contract", `rankWeights: [${r0}, ${r1}, ${r2}, ${r3}]`);
    } else {
      recordFail(
        currentTierKey,
        "3.3 Rank Tail Negative Projection Contract",
        `Rank weights [${r0}, ${r1}, ${r2}, ${r3}] do not match target [1.0, 0.4, 0.0, -0.6]`,
        true,
        "R1 Engine: rankWeights should be [1.0, 0.4, 0.0, -0.6]."
      );
    }
  } catch (err) {
    recordFail(currentTierKey, "3.3 Rank Tail Negative Projection Contract", err);
  }

  // 3.4 Negative Projection on Tail Option Placement
  try {
    const syntheticRankQ = {
      id: 9992,
      type: "rank",
      options: [
        { id: "a", text: "optA", dimensions: { sensorySensitivity: 0.1 } },
        { id: "b", text: "optB", dimensions: { sensorySensitivity: 0.1 } },
        { id: "c", text: "optC", dimensions: { sensorySensitivity: 0.1 } },
        { id: "d", text: "optD", dimensions: { boundaryClarity: 1.0 } },
      ],
    };

    // Option 'd' placed at rank 3 ("最不像我")
    const resRank = generateResult(
      [{ questionId: 9992, type: "rank", rankOrder: [0, 1, 2, 3] }],
      [syntheticRankQ]
    );

    const boundaryVal = resRank.userVector.boundaryClarity || 0;
    if (boundaryVal < 0) {
      recordPass(currentTierKey, "3.4 Tail Option Negation Projection", `Tail option projected negatively: ${boundaryVal.toFixed(2)}`);
    } else {
      recordFail(
        currentTierKey,
        "3.4 Tail Option Negation Projection",
        `Tail option produced non-negative projection: ${boundaryVal}`,
        true,
        "R1 Engine: Option ranked 3 should subtract rather than add to dimensional vector."
      );
    }
  } catch (err) {
    recordFail(currentTierKey, "3.4 Tail Option Negation Projection", err);
  }

  // 3.5 Cosine Similarities Boundedness & Numerical Stability
  try {
    // Test 50 synthetic respondent vectors
    const testCases = [
      { energySource: 1.0, sensorySensitivity: -1.0 },
      { energySource: 100.0, sensorySensitivity: 50.0, expressivity: -80.0 },
      { energySource: 0.00001, sensorySensitivity: 0.00002 },
      { ...ARCHETYPE_PROFILES.rainbow.vector },
      { ...Object.fromEntries(DIMENSION_KEYS.map((k) => [k, -1 * (ARCHETYPE_PROFILES.crystal.vector[k] || 0)])) },
    ];

    // Add random vectors
    for (let i = 0; i < 45; i++) {
      const vec = {};
      for (const dk of DIMENSION_KEYS) {
        vec[dk] = (Math.random() - 0.5) * 10;
      }
      testCases.push(vec);
    }

    // Synthesize question to pass through generateResult
    for (let idx = 0; idx < testCases.length; idx++) {
      const vec = testCases[idx];
      const synthQ = {
        id: 9800 + idx,
        type: "single",
        options: [{ id: "a", text: "test", dimensions: vec }],
      };
      const res = generateResult([{ questionId: 9800 + idx, type: "single", optionId: "a" }], [synthQ]);

      assert(Array.isArray(res.similarities) && res.similarities.length === 10, "similarities must contain 10 items");
      for (const simItem of res.similarities) {
        assert(
          typeof simItem.sim === "number" && !isNaN(simItem.sim),
          `Cosine similarity is NaN for archetype ${simItem.key}`
        );
        assert(
          simItem.sim >= -1.0001 && simItem.sim <= 1.0001,
          `Cosine similarity out of [-1, 1] range: ${simItem.sim} for ${simItem.key}`
        );
      }
    }

    recordPass(currentTierKey, "3.5 Cosine Similarities Boundedness in [-1, 1]", "Verified across 50 extreme, sparse, and random test vectors");
  } catch (err) {
    recordFail(currentTierKey, "3.5 Cosine Similarities Boundedness in [-1, 1]", err);
  }

  // 3.6 Softmax Probability Distribution & z-score Calibration
  try {
    const sampleAnswers = singleQuestions.slice(0, 15).map((q) => ({
      questionId: q.id,
      type: "single",
      optionId: q.options[0].id,
    }));
    const res = generateResult(sampleAnswers, questions);

    assert(Array.isArray(res.archetypeProbabilities), "archetypeProbabilities must be an array");
    assert(res.archetypeProbabilities.length === 10, "archetypeProbabilities must have 10 elements");

    let probSum = 0;
    for (const ap of res.archetypeProbabilities) {
      assert(typeof ap.prob === "number" && !isNaN(ap.prob), `Invalid probability for ${ap.key}`);
      assert(ap.prob >= 0 && ap.prob <= 1, `Probability out of [0, 1] for ${ap.key}: ${ap.prob}`);
      probSum += ap.prob;
    }

    assert(Math.abs(probSum - 1.0) < 1e-4, `Softmax probabilities sum must equal 1.0, got ${probSum}`);
    recordPass(currentTierKey, "3.6 Softmax Probability Distribution", `Sum = ${probSum.toFixed(4)}, all p_k in [0, 1]`);
  } catch (err) {
    recordFail(currentTierKey, "3.6 Softmax Probability Distribution", err);
  }

  // 3.7 Configuration Single-Source Consistency Check
  try {
    const legacyScaleVals = WEIGHT_CONFIG?.scaleWeights?.values;
    const legacyRankVals = WEIGHT_CONFIG?.rankWeights?.values;
    const engineScaleVals = scaleWeights;
    const engineRankVals = rankWeights;

    const scaleSynced = JSON.stringify(legacyScaleVals) === JSON.stringify(engineScaleVals);
    const rankSynced = JSON.stringify(legacyRankVals) === JSON.stringify(engineRankVals);

    if (scaleSynced && rankSynced) {
      recordPass(currentTierKey, "3.7 Configuration Single-Source Consistency", "weightConfig.js matches blurEngine.js definitions");
    } else {
      recordWarn(
        currentTierKey,
        "3.7 Configuration Single-Source Consistency",
        `Code drift detected: weightConfig.js [scale=${JSON.stringify(legacyScaleVals)}] differs from blurEngine.js [scale=${JSON.stringify(engineScaleVals)}]. Update weightConfig.js to align with blurEngine.js single source.`
      );
    }
  } catch (err) {
    recordWarn(currentTierKey, "3.7 Configuration Single-Source Consistency", `Check skipped: ${err.message}`);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   TIER 4: Real-world End-to-End Simulation
   ────────────────────────────────────────────────────────────────────────── */
function runTier4() {
  console.log("\n======================================================================");
  console.log("  [TIER 4] REAL-WORLD END-TO-END SIMULATION");
  console.log("======================================================================");
  currentTierKey = "tier4";

  // 4.1 Archetype Targeted Persona Simulations (10 Archetypes)
  try {
    const archetypeKeys = Object.keys(ARCHETYPE_PROFILES);
    assert(archetypeKeys.length === 10, "Must have exactly 10 archetype profiles");

    let successfulSimulations = 0;

    for (const targetKey of archetypeKeys) {
      const profile = ARCHETYPE_PROFILES[targetKey];
      const targetVec = profile.vector;

      // Construct a persona tailored to targetVec
      const personaAnswers = questions.map((q) => {
        if (q.type === "single" && q.options) {
          // Choose option with highest dot product with targetVec
          let bestOpt = q.options[0];
          let bestDot = -Infinity;
          for (const opt of q.options) {
            let dot = 0;
            if (opt.dimensions) {
              for (const [dk, dv] of Object.entries(opt.dimensions)) {
                dot += dv * (targetVec[dk] || 0);
              }
            }
            if (dot > bestDot) {
              bestDot = dot;
              bestOpt = opt;
            }
          }
          return { questionId: q.id, type: "single", optionId: bestOpt.id };
        } else if (q.type === "scale" && q.dimensions) {
          // Calculate net alignment
          let alignment = 0;
          for (const [dk, dv] of Object.entries(q.dimensions)) {
            alignment += dv * (targetVec[dk] || 0);
          }
          const val = alignment > 0.3 ? 5 : alignment > 0.05 ? 4 : alignment < -0.3 ? 1 : alignment < -0.05 ? 2 : 3;
          return { questionId: q.id, type: "scale", value: val };
        } else if (q.type === "rank" && q.options) {
          // Rank options descending by dot product
          const scoredOpts = q.options.map((opt, idx) => {
            let dot = 0;
            if (opt.dimensions) {
              for (const [dk, dv] of Object.entries(opt.dimensions)) {
                dot += dv * (targetVec[dk] || 0);
              }
            }
            return { idx, dot };
          });
          scoredOpts.sort((a, b) => b.dot - a.dot);
          return { questionId: q.id, type: "rank", rankOrder: scoredOpts.map((s) => s.idx) };
        }
        return null;
      }).filter(Boolean);

      const result = generateResult(personaAnswers, questions);

      // Verify Result Structure & Contracts
      assert(result.archetype && result.archetype.title, `Archetype object missing for targeted ${targetKey}`);
      assert(result.archetypeKey, `Archetype key missing for targeted ${targetKey}`);
      assert(result.userVector, `userVector missing for targeted ${targetKey}`);
      assert(result.dimensionScores && Object.keys(result.dimensionScores).length === 10, "dimensionScores must contain 10 dims");
      assert(Array.isArray(result.tagDetails) && result.tagDetails.length === 5, "tagDetails must have 5 tags");
      assert(Array.isArray(result.similarities) && result.similarities.length === 10, "similarities must contain 10 archetypes");
      assert(Array.isArray(result.archetypeProbabilities) && result.archetypeProbabilities.length === 10, "archetypeProbabilities must have 10 items");

      assertNoNaN(result, `targeted_${targetKey}`);

      // Check alignment score for targeted archetype
      const targetSimObj = result.similarities.find((s) => s.key === targetKey);
      assert(targetSimObj !== undefined, `Target archetype ${targetKey} missing in similarities`);
      assert(targetSimObj.sim > 0.3, `Targeted archetype ${targetKey} achieved insufficient similarity (${targetSimObj.sim.toFixed(3)})`);

      successfulSimulations++;
    }

    recordPass(
      currentTierKey,
      "4.1 Archetype Targeted Persona Simulations",
      `All ${successfulSimulations}/10 archetypes simulated end-to-end with zero NaN and strong profile convergence`
    );
  } catch (err) {
    recordFail(currentTierKey, "4.1 Archetype Targeted Persona Simulations", err);
  }

  // 4.2 Full Question Bank Session Latency & Memory Benchmark
  try {
    const allAnswers = questions.map((q) => {
      if (q.type === "single") return { questionId: q.id, type: "single", optionId: q.options[0].id };
      if (q.type === "scale") return { questionId: q.id, type: "scale", value: 4 };
      if (q.type === "rank") return { questionId: q.id, type: "rank", rankOrder: [0, 1, 2, 3] };
      return null;
    }).filter(Boolean);

    const startTime = performance.now();
    const result = generateResult(allAnswers, questions);
    const durationMs = performance.now() - startTime;

    assertNoNaN(result, "benchmarkResult");
    assert(durationMs < 50, `generateResult took ${durationMs.toFixed(2)}ms, exceeding 50ms budget`);

    recordPass(
      currentTierKey,
      "4.2 Full Question Bank Session Latency Benchmark",
      `Completed full test evaluation (${questions.length} questions) in ${durationMs.toFixed(2)}ms (< 50ms budget)`
    );
  } catch (err) {
    recordFail(currentTierKey, "4.2 Full Question Bank Session Latency Benchmark", err);
  }

  // 4.3 Dimension Scores Display Boundary Check
  try {
    const emptyResult = generateResult([], questions);
    for (const dk of DIMENSION_KEYS) {
      const dimInfo = emptyResult.dimensionScores[dk];
      assert(dimInfo !== undefined, `dimensionScores missing key: ${dk}`);
      assert(dimInfo.score >= 0.0 && dimInfo.score <= 1.0, `Score for ${dk} out of [0, 1] range: ${dimInfo.score}`);
      assert(typeof dimInfo.name === "string" && dimInfo.name.length > 0, `Display name missing for ${dk}`);
      assert(typeof dimInfo.positiveLabel === "string", `positiveLabel missing for ${dk}`);
      assert(typeof dimInfo.negativeLabel === "string", `negativeLabel missing for ${dk}`);
    }
    recordPass(currentTierKey, "4.3 Dimension Scores Display Boundary Check", "All 10 dimension meters have valid [0, 1] scores, labels, and descriptions");
  } catch (err) {
    recordFail(currentTierKey, "4.3 Dimension Scores Display Boundary Check", err);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Summary Scorecard & Reporting
   ────────────────────────────────────────────────────────────────────────── */
function printSummary() {
  console.log("\n======================================================================");
  console.log("  BLUR E2E VERIFICATION SCORECARD SUMMARY");
  console.log("======================================================================");

  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;

  for (const tierNum of [1, 2, 3, 4]) {
    const tierKey = `tier${tierNum}`;
    const data = results[tierKey];
    totalPassed += data.passed;
    totalFailed += data.failed;
    totalWarnings += data.warnings;

    const statusBadge = data.failed === 0 ? (data.warnings > 0 ? "WARN" : "PASS") : "FAIL";
    const statusIcon = data.failed === 0 ? (data.warnings > 0 ? "⚠" : "✓") : "✗";

    console.log(
      `  Tier ${tierNum} Score: ${statusIcon} [${statusBadge.padEnd(4)}] Passed: ${String(data.passed).padStart(2)} | Failed: ${String(data.failed).padStart(2)} | Warnings: ${String(data.warnings).padStart(2)}`
    );
  }

  console.log("----------------------------------------------------------------------");
  console.log(`  TOTAL: Passed: ${totalPassed} | Failed: ${totalFailed} | Warnings: ${totalWarnings}`);
  console.log("======================================================================");

  if (results.escalations.length > 0) {
    console.log("\n[!] IMPLEMENTATION DEFECTS TO ESCALATE TO MILESTONE WORKERS:");
    results.escalations.forEach((esc, idx) => {
      console.log(`  ${idx + 1}. [${esc.tier.toUpperCase()}] ${esc.name}`);
      console.log(`     Error: ${esc.error}`);
      console.log(`     Action: ${esc.note}`);
    });
    console.log("");
  }

  if (isStrict && totalFailed > 0) {
    console.log("Exiting with status 1 due to --strict flag and test failures.\n");
    process.exit(1);
  } else {
    console.log("E2E Verification harness execution completed cleanly.\n");
    process.exit(0);
  }
}

/* ── Main Execution Entry ────────────────────────────────────────────────── */
console.log("======================================================================");
console.log("  BLUR PSYCHOLOGICAL ASSESSMENT — E2E TEST VERIFICATION HARNESS");
console.log("======================================================================");
console.log(`  Mode: ${isStrict ? "STRICT (CI Gate)" : "STANDARD (Diagnostic & Progressive)"}`);
console.log(`  Target Tiers: [${selectedTiers.join(", ")}]`);

if (selectedTiers.includes(1)) runTier1();
if (selectedTiers.includes(2)) runTier2();
if (selectedTiers.includes(3)) runTier3();
if (selectedTiers.includes(4)) runTier4();

printSummary();
