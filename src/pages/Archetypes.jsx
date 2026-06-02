import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { archetypeDescriptions } from "../data/tags";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles";
import { DIMENSIONS as DIM_CONFIG } from "../data/dimensions";
import { DIMENSION_PAIRS } from "../utils/blurEngine";
import TraitSpace2D from "../components/TraitSpace2D";
import ArchetypeProfileChart from "../components/ArchetypeProfileChart";

function ArchetypeCard({ data, profile, isOpen, onClick, cardRef }) {
  return (
    <div ref={cardRef} className="rounded-lg border border-blur-border/20 bg-blur-surface/10 overflow-hidden">
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
              {profile && (
                <ArchetypeProfileChart profile={profile} dimensions={DIM_CONFIG} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Archetypes({ onBack }) {
  const [openArchetype, setOpenArchetype] = useState(null);
  const [spaceSize, setSpaceSize] = useState(280);
  const spaceRef = useRef(null);
  const cardRefs = useRef({});

  useEffect(() => {
    const el = spaceRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      setSpaceSize(Math.max(200, Math.min(w, 380)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSpaceClick = useCallback((key) => {
    setOpenArchetype(key);
    setTimeout(() => {
      cardRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  const zeroVector = {};
  const defaultPair = DIMENSION_PAIRS[0];

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

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col min-h-[100svh]">
        <header className="flex-shrink-0 flex items-center justify-between px-6 md:px-10 py-5 border-b border-blur-border/20">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-blur-surface-hover transition-colors cursor-pointer"
            aria-label="返回"
          >
            <ArrowLeft size={16} className="text-blur-text-muted" />
          </button>
          <h1 className="text-sm md:text-base font-medium tracking-widest text-blur-text">
            九种模糊的原型
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
              Blur 将人格划分为九种原型。它们不是分类，而是透镜——透过不同的模糊方式，你看到的是不同的自己。
            </p>

            <div className="flex flex-col items-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="glass rounded-2xl p-2 sm:p-3 w-full"
              >
                <div ref={spaceRef} className="w-full flex justify-center">
                  <TraitSpace2D
                    userVector={zeroVector}
                    xKey={defaultPair.xKey}
                    yKey={defaultPair.yKey}
                    width={spaceSize}
                    height={spaceSize}
                    showUser={false}
                    onClickArchetype={handleSpaceClick}
                  />
                </div>
              </motion.div>
              <p className="text-[10px] text-blur-text-light/40 mt-2 tracking-wide">
                点击坐标查看原型详情
              </p>
            </div>

            <div className="space-y-2">
              {Object.entries(archetypeDescriptions).map(([key, data]) => (
                <ArchetypeCard
                  key={key}
                  data={data}
                  profile={ARCHETYPE_PROFILES[key]}
                  isOpen={openArchetype === key}
                  onClick={() =>
                    setOpenArchetype(openArchetype === key ? null : key)
                  }
                  cardRef={(el) => { cardRefs.current[key] = el; }}
                />
              ))}
            </div>

            <div className="h-16" />
          </div>
        </main>
      </div>
    </div>
  );
}
