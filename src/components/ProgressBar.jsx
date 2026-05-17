import { motion } from "framer-motion";

export default function ProgressBar({ pct, delay = 0, gradient = "linear-gradient(90deg, rgba(155,142,199,0.7), rgba(143,181,196,0.7))" }) {
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
