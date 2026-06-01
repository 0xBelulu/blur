/**
 * 通用心理维度定义
 * 新增人格时无需改动此文件 —— 维度是跨人格的通用语言
 */
export const DIMENSIONS = {
  energySource: {
    name: "能量来源",
    negative: "独处恢复",
    positive: "社交充电",
    negativeDesc: "你在安静与独处中慢慢积蓄能量",
    positiveDesc: "你从人群与对话里获得热量",
  },
  sensorySensitivity: {
    name: "感官敏感度",
    negative: "钝感/屏蔽",
    positive: "高敏/过载",
    negativeDesc: "你习惯把外界的音量调低",
    positiveDesc: "你的感官比大多数人更先抵达",
  },
  emotionalLatency: {
    name: "情绪延迟",
    negative: "即时反应",
    positive: "延迟/沉淀",
    negativeDesc: "情绪涌上来时你习惯立刻接住它",
    positiveDesc: "你的反应总是比别人慢半拍",
  },
  cognitiveRange: {
    name: "认知跨度",
    negative: "单一视角",
    positive: "多线程/多视角",
    negativeDesc: "你偏爱单线而深入的认知路径",
    positiveDesc: "你能同时在多个视角间跳跃",
  },
  boundaryClarity: {
    name: "边界清晰度",
    negative: "溶解/渗透",
    positive: "清晰/隔离",
    negativeDesc: "你与世界的边界常常是柔软的",
    positiveDesc: "你清楚哪里是自己，哪里是他人",
  },
  temporalDepth: {
    name: "时间纵深",
    negative: "当下/瞬时",
    positive: "深远/历史感",
    negativeDesc: "你活在此时此刻的瞬间",
    positiveDesc: "过去与未来总在当下交织",
  },
  changeAffinity: {
    name: "变化亲和",
    negative: "稳定/固守",
    positive: "流动/变化",
    negativeDesc: "熟悉的环境是你不愿移动的锚点",
    positiveDesc: "变化本身让你感到安心",
  },
  closureTolerance: {
    name: "闭合容忍",
    negative: "需要确定答案",
    positive: "容忍模糊/开放",
    negativeDesc: "悬而未决的状态会让你坐立不安",
    positiveDesc: "未完成的空白让你感到舒适",
  },
  processingDepth: {
    name: "处理深度",
    negative: "快速/表层",
    positive: "慢速/深层",
    negativeDesc: "直觉和行动往往先于深度思考",
    positiveDesc: "你习惯将事物咀嚼到深处",
  },
  expressivity: {
    name: "表达外显",
    negative: "内化/隐藏",
    positive: "外化/暴露",
    negativeDesc: "表达之前，你倾向于先向内折叠",
    positiveDesc: "你的内心很少被真正隐藏起来",
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
