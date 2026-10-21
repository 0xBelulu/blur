import { PERSONA_FOCAL_Z } from "../../utils/personaSymbols";

/**
 * 光学场的两套特化参数。
 * 引擎（useOpticalField）与渲染壳（OpticalStage）是共用的，差异全部收在这里。
 *
 * focusMode
 *   "pointer" —— 焦平面跟随指针 / 陀螺仪（Landing 的原始行为，会随光标游走）
 *   "persona" —— 焦平面钉死，清晰度只由每个符号自己的景深 z 决定（做题页）
 */
export const LANDING_PRESET = {
  focusMode: "pointer",
  focusZ: 0.5,
  opacityCap: 1,
  minBlur: 0,
};

export const TEST_PRESET = {
  focusMode: "persona",
  focusZ: PERSONA_FOCAL_Z,
  // 做题页的 emoji 是背景，不能盖过题干
  opacityCap: 0.5,
  minBlur: 1.5,
};

/**
 * 探索页：一段嵌入在页面里的光学场（scope="container"）。
 * 仍然是指针对焦，但符号是十种原型，需要保持可读，所以不压透明度。
 */
export const ABOUT_PRESET = {
  focusMode: "pointer",
  focusZ: 0.5,
  opacityCap: 1,
  minBlur: 0,
  // 这一场只有 380px 高、十个符号，糊到 13.5px 就只剩色斑了
  maxBlur: 6.5,
};

// Shared full-viewport scenes. The embedded About field remains page content.
//
// atmosphere 是水彩层的强度，sky 是星点层的强度（数字，0 表示不显示）。
// 分档依据是「这一页要不要读字」：
//   1.0  首屏/做题页，气氛本身就是内容
//   0.7  探索页、阅读页（结果、我的空间、好友），能看到一层水彩但不抢图表
//   0.62 表单/弹窗（身份、邀请），再压一档
//   0.42 列表页，另叠一层 catalog 光斑补结构
export const PAGE_BACKGROUND_PRESETS = {
  landing: { atmosphere: 1, optical: 'landing' },
  test: { atmosphere: 1, optical: 'test' },
  about: { atmosphere: 0.7 },
  // 下一步页的星场自己就是一层气氛，水彩只需要托住它
  next: { atmosphere: 0.72, sky: 1 },
  // 结果页内容最重，但这里原先漏了配置，直接落到 plain —— 所以整页是纯白的
  result: { atmosphere: 0.7, sky: 0.6 },
  me: { atmosphere: 0.7, sky: 0.6 },
  // 身份页是表单/弹窗，压一档，别让背景和输入框抢注意力
  identity: { atmosphere: 0.62, sky: 0.5 },
  invite: { atmosphere: 0.62, sky: 0.5 },
  friend: { atmosphere: 0.7, sky: 0.6 },
  together: { atmosphere: 0.7, sky: 0.6 },
  archetypes: { atmosphere: 0.42, wash: 'catalog' },
  traits: { atmosphere: 0.42, wash: 'catalog' },
  questions: { atmosphere: 0.42, wash: 'catalog' },
  loading: { atmosphere: 0.32, wash: 'loading' },
  plain: { atmosphere: 0 },
};
