const SCENES = {
  energySource: ['忙了一周的周末', '这次想约朋友出门，还是各自安静待一会儿？'],
  sensorySensitivity: ['一起待在人多的地方', '哪些细节让你觉得舒服，哪些会让你有点累？'],
  emotionalLatency: ['有件事让心情起了波动', '你更想当场聊开，还是过一阵子再说？'],
  cognitiveRange: ['一起想一个新点子', '先把一个想法挖深，还是多试几条路？'],
  boundaryClarity: ['安排一段共同的时间', '哪些事情想一起做，哪些空间想留给自己？'],
  temporalDepth: ['聊到接下来的日子', '眼前的体验和远一点的打算，你更常先想起哪个？'],
  changeAffinity: ['原来的计划突然变了', '临时换个方向，你会觉得有趣还是想先稳一稳？'],
  closureTolerance: ['一件事暂时没有答案', '想先有个结论，还是愿意留着再看看？'],
  processingDepth: ['看完同一部电影', '你会很快翻篇，还是回家后继续琢磨？'],
  expressivity: ['遇到一件很喜欢的事', '你会直接说出来，还是用一些小动作表达？'],
};

export function comparisonPrompts(dimensions) {
  if (!dimensions.length) return [];
  const closest = dimensions[0];
  const furthest = dimensions.at(-1);
  const selected = [{ dimension: closest, label: closest.gap <= 0.3 ? '一个相近的侧面' : '相对接近的侧面' }];
  if (furthest.key !== closest.key && furthest.gap >= 0.35) selected.push({ dimension: furthest, label: '节奏不同的地方' });
  return selected.map((item) => ({ ...item, scene: SCENES[item.dimension.key]?.[0], question: SCENES[item.dimension.key]?.[1] }));
}
