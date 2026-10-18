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

// 点按合焦锁定：被点击元素保持“清晰 + 微光”的时长（毫秒）
// 只负责锁住该元素自身的合焦外观，期间 hover 依然实时驱动视差与景深，不会冻结场景
const FOCUS_LOCK_MS = 4000;
// 陀螺仪读数新鲜度窗口：超时未收到读数即视为传感器静默，自动回退鼠标视差，杜绝视点卡死
const GYRO_FRESH_MS = 2000;
// 鼠标接管窗口：鼠标最近活动过时优先由鼠标驱动视差（鼠标 + 陀螺仪混合设备）
const MOUSE_TAKEOVER_MS = 4000;

/**
 * 光学对焦背景（Landing / 做题页共用）
 *
 * symbols 可选：不传则用 Landing 的固定 14 个空间符号；
 * 做题页传入由实时解算结果生成的符号表，渲染与交互逻辑完全一致。
 * 符号表变化时只换 emoji 字形与归属，不重跑 effect（位置、视差、陀螺仪状态全部保持）。
 */
export default function OpticalFocusSpace({ symbols }) {
  const symbolList = symbols || SPATIAL_SYMBOLS;
  const symbolsRef = useRef(symbolList);

  useEffect(() => {
    symbolsRef.current = symbolList;
  }, [symbolList]);

  const containerRef = useRef(null);
  const elementsRef = useRef([]);
  const wrappersRef = useRef([]);
  const dustRef = useRef([]);
  const reticleRef = useRef(null);
  const focusOnSymbolRef = useRef(null);
  // 容器真实布局尺寸（Emoji 与对焦框共享同一坐标系，杜绝移动端动态视口换算误差）
  const sizeRef = useRef({ w: 0, h: 0 });

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

    // 采样容器真实布局尺寸（Emoji 百分比坐标的基准，也是所有对焦坐标的基准）
    const measureContainer = () => {
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
    const symbolOffset = (item, now) => {
      const driftT = now * 0.001 * item.driftSpeed + item.phase;
      const perspectiveFactor = 28 / (item.z + 0.34);

      return {
        driftX: Math.sin(driftT * 0.8) * 8,
        driftY: Math.cos(driftT * 0.6) * 10,
        parallaxX: -state.camX * perspectiveFactor,
        parallaxY: -state.camY * perspectiveFactor,
      };
    };

    // 符号基准百分比坐标（移动端使用专属布局坐标）
    const symbolBase = (item) => {
      const isMobile = window.innerWidth < 768;
      return {
        x: isMobile && item.mobileX !== undefined ? item.mobileX : item.x,
        y: isMobile && item.mobileY !== undefined ? item.mobileY : item.y,
      };
    };

    // 符号在容器坐标系中的实时位置（与 Emoji 自身渲染完全同源）
    const symbolLocalPos = (item, now, offset) => {
      const { w, h } = sizeRef.current;
      const base = symbolBase(item);
      const off = offset || symbolOffset(item, now);

      return {
        x: (base.x / 100) * (w || window.innerWidth) + off.driftX + off.parallaxX,
        y: (base.y / 100) * (h || window.innerHeight) + off.driftY + off.parallaxY,
      };
    };

    // 激活点按对焦准星（坐标使用容器坐标系）
    const triggerReticle = (x, y) => {
      state.reticle.x = x;
      state.reticle.y = y;
      state.reticle.trackIndex = -1;
      state.reticle.opacity = 0.85;
      state.reticle.scale = 1.35;
      state.reticle.active = true;
      state.reticle.timestamp = performance.now();
      triggerHaptic();
    };

    // 直接对焦到指定的符号 (核心统一通道)
    const focusOnSymbol = (item, i) => {
      const local = symbolLocalPos(item, performance.now());

      state.activeFocusedId = item.id;
      state.targetZ = item.z;
      state.lastFocusTime = performance.now();
      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();

      triggerReticle(local.x, local.y);
      // 对焦框持续跟随该符号的浮动、视差与陀螺仪位移，始终严密框住元素
      state.reticle.trackIndex = i;

      if (state.gyroActive) {
        state.baseBeta = state.rawBeta;
        state.baseGamma = state.rawGamma;
      }
    };

    focusOnSymbolRef.current = focusOnSymbol;

    // 在空白处点击时，寻找距离触点最近的符号并直接对焦它
    const focusOnClosest = (point) => {
      const isMobile = window.innerWidth < 768;
      let closestDist = Infinity;
      let closestIdx = -1;

      for (let i = 0; i < symbolsRef.current.length; i++) {
        const item = symbolsRef.current[i];
        if (isMobile && item.mobileHidden) continue;

        const pos = state.currentPositions[i];
        if (!pos) continue;

        const d = Math.hypot(pos.x - point.x, pos.y - point.y);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      }

      if (closestIdx !== -1 && closestDist < 280) {
        focusOnSymbol(symbolsRef.current[closestIdx], closestIdx);
        return true;
      }
      return false;
    };

    // 指针/光标移动追踪（同时挂在 pointerenter / pointerover 上，
    // 指针重新进入窗口时无需先移动就能立刻恢复视差驱动）
    const handlePointerMove = (e) => {
      const { clientX, clientY } = e;

      // 鼠标 / 触控笔活动：标记为鼠标驱动源并记录时刻，供视差驱动源仲裁使用
      if (e.pointerType !== "touch") state.mouseDriven = true;
      state.lastPointerActivity = performance.now();

      state.mouseX = clientX;
      state.mouseY = clientY;
      state.mouseNormalizedX = (clientX / (window.innerWidth || 1)) * 2 - 1;
      state.mouseNormalizedY = (clientY / (window.innerHeight || 1)) * 2 - 1;
      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();
    };

    // 移动端/触屏轻触合焦（Tap-to-Focus）：直接对焦到点按的元素上！
    const handlePointerDown = (e) => {
      const { clientX, clientY } = e;

      if (e.pointerType !== "touch") state.mouseDriven = true;
      state.lastPointerActivity = performance.now();

      state.mouseX = clientX;
      state.mouseY = clientY;
      state.mouseNormalizedX = (clientX / (window.innerWidth || 1)) * 2 - 1;
      state.mouseNormalizedY = (clientY / (window.innerHeight || 1)) * 2 - 1;
      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();

      // 点在按钮/链接等交互元素上时，不触发对焦、准星与震动反馈
      if (e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR)) return;

      // 触点换算到容器坐标系后测距，避免动态视口/缩放带来的错位
      const point = toContainerPoint(clientX, clientY);
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
      // 指针真正离开窗口：清空鼠标位置，相机平滑回到中心并静止
      state.hasInteracted = false;
      state.mouseX = -9999;
      state.mouseY = -9999;
      state.mouseNormalizedX = 0;
      state.mouseNormalizedY = 0;
    };

    // 窗口失焦：只暂停“活动”状态，保留指针最后位置
    // 回到窗口后视差沿用原视点，不会突然弹回中心，也无需先移动鼠标才恢复
    const handleWindowBlur = () => {
      state.hasInteracted = false;
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
      state.lastGyroActivity = performance.now();
    };

    // 动态屏幕自适应布局（桌面宽屏 vs 移动狭窄竖屏）
    const updateResponsiveLayout = () => {
      const isMobile = window.innerWidth < 768;
      for (let i = 0; i < symbolsRef.current.length; i++) {
        const item = symbolsRef.current[i];
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

    // 核心渲染循环（零 React 重渲染，纯 GPU 驱动）
    // 单帧异常绝不打断循环：任何一帧出错都会被跳过，下一帧照常继续，视差永不因此停摆
    let frameErrorLogged = false;

    const renderFrame = (now) => {
      const { innerWidth: width, innerHeight: height } = window;
      const isMobile = width < 768;
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

      if (!isMobile && !isIdle) {
        // 电脑端鼠标移动 hover 时，柔和吸附到指针最近的符号（锁定期间同样生效）
        // 指针先换算到容器坐标系，与 currentPositions 严格同坐标系测距
        const pointer = toContainerPoint(state.mouseX, state.mouseY);
        let closestDist = Infinity;
        let closestItem = null;

        for (let i = 0; i < symbolsRef.current.length; i++) {
          const item = symbolsRef.current[i];
          const pos = state.currentPositions[i];
          if (!pos) continue;

          const d = Math.hypot(pos.x - pointer.x, pos.y - pointer.y);
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
          const { h } = sizeRef.current;
          const depthInfluence = (pointer.y / (h || height)) * 0.4 + 0.3;
          state.targetZ = depthInfluence;
        }
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
        containerRef.current.style.transform = `scale(${breathingScale.toFixed(4)})`;
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
              const local = symbolLocalPos(tracked, now);
              reticleX = cw / 2 + (local.x - cw / 2) * breathingScale;
              reticleY = ch / 2 + (local.y - ch / 2) * breathingScale;
            }
          }

          state.reticle.scale = Math.max(1.0, 1.35 - (elapsed / 250) * 0.35);
          state.reticle.opacity = Math.max(0, 0.85 * (1 - elapsed / 1100));
          reticleRef.current.style.opacity = state.reticle.opacity.toFixed(2);
          reticleRef.current.style.transform = `translate3d(${reticleX.toFixed(1)}px, ${reticleY.toFixed(1)}px, 0) translate(-50%, -50%) scale(${state.reticle.scale.toFixed(3)})`;
        } else {
          state.reticle.active = false;
          state.reticle.trackIndex = -1;
          reticleRef.current.style.opacity = "0";
        }
      }

      // 5. 核心统一物理场：由每个符号唯一的空间深度 Z_i 严格统领视差与弥散圆
      for (let i = 0; i < symbolsRef.current.length; i++) {
        const item = symbolsRef.current[i];
        const el = elementsRef.current[i];
        if (!el) continue;

        if (isMobile && item.mobileHidden) {
          el.style.display = "none";
          continue;
        } else {
          el.style.display = "block";
        }

        const zi = item.z; // 绝对空间深度 (0.16 ~ 0.92)

        // 微物理浮动 + 三维透视视差（与对焦框共用同一公式，保证框体严密锁定元素）
        const offset = symbolOffset(item, now);
        const local = symbolLocalPos(item, now, offset);

        // 记录符号在容器坐标系中的实时中心位置 (支持精准测距与直接对焦)
        state.currentPositions[i] = {
          x: local.x,
          y: local.y,
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
        el.style.transform = `translate3d(${(offset.driftX + offset.parallaxX).toFixed(1)}px, ${(offset.driftY + offset.parallaxY).toFixed(1)}px, 0) scale(${itemScale.toFixed(3)})`;
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
    };

    const tick = (now) => {
      try {
        renderFrame(now);
      } catch (error) {
        // 静默容错：只提示一次，避免逐帧刷屏
        if (!frameErrorLogged) {
          frameErrorLogged = true;
          console.warn("[OpticalFocusSpace] 单帧渲染异常，已跳过该帧：", error);
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
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

        {symbolList.map((item, i) => (
          <div
            key={i}
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
              {/* 归属变化时字形淡入，避免直接跳字 */}
              <span key={item.symbol} className="glyph-swap block">
                {item.symbol}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* 极简光学对焦框 (Tap-to-Focus Reticle)：与 Emoji 共享容器坐标系，渲染时补偿相机呼吸缩放 */}
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
