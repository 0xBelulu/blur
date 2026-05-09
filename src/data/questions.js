export const questions = [
  {
    id: 1,
    text: "当你走进一间陌生的房间，你最先注意到的是？",
    options: [
      { id: "a", text: "光线落在哪面墙上", traits: ["sensitive", "visual"] },
      { id: "b", text: "空气里的某种气味", traits: ["intuitive", "sensory"] },
      { id: "c", text: "谁会先开口说话", traits: ["social", "observant"] },
      { id: "d", text: "自己站在哪里比较合适", traits: ["cautious", "spatial"] },
    ],
  },
  {
    id: 2,
    text: "深夜失眠时，你通常在思考什么？",
    options: [
      { id: "a", text: "三年前的某句话", traits: ["nostalgic", "reflective"] },
      { id: "b", text: "明天早餐吃什么", traits: ["grounded", "present"] },
      { id: "c", text: "宇宙和存在的意义", traits: ["philosophical", "abstract"] },
      { id: "d", text: "什么都没想，只是醒着", traits: ["empty", "accepting"] },
    ],
  },
  {
    id: 3,
    text: "如果可以选择一种天气度过一整天？",
    options: [
      { id: "a", text: "大雾弥漫的清晨", traits: ["mysterious", "introspective"] },
      { id: "b", text: "暴雨来临前的闷热", traits: ["tense", "anticipatory"] },
      { id: "c", text: "雨后初晴的黄昏", traits: ["hopeful", "transitional"] },
      { id: "d", text: "下雪但不算太冷的夜晚", traits: ["romantic", "solitary"] },
    ],
  },
  {
    id: 4,
    text: "你更可能被什么样的画面打动？",
    options: [
      { id: "a", text: "一个人坐在窗边发呆", traits: ["lonely", "contemplative"] },
      { id: "b", text: "老友重逢时欲言又止", traits: ["emotional", "relational"] },
      { id: "c", text: "小孩第一次看见大海", traits: ["wonder", "pure"] },
      { id: "d", text: "城市灯火在雨中晕开", traits: ["aesthetic", "melancholic"] },
    ],
  },
  {
    id: 5,
    text: "当别人问你「你好吗」，你通常？",
    options: [
      { id: "a", text: "说还好，然后反问对方", traits: ["deflecting", "caring"] },
      { id: "b", text: "沉默一会儿才回答", traits: ["honest", "hesitant"] },
      { id: "c", text: "直接说不太好或挺好的", traits: ["direct", "expressive"] },
      { id: "d", text: "笑一笑，不回答", traits: ["guarded", "enigmatic"] },
    ],
  },
  {
    id: 6,
    text: "如果记忆是一间房间，你的房间？",
    options: [
      { id: "a", text: "堆满了舍不得扔的东西", traits: ["hoarding", "sentimental"] },
      { id: "b", text: "很空，但每个角落都很清楚", traits: ["minimal", "focused"] },
      { id: "c", text: "光线很暗，需要慢慢辨认", traits: ["obscure", "layered"] },
      { id: "d", text: "总在搬东西，没有固定格局", traits: ["restless", "adaptable"] },
    ],
  },
  {
    id: 7,
    text: "你觉得最像自己的一种颜色？",
    options: [
      { id: "a", text: "被水洗过很多次的蓝", traits: ["faded", "calm"] },
      { id: "b", text: "黄昏时天空边缘的紫", traits: ["transient", "delicate"] },
      { id: "c", text: "旧书页边的茶色", traits: ["warm", "timeless"] },
      { id: "d", text: "雨后石板路的灰", traits: ["neutral", "grounded"] },
    ],
  },
  {
    id: 8,
    text: "如果明天可以消失一天，你会？",
    options: [
      { id: "a", text: "去一个没人认识的地方走路", traits: ["escapist", "wandering"] },
      { id: "b", text: "待在家里，不接任何消息", traits: ["withdrawn", "self"] },
      { id: "c", text: "找一个人，说平时不敢说的话", traits: ["courageous", "vulnerable"] },
      { id: "d", text: "照常生活，假装自己不在", traits: ["detached", "observer"] },
    ],
  },
  {
    id: 9,
    text: "你最容易对什么样的人产生好感？",
    options: [
      { id: "a", text: "说话很慢、会停顿的人", traits: ["patient", "depth"] },
      { id: "b", text: "笑起来有破绽的人", traits: ["authentic", "human"] },
      { id: "c", text: "对世界还有好奇心的人", traits: ["curious", "youthful"] },
      { id: "d", text: "安静但眼神有温度的人", traits: ["subtle", "warm"] },
    ],
  },
  {
    id: 10,
    text: "如果人生是一张照片，你希望它是？",
    options: [
      { id: "a", text: "失焦但光线很美", traits: ["imperfect", "atmospheric"] },
      { id: "b", text: "只有半个身影入镜", traits: ["incomplete", "mysterious"] },
      { id: "c", text: "拍糊了但表情很真", traits: ["genuine", "raw"] },
      { id: "d", text: "空白处比画面多", traits: ["minimal", "suggestive"] },
    ],
  },
];

export const tagPool = {
  sensitive: { text: "对光线敏感的人", weight: 1, detail: "你对环境的变化有着超乎常人的敏锐度" },
  visual: { text: "用眼睛记住事情", weight: 0.8, detail: "画面是你记忆和思考的主要载体" },
  intuitive: { text: "靠直觉导航", weight: 1, detail: "你常常不需要逻辑就能找到方向" },
  sensory: { text: "被气味带回过去", weight: 0.9, detail: "气味和触感能瞬间把你带回某个时刻" },
  social: { text: "在人群中充电", weight: 0.7, detail: "你在人群中反而能找到能量" },
  observant: { text: "沉默的观察者", weight: 0.9, detail: "你习惯在沉默中观察一切" },
  cautious: { text: "先找好退路", weight: 0.6, detail: "你总是先确认安全才迈出脚步" },
  spatial: { text: "需要自己的角落", weight: 0.8, detail: "你需要一个属于自己的物理空间" },
  nostalgic: { text: "活在过去附近", weight: 1, detail: "过去对你来说不是负担，而是栖息地" },
  reflective: { text: "反复咀嚼回忆", weight: 0.9, detail: "你会反复回到同一个念头，直到它被完全理解" },
  grounded: { text: "脚踩在地上", weight: 0.7, detail: "你很少飘在空中，现实是你的锚" },
  present: { text: "此刻主义者", weight: 0.8, detail: "你活在当下，不太纠结过去和未来" },
  philosophical: { text: "夜间哲学家", weight: 1.1, detail: "深夜是你思考存在意义的专属时间" },
  abstract: { text: "在概念里散步", weight: 0.8, detail: "你更习惯在概念和隐喻中游走" },
  empty: { text: "允许自己空白", weight: 1, detail: "你允许自己什么都不想，什么都不做" },
  accepting: { text: "不解释就接受", weight: 0.9, detail: "你很少追问为什么，接受本身就是答案" },
  mysterious: { text: "雾气里的人", weight: 1, detail: "你身上总有一层别人看不透的雾" },
  introspective: { text: "向内行走", weight: 0.9, detail: "你的旅程方向永远是向内的" },
  tense: { text: "享受悬而未决", weight: 0.8, detail: "悬而未决的状态反而让你感到活着" },
  anticipatory: { text: "在等待中活着", weight: 0.9, detail: "你在等待中找到了某种奇妙的满足感" },
  hopeful: { text: "相信雨会停", weight: 0.9, detail: "你相信每场雨都会停" },
  transitional: { text: "处在中间地带", weight: 1, detail: "你总觉得自己处在某种过渡之中" },
  romantic: { text: "下雪时会想一个人", weight: 1, detail: "某些场景会不自觉地让你想起一个人" },
  solitary: { text: "自愿的孤独", weight: 0.9, detail: "你的孤独是自愿的，不是被迫的" },
  lonely: { text: "与孤独签了长约", weight: 1.1, detail: "你和孤独签了一份长期合约" },
  contemplative: { text: "发呆是正经事", weight: 0.9, detail: "发呆对你来说是一种深度思考" },
  emotional: { text: "情绪来得慢但深", weight: 1, detail: "你的情绪来得慢，但一旦来了就很深" },
  relational: { text: "靠关系确认存在", weight: 0.8, detail: "你通过和别人的关系来确认自己的存在" },
  wonder: { text: "还能被小事打动", weight: 0.9, detail: "你还能被很小的事情打动" },
  pure: { text: "保留了一部分天真", weight: 0.8, detail: "你在内心深处保留了一部分天真" },
  aesthetic: { text: "为美感到疼痛", weight: 1, detail: "美对你来说不只是欣赏，而是一种近乎疼痛的感受" },
  melancholic: { text: "温柔的悲观", weight: 1, detail: "你的悲观是温柔的，不是尖锐的" },
  deflecting: { text: "不习惯被关心", weight: 0.9, detail: "当别人关心你时，你的第一反应是转移话题" },
  caring: { text: "先照顾别人", weight: 0.8, detail: "你总是先照顾别人的感受" },
  honest: { text: "诚实但犹豫", weight: 0.9, detail: "你想说真话，但常常犹豫很久" },
  hesitant: { text: "开口前要想很久", weight: 0.8, detail: "你开口之前要在心里排练很多遍" },
  direct: { text: "不绕弯子", weight: 0.7, detail: "你不喜欢绕弯子，想到什么就说什么" },
  expressive: { text: "情绪挂在脸上", weight: 0.8, detail: "你的情绪几乎写在脸上" },
  guarded: { text: "筑起透明的墙", weight: 1, detail: "你筑起了一道透明的墙，看得见但进不来" },
  enigmatic: { text: "连自己也看不懂", weight: 1.1, detail: "有时候连你自己也看不懂自己" },
  hoarding: { text: "舍不得忘记", weight: 0.9, detail: "你舍不得扔掉任何带记忆的东西" },
  sentimental: { text: "为旧物流泪", weight: 0.9, detail: "旧物和旧事总能让你红了眼眶" },
  minimal: { text: "轻装上阵", weight: 0.7, detail: "你倾向于轻装上阵，不被多余的东西拖累" },
  focused: { text: "只记住重要的", weight: 0.8, detail: "你只记住真正重要的事情" },
  obscure: { text: "记忆需要慢慢对焦", weight: 1, detail: "你的记忆需要时间慢慢对焦才能看清" },
  layered: { text: "多重人格叠叠乐", weight: 1.1, detail: "你像洋葱一样，每一层都是不同的自己" },
  restless: { text: "停不下来", weight: 0.8, detail: "你停不下来，总是在寻找下一个什么" },
  adaptable: { text: "哪里都能睡", weight: 0.7, detail: "你能在任何环境中找到自己的位置" },
  faded: { text: "被时间洗淡", weight: 0.9, detail: "你觉得自己被时间慢慢洗淡了" },
  calm: { text: "表面平静", weight: 0.7, detail: "你的表面总是平静的，无论内心如何" },
  transient: { text: "知道一切都会过去", weight: 1, detail: "你深知一切都会过去，这让你既释然又伤感" },
  delicate: { text: "易碎但美丽", weight: 0.9, detail: "你像瓷器一样，美丽但容易碎" },
  warm: { text: "旧物般的温度", weight: 0.8, detail: "你有一种旧物般的温度，让人安心" },
  timeless: { text: "不受时代影响", weight: 0.8, detail: "你不受时代潮流的影响，有自己的节奏" },
  neutral: { text: "不站队", weight: 0.6, detail: "你不喜欢站队，更愿意保持中立" },
  escapist: { text: "需要偶尔消失", weight: 1, detail: "你需要偶尔从现实中消失一下" },
  wandering: { text: "没有目的地", weight: 0.9, detail: "你走路没有目的地，只是想走" },
  withdrawn: { text: "定期失联", weight: 0.9, detail: "你会定期让自己失联，这是充电方式" },
  self: { text: "和自己相处最好", weight: 0.8, detail: "和自己相处是你最自在的状态" },
  courageous: { text: "勇敢但害怕", weight: 1, detail: "你其实很害怕，但你还是会去做" },
  vulnerable: { text: "袒露是冒险", weight: 0.9, detail: "对你来说，袒露内心是一种冒险" },
  detached: { text: "身体在场心不在", weight: 0.9, detail: "你的身体在场，但心常常不在这里" },
  observer: { text: "生活的旁观者", weight: 1, detail: "你更习惯做生活的旁观者" },
  patient: { text: "愿意等", weight: 0.8, detail: "你愿意等，不急于得到答案" },
  depth: { text: "喜欢深的地方", weight: 0.9, detail: "你总是被更深的东西吸引" },
  authentic: { text: "讨厌表演", weight: 0.8, detail: "你讨厌表演，包括自己的表演" },
  human: { text: "欣赏瑕疵", weight: 0.8, detail: "你欣赏有瑕疵的真实胜过完美的虚假" },
  curious: { text: "还有问题想问", weight: 0.8, detail: "你对世界还有问不完的问题" },
  youthful: { text: "心比年龄小", weight: 0.7, detail: "你的心比你的年龄要小" },
  subtle: { text: "细微处见真章", weight: 0.9, detail: "你在细微之处看到别人看不到的东西" },
  imperfect: { text: "接受不完美的构图", weight: 0.9, detail: "你接受不完美的构图，因为那才是真实的" },
  atmospheric: { text: "氛围大于内容", weight: 1, detail: "对你来说，氛围比内容更重要" },
  incomplete: { text: "留白是设计", weight: 0.8, detail: "你相信留白本身就是一种设计" },
  genuine: { text: "真相比清晰重要", weight: 1, detail: "你认为真相比清晰更重要" },
  raw: { text: "不修饰", weight: 0.8, detail: "你不修饰自己的感受，让它们保持原样" },
  suggestive: { text: "暗示多于表达", weight: 0.9, detail: "你用暗示代替表达，留出想象空间" },
};

export const DIMENSIONS = {
  perception: {
    name: "感知力",
    traits: ["sensitive", "visual", "sensory", "observant", "aesthetic", "subtle", "atmospheric"],
  },
  introspection: {
    name: "内省力",
    traits: ["introspective", "reflective", "nostalgic", "contemplative", "philosophical", "abstract", "obscure", "layered"],
  },
  emotion: {
    name: "情感力",
    traits: ["emotional", "romantic", "melancholic", "sentimental", "vulnerable", "caring", "hopeful", "warm"],
  },
  independence: {
    name: "独立力",
    traits: ["solitary", "escapist", "wandering", "withdrawn", "detached", "self", "guarded", "enigmatic", "empty"],
  },
  authenticity: {
    name: "真实力",
    traits: ["direct", "expressive", "authentic", "genuine", "raw", "courageous", "honest", "pure", "wonder"],
  },
};

export const archetypeDescriptions = {
  dreamer: {
    title: "失焦的漫游者",
    description:
      "你活在自己的时区里。别人看你是模糊的，但你自己知道，模糊本身就是一种对焦方式。你不是在逃避现实，只是现实对你而言，从来就不是唯一的焦点。",
    narrative: {
      innerWorld: "你的内心像一间永远没开灯的房间——不是因为没有东西可看，而是因为你看东西的方式不需要光。你在模糊中找到清晰，在失焦中找到焦点。你的想象力不需要现实来验证，它自己就是证据。",
      inRelation: "你常常让人觉得若即若离，不是因为你不在乎，而是你的「在乎」和别人不太一样。你可能不会秒回消息，但会在深夜想起某个人时突然发一条很长的话。你的亲密方式是间歇性的，但每一次都是真的。",
      hiddenSide: "你看起来总是在飘，但其实你一直在观察。你的失焦不是逃避，而是一种更高级的对焦方式——你同时看到了所有可能性，只是还没决定选哪一个。你最大的恐惧不是迷失，而是被固定。",
    },
  },
  watcher: {
    title: "玻璃后面的旁观者",
    description:
      "你习惯隔着一层东西看世界——距离、时间、或者只是你自己的沉默。这不是冷漠，而是一种保护机制。你看得很清楚，只是很少说出来。",
    narrative: {
      innerWorld: "你的内心世界像一座图书馆，每一段经历都被你仔细归档。你不是没有感受，只是你的感受总是被你先观察一遍，然后才被允许存在。这种「先观察后感受」的模式让你显得冷静，但其实你的内心比任何人都要喧嚣。",
      inRelation: "你是那种会记住对方每一个小习惯的人，但很少说出来。你的关心是安静的——帮朋友占好座位、提前查好路线、在别人难过时默默陪在旁边。你不擅长说安慰的话，但你的存在本身就是一种安慰。",
      hiddenSide: "你隔着一层玻璃看世界，不是因为冷漠，而是因为太敏感。如果直接接触，你会被淹没。玻璃是你的保护层，也是你的监狱。你最大的矛盾是：你看得见一切，却觉得自己什么都触碰不到。",
    },
  },
  wanderer: {
    title: "没有地图的旅人",
    description:
      "你不是在找答案，你只是在享受问题本身。别人问你想要什么，你常常答不上来——不是因为不知道，是因为你想要的，大多是无法命名的。",
    narrative: {
      innerWorld: "你的内心没有固定的地形，今天是一片草原，明天可能变成一片海。你不觉得这有什么问题——为什么要把自己框在一个形状里？你的思维是发散的，你的兴趣是流动的，你的身份是多元的。你不是没有方向，你只是有太多方向。",
      inRelation: "你在关系中需要大量的自由空间，不是因为你不在乎对方，而是因为你知道被束缚的自己不是最好的自己。你可能会突然消失几天，然后带着一个新发现兴冲冲地回来。对你来说，最好的关系是两个人各自旅行，偶尔在路口相遇。",
      hiddenSide: "你看起来随性自由，但其实你一直在寻找一个值得停留的理由。你的漫游不是选择，而是惯性——你还没找到那个让你愿意放下背包的地方。你最大的秘密是：你比任何人都渴望一个家，只是你的「家」的定义和别人不一样。",
    },
  },
  echo: {
    title: "回声室里的独白者",
    description:
      "你的内心世界比外在丰富得多。你说的话很少，但心里已经演了一整部戏。你不是不合群，只是你的频道比较窄，不是所有人都能收到信号。",
    narrative: {
      innerWorld: "你的内心像一个回声室，每一个想法都会被反复折射、放大、变形。你不是在胡思乱想，你只是在用不同的角度理解同一件事。你的内心独白比任何对话都要丰富，有时候你甚至觉得，和自己说话比和别人说话有趣得多。",
      inRelation: "你在关系中是慢热的，但一旦热起来就很难冷却。你的情感是深沉的、持久的，但表达方式往往是间接的——你不会直接说「我想你」，但会默默记住对方提过的每一件小事。你的爱是安静的，但比任何宣言都要坚定。",
      hiddenSide: "你看起来安静内敛，但你的内心已经演了一整部戏。你的沉默不是空洞的，而是被太多声音填满的。你最大的痛苦是：你心里有那么多话想说，但每次开口都只说出了十分之一。你需要的不是更多的表达技巧，而是一个愿意听你说完的人。",
    },
  },
  ghost: {
    title: "透明边缘的栖居者",
    description:
      "你有一种让自己消失的天赋。在人群里、在关系中、甚至在自己的生活里。但消失不等于不存在，你只是在等一个不需要解释就能被看见的时刻。",
    narrative: {
      innerWorld: "你的内心像一间没有窗户的房间，但墙上画满了窗。你能看见外面的世界，但世界看不见你。这不是悲伤，这是你的生存方式——在透明中存在，在边缘处观察，在消失中保持完整。你的自我不需要被确认，它自己知道自己在那里。",
      inRelation: "你在关系中常常是隐形的——不是别人忽略你，而是你主动降低了自己的存在感。你可能在一群人中待了一整晚，但没有人记得你说了什么。这不是因为你无趣，而是因为你选择了一种更微妙的存在方式：在场，但不占位。",
      hiddenSide: "你有一种让自己消失的天赋，但消失不等于不存在。你像空气一样——看不见，但缺了你谁都活不了。你最大的渴望是：有一个人，不需要你解释，就能看见你。而你最大的恐惧是：这样的人可能不存在。",
    },
  },
};
