import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, List, ArrowRight } from "lucide-react";
import QuestionBank from "../components/QuestionBank";

export default function About({ onBack }) {
  const [showQuestionBank, setShowQuestionBank] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-[100svh] relative overflow-hidden">
      {/* Background ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[14%] left-[8%] w-40 h-40 rounded-full bg-blur-accent/8 blur-3xl"
          style={{ animation: "orb-scale-1 11s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[16%] right-[10%] w-48 h-48 rounded-full bg-blur-accent-cool/8 blur-3xl"
          style={{ animation: "orb-scale-2 13s ease-in-out infinite" }}
        />
        <div
          className="absolute top-[52%] right-[26%] w-24 h-24 rounded-full bg-blur-accent-warm/8 blur-2xl"
          style={{ animation: "orb-drift 9s ease-in-out infinite" }}
        />
      </div>

      {/* Narrow content wrapper */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 md:px-10 flex flex-col min-h-[100svh]">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between py-5 border-b border-blur-border/20">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-blur-surface-hover transition-colors cursor-pointer"
            aria-label="返回"
          >
            <ArrowLeft size={16} className="text-blur-text-muted" />
          </button>
          <h1 className="text-sm md:text-base font-medium tracking-widest text-blur-text">
            探索 Blur
          </h1>
          <div className="w-9 h-9" aria-hidden="true" />
        </header>

        {/* Content sections */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pt-8 md:pt-12">
          <div className="flex flex-col gap-12 md:gap-16">
            {/* Section slots — structure only */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="min-h-[100px]"
              aria-label="section-1"
            />

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
              className="min-h-[100px]"
              aria-label="section-2"
            />

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="min-h-[100px]"
              aria-label="section-3"
            />

            {/* Card entry — 浏览全部题目 */}
            <motion.button
              type="button"
              onClick={() => setShowQuestionBank(true)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-4 p-5 rounded-2xl glass hover:bg-blur-surface-hover text-left cursor-pointer transition-all duration-300"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl glass-strong flex items-center justify-center">
                <List size={18} className="text-blur-text" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-blur-text leading-snug">
                  浏览全部题目
                </div>
              </div>
              <ArrowRight
                size={16}
                className="flex-shrink-0 text-blur-text-muted group-hover:text-blur-text group-hover:translate-x-0.5 transition-all duration-300"
              />
            </motion.button>
          </div>

          {/* Footer disclaimer */}
          <div className="py-10">
            <p className="text-[11px] text-blur-text-light/80 italic leading-relaxed text-center">
              本测试结果不具备任何科学参考价值，但可能意外地准确
            </p>
          </div>
        </main>
      </div>

      {/* QuestionBank modal — opens on card click */}
      <AnimatePresence>
        {showQuestionBank && (
          <QuestionBank onClose={() => setShowQuestionBank(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
