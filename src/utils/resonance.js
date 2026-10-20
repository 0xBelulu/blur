/**
 * 结果页「光谱共振」读数的唯一实现。
 *
 * 这里算的不是概率，是相对刻度：把 10 个原型的 softmax 概率压到 0–100，
 * 最像的那个是 100，最不像的那个是 0。它只能用来横向比较这 10 个原型，
 * 不能读成「你有 87% 是雾面」——真实占比请用 probabilityPercent()。
 *
 * 历史包袱：旧实现在 Result.jsx 和 DimensionMeters.jsx 各有一份，
 * 都用 Math.max(10, …) 兜底，于是每个用户看到的最低值恒为 10%、最高值恒为 100%。
 * 那个下限是画出来的，不是算出来的，已经去掉——现在的 0 是真的 0。
 */

// 幂次压缩让中间档位分得开一点；不影响端点的含义。
const EXPONENT = 0.7;

/**
 * 传入 similarities（[{ prob }]），返回 prob → 0–100 的相对共振度。
 * 全部概率相等时（理论上只有 0 题才会出现）返回 0，不做无意义的除法。
 */
export function resonanceScale(similarities) {
  const probs = similarities.map((item) => item.prob);
  const min = Math.min(...probs);
  const max = Math.max(...probs);
  const span = max - min;
  return (prob) => {
    if (!(span > 0)) return 0;
    return Math.pow((prob - min) / span, EXPONENT) * 100;
  };
}

/** 真实占比，用于需要「这是概率」语义的地方。 */
export function probabilityPercent(prob) {
  return Math.round((prob || 0) * 100);
}
