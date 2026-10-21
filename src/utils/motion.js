import { useReducedMotion } from "framer-motion";

/** 全站统一的入场曲线。原先 About 与 Next 各写了一份。 */
export const EASE = [0.22, 1, 0.36, 1];

/**
 * 章节入场：从失焦到聚焦。
 *
 * 两个页面原本各有一套写法（About 用 props 展开，Next 包了一层组件），
 * 参数一模一样，Next 那边甚至留了句「和 About 页完全一致的入场参数」的注释。
 * 现在只有这一份，两种用法共用：
 *   const reveal = useRevealProps();  <motion.div {...reveal(0.1)} />
 *   <Reveal delay={0.1}>…</Reveal>
 *
 * filter 不是浏览器可加速的属性，framer-motion 只能用主线程逐帧插值，
 * 所以它能不能跑顺，取决于同一帧里还有谁在抢主线程——这也是它必须只有一份的原因。
 */
export function useRevealProps() {
  const reduceMotion = useReducedMotion();
  return (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 20, filter: "blur(7px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    viewport: { once: true, margin: "-10% 0px -10% 0px" },
    transition: { duration: 0.95, delay, ease: EASE },
  });
}
