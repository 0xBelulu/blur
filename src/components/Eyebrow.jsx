/**
 * 章节小标：一条短线 + 一行全大写的小字。
 *
 * 原先 About 与 Next 各写一遍，字号和透明度已经漂了（10px/75 对 11px/85）。
 * 现在统一到一处，line 只控制短线长度，不再各自发挥。
 */
export default function Eyebrow({ children, line = "short", className = "" }) {
  return (
    <div className={`flex items-center gap-3 text-[10px] tracking-[0.32em] text-blur-text/75 ${className}`}>
      <span className={line === "full" ? "h-px flex-1 bg-blur-border/30" : "h-px w-6 bg-blur-border/60"} />
      <span>{children}</span>
    </div>
  );
}
