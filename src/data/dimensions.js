/**
 * 通用心理维度定义
 * 新增人格时无需改动此文件 —— 维度是跨人格的通用语言
 */
export const DIMENSIONS = {
  energySource: {
    name: "能量来源",
    negative: "独处蓄能",
    positive: "社交共振",
    negativeDesc: "你在安静与独处中慢慢积蓄力量",
    positiveDesc: "你在人群与互动中激发灵感与热量",
    shadow: {
      negative: {
        triggerScene: "在漫长的热闹社交之后，或是情绪负荷接近临界点时",
        whyHidden: "日常为了不让气氛冷场，你总能自然配合群体，独自的疲惫往往无人察觉",
        latentPower: "在彻底的独处中自我修复、重构内在秩序的静定力",
      },
      positive: {
        triggerScene: "遇到真正同频的人、或是投身于发自内心热爱的具体事情时",
        whyHidden: "平时习惯留在安全的独处舒适区，不轻易为泛泛之交耗费心力",
        latentPower: "一旦打开心扉便能点燃全场、感染身旁他人的充沛热量",
      },
    },
  },
  sensorySensitivity: {
    name: "感官敏感度",
    negative: "专注锚定",
    positive: "敏锐共情",
    negativeDesc: "你自带抗噪护盾，专注在自己的重心",
    positiveDesc: "你能捕捉到空气里最细微的情绪与信号",
    shadow: {
      negative: {
        triggerScene: "在混乱吵闹、人人自顾不暇的突发危机时刻",
        whyHidden: "平时看似随和不争，别人误以为你缺乏定力，实则只是不愿被噪音干扰",
        latentPower: "自带降噪护盾、在风暴中心守住航向的极度专注力",
      },
      positive: {
        triggerScene: "捕捉到他人微小的叹息、眼神闪烁，或在某个毫无防备的动人瞬间",
        whyHidden: "为了避免情绪过载，你日常用理智或克制为自己筑起高墙",
        latentPower: "能看穿伪装、与他人痛苦或喜悦深层同振的纤细同理心",
      },
    },
  },
  emotionalLatency: {
    name: "情绪延迟",
    negative: "敏捷直截",
    positive: "从容沉淀",
    negativeDesc: "感受鲜明，你习惯即刻表达真实态度",
    positiveDesc: "情绪需要时间慢慢在心底沉淀与落定",
    shadow: {
      negative: {
        triggerScene: "当底线被猝不及防地踩中，或是遇到极致真诚、不绕弯子的人时",
        whyHidden: "习惯了深思熟虑再开口，你把第一时间的鲜明好恶悄悄压在舌尖下",
        latentPower: "不加粉饰的真实爆发力与拒绝内耗的利落锋芒",
      },
      positive: {
        triggerScene: "风波过去三天、一个月甚至更久之后的某个安静午后",
        whyHidden: "在事件发生的当下你总是显得平静淡然，所有人都以为你并不在意",
        latentPower: "经得起岁月冲刷、在时间发酵中显影的深刻长情",
      },
    },
  },
  cognitiveRange: {
    name: "认知跨度",
    negative: "聚焦纵深",
    positive: "广阔跳跃",
    negativeDesc: "你偏爱单线打穿核心，保持深度聚焦",
    positiveDesc: "你能同时在多个视角与可能性间跳跃",
    shadow: {
      negative: {
        triggerScene: "当终于被允许放下所有琐碎干扰、专心死磕一件真正热爱的事时",
        whyHidden: "日常生活中你不得不应对多线程任务，难以展现纯粹的深度专注",
        latentPower: "如手术刀般精准打穿表象、洞悉核心底层机理的钻研力",
      },
      positive: {
        triggerScene: "在漫无目的的发呆、散步，或是头脑风暴的灵感迸发时刻",
        whyHidden: "平时为了追求效率与执行，你强行把思维框在标准答案里",
        latentPower: "跳出常规轨道、在看似无关事物之间搭桥的非凡想象力",
      },
    },
  },
  boundaryClarity: {
    name: "边界清晰度",
    negative: "包容相溶",
    positive: "界限笃定",
    negativeDesc: "你与世界的边界柔软，能自然融入环境",
    positiveDesc: "你界限分明，清楚哪里是自己哪里是他人",
    shadow: {
      negative: {
        triggerScene: "在彻底放松、全心信任的至亲或知己面前",
        whyHidden: "日常防备心让你看起来客气疏离，别人很难真正走到你心底",
        latentPower: "卸下心防后全然交付、毫无保留去拥抱与接纳的温柔",
      },
      positive: {
        triggerScene: "当察觉到某种关系正在持续消耗你、或原则被无端试探时",
        whyHidden: "平时性格温和好说话，往往让人误以为你毫无底线与反击力",
        latentPower: "关键时刻敢于抽身离场、坚定保护自我的清醒冷峻",
      },
    },
  },
  temporalDepth: {
    name: "时间纵深",
    negative: "沉浸当下",
    positive: "远见回溯",
    negativeDesc: "你专注此时此刻的体验与行动",
    positiveDesc: "过去与未来总在你的当下交织回响",
    shadow: {
      negative: {
        triggerScene: "当完全沉浸在纯粹的感官体验中（如暴雨声、一顿美食、即兴漫游）",
        whyHidden: "平时脑子里总是塞满了对过去的回顾或对未来的长远规划",
        latentPower: "卸下时间重负、全心全意活在此刻的纯粹生命力",
      },
      positive: {
        triggerScene: "夜深人静翻看老物件，或站在人生十字路口审视长远轨迹时",
        whyHidden: "日常埋头处理眼前事务，周围人以为你只注重眼前即时的得失",
        latentPower: "把当下放在漫长岁月长河里审视的超然格局与历史感",
      },
    },
  },
  changeAffinity: {
    name: "变化亲和",
    negative: "守护稳定",
    positive: "拥抱未知",
    negativeDesc: "熟悉的环境与秩序是你不愿动摇的锚点",
    positiveDesc: "变化与未知的可能性让你充满活力",
    shadow: {
      negative: {
        triggerScene: "在身心俱疲、漂泊无定，极度渴望一个安全港湾时",
        whyHidden: "平时表现得很随和、勇于尝鲜，掩盖了心底对秩序与安全感的渴望",
        latentPower: "守护珍贵日常、为生活注入扎实仪式感的守成力量",
      },
      positive: {
        triggerScene: "在日复一日的平庸生活突然让你感到窒息与窒闷的瞬间",
        whyHidden: "理智和现实责任让你按部就班，暂时压抑了骨子里的冒险冲动",
        latentPower: "敢于打破既定轨道、在未知荒野中重新起飞的决绝勇气",
      },
    },
  },
  closureTolerance: {
    name: "闭合容忍",
    negative: "追求笃定",
    positive: "留白开放",
    negativeDesc: "你喜欢事情被清晰敲定并推进闭环",
    positiveDesc: "悬而未决与未完成的留白让你感到自在",
    shadow: {
      negative: {
        triggerScene: "面对关键交卷节点、或是关系需要一个痛快而决断的答案时",
        whyHidden: "平时表现得云淡风轻不争不抢，让人以为你对结果毫不在意",
        latentPower: "斩断所有暧昧拉扯、推动事情落地见底的强大魄力",
      },
      positive: {
        triggerScene: "当意识到有些事情没有标准答案、或者计划被意外打乱时",
        whyHidden: "平时做事习惯井井有条，紧绷的表象下其实藏着对失控的从容宽容",
        latentPower: "在不确定中从容起舞、允许一切发生的宽阔心境",
      },
    },
  },
  processingDepth: {
    name: "处理深度",
    negative: "直觉行动",
    positive: "深度推敲",
    negativeDesc: "直觉先行，你更习惯边做边看边调整",
    positiveDesc: "你习惯向内推敲事物的底层脉络与逻辑",
    shadow: {
      negative: {
        triggerScene: "在千钧一发、容不得反复推敲的紧急关头",
        whyHidden: "日常习惯反复权衡论证，把身体最本能的第一反应给压制了",
        latentPower: "绕过繁复思维阻碍、直接击中真相的野性动物本能与果敢",
      },
      positive: {
        triggerScene: "独处静坐、或是深度复盘一段复杂经历与对话时",
        whyHidden: "平时语速轻快、不显沉重，别人以为你只是随口一说并未多想",
        latentPower: "能抽丝剥茧还原人性幽微之处的哲思洞察力",
      },
    },
  },
  expressivity: {
    name: "表达外显",
    negative: "内蓄克制",
    positive: "直率坦荡",
    negativeDesc: "表达之前，你倾向于先向内沉淀与折叠",
    positiveDesc: "情绪透明，你习惯坦诚真切地面对世界",
    shadow: {
      negative: {
        triggerScene: "在群体情绪高涨喧嚣、人人都在争相表态的大场面里",
        whyHidden: "平时擅长人际互动，大家都以为你是个毫无保留的开朗外向者",
        latentPower: "在众声喧哗中保持静默、不被狂热裹挟的深邃内力",
      },
      positive: {
        triggerScene: "在遭遇虚伪做作、或是面对极度珍视的真诚知己时",
        whyHidden: "习惯了用委婉礼貌的客套做保护伞，不轻易吐露最真实的骨气",
        latentPower: "撕破所有形式主义、一语道破心声的滚烫赤诚",
      },
    },
  },
};

// key 列表的契约放在 shared/，服务端也要用；这里只是转出，
// scripts/unit-tests.js 会断言它与 DIMENSIONS 的键序完全一致。
export { DIMENSION_KEYS } from '../../shared/dimensions.js';

// 旧 trait 标签 → 维度增量的映射表曾在这里，用于把旧题库批量转成维度格式。
// 转换早已完成，题目文件本身就是维度格式，表没有任何消费方，已删除。

