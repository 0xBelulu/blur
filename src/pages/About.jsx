import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, List, ChevronRight, Sparkles, Hash } from "lucide-react";
import QuestionBank from "../components/QuestionBank";

/* ─── text-embedded link, no button ─── */
function InlineLink({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1 text-[15px] text-blur-text underline underline-offset-[3px] decoration-blur-border/40 hover:decoration-blur-accent hover:text-blur-accent transition-colors duration-200 cursor-pointer align-middle"
    >
      <Icon size={12} className="opacity-40 group-hover:opacity-70 transition-opacity" />
      <span>{label}</span>
      <ChevronRight size={10} className="opacity-40 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

/* ─── paragraph divider ─── */
function ParaBreak() {
  return (
    <div className="py-4 flex justify-center">
      <span className="text-sm text-blur-text-light/20 tracking-[0.6em]">· · ·</span>
    </div>
  );
}

export default function About({ onBack, onOpenArchetypes, onOpenTraits }) {
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

      {/* Content wrapper — notebook style */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col min-h-[100svh]">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 md:px-10 py-5 border-b border-blur-border/20">
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

        {/* Notebook body: binding + ruled lines */}
        <main
          className="flex-1 overflow-y-auto custom-scrollbar relative"
          style={{
            backgroundImage: "linear-gradient(to bottom, transparent 95%, rgba(200,195,190,0.04) 95%)",
            backgroundSize: "100% 28px",
          }}
        >
          {/* Left binding line */}
          <div className="absolute left-6 md:left-10 top-0 bottom-0 w-px border-l border-dashed border-blur-border/15 pointer-events-none" />
          {/* Binding holes */}
          <div className="absolute left-[22px] md:left-[38px] top-24 flex flex-col gap-[104px] pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-blur-border/20" />
          </div>

          <div className="pl-10 md:pl-14 pr-6 md:pr-10 pt-10 md:pt-14 pb-16">
            {/* ─── Section 1: About Blur ─── */}
            <section>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-light text-blur-text-light/25 leading-none select-none">01</span>
                <h2 className="text-base font-medium text-blur-text tracking-wide">
                  关于这个测试
                </h2>
              </div>

              <p className="text-[15px] text-blur-text-muted leading-[1.85]">
                我们不给你贴标签，不打分，不排名。Blur 不是那种做完之后给你四个字母、一个百分比、或者一句「你是 X 型人格」的测试。
              </p>
              <ParaBreak />
              <p className="text-[15px] text-blur-text-muted leading-[1.85]">
                在这里，你越努力想看清楚自己，画面就越模糊。这不是 bug，这就是你。每道题都没有正确答案，除了你心里那个。我们的目的不是定义你，而是让你发现一个你从未注意到的自己。
              </p>
              <ParaBreak />
              <p className="text-[15px] text-blur-text-muted leading-[1.85]">
                如果你愿意，可以
                <InlineLink
                  icon={List}
                  label="浏览全部题目"
                  onClick={() => setShowQuestionBank(true)}
                />
                ，在测试开始前先看一眼。
              </p>
            </section>

            {/* ─── Section 2: Archetypes ─── */}
            <section className="mt-14">
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-light text-blur-text-light/25 leading-none select-none">02</span>
                <h2 className="text-base font-medium text-blur-text tracking-wide">
                  九种模糊的原型
                </h2>
              </div>

              <p className="text-[15px] text-blur-text-muted leading-[1.85]">
                Blur 将人格划分为九种原型。它们不是分类，而是透镜——透过不同的模糊方式，你看到的是不同的自己。
              </p>
              <ParaBreak />
              <p className="text-[15px] text-blur-text-muted leading-[1.85]">
                雾、风铃、漂流者、静观者、虹、盐、底片、潮汐、剪影——每一种都有自己的内心世界、关系模式和隐藏侧面。
                <InlineLink
                  icon={Sparkles}
                  label="查看全部"
                  onClick={onOpenArchetypes}
                />
              </p>
            </section>

            {/* ─── Section 3: Traits ─── */}
            <section className="mt-14">
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-light text-blur-text-light/25 leading-none select-none">03</span>
                <h2 className="text-base font-medium text-blur-text tracking-wide">
                  七十余枚特质标签
                </h2>
              </div>

              <p className="text-[15px] text-blur-text-muted leading-[1.85]">
                每种原型对应一组特质标签。它们像散落在各处的碎片，单独看是碎片，组合起来才是一幅完整的画面。
              </p>
              <ParaBreak />
              <p className="text-[15px] text-blur-text-muted leading-[1.85]">
                你的结果里会出现最贴合你的几枚标签，而其余标签则是你可能从未注意到的侧面。
                <InlineLink
                  icon={Hash}
                  label="查看全部"
                  onClick={onOpenTraits}
                />
              </p>
            </section>

            {/* Bottom margin for notebook feel */}
            <div className="h-16" />
          </div>
        </main>
      </div>

      {/* QuestionBank modal */}
      <AnimatePresence>
        {showQuestionBank && (
          <QuestionBank onClose={() => setShowQuestionBank(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
