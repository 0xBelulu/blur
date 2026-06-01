import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Zap } from "lucide-react";
import TraitSpace2D from "../components/TraitSpace2D";
import GlassButton from "../components/GlassButton";
import { DIMENSION_PAIRS } from "../utils/blurEngine";
import TraitRadar from "../components/TraitRadar";
import DimensionMeters from "../components/DimensionMeters";
import ProgressBar from "../components/ProgressBar";

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
  const [activeTab, setActiveTab] = useState("cloud");
  const [activePairIndex, setActivePairIndex] = useState(0);

  const [hoveredArchetype, setHoveredArchetype] = useState(null);

  const { archetype, secondaryArchetype, tagDetails, scoredTraits, dimensionScores, suppressedTraits, userVector, similarities } = result;
  const narrative = archetype.narrative;

  const vectorSize = typeof window !== "undefined" && window.innerWidth >= 768 ? 420 : 320;
  const activePair = DIMENSION_PAIRS[activePairIndex];

  return (
    <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-center gap-6 md:gap-10 px-6 py-8 md:py-12 max-w-5xl mx-auto w-full overflow-y-auto">
      {/* Left: Trait Space + Meters */}
      <div className="flex flex-col items-center md:items-start md:w-[420px] shrink-0">
        <motion.div
          key={activePair.key}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-3"
          style={{ width: vectorSize, height: vectorSize }}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <TraitSpace2D
              userVector={userVector}
              xKey={activePair.xKey}
              yKey={activePair.yKey}
              width={vectorSize}
              height={vectorSize}
              onHoverArchetype={setHoveredArchetype}
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

        {/* Pair selector */}
        <motion.div className="relative flex rounded-2xl glass p-1 mb-4 w-full">
          {DIMENSION_PAIRS.map((pair, i) => (
            <button
              key={pair.key}
              onClick={() => setActivePairIndex(i)}
              className="flex-1 relative z-10 px-1 py-1.5 text-[10px] cursor-pointer"
            >
              {activePairIndex === i && (
                <motion.div
                  layoutId="activePairTab"
                  className="absolute inset-0 rounded-xl bg-blur-surface shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors duration-300 ${
                  activePairIndex === i
                    ? "text-blur-text font-medium"
                    : "text-blur-text-muted hover:text-blur-text"
                }`}
              >
                {pair.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Dimension Meters - desktop sticky side panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="hidden md:block w-full glass rounded-2xl p-4"
        >
          <p className="text-[10px] text-blur-text-light tracking-[0.2em] uppercase mb-3 text-center">
            人格匹配度
          </p>
          <DimensionMeters similarities={similarities} activeKey={hoveredArchetype} />
        </motion.div>
      </div>

      {/* Right: Info Panel */}
      <div className="flex-1 flex flex-col items-center md:items-start min-w-0 max-w-md mx-auto md:mx-0 w-full">
        <div className="flex flex-col items-center md:items-start w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col items-center md:items-start mb-3"
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
            className="text-[28px] font-medium text-blur-text tracking-tight leading-tight text-center md:text-left"
          >
            {archetype.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-blur-text-muted mt-1.5 text-center md:text-left"
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

        {/* Mobile Dimension Meters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="md:hidden w-full glass rounded-2xl p-4 mt-5"
        >
          <p className="text-[10px] text-blur-text-light tracking-[0.2em] uppercase mb-3 text-center">
            人格匹配度
          </p>
          <DimensionMeters similarities={similarities} activeKey={hoveredArchetype} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative flex rounded-2xl glass p-1 mt-6 mb-5 w-full"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
              }}
              className="flex-1 relative z-10 px-4 py-2 text-xs cursor-pointer"
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-blur-surface shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors duration-300 ${
                  activeTab === tab.key
                    ? "text-blur-text font-medium"
                    : "text-blur-text-muted hover:text-blur-text"
                }`}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </motion.div>

        <div className="w-full">
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
                  className="text-sm text-blur-text-muted leading-relaxed text-center md:text-left mb-5 px-2 md:px-0"
                >
                  {archetype.description}
                </motion.p>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6 }}
                  className="w-12 h-px bg-gradient-to-r from-transparent via-blur-border to-transparent mx-auto md:mx-0 mb-5"
                />

                <RecipeSection tagDetails={tagDetails} />

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
                  className="text-xs text-blur-text-light italic text-center md:text-left"
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
                  <p className="text-[11px] text-blur-text-light tracking-[0.15em] uppercase text-center md:text-left mb-3">
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
                        <div className="flex-1">
                          <ProgressBar pct={pct} delay={i * 0.05} />
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
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="mt-auto pt-10 w-full"
        >
          <div className="flex justify-center md:justify-start">
            <GlassButton variant="ghost" onClick={onRestart}>
              <span className="flex items-center gap-2">
                <RotateCcw size={14} />
                返回主页
              </span>
            </GlassButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function lerpChannel(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function recipeColor(t) {
  // 紫 → 青蓝
  const r = lerpChannel(155, 143, t);
  const g = lerpChannel(142, 181, t);
  const b = lerpChannel(199, 196, t);
  const a = lerpChannel(52, 28, t) / 100; // 0.52 → 0.28
  return { r, g, b, a };
}

function RecipeSection({ tagDetails }) {
  const [hovered, setHovered] = useState(null);

  if (!tagDetails || tagDetails.length === 0) return null;

  const maxScore = tagDetails[0]?.score || 1;
  const n = tagDetails.length;

  // Heavy / thick at the bottom
  const reversed = [...tagDetails].reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="mb-5"
    >
      <p className="text-[11px] text-blur-text-light tracking-[0.15em] uppercase text-center md:text-left mb-4">
        你的核心配方
      </p>

      <div className="glass rounded-2xl p-4 flex gap-3 items-stretch">
        {/* Left: textual recipe */}
        <div className="flex-1 space-y-2.5 self-center min-w-0">
          {reversed.map((tag, i) => {
            const portion = (tag.score / maxScore) * 2;
            const displayPortion = portion === 2 ? "2.0" : portion.toFixed(1);
            const color = recipeColor((n - 1 - i) / Math.max(n - 1, 1));
            const isActive = hovered === null || hovered === i;
            return (
              <motion.div
                key={tag.trait}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isActive ? 1 : 0.35,
                  x: 0,
                }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: `rgba(${color.r},${color.g},${color.b},${isActive ? color.a : color.a * 0.4})`,
                    transition: "background 0.3s ease",
                  }}
                />
                <span className="text-sm font-medium text-blur-accent tabular-nums w-8 shrink-0 text-right">
                  {displayPortion}
                </span>
                <span className="text-[10px] text-blur-text-light/60 w-4 shrink-0 text-center">
                  份
                </span>
                <span className="text-sm text-blur-text font-medium shrink-0">
                  {tag.text}
                </span>
                {tag.longDesc && (
                  <span className="text-xs text-blur-text-muted truncate pl-2 flex-1 min-w-0">
                    {tag.longDesc}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Right: cocktail bottle */}
        <div className="w-10 shrink-0 flex flex-col">
          <div className="w-full flex-1 min-h-0 rounded-xl overflow-hidden border border-blur-border/40 flex flex-col">
            {reversed.map((tag, i) => {
              const color = recipeColor((n - 1 - i) / Math.max(n - 1, 1));
              const flexGrow = tag.score;
              const isActive = hovered === null || hovered === i;
              return (
                <motion.div
                  key={tag.trait}
                  initial={{ scaleY: 0 }}
                  animate={{
                    scaleY: 1,
                    opacity: isActive ? 1 : 0.35,
                  }}
                  transition={{
                    scaleY: { delay: 0.3 + i * 0.1, duration: 0.6, ease: "easeOut" },
                    opacity: { duration: 0.3 },
                  }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onTouchStart={() => setHovered(i)}
                  onTouchEnd={() => setHovered(null)}
                  className="w-full origin-bottom cursor-pointer"
                  style={{
                    flexGrow,
                    background: `linear-gradient(180deg, rgba(${color.r + 18},${color.g + 16},${Math.min(color.b + 16, 255)},${color.a + 0.08}) 0%, rgba(${color.r},${color.g},${color.b},${color.a}) 40%, rgba(${color.r},${color.g},${color.b},${color.a}) 100%)`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="text-xs text-blur-text-light italic mt-4 text-center md:text-left leading-relaxed"
      >
        {(() => {
          const names = tagDetails.map((t) => t.text);
          const main = names[0];
          const rest = names.slice(1);
          if (rest.length === 0) return `这是一份纯粹的${main}人格。`;
          const restText =
            rest.length > 1
              ? rest.slice(0, -1).join("、") + "与" + rest.at(-1)
              : rest[0];
          return `这是一份以${main}为底、${restText}为引的人格配方。`;
        })()}
      </motion.p>
    </motion.div>
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
