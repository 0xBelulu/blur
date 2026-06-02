import { useState } from "react";
import { motion } from "framer-motion";

function rgba(rgb, a) {
  if (!rgb) return `rgba(155,142,199,${a})`;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

export default function TraitWeightChart({ traits, color }) {
  const [hoveredTrait, setHoveredTrait] = useState(null);

  if (!traits || traits.length === 0) return null;

  const sorted = [...traits].sort((a, b) => b.weight - a.weight);
  const maxWeight = sorted[0]?.weight || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35 }}
      className="pt-3 mt-1 border-t border-blur-border/10"
    >
      <p className="text-[10px] text-blur-text-light/50 tracking-[0.1em] uppercase mb-2">
        特质权重
      </p>
      <div className="space-y-1.5">
        {sorted.map((trait, i) => {
          const pct = Math.max(8, (trait.weight / maxWeight) * 100);
          const isHovered = hoveredTrait === trait.key;

          return (
            <div
              key={trait.key}
              className="flex items-center gap-2 group cursor-default"
              onMouseEnter={() => setHoveredTrait(trait.key)}
              onMouseLeave={() => setHoveredTrait(null)}
            >
              <span className={`w-[56px] text-[10px] shrink-0 text-right truncate transition-colors ${isHovered ? "text-blur-accent" : "text-blur-text-muted"}`}>
                {trait.text}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-blur-surface overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: i * 0.04, duration: 0.45, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: isHovered
                      ? rgba(color, 0.85)
                      : `linear-gradient(90deg, ${rgba(color, 0.7)}, ${rgba(color, 0.35)})`,
                  }}
                />
              </div>
              <span className="w-8 text-[10px] tabular-nums text-right text-blur-text-light/60">
                {trait.weight}
              </span>
            </div>
          );
        })}
      </div>
      {hoveredTrait && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-[10px] text-blur-text-light/50 mt-2 italic"
        >
          {sorted.find((t) => t.key === hoveredTrait)?.detail}
        </motion.p>
      )}
    </motion.div>
  );
}
