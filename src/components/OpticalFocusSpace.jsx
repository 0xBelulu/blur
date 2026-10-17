import { useEffect, useRef } from "react";

// 空间散布的原型与感知意象符号
const SPATIAL_SYMBOLS = [
  // 前景组 (近焦平面，浅景深)
  { id: "rainbow", symbol: "🌈", name: "光谱", x: 78, y: 70, z: 0.16, color: "rgba(196,155,165,0.45)", driftSpeed: 0.7, phase: 0.4 },
  { id: "bubble", symbol: "🫧", name: "气泡", x: 91, y: 22, z: 0.22, color: "rgba(143,181,196,0.45)", driftSpeed: 1.1, phase: 2.1 },
  { id: "mist", symbol: "🌫️", name: "迷雾", x: 12, y: 16, z: 0.28, color: "rgba(155,142,199,0.45)", driftSpeed: 0.8, phase: 1.3 },
  { id: "kite", symbol: "🪁", name: "纸鸢", x: 44, y: 82, z: 0.32, color: "rgba(196,165,137,0.45)", driftSpeed: 0.9, phase: 3.2 },

  // 中景组 (主对焦层，层次分明)
  { id: "leaf", symbol: "🍃", name: "风客", x: 88, y: 46, z: 0.42, color: "rgba(162,196,155,0.45)", driftSpeed: 1.0, phase: 4.5 },
  { id: "camera", symbol: "📷", name: "调焦", x: 53, y: 13, z: 0.48, color: "rgba(155,142,199,0.45)", driftSpeed: 0.6, phase: 0.8 },
  { id: "sparkle", symbol: "✨", name: "微光", x: 26, y: 24, z: 0.52, color: "rgba(196,165,137,0.45)", driftSpeed: 1.2, phase: 5.1 },
  { id: "planet", symbol: "🪐", name: "游星", x: 84, y: 84, z: 0.58, color: "rgba(155,142,199,0.45)", driftSpeed: 0.5, phase: 2.7 },
  { id: "film", symbol: "🎞️", name: "胶片", x: 67, y: 86, z: 0.62, color: "rgba(196,165,137,0.45)", driftSpeed: 0.7, phase: 1.9 },
  { id: "prism", symbol: "💎", name: "棱镜", x: 7, y: 56, z: 0.68, color: "rgba(143,181,196,0.45)", driftSpeed: 0.8, phase: 3.8 },

  // 远景组 (深场景深，如夜空散景光斑)
  { id: "salt", symbol: "🧂", name: "浮盐", x: 19, y: 82, z: 0.76, color: "rgba(181,173,163,0.45)", driftSpeed: 0.6, phase: 4.1 },
  { id: "chime", symbol: "🎐", name: "风铃", x: 81, y: 14, z: 0.82, color: "rgba(143,181,196,0.45)", driftSpeed: 0.9, phase: 0.2 },
  { id: "wave", symbol: "🌊", name: "潮汐", x: 34, y: 90, z: 0.88, color: "rgba(143,181,196,0.45)", driftSpeed: 0.5, phase: 5.6 },
  { id: "candle", symbol: "🕯️", name: "烛照", x: 5, y: 38, z: 0.92, color: "rgba(196,165,137,0.45)", driftSpeed: 0.7, phase: 2.9 },
];

export default function OpticalFocusSpace() {
  const containerRef = useRef(null);
  const elementsRef = useRef([]);
  const bokehRef = useRef([]);

  // 物理与光学对焦状态
  const stateRef = useRef({
    focusZ: 0.5,           // 当前渲染焦距 (0.0 ~ 1.0)
    targetZ: 0.5,          // 目标对焦深度
    mouseX: -9999,         // 视线/鼠标 X 坐标
    mouseY: -9999,         // 视线/鼠标 Y 坐标
    mouseNormalizedX: 0,   // -1 ~ 1 屏幕归一化位置，用于三维视差
    mouseNormalizedY: 0,
    hasInteracted: false,
    lastInteractionTime: 0,
    activeFocusedId: null,
  });

  useEffect(() => {
    const state = stateRef.current;
    let animationFrameId;

    // 视线/鼠标移动事件追踪
    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      state.mouseX = clientX;
      state.mouseY = clientY;
      state.mouseNormalizedX = (clientX / window.innerWidth) * 2 - 1;
      state.mouseNormalizedY = (clientY / window.innerHeight) * 2 - 1;
      state.hasInteracted = true;
      state.lastInteractionTime = performance.now();
    };

    const handlePointerLeave = () => {
      state.hasInteracted = false;
      state.mouseX = -9999;
      state.mouseY = -9999;
      state.mouseNormalizedX = 0;
      state.mouseNormalizedY = 0;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    // 核心渲染循环（零 React 重渲染，纯 GPU 驱动）
    const tick = (now) => {
      const { innerWidth: width, innerHeight: height } = window;
      const isIdle = !state.hasInteracted || now - state.lastInteractionTime > 2600;

      // 1. 目标对焦深度决定器
      if (isIdle) {
        // 放空走神状态：双正弦谐波漫游，像深沉悠长的呼吸在深浅之间巡游
        const t = now * 0.00045;
        state.targetZ = 0.5 + 0.35 * Math.sin(t) + 0.12 * Math.cos(t * 1.618);
        state.activeFocusedId = null;
      } else {
        // 视线对焦模式：寻找视线投影最接近的符号
        let closestDist = Infinity;
        let closestItem = null;

        for (let i = 0; i < SPATIAL_SYMBOLS.length; i++) {
          const item = SPATIAL_SYMBOLS[i];
          const px = (item.x / 100) * width;
          const py = (item.y / 100) * height;
          const d = Math.hypot(px - state.mouseX, py - state.mouseY);

          if (d < closestDist) {
            closestDist = d;
            closestItem = item;
          }
        }

        // 视线敏感半径（240px）：进入该范围即产生“镜头合焦吸附”
        const FOCUS_RADIUS = 240;
        if (closestItem && closestDist < FOCUS_RADIUS) {
          const attractWeight = 1 - closestDist / FOCUS_RADIUS;
          // 柔性拉动焦距至目标符号的深度
          state.targetZ = closestItem.z * attractWeight + 0.5 * (1 - attractWeight);
          state.activeFocusedId = closestDist < 120 ? closestItem.id : null;
        } else {
          // 视线在开阔空白处时，根据 Y 坐标轻微推移焦深
          const depthInfluence = (state.mouseY / height) * 0.4 + 0.3;
          state.targetZ = depthInfluence;
          state.activeFocusedId = null;
        }
      }

      // 2. 镜头调焦阻尼模拟（Lerp 阻尼弹簧，具有真实光学镜头的机械厚重感）
      const lerpSpeed = isIdle ? 0.035 : 0.055;
      state.focusZ += (state.targetZ - state.focusZ) * lerpSpeed;

      // 3. 相机呼吸效应（Focus Breathing）
      // 当对焦移向前景 (focusZ 变小) 时镜头前移、视场微微张开放大，伴随微呼吸律动
      const breathingScale = 1.0 + (0.5 - state.focusZ) * 0.025 + Math.sin(now * 0.001) * 0.005;
      if (containerRef.current) {
        containerRef.current.style.transform = `scale(${breathingScale.toFixed(4)})`;
      }

      // 4. 计算每个符号的光学景深表现
      for (let i = 0; i < SPATIAL_SYMBOLS.length; i++) {
        const item = SPATIAL_SYMBOLS[i];
        const el = elementsRef.current[i];
        const bokeh = bokehRef.current[i];
        if (!el) continue;

        // 微物理浮动（模拟悬浮尘埃游动）
        const driftT = now * 0.001 * item.driftSpeed + item.phase;
        const driftX = Math.sin(driftT * 0.8) * 8;
        const driftY = Math.cos(driftT * 0.6) * 10;

        // 三维视差错位（Parallax）：不同深度 Z 产生不同的视场偏移
        const parallaxX = (0.5 - item.z) * 42 * state.mouseNormalizedX;
        const parallaxY = (0.5 - item.z) * 42 * state.mouseNormalizedY;

        // 核心光学景深：与当前焦平面的深度差
        const deltaZ = Math.abs(item.z - state.focusZ);
        // 景深衰减曲线（以 0.35 为全失焦阈值）
        const defocus = Math.min(1, deltaZ / 0.36);

        // 光学模糊（合焦时 0px 极度锐利，失焦时呈柔光散景）
        const blurPx = Math.pow(defocus, 1.25) * 13;

        // 透明度响应：合焦时晶莹浮现 (0.85)，失焦时淡入背景薄雾 (0.07 ~ 0.15)
        const isFocused = state.activeFocusedId === item.id;
        const targetOpacity = isFocused
          ? 0.95
          : 0.08 + (1 - defocus) * 0.72;

        // 元素尺寸微调：合焦时精神饱满放大，失焦时光学扩散
        const itemScale = isFocused
          ? 1.22
          : 0.92 + (1 - defocus) * 0.22;

        // 更新 Emoji 样式
        el.style.transform = `translate3d(${(driftX + parallaxX).toFixed(1)}px, ${(driftY + parallaxY).toFixed(1)}px, 0) scale(${itemScale.toFixed(3)})`;
        el.style.filter = `blur(${blurPx.toFixed(1)}px)`;
        el.style.opacity = targetOpacity.toFixed(3);

        // 散景光斑（Bokeh Halo）：失焦时呈现迷人镜头光圈光斑，合焦时收束凝聚
        if (bokeh) {
          const bokehScale = 0.8 + defocus * 1.6;
          const bokehOpacity = Math.max(0, (defocus - 0.15) * 0.65);
          bokeh.style.transform = `translate(-50%, -50%) scale(${bokehScale.toFixed(2)})`;
          bokeh.style.opacity = bokehOpacity.toFixed(2);
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden transition-transform duration-700 ease-out will-change-transform"
      aria-hidden="true"
    >
      {SPATIAL_SYMBOLS.map((item, i) => (
        <div
          key={item.id}
          className="absolute select-none flex items-center justify-center will-change-transform"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
          }}
        >
          {/* 散景光圈底晕 (Bokeh Disk) */}
          <div
            ref={(node) => { bokehRef.current[i] = node; }}
            className="absolute rounded-full pointer-events-none transition-opacity duration-300"
            style={{
              width: "4.5rem",
              height: "4.5rem",
              background: `radial-gradient(circle, ${item.color} 0%, rgba(255,255,255,0) 70%)`,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) scale(1)",
              opacity: 0,
            }}
          />

          {/* 核心悬浮 Emoji */}
          <span
            ref={(node) => { elementsRef.current[i] = node; }}
            className="text-2xl md:text-3xl lg:text-[2rem] block transform-gpu cursor-default"
            style={{
              opacity: 0.1,
              filter: "blur(6px)",
              transition: "text-shadow 0.3s ease",
              textShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            {item.symbol}
          </span>
        </div>
      ))}
    </div>
  );
}
