import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, Sparkles } from "lucide-react";
import GlassButton from "../components/GlassButton";

const TIPS = [
  "如果你在读这句话，说明你确实在读。",
  "本测试不对结果负责，但对你负责。",
  "世界上有两种人：一种做完了这个测试，另一种还没做。",
  "画像先留在本机，是否同步由你决定。",
  "如果感到困惑，那正是我们想要的。",
  "这不是一个人格测试，这是十次深呼吸。",
  "越模糊，越真实。—— 没人说过",
  "请在光线充足的环境下假装思考。",
  "每道题都没有正确答案，除了你心里那个。",
  "你的性格不是你的标签，是你的动词。",
  "不要在测试中思考，要在思考中测试。",
  "走神是人类最高效的并行计算。",
];

const ACTION_CLASS = "min-h-13 flex items-center justify-center";

function useRotatingTip(interval = 4000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TIPS.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);
  return TIPS[index];
}

// Keep the timer's updates local instead of reconciling the animated background.
function RotatingTip() {
  const tip = useRotatingTip(4200);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={tip}
        initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="text-[13px] text-blur-text-light italic leading-relaxed"
      >
        {tip}
      </motion.p>
    </AnimatePresence>
  );
}

export default function Landing({ onStart, onExplore, onOpenMy }) {
  const actions = [
    {
      label: "开始测试",
      icon: null,
      variant: "primary",
      onClick: onStart,
      className: "text-base px-10 md:px-12 animate-fade-in-up delay-900",
    },
    {
      label: "探索blur",
      icon: Sparkles,
      variant: "primary",
      onClick: onExplore,
      className: "text-sm gap-1.5 animate-fade-in-up delay-1100",
    },
    {
      label: "我的空间",
      icon: UserRound,
      variant: "primary",
      onClick: onOpenMy,
      className: "text-sm gap-1.5 animate-fade-in-up delay-1300",
    },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row items-center md:justify-center px-6 md:px-16 lg:px-24 pt-20 pb-12 md:py-16 min-h-[100svh] relative overflow-hidden max-w-6xl mx-auto w-full">
      {/* Left — Brand */}
      <div className="relative z-10 w-full md:w-1/2 text-center md:text-left flex flex-col justify-start md:justify-center md:pr-8 lg:pr-16 mb-10 md:mb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-5 flex justify-center md:justify-start"
        >
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40">
            <circle cx="14" cy="13" r="9" fill="url(#lg1)" filter="url(#lblur1)" opacity="0.85"/>
            <circle cx="18" cy="19" r="8" fill="url(#lg2)" filter="url(#lblur2)" opacity="0.7"/>
            <circle cx="16" cy="16" r="7" fill="url(#lg3)" filter="url(#lblur1)" opacity="0.6"/>
            <defs>
              <filter id="lblur1" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" />
              </filter>
              <filter id="lblur2" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" />
              </filter>
              <radialGradient id="lg1" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ede6ff" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#9b8ec7" stopOpacity="0.3"/>
              </radialGradient>
              <radialGradient id="lg2" cx="55%" cy="60%" r="55%">
                <stop offset="0%" stopColor="#c4a589" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#8fb5c4" stopOpacity="0.2"/>
              </radialGradient>
              <radialGradient id="lg3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c49ba5" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#b5ada3" stopOpacity="0.1"/>
              </radialGradient>
            </defs>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        >
          <h1
            className="text-[3.5rem] md:text-[5.5rem] lg:text-[6.5rem] leading-none font-medium tracking-tight text-blur-text mb-4 md:mb-6 select-none"
            style={{
              textShadow: `
                0 0 50px rgba(155,142,199,0.12),
                0 0 100px rgba(155,142,199,0.06),
                0 1px 0 rgba(255,255,255,0.35)
              `,
            }}
          >
            Blur
          </h1>
          <p className="text-sm md:text-base text-blur-text-muted leading-relaxed tracking-widest md:tracking-[0.2em]">
            一种不精确的人格测试
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="hidden md:block mt-16 lg:mt-20 text-sm text-blur-text-light/70 italic leading-relaxed max-w-xs"
        >
          你不是看不清世界，<br />
          而是选择让世界看不清你。
        </motion.p>
      </div>

      {/* Right — Interaction */}
      <div className="relative z-10 w-full md:w-1/2 max-w-sm mx-auto md:mx-0 flex flex-col items-center md:items-start justify-start md:justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mb-8 md:mb-12 w-full text-center md:text-left"
        >
          <div className="pt-5 border-t border-blur-border/20 text-left pl-4 md:pl-0">
            <p className="text-[15px] text-blur-text leading-relaxed mb-3">
              我们不用四个字母定义你，也不给分数和排名。
            </p>
            <p className="text-[15px] text-blur-text-muted leading-relaxed">
              在这个测试里，你越努力想看清楚自己，画面就越模糊。
              这不是 bug，这就是你。
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-8 md:mb-12 h-6 w-full flex items-center justify-center md:justify-start"
        >
          <RotatingTip />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex items-center justify-center md:justify-start gap-3 mb-8 md:mb-12 w-full"
        >
          <span className="w-8 h-px bg-blur-border/60" />
          <span className="text-[11px] text-blur-text-light tracking-wider">
            10 个问题 · 约 3 分钟
          </span>
          <span className="w-8 h-px bg-blur-border/60" />
        </motion.div>

        <div className="flex flex-col items-center md:items-start gap-3 w-full">
          {actions.map(({ label, icon: Icon, variant, onClick, className }) => (
            <GlassButton
              key={label}
              variant={variant}
              onClick={onClick}
              className={`${ACTION_CLASS} ${className}`}
            >
              {Icon && <Icon size={14} />}
              {label}
            </GlassButton>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mt-12 md:mt-16 text-[11px] text-blur-text-light/80 italic leading-relaxed text-center md:text-left w-full"
        >
          本测试结果不具备任何科学参考价值，但可能意外地准确
        </motion.p>
      </div>
    </div>
  );
}
