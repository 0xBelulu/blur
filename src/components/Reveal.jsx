import { motion } from "framer-motion";
import { useRevealProps } from "../utils/motion";

/**
 * 章节入场的组件式写法。参数见 utils/motion.js，与 useRevealProps 同源。
 */
export default function Reveal({ delay = 0, className = "", children }) {
  const reveal = useRevealProps();
  return (
    <motion.div {...reveal(delay)} className={className}>
      {children}
    </motion.div>
  );
}
