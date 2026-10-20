/**
 * 10 个维度 key 的结构契约。
 *
 * 服务端按它校验画像字段（shared/profile.js），前端按它算向量、排序、渲染。
 * 它以前只写在 src/data/dimensions.js 里，于是 shared/profile.js 反过来
 * import src/ —— 共享层成了假边界，Worker 打包能不能过全看 src 里恰好没有 DOM。
 *
 * 现在契约放在 shared，dimensions.js 从这里取；`scripts/unit-tests.js`
 * 有一条断言保证 DIMENSIONS 的键序与本列表逐项一致，改维度会立刻失败。
 * 顺序有意义：向量按这个顺序累加，历史记录依赖它保持稳定。
 */
export const DIMENSION_KEYS = [
  'energySource',
  'sensorySensitivity',
  'emotionalLatency',
  'cognitiveRange',
  'boundaryClarity',
  'temporalDepth',
  'changeAffinity',
  'closureTolerance',
  'processingDepth',
  'expressivity',
];
