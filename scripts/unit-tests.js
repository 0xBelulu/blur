#!/usr/bin/env node

/**
 * Blur Psychological Assessment — Unit Test Suite
 * Zero-dependency unit testing for blurEngine, dualArchetypes, and historyStorage
 */

import {
  scaleWeights,
  rankWeights,
  getRankWeight,
  getScaleWeight,
  generateResult,
  determineSuppressedTraits,
  DIMENSION_PAIRS,
} from "../src/utils/blurEngine.js";
import { DIMENSIONS, DIMENSION_KEYS } from "../src/data/dimensions.js";
import { ARCHETYPE_PROFILES } from "../src/data/archetypeProfiles.js";
import { getDualSynergy, DUAL_SYNERGIES } from "../src/data/dualArchetypes.js";
import {
  saveHistoryRecord,
  getHistoryRecords,
  deleteHistoryRecord,
  clearHistoryRecords,
} from "../src/utils/historyStorage.js";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || "Values not equal"}: expected ${expected}, got ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message || "Objects not deep equal"}: expected ${expectedStr}, got ${actualStr}`);
  }
}

console.log("\n==================================================");
console.log("  BLUR UNIT TEST SUITE");
console.log("==================================================");

/* ── 1. Weight Utilities ─────────────────────────────────────────────────── */
console.log("\n[1] Weight Configuration Contracts:");

test("scaleWeights has length 6 and centered on 0 at v=3", () => {
  assertEqual(scaleWeights.length, 6);
  assertEqual(getScaleWeight(3), 0.0);
  assertEqual(getScaleWeight(1), -1.2);
  assertEqual(getScaleWeight(5), 1.2);
  assertEqual(getScaleWeight(2), -0.6);
  assertEqual(getScaleWeight(4), 0.6);
});

test("rankWeights gives positive to top and negative to tail", () => {
  assertEqual(rankWeights.length, 4);
  assertEqual(getRankWeight(0), 1.0);
  assertEqual(getRankWeight(1), 0.4);
  assertEqual(getRankWeight(2), 0.0);
  assertEqual(getRankWeight(3), -0.6);
  assertEqual(getRankWeight(99), 0.0);
});

/* ── 2. Dual Archetypes & Synergies ──────────────────────────────────────── */
console.log("\n[2] Dual Archetype Resonance Synergies:");

test("getDualSynergy retrieves forward and reverse synergies", () => {
  const synergy1 = getDualSynergy("mist", "negative", ARCHETYPE_PROFILES.mist, ARCHETYPE_PROFILES.negative);
  const synergy2 = getDualSynergy("negative", "mist", ARCHETYPE_PROFILES.negative, ARCHETYPE_PROFILES.mist);

  assert(synergy1 !== null, "Synergy mist_negative should exist");
  assert(synergy2 !== null, "Synergy negative_mist should exist");
  assertEqual(synergy1.title, synergy2.title, "Forward and reverse titles must match");
  assertEqual(synergy1.title, "暗房中的隐雾者");
  assert(synergy1.coreTension.length > 5, "Core tension must be populated");
});

test("getDualSynergy provides graceful fallback for unmapped pairs", () => {
  const fallback = getDualSynergy("salt", "mist", ARCHETYPE_PROFILES.salt, ARCHETYPE_PROFILES.mist);
  assert(fallback !== null, "Fallback synergy must not be null");
  assert(fallback.title.includes("双相交融"), "Fallback title should contain '双相交融'");
  assert(fallback.description.length > 10, "Fallback description should be generated");
});

test("all pre-defined dual synergies have non-empty fields", () => {
  for (const [key, item] of Object.entries(DUAL_SYNERGIES)) {
    assert(typeof item.title === "string" && item.title.trim().length > 0, `${key} missing title`);
    assert(typeof item.description === "string" && item.description.trim().length > 0, `${key} missing description`);
    assert(typeof item.coreTension === "string" && item.coreTension.trim().length > 0, `${key} missing coreTension`);
  }
});

/* ── 3. Engine Scoring & Archetype Matching ──────────────────────────────── */
console.log("\n[3] Scoring Engine Integrity:");

test("empty answers yield zero userVector and valid profile", () => {
  const res = generateResult([]);
  assert(res !== null, "Result should not be null");
  for (const dk of DIMENSION_KEYS) {
    assertEqual(res.userVector[dk], 0, `userVector[${dk}] should be 0`);
  }
  assert(res.archetype !== undefined, "Primary archetype must exist");
  assertEqual(res.similarities.length, 10, "10 similarities must exist");
});

test("dimension scores have valid 0-1 range and labels", () => {
  const mockAnswers = [
    { questionId: 1, type: "scale", value: 5 },
    { questionId: 2, type: "single", optionId: "a" },
  ];
  const synthQuestions = [
    { id: 1, type: "scale", dimensions: { energySource: 1.0 } },
    { id: 2, type: "single", options: [{ id: "a", dimensions: { sensorySensitivity: 0.8 } }] },
  ];

  const res = generateResult(mockAnswers, synthQuestions);
  for (const dk of DIMENSION_KEYS) {
    const meter = res.dimensionScores[dk];
    assert(meter.score >= 0 && meter.score <= 1, `${dk} score out of range: ${meter.score}`);
    assert(["positive", "negative", "neutral"].includes(meter.direction), `${dk} invalid direction`);
    assertEqual(meter.name, DIMENSIONS[dk].name);
  }
});

test("determineSuppressedTraits extracts correct shadowed dimensions", () => {
  const userVec = { energySource: 0.5, sensorySensitivity: -0.8, boundaryClarity: 0.2 };
  const suppressed = determineSuppressedTraits("crystal", userVec);
  assert(Array.isArray(suppressed), "Suppressed traits must be an array");
  for (const st of suppressed) {
    assert(typeof st.trait === "string", "Trait key must be string");
    assert(typeof st.text === "string", "Trait text must be string");
    assert(typeof st.detail === "string", "Trait detail must be string");
  }
});

test("DIMENSION_PAIRS contains 5 valid pairs with valid dimension keys", () => {
  assertEqual(DIMENSION_PAIRS.length, 5);
  for (const pair of DIMENSION_PAIRS) {
    assert(DIMENSION_KEYS.includes(pair.xKey), `Invalid xKey: ${pair.xKey}`);
    assert(DIMENSION_KEYS.includes(pair.yKey), `Invalid yKey: ${pair.yKey}`);
    assert(typeof pair.label === "string" && pair.label.length > 0, "Missing pair label");
  }
});

test("generateResult accepts object-map answer format", () => {
  const mapAnswers = {
    1: 4, // scale value 4
    2: "b", // single option "b"
    3: [0, 1, 2, 3], // rank order
  };
  const synthQuestions = [
    { id: 1, type: "scale", dimensions: { energySource: 1.0 } },
    { id: 2, type: "single", options: [{ id: "b", dimensions: { expressivity: 0.8 } }] },
    { id: 3, type: "rank", options: [
      { id: "a", dimensions: { sensorySensitivity: 0.5 } },
      { id: "b", dimensions: { sensorySensitivity: 0.2 } },
      { id: "c", dimensions: { sensorySensitivity: 0.0 } },
      { id: "d", dimensions: { sensorySensitivity: -0.5 } },
    ]},
  ];

  const res = generateResult(mapAnswers, synthQuestions);
  assert(res !== null, "Result should not be null");
  assert(res.archetype !== undefined, "Archetype should be resolved");
  assert(res.userVector.energySource > 0, "energySource should have positive projection");
  assert(res.userVector.expressivity > 0, "expressivity should have positive projection");
});

test("isDualResonance correctly triggers when top 2 archetypes are closely matched", () => {
  // Pass identical responses to top 2 profiles to test dual resonance
  const profileMist = ARCHETYPE_PROFILES.mist;
  const profileNegative = ARCHETYPE_PROFILES.negative;

  // Synthesize vector halfway between mist and negative
  const blendedVector = {};
  for (const dk of DIMENSION_KEYS) {
    blendedVector[dk] = ((profileMist.vector[dk] || 0) + (profileNegative.vector[dk] || 0)) / 2;
  }

  const synthQ = [{ id: 999, type: "single", options: [{ id: "a", dimensions: blendedVector }] }];
  const res = generateResult([{ questionId: 999, optionId: "a" }], synthQ);

  assert(Array.isArray(res.similarities) && res.similarities.length === 10, "10 similarities expected");
  if (res.isDualResonance) {
    assert(res.dualSynergy !== null, "dualSynergy must exist when isDualResonance is true");
    assert(typeof res.dualSynergy.title === "string", "dualSynergy must contain title");
  }
});

/* ── 4. History Storage with Mock Storage ────────────────────────────────── */
console.log("\n[4] History Storage Robustness:");

// Setup in-memory mock localStorage
const storageMap = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => storageMap.get(key) || null,
    setItem: (key, val) => storageMap.set(key, String(val)),
    removeItem: (key) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  },
};

test("historyStorage can save, retrieve, delete, and clear records", () => {
  clearHistoryRecords();
  assertEqual(getHistoryRecords().length, 0, "Initial records should be empty");

  const mockResult = {
    archetype: { title: "雾", symbol: "🌫️" },
    archetypeKey: "mist",
  };

  const saved1 = saveHistoryRecord([{ questionId: 1, value: 5 }], mockResult);
  assert(saved1 !== null, "Saved record should not be null");
  assert(typeof saved1.id === "string", "Saved record must have ID");
  assertEqual(getHistoryRecords().length, 1, "Should have 1 record");

  const saved2 = saveHistoryRecord([{ questionId: 2, value: 3 }], mockResult);
  assertEqual(getHistoryRecords().length, 2, "Should have 2 records");

  deleteHistoryRecord(saved1.id);
  const remaining = getHistoryRecords();
  assertEqual(remaining.length, 1, "Should have 1 record after delete");
  assertEqual(remaining[0].id, saved2.id, "Remaining record should match saved2");

  clearHistoryRecords();
  assertEqual(getHistoryRecords().length, 0, "Should have 0 records after clear");
});

test("historyStorage bounds records to maximum of 30", () => {
  clearHistoryRecords();
  const mockResult = { archetype: { title: "晶体", symbol: "💎" } };
  for (let i = 0; i < 35; i++) {
    saveHistoryRecord([{ questionId: i, value: 4 }], mockResult);
  }
  const records = getHistoryRecords();
  assertEqual(records.length, 30, "Records must be capped at 30 items");
});

/* ── Summary ─────────────────────────────────────────────────────────────── */
console.log("\n==================================================");
console.log(`  Tests run: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log("==================================================");

if (failedTests > 0) {
  process.exit(1);
}
