import { useEffect, useRef } from "react";

// 空间散布的原型与感知意象符号（包含桌面端与移动端响应式坐标配置）
const SPATIAL_SYMBOLS = [
  // 前景组 (近焦平面，浅景深)
  {
    id: "rainbow",
    symbol: "🌈",
    x: 78,
    y: 70,
    mobileX: 82,
    mobileY: 86,
    z: 0.16,
    driftSpeed: 0.7,
    phase: 0.4,
  },
  {
    id: "bubble",
    symbol: "🫧",
    x: 91,
    y: 22,
    mobileX: 86,
    mobileY: 12,
    z: 0.22,
    driftSpeed: 1.1,
    phase: 2.1,
  },
  {
    id: "mist",
    symbol: "🌫️",
    x: 12,
    y: 16,
    mobileX: 12,
    mobileY: 10,
    z: 0.28,
    driftSpeed: 0.8,
    phase: 1.3,
  },
  {
    id: "kite",
    symbol: "🪁",
    x: 44,
    y: 82,
    mobileX: 52,
    mobileY: 93,
    z: 0.32,
    driftSpeed: 0.9,
    phase: 3.2,
  },

  // 中景组 (主对焦层，层次分明)
  {
    id: "leaf",
    symbol: "🍃",
    x: 88,
    y: 46,
    mobileX: 88,
    mobileY: 48,
    z: 0.42,
    driftSpeed: 1.0,
    phase: 4.5,
  },
  {
    id: "camera",
    symbol: "📷",
    x: 53,
    y: 13,
    mobileX: 50,
    mobileY: 6,
    z: 0.48,
    driftSpeed: 0.6,
    phase: 0.8,
  },
  {
    id: "sparkle",
    symbol: "✨",
    x: 26,
    y: 24,
    mobileX: 8,
    mobileY: 26,
    z: 0.52,
    driftSpeed: 1.2,
    phase: 5.1,
  },
  {
    id: "planet",
    symbol: "🪐",
    x: 84,
    y: 84,
    mobileX: 85,
    mobileY: 66,
    z: 0.58,
    driftSpeed: 0.5,
    phase: 2.7,
  },
  {
    id: "film",
    symbol: "🎞️",
    x: 67,
    y: 86,
    mobileHidden: true, // 移动端减负，保留呼吸留白
    z: 0.62,
    driftSpeed: 0.7,
    phase: 1.9,
  },
  {
    id: "prism",
    symbol: "💎",
    x: 7,
    y: 56,
    mobileX: 9,
    mobileY: 60,
    z: 0.68,
    driftSpeed: 0.8,
    phase: 3.8,
  },

  // 远景组 (深场景深，如夜空散景光斑)
  {
    id: "salt",
    symbol: "🧂",
    x: 19,
    y: 82,
    mobileX: 14,
    mobileY: 78,
    z: 0.76,
    driftSpeed: 0.6,
    phase: 4.1,
  },
  {
    id: "chime",
    symbol: "🎐",
    x: 81,
    y: 14,
    mobileX: 80,
    mobileY: 28,
    z: 0.82,
    driftSpeed: 0.9,
    phase: 0.2,
  },
  {
    id: "wave",
    symbol: "🌊",
    x: 34,
    y: 90,
    mobileX: 20,
    mobileY: 92,
    z: 0.88,
    driftSpeed: 0.5,
    phase: 5.6,
  },
  {
    id: "candle",
    symbol: "🕯️",
    x: 5,
    y: 38,
    mobileHidden: true, // 移动端避开标题区
    z: 0.92,
    driftSpeed: 0.7,
    phase: 2.9,
  },
];

// 丁达尔悬浮光尘粒子 (充盈三维空间微光空气感)
const STARDUST_PARTICLES = [
  { id: "dust1", x: 22, y: 32, z: 0.22, size: 4, color: "rgba(196,165,137,0.75)" },
  { id: "dust2", x: 74, y: 18, z: 0.42, size: 3.5, color: "rgba(155,142,199,0.7)" },
  { id: "dust3", x: 86, y: 70, z: 0.16, size: 4.5, color: "rgba(143,181,196,0.75)" },
  { id: "dust4", x: 16, y: 64, z: 0.68, size: 3, color: "rgba(196,155,165,0.65)" },
  { id: "dust5", x: 48, y: 22, z: 0.35, size: 3.5, color: "rgba(155,142,199,0.7)" },
  { id: "dust6", x: 62, y: 88, z: 0.54, size: 4, color: "rgba(196,165,137,0.75)" },
  { id: "dust7", x: 38, y: 76, z: 0.82, size: 3, color: "rgba(143,181,196,0.65)" },
  { id: "dust8", x: 92, y: 38, z: 0.58, size: 3.5, color: "rgba(196,155,165,0.7)" },
];

// 点按这些元素时不触发空间对焦（按钮/链接等自身已有交互反馈）
const INTERACTIVE_SELECTOR = "button, a, input, select, textarea, [role='button']";

export default function OpticalFocusSpace() {
  const containerRef = useRef(null);
  const elementsRef = useRef([]);
  const wrappersRef = useRef([]);
  const dustRef = useRef([]);
  const reticleRef = useRef(null);
  const focusOnSymbolRef = useRef(null);

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
    currentPositions: [], // 记录每个符号实时的屏幕像素坐标，用于精准点按命中
    // 点按对焦框 (Tap-to-Focus Reticle)
    reticle: {
      active: false,
      x: 0,
      y: 0,
      opacity: 0,
      scale: 1.4,
      timestamp: 0,
    },
  });

  useEffect(() => {
    const state = stateRef.current;
    let animationFrameId;

    // 触发设备轻微触觉反馈 (静默安全校验，避免 Chromium 未激活时的干预拦截)
    const triggerHaptic = () => {
      try {
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.vibrate === "function" &&
          (!navigator.userActivation || navigator.userActivation.hasBeenActive)
        ) {
          navigator.vibrate(10);
        }
      } catch {
        /* 静默容错 */
      }
    };

    // 激活点按对焦准星
    const triggerReticle = (x, y) => {
      state.reticle.x = x;
      state.reticle.y = y;
      state.reticle.opacity = 0.85;
      state.reticle.scale = 1.35;
      state.reticle.active = true;
      state.reticle.timestamp = performance.now();
      triggerHaptic();
    };

    // 直接对焦到指定的符号 (核心统一通道)
    const focusOnSymbol = (item, i) => {
      const pos = state.currentPositions[i];
      const isMobile = window.innerWidth < 768;
      const itemX = isMobile && item.mobileX !== undefined ? item.mobileX : item.x;
      const itemY = isMobile && item.mobileY !== undefined ? item.mobileY : item.y;
      const targetX = pos ? pos.x : (itemX / 100) * window.innerWidth;
      const targetY = pos ? pos.y : (itemY / 100) * window.innerHeight;

      state.activeFocusedId = item.id;
      state.targetZ = item.z;
      state.lastFocusTime = performance.now();
      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();

      triggerReticle(targetX, targetY);

      if (state.gyroActive) {
        state.baseBeta = state.rawBeta;
        state.baseGamma = state.rawGamma;
      }
    };

    focusOnSymbolRef.current = focusOnSymbol;

    // 在空白处点击时，寻找距离触点最近的符号并直接对焦它
    const focusOnClosest = (clientX, clientY) => {
      const isMobile = window.innerWidth < 768;
      let closestDist = Infinity;
      let closestIdx = -1;

      for (let i = 0; i < SPATIAL_SYMBOLS.length; i++) {
        const item = SPATIAL_SYMBOLS[i];
        if (isMobile && item.mobileHidden) continue;

        const pos = state.currentPositions[i];
        if (!pos) continue;

        const d = Math.hypot(pos.x - clientX, pos.y - clientY);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      }

      if (closestIdx !== -1 && closestDist < 280) {
        focusOnSymbol(SPATIAL_SYMBOLS[closestIdx], closestIdx);
        return true;
      }
      return false;
    };

    // 指针/光标移动追踪
    const handlePointerMove = (e) => {
      const { clientX, clientY } = e;

      state.mouseX = clientX;
      state.mouseY = clientY;
      state.mouseNormalizedX = (clientX / window.innerWidth) * 2 - 1;
      state.mouseNormalizedY = (clientY / window.innerHeight) * 2 - 1;
      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();
    };

    // 移动端/触屏轻触合焦（Tap-to-Focus）：直接对焦到点按的元素上！
    const handlePointerDown = (e) => {
      const { clientX, clientY } = e;

      state.mouseX = clientX;
      state.mouseY = clientY;
      state.mouseNormalizedX = (clientX / window.innerWidth) * 2 - 1;
      state.mouseNormalizedY = (clientY / window.innerHeight) * 2 - 1;
      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();

      // 点在按钮/链接等交互元素上时，不触发对焦、准星与震动反馈
      if (e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR)) return;

      const hit = focusOnClosest(clientX, clientY);
      if (!hit) {
        triggerReticle(clientX, clientY);
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
      state.hasInteracted = false;
      state.mouseX = -9999;
      state.mouseY = -9999;
      state.mouseNormalizedX = 0;
      state.mouseNormalizedY = 0;
    };

    // 移动端陀螺仪体感监听 (Device Orientation)
    const handleOrientation = (e) => {
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
    };

    // 动态屏幕自适应布局（桌面宽屏 vs 移动狭窄竖屏）
    const updateResponsiveLayout = () => {
      const isMobile = window.innerWidth < 768;
      for (let i = 0; i < SPATIAL_SYMBOLS.length; i++) {
        const item = SPATIAL_SYMBOLS[i];
        const wrapper = wrappersRef.current[i];
        if (!wrapper) continue;
        const x = isMobile && item.mobileX !== undefined ? item.mobileX : item.x;
        const y = isMobile && item.mobileY !== undefined ? item.mobileY : item.y;
        wrapper.style.left = `${x}%`;
        wrapper.style.top = `${y}%`;
      }
    };

    // 仅触屏（粗指针）设备启用陀螺仪，避免带传感器的笔电/平板抢走鼠标控制
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? true;

    updateResponsiveLayout();
    window.addEventListener("resize", updateResponsiveLayout, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    if (coarsePointer) {
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    }

    // 核心渲染循环（零 React 重渲染，纯 GPU 驱动）
    const tick = (now) => {
      const { innerWidth: width, innerHeight: height } = window;
      const isMobile = width < 768;
      const isIdle = !state.hasInteracted || now - state.lastInteractionTime > 2600;

      // 1. 统一相机视点计算 (低延迟、极度跟手)
      if (state.gyroActive) {
        // 降低手机端阻尼 (从 0.08 提升至 0.35，灵敏度与跟手性提升 4 倍)
        state.smoothBeta += (state.rawBeta - state.smoothBeta) * 0.35;
        state.smoothGamma += (state.rawGamma - state.smoothGamma) * 0.35;

        const deltaGamma = state.smoothGamma - state.baseGamma;
        const deltaBeta = state.smoothBeta - state.baseBeta;

        // 左右倾斜 -> 视点 CamX；前后倾斜 -> 视点 CamY
        state.targetCamX = Math.min(Math.max(deltaGamma / 14, -1.8), 1.8);
        state.targetCamY = Math.min(Math.max(deltaBeta / 16, -1.8), 1.8);
      } else {
        // 桌面端鼠标驱动相机视点
        state.targetCamX = state.mouseNormalizedX * 1.2;
        state.targetCamY = state.mouseNormalizedY * 1.2;
      }

      // 相机视点平滑追踪 (手机端 0.36 极度跟手，桌面端 0.12 丝滑微惯性)
      const camLerp = state.gyroActive ? 0.36 : 0.12;
      state.camX += (state.targetCamX - state.camX) * camLerp;
      state.camY += (state.targetCamY - state.camY) * camLerp;

      // 2. 独立焦平面 (FocusZ) 计算：手机与电脑端行为彻底统一！
      // 无论手机端还是电脑端，只要用户点击锁定了某个符号，镜头坚定锁定 4 秒
      if (state.activeFocusedId) {
        if (now - state.lastFocusTime > 4000) {
          state.activeFocusedId = null;
        }
      } else if (!isMobile && !isIdle) {
        // 电脑端鼠标移动 hover 时，柔和吸附到指针最近的符号
        let closestDist = Infinity;
        let closestItem = null;

        for (let i = 0; i < SPATIAL_SYMBOLS.length; i++) {
          const item = SPATIAL_SYMBOLS[i];
          const pos = state.currentPositions[i];
          if (!pos) continue;

          const d = Math.hypot(pos.x - state.mouseX, pos.y - state.mouseY);
          if (d < closestDist) {
            closestDist = d;
            closestItem = item;
          }
        }

        const FOCUS_RADIUS = 240;
        if (closestItem && closestDist < FOCUS_RADIUS) {
          const attractWeight = 1 - closestDist / FOCUS_RADIUS;
          state.targetZ = closestItem.z * attractWeight + 0.5 * (1 - attractWeight);
        } else {
          const depthInfluence = (state.mouseY / height) * 0.4 + 0.3;
          state.targetZ = depthInfluence;
        }
      } else {
        // 放空状态（未点按或无鼠标活动）：悠长自然的深呼吸漫游
        const t = now * 0.0003;
        state.targetZ = 0.5 + 0.3 * Math.sin(t) + 0.1 * Math.cos(t * 1.618);
      }

      // 焦平面保持相机镜头的精密平滑阻尼
      state.focusZ += (state.targetZ - state.focusZ) * 0.04;

      // 3. 相机呼吸效应（Focus Breathing）
      const breathingScale = 1.0 + (0.5 - state.focusZ) * 0.025 + Math.sin(now * 0.001) * 0.005;
      if (containerRef.current) {
        containerRef.current.style.transform = `scale(${breathingScale.toFixed(4)})`;
      }

      // 4. 更新点按对焦准星 (Reticle) 动效
      if (reticleRef.current && state.reticle.active) {
        const elapsed = now - state.reticle.timestamp;
        if (elapsed < 1100) {
          state.reticle.scale = Math.max(1.0, 1.35 - (elapsed / 250) * 0.35);
          state.reticle.opacity = Math.max(0, 0.85 * (1 - elapsed / 1100));
          reticleRef.current.style.opacity = state.reticle.opacity.toFixed(2);
          reticleRef.current.style.transform = `translate3d(${state.reticle.x.toFixed(1)}px, ${state.reticle.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${state.reticle.scale.toFixed(3)})`;
        } else {
          state.reticle.active = false;
          reticleRef.current.style.opacity = "0";
        }
      }

      // 5. 核心统一物理场：由每个符号唯一的空间深度 Z_i 严格统领视差与弥散圆
      for (let i = 0; i < SPATIAL_SYMBOLS.length; i++) {
        const item = SPATIAL_SYMBOLS[i];
        const el = elementsRef.current[i];
        if (!el) continue;

        if (isMobile && item.mobileHidden) {
          el.style.display = "none";
          continue;
        } else {
          el.style.display = "block";
        }

        const zi = item.z; // 绝对空间深度 (0.16 ~ 0.92)

        // 微物理浮动
        const driftT = now * 0.001 * item.driftSpeed + item.phase;
        const driftX = Math.sin(driftT * 0.8) * 8;
        const driftY = Math.cos(driftT * 0.6) * 10;

        // A. 严密三维透视视差公式：ΔPos = -Cam / (Z_i + Z_near)
        // 越近 (zi 越小) 移动越大，越远 (zi 越大) 越稳如泰山
        const perspectiveFactor = 28 / (zi + 0.34);
        const parallaxX = -state.camX * perspectiveFactor;
        const parallaxY = -state.camY * perspectiveFactor;

        // 记录符号在屏幕上的实时中心物理像素位置 (支持精准测距与直接对焦)
        const itemX = isMobile && item.mobileX !== undefined ? item.mobileX : item.x;
        const itemY = isMobile && item.mobileY !== undefined ? item.mobileY : item.y;
        state.currentPositions[i] = {
          x: (itemX / 100) * width + driftX + parallaxX,
          y: (itemY / 100) * height + driftY + parallaxY,
          z: zi,
          id: item.id,
        };

        // B. 严密薄透镜弥散圆公式 (Circle of Confusion)
        // 严格根据同一个 zi 和当前焦平面 focusZ 计算光学虚化
        const deltaZ = Math.abs(zi - state.focusZ);
        const coc = deltaZ / (zi * 0.82 + 0.2); // 前景虚化稍快于后景
        const blurPx = Math.min(13.5, Math.pow(Math.min(1, coc / 0.52), 1.25) * 13.5);
        const defocus = Math.min(1, blurPx / 11);

        // C. 清晰度与尺寸响应 (适度提升漫染透光基底，失焦如宣纸浮墨，合焦如发光水晶)
        const isFocused = state.activeFocusedId === item.id || blurPx < 0.9;
        const targetOpacity = isFocused ? 0.98 : 0.16 + (1 - defocus) * 0.72;
        const itemScale = isFocused ? 1.22 : 0.93 + (1 - defocus) * 0.22;

        // 更新 Emoji DOM 样式 (合焦时带有晶莹透镜微光 Bloom，告别干瘪生硬)
        el.style.transform = `translate3d(${(driftX + parallaxX).toFixed(1)}px, ${(driftY + parallaxY).toFixed(1)}px, 0) scale(${itemScale.toFixed(3)})`;
        if (isFocused) {
          el.style.filter = "blur(0px) drop-shadow(0 0 14px rgba(155,142,199,0.5)) drop-shadow(0 0 24px rgba(196,165,137,0.35))";
        } else {
          el.style.filter = `blur(${blurPx.toFixed(1)}px)`;
        }
        el.style.opacity = targetOpacity.toFixed(3);
      }

      // 6. 丁达尔微光星尘视差与呼吸流转
      for (let j = 0; j < STARDUST_PARTICLES.length; j++) {
        const dust = STARDUST_PARTICLES[j];
        const dustEl = dustRef.current[j];
        if (!dustEl) continue;

        const dFactor = 28 / (dust.z + 0.34);
        const dX = -state.camX * dFactor;
        const dY = -state.camY * dFactor;
        const pulse = 0.3 + 0.5 * Math.sin(now * 0.0018 + j * 1.2);

        dustEl.style.transform = `translate3d(${dX.toFixed(1)}px, ${dY.toFixed(1)}px, 0)`;
        dustEl.style.opacity = pulse.toFixed(2);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateResponsiveLayout);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      if (coarsePointer) {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
      focusOnSymbolRef.current = null;
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none overflow-hidden will-change-transform"
        aria-hidden="true"
      >
        {/* 丁达尔微光光尘 (充盈空间立体微粒感) */}
        {STARDUST_PARTICLES.map((dust, j) => (
          <div
            key={dust.id}
            ref={(node) => { dustRef.current[j] = node; }}
            className="absolute rounded-full pointer-events-none will-change-transform"
            style={{
              left: `${dust.x}%`,
              top: `${dust.y}%`,
              width: `${dust.size}px`,
              height: `${dust.size}px`,
              background: dust.color,
              boxShadow: `0 0 10px ${dust.color}`,
              opacity: 0.5,
            }}
          />
        ))}

        {SPATIAL_SYMBOLS.map((item, i) => (
          <div
            key={item.id}
            ref={(node) => { wrappersRef.current[i] = node; }}
            className="absolute select-none flex items-center justify-center will-change-transform cursor-pointer pointer-events-auto p-4 touch-manipulation group"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={(e) => {
              // 直接点按命中当前符号，直接锁定合焦
              e.stopPropagation();
              if (focusOnSymbolRef.current) {
                focusOnSymbolRef.current(item, i);
              }
            }}
          >
            {/* 纯粹悬浮 Emoji (自身产生真实光学景深弥散与锐度) */}
            <span
              ref={(node) => { elementsRef.current[i] = node; }}
              className="text-2xl md:text-3xl lg:text-[2rem] block transform-gpu cursor-default"
              style={{
                opacity: 0.1,
                filter: "blur(6px)",
                textShadow: "0 2px 10px rgba(0,0,0,0.04)",
              }}
            >
              {item.symbol}
            </span>
          </div>
        ))}
      </div>

      {/* 极简光学对焦框 (Tap-to-Focus Reticle)：独立于缩放容器，保持视口坐标精确 */}
      <div
        ref={reticleRef}
        className="fixed top-0 left-0 pointer-events-none w-14 h-14 will-change-transform"
        aria-hidden="true"
        style={{
          opacity: 0,
          transform: "translate(-50%, -50%) scale(1.4)",
        }}
      >
        {/* 四个角的极细对焦角标 */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-blur-accent/80 rounded-tl-[1px]" />
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-blur-accent/80 rounded-tr-[1px]" />
        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-blur-accent/80 rounded-bl-[1px]" />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-blur-accent/80 rounded-br-[1px]" />
        {/* 中心微弱对焦点 */}
        <div className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-blur-accent/70" />
      </div>
    </>
  );
}
