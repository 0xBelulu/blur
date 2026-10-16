/**
 * 通用心理维度定义
 * 新增人格时无需改动此文件 —— 维度是跨人格的通用语言
 */
export const DIMENSIONS = {
  energySource: {
    name: "能量来源",
    negative: "独处蓄能",
    positive: "社交共振",
    negativeDesc: "你在安静与独处中慢慢积蓄力量",
    positiveDesc: "你在人群与互动中激发灵感与热量",
  },
  sensorySensitivity: {
    name: "感官敏感度",
    negative: "专注锚定",
    positive: "敏锐共情",
    negativeDesc: "你自带抗噪护盾，专注在自己的重心",
    positiveDesc: "你能捕捉到空气里最细微的情绪与信号",
  },
  emotionalLatency: {
    name: "情绪延迟",
    negative: "敏捷直截",
    positive: "从容沉淀",
    negativeDesc: "感受鲜明，你习惯即刻表达真实态度",
    positiveDesc: "情绪需要时间慢慢在心底沉淀与落定",
  },
  cognitiveRange: {
    name: "认知跨度",
    negative: "聚焦纵深",
    positive: "广阔跳跃",
    negativeDesc: "你偏爱单线打穿核心，保持深度聚焦",
    positiveDesc: "你能同时在多个视角与可能性间跳跃",
  },
  boundaryClarity: {
    name: "边界清晰度",
    negative: "包容相溶",
    positive: "界限笃定",
    negativeDesc: "你与世界的边界柔软，能自然融入环境",
    positiveDesc: "你界限分明，清楚哪里是自己哪里是他人",
  },
  temporalDepth: {
    name: "时间纵深",
    negative: "沉浸当下",
    positive: "远见回溯",
    negativeDesc: "你专注此时此刻的体验与行动",
    positiveDesc: "过去与未来总在你的当下交织回响",
  },
  changeAffinity: {
    name: "变化亲和",
    negative: "守护稳定",
    positive: "拥抱未知",
    negativeDesc: "熟悉的环境与秩序是你不愿动摇的锚点",
    positiveDesc: "变化与未知的可能性让你充满活力",
  },
  closureTolerance: {
    name: "闭合容忍",
    negative: "追求笃定",
    positive: "留白开放",
    negativeDesc: "你喜欢事情被清晰敲定并推进闭环",
    positiveDesc: "悬而未决与未完成的留白让你感到自在",
  },
  processingDepth: {
    name: "处理深度",
    negative: "直觉行动",
    positive: "深度推敲",
    negativeDesc: "直觉先行，你更习惯边做边看边调整",
    positiveDesc: "你习惯向内推敲事物的底层脉络与逻辑",
  },
  expressivity: {
    name: "表达外显",
    negative: "内蓄克制",
    positive: "直率坦荡",
    negativeDesc: "表达之前，你倾向于先向内沉淀与折叠",
    positiveDesc: "情绪透明，你习惯坦诚真切地面对世界",
  },
};

export const DIMENSION_KEYS = Object.keys(DIMENSIONS);

/**
 * 一次性映射：旧 trait 标签 → 通用维度增量
 * 用于批量转换题目文件，长期不需要维护
 */
export const TRAIT_DIMENSION_MAP = {
  // 雾系 — 防御性模糊
  shielded: { boundaryClarity: 1.0, expressivity: -0.6 },
  softedge: { boundaryClarity: -0.8, expressivity: -0.3 },
  filtered: { sensorySensitivity: -0.8, boundaryClarity: 0.4 },
  vague: { closureTolerance: 1.0, cognitiveRange: 0.4 },
  misty: { expressivity: -0.9, boundaryClarity: 0.5 },
  guarded: { expressivity: -0.9, energySource: -0.4 },
  faded: { temporalDepth: 0.8, expressivity: -0.4 },

  // 风铃系 — 过载性模糊
  saturated: { sensorySensitivity: 1.0, energySource: -0.3 },
  acute: { sensorySensitivity: 1.0, expressivity: 0.4 },
  reverberant: { processingDepth: 0.8, emotionalLatency: 0.6 },
  overwhelming: { sensorySensitivity: 0.9, expressivity: 0.3 },
  thunder: { expressivity: 0.8, sensorySensitivity: 0.6 },
  loud: { expressivity: 1.0 },

  // 漂流者系 — 流动性模糊
  adrift: { changeAffinity: 1.0, energySource: -0.7 },
  fleeing: { changeAffinity: 0.9, boundaryClarity: -0.4 },
  unmoored: { changeAffinity: 0.8, boundaryClarity: -0.6 },
  shifting: { changeAffinity: 1.0, boundaryClarity: -0.3 },
  tidal: { changeAffinity: 0.6, temporalDepth: -0.5, emotionalLatency: 0.4 },
  fluid: { changeAffinity: 0.8, boundaryClarity: -0.4 },

  // 静观者系 — 时间性模糊
  patient: { temporalDepth: 0.9, processingDepth: 0.5 },
  sunken: { processingDepth: 0.9, emotionalLatency: 0.5 },
  abyssal: { processingDepth: 1.0, temporalDepth: 0.4 },
  sedimentary: { temporalDepth: 0.9, processingDepth: 0.6 },
  stilled: { energySource: -0.9, expressivity: -0.7 },
  deepwatch: { processingDepth: 0.9, expressivity: -0.5 },

  // 虹系 — 认知性模糊
  manifold: { cognitiveRange: 1.0 },
  equivocal: { closureTolerance: 0.9, cognitiveRange: 0.5 },
  prismatic: { cognitiveRange: 1.0, sensorySensitivity: 0.4 },
  refracted: { cognitiveRange: 0.7, changeAffinity: 0.3 },
  suspended: { emotionalLatency: 0.6, closureTolerance: 0.8 },

  // 盐系 — 渗透性模糊
  dissolving: { boundaryClarity: -1.0 },
  permeable: { boundaryClarity: -0.8, sensorySensitivity: 0.5 },
  osmotic: { boundaryClarity: -0.9, sensorySensitivity: 0.3 },
  blended: { boundaryClarity: -0.9, cognitiveRange: 0.3 },
  absorbing: { sensorySensitivity: 0.9, boundaryClarity: -0.6 },
  seeping: { boundaryClarity: -0.7, changeAffinity: 0.4 },

  // 底片系 — 延迟性模糊
  latent: { emotionalLatency: 0.9, expressivity: -0.3 },
  delayed: { emotionalLatency: 1.0 },
  inverse: { cognitiveRange: 0.6, expressivity: -0.5 },
  undeveloped: { emotionalLatency: 0.7, expressivity: -0.6 },
  darkroom: { energySource: -0.9, processingDepth: 0.7 },
  belated: { emotionalLatency: 0.8 },

  // 潮汐系 — 节律性模糊
  oscillating: { changeAffinity: 0.7, emotionalLatency: 0.4 },
  rhythmic: { changeAffinity: 0.8, temporalDepth: -0.3 },
  ebbing: { changeAffinity: 0.5, energySource: -0.7 },
  swelling: { changeAffinity: 0.6, expressivity: 0.7 },
  cyclical: { changeAffinity: 0.8, temporalDepth: -0.4 },
  pulsing: { changeAffinity: 0.5, sensorySensitivity: 0.6 },

  // 剪影系 — 方向性模糊
  outlined: { boundaryClarity: 1.0, expressivity: -0.5 },
  backlit: { expressivity: -0.8, cognitiveRange: 0.3 },
  partial: { expressivity: -0.7, boundaryClarity: 0.6 },
  angled: { cognitiveRange: 0.7, expressivity: -0.5 },
  shadowed: { expressivity: -0.9 },
  edgeonly: { boundaryClarity: 0.9, expressivity: -0.6 },
};

/**
 * 将旧 traits 数组转换为 dimensions 对象
 * 用于一次性批量转换题目文件
 */
export function convertTraitsToDimensions(traits) {
  const dims = {};
  for (const trait of traits) {
    const map = TRAIT_DIMENSION_MAP[trait];
    if (!map) continue;
    for (const [key, val] of Object.entries(map)) {
      dims[key] = (dims[key] || 0) + val;
    }
  }
  return dims;
}
