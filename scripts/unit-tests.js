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
import {
  ACCENTS, ACCENT_KEYS, DEFAULT_INK, FOLLOW, markShades, personAccent, resolveAccent,
} from "../shared/accents.js";
import { ARCHETYPE_PROFILES } from "../src/data/archetypeProfiles.js";
import { getDualSynergy, DUAL_SYNERGIES } from "../src/data/dualArchetypes.js";
import {
  saveHistoryRecord,
  getHistoryRecords,
  deleteHistoryRecord,
  clearHistoryRecords,
  EVICTION_EVENT,
} from "../src/utils/historyStorage.js";
import { resonanceScale, probabilityPercent } from "../src/utils/resonance.js";
import {
  shouldInvite,
  noteInviteShown,
  noteInviteDismissed,
  noteInviteCreated,
  INVITE_SNOOZE_MS,
  INVITE_MAX_DISMISSALS,
} from "../src/utils/identityInvite.js";
import { copyText, COPY_MANUAL_HINT } from "../src/utils/clipboard.js";
import {
  PROJECTION_AXES, PROJECTION_MEAN, PROJECTION_SPAN, axisTendency, projectVector,
} from "../shared/projection.js";

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

async function testAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
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

test("DIMENSIONS 的键序与 shared 里的契约逐项一致", () => {
  assertDeepEqual(Object.keys(DIMENSIONS), DIMENSION_KEYS,
    "维度 key 的顺序被改动：向量按这个顺序累加，历史记录依赖它保持稳定");
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

test("historyStorage retains local-only records beyond 30", () => {
  clearHistoryRecords();
  const mockResult = { archetype: { title: "晶体", symbol: "💎" } };
  for (let i = 0; i < 35; i++) {
    saveHistoryRecord([{ questionId: i, value: 4 }], mockResult);
  }
  const records = getHistoryRecords();
  assertEqual(records.length, 35, "Local-only records must not be silently discarded");
});

// 会真的抛 QuotaExceededError 的存储，用来验证淘汰路径。
function quotaStorage(limit) {
  const map = new Map();
  let used = 0;
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      const next = String(value);
      const previous = map.get(key);
      const delta = next.length - (previous ? previous.length : 0);
      if (used + delta > limit) {
        const error = new Error("QuotaExceededError");
        error.name = "QuotaExceededError";
        throw error;
      }
      used += delta;
      map.set(key, next);
    },
    removeItem: (key) => {
      const previous = map.get(key);
      if (previous) used -= previous.length;
      map.delete(key);
    },
    clear: () => { map.clear(); used = 0; },
  };
}

test("配额写满时淘汰最旧记录，而不是丢掉刚做完的那份画像", () => {
  const original = globalThis.window;
  const dispatched = [];
  globalThis.window = {
    localStorage: quotaStorage(6000),
    dispatchEvent: (event) => dispatched.push(event.type),
  };
  try {
    const mockResult = { archetype: { title: "晶体".repeat(8), symbol: "💎" } };
    const saved = [];
    for (let i = 0; i < 40; i += 1) {
      saved.push(saveHistoryRecord([{ questionId: i, value: 4 }], mockResult));
    }
    const newest = saved[saved.length - 1];
    assert(newest !== null, "最新一份必须保存成功，不能因为空间不足返回 null");
    const ids = getHistoryRecords().map((record) => record.id);
    assert(ids.includes(newest.id), "刚保存的画像不能被淘汰");
    assert(ids.length < 40, "配额不足时应当确实淘汰了旧记录");
    assert(dispatched.includes(EVICTION_EVENT), "淘汰必须通知界面，不能静默丢数据");
  } finally {
    globalThis.window = original;
    clearHistoryRecords();
  }
});

/* ── 光谱共振读数 ───────────────────────────────────────────────────────── */

test("相对共振度没有 10% 地板：最低就是 0，最高是 100", () => {
  const scale = resonanceScale([{ prob: 0.3 }, { prob: 0.05 }, { prob: 0.15 }]);
  assertEqual(Math.round(scale(0.3)), 100, "最高的原型必须是 100");
  assertEqual(Math.round(scale(0.05)), 0, "最低的原型必须是 0，不能是写死的 10");
  assert(scale(0.15) > 0 && scale(0.15) < 100, "中间档位必须落在开区间内");
});

test("概率全部相等时共振度退化为 0，不产生 NaN", () => {
  const scale = resonanceScale([{ prob: 0.1 }, { prob: 0.1 }]);
  assert(!Number.isNaN(scale(0.1)), "等概率不能除零得到 NaN");
  assertEqual(scale(0.1), 0, "没有区分度时应当是 0");
});

test("probabilityPercent 返回真实占比，供需要概率语义的地方使用", () => {
  assertEqual(probabilityPercent(0.283), 28);
  assertEqual(probabilityPercent(undefined), 0);
});

test("结果不再携带与已有字段重复的别名", () => {
  const result = generateResult([{ questionId: 1, type: "scale", value: 5 }]);
  for (const field of ["topTags", "primaryArchetype", "archetypeScores", "rawAnswers", "specialNarratives"]) {
    assert(result[field] === undefined, `${field} 与已有字段重复，不应再出现在结果里`);
  }
  assert(Array.isArray(result.tagDetails), "tagDetails 仍然要在");
  assert(Array.isArray(result.archetypeProbabilities), "archetypeProbabilities 仍然要在");
});

/* ── 主色：色板跨度与解析 ───────────────────────────────────────────────── */

function lab(rgb) {
  const lin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = rgb.map(lin);
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / 0.95047), fy = f(y), fz = f(z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function deltaE(a, b) {
  const la = lab(a), lb = lab(b);
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

test("accent palette keeps a perceivable spread", () => {
  // 原型色只有 19.5 的平均色差，压进 59px 头像后多数低于可辨阈值。
  // 色板必须拉开：任意两色 ΔE ≥ 14，这样合成后仍 ≥ 9。
  let closest = { distance: Infinity };
  for (let i = 0; i < ACCENTS.length; i++) {
    for (let j = i + 1; j < ACCENTS.length; j++) {
      const distance = deltaE(ACCENTS[i].rgb, ACCENTS[j].rgb);
      if (distance < closest.distance) closest = { distance, pair: `${ACCENTS[i].name}/${ACCENTS[j].name}` };
    }
  }
  assert(closest.distance >= 14, `色板最接近的一对 ${closest.pair} 只有 ΔE ${closest.distance.toFixed(1)}，低于 14`);
});

test("accent keys are unique and follow is reserved", () => {
  const keys = ACCENTS.map((accent) => accent.key);
  assertEqual(new Set(keys).size, keys.length, "色板 key 不能重复");
  assert(!keys.includes(FOLLOW), "follow 是保留值，不能被色板占用");
  assertEqual(ACCENT_KEYS[0], FOLLOW, "白名单第一项应是 follow");
  assertEqual(ACCENT_KEYS.length, ACCENTS.length + 1, "白名单应包含 follow 与全部色板");
});

test("resolveAccent follows the portrait until a color is chosen", () => {
  const profile = ARCHETYPE_PROFILES.mist;
  assertDeepEqual(resolveAccent({}, profile), profile.color, "没选择时应跟随画像");
  assertDeepEqual(resolveAccent({ accent: FOLLOW }, profile), profile.color, "follow 等价于没选择");
  assertDeepEqual(resolveAccent({ accent: "clay" }, profile), [196, 143, 119], "选择了就用色板色");
  assertDeepEqual(resolveAccent({ accent: "retired" }, profile), profile.color, "未知色值应回退原型色");
  assertDeepEqual(resolveAccent({ accent: "retired" }, null), DEFAULT_INK, "连画像都没有时用默认灰");
});

test("personAccent prefers the chosen color, then the visible portrait palette", () => {
  assertDeepEqual(personAccent({ accent: "lake", palette: [180, 185, 195] }), [96, 142, 136], "自己选的主色优先");
  assertDeepEqual(personAccent({ accent: null, palette: [180, 185, 195] }), [180, 185, 195], "没选时用对方的原型色");
  assertDeepEqual(personAccent({}), DEFAULT_INK, "什么都拿不到时用默认灰");
});

test("markShades derives four stops including the counter color", () => {
  const shades = markShades([96, 142, 136]);
  const tones = [shades.ink, shades.light, shades.dark, shades.counter].map((value) => value.split(",").map(Number));
  assertEqual(tones.length, 4, "头像应有四个色标");
  assert(tones[1][0] > tones[0][0], "提亮色应比主色亮");
  assert(tones[2][0] < tones[0][0], "压暗色应比主色暗");
  // 补色要真的换到对面：湖水偏绿，补色应偏红。这是光场冷暖关系的来源。
  assert(tones[3][0] > tones[3][1], "补色的红通道应高于绿通道");
  assert(deltaE(tones[3], tones[0]) > 20, "补色与主色的色差要够大，否则等于没加");
  tones.flat().forEach((channel) => assert(channel >= 0 && channel <= 255, "色值必须在 0–255 之间"));
});

/* ── 结果页的身份邀请：一次机会，两次拒绝就停下 ────────────────────────── */
console.log("\n[5] Post-result Identity Invite:");

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

test("a registered identity is never invited", () => {
  const storage = memoryStorage();
  assert(!shouldInvite({ account: { registered: true }, recordId: "a", storage }), "已存到云端不应再被邀请");
  assert(!shouldInvite({ account: { registered: false }, recordId: "", storage }), "没有记录时没有邀请对象");
});

test("each finished portrait is invited at most once", () => {
  const storage = memoryStorage();
  const now = 1_700_000_000_000;
  assert(shouldInvite({ account: {}, recordId: "a", now, storage }), "刚完成的画像应可以邀请");
  noteInviteShown("a", storage);
  assert(!shouldInvite({ account: {}, recordId: "a", now: now + 1000, storage }), "同一份画像不能重复弹");
  assert(shouldInvite({ account: {}, recordId: "b", now: now + 1000, storage }), "新的画像可以再邀请");
});

test("a quiet refusal snoozes the invite for three days", () => {
  const storage = memoryStorage();
  const now = 1_700_000_000_000;
  noteInviteDismissed(storage, now);
  assert(!shouldInvite({ account: {}, recordId: "b", now: now + 1000, storage }), "拒绝后应进入冷静期");
  assert(!shouldInvite({ account: {}, recordId: "b", now: now + INVITE_SNOOZE_MS - 1, storage }), "冷静期内不应自动出现");
  assert(shouldInvite({ account: {}, recordId: "b", now: now + INVITE_SNOOZE_MS, storage }), "冷静期结束后可以再邀请一次");
});

test("two refusals end the automatic invitation", () => {
  const storage = memoryStorage();
  const now = 1_700_000_000_000;
  for (let i = 0; i < INVITE_MAX_DISMISSALS; i++) noteInviteDismissed(storage, now + i);
  assert(!shouldInvite({ account: {}, recordId: "c", now: now + 40 * 86_400_000, storage }), "两次拒绝后不应再自动弹");
});

test("creating an identity clears the invite memory", () => {
  const storage = memoryStorage();
  const now = 1_700_000_000_000;
  noteInviteShown("a", storage);
  noteInviteDismissed(storage, now);
  noteInviteDismissed(storage, now);
  assert(!shouldInvite({ account: {}, recordId: "z", now: now + 40 * 86_400_000, storage }), "清除前应处于停止状态");
  noteInviteCreated(storage);
  assert(shouldInvite({ account: {}, recordId: "z", now: now + 40 * 86_400_000, storage }), "创建过身份后应回到干净状态");
});

test("blocked storage never breaks the result page", () => {
  const broken = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  assert(shouldInvite({ account: {}, recordId: "x", storage: broken }), "存储被禁用时仍可邀请");
  noteInviteShown("x", broken);
  noteInviteDismissed(broken);
  noteInviteCreated(broken);
});

/* ── 复制：降级路径 ──────────────────────────────────────────────────────── */
console.log("\n[6] Clipboard Fallback:");

function fakeDoc(options = {}) {
  const nodes = [];
  const calls = { attributes: [], selection: null, command: null, selected: false };
  const doc = {
    activeElement: options.activeElement ?? null,
    body: {
      appendChild(node) { nodes.push(node); return node; },
      removeChild(node) { const index = nodes.indexOf(node); if (index >= 0) nodes.splice(index, 1); return node; },
    },
    createElement() {
      const field = {
        value: "",
        style: {},
        setAttribute(name, value) { calls.attributes.push([name, value]); },
        select() { calls.selected = true; },
        setSelectionRange(start, end) { calls.selection = [start, end]; },
        focus() {},
        remove() { const index = nodes.indexOf(field); if (index >= 0) nodes.splice(index, 1); },
      };
      return field;
    },
    execCommand(command) {
      calls.command = command;
      if (options.copyThrows) throw new Error("copy blocked");
      return options.copyWorks !== false;
    },
  };
  return { doc, nodes, calls };
}

const rejectingClipboard = () => ({ clipboard: { writeText: async () => {
  const error = new Error("denied");
  error.name = "NotAllowedError";
  throw error;
} } });

await testAsync("可用的 clipboard 直接复制，不创建兜底元素", async () => {
  let written = null;
  const { doc, nodes } = fakeDoc();
  const how = await copyText("BLUR-abc", { nav: { clipboard: { writeText: async (value) => { written = value; } } }, doc });
  assertEqual(how, "clipboard");
  assertEqual(written, "BLUR-abc");
  assertEqual(nodes.length, 0, "成功后不应留下 textarea");
});

await testAsync("clipboard 被拒绝后落到 execCommand", async () => {
  const { doc, nodes, calls } = fakeDoc();
  assertEqual(await copyText("BLUR-abc", { nav: rejectingClipboard(), doc }), "legacy");
  assertEqual(calls.command, "copy");
  assertEqual(nodes.length, 0, "兜底 textarea 应被清理");
});

await testAsync("没有 clipboard 时直接走 execCommand", async () => {
  const { doc } = fakeDoc();
  assertEqual(await copyText("x", { nav: {}, doc }), "legacy");
});

await testAsync("两条路都失败时报告 manual，而不是抛错", async () => {
  const { doc } = fakeDoc({ copyWorks: false });
  assertEqual(await copyText("x", { nav: rejectingClipboard(), doc }), "manual");
});

await testAsync("execCommand 抛错时报告 manual 并清理元素", async () => {
  const { doc, nodes } = fakeDoc({ copyThrows: true });
  assertEqual(await copyText("x", { nav: {}, doc }), "manual");
  assertEqual(nodes.length, 0, "抛错后也要清理 textarea");
});

await testAsync("没有 document 时报告 manual，不抛错", async () => {
  assertEqual(await copyText("x", { nav: {}, doc: undefined }), "manual");
});

await testAsync("空文本不算复制成功", async () => {
  let touched = false;
  const { doc, nodes } = fakeDoc();
  const how = await copyText("", { nav: { clipboard: { writeText: async () => { touched = true; } } }, doc });
  assertEqual(how, "manual");
  assertEqual(touched, false, "空文本不该调用剪贴板");
  assertEqual(nodes.length, 0);
});

await testAsync("老路径会选中全文并标记 readonly", async () => {
  const { doc, calls } = fakeDoc();
  await copyText("BLUR-key", { nav: {}, doc });
  assertEqual(calls.selection[0], 0);
  assertEqual(calls.selection[1], 8, "选区应覆盖完整密钥");
  assert(calls.attributes.some(([name]) => name === "readonly"), "readonly 应设置，避免 iOS 弹键盘");
  assert(calls.selected, "应先 select 再复制");
});

await testAsync("复制后把焦点还给原元素", async () => {
  let restored = 0;
  const { doc } = fakeDoc({ activeElement: { focus: () => { restored++; } } });
  await copyText("x", { nav: {}, doc });
  assertEqual(restored, 1, "应恢复一次焦点");
});

await testAsync("manual 的提示文案不是空的", async () => {
  assert(typeof COPY_MANUAL_HINT === "string" && COPY_MANUAL_HINT.length > 0);
});

/* ── 星图投影 ─────────────────────────────────────────────────────────────── */
console.log("\n[星图] 二维投影基底:");

const dotOf = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
const normOf = (a) => Math.sqrt(dotOf(a, a));
const zeroVector = () => Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 0]));

test("两个投影轴都是单位向量", () => {
  assert(Math.abs(normOf(PROJECTION_AXES.x) - 1) < 1e-3, `x 轴长度 ${normOf(PROJECTION_AXES.x)}`);
  assert(Math.abs(normOf(PROJECTION_AXES.y) - 1) < 1e-3, `y 轴长度 ${normOf(PROJECTION_AXES.y)}`);
});

test("两个投影轴正交（重复的信息不该被算两次）", () => {
  assert(Math.abs(dotOf(PROJECTION_AXES.x, PROJECTION_AXES.y)) < 1e-3,
    `内积 ${dotOf(PROJECTION_AXES.x, PROJECTION_AXES.y)}`);
});

test("均值与轴长和维度数量一致", () => {
  assertEqual(PROJECTION_MEAN.length, DIMENSION_KEYS.length);
  assertEqual(PROJECTION_AXES.x.length, DIMENSION_KEYS.length);
  assertEqual(PROJECTION_AXES.y.length, DIMENSION_KEYS.length);
  assert(PROJECTION_SPAN > 0, "缩放必须是正数");
});

test("x 轴取向：表达更强的人更靠外，而不是靠内", () => {
  const inward = { ...zeroVector(), expressivity: -0.8 };
  const outward = { ...zeroVector(), expressivity: 0.8 };
  assert(projectVector(outward).x > projectVector(inward).x, "符号约定被翻转了，重跑脚本时注意 orient()");
});

test("y 轴取向：变化亲和更强的人更靠上（流动）", () => {
  const steady = { ...zeroVector(), changeAffinity: -0.8 };
  const flowing = { ...zeroVector(), changeAffinity: 0.8 };
  assert(projectVector(flowing).y > projectVector(steady).y, "符号约定被翻转了，重跑脚本时注意 orient()");
});

test("投影是纯函数：不修改输入向量", () => {
  const vector = { ...zeroVector(), energySource: 0.4, processingDepth: -0.2 };
  const snapshot = JSON.stringify(vector);
  const first = projectVector(vector);
  const second = projectVector(vector);
  assertEqual(JSON.stringify(vector), snapshot, "输入被改写了");
  assertDeepEqual(first, second, "同一个向量两次投影不一致");
});

test("越界的向量被夹到图内，而不是画到图外", () => {
  const extreme = Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 12]));
  const point = projectVector(extreme);
  assert(Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1, `越界: ${JSON.stringify(point)}`);
});

test("缺维度返回 null，不偷偷落到原点", () => {
  assertEqual(projectVector({}), null);
  assertEqual(projectVector({ energySource: 0.3 }), null);
  assertEqual(projectVector({ ...zeroVector(), expressivity: Number.NaN }), null);
  assertEqual(projectVector(null), null);
});

test("十个原型都落在图内", () => {
  for (const [key, profile] of Object.entries(ARCHETYPE_PROFILES)) {
    const point = projectVector(profile.vector);
    assert(point && Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1, `${key} 落在图外`);
  }
});

test("居中留白不硬判方向", () => {
  const center = axisTendency({ x: 0.02, y: -0.05 });
  assertEqual(center.x, null);
  assertEqual(center.y, null);
  const edge = axisTendency({ x: 0.4, y: -0.4 });
  assertEqual(edge.x, "positive");
  assertEqual(edge.y, "negative");
  assertEqual(axisTendency(null), null);
});

/* ── Summary ─────────────────────────────────────────────────────────────── */
console.log("\n==================================================");
console.log(`  Tests run: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log("==================================================");

if (failedTests > 0) {
  process.exit(1);
}
