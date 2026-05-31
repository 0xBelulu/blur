export const rankQuestions = [
  {
    id: 18,
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
    type: "rank",
    text: "以下四种场景，按「最让你安心 → 最让你不安」排序：",
    options: [
      { id: "a", text: "大雾中的高速公路，看不清前方", traits: ["misty", "softedge"] },
      { id: "b", text: "暴雨打在窗户上，声音填满房间", traits: ["thunder", "loud"] },
      { id: "c", text: "海边的悬崖，潮水在下方进退", traits: ["tidal", "shifting"] },
      { id: "d", text: "深夜的湖面，没有波纹也没有声音", traits: ["deepwatch", "stilled"] },
    ],
  },
  {
    id: 36,
    type: "rank",
    text: "以下四种早晨，按「最像你 → 最不像你」排序：",
    options: [
      { id: "a", text: "被闹钟惊醒，脑子里已经有十个待办", traits: ["saturated", "overwhelming"] },
      { id: "b", text: "自然醒，但不知道今天该做什么", traits: ["adrift", "vague"] },
      { id: "c", text: "醒得很早，躺着听雨声", traits: ["stilled", "patient"] },
      { id: "d", text: "睡过头了，但无所谓", traits: ["fluid", "shifting"] },
    ],
  },
  {
    id: 37,
    type: "rank",
    text: "以下四种对话方式，按「你最常使用 → 你最不常用」排序：",
    options: [
      { id: "a", text: "先说「让我想想」，然后沉默很久", traits: ["sunken", "abyssal"] },
      { id: "b", text: "同时抛出好几个观点，让对方自己整理", traits: ["manifold", "reverberant"] },
      { id: "c", text: "用比喻和暗示，不直接表达", traits: ["misty", "softedge"] },
      { id: "d", text: "直接说出当下最真实的感受", traits: ["acute", "loud"] },
    ],
  },
  {
    id: 38,
    type: "rank",
    text: "以下四种旅行方式，按「最吸引你 → 最不吸引你」排序：",
    options: [
      { id: "a", text: "去一个完全陌生、语言不通的地方", traits: ["fleeing", "unmoored"] },
      { id: "b", text: "回到一个去过很多次的地方", traits: ["sedimentary", "deepwatch"] },
      { id: "c", text: "临时决定目的地，不做攻略", traits: ["fluid", "tidal"] },
      { id: "d", text: "跟着别人走，不需要自己做决定", traits: ["guarded", "filtered"] },
    ],
  },
  {
    id: 39,
    type: "rank",
    text: "以下四种房间，按「最想待在里面 → 最不想待」排序：",
    options: [
      { id: "a", text: "四面都是落地窗，阳光直射", traits: ["acute", "saturated"] },
      { id: "b", text: "拉着厚窗帘，只有一盏暖光灯", traits: ["shielded", "softedge"] },
      { id: "c", text: "墙上挂满不同地方的地图和照片", traits: ["unmoored", "shifting"] },
      { id: "d", text: "空无一物，只有一把椅子和一扇窗", traits: ["stilled", "abyssal"] },
    ],
  },
  {
    id: 40,
    type: "rank",
    text: "以下四种时间感受，按「最像你 → 最不像你」排序：",
    options: [
      { id: "a", text: "时间像潮水，有涨有退，不受我控制", traits: ["tidal", "fluid"] },
      { id: "b", text: "时间像深井，所有事情都沉在底部", traits: ["sedimentary", "sunken"] },
      { id: "c", text: "时间像棱镜，同一段经历折射出不同版本", traits: ["prismatic", "refracted"] },
      { id: "d", text: "时间像雾，过去和未来都看不清", traits: ["misty", "vague"] },
    ],
  },

  // ===== 新增排序题 =====
  {
    id: 53,
    type: "rank",
    text: "以下四种结束一天的方式，按「最像你 → 最不像你」排序：",
    options: [
      { id: "a", text: "躺在床上复盘今天所有对话", traits: ["reverberant", "overwhelming"] },
      { id: "b", text: "立刻切换到娱乐模式，把白天忘掉", traits: ["filtered", "shifting"] },
      { id: "c", text: "什么都不做，等困意自然来", traits: ["stilled", "patient"] },
      { id: "d", text: "为明天列清单，但越列越清醒", traits: ["manifold", "acute"] },
    ],
  },
  {
    id: 54,
    type: "rank",
    text: "以下四种面对批评的反应，按「最像你 → 最不像你」排序：",
    options: [
      { id: "a", text: "表面接受，内心筑起一道墙", traits: ["shielded", "guarded"] },
      { id: "b", text: "当场反驳，事后又反复后悔", traits: ["acute", "thunder"] },
      { id: "c", text: "试图理解对方的视角，反而更混乱", traits: ["prismatic", "equivocal"] },
      { id: "d", text: "沉默消化，过几天才给出回应", traits: ["sunken", "abyssal"] },
    ],
  },
  {
    id: 55,
    type: "rank",
    text: "以下四种工作环境，按「最理想 → 最不理想」排序：",
    options: [
      { id: "a", text: "开放式办公室，随时有人交流", traits: ["saturated", "loud"] },
      { id: "b", text: "完全独立的空间，不受任何打扰", traits: ["abyssal", "filtered"] },
      { id: "c", text: "可以到处走动，没有固定工位", traits: ["adrift", "fluid"] },
      { id: "d", text: "有固定流程和明确边界的工作", traits: ["patient", "guarded"] },
    ],
  },
  {
    id: 56,
    type: "rank",
    text: "以下四种「美」的体验，按「最打动你 → 最无感」排序：",
    options: [
      { id: "a", text: "一个完美对称、秩序井然的画面", traits: ["acute", "stilled"] },
      { id: "b", text: "一个破损但有故事的旧物", traits: ["faded", "sedimentary"] },
      { id: "c", text: "多种颜色/声音意外碰撞的瞬间", traits: ["refracted", "saturated"] },
      { id: "d", text: "留白很多、意味深长的沉默", traits: ["vague", "abyssal"] },
    ],
  },
  {
    id: 71,
    type: "rank",
    text: "以下四种状态，按「最像你 → 最不像你」排序：",
    options: [
      { id: "a", text: "融化在一个地方的气氛里，分不清自己和环境", traits: ["dissolving", "permeable"] },
      { id: "b", text: "看着自己的感受像照片一样慢慢显影", traits: ["darkroom", "latent"] },
      { id: "c", text: "随着自己能量的自然节律起伏", traits: ["rhythmic", "pulsing"] },
      { id: "d", text: "站在一个只露出轮廓的角度", traits: ["backlit", "edgeonly"] },
    ],
  },
  {
    id: 72,
    type: "rank",
    text: "以下四种场景，按「最让你安心 → 最让你不安」排序：",
    options: [
      { id: "a", text: "所有边界都模糊的空间，什么都连在一起", traits: ["blended", "seeping"] },
      { id: "b", text: "一间暗房，图像会慢慢浮现", traits: ["undeveloped", "inverse"] },
      { id: "c", text: "海浪的声音，持续而有节奏", traits: ["cyclical", "oscillating"] },
      { id: "d", text: "一束强光从身后打来，你的影子很清晰", traits: ["shadowed", "outlined"] },
    ],
  },
];
