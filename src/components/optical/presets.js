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
