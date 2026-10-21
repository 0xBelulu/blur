import { useEffect, useRef } from "react";

import { SPATIAL_SYMBOLS, STARDUST_PARTICLES } from "./symbols";
import { ACCENT, GOLD, rgba } from "../../utils/palette.js";

// 合焦时那层"晶莹透镜微光"。只在对焦状态变化时写入，所以算一次就够。
const FOCUS_FILTER = `blur(0px) drop-shadow(0 0 14px ${rgba(ACCENT, 0.5)}) drop-shadow(0 0 24px ${rgba(GOLD, 0.35)})`;

// 点按这些元素时不触发空间对焦（按钮/链接等自身已有交互反馈）
const INTERACTIVE_SELECTOR = "button, a, input, select, textarea, [role='button']";

// 点按合焦锁定：被点击元素保持“清晰 + 微光”的时长（毫秒）
// 只负责锁住该元素自身的合焦外观，期间 hover 依然实时驱动视差与景深，不会冻结场景
const FOCUS_LOCK_MS = 4000;
// 陀螺仪读数新鲜度窗口：超时未收到读数即视为传感器静默，自动回退鼠标视差，杜绝视点卡死
const GYRO_FRESH_MS = 2000;
// 鼠标接管窗口：鼠标最近活动过时优先由鼠标驱动视差（鼠标 + 陀螺仪混合设备）
const MOUSE_TAKEOVER_MS = 4000;

const DUST_PULSE_SPEED = 0.0018;
const DUST_PULSE_DURATION = (2 * Math.PI) / DUST_PULSE_SPEED;
// Linear interpolation of this curve differs from the original sine by < 0.001.
// Opacity can run on the compositor while JS is busy switching pages/questions.
const DUST_PULSE_KEYFRAMES = [
  ...Array.from({ length: 129 }, (_, i) => ({
    offset: i / 128,
    opacity: Math.max(0, 0.3 + 0.5 * Math.sin((i / 128) * 2 * Math.PI)),
  })),
  // Include the exact zero crossings so interpolation never bridges the dark phase.
  ...[Math.PI + Math.asin(0.6), 2 * Math.PI - Math.asin(0.6)].map((angle) => ({
    offset: angle / (2 * Math.PI), opacity: 0,
  })),
].sort((a, b) => a.offset - b.offset);

/**
 * 光学场的物理引擎：相机视点、焦平面、透视视差、陀螺仪、点按对焦、逐帧 RAF。
 * 不含任何 DOM 结构 —— 只负责把每帧的 transform / filter / opacity 写进传入的节点上。
 *
 * 渲染壳在 OpticalStage.jsx，两边特化靠 presets.js。
 */
export function useOpticalField({
  symbols,
  stardust,
  focusMode = "pointer",
  focusZ = 0.5,
  opacityCap = 1,
  minBlur = 0,
  // 失焦上限：整屏场可以糊到 13.5px；缩小到一块区域时要收窄，否则符号会糊成色块
  maxBlur = 13.5,
  scope = "viewport",
  onFocusChange,
  active = true,
}) {
  const symbolList = symbols || SPATIAL_SYMBOLS;
  const symbolsRef = useRef(symbolList);
  const focusConfigRef = useRef({ focusMode, focusZ, opacityCap, minBlur, maxBlur });
  // "viewport" 覆盖整屏（Landing / 做题页）；"container" 只作用于容器矩形（探索页的嵌入场）。
  // 只影响指针归一化与命中判定，物理公式完全一致。
  const scopeRef = useRef(scope);
  const onFocusChangeRef = useRef(onFocusChange);
  const stardustRef = useRef(stardust || STARDUST_PARTICLES);
  // Cache DOM values as well as the existing blur/opacity thresholds.
  // Unchanged values don't need to cross the JS/DOM boundary again.
  const lastStyleRef = useRef([]);
  const activeRef = useRef(active);
  const syncActivityRef = useRef(null);

  useEffect(() => {
    activeRef.current = active;
    syncActivityRef.current?.();
  }, [active]);

  useEffect(() => {
    symbolsRef.current = symbolList;
  }, [symbolList]);

  useEffect(() => {
    if (focusConfigRef.current.focusMode !== focusMode) {
      // A scene change must not carry a tap lock/reticle into the new symbol set.
      const state = stateRef.current;
      state.activeFocusedId = null;
      state.reticle.active = false;
      state.reticle.opacity = 0;
      state.reticle.trackIndex = -1;
    }
    focusConfigRef.current = { focusMode, focusZ, opacityCap, minBlur, maxBlur };
  }, [focusMode, focusZ, opacityCap, minBlur, maxBlur]);

  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  useEffect(() => {
    onFocusChangeRef.current = onFocusChange;
  }, [onFocusChange]);

  const containerRef = useRef(null);
  const elementsRef = useRef([]);
  const wrappersRef = useRef([]);
  const dustRef = useRef([]);
  const reticleRef = useRef(null);
  const focusOnSymbolRef = useRef(null);
  const dustAnimationsRef = useRef([]);
  // 容器真实布局尺寸（Emoji 与对焦框共享同一坐标系，杜绝移动端动态视口换算误差）
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    stardustRef.current = stardust || STARDUST_PARTICLES;
    const animations = stardustRef.current.map((_, i) => {
      const el = dustRef.current[i];
      if (typeof el?.animate !== "function") return null;
      const animation = el.animate(DUST_PULSE_KEYFRAMES, {
        duration: DUST_PULSE_DURATION,
        iterations: Infinity,
        easing: "linear",
        delay: -(i * 1.2) / DUST_PULSE_SPEED,
      });
      // Match the original performance.now() phase, even after remounting.
      animation.startTime = 0;
      return animation;
    });
    dustAnimationsRef.current = animations;
    syncActivityRef.current?.();
    return () => {
      animations.forEach((animation) => animation?.cancel());
      dustAnimationsRef.current = [];
    };
  }, [stardust]);

  // 综合光学、交互与移动端传感器状态
  const stateRef = useRef({
    focusZ: 0.5,
    targetZ: 0.5,
    mouseX: -9999,
    mouseY: -9999,
    mouseNormalizedX: 0,
    mouseNormalizedY: 0,
    hasInteracted: false,
    lastInteractionTime: 0,
    // 统一相机视点 (驱动毫秒级透视视差)
    camX: 0,
    camY: 0,
    targetCamX: 0,
    targetCamY: 0,
    // 视差驱动源仲裁：鼠标与陀螺仪谁最近在活动，谁驱动视点（保证视差永不停摆）
    lastPointerActivity: 0,
    lastGyroActivity: 0,
    mouseDriven: false,
    // 移动端陀螺仪
    gyroActive: false,
    rawBeta: 50,
    rawGamma: 0,
    smoothBeta: 50,
    smoothGamma: 0,
    baseBeta: 50,
    baseGamma: 0,
    gyroCalibrated: false,
    gyroPermissionPending: false,
    gyroPermissionDenied: false,
    activeFocusedId: null,
    lastFocusTime: 0,
    // 已向外部回传的对焦符号 id，用于只在目标变化时通知（不逐帧驱动 React）
    emittedFocusId: undefined,
    currentPositions: [], // 记录每个符号实时的容器内像素坐标，用于精准点按命中
    // 点按对焦框 (Tap-to-Focus Reticle)：坐标一律使用容器坐标系
    reticle: {
      active: false,
      x: 0,
      y: 0,
      opacity: 0,
      scale: 1.4,
      timestamp: 0,
      trackIndex: -1, // 当前跟随的符号索引，>= 0 时对焦框持续锁定该元素
    },
  });

  useEffect(() => {
    const state = stateRef.current;
    let animationFrameId = null;
    let disposed = false;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let layoutSymbols;
    const offsets = [];
    const dustStyles = [];
    const containerStyle = {};
    const reticleStyle = {};
    const trackedOffset = {};
    const trackedPosition = {};
    // Strict Mode can restart effects on the same DOM; don't retain stale caches.
    lastStyleRef.current = [];

    const writeStyle = (el, cache, property, value) => {
      if (cache[property] === value) return;
      el.style[property] = value;
      cache[property] = value;
    };

    const symbolStyle = (i, el) => {
      const cached = lastStyleRef.current[i];
      if (cached?.el === el) return cached;
      return (lastStyleRef.current[i] = { el });
    };

    // 注：合焦时的触觉反馈已移除。随手点空白或滑动都会触发合焦，
    // 每次都震一下只会让人觉得触点脏。选选项的震动在 BlurCard 里，那个保留。

    // 激活点按对焦准星（坐标使用容器坐标系）
    const triggerReticle = (x, y) => {
      state.reticle.x = x;
      state.reticle.y = y;
      state.reticle.trackIndex = -1;
      state.reticle.opacity = 0.85;
      state.reticle.scale = 1.35;
      state.reticle.active = true;
      state.reticle.timestamp = performance.now();
    };

    // 对焦对象变化时才通知页面（用于渲染"当前对焦的是哪一枚"这类读数）
    const emitFocus = (item) => {
      const nextId = item?.id ?? null;
      if (state.emittedFocusId === nextId) return;
      state.emittedFocusId = nextId;
      onFocusChangeRef.current?.(item ?? null);
    };
    // 采样容器真实布局尺寸（Emoji 百分比坐标的基准，也是所有对焦坐标的基准）
    const measureContainer = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      const el = containerRef.current;
      if (!el) return;
      sizeRef.current.w = el.clientWidth;
      sizeRef.current.h = el.clientHeight;
    };
    measureContainer();

    // 视口坐标 → 容器坐标系（自动补偿页面过渡缩放与相机呼吸缩放，移动端点按绝不偏移）
    const toContainerPoint = (clientX, clientY) => {
      const { w, h } = sizeRef.current;
      const el = containerRef.current;
      if (!el || !w || !h) return { x: clientX, y: clientY };

      const rect = el.getBoundingClientRect();
      const scale = rect.width > 0 ? rect.width / w : 1;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      return {
        x: w / 2 + (clientX - centerX) / scale,
        y: h / 2 + (clientY - centerY) / scale,
      };
    };

    // 符号的微物理浮动 + 三维透视视差偏移（Emoji 渲染与对焦框跟随共用同一公式）
    const symbolOffset = (item, now, offset = {}) => {
      const driftT = now * 0.001 * item.driftSpeed + item.phase;
      if (offset.z !== item.z) {
        offset.z = item.z;
        offset.perspectiveFactor = 28 / (item.z + 0.34);
      }
      offset.driftX = Math.sin(driftT * 0.8) * 8;
      offset.driftY = Math.cos(driftT * 0.6) * 10;
      offset.parallaxX = -state.camX * offset.perspectiveFactor;
      offset.parallaxY = -state.camY * offset.perspectiveFactor;
      return offset;
    };

    // 符号在容器坐标系中的实时位置（与 Emoji 自身渲染完全同源）
    const symbolLocalPos = (item, now, offset, position = {}) => {
      const { w, h } = sizeRef.current;
      const isMobile = viewportWidth < 768;
      const x = isMobile && item.mobileX !== undefined ? item.mobileX : item.x;
      const y = isMobile && item.mobileY !== undefined ? item.mobileY : item.y;
      const off = offset || symbolOffset(item, now);
      position.x = (x / 100) * (w || viewportWidth) + off.driftX + off.parallaxX;
      position.y = (y / 100) * (h || viewportHeight) + off.driftY + off.parallaxY;
      return position;
    };

    // 直接对焦到指定的符号 (核心统一通道)
    const focusOnSymbol = (item, i) => {
      if (!activeRef.current) return;
      const local = symbolLocalPos(item, performance.now());

      state.activeFocusedId = item.id;
      state.targetZ = item.z;
      state.lastFocusTime = performance.now();
      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();

      triggerReticle(local.x, local.y);
      // 对焦框持续跟随该符号的浮动、视差与陀螺仪位移，始终严密框住元素
      state.reticle.trackIndex = i;
      emitFocus(item);

      if (state.gyroActive) {
        state.baseBeta = state.rawBeta;
        state.baseGamma = state.rawGamma;
      }
    };

    focusOnSymbolRef.current = focusOnSymbol;

    // 在空白处点击时，寻找距离触点最近的符号并直接对焦它
    const focusOnClosest = (point) => {
      const isMobile = viewportWidth < 768;
      let closestDist = Infinity;
      let closestIdx = -1;

      for (let i = 0; i < symbolsRef.current.length; i++) {
        const item = symbolsRef.current[i];
        if (isMobile && item.mobileHidden) continue;

        const pos = state.currentPositions[i];
        if (!pos) continue;

        const dx = pos.x - point.x;
        const dy = pos.y - point.y;
        const d = dx * dx + dy * dy;
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      }

      if (closestIdx !== -1 && closestDist < 280 * 280) {
        focusOnSymbol(symbolsRef.current[closestIdx], closestIdx);
        return true;
      }
      return false;
    };

    // 指针/光标移动追踪（同时挂在 pointerenter / pointerover 上，
    // 指针重新进入窗口时无需先移动就能立刻恢复视差驱动）
    const handlePointerMove = (e) => {
      if (!activeRef.current) return;
      const { clientX, clientY } = e;

      // 鼠标 / 触控笔活动：标记为鼠标驱动源并记录时刻，供视差驱动源仲裁使用
      if (e.pointerType !== "touch") state.mouseDriven = true;
      state.lastPointerActivity = performance.now();

      state.mouseX = clientX;
      state.mouseY = clientY;

      if (scopeRef.current === "container") {
        // 嵌入场：视差与对焦都只看容器内的相对位置，指针跑出容器就交还焦点
        const point = toContainerPoint(clientX, clientY);
        const { w, h } = sizeRef.current;
        if (w && h && (point.x < -48 || point.y < -48 || point.x > w + 48 || point.y > h + 48)) {
          emitFocus(null);
          return;
        }
        state.mouseNormalizedX = w ? Math.max(-1, Math.min(1, (point.x / w) * 2 - 1)) : 0;
        state.mouseNormalizedY = h ? Math.max(-1, Math.min(1, (point.y / h) * 2 - 1)) : 0;
      } else {
        state.mouseNormalizedX = (clientX / (window.innerWidth || 1)) * 2 - 1;
        state.mouseNormalizedY = (clientY / (window.innerHeight || 1)) * 2 - 1;
      }

      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();
    };

    // 移动端/触屏轻触合焦（Tap-to-Focus）：直接对焦到点按的元素上！
    const handlePointerDown = (e) => {
      if (!activeRef.current) return;
      const { clientX, clientY } = e;

      if (e.pointerType !== "touch") state.mouseDriven = true;
      state.lastPointerActivity = performance.now();

      state.mouseX = clientX;
      state.mouseY = clientY;
      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();

      // 点在按钮/链接等交互元素上时，不触发对焦、准星与震动反馈
      if (e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR)) return;

      // 触点换算到容器坐标系后测距，避免动态视口/缩放带来的错位
      const point = toContainerPoint(clientX, clientY);

      // 嵌入场：容器外的点按不属于这个场，交给页面自己的交互
      if (scopeRef.current === "container") {
        const { w, h } = sizeRef.current;
        if (w && h && (point.x < 0 || point.y < 0 || point.x > w || point.y > h)) return;
        state.mouseNormalizedX = w ? Math.max(-1, Math.min(1, (point.x / w) * 2 - 1)) : 0;
        state.mouseNormalizedY = h ? Math.max(-1, Math.min(1, (point.y / h) * 2 - 1)) : 0;
      } else {
        state.mouseNormalizedX = (clientX / (window.innerWidth || 1)) * 2 - 1;
        state.mouseNormalizedY = (clientY / (window.innerHeight || 1)) * 2 - 1;
      }

      const hit = focusOnClosest(point);
      if (!hit) {
        triggerReticle(point.x, point.y);
      }

      // 轻触时重置陀螺仪中立基准角
      if (state.gyroActive) {
        state.baseBeta = state.rawBeta;
        state.baseGamma = state.rawGamma;
      }

      // 请求 iOS 陀螺仪权限（仅一次，拒绝后不再重复打扰）
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function" &&
        !state.gyroActive &&
        !state.gyroPermissionPending &&
        !state.gyroPermissionDenied
      ) {
        state.gyroPermissionPending = true;
        DeviceOrientationEvent.requestPermission()
          .then((res) => {
            state.gyroPermissionPending = false;
            if (res === "granted") {
              state.gyroActive = true;
            } else {
              state.gyroPermissionDenied = true;
            }
          })
          .catch(() => {
            /* 被拒后平滑降级为鼠标/静态呼吸模式 */
            state.gyroPermissionPending = false;
            state.gyroPermissionDenied = true;
          });
      }
    };

    const handlePointerLeave = () => {
      if (!activeRef.current) return;
      // 指针真正离开窗口：清空鼠标位置，相机平滑回到中心并静止
      state.hasInteracted = false;
      state.mouseX = -9999;
      state.mouseY = -9999;
      state.mouseNormalizedX = 0;
      state.mouseNormalizedY = 0;
      emitFocus(null);
    };

    // 窗口失焦：只暂停“活动”状态，保留指针最后位置
    // 回到窗口后视差沿用原视点，不会突然弹回中心，也无需先移动鼠标才恢复
    const handleWindowBlur = () => {
      if (!activeRef.current) return;
      state.hasInteracted = false;
    };

    // 移动端陀螺仪体感监听 (Device Orientation)
    const handleOrientation = (e) => {
      if (!activeRef.current) return;
      const beta = e.beta;
      const gamma = e.gamma;
      if (beta === null || gamma === null) return;

      if (!state.gyroCalibrated) {
        state.baseBeta = beta;
        state.baseGamma = gamma;
        // 同步平滑值与真实读数，避免校准时相机从初值漂移
        state.smoothBeta = beta;
        state.smoothGamma = gamma;
        state.gyroCalibrated = true;
      }

      state.rawBeta = beta;
      state.rawGamma = gamma;
      state.gyroActive = true;
      state.lastGyroActivity = performance.now();
    };

    // 动态屏幕自适应布局（桌面宽屏 vs 移动狭窄竖屏）
    const updateResponsiveLayout = () => {
      const isMobile = viewportWidth < 768;
      for (let i = 0; i < symbolsRef.current.length; i++) {
        const item = symbolsRef.current[i];
        const wrapper = wrappersRef.current[i];
        if (!wrapper) continue;
        const x = isMobile && item.mobileX !== undefined ? item.mobileX : item.x;
        const y = isMobile && item.mobileY !== undefined ? item.mobileY : item.y;
        const cache = symbolStyle(i, elementsRef.current[i]);
        writeStyle(wrapper, cache, "left", `${x}%`);
        writeStyle(wrapper, cache, "top", `${y}%`);
      }
      layoutSymbols = symbolsRef.current;
    };

    // 仅触屏（粗指针）设备启用陀螺仪，避免带传感器的笔电/平板抢走鼠标控制
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? true;

    updateResponsiveLayout();
    // 视口变化与容器尺寸变化时同步基准尺寸（旋转、动态视口、内容增高都不会再造成错位）
    const handleViewportChange = () => {
      measureContainer();
      updateResponsiveLayout();
    };
    window.addEventListener("resize", handleViewportChange, { passive: true });
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measureContainer) : null;
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    // 指针重新进入窗口 / 悬停到任何元素上时即刻恢复视差驱动，不必先晃动鼠标
    window.addEventListener("pointerenter", handlePointerMove, { passive: true });
    window.addEventListener("pointerover", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("blur", handleWindowBlur);

    if (coarsePointer) {
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    }

    // The RAF loop only handles interactive physics; React never renders per frame.
    // 单帧异常绝不打断循环：任何一帧出错都会被跳过，下一帧照常继续，视差永不因此停摆
    let frameErrorLogged = false;

    const renderFrame = (now) => {
      const width = viewportWidth;
      const height = viewportHeight;
      const isMobile = width < 768;
      if (layoutSymbols !== symbolsRef.current) updateResponsiveLayout();
      const isIdle = !state.hasInteracted || now - state.lastInteractionTime > 2600;

      // 1. 统一相机视点计算 (低延迟、极度跟手)
      // 视差驱动源仲裁：只有“活着的输入”才能改变视点，任何一路失效都不会让视差停摆或乱飘。
      //   · 陀螺仪读数新鲜且鼠标未接管        → 陀螺仪驱动
      //   · 指针最近活跃（鼠标移动 / 拖动）    → 指针驱动
      //   · 两路都静默（传感器暂停 / 指针离开）→ 保持上一帧视点，绝不无端回中
      const pointerLive = now - state.lastPointerActivity < MOUSE_TAKEOVER_MS;
      const mouseActive = state.mouseDriven && pointerLive;
      const gyroFresh = state.gyroActive && now - state.lastGyroActivity < GYRO_FRESH_MS;
      const useGyro = gyroFresh && !mouseActive;
      const usePointer = !useGyro && pointerLive;

      if (useGyro) {
        // 降低手机端阻尼 (从 0.08 提升至 0.35，灵敏度与跟手性提升 4 倍)
        state.smoothBeta += (state.rawBeta - state.smoothBeta) * 0.35;
        state.smoothGamma += (state.rawGamma - state.smoothGamma) * 0.35;

        const deltaGamma = state.smoothGamma - state.baseGamma;
        const deltaBeta = state.smoothBeta - state.baseBeta;

        // 左右倾斜 -> 视点 CamX；前后倾斜 -> 视点 CamY
        state.targetCamX = Math.min(Math.max(deltaGamma / 14, -1.8), 1.8);
        state.targetCamY = Math.min(Math.max(deltaBeta / 16, -1.8), 1.8);
      } else if (usePointer) {
        // 鼠标驱动相机视点（陀螺仪静默时，触摸拖动同样可以兜底驱动视差）
        state.targetCamX = state.mouseNormalizedX * 1.2;
        state.targetCamY = state.mouseNormalizedY * 1.2;
      } else {
        // 无任何活动输入：视点原地保持，等待下一次真实输入继续驱动
        state.targetCamX = state.camX;
        state.targetCamY = state.camY;
      }

      // 相机视点平滑追踪 (手机端 0.36 极度跟手，桌面端 0.12 丝滑微惯性)
      const camLerp = useGyro ? 0.36 : 0.12;
      state.camX += (state.targetCamX - state.camX) * camLerp;
      state.camY += (state.targetCamY - state.camY) * camLerp;

      // 2. 独立焦平面 (FocusZ) 计算：手机与电脑端行为彻底统一！
      // 点击锁定只负责“锁住被点击元素自身的合焦外观”，不再阻断 hover 的连续响应：
      // 锁定到期自动释放；到期前只要鼠标在动，焦平面就始终跟着指针走（视差永不被冻结）
      if (state.activeFocusedId && now - state.lastFocusTime > FOCUS_LOCK_MS) {
        state.activeFocusedId = null;
      }

      if (focusConfigRef.current.focusMode === "persona") {
        // 焦平面钉死：清晰度只由每个符号自己的 z 决定，不再跟着指针跑
        const t = now * 0.0004;
        state.targetZ = focusConfigRef.current.focusZ + Math.sin(t) * 0.015;
      } else if (!isMobile && !isIdle) {
        // 电脑端鼠标移动 hover 时，柔和吸附到指针最近的符号（锁定期间同样生效）
        // 指针先换算到容器坐标系，与 currentPositions 严格同坐标系测距
        const pointer = toContainerPoint(state.mouseX, state.mouseY);
        let closestDist = Infinity;
        let closestItem = null;

        for (let i = 0; i < symbolsRef.current.length; i++) {
          const item = symbolsRef.current[i];
          const pos = state.currentPositions[i];
          if (!pos) continue;

          const dx = pos.x - pointer.x;
          const dy = pos.y - pointer.y;
          const d = dx * dx + dy * dy;
          if (d < closestDist) {
            closestDist = d;
            closestItem = item;
          }
        }

        const FOCUS_RADIUS = 240;
        const inRange = Boolean(closestItem) && closestDist < FOCUS_RADIUS * FOCUS_RADIUS;
        if (inRange) {
          const attractWeight = 1 - Math.sqrt(closestDist) / FOCUS_RADIUS;
          state.targetZ = closestItem.z * attractWeight + 0.5 * (1 - attractWeight);
        } else {
          const { h } = sizeRef.current;
          const depthInfluence = (pointer.y / (h || height)) * 0.4 + 0.3;
          state.targetZ = depthInfluence;
        }

        // 对焦读数：点按锁定的符号优先，其次是指针最近的那一枚
        const lockedItem = state.activeFocusedId
          ? symbolsRef.current.find((item) => item.id === state.activeFocusedId)
          : null;
        emitFocus(lockedItem || (inRange ? closestItem : null));
      } else if (!state.activeFocusedId) {
        // 放空状态（未点按或无鼠标活动）：悠长自然的深呼吸漫游
        // 锁定有效期内则保持 targetZ 停在被点击的符号上，不做漫游
        const t = now * 0.0003;
        state.targetZ = 0.5 + 0.3 * Math.sin(t) + 0.1 * Math.cos(t * 1.618);
      }

      // 焦平面保持相机镜头的精密平滑阻尼
      state.focusZ += (state.targetZ - state.focusZ) * 0.04;

      // 3. 相机呼吸效应（Focus Breathing）
      const breathingScale = 1.0 + (0.5 - state.focusZ) * 0.025 + Math.sin(now * 0.001) * 0.005;
      if (containerRef.current) {
        writeStyle(containerRef.current, containerStyle, "transform", `scale(${breathingScale.toFixed(4)})`);
      }

      // 4. 更新点按对焦准星 (Reticle) 动效（容器坐标系 → 屏幕，补偿呼吸缩放）
      if (reticleRef.current && state.reticle.active) {
        const elapsed = now - state.reticle.timestamp;
        if (elapsed < 1100) {
          const { w, h } = sizeRef.current;
          const cw = w || width;
          const ch = h || height;
          let reticleX = state.reticle.x;
          let reticleY = state.reticle.y;

          // 对焦框跟随目标符号：与 Emoji 使用同一套位移公式，且补上相机呼吸缩放
          const trackIdx = state.reticle.trackIndex;
          if (trackIdx >= 0 && trackIdx < symbolsRef.current.length) {
            const tracked = symbolsRef.current[trackIdx];
            if (!(isMobile && tracked.mobileHidden)) {
              const local = symbolLocalPos(tracked, now, symbolOffset(tracked, now, trackedOffset), trackedPosition);
              reticleX = cw / 2 + (local.x - cw / 2) * breathingScale;
              reticleY = ch / 2 + (local.y - ch / 2) * breathingScale;
            }
          }

          state.reticle.scale = Math.max(1.0, 1.35 - (elapsed / 250) * 0.35);
          state.reticle.opacity = Math.max(0, 0.85 * (1 - elapsed / 1100));
          writeStyle(reticleRef.current, reticleStyle, "opacity", state.reticle.opacity.toFixed(2));
          writeStyle(reticleRef.current, reticleStyle, "transform", `translate3d(${reticleX.toFixed(1)}px, ${reticleY.toFixed(1)}px, 0) translate(-50%, -50%) scale(${state.reticle.scale.toFixed(3)})`);
        } else {
          state.reticle.active = false;
          state.reticle.trackIndex = -1;
          writeStyle(reticleRef.current, reticleStyle, "opacity", "0");
        }
      } else if (reticleRef.current) {
        writeStyle(reticleRef.current, reticleStyle, "opacity", "0");
      }

      // 5. 核心统一物理场：由每个符号唯一的空间深度 Z_i 严格统领视差与弥散圆
      for (let i = 0; i < symbolsRef.current.length; i++) {
        const item = symbolsRef.current[i];
        const el = elementsRef.current[i];
        if (!el) continue;
        const last = symbolStyle(i, el);

        writeStyle(el, last, "display", isMobile && item.mobileHidden ? "none" : "block");
        if (isMobile && item.mobileHidden) {
          continue;
        }

        const zi = item.z; // 绝对空间深度 (0.16 ~ 0.92)

        // 微物理浮动 + 三维透视视差（与对焦框共用同一公式，保证框体严密锁定元素）
        const offset = symbolOffset(item, now, offsets[i] || (offsets[i] = {}));
        const position = state.currentPositions[i] || (state.currentPositions[i] = {});
        symbolLocalPos(item, now, offset, position);

        // 记录符号在容器坐标系中的实时中心位置 (支持精准测距与直接对焦)
        position.z = zi;
        position.id = item.id;

        // B. 严密薄透镜弥散圆公式 (Circle of Confusion)
        // 严格根据同一个 zi 和当前焦平面 focusZ 计算光学虚化
        const deltaZ = Math.abs(zi - state.focusZ);
        const coc = deltaZ / (zi * 0.82 + 0.2); // 前景虚化稍快于后景
        const { opacityCap: cap, minBlur: blurFloor, maxBlur: blurCeiling } = focusConfigRef.current;
        const blurPx = Math.min(blurCeiling, Math.pow(Math.min(1, coc / 0.52), 1.25) * blurCeiling);
        const defocus = Math.min(1, blurPx / (blurCeiling * 0.82));

        // C. 清晰度与尺寸响应 (适度提升漫染透光基底，失焦如宣纸浮墨，合焦如发光水晶)
        // sharp: 星图里的「你」——不参与失焦，但仍然共享同一套漂移与视差。
        const sharp = item.sharp === true;
        const isFocused = !sharp && (state.activeFocusedId === item.id || blurPx < 0.9);
        const targetOpacity = sharp ? 1 : isFocused ? 0.98 : 0.16 + (1 - defocus) * 0.72;
        const itemScale = sharp ? 1 : isFocused ? 1.22 : 0.93 + (1 - defocus) * 0.22;

        // 做题页把上限压下来：emoji 是背景，不能盖过题干
        const renderBlur = sharp ? 0 : Math.max(blurFloor, blurPx);
        const renderOpacity = Math.min(cap, targetOpacity);

        // 更新 Emoji DOM 样式 (合焦时带有晶莹透镜微光 Bloom，告别干瘪生硬)
        writeStyle(el, last, "transform", `translate3d(${(offset.driftX + offset.parallaxX).toFixed(1)}px, ${(offset.driftY + offset.parallaxY).toFixed(1)}px, 0) scale(${itemScale.toFixed(3)})`);

        // Keep the existing visual thresholds for the expensive blur changes.
        const focusChanged = last.focused !== isFocused || last.sharp !== sharp;

        if (focusChanged || last.blur === undefined || Math.abs(last.blur - renderBlur) > 0.4) {
          if (sharp) {
            el.style.filter = "none";
          } else if (isFocused && blurFloor === 0) {
            el.style.filter = FOCUS_FILTER;
          } else {
            el.style.filter = `blur(${renderBlur.toFixed(1)}px)`;
          }
          last.blur = renderBlur;
          last.focused = isFocused;
          last.sharp = sharp;
        }

        if (last.opacity === undefined || Math.abs(last.opacity - renderOpacity) > 0.02) {
          el.style.opacity = renderOpacity.toFixed(3);
          last.opacity = renderOpacity;
        }
      }

      // 6. 丁达尔微光星尘视差与呼吸流转
      for (let j = 0; j < stardustRef.current.length; j++) {
        const dust = stardustRef.current[j];
        const dustEl = dustRef.current[j];
        if (!dustEl) continue;

        const last = dustStyles[j]?.el === dustEl ? dustStyles[j] : (dustStyles[j] = { el: dustEl });
        if (last.z !== dust.z) {
          last.z = dust.z;
          last.perspectiveFactor = 28 / (dust.z + 0.34);
        }
        const dFactor = last.perspectiveFactor;
        const dX = -state.camX * dFactor;
        const dY = -state.camY * dFactor;
        writeStyle(dustEl, last, "transform", `translate3d(${dX.toFixed(1)}px, ${dY.toFixed(1)}px, 0)`);
        // Older engines without WAAPI retain the original pulse as a fallback.
        if (!dustAnimationsRef.current[j]) {
          const pulse = 0.3 + 0.5 * Math.sin(now * DUST_PULSE_SPEED + j * 1.2);
          writeStyle(dustEl, last, "opacity", pulse.toFixed(2));
        }
      }
    };

    const tick = (now) => {
      animationFrameId = null;
      if (disposed || document.hidden || !activeRef.current) return;
      try {
        renderFrame(now);
      } catch (error) {
        // 静默容错：只提示一次，避免逐帧刷屏
        if (!frameErrorLogged) {
          frameErrorLogged = true;
          console.warn("[OpticalFocusSpace] 单帧渲染异常，已跳过该帧：", error);
        }
      }
      if (!disposed && !document.hidden && activeRef.current) animationFrameId = requestAnimationFrame(tick);
    };

    const handleVisibilityChange = () => {
      const running = !disposed && !document.hidden && activeRef.current;
      for (const animation of dustAnimationsRef.current) {
        if (!animation) continue;
        if (!running && animation.playState !== 'paused') animation.pause();
        else if (running && animation.playState === 'paused') {
          animation.play();
          // Restore the shared clock used by the JS fallback as well.
          animation.startTime = 0;
        }
      }
      if (!running) {
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      } else if (!disposed && animationFrameId === null) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };
    syncActivityRef.current = handleVisibilityChange;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleVisibilityChange();

    return () => {
      disposed = true;
      syncActivityRef.current = null;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleViewportChange);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerenter", handlePointerMove);
      window.removeEventListener("pointerover", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handleWindowBlur);
      if (coarsePointer) {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
      focusOnSymbolRef.current = null;
    };
  }, []);

  return {
    containerRef,
    elementsRef,
    wrappersRef,
    dustRef,
    reticleRef,
    focusOnSymbolRef,
  };
}
