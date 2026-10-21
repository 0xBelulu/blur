/**
 * 站内所有"看起来像按钮"的东西。
 *
 * size 只有两档，因为实际只有两种用途：正文里的按钮（md）和页面主 CTA（lg）。
 * 之前 CTA 在 Next 里被手写了一遍（px-8 / min-h-13 / text-[15px]），
 * 和这里的 px-6 / py-3 / text-sm 各说各话——同一个主操作，两种尺寸。
 */
export default function GlassButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  href,
  target = "_blank",
  className = "",
  disabled = false,
}) {
  const baseClasses = "relative rounded-2xl font-medium tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blur-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-blur-bg active:scale-[0.96]";

  const sizes = {
    md: "px-6 py-3 text-sm",
    lg: "inline-flex items-center gap-2 min-h-13 px-8 text-[15px]",
  };

  const variants = {
    primary: "glass-strong text-blur-text hover:shadow-lg hover:scale-[1.02]",
    secondary: "glass text-blur-text hover:bg-blur-surface-hover hover:shadow-md",
    ghost: "bg-transparent text-blur-text-muted hover:text-blur-text hover:bg-blur-surface/50",
  };

  const classes = `${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`;

  // 跳转类主操作（外链问卷等）需要 <a>，其余仍是 <button>。
  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
