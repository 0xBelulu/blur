import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { archetypeDescriptions } from "../data/tags";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles";
import { DIMENSIONS as DIM_CONFIG } from "../data/dimensions";
import { DIMENSION_PAIRS } from "../utils/blurEngine";
import TraitSpace2D from "../components/TraitSpace2D";
import ArchetypeProfileChart from "../components/ArchetypeProfileChart";
import CatalogShell from "../components/CatalogShell";
import AccordionCard from "../components/AccordionCard";

function ArchetypeSummary({ data }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base select-none">{data.symbol}</span>
      <div>
        <div className="text-sm font-medium text-blur-text">{data.title}</div>
        <div className="text-xs text-blur-text-muted">{data.subtitle}</div>
      </div>
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
    <CatalogShell
      title="十种模糊的原型"
      intro="毛玻璃将人格划分为十种原型。它们不是分类，而是透镜——透过不同的模糊方式，你看到的是不同的自己。"
      onBack={onBack}
    >
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
        {Object.entries(archetypeDescriptions).map(([key, data]) => {
          const isOpen = openArchetype === key;
          return (
            <AccordionCard
              key={key}
              cardRef={(el) => { cardRefs.current[key] = el; }}
              isOpen={isOpen}
              onToggle={() => setOpenArchetype(isOpen ? null : key)}
              summary={<ArchetypeSummary data={data} />}
              bodyClassName="space-y-3 text-sm text-blur-text-muted leading-relaxed"
            >
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
              {ARCHETYPE_PROFILES[key] && (
                <ArchetypeProfileChart profile={ARCHETYPE_PROFILES[key]} dimensions={DIM_CONFIG} />
              )}
            </AccordionCard>
          );
        })}
      </div>
    </CatalogShell>
  );
}
