import { useOpticalField } from "./useOpticalField";
import { SPATIAL_SYMBOLS, STARDUST_PARTICLES } from "./symbols";

/**
 * 光学场的渲染壳：容器、光尘、符号、对焦准星。
 * 所有物理交给 useOpticalField，所有差异交给 preset。
 */
export default function OpticalStage({ preset = {}, symbols, stardust }) {
  const symbolList = symbols || preset.symbols || SPATIAL_SYMBOLS;
  const dustList = stardust || preset.stardust || STARDUST_PARTICLES;

  const { containerRef, elementsRef, wrappersRef, dustRef, reticleRef, focusOnSymbolRef } =
    useOpticalField({
      symbols: symbolList,
      stardust: dustList,
      focusMode: preset.focusMode,
      focusZ: preset.focusZ,
      opacityCap: preset.opacityCap,
      minBlur: preset.minBlur,
    });

  return (
    <>
      <div
        ref={containerRef}
        className="optical-stage fixed inset-0 pointer-events-none overflow-hidden will-change-transform"
        aria-hidden="true"
      >
        {/* 丁达尔微光光尘 (充盈空间立体微粒感) */}
        {dustList.map((dust, j) => (
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
