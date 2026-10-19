import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/*
 * 下一步页的整屏星场。
 *
 * 和 Landing 那套逐帧光学引擎的关键区别在成本：
 * 那套引擎每帧为每个符号重算弥散圆并写 filter，十几个符号、一个小容器没问题，
 * 铺满整屏几十个点时，等于每帧重新栅格化整个视口。
 *
 * 这里把景深做成静态的（近景虚、焦平面实、远景虚），
 * 每帧只移动三个分组容器的 transform。模糊只算一次，之后全部走合成层。
 * 立体感来自"只有一层是清晰的"加上"远近速度不同"，这两件事都不需要每帧重新模糊。
 */

const BANDS = [
  // 近景：大、虚、跑得最快 —— 像镜头前飘过的散景
  { key: "near", parallax: 30, blur: [3.4, 5.4], size: [9, 15], alpha: [0.28, 0.46], count: 14 },
  // 焦平面：小而实，是场上唯一清晰的一层
  { key: "focus", parallax: 18, blur: [0, 0.5], size: [4.5, 9], alpha: [0.42, 0.8], count: 22 },
  // 远景：最碎、最糊、几乎不动
  { key: "far", parallax: 8, blur: [5, 7], size: [3, 6], alpha: [0.24, 0.44], count: 22 },
];

const PALETTE = ["155,142,199", "143,181,196", "196,165,137", "196,155,165"];
const IDLE_AFTER = 2400;

function makeField() {
  let seed = 20261019;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // 五簇：有簇才有"人群"的密度差，均匀撒开只会像噪点
  const clusters = [
    [30, 26, 22],
    [68, 26, 20],
    [46, 64, 24],
    [18, 68, 14],
    [82, 60, 14],
  ];

  return BANDS.map((band, bandIndex) => {
    const sizeSpan = band.size[1] - band.size[0];
    const alphaSpan = band.alpha[1] - band.alpha[0];
    const blurSpan = band.blur[1] - band.blur[0];

    const dots = Array.from({ length: band.count }, (_, i) => {
      const [cx, cy, spread] = clusters[(i * 2 + bandIndex) % clusters.length];
      const angle = rand() * Math.PI * 2;
      const radius = Math.sqrt(rand()) * spread;
      return {
        id: `${band.key}-${i}`,
        x: Math.min(94, Math.max(6, cx + Math.cos(angle) * radius * 1.3)),
        y: Math.min(94, Math.max(6, cy + Math.sin(angle) * radius)),
        size: band.size[0] + rand() * sizeSpan,
        alpha: band.alpha[0] + rand() * alphaSpan,
        blur: band.blur[0] + rand() * blurSpan,
        tone: PALETTE[(i + bandIndex) % PALETTE.length],
      };
    });

    return { ...band, dots };
  });
}

// 星场是确定性的，算一次就够，不参与渲染周期。
const FIELD = makeField();

export default function SkyField({ active = true }) {
  const reduceMotion = useReducedMotion();
  const bandRefs = useRef([]);

  useEffect(() => {
    if (!active || reduceMotion) return undefined;

    const state = { x: 0, y: 0, tx: 0, ty: 0, last: -Infinity };
    let frame = 0;
    let clock = 0;

    const onMove = (event) => {
      state.tx = (event.clientX / (window.innerWidth || 1)) * 2 - 1;
      state.ty = (event.clientY / (window.innerHeight || 1)) * 2 - 1;
      state.last = performance.now();
    };

    const loop = (now) => {
      clock = now;
      // 没有输入时让视点自己极慢地游走，画面不会死掉
      const idle = clock - state.last > IDLE_AFTER;
      const tx = idle ? Math.sin(clock * 0.00011) * 0.5 : state.tx;
      const ty = idle ? Math.cos(clock * 0.00009) * 0.38 : state.ty;

      state.x += (tx - state.x) * 0.05;
      state.y += (ty - state.y) * 0.05;

      // 每帧只有三次合成层位移，没有任何 filter 写入
      for (let i = 0; i < FIELD.length; i += 1) {
        const node = bandRefs.current[i];
        if (!node) continue;
        const dx = (-state.x * FIELD[i].parallax).toFixed(2);
        const dy = (-state.y * FIELD[i].parallax).toFixed(2);
        node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }

      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [active, reduceMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {FIELD.map((band, bandIndex) => (
        <div
          key={band.key}
          ref={(node) => {
            bandRefs.current[bandIndex] = node;
          }}
          className="absolute inset-0 will-change-transform"
        >
          {band.dots.map((dot) => (
            <span
              key={dot.id}
              className="absolute rounded-full"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                opacity: dot.alpha,
                transform: "translate(-50%, -50%)",
                // 静态模糊：整个生命周期只栅格化一次，之后随整层一起移动
                filter: dot.blur > 0.05 ? `blur(${dot.blur}px)` : undefined,
                background: `radial-gradient(circle, rgba(${dot.tone},0.92) 0%, rgba(${dot.tone},0.42) 38%, rgba(${dot.tone},0) 74%)`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
