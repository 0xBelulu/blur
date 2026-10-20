import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight, Sparkles } from "lucide-react";
import { resonanceScale } from "../utils/resonance";

const SHOW_COUNT = 5;

function rgba(rgb, a) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

export default function DimensionMeters({
  similarities,
  activeKey,
  selectedKey,
  onSelectArchetype,
}) {
  const [expandedList, setExpandedList] = useState(false);
  const [expandedItemKey, setExpandedItemKey] = useState(null);

  if (!similarities || similarities.length === 0) return null;

  const scale = resonanceScale(similarities);

  const displayItems = expandedList ? similarities : similarities.slice(0, SHOW_COUNT);

  const toggleItem = (key) => {
    setExpandedItemKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="w-full">
      <div className="w-full space-y-2">
        {displayItems.map(({ key, prob, profile }, i) => {
          const pct = scale(prob);
          const isActive = activeKey === key || selectedKey === key;
          const isItemExpanded = expandedItemKey === key;
          const displayPct = Math.round(pct);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                isActive
                  ? "bg-white/60 border-blur-accent/40 shadow-sm"
                  : "bg-white/20 border-transparent hover:bg-white/40"
              }`}
            >
              <div
                onClick={() => toggleItem(key)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer select-none"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: rgba(profile.color, 0.14) }}
                >
                  <span className="text-xs">{profile.symbol}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-medium text-blur-text truncate">
                        {profile.title}
                      </span>
                      {profile.roleBadge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blur-surface text-blur-text-light truncate max-w-[110px] hidden sm:inline">
                          {profile.roleBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-blur-text-light tabular-nums ml-2 font-medium">
                      {displayPct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-blur-surface overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.15 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${rgba(profile.color, 0.95)}, ${rgba(profile.color, 0.45)})`,
                      }}
                    />
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isItemExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-blur-text-light shrink-0"
                >
                  <ChevronDown size={14} />
                </motion.div>
              </div>

              {/* Accordion Content */}
              <AnimatePresence>
                {isItemExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-blur-border/30 px-3 pt-2 pb-3 bg-white/40"
                  >
                    <div className="text-xs text-blur-text-muted leading-relaxed space-y-2">
                      <div className="flex items-center gap-1.5 text-blur-text font-medium">
                        <Sparkles size={12} className="text-blur-accent" />
                        <span>{profile.title} · {profile.roleBadge}</span>
                      </div>
                      <p className="text-[11px] text-blur-text-muted">
                        {profile.roleSummary || profile.description}
                      </p>

                      <div className="pt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-blur-text-light">
                          光谱共振度: {displayPct}%
                        </span>
                        {onSelectArchetype && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectArchetype(key);
                            }}
                            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              selectedKey === key
                                ? "bg-blur-accent text-white"
                                : "glass hover:bg-white/80 text-blur-text"
                            }`}
                          >
                            <span>{selectedKey === key ? "当前视角" : "切换为主视角"}</span>
                            <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {similarities.length > SHOW_COUNT && (
        <button
          onClick={() => setExpandedList((v) => !v)}
          className="w-full mt-3 flex items-center justify-center gap-1 text-[11px] text-blur-text-light hover:text-blur-text transition-colors cursor-pointer py-1"
        >
          <span>{expandedList ? "收起" : `展开全部 (${similarities.length})`}</span>
          <motion.span animate={{ rotate: expandedList ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={12} />
          </motion.span>
        </button>
      )}
    </div>
  );
}
