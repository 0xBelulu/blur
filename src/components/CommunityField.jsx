import { useMemo } from 'react';
import { useOpticalField } from './optical/useOpticalField';
import { STARDUST_PARTICLES } from './optical/symbols';
import { COMMUNITY_PRESET } from './optical/presets';
import { PROJECTION_AXIS_COPY } from '../../shared/projection.js';
import { ACCENT, DEEP, GOLD, SKY, rgba } from '../utils/palette.js';

/**
 * 社区星图：直接复用主页的光学引擎，只把 emoji 换成圆点。
 *
 * 主页好看不是因为单个粒子精致，而是因为同一帧里同时存在三种东西：
 * 几乎完全糊掉的大色斑、正在焦平面上的锐点、以及介于两者之间的过渡。
 * 这套引擎用每个符号的 z 和当前焦平面算出弥散圆，指针移动时整片会呼吸；
 * 相机视差再按 z 给出远近位移。社区点只需要接上同一套物理：
 *
 *   - 每个点的 z 只由坐标决定（接口不保证顺序，换请求不能让同一个点换景深）
 *   - 圆点很小（5–17px），失焦时靠引擎的 blur 变成散景，合焦时带双色镜片辉光
 *   - 颜色只在 DEEP / SKY / GOLD 里按坐标分配，仍是环境色，不是身份色
 *   - 自己也在引擎里，只是标成 sharp：不参与失焦，但共享同一套漂移与视差，
 *     所以它会跟着整片场一起动，而不是钉在屏幕上
 *
 * 没有环、没有刻度、没有均匀分布的网格——这些「均匀」正是它之前像图表的原因。
 */

const TONES = { deep: DEEP, sky: SKY, gold: GOLD };

/** 只由坐标决定的稳定散列：同一个人每次打开都在同一层、同一颜色。 */
function hashOf(value) {
  const result = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return result - Math.floor(result);
}

function buildSymbols(points, you) {
  const list = points.map(([x, y], index) => {
    const seed = x * 1000 + y * 7919;
    const toneRoll = hashOf(seed + 1.3);
    const z = 0.18 + hashOf(seed + 2.7) * 0.72;
    return {
      // index 只用来消歧同坐标的点；视觉属性只读坐标。
      id: `p-${index}-${x.toFixed(4)}-${y.toFixed(4)}`,
      x: 50 + x * 44,
      y: 50 - y * 44,
      z,
      driftSpeed: 0.45 + hashOf(seed + 4.1) * 0.7,
      phase: hashOf(seed + 5.9) * Math.PI * 2,
      tone: toneRoll < 0.68 ? 'deep' : toneRoll < 0.9 ? 'sky' : 'gold',
      // 近的东西本来就更大：尺寸跟着 z 走，远近差才不只是模糊差。
      size: 5 + (1 - z) * 9 + hashOf(seed + 7.3) * 3,
      lightX: 30 + hashOf(seed + 8.9) * 30,
      lightY: 24 + hashOf(seed + 10.7) * 26,
    };
  });

  if (you) {
    // 「你」是引擎里的最后一个符号：z 取中间层，和整片场共享相机视差与漂移；
    // sharp 让引擎跳过 blur/opacity，只写 transform。
    list.push({
      id: 'you',
      x: 50 + you[0] * 44,
      y: 50 - you[1] * 44,
      z: 0.5,
      driftSpeed: 0.75,
      phase: hashOf(you[0] * 1337 + you[1] * 7919) * Math.PI * 2,
      sharp: true,
    });
  }

  return list;
}

export default function CommunityField({ points = [], you = null, className = '', label = '星图：每个人是一个没有名字的点' }) {
  const symbols = useMemo(() => buildSymbols(points, you), [points, you]);
  const { containerRef, elementsRef, wrappersRef, dustRef, reticleRef } = useOpticalField({
    symbols,
    stardust: STARDUST_PARTICLES,
    focusMode: COMMUNITY_PRESET.focusMode,
    focusZ: COMMUNITY_PRESET.focusZ,
    opacityCap: COMMUNITY_PRESET.opacityCap,
    minBlur: COMMUNITY_PRESET.minBlur,
    maxBlur: COMMUNITY_PRESET.maxBlur,
    scope: 'container',
  });

  return (
    <div className={`flex items-center justify-center ${className}`} role="img" aria-label={label}>
      {/* 坐标轴是投影的 [-1,1] 方形；圆点留 6% 边距，给漂移和视差一点余地。 */}
      <div className="relative aspect-square w-full">
        <div ref={containerRef} className="optical-stage absolute inset-0 overflow-hidden">
          {symbols.map((item, index) => (
            <div
              key={item.id}
              ref={(node) => { wrappersRef.current[index] = node; }}
              className="absolute select-none will-change-transform"
              style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              {item.sharp ? (
                // 「你」也在这一层里：和所有圆点共用同样的漂移/视差，只是不参与失焦。
                <div
                  ref={(node) => { elementsRef.current[index] = node; }}
                  className="pointer-events-none relative h-0 w-0 will-change-transform"
                >
                  <span
                    className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-breathe-slow rounded-full"
                    style={{ background: `radial-gradient(circle, ${rgba(ACCENT, 0.26)} 0%, ${rgba(ACCENT, 0.06)} 48%, transparent 72%)` }}
                  />
                  <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blur-accent/25" />
                  <span
                    className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-blur-accent"
                    style={{ boxShadow: `0 0 10px ${rgba(ACCENT, 0.5)}` }}
                  />
                  <span
                    className="absolute left-1/2 text-[11px] tracking-[0.12em] text-blur-text/70"
                    style={{ top: '-22px', transform: 'translateX(-50%)' }}
                  >
                    你
                  </span>
                </div>
              ) : (
                <span
                  ref={(node) => { elementsRef.current[index] = node; }}
                  className="block rounded-full will-change-transform"
                  style={{
                    width: `${item.size}px`,
                    height: `${item.size}px`,
                    background: `radial-gradient(circle at ${item.lightX}% ${item.lightY}%, rgba(255,255,255,0.5) 0%, ${rgba(TONES[item.tone], 0.92)} 32%, ${rgba(TONES[item.tone], 0.52)} 74%, ${rgba(TONES[item.tone], 0.12)} 100%)`,
                    boxShadow: `0 0 ${item.size * 0.7}px ${rgba(TONES[item.tone], 0.2)}`,
                  }}
                />
              )}
            </div>
          ))}

          {STARDUST_PARTICLES.map((dust, index) => (
            <div
              key={dust.id}
              ref={(node) => { dustRef.current[index] = node; }}
              className="pointer-events-none absolute rounded-full will-change-transform"
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

          {/* 与主页同一枚 tap-to-focus 准星；点按任意点都只是让它清晰，不打开任何东西。 */}
          <div
            ref={reticleRef}
            className="pointer-events-none absolute left-0 top-0 h-14 w-14 will-change-transform"
            style={{ opacity: 0, transform: 'translate(-50%, -50%) scale(1.4)' }}
          >
            <div className="absolute left-0 top-0 h-2.5 w-2.5 rounded-tl-[1px] border-l border-t border-blur-accent/80" />
            <div className="absolute right-0 top-0 h-2.5 w-2.5 rounded-tr-[1px] border-r border-t border-blur-accent/80" />
            <div className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded-bl-[1px] border-b border-l border-blur-accent/80" />
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-br-[1px] border-b border-r border-blur-accent/80" />
            <div className="absolute inset-0 m-auto h-1 w-1 rounded-full bg-blur-accent/70" />
          </div>
        </div>

        <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-[10px] tracking-[0.22em] text-blur-text-muted">
          {PROJECTION_AXIS_COPY.y.positive}
        </span>
        <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.22em] text-blur-text-muted">
          {PROJECTION_AXIS_COPY.y.negative}
        </span>
        <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.22em] text-blur-text-muted">
          {PROJECTION_AXIS_COPY.x.negative}
        </span>
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.22em] text-blur-text-muted">
          {PROJECTION_AXIS_COPY.x.positive}
        </span>
      </div>
    </div>
  );
}
