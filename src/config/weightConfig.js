/**
 * 评分权重配置
 *
 * 权重是核心评分算法的关键参数，直接影响用户最终的原型匹配结果。
 * 将权重配置独立于算法实现，便于维护、调优和 A/B 测试。
 *
 * 调优指南：
 * - 修改权重后需要重新评估原型匹配结果的合理性
 * - 建议通过 A/B 测试验证新权重配置的效果
 * - 权重调整应保持相对比例关系，避免极端值
 */

export const WEIGHT_CONFIG = {
  rankWeights: {
    description: "排序题权重，对应 rankOrder 中的位置索引",
    values: [1.0, 0.6, 0.3, 0.1],
    defaultValue: 0,
  },

  scaleWeights: {
    description: "量表题权重，对应用户选择的量表值（0=非常不同意 … 5=非常同意）",
    values: [0, 0.4, 0.7, 1.0, 1.3, 1.6],
    defaultValue: 1.0,
  },
};

export function getRankWeight(rank) {
  const { values, defaultValue } = WEIGHT_CONFIG.rankWeights;
  return values[rank] ?? defaultValue;
}

export function getScaleWeight(scaleValue) {
  const { values, defaultValue } = WEIGHT_CONFIG.scaleWeights;
  return values[scaleValue] ?? defaultValue;
}
