import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye } from "lucide-react";
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

function DetailPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Eye size={28} className="text-blur-text-muted/30 mb-3" />
      <p className="text-xs text-blur-text-muted/50 leading-relaxed">
        点击左侧题目
        <br />
        查看详情
      </p>
    </div>
  );
}

export default function QuestionBank({ onClose }) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const selectQuestion = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const selectedQuestion = selectedId
    ? questions.find((q) => q.id === selectedId)
    : null;

  const selectedIndex = selectedId
    ? questions.findIndex((q) => q.id === selectedId)
    : -1;

  const renderDetail = () => {
    if (selectedId && selectedQuestion) {
      return (
        <DetailContent question={selectedQuestion} index={selectedIndex} />
      );
    }
    return <DetailPlaceholder />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col bg-blur-bg/95 backdrop-blur-xl"
    >
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-blur-border/30">
        <div className="flex items-center gap-3">
          <Eye size={18} className="text-blur-accent" />
          <span className="text-sm font-medium text-blur-text">
            全部题目 ({questions.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-blur-surface-hover transition-colors cursor-pointer"
        >
          <X size={16} className="text-blur-text-muted" />
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left: Capsule grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-wrap gap-1.5 p-4 content-start">
              {questions.map((q, i) => {
                const typeLabel = TYPE_LABELS[q.type] || "单选";
                const typeColor = TYPE_COLORS[q.type] || TYPE_COLORS.single;
                const isActive = selectedId === q.id;

                return (
                  <button
                    key={q.id}
                    onClick={() => selectQuestion(q.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "border-blur-accent bg-blur-accent/10 text-blur-text shadow-[0_0_8px_rgba(180,185,195,0.12)]"
                        : "border-blur-border/40 glass text-blur-text-muted hover:border-blur-text-muted/40"
                    }`}
                  >
                    <span className={`font-medium flex-shrink-0 ${typeColor}`}>
                      [{typeLabel}]
                    </span>
                    <span className="text-blur-text-muted/50 flex-shrink-0">
                      #{i + 1}
                    </span>
                    <span className="truncate max-w-[140px] sm:max-w-[200px] lg:max-w-[280px]">
                      {q.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-shrink-0 px-6 py-3 border-t border-blur-border/30 text-center md:hidden">
            <span className="text-[11px] text-blur-text-muted">
              仅作预览，请在测试中作答
            </span>
          </div>
        </div>

        {/* Right: Detail panel (desktop sidebar) */}
        <div className="hidden md:flex w-[320px] lg:w-[380px] flex-shrink-0 border-l border-blur-border/30 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId ?? "placeholder"}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto p-5 custom-scrollbar"
            >
              {renderDetail()}
            </motion.div>
          </AnimatePresence>
          <div className="flex-shrink-0 px-5 py-3 border-t border-blur-border/30 text-center">
            <span className="text-[11px] text-blur-text-muted">
              仅作预览，请在测试中作答
            </span>
          </div>
        </div>
      </div>

      {/* Mobile: Bottom sheet overlay */}
      <AnimatePresence>
        {selectedId && selectedQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 flex items-end"
          >
            <div
              className="absolute inset-0 bg-blur-bg/60 backdrop-blur-sm"
              onClick={() => setSelectedId(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full glass-strong rounded-t-2xl p-5 max-h-[65vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-end mb-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-xs text-blur-text-muted hover:text-blur-text transition-colors cursor-pointer"
                >
                  收起
                </button>
              </div>
              <DetailContent
                question={selectedQuestion}
                index={selectedIndex}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
