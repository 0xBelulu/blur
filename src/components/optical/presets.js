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
