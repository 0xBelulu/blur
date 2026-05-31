import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const SHOW_COUNT = 5;

function rgba(rgb, a) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

export default function DimensionMeters({ similarities, activeKey }) {
  const [expanded, setExpanded] = useState(false);

  if (!similarities || similarities.length === 0) return null;

  const maxSim = Math.max(...similarities.map((s) => s.sim), 0.01);
  const displayItems = expanded ? similarities : similarities.slice(0, SHOW_COUNT);

  return (
    <div className="w-full">
      <div className="w-full space-y-2.5">
        {displayItems.map(({ key, sim, profile }, i) => {
      const pct = Math.max(4, (sim / maxSim) * 100);
      const isActive = activeKey === key;
      const displayPct = Math.round(((sim + 1) / 2) * 100);

      return (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-300 ${
            isActive ? "bg-white/40" : ""
          }`}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: rgba(profile.color, 0.12) }}
          >
            <span className="text-xs">{profile.symbol}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blur-text truncate">
                {profile.title}
              </span>
              <span className="text-[10px] text-blur-text-light tabular-nums ml-2">
                {displayPct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-blur-surface overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${rgba(profile.color, 0.9)}, ${rgba(profile.color, 0.5)})`,
                }}
              />
            </div>
          </div>
        </motion.div>
      );
        })}
      </div>

      {similarities.length > SHOW_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full mt-3 flex items-center justify-center gap-1 text-[11px] text-blur-text-light hover:text-blur-text transition-colors cursor-pointer py-1"
        >
          <span>{expanded ? "收起" : `展开全部 (${similarities.length})`}</span>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={12} />
          </motion.span>
        </button>
      )}
    </div>
  );
}
