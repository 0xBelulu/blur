import { DIMENSION_KEYS } from './dimensions.js';

/**
 * 十维画像 → 二维星图的固定投影。
 *
 * 为什么是「固定基底」而不是每次现算：
 * 星图上的位置一旦出现，就不该在下次刷新时挪到别处。用脚本离线算一次
 * （`node scripts/compute-projection.js --apply`），把均值和两个主成分写死在这里，
 * 服务端和前端 import 同一份系数，投影结果永远一致，也不占请求时的 CPU。
 *
 * 轴的取向是人为约定的，不是算法自己决定的（特征向量的正负号本身没有意义）：
 *   x 正方向 = 表达 / 外放     x 负方向 = 向内 / 内省
 *   y 正方向 = 流动 / 开放     y 负方向 = 安定 / 边界
 * 脚本里按「expressivity 载荷为正」「changeAffinity 载荷为正」翻符号，
 * 所以重跑脚本不会把整张图翻个面。
 *
 * 二维只保留约 64% 的方差（PC1 37.7% + PC2 26.7%）。这意味着平面上很近的两个人
 * 未必真的相似——界面必须把位置说成近似，而不是精确距离。
 */
export const PROJECTION_VERSION = 'projection-v1';

/* 下面这段由 scripts/compute-projection.js 生成，不要手改。 */
// <generated>
export const PROJECTION_MEAN = [0.124, -0.108, 0.008, 0.201, -0.532, 0.385, 0.123, 0.299, -0.077, 0.075];
export const PROJECTION_AXES = {
  x: [0.468, -0.437, -0.191, 0.001, 0.198, -0.152, -0.001, -0.003, -0.51, 0.48],
  y: [0.011, 0.171, -0.015, 0.545, -0.355, -0.097, 0.575, 0.395, -0.224, 0.018],
};
/** 两个轴共用的缩放：同一个系数，平面上的距离比例才不会被拉歪。 */
export const PROJECTION_SPAN = 2.09;
// </generated>

/** 四个边缘标签。它们是坐标系的名字，不是数据。 */
export const PROJECTION_AXIS_COPY = {
  x: { negative: '向内', positive: '向外' },
  y: { negative: '安定', positive: '流动' },
};

const clamp = (value) => Math.max(-1, Math.min(1, value));

/**
 * 返回 [-1,1] 区间内的坐标；向量不完整时返回 null（宁可这个点不出现，
 * 也不要把它画到原点——原点在图上是有含义的，那是「居中」）。
 */
export function projectVector(vector) {
  if (!vector || typeof vector !== 'object') return null;
  let x = 0;
  let y = 0;
  for (let index = 0; index < DIMENSION_KEYS.length; index += 1) {
    const value = vector[DIMENSION_KEYS[index]];
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    const centered = value - PROJECTION_MEAN[index];
    x += PROJECTION_AXES.x[index] * centered;
    y += PROJECTION_AXES.y[index] * centered;
  }
  return { x: clamp(x / PROJECTION_SPAN), y: clamp(y / PROJECTION_SPAN) };
}

/** 一条坐标在图上偏向哪一侧。留白区间不硬判方向。 */
export function axisTendency(point, deadZone = 0.12) {
  if (!point) return null;
  return {
    x: Math.abs(point.x) < deadZone ? null : point.x > 0 ? 'positive' : 'negative',
    y: Math.abs(point.y) < deadZone ? null : point.y > 0 ? 'positive' : 'negative',
  };
}
