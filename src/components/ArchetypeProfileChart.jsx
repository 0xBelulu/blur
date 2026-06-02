import { useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

function rgba(rgb, a) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

const CX = 80;
const CY = 80;
const MAX_R = 55;
const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

function getRadarPoint(index, radius, num) {
  const angle = (Math.PI * 2 * index) / num - Math.PI / 2;
  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius,
  };
}

function getGridPolygon(radius, num) {
  return Array.from({ length: num }, (_, i) => {
    const p = getRadarPoint(i, radius, num);
    return `${p.x},${p.y}`;
  }).join(" ");
}

function DivergingBar({ name, value, negative, positive, color, suppressed, onHover, onLeave }) {
  const absValue = Math.abs(value);
  const isPositive = value >= 0;
  const barRgb = isPositive ? color : color.map((c) => Math.round(c * 0.6));
  const barAlpha = isPositive ? 0.75 : 0.35;

  return (
    <div
      className="flex items-center gap-1 sm:gap-1.5 group cursor-default"
      onMouseEnter={() => onHover?.(name)}
      onMouseLeave={() => onLeave?.()}
    >
      <span className="w-[52px] sm:w-[72px] text-[10px] text-blur-text shrink-0 text-right select-none">
        {name}
      </span>

      <span className="hidden sm:inline w-[44px] text-[9px] text-blur-text-light/60 shrink-0 text-right leading-tight select-none">
        {negative}
      </span>

      <div className="flex-1 relative h-2 flex rounded-full overflow-hidden">
        <div className="w-1/2 flex justify-end items-center">
          {!isPositive && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${absValue * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-l-full"
              style={{ background: rgba(barRgb, barAlpha) }}
            />
          )}
        </div>
        <div className="w-px bg-blur-border/30 shrink-0" />
        <div className="w-1/2 flex items-center">
          {isPositive && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${absValue * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-r-full"
              style={{ background: rgba(barRgb, barAlpha) }}
            />
          )}
        </div>
      </div>

      <span className="hidden sm:inline w-[44px] text-[9px] text-blur-text-light/60 shrink-0 text-left leading-tight select-none">
        {positive}
      </span>

      <span className={`w-8 text-[10px] tabular-nums shrink-0 text-right select-none ${isPositive ? "text-blur-accent" : "text-blur-text-light/70"}`}>
        {isPositive ? "+" : ""}{value.toFixed(1)}
      </span>

      {suppressed && (
        <span className="hidden sm:inline text-[9px] text-blur-text-light/30 shrink-0" title="抑制维度">
          ·
        </span>
      )}
    </div>
  );
}

function CompactRadar({ profile, dimensions, dimKeys, color }) {
  const num = dimKeys.length;
  const dataPoints = dimKeys.map((_, i) => {
    const v = profile.vector[dimKeys[i]] || 0;
    const r = MAX_R * Math.max(0.05, Math.abs(v));
    return getRadarPoint(i, r, num);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 160 160" className="w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] shrink-0" style={{ overflow: "visible" }}>
      {GRID_LEVELS.map((level, li) => (
        <polygon
          key={li}
          points={getGridPolygon(MAX_R * level, num)}
          fill="none"
          stroke="rgba(200, 195, 190, 0.18)"
          strokeWidth={0.6}
        />
      ))}
      {Array.from({ length: num }, (_, i) => {
        const p = getRadarPoint(i, MAX_R, num);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke="rgba(200, 195, 190, 0.15)"
            strokeWidth={0.5}
          />
        );
      })}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        points={dataPolygon}
        fill={rgba(color, 0.15)}
        stroke={rgba(color, 0.6)}
        strokeWidth={1.2}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      />
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          initial={{ opacity: 0, r: 0 }}
          animate={{ opacity: 1, r: 2 }}
          transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
          cx={p.x}
          cy={p.y}
          fill={rgba(color, 0.8)}
        />
      ))}
      {dimKeys.map((key, i) => {
        const dim = dimensions[key];
        const lp = getRadarPoint(i, MAX_R + 18, num);
        const anchor = lp.x < CX ? "end" : lp.x > CX ? "start" : "middle";
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y + 3}
            textAnchor={anchor}
            fill="rgba(140,132,122,0.6)"
            fontSize={8}
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {dim.name}
          </text>
        );
      })}
    </svg>
  );
}

export default function ArchetypeProfileChart({ profile, dimensions }) {
  const [hoveredDim, setHoveredDim] = useState(null);
  const dimKeys = Object.keys(dimensions);
  const suppressed = new Set(profile.suppressedDimensions || []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="pt-4 mt-4 border-t border-blur-border/15"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-blur-text-light tracking-[0.12em] uppercase">
          典型维度分布
        </p>
        {hoveredDim && (
          <span className="hidden sm:flex text-[10px] text-blur-accent/80 items-center gap-1">
            <Info size={10} />
            {hoveredDim}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5">
        <div className="flex-1 w-full space-y-1.5">
          {dimKeys.map((key) => {
            const dim = dimensions[key];
            const value = profile.vector[key] || 0;
            return (
              <DivergingBar
                key={key}
                name={dim.name}
                value={value}
                negative={dim.negative}
                positive={dim.positive}
                color={profile.color}
                suppressed={suppressed.has(key)}
                onHover={setHoveredDim}
                onLeave={() => setHoveredDim(null)}
              />
            );
          })}
        </div>

        <div className="mx-auto sm:mx-0 sm:mt-1">
          <CompactRadar
            profile={profile}
            dimensions={dimensions}
            dimKeys={dimKeys}
            color={profile.color}
          />
        </div>
      </div>

      {suppressed.size > 0 && (
        <p className="text-[10px] text-blur-text-light/40 mt-3">
          · 标记为抑制维度 — 该原型在这些维度上典型表现为低值
        </p>
      )}
    </motion.div>
  );
}
