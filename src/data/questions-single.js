export const singleQuestions = [
  {
    id: 1,
    type: "single",
    text: "当你走进一间陌生的房间，你最先注意到的是？",
    options: [
      { id: "a", text: "阴影和角落，下意识想降低存在感", dimensions: {
      boundaryClarity: 0.2,
      expressivity: -0.9,
    } },
      { id: "b", text: "所有细节同时涌来，需要缓一缓", dimensions: {
      sensorySensitivity: 2,
      expressivity: 0.4,
      energySource: -0.3,
    } },
      { id: "c", text: "出口在哪，随时准备离开", dimensions: {
      changeAffinity: 1.9,
      boundaryClarity: -0.4,
      energySource: -0.7,
    } },
      { id: "d", text: "光线如何变化，像在等待什么发生", dimensions: {
      processingDepth: 1.4,
      temporalDepth: 0.9,
      emotionalLatency: 0.5,
    } },
    ],
  },
  {
    id: 2,
    type: "single",
    text: "深夜失眠时，你的大脑更像？",
    options: [
      { id: "a", text: "一盏调暗的灯，只照亮一小片", dimensions: {
      closureTolerance: 1,
      boundaryClarity: 0.4,
      cognitiveRange: 0.4,
      sensorySensitivity: -0.8,
    } },
      { id: "b", text: "一台收不到台的电视，雪花噪音", dimensions: {
      sensorySensitivity: 0.9,
      processingDepth: 0.8,
      emotionalLatency: 0.6,
      expressivity: 0.3,
    } },
      { id: "c", text: "同时打开十个网页，不知先看哪个", dimensions: {
      cognitiveRange: 1.5,
      closureTolerance: 0.9,
    } },
      { id: "d", text: "一口深井，声音落进去没有回响", dimensions: {
      processingDepth: 1,
      temporalDepth: 0.4,
      expressivity: -0.7,
      energySource: -0.9,
    } },
    ],
  },
  {
    id: 3,
    type: "single",
    text: "如果可以选择一种天气度过一整天？",
    options: [
      { id: "a", text: "大雾，能见度不到十米", dimensions: {
      boundaryClarity: 0.5,
      energySource: -0.4,
      expressivity: -1.8,
    } },
      { id: "b", text: "雷暴，雨声盖过一切", dimensions: {
      expressivity: 1.8,
      sensorySensitivity: 0.6,
    } },
      { id: "c", text: "涨潮，海水不断改变边界", dimensions: {
      changeAffinity: 1.6,
      emotionalLatency: 0.4,
      boundaryClarity: -0.3,
      temporalDepth: -0.5,
    } },
      { id: "d", text: "深海，光线从上面一点点消失", dimensions: {
      processingDepth: 1.5,
      temporalDepth: 0.9,
      expressivity: -0.5,
    } },
    ],
  },
  {
    id: 4,
    type: "single",
    text: "你更可能被什么样的画面打动？",
    options: [
      { id: "a", text: "一个人站在雾气里，背影模糊", dimensions: {
      closureTolerance: 1,
      cognitiveRange: 0.4,
      expressivity: -0.3,
      boundaryClarity: -0.8,
    } },
      { id: "b", text: "闪电照亮夜海的瞬间", dimensions: {
      sensorySensitivity: 2,
      expressivity: 0.4,
      energySource: -0.3,
    } },
      { id: "c", text: "一个人拖着行李走进未知街道", dimensions: {
      changeAffinity: 1.8,
      boundaryClarity: -0.6,
      energySource: -0.7,
    } },
      { id: "d", text: "水下气泡缓慢上升破裂", dimensions: {
      temporalDepth: 0.9,
      processingDepth: 0.5,
      expressivity: -0.7,
      energySource: -0.9,
    } },
    ],
  },
  {
    id: 5,
    type: "single",
    text: "当别人问你「你好吗」，你通常？",
    options: [
      { id: "a", text: "笑一下，然后反问对方", dimensions: {
      boundaryClarity: 1.4,
      expressivity: -0.6,
      sensorySensitivity: -0.8,
    } },
      { id: "b", text: "愣住，因为脑子里同时在想很多事", dimensions: {
      sensorySensitivity: 0.9,
      processingDepth: 0.8,
      emotionalLatency: 0.6,
      expressivity: 0.3,
    } },
      { id: "c", text: "认真想一会儿，给出一个复杂的答案", dimensions: {
      cognitiveRange: 1,
      closureTolerance: 0.8,
      emotionalLatency: 0.6,
    } },
      { id: "d", text: "沉默，等话题自然滑走", dimensions: {
      processingDepth: 1.9,
      emotionalLatency: 0.5,
      temporalDepth: 0.4,
    } },
    ],
  },
  {
    id: 6,
    type: "single",
    text: "如果记忆是一间房间，你的房间？",
    options: [
      { id: "a", text: "拉着纱帘，只有柔和的光斑", dimensions: {
      boundaryClarity: 0.5,
      energySource: -0.4,
      expressivity: -1.8,
    } },
      { id: "b", text: "回声很大，说一句话绕三圈", dimensions: {
      expressivity: 1.8,
      sensorySensitivity: 0.6,
    } },
      { id: "c", text: "没有固定形状，家具总被搬动", dimensions: {
      changeAffinity: 1.8,
      boundaryClarity: -0.7,
    } },
      { id: "d", text: "很深，东西沉在底部要潜水去找", dimensions: {
      processingDepth: 1.5,
      temporalDepth: 0.9,
      expressivity: -0.5,
    } },
    ],
  },
  {
    id: 7,
    type: "single",
    text: "你觉得最像自己的一种颜色？",
    options: [
      { id: "a", text: "被水洗过很多次的灰蓝", dimensions: {
      closureTolerance: 1,
      temporalDepth: 0.8,
      cognitiveRange: 0.4,
      expressivity: -0.4,
    } },
      { id: "b", text: "闪电瞬间的白，刺目但短暂", dimensions: {
      expressivity: 1.4,
      sensorySensitivity: 1,
    } },
      { id: "c", text: "深海里最后消失的那层蓝", dimensions: {
      processingDepth: 1.9,
      emotionalLatency: 0.5,
      temporalDepth: 0.4,
    } },
      { id: "d", text: "雨后天空同时出现几种颜色", dimensions: {
      cognitiveRange: 1.7,
      sensorySensitivity: 0.4,
      changeAffinity: 0.3,
    } },
    ],
  },
  {
    id: 8,
    type: "single",
    text: "如果明天可以消失一天，你会？",
    options: [
      { id: "a", text: "待在家，拉上窗帘，假装不在家", dimensions: {
      boundaryClarity: 1.4,
      expressivity: -0.6,
      sensorySensitivity: -0.8,
      changeAffinity: -0.8,
    } },
      { id: "b", text: "去人群中，但戴上耳机隔绝声音", dimensions: {
      sensorySensitivity: 1.9,
      expressivity: 0.3,
      energySource: -0.3,
    } },
      { id: "c", text: "买一张去未知城市的车票", dimensions: {
      changeAffinity: 1.7,
      boundaryClarity: -1,
    } },
      { id: "d", text: "去一个很深很安静的地方待着", dimensions: {
      temporalDepth: 0.9,
      processingDepth: 0.5,
      expressivity: -0.7,
      energySource: -0.9,
    } },
    ],
  },
  {
    id: 9,
    type: "single",
    text: "你最容易对什么样的人产生好感？",
    options: [
      { id: "a", text: "让你感到安全、不刺眼的人", dimensions: {
      energySource: -0.4,
      boundaryClarity: -0.8,
      expressivity: -1.2,
    } },
      { id: "b", text: "笑起来有破绽的人", dimensions: {
      sensorySensitivity: 1,
      expressivity: 0.1,
      boundaryClarity: -0.8,
    } },
      { id: "c", text: "从不追问你要去哪的人", dimensions: {
      changeAffinity: 1.8,
      boundaryClarity: -0.4,
      energySource: -0.7,
    } },
      { id: "d", text: "能安静陪你，不说多余话的人", dimensions: {
      processingDepth: 1.9,
      temporalDepth: 0.4,
      expressivity: -0.5,
    } },
    ],
  },
  {
    id: 10,
    type: "single",
    text: "如果人生是一张照片，你希望它是？",
    options: [
      { id: "a", text: "失焦的，但氛围很对", dimensions: {
      closureTolerance: 1,
      boundaryClarity: 0.5,
      cognitiveRange: 0.4,
      expressivity: -0.9,
    } },
      { id: "b", text: "过曝的，所有细节都太亮", dimensions: {
      sensorySensitivity: 1,
      expressivity: 1,
      energySource: -0.3,
    } },
      { id: "c", text: "长曝光，轨迹模糊成一条线", dimensions: {
      changeAffinity: 1.6,
      emotionalLatency: 0.4,
      boundaryClarity: -0.3,
      temporalDepth: -0.5,
    } },
      { id: "d", text: "深海微距，暗处有未知的光", dimensions: {
      processingDepth: 1.5,
      temporalDepth: 0.9,
      emotionalLatency: 0.5,
    } },
    ],
  },
  {
    id: 11,
    type: "single",
    text: "你手机里最多的是哪类照片？",
    options: [
      { id: "a", text: "天空和光影变化——同一个角度的不同天色", dimensions: {
      closureTolerance: 1,
      boundaryClarity: 0.5,
      cognitiveRange: 0.4,
      expressivity: -0.9,
    } },
      { id: "b", text: "随手拍的食物、街头文字、没整理的日常碎片", dimensions: {
      sensorySensitivity: 1.9,
      expressivity: 0.7,
    } },
      { id: "c", text: "不同城市的街景和站牌，几乎没有重复", dimensions: {
      changeAffinity: 1.7,
      boundaryClarity: -1,
    } },
      { id: "d", text: "水面倒影、橱窗玻璃、被光线切碎的瞬间", dimensions: {
      cognitiveRange: 1.7,
      sensorySensitivity: 0.4,
      changeAffinity: 0.3,
    } },
    ],
  },
  {
    id: 12,
    type: "single",
    text: "你更害怕哪种感觉？",
    options: [
      { id: "a", text: "突然成为所有人的焦点，无处可躲", dimensions: {
      boundaryClarity: 0.2,
      expressivity: -0.9,
    } },
      { id: "b", text: "被所有人遗忘，手机再也没有新消息", dimensions: {
      processingDepth: 0.8,
      expressivity: 0.8,
      emotionalLatency: 0.6,
      sensorySensitivity: 0.6,
    } },
      { id: "c", text: "日复一日过一模一样的生活，看不到尽头", dimensions: {
      changeAffinity: 1.8,
      boundaryClarity: -0.7,
    } },
      { id: "d", text: "被人逼着选边站，明明两边都有道理", dimensions: {
      closureTolerance: 1.7,
      emotionalLatency: 0.6,
      cognitiveRange: 0.5,
    } },
    ],
  },
  {
    id: 13,
    type: "single",
    text: "你理想中的周末？",
    options: [
      { id: "a", text: "一个人在家，窗帘半拉，光线柔和", dimensions: {
      boundaryClarity: 0.4,
      energySource: -0.4,
      sensorySensitivity: -0.8,
      expressivity: -0.9,
    } },
      { id: "b", text: "听很吵的音乐，让声音盖过想法", dimensions: {
      expressivity: 1,
      sensorySensitivity: 1,
      energySource: -0.3,
    } },
      { id: "c", text: "去一个从没去过的地方，无目的漫步", dimensions: {
      changeAffinity: 1.6,
      emotionalLatency: 0.4,
      temporalDepth: -0.5,
      energySource: -0.7,
    } },
      { id: "d", text: "什么都不做，等时间自己过去", dimensions: {
      temporalDepth: 0.9,
      processingDepth: 0.5,
      expressivity: -0.7,
      energySource: -0.9,
      changeAffinity: -0.8,
    } },
    ],
  },
  {
    id: 14,
    type: "single",
    text: "听到一首喜欢的歌，你会？",
    options: [
      { id: "a", text: "调低音量，只在背景存在", dimensions: {
      expressivity: -0.3,
      boundaryClarity: -0.4,
      sensorySensitivity: -0.8,
    } },
      { id: "b", text: "单曲循环到耳朵发麻", dimensions: {
      sensorySensitivity: 0.9,
      processingDepth: 0.8,
      emotionalLatency: 0.6,
      expressivity: 0.3,
    } },
      { id: "c", text: "去找同歌手的所有歌，一路追下去", dimensions: {
      changeAffinity: 1.7,
      boundaryClarity: -1,
    } },
      { id: "d", text: "记住那个瞬间，之后不再重听", dimensions: {
      processingDepth: 1.5,
      temporalDepth: 0.9,
      expressivity: -0.5,
    } },
    ],
  },
  {
    id: 15,
    type: "single",
    text: "你更想拥有哪种能力？",
    options: [
      { id: "a", text: "让自己在人群中隐形", dimensions: {
      boundaryClarity: 1,
      closureTolerance: 1,
      cognitiveRange: 0.4,
      expressivity: -0.6,
    } },
      { id: "b", text: "把脑子里所有声音同时释放出来", dimensions: {
      expressivity: 1.8,
      sensorySensitivity: 0.6,
    } },
      { id: "c", text: "每到一个地方都像是本地人", dimensions: {
      changeAffinity: 1.8,
      boundaryClarity: -0.7,
      processingDepth: -0.6,
    } },
      { id: "d", text: "同时看到一件事的所有可能版本", dimensions: {
      cognitiveRange: 2,
      sensorySensitivity: 0.4,
    } },
    ],
  },
  {
    id: 16,
    type: "single",
    text: "深夜一个人走在路上，你会？",
    options: [
      { id: "a", text: "贴着墙根走，避开路灯正下方", dimensions: {
      temporalDepth: 0.8,
      energySource: -0.4,
      expressivity: -1.3,
    } },
      { id: "b", text: "戴上耳机，把音量开到刚好盖过心跳", dimensions: {
      sensorySensitivity: 2,
      expressivity: 0.4,
      energySource: -0.3,
    } },
      { id: "c", text: "故意绕远路，不想太早到家", dimensions: {
      changeAffinity: 1.9,
      boundaryClarity: -0.4,
      energySource: -0.7,
    } },
      { id: "d", text: "抬头看月亮，同时想三件不相干的事", dimensions: {
      cognitiveRange: 1.2,
      closureTolerance: 0.9,
      changeAffinity: 0.3,
    } },
    ],
  },
  {
    id: 17,
    type: "single",
    text: "你觉得「家」最像什么？",
    options: [
      { id: "a", text: "一个可以调暗灯光的房间", dimensions: {
      boundaryClarity: -0.3,
      expressivity: -1.2,
    } },
      { id: "b", text: "一个隔音很好的盒子", dimensions: {
      boundaryClarity: 1.4,
      expressivity: -0.6,
      sensorySensitivity: -0.8,
    } },
      { id: "c", text: "一个还在路上的概念", dimensions: {
      changeAffinity: 1.4,
      emotionalLatency: 0.4,
      temporalDepth: -0.5,
      boundaryClarity: -0.6,
    } },
      { id: "d", text: "一处深水，表面平静底部有暗流", dimensions: {
      processingDepth: 1.6,
      temporalDepth: 1.3,
    } },
    ],
  },
  {
    id: 21,
    type: "single",
    text: "你更常在什么时候感到最像自己？",
    options: [
      { id: "a", text: "深夜独处，世界安静得只剩下呼吸声", dimensions: {
      processingDepth: 0.9,
      energySource: -0.9,
      expressivity: -1.2,
    } },
      { id: "b", text: "和一个不需要解释太多的朋友在一起", dimensions: {
      boundaryClarity: 0.2,
      expressivity: -0.9,
    } },
      { id: "c", text: "在人群中观察，但不参与", dimensions: {
      temporalDepth: 0.9,
      processingDepth: 0.5,
      energySource: -0.4,
      expressivity: -0.9,
    } },
      { id: "d", text: "突然被某个想法击中，急着记录下来", dimensions: {
      sensorySensitivity: 1,
      processingDepth: 0.8,
      emotionalLatency: 0.6,
      expressivity: 0.4,
    } },
    ],
  },
  {
    id: 22,
    type: "single",
    text: "如果有一段空闲时间，你最可能？",
    options: [
      { id: "a", text: "整理旧物，发现一些遗忘的东西", dimensions: {
      processingDepth: 1.5,
      temporalDepth: 0.9,
      emotionalLatency: 0.5,
    } },
      { id: "b", text: "什么都不规划，看当天心情决定", dimensions: {
      changeAffinity: 1.8,
      boundaryClarity: -0.7,
    } },
      { id: "c", text: "列一个清单，把想做的事排序", dimensions: {
      cognitiveRange: 1,
      temporalDepth: 0.9,
      processingDepth: 0.5,
    } },
      { id: "d", text: "打开社交媒体，浏览但不互动", dimensions: {
      closureTolerance: 1,
      boundaryClarity: 0.4,
      cognitiveRange: 0.4,
      sensorySensitivity: -0.8,
    } },
    ],
  },
  {
    id: 23,
    type: "single",
    text: "描述你最近一次的梦境，它更可能是？",
    options: [
      { id: "a", text: "在一个熟悉但有点陌生的地方徘徊", dimensions: {
      changeAffinity: 0.8,
      boundaryClarity: -0.1,
      expressivity: -0.9,
    } },
      { id: "b", text: "很多场景快速切换，没有主线", dimensions: {
      changeAffinity: 1,
      sensorySensitivity: 0.9,
      expressivity: 0.3,
      boundaryClarity: -0.3,
    } },
      { id: "c", text: "非常清晰，醒来还能记得细节", dimensions: {
      sensorySensitivity: 2,
      expressivity: 0.4,
      energySource: -0.3,
    } },
      { id: "d", text: "深不见底的水或空间，自己在下沉", dimensions: {
      processingDepth: 1.9,
      emotionalLatency: 0.5,
      temporalDepth: 0.4,
    } },
    ],
  },
  {
    id: 24,
    type: "single",
    text: "面对一个不确定的未来，你更倾向于？",
    options: [
      { id: "a", text: "保持现状，至少现在的模糊是可以忍受的", dimensions: {
      boundaryClarity: 0.5,
      energySource: -0.4,
      expressivity: -1.8,
      changeAffinity: -0.6,
    } },
      { id: "b", text: "主动制造变化，哪怕方向不清", dimensions: {
      changeAffinity: 1.5,
      emotionalLatency: 0.4,
      boundaryClarity: -0.4,
      temporalDepth: -0.5,
    } },
      { id: "c", text: "列出所有可能性，然后一个一个排除", dimensions: {
      cognitiveRange: 2,
      sensorySensitivity: 0.4,
    } },
      { id: "d", text: "等待，相信时间会给答案", dimensions: {
      temporalDepth: 0.9,
      processingDepth: 0.5,
      expressivity: -0.7,
      energySource: -0.9,
    } },
    ],
  },
  {
    id: 25,
    type: "single",
    text: "如果必须给过去的自己写一句话，你会写？",
    options: [
      { id: "a", text: "没关系，看不清也是一种看清", dimensions: {
      closureTolerance: 1,
      boundaryClarity: 0.5,
      cognitiveRange: 0.4,
      expressivity: -0.9,
    } },
      { id: "b", text: "那些你以为是噪音的东西，其实都在说话", dimensions: {
      processingDepth: 0.8,
      expressivity: 0.8,
      emotionalLatency: 0.6,
      sensorySensitivity: 0.6,
    } },
      { id: "c", text: "你不需要一直流动，停下来也可以", dimensions: {
      temporalDepth: 0.9,
      processingDepth: 0.5,
      expressivity: -0.7,
      energySource: -0.9,
    } },
      { id: "d", text: "没有正确答案的时候，所有方向都是方向", dimensions: {
      cognitiveRange: 1.5,
      closureTolerance: 0.9,
      sensorySensitivity: 0.4,
    } },
    ],
  },
  {
    id: 26,
    type: "single",
    text: "以下哪种场景让你感到莫名的安心？",
    options: [
      { id: "a", text: "旧书店里的霉味和尘埃", dimensions: {
      temporalDepth: 1.7,
      processingDepth: 0.6,
      expressivity: -0.4,
    } },
      { id: "b", text: "机场候机厅，很多人但没人认识你", dimensions: {
      changeAffinity: 0.8,
      energySource: -0.4,
      boundaryClarity: -0.6,
      expressivity: -0.9,
    } },
      { id: "c", text: "暴雨前的低气压，世界变得安静", dimensions: {
      sensorySensitivity: 0.6,
      expressivity: 0.1,
      energySource: -0.9,
    } },
      { id: "d", text: "站在高处看城市的灯火，但不融入", dimensions: {
      changeAffinity: 1,
      processingDepth: 0.9,
      expressivity: -0.5,
      energySource: -0.7,
    } },
    ],
  },
  {
    id: 27,
    type: "single",
    text: "你最容易被什么类型的故事打动？",
    options: [
      { id: "a", text: "关于一个人在雾中行走，不知道要去哪", dimensions: {
      changeAffinity: 1,
      boundaryClarity: 0.5,
      energySource: -0.7,
      expressivity: -0.9,
    } },
      { id: "b", text: "关于一个人同时经历好几个平行人生", dimensions: {
      cognitiveRange: 2,
      sensorySensitivity: 0.4,
    } },
      { id: "c", text: "关于一个人在水下憋气，看着光线慢慢消失", dimensions: {
      processingDepth: 1.9,
      emotionalLatency: 0.5,
      temporalDepth: 0.4,
    } },
      { id: "d", text: "关于一个人在人群中突然听到一首歌", dimensions: {
      sensorySensitivity: 2,
      expressivity: 0.4,
      energySource: -0.3,
    } },
    ],
  },

  // ===== 新增单选题 =====
  {
    id: 41,
    type: "single",
    text: "你使用社交媒体的方式更像？",
    options: [
      { id: "a", text: "潜水观察，很少留下痕迹", dimensions: {
      boundaryClarity: 1,
      processingDepth: 0.9,
      expressivity: -1.1,
    } },
      { id: "b", text: "一阵一阵地发很多，然后又消失很久", dimensions: {
      expressivity: 1,
      changeAffinity: 0.6,
      emotionalLatency: 0.4,
      temporalDepth: -0.5,
      energySource: 0.5,
    } },
      { id: "c", text: "同时刷好几个平台，但说不出看了什么", dimensions: {
      changeAffinity: 1,
      sensorySensitivity: 0.9,
      expressivity: 0.3,
      boundaryClarity: -0.3,
    } },
      { id: "d", text: "精心编辑，发完又删，反复修改", dimensions: {
      closureTolerance: 0.9,
      cognitiveRange: 0.5,
      boundaryClarity: 0.4,
      sensorySensitivity: -0.8,
    } },
    ],
  },
  {
    id: 42,
    type: "single",
    text: "当环境突然变化（温度/光线/声音），你通常？",
    options: [
      { id: "a", text: "立刻感到不适，需要很长时间调整", dimensions: {
      sensorySensitivity: 2,
      expressivity: 0.4,
      energySource: -0.3,
    } },
      { id: "b", text: "几乎注意不到，适应性很强", dimensions: {
      changeAffinity: 1.8,
      boundaryClarity: -0.7,
      processingDepth: -0.6,
    } },
      { id: "c", text: "先忍耐，然后突然崩溃", dimensions: {
      temporalDepth: 0.9,
      expressivity: 0.8,
      sensorySensitivity: 0.6,
      processingDepth: 0.5,
    } },
      { id: "d", text: "会记下来，但说不清是什么感觉", dimensions: {
      closureTolerance: 1,
      temporalDepth: 0.9,
      processingDepth: 0.6,
      cognitiveRange: 0.4,
    } },
    ],
  },
  {
    id: 43,
    type: "single",
    text: "当你和别人产生分歧时，你更可能？",
    options: [
      { id: "a", text: "立刻退后，让话题自然冷却", dimensions: {
      boundaryClarity: 0.5,
      energySource: -0.4,
      expressivity: -1.8,
    } },
      { id: "b", text: "当下爆发，说完就后悔", dimensions: {
      expressivity: 1.4,
      sensorySensitivity: 1,
      energySource: 0.4,
    } },
      { id: "c", text: "转移话题，等气氛好了再绕回来", dimensions: {
      changeAffinity: 1.8,
      boundaryClarity: -0.4,
      energySource: -0.7,
    } },
      { id: "d", text: "沉默很久，然后在心里列出所有论点", dimensions: {
      cognitiveRange: 1,
      processingDepth: 0.9,
      emotionalLatency: 0.5,
    } },
    ],
  },
  {
    id: 44,
    type: "single",
    text: "你的想法通常以什么方式出现？",
    options: [
      { id: "a", text: "像零散的碎片，需要拼凑才能看清全貌", dimensions: {
      cognitiveRange: 1.7,
      sensorySensitivity: 0.4,
      changeAffinity: 0.3,
    } },
      { id: "b", text: "像突然亮起的闪电，来得快去得也快", dimensions: {
      sensorySensitivity: 1.6,
      expressivity: 1.2,
      processingDepth: -0.5,
    } },
      { id: "c", text: "像慢慢生长的藤蔓，不知不觉就成型了", dimensions: {
      temporalDepth: 1.8,
      processingDepth: 1.1,
    } },
      { id: "d", text: "像回声，一个念头引出无数个联想", dimensions: {
      cognitiveRange: 1,
      processingDepth: 0.8,
      emotionalLatency: 0.6,
    } },
    ],
  },
  {
    id: 45,
    type: "single",
    text: "面对大量未读信息（文章/视频/消息），你会？",
    options: [
      { id: "a", text: "全部标记已读，假装不存在", dimensions: {
      temporalDepth: 0.8,
      boundaryClarity: 0.4,
      expressivity: -0.4,
      sensorySensitivity: -0.8,
    } },
      { id: "b", text: "焦虑地一条条清理，直到归零", dimensions: {
      sensorySensitivity: 1.9,
      expressivity: 0.7,
    } },
      { id: "c", text: "挑最刺激的点进去，然后不断跳转", dimensions: {
      changeAffinity: 1.9,
      boundaryClarity: -0.7,
      processingDepth: -0.5,
    } },
      { id: "d", text: "打开一个就深入看完，不管其他的", dimensions: {
      processingDepth: 0.9,
      energySource: -0.9,
      expressivity: -1.2,
    } },
    ],
  },
  {
    id: 46,
    type: "single",
    text: "哪种天气最让你感到「这就是我的世界」？",
    options: [
      { id: "a", text: "深秋，落叶把所有声音都吸收了", dimensions: {
      temporalDepth: 0.8,
      energySource: -0.9,
      expressivity: -1.1,
    } },
      { id: "b", text: "盛夏午后，蝉鸣把空气填满", dimensions: {
      sensorySensitivity: 1,
      expressivity: 1,
      energySource: -0.3,
    } },
      { id: "c", text: "早春，一切都刚开始但还不确定", dimensions: {
      changeAffinity: 0.8,
      boundaryClarity: 0.1,
      expressivity: -0.9,
    } },
      { id: "d", text: "冬夜，外面很冷里面很暖的对比", dimensions: {
      boundaryClarity: 1,
      energySource: -0.4,
      expressivity: -1.5,
      changeAffinity: -0.5,
    } },
    ],
  },
  {
    id: 47,
    type: "single",
    text: "你的房间/桌面通常？",
    options: [
      { id: "a", text: "东西很多，但每样都有它的位置", dimensions: {
      cognitiveRange: 1,
      temporalDepth: 0.9,
      processingDepth: 0.6,
      sensorySensitivity: 0.4,
    } },
      { id: "b", text: "极简到近乎空无一物", dimensions: {
      processingDepth: 1,
      temporalDepth: 0.4,
      expressivity: -0.7,
      energySource: -0.9,
      changeAffinity: -0.5,
    } },
      { id: "c", text: "看似混乱，但你知道东西都在哪", dimensions: {
      cognitiveRange: 1,
      sensorySensitivity: 0.9,
      expressivity: 0.3,
    } },
      { id: "d", text: "定期大清理，然后慢慢又堆满", dimensions: {
      changeAffinity: 1.6,
      emotionalLatency: 0.4,
      boundaryClarity: -0.3,
      temporalDepth: -0.5,
    } },
    ],
  },
  {
    id: 48,
    type: "single",
    text: "结束一段关系或离开一个地方时，你更倾向？",
    options: [
      { id: "a", text: "慢慢淡出，不告而别", dimensions: {
      temporalDepth: 0.8,
      boundaryClarity: 0.5,
      expressivity: -1.3,
    } },
      { id: "b", text: "突然切断，长痛不如短痛", dimensions: {
      sensorySensitivity: 1,
      changeAffinity: 0.9,
      expressivity: 0.4,
      boundaryClarity: -0.4,
    } },
      { id: "c", text: "仪式感很重，必须好好说再见", dimensions: {
      processingDepth: 0.9,
      closureTolerance: 0.8,
      emotionalLatency: 0.6,
      expressivity: -0.5,
    } },
      { id: "d", text: "反复犹豫，拖到最后才走", dimensions: {
      changeAffinity: 1,
      closureTolerance: 0.9,
      cognitiveRange: 0.5,
      energySource: -0.7,
    } },
    ],
  },
  {
    id: 61,
    type: "single",
    text: "当你走进一间满是人的房间，你最真实的反应是？",
    options: [
      { id: "a", text: "只站在边缘，让别人看到你的轮廓就够了", dimensions: {
      boundaryClarity: 1.6,
      expressivity: -1.2,
    } },
      { id: "b", text: "所有人的情绪同时涌进来，像走进了一团雾", dimensions: {
      sensorySensitivity: 1.2,
      boundaryClarity: -1.5,
    } },
      { id: "c", text: "没什么感觉，但回家后会突然想明白刚才的氛围", dimensions: {
      emotionalLatency: 1.9,
      expressivity: -0.3,
    } },
      { id: "d", text: "感受到房间里的能量在涨还是在退", dimensions: {
      changeAffinity: 1.6,
      temporalDepth: -0.7,
    } },
    ],
  },
  {
    id: 62,
    type: "single",
    text: "看一张旧照片里的自己，你通常？",
    options: [
      { id: "a", text: "觉得那个人很熟悉，但心境已经有了微妙的疏离", dimensions: {
      emotionalLatency: 0.7,
      cognitiveRange: 0.6,
      expressivity: -1.1,
    } },
      { id: "b", text: "那一刻的情绪会重新渗进你身体里", dimensions: {
      sensorySensitivity: 0.5,
      changeAffinity: 0.4,
      boundaryClarity: -1.5,
    } },
      { id: "c", text: "那时候的潮水已经退了，现在是另一片海", dimensions: {
      changeAffinity: 1.2,
      emotionalLatency: 0.4,
      energySource: -0.7,
    } },
      { id: "d", text: "能看清清晰的轮廓，但细节已经慢慢退入阴影", dimensions: {
      boundaryClarity: 0.9,
      cognitiveRange: 0.3,
      expressivity: -1.4,
    } },
    ],
  },
  {
    id: 63,
    type: "single",
    text: "以下哪个比喻最像你？",
    options: [
      { id: "a", text: "一滴墨落进水里", dimensions: {
      cognitiveRange: 0.3,
      boundaryClarity: -1.9,
    } },
      { id: "b", text: "暗房里慢慢显影的照片", dimensions: {
      emotionalLatency: 0.8,
      processingDepth: 0.7,
      energySource: -0.9,
    } },
      { id: "c", text: "永不停歇地拍岸又退去的海浪", dimensions: {
      changeAffinity: 1.1,
      expressivity: 0.7,
      sensorySensitivity: 0.6,
    } },
      { id: "d", text: "风吹过屋檐下微微颤响的风铃", dimensions: {
      sensorySensitivity: 0.9,
      expressivity: 0.7,
      energySource: -0.2,
    } },
    ],
  },
  {
    id: 64,
    type: "single",
    text: "和一群朋友在一起时，你更像是？",
    options: [
      { id: "a", text: "自动吸收群体的氛围，变得和周围一样", dimensions: {
      sensorySensitivity: 0.3,
      cognitiveRange: 0.3,
      boundaryClarity: -1.8,
    } },
      { id: "b", text: "当时很安静，但回家后整晚都在回放", dimensions: {
      emotionalLatency: 1.9,
      expressivity: -0.3,
    } },
      { id: "c", text: "有时候很活跃，有时候完全消失，有周期", dimensions: {
      changeAffinity: 1.1,
      expressivity: 0.7,
      energySource: -0.7,
    } },
      { id: "d", text: "呈现一个清晰的版本，但从不展示全貌", dimensions: {
      boundaryClarity: 1.6,
      expressivity: -1.2,
    } },
    ],
  },
  {
    id: 65,
    type: "single",
    text: "你更害怕哪种体验？",
    options: [
      { id: "a", text: "被完全看透，连内心角落都暴露", dimensions: {
      boundaryClarity: 0.9,
      cognitiveRange: 0.3,
      expressivity: -1.4,
    } },
      { id: "b", text: "分不清自己的想法和别人的想法", dimensions: {
      sensorySensitivity: 0.3,
      cognitiveRange: 0.3,
      boundaryClarity: -1.8,
    } },
      { id: "c", text: "永远停留在同一个状态里无法变化", dimensions: {
      changeAffinity: 1.5,
      emotionalLatency: 0.4,
      temporalDepth: -0.3,
    } },
      { id: "d", text: "事情发生了很久，你依然没有感受到任何东西", dimensions: {
      emotionalLatency: 1.5,
      expressivity: -0.6,
    } },
    ],
  },
  {
    id: 66,
    type: "single",
    text: "你更习惯用哪种方式理解自己？",
    options: [
      { id: "a", text: "通过别人的反馈——他们像镜子照出你", dimensions: {
      sensorySensitivity: 1.4,
      boundaryClarity: -1.4,
    } },
      { id: "b", text: "通过事后的回忆——当时不懂，后来才懂", dimensions: {
      processingDepth: 0.7,
      cognitiveRange: 0.6,
      expressivity: -0.5,
      energySource: -0.9,
    } },
      { id: "c", text: "通过周期性的变化——你像一条波浪线", dimensions: {
      changeAffinity: 1.3,
      sensorySensitivity: 0.6,
      temporalDepth: -0.4,
    } },
      { id: "d", text: "通过自己选择展示的部分——那才是真正的你", dimensions: {
      cognitiveRange: 0.7,
      expressivity: -1.4,
    } },
    ],
  },
];
