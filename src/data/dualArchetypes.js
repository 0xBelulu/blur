/**
 * 双原型共振与交融逻辑
 * 当用户在两个原型上的相似度非常接近时，呈现两者的交互与独特化学反应。
 */

export const DUAL_SYNERGIES = {
  "mist_negative": {
    title: "暗房中的隐雾者",
    description: "底片赋予你延迟消化的深度，而雾为你提供安全防御的边界。你不急于在人群中表态，在暗房与轻雾之间，守护着自己不被打扰的感受与未被过度曝光的真实。",
    coreTension: "在向内沉淀与对外防备之间寻求安全感",
  },
  "negative_mist": {
    title: "暗房中的隐雾者",
    description: "底片赋予你延迟消化的深度，而雾为你提供安全防御的边界。你不急于在人群中表态，在暗房与轻雾之间，守护着自己不被打扰的感受与未被过度曝光的真实。",
    coreTension: "在向内沉淀与对外防备之间寻求安全感",
  },
  "mist_chime": {
    title: "雾中微颤的风铃",
    description: "你内心拥有极度敏锐细腻的感官触角，却在外界为自己拉起了一层朦胧的保护纱帘。外界微小的风吹草动你全都能感知，却选择用克制与模糊将其温和地包裹起来。",
    coreTension: "在极度敏感与极力掩饰之间的张力",
  },
  "chime_mist": {
    title: "雾中微颤的风铃",
    description: "你内心拥有极度敏锐细腻的感官触角，却在外界为自己拉起了一层朦胧的保护纱帘。外界微小的风吹草动你全都能感知，却选择用克制与模糊将其温和地包裹起来。",
    coreTension: "在极度敏感与极力掩饰之间的张力",
  },
  "warmCurrent_salt": {
    title: "深海恒温的共鸣者",
    description: "暖流的热量传递与盐的无界渗透完美交融。你在人际中既能深刻同频他人的情绪，又能提供稳定持久的善意与托底。你走到哪里，哪里的坚冰就会被你悄然化解。",
    coreTension: "在无限给予善意与保持自我能量之间的平衡",
  },
  "salt_warmCurrent": {
    title: "深海恒温的共鸣者",
    description: "暖流的热量传递与盐的无界渗透完美交融。你在人际中既能深刻同频他人的情绪，又能提供稳定持久的善意与托底。你走到哪里，哪里的坚冰就会被你悄然化解。",
    coreTension: "在无限给予善意与保持自我能量之间的平衡",
  },
  "crystal_silhouette": {
    title: "清冽分明的守望者",
    description: "晶体的秩序棱角与剪影的克制轮廓高度同频。你对人际界限有着极高且清醒的要求，绝不含糊、不谄媚。你的可靠来自于清晰，你的尊重来自于不越界。",
    coreTension: "在纯粹秩序与真实人情温度之间的调和",
  },
  "silhouette_crystal": {
    title: "清冽分明的守望者",
    description: "晶体的秩序棱角与剪影的克制轮廓高度同频。你对人际界限有着极高且清醒的要求，绝不含糊、不谄媚。你的可靠来自于清晰，你的尊重来自于不越界。",
    coreTension: "在纯粹秩序与真实人情温度之间的调和",
  },
  "rainbow_kite": {
    title: "天际翱翔的求索者",
    description: "纸鸢的高远视野与虹的多元视角相互激荡。你拒绝被任何单一教条或狭隘定义束缚，你总能在高空俯瞰更广阔的可能性，并敏锐地捕捉不同观点中被忽略的闪光点。",
    coreTension: "在无边发散的设想与具体落地的行动之间拉扯",
  },
  "kite_rainbow": {
    title: "天际翱翔的求索者",
    description: "纸鸢的高远视野与虹的多元视角相互激荡。你拒绝被任何单一教条或狭隘定义束缚，你总能在高空俯瞰更广阔的可能性，并敏锐地捕捉不同观点中被忽略的闪光点。",
    coreTension: "在无边发散的设想与具体落地的行动之间拉扯",
  },
  "tide_kite": {
    title: "乘风破浪的逐流者",
    description: "潮汐的节律往返与纸鸢的上升力量碰撞。你深谙顺势而为的智慧，在风起时振翅高飞，在潮退时安心休憩。你拥有一种不执着于单一状态的动态平衡感。",
    coreTension: "在随波逐流的松弛与追求高飞的野心之间切换",
  },
  "kite_tide": {
    title: "乘风破浪的逐流者",
    description: "潮汐的节律往返与纸鸢的上升力量碰撞。你深谙顺势而为的智慧，在风起时振翅高飞，在潮退时安心休憩。你拥有一种不执着于单一状态的动态平衡感。",
    coreTension: "在随波逐流的松弛与追求高飞的野心之间切换",
  },
  "negative_warmCurrent": {
    title: "细水长流的恒定者",
    description: "暖流的善意与底片的沉淀结合。你的情感不是快餐式的爆发，而是日久见人心的温润。别人和你相处越久，越能体会到你那份历经时间显影后的真挚。",
    coreTension: "在慢热被动与渴望温暖连接之间的磨合",
  },
  "warmCurrent_negative": {
    title: "细水长流的恒定者",
    description: "暖流的善意与底片的沉淀结合。你的情感不是快餐式的爆发，而是日久见人心的温润。别人和你相处越久，越能体会到你那份历经时间显影后的真挚。",
    coreTension: "在慢热被动与渴望温暖连接之间的磨合",
  },
  "crystal_tide": {
    title: "礁石与浪涌的对话者",
    description: "你体内同时存在着对笃定秩序的渴求与对变化涨落的适应。你既有稳固如礁石的原则底色，又保留了潮水般自由呼吸与退让的余地。",
    coreTension: "在不可动摇的原则与随遇而安的灵活性之间流动",
  },
  "tide_crystal": {
    title: "礁石与浪涌的对话者",
    description: "你体内同时存在着对笃定秩序的渴求与对变化涨落的适应。你既有稳固如礁石的原则底色，又保留了潮水般自由呼吸与退让的余地。",
    coreTension: "在不可动摇的原则与随遇而安的灵活性之间流动",
  },
};

/**
 * 获取两个原型之间的交融解析
 */
export function getDualSynergy(keyA, keyB, profileA, profileB) {
  if (!keyA || !keyB) return null;
  const pairKey = `${keyA}_${keyB}`;
  if (DUAL_SYNERGIES[pairKey]) {
    return DUAL_SYNERGIES[pairKey];
  }
  const reverseKey = `${keyB}_${keyA}`;
  if (DUAL_SYNERGIES[reverseKey]) {
    return DUAL_SYNERGIES[reverseKey];
  }

  // 动态退火兜底生成
  const titleA = profileA?.title || "主原型";
  const titleB = profileB?.title || "次原型";
  return {
    title: `${titleA}与${titleB}的双相交融`,
    description: `${titleA}为你奠定了深刻的特质底色，而${titleB}为你提供了另一重敏锐的视角。你在两者之间穿梭，兼具两种原型的独特质感。`,
    coreTension: "在两种不同生活节律与认知倾向之间的动态平衡",
  };
}
