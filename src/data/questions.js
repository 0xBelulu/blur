export const questions = [
  {
    id: 1,
    required: true,
    text: "当你走进一间陌生的房间，你最先注意到的是？",
    options: [
      { id: "a", text: "阴影和角落，下意识想降低存在感", traits: ["shielded", "softedge"] },
      { id: "b", text: "所有细节同时涌来，需要缓一缓", traits: ["saturated", "acute"] },
      { id: "c", text: "出口在哪，随时准备离开", traits: ["fleeing", "adrift"] },
      { id: "d", text: "光线如何变化，像在等待什么发生", traits: ["patient", "sunken"] },
    ],
  },
  {
    id: 2,
    required: true,
    text: "深夜失眠时，你的大脑更像？",
    options: [
      { id: "a", text: "一盏调暗的灯，只照亮一小片", traits: ["filtered", "vague"] },
      { id: "b", text: "一台收不到台的电视，雪花噪音", traits: ["reverberant", "overwhelming"] },
      { id: "c", text: "同时打开十个网页，不知先看哪个", traits: ["manifold", "equivocal"] },
      { id: "d", text: "一口深井，声音落进去没有回响", traits: ["stilled", "abyssal"] },
    ],
  },
  {
    id: 3,
    required: true,
    text: "如果可以选择一种天气度过一整天？",
    options: [
      { id: "a", text: "大雾，能见度不到十米", traits: ["misty", "guarded"] },
      { id: "b", text: "雷暴，雨声盖过一切", traits: ["thunder", "loud"] },
      { id: "c", text: "涨潮，海水不断改变边界", traits: ["tidal", "shifting"] },
      { id: "d", text: "深海，光线从上面一点点消失", traits: ["deepwatch", "sedimentary"] },
    ],
  },
  {
    id: 4,
    required: true,
    text: "你更可能被什么样的画面打动？",
    options: [
      { id: "a", text: "一个人站在雾气里，背影模糊", traits: ["vague", "softedge"] },
      { id: "b", text: "闪电照亮夜海的瞬间", traits: ["acute", "saturated"] },
      { id: "c", text: "一个人拖着行李走进未知街道", traits: ["unmoored", "adrift"] },
      { id: "d", text: "水下气泡缓慢上升破裂", traits: ["patient", "stilled"] },
    ],
  },
  {
    id: 5,
    required: true,
    text: "当别人问你「你好吗」，你通常？",
    options: [
      { id: "a", text: "笑一下，然后反问对方", traits: ["filtered", "shielded"] },
      { id: "b", text: "愣住，因为脑子里同时在想很多事", traits: ["overwhelming", "reverberant"] },
      { id: "c", text: "认真想一会儿，给出一个复杂的答案", traits: ["manifold", "suspended"] },
      { id: "d", text: "沉默，等话题自然滑走", traits: ["sunken", "abyssal"] },
    ],
  },
  {
    id: 6,
    required: true,
    text: "如果记忆是一间房间，你的房间？",
    options: [
      { id: "a", text: "拉着纱帘，只有柔和的光斑", traits: ["misty", "guarded"] },
      { id: "b", text: "回声很大，说一句话绕三圈", traits: ["loud", "thunder"] },
      { id: "c", text: "没有固定形状，家具总被搬动", traits: ["fluid", "shifting"] },
      { id: "d", text: "很深，东西沉在底部要潜水去找", traits: ["deepwatch", "sedimentary"] },
    ],
  },
  {
    id: 7,
    required: true,
    text: "你觉得最像自己的一种颜色？",
    options: [
      { id: "a", text: "被水洗过很多次的灰蓝", traits: ["faded", "vague"] },
      { id: "b", text: "闪电瞬间的白，刺目但短暂", traits: ["acute", "loud"] },
      { id: "c", text: "深海里最后消失的那层蓝", traits: ["sunken", "abyssal"] },
      { id: "d", text: "雨后天空同时出现几种颜色", traits: ["prismatic", "refracted"] },
    ],
  },
  {
    id: 8,
    required: true,
    text: "如果明天可以消失一天，你会？",
    options: [
      { id: "a", text: "待在家，拉上窗帘，假装不在家", traits: ["shielded", "filtered"] },
      { id: "b", text: "去人群中，但戴上耳机隔绝声音", traits: ["saturated", "overwhelming"] },
      { id: "c", text: "买一张去未知城市的车票", traits: ["fleeing", "unmoored"] },
      { id: "d", text: "去一个很深很安静的地方待着", traits: ["stilled", "patient"] },
    ],
  },
  {
    id: 9,
    required: true,
    text: "你最容易对什么样的人产生好感？",
    options: [
      { id: "a", text: "让你感到安全、不刺眼的人", traits: ["softedge", "guarded"] },
      { id: "b", text: "和你一样脑子里很吵的人", traits: ["reverberant", "thunder"] },
      { id: "c", text: "从不追问你要去哪的人", traits: ["adrift", "fluid"] },
      { id: "d", text: "能安静陪你，不说多余话的人", traits: ["abyssal", "deepwatch"] },
    ],
  },
  {
    id: 10,
    required: true,
    text: "如果人生是一张照片，你希望它是？",
    options: [
      { id: "a", text: "失焦的，但氛围很对", traits: ["misty", "vague"] },
      { id: "b", text: "过曝的，所有细节都太亮", traits: ["saturated", "loud"] },
      { id: "c", text: "长曝光，轨迹模糊成一条线", traits: ["shifting", "tidal"] },
      { id: "d", text: "深海微距，暗处有未知的光", traits: ["sedimentary", "sunken"] },
    ],
  },
  {
    id: 11,
    required: false,
    text: "你手机里最多的是哪类照片？",
    options: [
      { id: "a", text: "天空和光影变化——同一个角度的不同天色", traits: ["vague", "misty"] },
      { id: "b", text: "随手拍的食物、街头文字、没整理的日常碎片", traits: ["acute", "overwhelming"] },
      { id: "c", text: "不同城市的街景和站牌，几乎没有重复", traits: ["unmoored", "fleeing"] },
      { id: "d", text: "水面倒影、橱窗玻璃、被光线切碎的瞬间", traits: ["prismatic", "refracted"] },
    ],
  },
  {
    id: 12,
    required: false,
    text: "你更害怕哪种感觉？",
    options: [
      { id: "a", text: "突然成为所有人的焦点，无处可躲", traits: ["shielded", "softedge"] },
      { id: "b", text: "被所有人遗忘，手机再也没有新消息", traits: ["reverberant", "thunder"] },
      { id: "c", text: "日复一日过一模一样的生活，看不到尽头", traits: ["shifting", "fluid"] },
      { id: "d", text: "被人逼着选边站，明明两边都有道理", traits: ["suspended", "equivocal"] },
    ],
  },
  {
    id: 13,
    required: false,
    text: "你理想中的周末？",
    options: [
      { id: "a", text: "一个人在家，窗帘半拉，光线柔和", traits: ["filtered", "guarded"] },
      { id: "b", text: "听很吵的音乐，让声音盖过想法", traits: ["loud", "saturated"] },
      { id: "c", text: "去一个从没去过的地方，无目的漫步", traits: ["adrift", "tidal"] },
      { id: "d", text: "什么都不做，等时间自己过去", traits: ["patient", "stilled"] },
    ],
  },
  {
    id: 14,
    required: false,
    text: "听到一首喜欢的歌，你会？",
    options: [
      { id: "a", text: "调低音量，只在背景存在", traits: ["softedge", "filtered"] },
      { id: "b", text: "单曲循环到耳朵发麻", traits: ["reverberant", "overwhelming"] },
      { id: "c", text: "去找同歌手的所有歌，一路追下去", traits: ["unmoored", "fleeing"] },
      { id: "d", text: "记住那个瞬间，之后不再重听", traits: ["sedimentary", "deepwatch"] },
    ],
  },
  {
    id: 15,
    required: false,
    text: "你更想拥有哪种能力？",
    options: [
      { id: "a", text: "让自己在人群中隐形", traits: ["shielded", "vague"] },
      { id: "b", text: "把脑子里所有声音同时释放出来", traits: ["thunder", "loud"] },
      { id: "c", text: "每到一个地方都像是本地人", traits: ["fluid", "shifting"] },
      { id: "d", text: "同时看到一件事的所有可能版本", traits: ["manifold", "prismatic"] },
    ],
  },
  {
    id: 16,
    required: false,
    text: "深夜一个人走在路上，你会？",
    options: [
      { id: "a", text: "贴着墙根走，避开路灯正下方", traits: ["guarded", "faded"] },
      { id: "b", text: "戴上耳机，把音量开到刚好盖过心跳", traits: ["acute", "saturated"] },
      { id: "c", text: "故意绕远路，不想太早到家", traits: ["fleeing", "adrift"] },
      { id: "d", text: "抬头看月亮，同时想三件不相干的事", traits: ["equivocal", "refracted"] },
    ],
  },
  {
    id: 17,
    required: false,
    text: "你觉得「家」最像什么？",
    options: [
      { id: "a", text: "一个可以调暗灯光的房间", traits: ["misty", "softedge"] },
      { id: "b", text: "一个隔音很好的盒子", traits: ["filtered", "shielded"] },
      { id: "c", text: "一个还在路上的概念", traits: ["unmoored", "tidal"] },
      { id: "d", text: "一处深水，表面平静底部有暗流", traits: ["abyssal", "sedimentary"] },
    ],
  },
  {
    id: 18,
    required: false,
    type: "rank",
    text: "以下四种状态，按「最像你 → 最不像你」排序：",
    options: [
      { id: "a", text: "把自己关在房间里，拉上窗帘", traits: ["shielded", "filtered"] },
      { id: "b", text: "同时被五件事占据大脑，无法安静", traits: ["saturated", "overwhelming"] },
      { id: "c", text: "突然决定去买一张去未知城市的车票", traits: ["fleeing", "adrift"] },
      { id: "d", text: "盯着一杯水，等它慢慢凉下来", traits: ["patient", "stilled"] },
    ],
  },
  {
    id: 19,
    required: false,
    type: "rank",
    text: "以下四种反应，按「最像你 → 最不像你」排序：",
    options: [
      { id: "a", text: "被问问题时先笑，不直接回答", traits: ["guarded", "vague"] },
      { id: "b", text: "听到问题后脑子里闪过十个答案", traits: ["manifold", "reverberant"] },
      { id: "c", text: "觉得问题本身就有问题，不想选边", traits: ["equivocal", "prismatic"] },
      { id: "d", text: "沉默很久，给出一个深思熟虑的回答", traits: ["sunken", "abyssal"] },
    ],
  },
  {
    id: 20,
    required: false,
    type: "rank",
    text: "以下四种场景，按「最让你安心 → 最让你不安」排序：",
    options: [
      { id: "a", text: "大雾中的高速公路，看不清前方", traits: ["misty", "softedge"] },
      { id: "b", text: "暴雨打在窗户上，声音填满房间", traits: ["thunder", "loud"] },
      { id: "c", text: "海边的悬崖，潮水在下方进退", traits: ["tidal", "shifting"] },
      { id: "d", text: "深夜的湖面，没有波纹也没有声音", traits: ["deepwatch", "stilled"] },
    ],
  },
];

export const tagPool = {
  // 雾系 — 防御性模糊
  shielded: { text: "筑壳者", weight: 1, detail: "你习惯用一层柔和的保护色将自己与外界隔开" },
  softedge: { text: "柔边界", weight: 0.9, detail: "你的边界不是墙，而是一道毛玻璃" },
  filtered: { text: "选择性接收", weight: 0.9, detail: "你只让特定频率的信息进入自己" },
  vague: { text: "模糊偏好", weight: 0.8, detail: "清晰对你来说有时候是一种冒犯" },
  misty: { text: "雾气体质", weight: 1, detail: "你天生适合存在于能见度低的环境里" },
  guarded: { text: "低曝光", weight: 0.8, detail: "你不习惯把自己放在强光下" },
  faded: { text: "褪色感", weight: 0.7, detail: "你觉得自己像被时间洗淡的旧照片" },

  // 风铃系 — 过载性模糊
  saturated: { text: "信息过载", weight: 1, detail: "你接收的信息量总是超过处理能力" },
  acute: { text: "高敏接收", weight: 1, detail: "你的感官像没有音量键的收音机" },
  reverberant: { text: "内心回响", weight: 0.9, detail: "一个念头会在你脑子里绕很多圈" },
  overwhelming: { text: "淹没感", weight: 0.9, detail: "你经常被自己的感受淹没" },
  thunder: { text: "轰鸣体质", weight: 1, detail: "你的内心很少真正安静过" },
  loud: { text: "高音量", weight: 0.8, detail: "即使是安静的时候，你的内心也在轰鸣" },

  // 漂流者系 — 流动性模糊
  adrift: { text: "无锚状态", weight: 1, detail: "你不觉得自己属于任何一个固定的地方" },
  fleeing: { text: "逃离冲动", weight: 0.9, detail: "你在感到被定义时会本能地想逃" },
  unmoored: { text: "解缆者", weight: 0.9, detail: "你主动或被动地切断了固定的连接" },
  shifting: { text: "形变者", weight: 0.8, detail: "你的形状随环境变化，没有固定版本" },
  tidal: { text: "潮汐节律", weight: 1, detail: "你的情绪和状态有自然的涨落周期" },
  fluid: { text: "流动性", weight: 0.8, detail: "你从一种状态滑向另一种，没有明显边界" },

  // 静观者系 — 时间性模糊
  patient: { text: "慢时间", weight: 1, detail: "你愿意等，相信时间会让事情澄清" },
  sunken: { text: "沉降感", weight: 0.9, detail: "你的情绪和想法会自己慢慢沉到深处" },
  abyssal: { text: "深潜者", weight: 1, detail: "你不害怕深处，那里反而让你平静" },
  sedimentary: { text: "沉积型", weight: 0.9, detail: "你的记忆像地层，越深的越古老" },
  stilled: { text: "静水层", weight: 0.8, detail: "你能在表面之下找到完全静止的层面" },
  deepwatch: { text: "暗观察者", weight: 0.9, detail: "你习惯从深处向上看，而不是从表面向下看" },

  // 虹系 — 认知性模糊
  manifold: { text: "多面体", weight: 1, detail: "你同时看到一件事的好几个版本" },
  equivocal: { text: "悬置判断", weight: 0.9, detail: "你很难对任何事情给出非黑即白的答案" },
  prismatic: { text: "棱镜思维", weight: 1, detail: "一束光经过你，会分出很多种颜色" },
  refracted: { text: "折射感", weight: 0.8, detail: "真相经过你，方向会发生改变" },
  suspended: { text: "悬停者", weight: 0.8, detail: "你习惯让结论保持在空中，不急于落地" },
};

export const ARCHETYPE_TRAITS = {
  mist: ["shielded", "softedge", "filtered", "vague", "misty", "guarded", "faded"],
  chime: ["saturated", "acute", "reverberant", "overwhelming", "thunder", "loud"],
  drift: ["adrift", "fleeing", "unmoored", "shifting", "tidal", "fluid"],
  still: ["patient", "sunken", "abyssal", "sedimentary", "stilled", "deepwatch"],
  rainbow: ["manifold", "equivocal", "prismatic", "refracted", "suspended"],
};

export const ARCHETYPE_SUPPRESSED = {
  mist: ["acute", "tidal"],
  chime: ["patient", "stilled"],
  drift: ["shielded", "sedimentary"],
  still: ["fleeing", "manifold"],
  rainbow: ["guarded", "sunken"],
};

export const DIMENSIONS = {
  mist: { name: "遮蔽性", traits: ARCHETYPE_TRAITS.mist },
  chime: { name: "敏感度", traits: ARCHETYPE_TRAITS.chime },
  drift: { name: "流动性", traits: ARCHETYPE_TRAITS.drift },
  still: { name: "沉淀性", traits: ARCHETYPE_TRAITS.still },
  rainbow: { name: "多面性", traits: ARCHETYPE_TRAITS.rainbow },
};

export const archetypeDescriptions = {
  mist: {
    title: "雾",
    subtitle: "朦胧是你的保护色",
    symbol: "🌫️",
    description: "你不是看不清世界，而是选择让世界看不清你。模糊不是你的缺陷，是你精心调节的曝光度。",
    narrative: {
      innerWorld: "你的内心像一间拉着纱帘的房间——外面的人以为是昏暗，但只有你知道，这种柔和的光线刚刚好。你不害怕真实，只是真实有时候太刺眼了。你习惯把尖锐的棱角包上一层毛边，不是为了骗别人，是为了让自己能呼吸。",
      inRelation: "你在关系中是一道半透明的墙。别人觉得你若即若离，但你知道，这已经是最近的距离了。你不是不想靠近，而是靠近意味着要把保护层撤掉，而那需要很长时间。你最好的相处方式是：我在，但请别直视我。",
      hiddenSide: "你看起来永远在回避，但其实你内心深处渴望一次被强光直射的体验——不是烧伤，而是温暖。你最大的秘密是：你的模糊有时候让你自己也找不到自己了。",
    },
  },
  chime: {
    title: "风铃",
    subtitle: "微风即响，没有静音键",
    symbol: "🎐",
    description: "你不是情绪化，只是被一点风就吹响了。世界对你来说总是太响、太亮、太多。",
    narrative: {
      innerWorld: "你的内心像一串挂在风口的风铃——别人以为你在唱歌，但每一响都是被风吹的。一个念头进来，会激起十次振动。你羡慕那些能一键静音的人，但你也知道，这种振动里藏着别人听不到的频率。你不是太敏感，你是敏感本身。",
      inRelation: "你在关系中常常是那个说得太多或完全沉默的人——没有中间状态。你的情绪来得快且猛，像一阵风突然吹响全部铃铛。但你需要的不是变安静，而是找到一个愿意听铃响的人。",
      hiddenSide: "你看起来此起彼伏，但其实你最渴望的是真正的无风——不是用更大的声响盖住，而是所有风都停了之后的那种空。你最大的恐惧是：如果没有风，你还响吗？",
    },
  },
  drift: {
    title: "漂流者",
    subtitle: "你不是在漂流，你是在拒绝靠岸",
    symbol: "🍃",
    description: "你不是没有方向，你只是有太多的方向。固定让你窒息，流动让你活着。",
    narrative: {
      innerWorld: "你的内心没有地图，也没有终点。你不是在逃避什么，你只是在拒绝被定义。今天的你和昨天的你可能是两个人，但这不意味着哪个更真。你像潮水一样，涨的时候淹没一切，退的时候什么都不留下。",
      inRelation: "你在关系中需要巨大的呼吸空间。你不是不爱，而是你的爱不能被困在一个形状里。你可能会突然消失，也可能会突然靠近——这不是反复无常，这是你的自然节律。你最好的关系是：两个人各自流动，偶尔交汇。",
      hiddenSide: "你看起来随性自由，但你比任何人都渴望一个可以回去的岸。只是你害怕，一旦靠岸，潮汐就不再是潮汐了。你最大的矛盾是：你用流动来保护那个想要停泊的自己。",
    },
  },
  still: {
    title: "静观者",
    subtitle: "你不急于浮出水面",
    symbol: "🌑",
    description: "你不急于浮出水面。你相信有些东西只有沉下去才能看见。",
    narrative: {
      innerWorld: "你的内心像一口深井，表面平静，底部有暗流。你不是没有感受，只是你的感受都沉下去了，需要时间才能捞上来。你不习惯快速反应，不是因为迟钝，而是因为你的真相在深处，而深处需要耐心。",
      inRelation: "你在关系中是一个慢热的人，但一旦热了就很难冷却。你的关心不是即时的，是沉淀过的——你可能在三个月后突然想起对方说的一句话，然后才理解那意味着什么。你的爱像地层，一层一层，越深越古老。",
      hiddenSide: "你看起来冷静深沉，但你内心深处也渴望一次不问后果的冲动。你最大的遗憾是：有时候事情已经结束了，你的感受才刚刚浮上来。你用时间换取清晰，但代价是总是慢半拍。",
    },
  },
  rainbow: {
    title: "虹",
    subtitle: "真相不止一种颜色",
    symbol: "🌈",
    description: "你不是犹豫不决，你只是同时看到了所有的可能。你的模糊来自于丰富的视角，而不是缺失。",
    narrative: {
      innerWorld: "你的内心像一间装满镜子的房间，一束光进来，折射出无数个版本。你不是没有答案，而是你有太多答案，而且每个都是真的。你习惯在确定和不确定之间悬停，不是因为懦弱，是因为你诚实地看到了复杂性。",
      inRelation: "你在关系中常常是最理解对方的人，因为你能同时站在好几个角度。但这也让你疲惫——每次争执，你都能理解双方，所以你说不出坚定的立场。你最好的关系是：对方不需要你选边，而是和你一起看全景。",
      hiddenSide: "你看起来包容万物，但其实你内心深处渴望一次简单的、非黑即白的确定。你最大的负担是：看得太全，反而找不到自己的位置。你是所有人的镜子，但有时候忘了自己也是有颜色的。",
    },
  },
};
