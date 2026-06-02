import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { DIMENSIONS, tagPool } from "../data/tags";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles";
import TraitWeightChart from "../components/TraitWeightChart";

export default function Traits({ onBack }) {
  const [openTraitGroup, setOpenTraitGroup] = useState(null);

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
            七十余枚特质标签
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
              每种原型对应一组特质标签。它们像散落在各处的碎片，单独看是碎片，组合起来才是一幅完整的画面。
            </p>

            <div className="space-y-3">
              {Object.entries(DIMENSIONS).map(([key, dim]) => {
                const traitObjects = dim.traits
                  .map((traitKey) => {
                    const trait = tagPool[traitKey];
                    if (!trait) return null;
                    return {
                      key: traitKey,
                      text: trait.text,
                      weight: trait.weight,
                      detail: trait.detail,
                    };
                  })
                  .filter(Boolean);

                const profileColor = ARCHETYPE_PROFILES[key]?.color;

                return (
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
                          <div className="px-4 pb-4">
                            <div className="flex flex-wrap gap-2">
                              {traitObjects.map((trait) => (
                                <span
                                  key={trait.key}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs border border-blur-border/30 bg-blur-surface/20 text-blur-text-muted"
                                  title={trait.detail}
                                >
                                  {trait.text}
                                </span>
                              ))}
                            </div>
                            <TraitWeightChart traits={traitObjects} color={profileColor} />
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
