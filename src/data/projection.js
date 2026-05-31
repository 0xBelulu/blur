/**
 * 10维通用人格空间 → 3D 投影矩阵
 *
 * 所有用户向量与人格向量均通过此矩阵投影到 3D 空间，
 * 供 VectorSpace3D 组件可视化。
 *
 * 新增人格时无需改动此文件。
 */
export const PROJECTION_MATRIX = {
  x: {
    boundaryClarity: 0.40,
    cognitiveRange: 0.20,
    closureTolerance: 0.15,
    changeAffinity: -0.15,
    expressivity: -0.10,
  },
  y: {
    sensorySensitivity: 0.35,
    expressivity: 0.30,
    energySource: 0.20,
    changeAffinity: 0.15,
  },
  z: {
    processingDepth: 0.35,
    temporalDepth: 0.25,
    emotionalLatency: 0.20,
    changeAffinity: -0.10,
    cognitiveRange: 0.10,
  },
};

/**
 * 将 10 维向量投影到 3D 空间
 * @param {Record<string, number>} vector — 10 维向量
 * @returns {[number, number, number]} — [x, y, z]
 */
export function projectTo3D(vector) {
  const dim = (axisKey) => {
    const weights = PROJECTION_MATRIX[axisKey];
    let sum = 0;
    for (const [dimKey, w] of Object.entries(weights)) {
      sum += (vector[dimKey] || 0) * w;
    }
    return sum;
  };

  const x = dim("x");
  const y = dim("y");
  const z = dim("z");

  // 归一化到 [-1, 1] 单位球附近，保持方向
  const len = Math.sqrt(x * x + y * y + z * z);
  if (len < 0.001) return [0, 0, 0];

  // 软归一化：不完全压到球面，保留距离信息
  const scale = Math.tanh(len * 1.2) / len;
  return [x * scale, y * scale, z * scale];
}
