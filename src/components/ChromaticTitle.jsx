/**
 * 标题的色散重影：两层 aria-hidden 的副本垫在正文标题下面。
 *
 * blur 用 em 而不是 px。两页字号差一倍（3.1rem / 2.3rem），px 写法必然漂移——
 * 原来就是 About 写 14/4px、Next 写 16/5px，同一个效果两个数。
 * 换成 em 之后，模糊量跟着字号走，不会再分叉。
 *
 * ghost 是重影用的纯文本：标题本体允许带样式片段（斜体、高亮），
 * 但重影必须是一模一样的字形，否则两层会错位。
 */
export default function ChromaticTitle({ children, ghost, className = "", as: Tag = "h1" }) {
  const shadow = ghost ?? children;
  return (
    <>
      <span aria-hidden="true" className={`${className} pointer-events-none absolute inset-0 select-none text-blur-accent/25 blur-[0.28em]`}>
        {shadow}
      </span>
      <span aria-hidden="true" className={`${className} pointer-events-none absolute inset-0 translate-x-[3px] translate-y-[2px] select-none text-blur-accent-cool/25 blur-[0.09em]`}>
        {shadow}
      </span>
      <Tag className={`${className} relative text-blur-text`}>{children}</Tag>
    </>
  );
}
