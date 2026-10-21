import { motion } from "framer-motion";
import { ACCENT, SKY, rgba } from "../utils/palette.js";

const DEFAULT_GRADIENT = `linear-gradient(90deg, ${rgba(ACCENT, 0.7)}, ${rgba(SKY, 0.7)})`;

export default function ProgressBar({ pct, delay = 0, gradient = DEFAULT_GRADIENT }) {
  return (
    <div className="h-1.5 rounded-full bg-blur-surface overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ delay: 0.2 + delay, duration: 0.5, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: gradient }}
      />
    </div>
  );
}
