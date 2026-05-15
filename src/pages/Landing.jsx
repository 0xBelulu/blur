import { motion } from "framer-motion";
import GlassButton from "../components/GlassButton";

export default function Landing({ onStart }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-[100svh]">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-blur-accent/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[15%] w-40 h-40 rounded-full bg-blur-accent-cool/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[50%] right-[30%] w-24 h-24 rounded-full bg-blur-accent-warm/10 blur-2xl"
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-md mx-auto text-center">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-5xl font-medium tracking-tight text-blur-text mb-4"
          >
            Blur
          </h1>
          
          <p className="text-lg text-blur-text-muted leading-relaxed"
          >
            一种不精确的人格测试
          </p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-12 space-y-4"
        >
          <div className="glass rounded-2xl p-6 text-left"
          >
            <p className="text-sm text-blur-text leading-relaxed mb-3"
            >
              我们不用四个字母定义你，也不给分数和排名。
            </p>
            <p className="text-sm text-blur-text-muted leading-relaxed"
            >
              在这个测试里，你越努力想看清楚自己，画面就越模糊。
              这不是 bug，这就是你。
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-blur-text-light"
          >
            <span className="w-8 h-px bg-blur-border"></span>
            <span>10 个问题 · 约 3 分钟</span>
            <span className="w-8 h-px bg-blur-border"></span>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <GlassButton onClick={onStart} className="text-base px-10 py-4">
            开始失焦
          </GlassButton>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-12 text-xs text-blur-text-light"
        >
          本测试结果不具备任何科学参考价值，但可能意外地准确
        </motion.p>
      </div>
    </div>
  );
}
