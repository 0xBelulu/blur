import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_TEXTS = [
  "正在收集你的模糊信号…",
  "调焦中，请勿眨眼…",
  "分析你的不精确性…",
  "在雾中寻找轮廓…",
  "模糊算法运算中…",
  "正在生成你的不清晰度…",
];

export default function Loading() {
  const [textIndex, setTextIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  /* 轮播文案 */
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  /* 进度 */
  useEffect(() => {
    const start = performance.now();
    const duration = 3500;
    let raf;
    const tick = (now) => {
      const elapsed = now - start;
      setProgress(Math.min(100, (elapsed / duration) * 100));
      if (elapsed < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-[100svh] relative overflow-hidden">
      {/* ====== 中央呼吸圆 ====== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center mb-10">
          {/* 最外层模糊光环 */}
          <motion.div
            className="absolute inset-0 rounded-full bg-blur-accent/5"
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* 中层 */}
          <motion.div
            className="absolute inset-4 rounded-full bg-blur-accent-cool/5"
            animate={{ scale: [1.05, 1, 1.05], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          {/* 内层 */}
          <motion.div
            className="absolute inset-10 rounded-full bg-blur-accent-warm/5"
            animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />

          {/* 核心文字 */}
          <motion.span
            className="text-4xl md:text-5xl font-light text-blur-text/20 select-none"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            Blur
          </motion.span>
        </div>

        <h2 className="text-lg md:text-xl font-medium text-blur-text tracking-tight mb-8">
          正在呈现你的画像
        </h2>

        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIndex}
              className="text-sm text-blur-text-muted font-light"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {LOADING_TEXTS[textIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ====== 底部极简进度 ====== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="relative z-10 w-full max-w-[200px] mt-16"
      >
        <div className="h-px bg-blur-border/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blur-text-light/40 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5, ease: "linear" }}
          />
        </div>
        <div className="flex justify-between mt-3">
          <span className="text-[10px] text-blur-text-light tracking-widest uppercase">
            Loading
          </span>
          <span className="text-[10px] text-blur-text-light tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
      </motion.div>
    </div>
  );
}
