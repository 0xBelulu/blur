import atmosphereDither from "../assets/atmosphere-dither.png";

/**
 * 温润水彩漫染流光 —— 页面最底层的氛围。
 *
 * 原本内联写在 Landing.jsx 里，做题页直接漏掉了这一层，
 * 所以只有 emoji 没有底光，看起来是"散落的贴纸"而不是"一片场"。
 * 现在抽出来两边共用；intensity 用于按页面调压。
 */
export default function AtmosphereField({ intensity = 1 }) {
  return (
    <div
      className="atmosphere-field fixed inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ opacity: intensity }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 50% 45%, rgba(155,142,199,0.20) 0%, transparent 72%), radial-gradient(ellipse 65% 55% at 20% 60%, rgba(143,181,196,0.16) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 78% 30%, rgba(196,165,137,0.15) 0%, transparent 58%), radial-gradient(ellipse 45% 40% at 60% 78%, rgba(196,155,165,0.14) 0%, transparent 52%)",
        }}
      />
      {/* Static blurred paint inside moving wrappers lets the browser reuse it. */}
      <div
        className="atmosphere-orb absolute will-change-transform"
        style={{
          width: "55vmax",
          height: "55vmax",
          top: "12%",
          left: "18%",
          borderRadius: "40% 60% 55% 45% / 55% 40% 60% 45%",
          animation: "orb-float-1 14s ease-in-out infinite",
        }}
      >
        <div className="absolute inset-0 blur-[45px]" style={{
          borderRadius: "inherit",
          background: "radial-gradient(circle, rgba(155,142,199,0.18) 0%, transparent 68%)",
        }} />
      </div>
      <div
        className="atmosphere-orb absolute will-change-transform"
        style={{
          width: "45vmax",
          height: "45vmax",
          bottom: "8%",
          right: "12%",
          borderRadius: "55% 45% 50% 50% / 45% 55% 45% 55%",
          animation: "orb-float-2 18s ease-in-out infinite",
        }}
      >
        <div className="absolute inset-0 blur-[45px]" style={{
          borderRadius: "inherit",
          background: "radial-gradient(circle, rgba(143,181,196,0.16) 0%, transparent 65%)",
        }} />
      </div>
      <div
        className="atmosphere-orb absolute will-change-transform"
        style={{
          width: "35vmax",
          height: "35vmax",
          top: "48%",
          left: "52%",
          borderRadius: "50% 50% 45% 55% / 55% 45% 50% 50%",
          animation: "orb-float-3 12s ease-in-out infinite",
        }}
      >
        <div className="absolute inset-0 blur-[40px]" style={{
          borderRadius: "inherit",
          background: "radial-gradient(circle, rgba(196,165,137,0.15) 0%, transparent 60%)",
        }} />
      </div>
      <div
        className="atmosphere-orb absolute will-change-transform"
        style={{
          width: "25vmax",
          height: "25vmax",
          bottom: "28%",
          left: "8%",
          borderRadius: "60% 40% 50% 50% / 50% 50% 60% 40%",
          animation: "orb-float-4 16s ease-in-out 3s infinite",
        }}
      >
        <div className="absolute inset-0 blur-[35px]" style={{
          borderRadius: "inherit",
          background: "radial-gradient(circle, rgba(196,155,165,0.13) 0%, transparent 55%)",
        }} />
      </div>
      <div
        className="atmosphere-dither absolute inset-0"
        style={{
          backgroundImage: `url("${atmosphereDither}")`,
        }}
      />
    </div>
  );
}
