import StaticVectorSpace from "./StaticVectorSpace";

const CARD_WIDTH = 750;

const DIM_CONFIG = {
  mist: { label: "雾", color: "#b4b9c3" },
  chime: { label: "风铃", color: "#c3af9b" },
  drift: { label: "漂流者", color: "#9bb4c3" },
  still: { label: "静观者", color: "#9ba5b9" },
  rainbow: { label: "虹", color: "#b9a5c3" },
};

const RADAR_CX = 100;
const RADAR_CY = 100;
const RADAR_MAX_R = 65;
const RADAR_NUM = 5;
const RADAR_GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

function getRadarPoint(index, radius) {
  const angle = (Math.PI * 2 * index) / RADAR_NUM - Math.PI / 2;
  return {
    x: RADAR_CX + Math.cos(angle) * radius,
    y: RADAR_CY + Math.sin(angle) * radius,
  };
}

function RadarChart({ dimensionScores }) {
  const dimKeys = Object.keys(dimensionScores);
  const dimValues = dimKeys.map((k) => dimensionScores[k].score);
  const dimNames = dimKeys.map((k) => dimensionScores[k].name);

  const dataPoints = dimKeys.map((_, i) => {
    const r = RADAR_MAX_R * Math.max(0.08, dimValues[i]);
    return getRadarPoint(i, r);
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gridPolygons = RADAR_GRID_LEVELS.map((level) => {
    const pts = Array.from({ length: RADAR_NUM }, (_, i) => {
      const p = getRadarPoint(i, RADAR_MAX_R * level);
      return `${p.x},${p.y}`;
    }).join(" ");
    return pts;
  });

  const axisLines = Array.from({ length: RADAR_NUM }, (_, i) => {
    const p = getRadarPoint(i, RADAR_MAX_R);
    return { x1: RADAR_CX, y1: RADAR_CY, x2: p.x, y2: p.y };
  });

  const labelPositions = dimNames.map((_, i) => {
    const p = getRadarPoint(i, RADAR_MAX_R + 18);
    const anchor = p.x < RADAR_CX ? "end" : p.x > RADAR_CX ? "start" : "middle";
    const dy = p.y < RADAR_CY ? -4 : p.y > RADAR_CY ? 8 : 0;
    return { ...p, anchor, dy, name: dimNames[i] };
  });

  const valuePositions = dimValues.map((val, i) => {
    const p = getRadarPoint(i, RADAR_MAX_R + 18);
    const anchor = p.x < RADAR_CX ? "end" : p.x > RADAR_CX ? "start" : "middle";
    const dy = p.y < RADAR_CY ? 8 : p.y > RADAR_CY ? 18 : 12;
    return { ...p, anchor, dy, value: Math.round(val * 100) };
  });

  return (
    <svg viewBox="0 0 200 200" width="200" height="200" style={{ overflow: "visible" }}>
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(200,195,190,0.25)" strokeWidth={0.8} />
      ))}
      {axisLines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(200,195,190,0.2)" strokeWidth={0.6} />
      ))}
      <polygon
        points={dataPolygon}
        fill="rgba(155,142,199,0.15)"
        stroke="rgba(155,142,199,0.6)"
        strokeWidth={1.5}
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="rgba(155,142,199,0.9)" />
      ))}
      {labelPositions.map((lp, i) => (
        <text key={`l-${i}`} x={lp.x} y={lp.y + lp.dy} textAnchor={lp.anchor} fill="#8a8378" fontSize={10} fontFamily="system-ui,-apple-system,sans-serif">
          {lp.name}
        </text>
      ))}
      {valuePositions.map((vp, i) => (
        <text key={`v-${i}`} x={vp.x} y={vp.y + vp.dy} textAnchor={vp.anchor} fill="#b5ada3" fontSize={8} fontFamily="system-ui,-apple-system,sans-serif">
          {vp.value}%
        </text>
      ))}
    </svg>
  );
}

export default function ResultCard({ result }) {
  const { archetype, archetypeKey, secondaryArchetype, tagDetails, scoredTraits, dimensionScores, suppressedTraits } = result;
  const narrative = archetype.narrative;

  const vectorSize = 240;

  return (
    <div
      style={{
        width: CARD_WIDTH,
        background: "#f5f3f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#4a4540",
        padding: "40px 36px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <span style={{ fontSize: "36px" }}>{archetype.symbol}</span>
        <div style={{ fontSize: "10px", color: "#b5ada3", letterSpacing: "0.25em", textTransform: "uppercase", marginTop: "6px" }}>
          Blur 人格原型
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "24px", fontWeight: 500, letterSpacing: "-0.02em" }}>
          {archetype.title}
        </span>
      </div>

      <div style={{ textAlign: "center", marginBottom: secondaryArchetype ? "4px" : "20px" }}>
        <span style={{ fontSize: "13px", color: "#8a8378" }}>{archetype.subtitle}</span>
      </div>

      {secondaryArchetype && (
        <div style={{ textAlign: "center", marginBottom: "20px", fontSize: "12px", color: "#b5ada3" }}>
          <span>兼具 </span>
          <span style={{ color: "#9b8ec7" }}>{secondaryArchetype.symbol} {secondaryArchetype.title}</span>
          <span> 特质</span>
        </div>
      )}

      {/* Vector Space */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
        <div style={{
          borderRadius: "16px",
          background: "rgba(255,255,255,0.45)",
          border: "1px solid rgba(200,195,190,0.35)",
          padding: "16px",
          boxShadow: "0 4px 20px rgba(74,69,64,0.06)",
        }}>
          <StaticVectorSpace
            dimensionScores={dimensionScores}
            archetypeKey={archetypeKey}
            scoredTraits={scoredTraits}
            size={vectorSize}
          />
        </div>
      </div>

      {/* Dimension Meters - compact row */}
      <div style={{
        borderRadius: "14px",
        background: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(200,195,190,0.35)",
        padding: "16px 20px",
        marginBottom: "24px",
      }}>
        <div style={{ fontSize: "10px", color: "#b5ada3", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px", textAlign: "center" }}>
          维度强度
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {Object.entries(dimensionScores).map(([key, dim]) => {
            const cfg = DIM_CONFIG[key] || { label: dim.name, color: "#b5ada3" };
            const entries = Object.entries(dimensionScores);
            const maxScore = Math.max(...entries.map(([, d]) => d.score), 0.01);
            const pct = Math.max(4, (dim.score / maxScore) * 100);
            return (
              <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: cfg.color }} />
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "#4a4540" }}>{cfg.label}</span>
                </div>
                <div style={{ width: "100%", height: "5px", borderRadius: "3px", background: "rgba(200,195,190,0.3)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: "3px", background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}70)` }} />
                </div>
                <span style={{ fontSize: "10px", color: "#b5ada3" }}>{Math.round(dim.score * 100)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div style={{
        borderRadius: "14px",
        background: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(200,195,190,0.35)",
        padding: "16px 20px",
        marginBottom: "24px",
      }}>
        <div style={{ fontSize: "10px", color: "#b5ada3", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "10px" }}>
          特质标签
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {tagDetails.map((tag) => (
            <span
              key={tag.trait}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 11px",
                borderRadius: "999px",
                fontSize: "11px",
                color: "#4a4540",
                background: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(200,195,190,0.4)",
              }}
            >
              {tag.text}
            </span>
          ))}
        </div>
      </div>

      {/* Data Section: Radar + Traits */}
      <div style={{
        borderRadius: "14px",
        background: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(200,195,190,0.35)",
        padding: "18px 20px",
        marginBottom: "20px",
      }}>
        <div style={{ fontSize: "10px", color: "#b5ada3", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "14px" }}>
          数据分析
        </div>
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ flexShrink: 0 }}>
            <RadarChart dimensionScores={dimensionScores} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "10px", color: "#b5ada3", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
              特质分布
            </div>
            {scoredTraits.slice(0, 8).map((trait) => {
              const maxScore = scoredTraits[0].score;
              const pct = Math.max(5, (trait.score / maxScore) * 100);
              return (
                <div key={trait.trait} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                  <span style={{ fontSize: "11px", color: "#8a8378", width: "60px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {trait.text}
                  </span>
                  <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "rgba(200,195,190,0.25)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: "3px", background: "linear-gradient(90deg, rgba(155,142,199,0.7), rgba(143,181,196,0.7))" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {suppressedTraits && suppressedTraits.length > 0 && (
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(200,195,190,0.3)" }}>
            <div style={{ fontSize: "10px", color: "#b5ada3", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
              你的另一面
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {suppressedTraits.slice(0, 2).map((trait) => (
                <span
                  key={trait.trait}
                  style={{
                    fontSize: "11px",
                    padding: "4px 11px",
                    borderRadius: "999px",
                    border: "1px solid rgba(200,195,190,0.4)",
                    color: "#8a8378",
                    background: "rgba(255,255,255,0.3)",
                  }}
                >
                  {trait.text}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Narrative */}
      <div style={{
        borderRadius: "14px",
        background: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(200,195,190,0.35)",
        padding: "18px 20px",
        marginBottom: "20px",
      }}>
        <div style={{ fontSize: "10px", color: "#b5ada3", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "14px" }}>
          叙事
        </div>

        <NarrativeBlock
          title="你的内在世界"
          content={narrative.innerWorld}
          accent="rgba(155, 142, 199, 0.3)"
        />
        <NarrativeBlock
          title="你在关系中"
          content={narrative.inRelation}
          accent="rgba(143, 181, 196, 0.3)"
        />
        <NarrativeBlock
          title="你的隐藏面"
          content={narrative.hiddenSide}
          accent="rgba(196, 165, 137, 0.3)"
        />
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", paddingTop: "16px", borderTop: "1px solid rgba(200,195,190,0.3)" }}>
        <span style={{ fontSize: "10px", color: "#b5ada3", letterSpacing: "0.15em" }}>
          BLUR — 基本看不清的人格测试
        </span>
      </div>
    </div>
  );
}

function NarrativeBlock({ title, content, accent }) {
  return (
    <div style={{
      marginBottom: "12px",
      padding: "12px 14px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.55)",
      border: "1px solid rgba(200,195,190,0.3)",
    }}>
      <div style={{ fontSize: "12px", fontWeight: 500, color: "#4a4540", marginBottom: "6px", paddingBottom: "6px", borderBottom: `1px solid ${accent}` }}>
        {title}
      </div>
      <div style={{ fontSize: "11px", color: "#8a8378", lineHeight: "1.75" }}>
        {content}
      </div>
    </div>
  );
}
