import { useOpticalField } from "./useOpticalField";

/*
 * 下一步页的整屏星场。
 *
 * 它不是一层平铺的点 —— 每个点都有自己的空间深度 z，
 * 由 useOpticalField 这套和 Landing 完全相同的引擎驱动：
 * 弥散圆、透视视差、相机呼吸、焦平面漂移。
 * 所以点在空间里是有前后 的：近的走得快、糊得狠，远的小而慢。
 *
 * 挂在 AppBackground 上而不是页面里：页面滚动时背景不该跟着走，
 * 而且 PageTransition 有 contain: paint，页面内部的 fixed 会被它约束住。
 */

// 每个点都是一个"符号"，z 越小越靠近镜头（沿用 symbols.js 的约定：0.16 近，0.92 远）
const PRESET = {
  focusMode: "pointer",
  focusZ: 0.5,
  opacityCap: 0.95,
  minBlur: 0,
  // 点本身就小，糊到 13.5px 会彻底消失；7.5 刚好把它撑成一枚散景圆盘
  maxBlur: 7.5,
};

const NO_DUST = [];

const PALETTE = ["155,142,199", "143,181,196", "196,165,137", "196,155,165"];

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
    [28, 30, 24],
    [68, 24, 22],
    [46, 66, 26],
    [16, 70, 16],
    [84, 62, 16],
  ];

  // 三层景深：近的少而大，远的多而小
  const bands = [
    { z: [0.14, 0.34], size: [9, 15], count: 16 },
    { z: [0.4, 0.62], size: [5.5, 9.5], count: 26 },
    { z: [0.68, 0.94], size: [3.5, 6.5], count: 34 },
  ];

  const dots = [];
  bands.forEach((band) => {
    for (let i = 0; i < band.count; i += 1) {
      const [cx, cy, spread] = clusters[dots.length % clusters.length];
      const angle = rand() * Math.PI * 2;
      const radius = Math.sqrt(rand()) * spread;
      const near = 1 - radius / (spread * 1.25);
      const zSpan = band.z[1] - band.z[0];
      const sizeSpan = band.size[1] - band.size[0];
      dots.push({
        id: `d${dots.length}`,
        x: Math.min(97, Math.max(3, cx + Math.cos(angle) * radius * 1.35)),
        y: Math.min(97, Math.max(3, cy + Math.sin(angle) * radius)),
        z: band.z[0] + rand() * zSpan,
        size: band.size[0] + rand() * sizeSpan + near * 1.5,
        tone: PALETTE[dots.length % PALETTE.length],
        driftSpeed: 0.5 + rand() * 0.7,
        phase: rand() * Math.PI * 2,
      });
    }
  });

  return dots;
}

// 星场是确定性的，算一次就够，不参与渲染周期。
const FIELD = makeField();

export default function SkyField({ active = true }) {
  const { containerRef, elementsRef, wrappersRef } = useOpticalField({
    symbols: FIELD,
    stardust: NO_DUST,
    focusMode: PRESET.focusMode,
    focusZ: PRESET.focusZ,
    opacityCap: PRESET.opacityCap,
    minBlur: PRESET.minBlur,
    maxBlur: PRESET.maxBlur,
    scope: "viewport",
    active,
  });

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div ref={containerRef} className="optical-stage absolute inset-0 overflow-hidden will-change-transform">
        {FIELD.map((dot, index) => (
          <div
            key={dot.id}
            ref={(node) => {
              wrappersRef.current[index] = node;
            }}
            className="absolute"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              ref={(node) => {
                elementsRef.current[index] = node;
              }}
              className="block rounded-full"
              style={{
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                background: `radial-gradient(circle, rgba(${dot.tone},0.92) 0%, rgba(${dot.tone},0.42) 38%, rgba(${dot.tone},0) 74%)`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
