import { motion } from "framer-motion";

const DIM_CONFIG = {
  mist: { label: "雾", color: "#b4b9c3", desc: "弥散 · 包容" },
  chime: { label: "风铃", color: "#c3af9b", desc: "锐利 · 穿透" },
  drift: { label: "漂流者", color: "#9bb4c3", desc: "流动 · 追寻" },
  still: { label: "静观者", color: "#9ba5b9", desc: "沉淀 · 内省" },
  rainbow: { label: "虹", color: "#b9a5c3", desc: "折射 · 多元" },
};

export default function DimensionMeters({ dimensionScores, activeKey }) {
  if (!dimensionScores) return null;

  const entries = Object.entries(dimensionScores);
  const maxScore = Math.max(...entries.map(([, d]) => d.score), 0.01);

  return (
    <div className="w-full space-y-2.5">
      {entries.map(([key, dim], i) => {
        const cfg = DIM_CONFIG[key] || { label: dim.name, color: "#b5ada3", desc: "" };
        const pct = Math.max(4, (dim.score / maxScore) * 100);
        const isActive = activeKey === key;

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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cfg.color}18` }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blur-text truncate">{cfg.label}</span>
                <span className="text-[10px] text-blur-text-light tabular-nums ml-2">
                  {Math.round(dim.score * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-blur-surface overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${cfg.color}90, ${cfg.color}50)`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
