import { motion } from "framer-motion";

const CX = 120;
const CY = 120;
const MAX_R = 80;
const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

function getPoint(index, radius, num) {
  const angle = (Math.PI * 2 * index) / num - Math.PI / 2;
  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius,
  };
}

function getPolygonPoints(radius, num) {
  return Array.from({ length: num }, (_, i) => {
    const p = getPoint(i, radius, num);
    return `${p.x},${p.y}`;
  }).join(" ");
}

function getLabelPosition(index, num) {
  const p = getPoint(index, MAX_R + 22, num);
  return p;
}

export default function TraitRadar({ dimensionScores }) {
  const dimKeys = Object.keys(dimensionScores);
  const num = dimKeys.length;
  const dimValues = dimKeys.map((k) => dimensionScores[k].score);
  const dimNames = dimKeys.map((k) => dimensionScores[k].name);

  const dataPoints = dimKeys.map((_, i) => {
    const r = MAX_R * Math.max(0.08, dimValues[i]);
    return getPoint(i, r, num);
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex justify-center">
      <svg
        viewBox="0 0 240 240"
        className="w-[240px] h-[240px]"
        style={{ overflow: "visible" }}
      >
        {GRID_LEVELS.map((level, li) => (
          <polygon
            key={li}
            points={getPolygonPoints(MAX_R * level, num)}
            fill="none"
            stroke="rgba(200, 195, 190, 0.25)"
            strokeWidth={0.8}
          />
        ))}

        {Array.from({ length: num }, (_, i) => {
          const p = getPoint(i, MAX_R, num);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke="rgba(200, 195, 190, 0.2)"
              strokeWidth={0.6}
            />
          );
        })}

        <motion.polygon
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          points={dataPolygon}
          fill="rgba(155, 142, 199, 0.15)"
          stroke="rgba(155, 142, 199, 0.6)"
          strokeWidth={1.5}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />

        {dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            initial={{ opacity: 0, r: 0 }}
            animate={{ opacity: 1, r: 3 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            cx={p.x}
            cy={p.y}
            fill="rgba(155, 142, 199, 0.9)"
          />
        ))}

        {dimNames.map((name, i) => {
          const lp = getLabelPosition(i, num);
          const anchor = lp.x < CX ? "end" : lp.x > CX ? "start" : "middle";
          const dy = lp.y < CY ? -4 : lp.y > CY ? 8 : 0;
          return (
            <text
              key={i}
              x={lp.x}
              y={lp.y + dy}
              textAnchor={anchor}
              fill="#8a8378"
              fontSize={9}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {name}
            </text>
          );
        })}

        {dimValues.map((val, i) => {
          const lp = getLabelPosition(i, num);
          const anchor = lp.x < CX ? "end" : lp.x > CX ? "start" : "middle";
          const dy = lp.y < CY ? 7 : lp.y > CY ? 16 : 10;
          return (
            <text
              key={`v-${i}`}
              x={lp.x}
              y={lp.y + dy}
              textAnchor={anchor}
              fill="#b5ada3"
              fontSize={8}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {Math.round(val * 100)}%
            </text>
          );
        })}
      </svg>
    </div>
  );
}
