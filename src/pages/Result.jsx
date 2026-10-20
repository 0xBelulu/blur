import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Zap, HeartHandshake, ArrowRightLeft } from "lucide-react";
import TraitSpace2D from "../components/TraitSpace2D";
import GlassButton from "../components/GlassButton";
import { DIMENSION_PAIRS, determineSuppressedTraits } from "../utils/blurEngine";
import TraitRadar from "../components/TraitRadar";
import DimensionMeters from "../components/DimensionMeters";
import ProgressBar from "../components/ProgressBar";
import DraggableTabs from "../components/DraggableTabs";
import ShareControls from "../components/ShareControls";
import IdentityInvite from "../components/IdentityInvite";
import { shouldInvite, noteInviteShown } from "../utils/identityInvite";

const INVITE_DELAY = 1800;

const TABS = [
  { key: "cloud", label: "画像" },
  { key: "relation", label: "关系" },
  { key: "narrative", label: "叙事" },
  { key: "data", label: "数据" },
];

const tabContentVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function Result({ result, onRestart, record, publicView = false, onCompare, onOpenMy, onPermissions, account, justFinished = false }) {
  const [activeTab, setActiveTab] = useState("cloud");
  const [activePairIndex, setActivePairIndex] = useState(0);
  const [hoveredArchetype, setHoveredArchetype] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const inviteAsked = useRef(false);

  // Only a portrait that was just finished gets the invitation, and only once.
  // The policy lives in identityInvite.js so a refusal is remembered per device.
  // The "asked" mark moves inside the timer: StrictMode mounts effects twice,
  // and the first pass is cleaned up before it ever gets to open anything.
  useEffect(() => {
    if (!justFinished || publicView || !record || account?.registered) return undefined;
    if (inviteAsked.current === record.id) return undefined;
    if (!shouldInvite({ account, recordId: record.id })) return undefined;
    const timer = setTimeout(() => {
      inviteAsked.current = record.id;
      noteInviteShown(record.id);
      setInviteOpen(true);
    }, INVITE_DELAY);
    return () => clearTimeout(timer);
  }, [justFinished, publicView, record, account]);

  const {
    archetypeKey,
    archetype,
    secondaryArchetype,
    tagDetails,
    scoredTraits,
    dimensionScores,
    userVector,
    similarities,
    isDualResonance,
    dualSynergy,
  } = result;

  const [selectedKey, setSelectedKey] = useState(archetypeKey || "mist");
  const activeArchetype = similarities.find((item) => item.key === selectedKey)?.profile || archetype;
  const activeNarrative = activeArchetype.narrative;
  const activeSuppressed = selectedKey === archetypeKey && result.suppressedTraits
    ? result.suppressedTraits : determineSuppressedTraits(selectedKey, userVector);

  const [vectorSize, setVectorSize] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 768 ? 420 : 320
  );

  useEffect(() => {
    const handleResize = () => {
      setVectorSize(window.innerWidth >= 768 ? 420 : 320);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activePair = DIMENSION_PAIRS[activePairIndex];

  // Soft scale for resonance percentage display
  const minProb = Math.min(...similarities.map((s) => s.prob));
  const maxProb = Math.max(...similarities.map((s) => s.prob), 0.01);
  const softScale = (p) => {
    const normalized = (p - minProb) / (maxProb - minProb);
    const compressed = Math.pow(normalized, 0.7);
    return Math.max(10, compressed * 100);
  };

  const top1 = similarities[0];
  const top2 = similarities[1];
  const pct1 = Math.round(softScale(top1.prob));
  const pct2 = top2 ? Math.round(softScale(top2.prob)) : 0;
  const isDual =
    isDualResonance || (top2 && (Math.abs(top1.prob - top2.prob) <= 0.08 || Math.abs(pct1 - pct2) <= 8));

  return (
    <>
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
        <DraggableTabs
          tabs={DIMENSION_PAIRS.map((p) => ({ key: p.key, label: p.label }))}
          activeIndex={activePairIndex}
          onChange={setActivePairIndex}
          className="mb-4 w-full max-w-md mx-auto md:mx-0"
          tabClassName="px-2 sm:px-3 py-1.5 text-[10px]"
        />

        {/* Dimension Meters - desktop sticky side panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="hidden md:block w-full glass rounded-2xl p-4"
        >
          <p className="text-[10px] text-blur-text-light tracking-[0.2em] uppercase mb-2 text-center">
            人格光谱共振
          </p>
          <DimensionMeters
            similarities={similarities}
            activeKey={hoveredArchetype}
            selectedKey={selectedKey}
            onSelectArchetype={setSelectedKey}
          />
        </motion.div>
      </div>

      {/* Right: Info Panel */}
      <div className="flex-1 flex flex-col items-center md:items-start min-w-0 max-w-md mx-auto md:mx-0 w-full">
        {/* Dual Resonance Switcher */}
        {isDual && top2 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full glass rounded-2xl p-1.5 mb-5 flex items-center justify-between gap-2 select-none"
          >
            <span className="text-xs text-blur-text-muted pl-2.5 shrink-0">
              测出两种高契合人格：
            </span>
            <div className="relative flex-1 flex gap-1">
              <button
                onClick={() => setSelectedKey(top1.key)}
                className="relative flex-1 py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer z-10 transition-colors duration-200"
              >
                <span
                  className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${
                    selectedKey === top1.key
                      ? "text-blur-text font-medium"
                      : "text-blur-text-muted hover:text-blur-text"
                  }`}
                >
                  <span>{top1.profile.symbol}</span>
                  <span>{top1.profile.title}</span>
                  <span className="text-[10px] tabular-nums text-blur-text-light">{pct1}%</span>
                </span>
                {selectedKey === top1.key && (
                  <motion.div
                    layoutId="dual-tab-slider"
                    className="absolute inset-0 rounded-xl bg-blur-surface shadow-sm pointer-events-none"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setSelectedKey(top2.key)}
                className="relative flex-1 py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer z-10 transition-colors duration-200"
              >
                <span
                  className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 ${
                    selectedKey === top2.key
                      ? "text-blur-text font-medium"
                      : "text-blur-text-muted hover:text-blur-text"
                  }`}
                >
                  <span>{top2.profile.symbol}</span>
                  <span>{top2.profile.title}</span>
                  <span className="text-[10px] tabular-nums text-blur-text-light">{pct2}%</span>
                </span>
                {selectedKey === top2.key && (
                  <motion.div
                    layoutId="dual-tab-slider"
                    className="absolute inset-0 rounded-xl bg-blur-surface shadow-sm pointer-events-none"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Dual Resonance Synergy Card */}
        {isDual && dualSynergy && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full glass rounded-2xl p-4 mb-5 border border-blur-accent/30 space-y-2 bg-gradient-to-br from-white/40 via-white/20 to-blur-accent/10 select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blur-text flex items-center gap-1.5">
                <span className="text-blur-accent">✦</span>
                <span>双原型交融 · {dualSynergy.title}</span>
              </span>
              <span className="text-[10px] text-blur-accent font-medium px-2 py-0.5 rounded-full bg-blur-surface border border-blur-accent/20">
                双峰共振
              </span>
            </div>
            <p className="text-xs text-blur-text-muted leading-relaxed">
              {dualSynergy.description}
            </p>
            {dualSynergy.coreTension && (
              <div className="pt-1.5 border-t border-blur-border/30 text-[11px] text-blur-text-muted flex items-start gap-1.5">
                <span className="font-medium text-blur-text shrink-0">核心张力:</span>
                <span>{dualSynergy.coreTension}</span>
              </div>
            )}
          </motion.div>
        )}

        <div className="flex flex-col items-center md:items-start w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center md:items-start mb-2"
          >
            <span className="text-4xl mb-1.5">{activeArchetype.symbol}</span>
            <span className="text-[11px] text-blur-text-light tracking-[0.25em] uppercase">
              Blur 人格原型
            </span>
          </motion.div>

          <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
            <motion.h1
              key={activeArchetype.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[28px] font-medium text-blur-text tracking-tight leading-tight"
            >
              {activeArchetype.title}
            </motion.h1>
            {activeArchetype.roleBadge && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blur-surface border border-blur-border/70 text-blur-text-muted font-medium">
                {activeArchetype.roleBadge}
              </span>
            )}
          </div>

          <motion.p
            key={activeArchetype.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-blur-text-muted mt-1.5 text-center md:text-left"
          >
            {activeArchetype.subtitle}
          </motion.p>

          {/* If switched away from primary, provide quick reset */}
          {!isDual && selectedKey !== archetypeKey && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSelectedKey(archetypeKey)}
              className="mt-2 text-[11px] text-blur-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowRightLeft size={11} />
              <span>当前为探索视角 · 点击切回基准原型【{archetype.title}】</span>
            </motion.button>
          )}

          {/* Secondary archetype one-liner when not in dual resonance */}
          {!isDual && secondaryArchetype && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 flex items-center gap-2 text-xs text-blur-text-light"
            >
              <span>兼具</span>
              <button
                onClick={() => setSelectedKey(secondaryArchetype.key)}
                className="text-blur-accent font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {secondaryArchetype.symbol} {secondaryArchetype.title}
                </span>
                {secondaryArchetype.roleBadge && (
                  <span className="text-[10px] text-blur-text-muted">
                    ({secondaryArchetype.roleBadge})
                  </span>
                )}
              </button>
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
          <p className="text-[10px] text-blur-text-light tracking-[0.2em] uppercase mb-2 text-center">
            人格光谱共振
          </p>
          <DimensionMeters
            similarities={similarities}
            activeKey={hoveredArchetype}
            selectedKey={selectedKey}
            onSelectArchetype={setSelectedKey}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 w-full"
        >
          <DraggableTabs
            tabs={TABS}
            activeIndex={TABS.findIndex((t) => t.key === activeTab)}
            onChange={(i) => setActiveTab(TABS[i].key)}
            className="mb-5 w-full"
            tabClassName="px-4 py-2 text-xs"
          />
        </motion.div>

        <div className="w-full">
          <AnimatePresence mode="wait">
            {activeTab === "cloud" && (
              <motion.div
                key={`cloud-${selectedKey}`}
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
                  {activeArchetype.description}
                </motion.p>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6 }}
                  className="w-12 h-px bg-gradient-to-r from-transparent via-blur-border to-transparent mx-auto md:mx-0 mb-5"
                />

                <RecipeSection tagDetails={tagDetails} />

                {activeSuppressed && activeSuppressed.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass rounded-2xl p-4.5 mb-5 space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-blur-accent" />
                        <span className="text-xs font-medium text-blur-text">
                          你的另一面 · 隐藏潜能
                        </span>
                      </div>
                      <span className="text-[10px] text-blur-text-light">深水区特质</span>
                    </div>
                    <p className="text-xs text-blur-text-muted leading-relaxed">
                      你很少主动展现这些特质，甚至下意识将其折叠。但它们构成了你最真实的后盾，会在特定时刻浮现——
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {activeSuppressed.slice(0, 2).map((trait) => (
                        <div
                          key={trait.trait}
                          className="p-3 rounded-xl bg-white/30 border border-blur-border/60 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-blur-text flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blur-accent" />
                              {trait.text} · {trait.detail}
                            </span>
                            <span className="text-[10px] text-blur-text-light px-2 py-0.5 rounded-full bg-blur-surface">
                              不易察觉
                            </span>
                          </div>
                          {trait.triggerScene && (
                            <div className="text-[11px] text-blur-text-muted leading-relaxed">
                              <span className="text-blur-text-light font-medium mr-1">
                                显化情境:
                              </span>
                              {trait.triggerScene}
                            </div>
                          )}
                          {trait.whyHidden && (
                            <div className="text-[11px] text-blur-text-muted leading-relaxed">
                              <span className="text-blur-text-light font-medium mr-1">
                                为何隐蔽:
                              </span>
                              {trait.whyHidden}
                            </div>
                          )}
                          {trait.latentPower && (
                            <div className="text-[11px] text-blur-accent font-medium leading-relaxed pt-0.5">
                              <span className="text-blur-text-light font-normal mr-1">
                                潜在力量:
                              </span>
                              {trait.latentPower}
                            </div>
                          )}
                        </div>
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

            {/* Relation / Relationship Tab */}
            {activeTab === "relation" && (
              <motion.div
                key={`relation-${selectedKey}`}
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="text-center md:text-left mb-2">
                  <div className="flex items-center gap-1.5 justify-center md:justify-start mb-1 text-blur-accent">
                    <HeartHandshake size={15} />
                    <h3 className="text-sm font-medium text-blur-text">
                      关系镜像与契合伙伴
                    </h3>
                  </div>
                  <p className="text-xs text-blur-text-muted">
                    在复杂的心理光谱中，不同原型与你产生独特的共鸣与互补。
                  </p>
                </div>

                {/* Companion Card */}
                {activeArchetype.companion && (
                  <div className="glass rounded-2xl p-4 border border-blur-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{activeArchetype.companion.symbol}</span>
                        <div>
                          <div className="text-xs font-medium text-blur-text flex items-center gap-1.5">
                            <span>{activeArchetype.companion.title}</span>
                            <span className="text-[10px] text-blur-text-light px-1.5 py-0.5 rounded bg-blur-surface">
                              {activeArchetype.companion.roleBadge}
                            </span>
                          </div>
                          <span className="text-[10px] text-blur-accent font-medium">
                            {activeArchetype.companion.relationType || "同频共振伙伴"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-blur-text-light px-2 py-0.5 rounded-full bg-blur-surface">
                        灵魂默契
                      </span>
                    </div>
                    <p className="text-xs text-blur-text-muted leading-relaxed">
                      {activeArchetype.companion.description}
                    </p>
                  </div>
                )}

                {/* Complement Card */}
                {activeArchetype.complement && (
                  <div className="glass rounded-2xl p-4 border border-blur-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{activeArchetype.complement.symbol}</span>
                        <div>
                          <div className="text-xs font-medium text-blur-text flex items-center gap-1.5">
                            <span>{activeArchetype.complement.title}</span>
                            <span className="text-[10px] text-blur-text-light px-1.5 py-0.5 rounded bg-blur-surface">
                              {activeArchetype.complement.roleBadge}
                            </span>
                          </div>
                          <span className="text-[10px] text-teal-700/80 font-medium">
                            {activeArchetype.complement.relationType || "互补平衡伙伴"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-blur-text-light px-2 py-0.5 rounded-full bg-blur-surface">
                        视角互补
                      </span>
                    </div>
                    <p className="text-xs text-blur-text-muted leading-relaxed">
                      {activeArchetype.complement.description}
                    </p>
                  </div>
                )}

                {/* Share / Social invitation */}
                <div className="p-3.5 rounded-xl bg-blur-surface/50 text-center text-xs text-blur-text-light space-y-1">
                  <p className="font-medium text-blur-text">💡 想知道身边的朋友是什么原型？</p>
                  <p className="text-[11px] text-blur-text-muted">
                    邀请他们完成测试，看看你们是灵魂同频共振，还是互补镜像。
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "narrative" && (
              <motion.div
                key={`narrative-${selectedKey}`}
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <NarrativeSection
                  title="你的内在世界"
                  content={activeNarrative.innerWorld}
                  delay={0}
                  accent="rgba(155, 142, 199, 0.3)"
                />
                <NarrativeSection
                  title="你在关系中"
                  content={activeNarrative.inRelation}
                  delay={0.1}
                  accent="rgba(143, 181, 196, 0.3)"
                />
                <NarrativeSection
                  title="你的隐藏面"
                  content={activeNarrative.hiddenSide}
                  delay={0.2}
                  accent="rgba(196, 165, 137, 0.3)"
                />
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
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-auto pt-8 w-full"
        >
          {!publicView && record && <ShareControls record={record} sharing={false} onPermissions={onPermissions}
            onCreate={() => setInviteOpen(true)} createLabel="给这份画像一个身份" />}
          {!publicView && !record && <p role="status" className="text-xs text-blur-text-muted">本机存储空间不足，本次画像暂未存档。</p>}
          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
            {publicView && <GlassButton onClick={onCompare}>和 ta 对比</GlassButton>}
            {!publicView && onOpenMy && <GlassButton variant="secondary" onClick={onOpenMy}>我的空间</GlassButton>}
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
    {!publicView && record && <IdentityInvite open={inviteOpen} account={account} result={result}
      onClose={() => setInviteOpen(false)} />}
  </>
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
