/**
 * 把实时解算出的原型权重，翻译成光学场可以直接消费的空间符号表。
 *
 * 槽位布局原样取自 Landing 的 SPATIAL_SYMBOLS（前 14 个），再补 6 个填满中景。
 * 位置 / 景深 / 漂移速度全部固定，只有"这个槽位当前代表哪个原型"会随答案变化，
 * 所以权重更新时不会重排、不会跳位，只会淡入新的字形。
 */

const SLOT_LAYOUT = [
  { x: 78, y: 70, z: 0.16, driftSpeed: 0.7, phase: 0.4 },
  { x: 91, y: 22, z: 0.22, driftSpeed: 1.1, phase: 2.1 },
  { x: 12, y: 16, z: 0.28, driftSpeed: 0.8, phase: 1.3 },
  { x: 44, y: 82, z: 0.32, driftSpeed: 0.9, phase: 3.2 },
  { x: 88, y: 46, z: 0.42, driftSpeed: 1.0, phase: 4.5 },
  { x: 53, y: 13, z: 0.48, driftSpeed: 0.6, phase: 0.8 },
  { x: 26, y: 24, z: 0.52, driftSpeed: 1.2, phase: 5.1 },
  { x: 84, y: 84, z: 0.58, driftSpeed: 0.5, phase: 2.7 },
  { x: 67, y: 86, z: 0.62, driftSpeed: 0.7, phase: 1.9 },
  { x: 7, y: 56, z: 0.68, driftSpeed: 0.8, phase: 3.8 },
  { x: 19, y: 82, z: 0.76, driftSpeed: 0.6, phase: 4.1 },
  { x: 81, y: 14, z: 0.82, driftSpeed: 0.9, phase: 0.2 },
  { x: 34, y: 90, z: 0.88, driftSpeed: 0.5, phase: 5.6 },
  { x: 5, y: 38, z: 0.92, driftSpeed: 0.7, phase: 2.9 },
  { x: 62, y: 58, z: 0.24, driftSpeed: 1.0, phase: 3.5 },
  { x: 38, y: 42, z: 0.36, driftSpeed: 0.75, phase: 1.1 },
  { x: 56, y: 68, z: 0.5, driftSpeed: 0.95, phase: 4.8 },
  { x: 24, y: 60, z: 0.64, driftSpeed: 0.65, phase: 2.3 },
  { x: 74, y: 32, z: 0.78, driftSpeed: 0.85, phase: 5.4 },
  { x: 46, y: 26, z: 0.9, driftSpeed: 0.55, phase: 0.9 },
];

/** 做题页的焦平面。z 落在这附近的符号最清楚，越远越糊 */
export const PERSONA_FOCAL_Z = 0.4;

/** 权重拉开的景深幅度：低权重符号被推到焦平面两侧多远 */
const DEFOCUS_SPREAD = 0.5;

/**
 * 显影曲线：决定"画面里到底有多少 emoji 存在"。
 *
 * 第 REVEAL_FROM 题之前完全不显影（只剩 AtmosphereField 的水彩底光），
 * 第 REVEAL_TO 题（≈ 基本画像就绪之前）完全显影。
 *
 * 机制：显影度低 → 所有符号被整体推离焦平面 → 弥散圆公式给出 11~13px 模糊
 * → 不透明度落到 0.16 下限 → 视觉上消失。这是刻意的，不是副作用。
 */
export const REVEAL_FROM = 1;
export const REVEAL_TO = 8;

export function revealAt(answeredCount) {
  const t = Math.min(
    1,
    Math.max(0, (answeredCount - REVEAL_FROM) / (REVEAL_TO - REVEAL_FROM)),
  );
  // smoothstep，避免第 3 题突然冒出一片
  return t * t * (3 - 2 * t);
}

/**
 * 最大余数法：把 20 个槽位按权重分给 10 个原型，保证总和恰好等于槽位数
 *
 * DISPLAY_SHARPNESS 只影响"屏幕上 emoji 的数量分布"，不参与任何评分。
 * 解算出来的概率本身很平（softmax T=2），直接按比例分槽位会得到 5/4/2/2/2/1/1/1/1/1 这种
 * 几乎看不出差别的结果，所以这里做一次纯展示用的锐化。
 */
const DISPLAY_SHARPNESS = 1.6;

function allocateSlots(field, total) {
  const sharpened = field.map((item) => Math.pow(item.weight, DISPLAY_SHARPNESS));
  const sum = sharpened.reduce((acc, value) => acc + value, 0) || 1;

  const raw = sharpened.map((value) => (value / sum) * total);
  const counts = raw.map(Math.floor);
  const remainder = total - counts.reduce((a, b) => a + b, 0);

  const byFraction = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < remainder; k += 1) {
    counts[byFraction[k % byFraction.length].index] += 1;
  }

  return counts;
}

export function buildPersonaSymbols(field, reveal = 1) {
  if (!field || field.length === 0) return [];

  const total = SLOT_LAYOUT.length;
  const counts = allocateSlots(field, total);
  const maxWeight = Math.max(...field.map((item) => item.weight), 0.0001);

  // 轮转展开：A B C … J A B …，让同一原型的多个槽位在画面上散开而不是挤在一起
  const expanded = [];
  const maxCount = Math.max(...counts);
  for (let k = 0; k < maxCount; k += 1) {
    field.forEach((item, index) => {
      if (counts[index] > k) expanded.push(item);
    });
  }

  // 还没显影时整体把符号推离焦平面，画面保持弥散
  const undecided = (1 - reveal) * 0.45;

  return SLOT_LAYOUT.map((slot, i) => {
    const arch = expanded[i] || field[i % field.length];
    const relative = arch.weight / maxWeight;

    // 权重决定景深：高权重落在焦平面上（清楚），低权重被推向两侧（糊）
    const side = slot.z > 0.5 ? 1 : -1;
    const depth =
      PERSONA_FOCAL_Z +
      ((1 - relative) * DEFOCUS_SPREAD + undecided) * side +
      (slot.z - 0.5) * 0.1;

    return {
      id: `slot-${i}`,
      symbol: arch.symbol,
      x: slot.x,
      y: slot.y,
      z: Math.max(0.16, Math.min(0.92, depth)),
      driftSpeed: slot.driftSpeed,
      phase: slot.phase,
    };
  });
}
