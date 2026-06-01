import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, List, ChevronRight, ChevronDown, Sparkles, Hash } from "lucide-react";
import QuestionBank from "../components/QuestionBank";
import { archetypeDescriptions, DIMENSIONS, tagPool } from "../data/tags";

/* ─── text-embedded link, no button ─── */
function InlineLink({ icon: Icon, label, onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1 text-[15px] text-blur-text underline underline-offset-[3px] decoration-blur-border/40 hover:decoration-blur-accent hover:text-blur-accent transition-colors duration-200 cursor-pointer align-middle"
    >
      <Icon size={12} className="opacity-40 group-hover:opacity-70 transition-opacity" />
      <span>{label}</span>
      {isOpen ? (
        <ChevronDown size={10} className="opacity-40" />
      ) : (
        <ChevronRight size={10} className="opacity-40 group-hover:translate-x-0.5 transition-transform" />
      )}
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

/* ─── archetype mini card with inline accordion ─── */
function ArchetypeMini({ data, isOpen, onClick }) {
  return (
    <div className="rounded-lg border border-blur-border/20 bg-blur-surface/10 overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blur-surface-hover/20 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-base select-none">{data.symbol}</span>
          <div>
            <div className="text-sm font-medium text-blur-text">{data.title}</div>
            <div className="text-xs text-blur-text-muted">{data.subtitle}</div>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`text-blur-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
            <div className="px-4 pb-4 space-y-3 text-sm text-blur-text-muted leading-relaxed">
              <p>{data.description}</p>
              <div className="space-y-2 pt-2 border-t border-blur-border/10">
                <p>
                  <span className="text-blur-text/70 font-medium text-xs">内心世界</span> — {data.narrative.innerWorld}
                </p>
                <p>
                  <span className="text-blur-text/70 font-medium text-xs">关系之中</span> — {data.narrative.inRelation}
                </p>
                <p>
                  <span className="text-blur-text/70 font-medium text-xs">隐藏侧面</span> — {data.narrative.hiddenSide}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function About({ onBack }) {
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showArchetypes, setShowArchetypes] = useState(false);
  const [openArchetype, setOpenArchetype] = useState(null);
  const [showTraits, setShowTraits] = useState(false);
  const [openTraitGroup, setOpenTraitGroup] = useState(null);

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
                  label="展开查看"
                  onClick={() => {
                    setShowArchetypes(!showArchetypes);
                    setOpenArchetype(null);
                  }}
                  isOpen={showArchetypes}
                />
              </p>

              <AnimatePresence>
                {showArchetypes && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="mt-5 space-y-2"
                  >
                    {Object.entries(archetypeDescriptions).map(([key, data]) => (
                      <ArchetypeMini
                        key={key}
                        data={data}
                        isOpen={openArchetype === key}
                        onClick={() =>
                          setOpenArchetype(openArchetype === key ? null : key)
                        }
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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
                  label="展开查看"
                  onClick={() => {
                    setShowTraits(!showTraits);
                    setOpenTraitGroup(null);
                  }}
                  isOpen={showTraits}
                />
              </p>

              <AnimatePresence>
                {showTraits && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="mt-5 space-y-3"
                  >
                    {Object.entries(DIMENSIONS).map(([key, dim]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-blur-border/20 bg-blur-surface/10 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setOpenTraitGroup(openTraitGroup === key ? null : key)
                          }
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blur-surface-hover/20 transition-colors cursor-pointer"
                        >
                          <span className="text-sm font-medium text-blur-text">
                            {dim.name}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-blur-text-muted transition-transform duration-200 ${openTraitGroup === key ? "rotate-180" : ""}`}
                          />
                        </button>
                        <AnimatePresence>
                          {openTraitGroup === key && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 flex flex-wrap gap-2">
                                {dim.traits.map((traitKey) => {
                                  const trait = tagPool[traitKey];
                                  if (!trait) return null;
                                  return (
                                    <span
                                      key={traitKey}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs border border-blur-border/30 bg-blur-surface/20 text-blur-text-muted"
                                      title={trait.detail}
                                    >
                                      {trait.text}
                                    </span>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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
