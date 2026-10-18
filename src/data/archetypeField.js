// 探索页漂浮场的原型符号表。
// 字段与 optical/symbols.js 的 SPATIAL_SYMBOLS 完全一致 —— 同一套引擎、同一套物理。
// id 必须对应 archetypeProfiles / archetypeDescriptions 的键，
// 页面靠 onFocusChange 回传的 item.id 反查那一枚原型的名字与自述。

export const ARCHETYPE_SYMBOLS = [
  // 前景组（近焦平面，失焦时弥散更快，靠近才清晰）
  { id: "negative", symbol: "🎞️", x: 70, y: 56, mobileX: 74, mobileY: 58, z: 0.24, driftSpeed: 0.7, phase: 1.8 },
  { id: "kite", symbol: "🪁", x: 56, y: 80, mobileX: 58, mobileY: 84, z: 0.32, driftSpeed: 0.9, phase: 3.2 },
  { id: "warmCurrent", symbol: "♨️", x: 62, y: 18, mobileX: 64, mobileY: 14, z: 0.38, driftSpeed: 0.8, phase: 0.6 },
  { id: "mist", symbol: "🌫️", x: 10, y: 30, mobileX: 10, mobileY: 28, z: 0.44, driftSpeed: 1.0, phase: 2.4 },

  // 中景组（主对焦层）
  { id: "tide", symbol: "🌊", x: 90, y: 74, mobileX: 90, mobileY: 76, z: 0.5, driftSpeed: 0.6, phase: 4.1 },
  { id: "rainbow", symbol: "🌈", x: 18, y: 64, mobileX: 16, mobileY: 66, z: 0.56, driftSpeed: 1.1, phase: 5.3 },
  { id: "crystal", symbol: "💎", x: 86, y: 32, mobileX: 86, mobileY: 34, z: 0.66, driftSpeed: 0.7, phase: 2.9 },
  { id: "silhouette", symbol: "📷", x: 30, y: 84, mobileX: 28, mobileY: 88, z: 0.74, driftSpeed: 0.8, phase: 0.9 },

  // 远景组（深场景深，像散景光斑）
  { id: "chime", symbol: "🎐", x: 34, y: 12, mobileX: 36, mobileY: 8, z: 0.82, driftSpeed: 0.9, phase: 3.7 },
  { id: "salt", symbol: "🧂", x: 44, y: 46, mobileX: 44, mobileY: 46, z: 0.92, driftSpeed: 0.5, phase: 1.3 },
];
