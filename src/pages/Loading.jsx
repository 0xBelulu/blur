import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const loadingTexts = [
  "正在收集你的模糊信号…",
  "调焦中，请勿眨眼…",
  "分析你的不精确性…",
  "在雾中寻找轮廓…",
  "模糊算法运算中…",
  "正在生成你的不清晰度…",
];

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-[100svh]">
      <div className="text-center max-w-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-full glass flex items-center justify-center"
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Loader2 size={28} className="text-blur-accent" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h2
            className="text-xl font-medium text-blur-text mb-3"
            animate={{ filter: ["blur(0px)", "blur(1px)", "blur(0px)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            正在精确模糊计算中
          </motion.h2>
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {loadingTexts.map((text, i) => (
            <motion.p
              key={i}
              className="text-sm text-blur-text-muted"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                y: [10, 0, 0, -10],
              }}
              transition={{
                duration: 3,
                delay: i * 0.8,
                repeat: Infinity,
                repeatDelay: loadingTexts.length * 0.8 - 3,
              }}
            >
              {text}
            </motion.p>
          ))}
        </motion.div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-blur-accent"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
