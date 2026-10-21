import { ArrowLeft } from "lucide-react";

/**
 * 原型 / 特质 / 题库三个目录页共用的外壳。
 *
 * 这三页原先各自复制了一整段完全相同的结构：返回头、左侧虚线时间轴、六个刻度点、
 * 横线纸纹、内容区 padding。复制之后就开始漂（卡片间距 3 和 2 已经不一致），
 * 所以外壳收到这里，页面只负责中间那一段内容。
 */
const RULED_PAPER = {
  backgroundImage: "linear-gradient(to bottom, transparent 95%, rgba(200,195,190,0.04) 95%)",
  backgroundSize: "100% 28px",
};

// 时间轴上的六个刻度点：纯装饰，位置由 CSS 固定，数量跟着节奏走
const RAIL_TICKS = 6;

export default function CatalogShell({ title, intro, onBack, children }) {
  return (
    <div className="flex-1 flex flex-col min-h-[100svh] relative overflow-hidden">
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col min-h-[100svh]">
        <header className="flex-shrink-0 flex items-center justify-between px-6 md:px-10 py-5 border-b border-blur-border/20">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-blur-surface-hover transition-colors cursor-pointer"
            aria-label="返回"
          >
            <ArrowLeft size={16} className="text-blur-text-muted" />
          </button>
          <h1 className="text-sm md:text-base font-medium tracking-widest text-blur-text">{title}</h1>
          {/* 与返回键等宽的占位，让标题真正居中 */}
          <div className="w-9 h-9" aria-hidden="true" />
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative" style={RULED_PAPER}>
          <div className="absolute left-6 md:left-10 top-0 bottom-0 w-px border-l border-dashed border-blur-border/15 pointer-events-none" />
          <div className="absolute left-[22px] md:left-[38px] top-24 flex flex-col gap-[104px] pointer-events-none">
            {Array.from({ length: RAIL_TICKS }, (_, index) => (
              <div key={index} className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            ))}
          </div>

          <div className="pl-10 md:pl-14 pr-6 md:pr-10 pt-10 md:pt-14 pb-16">
            {intro && (
              <p className="text-[15px] text-blur-text-muted leading-[1.85] mb-6">{intro}</p>
            )}
            {children}
            <div className="h-16" />
          </div>
        </main>
      </div>
    </div>
  );
}
