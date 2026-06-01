import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { questions } from "../data/questions";

const TYPE_LABELS = {
  single: "单选",
  scale: "量表",
  rank: "排序",
};

const TYPE_COLORS = {
  single: "text-blue-400/80",
  scale: "text-purple-400/80",
  rank: "text-amber-400/80",
};

function DetailContent({ question, index }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] text-blur-text-muted">#{index + 1}</span>
        <span className="text-[11px] text-blur-text-muted">
          {TYPE_LABELS[question.type] || "单选"}
        </span>
      </div>

      <p className="text-sm text-blur-text leading-relaxed mb-3">
        {question.text}
      </p>

      <div className="pt-3 border-t border-blur-border/40 space-y-1.5">
        {question.type === "scale" ? (
          <p className="text-xs text-blur-text-muted italic">
            1-5 同意程度量表（完全不同意 → 完全同意）
          </p>
        ) : (
          question.options?.map((opt) => (
            <div key={opt.id} className="flex items-start gap-2.5">
              <span className="text-xs text-blur-text-muted mt-0.5 flex-shrink-0 font-medium">
                {opt.id}.
              </span>
              <span className="text-sm text-blur-text-light leading-relaxed">
                {opt.text}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default function Questions({ onBack }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="flex-1 flex flex-col min-h-[100svh] relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[14%] left-[8%] w-40 h-40 rounded-full bg-blur-accent/8 blur-3xl"
          style={{ animation: "orb-scale-1 11s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[16%] right-[10%] w-48 h-48 rounded-full bg-blur-accent-cool/8 blur-3xl"
          style={{ animation: "orb-scale-2 13s ease-in-out infinite" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col min-h-[100svh]">
        <header className="flex-shrink-0 flex items-center justify-between px-6 md:px-10 py-5 border-b border-blur-border/20">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-blur-surface-hover transition-colors cursor-pointer"
            aria-label="返回"
          >
            <ArrowLeft size={16} className="text-blur-text-muted" />
          </button>
          <h1 className="text-sm md:text-base font-medium tracking-widest text-blur-text">
            全部题目 ({questions.length})
          </h1>
          <div className="w-9 h-9" aria-hidden="true" />
        </header>

        <main
          className="flex-1 overflow-y-auto custom-scrollbar relative"
          style={{
            backgroundImage: "linear-gradient(to bottom, transparent 95%, rgba(200,195,190,0.04) 95%)",
            backgroundSize: "100% 28px",
          }}
        >
          <div className="absolute left-6 md:left-10 top-0 bottom-0 w-px border-l border-dashed border-blur-border/15 pointer-events-none" />
          <div className="absolute left-[22px] md:left-[38px] top-24 flex flex-col gap-[104px] pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
          </div>

          <div className="pl-10 md:pl-14 pr-6 md:pr-10 pt-10 md:pt-14 pb-16">
            <p className="text-[15px] text-blur-text-muted leading-[1.85] mb-6">
              共 {questions.length} 道题，涵盖单选、量表与排序三种类型。仅作预览，请在测试中作答。
            </p>

            <div className="space-y-2">
              {questions.map((q, i) => {
                const typeLabel = TYPE_LABELS[q.type] || "单选";
                const typeColor = TYPE_COLORS[q.type] || TYPE_COLORS.single;
                const isOpen = openId === q.id;

                return (
                  <div
                    key={q.id}
                    className="rounded-lg border border-blur-border/20 bg-blur-surface/10 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenId(isOpen ? null : q.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blur-surface-hover/20 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-medium flex-shrink-0 text-[11px] ${typeColor}`}>
                          [{typeLabel}]
                        </span>
                        <span className="text-[11px] text-blur-text-muted/50 flex-shrink-0">
                          #{i + 1}
                        </span>
                        <span className="text-sm text-blur-text truncate">
                          {q.text}
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-blur-text-muted transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4">
                            <DetailContent question={q} index={i} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="h-16" />
          </div>
        </main>
      </div>
    </div>
  );
}
