import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronDown, Zap } from "lucide-react";
import VectorSpace3D from "../components/VectorSpace3D";
import ShareButton from "../components/ShareButton";
import GlassButton from "../components/GlassButton";
import TraitRadar from "../components/TraitRadar";

const TABS = [
  { key: "cloud", label: "画像" },
  { key: "data", label: "数据" },
  { key: "narrative", label: "叙事" },
];

const tabContentVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function Result({ result, onRestart }) {
  const captureRef = useRef(null);
  const [activeTab, setActiveTab] = useState("cloud");
  const [expandedTag, setExpandedTag] = useState(null);

  const { archetype, archetypeKey, secondaryArchetype, tagDetails, scoredTraits, dimensionScores, suppressedTraits } = result;
  const narrative = archetype.narrative;

  return (
    <div className="flex-1 flex flex-col px-6 py-10 max-w-md mx-auto w-full overflow-y-auto">
      <div ref={captureRef} className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative w-[280px] h-[280px] mb-6"
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <VectorSpace3D
              dimensionScores={dimensionScores}
              archetypeKey={archetypeKey}
              scoredTraits={scoredTraits}
              width={280}
              height={280}
            />
          </motion.div>

          <div
            className="absolute inset-0 rounded-full opacity-15 blur-3xl -z-10"
            style={{
              background:
                "radial-gradient(circle at 40% 40%, rgba(155,142,199,0.35) 0%, rgba(143,181,196,0.15) 50%, transparent 70%)",
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center mb-3"
        >
          <span className="text-4xl mb-2">{archetype.symbol}</span>
          <span className="text-[11px] text-blur-text-light tracking-[0.25em] uppercase">
            Blur 人格原型
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[28px] font-medium text-blur-text tracking-tight leading-tight text-center"
        >
          {archetype.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-blur-text-muted mt-1.5 text-center"
        >
          {archetype.subtitle}
        </motion.p>

        {secondaryArchetype && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-2 flex items-center gap-1.5 text-xs text-blur-text-light"
          >
            <span>兼具</span>
            <span className="text-blur-accent">
              {secondaryArchetype.symbol} {secondaryArchetype.title}
            </span>
            <span>特质</span>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex gap-1 p-1 rounded-2xl glass mt-6 mb-5"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setExpandedTag(null);
            }}
            className={`flex-1 px-4 py-2 rounded-xl text-xs transition-all duration-300 cursor-pointer ${
              activeTab === tab.key
                ? "bg-blur-surface text-blur-text shadow-sm font-medium"
                : "text-blur-text-muted hover:text-blur-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "cloud" && (
          <motion.div
            key="cloud"
            variants={tabContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-blur-text-muted leading-relaxed text-center mb-5 px-2"
            >
              {archetype.description}
            </motion.p>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6 }}
              className="w-12 h-px bg-gradient-to-r from-transparent via-blur-border to-transparent mx-auto mb-5"
            />

            <div className="flex flex-col gap-2 mb-5">
              {tagDetails.map((tag, i) => (
                <motion.div
                  key={tag.trait}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                >
                  <button
                    onClick={() => setExpandedTag(expandedTag === i ? null : i)}
                    className="w-full text-left cursor-pointer"
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs glass transition-all duration-200 ${
                        expandedTag === i
                          ? "text-blur-accent bg-blur-surface"
                          : "text-blur-text hover:bg-blur-surface-hover"
                      }`}
                    >
                      {tag.text}
                      <motion.span
                        animate={{ rotate: expandedTag === i ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex"
                      >
                        <ChevronDown size={12} className="text-blur-text-light" />
                      </motion.span>
                    </span>
                  </button>
                  <AnimatePresence>
                    {expandedTag === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-blur-text-muted leading-relaxed mt-2 ml-1 pl-3 border-l-2 border-blur-accent/30">
                          {tag.detail}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {suppressedTraits && suppressedTraits.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-2xl p-4 mb-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-blur-accent" />
                  <span className="text-xs font-medium text-blur-text">你的另一面</span>
                </div>
                <p className="text-xs text-blur-text-muted leading-relaxed mb-3">
                  你很少展露这些特质，但它们偶尔会在你毫无防备时浮现——
                </p>
                <div className="flex flex-wrap gap-2">
                  {suppressedTraits.slice(0, 2).map((trait) => (
                    <span
                      key={trait.trait}
                      className="text-xs px-3 py-1.5 rounded-full border border-blur-border text-blur-text-muted"
                    >
                      {trait.text}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-blur-text-light italic text-center"
            >
              "所有不精确都值得被看见"
            </motion.p>
          </motion.div>
        )}

        {activeTab === "data" && (
          <motion.div
            key="data"
            variants={tabContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <TraitRadar dimensionScores={dimensionScores} />

            <div className="mt-4 space-y-3">
              <p className="text-[11px] text-blur-text-light tracking-[0.15em] uppercase text-center mb-3">
                特质分布
              </p>
              {scoredTraits.slice(0, 8).map((trait, i) => {
                const maxScore = scoredTraits[0].score;
                const pct = Math.max(5, (trait.score / maxScore) * 100);
                return (
                  <motion.div
                    key={trait.trait}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-blur-text-muted w-20 shrink-0 truncate">
                      {trait.text}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-blur-surface overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(155,142,199,0.7), rgba(143,181,196,0.7))",
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === "narrative" && (
          <motion.div
            key="narrative"
            variants={tabContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <NarrativeSection
              title="你的内在世界"
              content={narrative.innerWorld}
              delay={0}
              accent="rgba(155, 142, 199, 0.3)"
            />
            <NarrativeSection
              title="你在关系中"
              content={narrative.inRelation}
              delay={0.1}
              accent="rgba(143, 181, 196, 0.3)"
            />
            <NarrativeSection
              title="你的隐藏面"
              content={narrative.hiddenSide}
              delay={0.2}
              accent="rgba(196, 165, 137, 0.3)"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="mt-auto pt-10 space-y-4"
      >
        <ShareButton targetRef={captureRef} />

        <div className="flex justify-center">
          <GlassButton variant="ghost" onClick={onRestart}>
            <span className="flex items-center gap-2">
              <RotateCcw size={14} />
              再测一次
            </span>
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
}

function NarrativeSection({ title, content, delay = 0, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="glass rounded-2xl p-4">
        <h3
          className="text-sm font-medium text-blur-text mb-2.5 pb-2"
          style={{ borderBottom: `1px solid ${accent}` }}
        >
          {title}
        </h3>
        <p className="text-xs text-blur-text-muted leading-[1.8]">{content}</p>
      </div>
    </motion.div>
  );
}
