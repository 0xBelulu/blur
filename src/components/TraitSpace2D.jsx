import { useRef, useEffect, useCallback } from "react";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles.js";
import { DIMENSIONS } from "../data/dimensions.js";

function rgba(rgb, a) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

export default function TraitSpace2D({
  userVector,
  xKey,
  yKey,
  width = 360,
  height = 360,
  onHoverArchetype,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const progressRef = useRef(0);
  const hoveredRef = useRef(null);

  const toScreen = useCallback(
    (x, y, progress = 1) => {
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.32 * progress;
      return { x: cx + x * scale, y: cy - y * scale };
    },
    [width, height]
  );

  const archetypes = Object.entries(ARCHETYPE_PROFILES).map(([key, profile]) => ({
    key,
    label: profile.title,
    color: profile.color,
    x: profile.vector[xKey] || 0,
    y: profile.vector[yKey] || 0,
  }));

  const handlePointerMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (width / rect.width);
      const my = (e.clientY - rect.top) * (height / rect.height);

      let closest = null;
      let closestDist = Infinity;
      const eased = 1 - Math.pow(1 - progressRef.current, 3);

      archetypes.forEach((arch) => {
        const pos = toScreen(arch.x, arch.y, eased);
        const dist = Math.hypot(pos.x - mx, pos.y - my);
        if (dist < 22 && dist < closestDist) {
          closestDist = dist;
          closest = arch.key;
        }
      });

      hoveredRef.current = closest;
      if (onHoverArchetype) onHoverArchetype(closest);
    },
    [archetypes, toScreen, width, height, onHoverArchetype]
  );

  const handlePointerLeave = useCallback(() => {
    hoveredRef.current = null;
    if (onHoverArchetype) onHoverArchetype(null);
  }, [onHoverArchetype]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    const draw = () => {
      timeRef.current += 1;
      const t = timeRef.current;

      if (progressRef.current < 1) {
        progressRef.current = Math.min(1, progressRef.current + 0.025);
      }
      const p = progressRef.current;
      const eased = 1 - Math.pow(1 - p, 3);

      ctx.clearRect(0, 0, width, height);

      // radial background
      const cx = width / 2;
      const cy = height / 2;
      const bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.48);
      bg.addColorStop(0, "rgba(240,238,234,0.7)");
      bg.addColorStop(0.7, "rgba(240,238,234,0.25)");
      bg.addColorStop(1, "rgba(240,238,234,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // grid lines
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 0.8;
      const gridAlpha = 0.2;
      for (const v of [-0.5, 0, 0.5]) {
        const s1 = toScreen(v, -1, eased);
        const e1 = toScreen(v, 1, eased);
        ctx.strokeStyle = `rgba(160,155,148,${gridAlpha})`;
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(e1.x, e1.y);
        ctx.stroke();

        const s2 = toScreen(-1, v, eased);
        const e2 = toScreen(1, v, eased);
        ctx.beginPath();
        ctx.moveTo(s2.x, s2.y);
        ctx.lineTo(e2.x, e2.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // axes
      const xStart = toScreen(-1, 0, eased);
      const xEnd = toScreen(1, 0, eased);
      const yStart = toScreen(0, -1, eased);
      const yEnd = toScreen(0, 1, eased);

      ctx.beginPath();
      ctx.moveTo(xStart.x, xStart.y);
      ctx.lineTo(xEnd.x, xEnd.y);
      ctx.strokeStyle = "rgba(180,185,195,0.55)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(yStart.x, yStart.y);
      ctx.lineTo(yEnd.x, yEnd.y);
      ctx.strokeStyle = "rgba(195,175,155,0.55)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // axis arrows
      function drawArrow(from, to, color) {
        const dir = { x: to.x - from.x, y: to.y - from.y };
        const len = Math.hypot(dir.x, dir.y);
        if (len < 1) return;
        const nx = dir.x / len;
        const ny = dir.y / len;
        const ax = 5;
        const ay = 3.5;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - nx * ax - ny * ay, to.y - ny * ax + nx * ay);
        ctx.lineTo(to.x - nx * ax + ny * ay, to.y - ny * ax - nx * ay);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
      drawArrow(xStart, xEnd, "rgba(180,185,195,0.55)");
      drawArrow(yStart, yEnd, "rgba(195,175,155,0.55)");

      // axis labels
      const xInfo = DIMENSIONS[xKey];
      const yInfo = DIMENSIONS[yKey];
      ctx.font = "10px system-ui,-apple-system,sans-serif";
      ctx.fillStyle = "rgba(140,132,122,0.75)";

      // x negative
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(xInfo.negative, xStart.x - 10, xStart.y);
      // x positive
      ctx.textAlign = "left";
      ctx.fillText(xInfo.positive, xEnd.x + 10, xEnd.y);
      // y negative
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(yInfo.negative, xStart.x, yStart.y + 10);
      // y positive
      ctx.textBaseline = "bottom";
      ctx.fillText(yInfo.positive, xStart.x, yEnd.y - 10);

      // archetype dots
      const currentHover = hoveredRef.current;

      archetypes.forEach((arch) => {
        const pos = toScreen(arch.x, arch.y, eased);
        const isHover = currentHover === arch.key;
        const size = isHover ? 6 : 4.5;
        const alpha = isHover ? 1 : 0.7;

        if (isHover) {
          const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 18);
          glow.addColorStop(0, rgba(arch.color, 0.3));
          glow.addColorStop(1, rgba(arch.color, 0));
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = rgba(arch.color, alpha);
        ctx.fill();
        ctx.strokeStyle = rgba(arch.color, alpha * 0.5);
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // label
        ctx.font = `${isHover ? "bold " : ""}10px system-ui,-apple-system,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = rgba(arch.color, isHover ? 0.95 : 0.55);
        ctx.fillText(arch.label, pos.x, pos.y - size - 4);
      });

      // user point
      const ux = userVector?.[xKey] || 0;
      const uy = userVector?.[yKey] || 0;
      const upos = toScreen(ux, uy, eased);
      const pulse = 0.75 + Math.sin(t * 0.03) * 0.25;

      const glow = ctx.createRadialGradient(upos.x, upos.y, 0, upos.x, upos.y, 24);
      glow.addColorStop(0, `rgba(74,69,64,${0.25 * pulse})`);
      glow.addColorStop(0.4, `rgba(155,142,199,${0.18 * pulse})`);
      glow.addColorStop(1, "rgba(155,142,199,0)");
      ctx.beginPath();
      ctx.arc(upos.x, upos.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      const ds = 6.5 * pulse;
      ctx.beginPath();
      ctx.moveTo(upos.x, upos.y - ds);
      ctx.lineTo(upos.x + ds, upos.y);
      ctx.lineTo(upos.x, upos.y + ds);
      ctx.lineTo(upos.x - ds, upos.y);
      ctx.closePath();
      ctx.fillStyle = `rgba(74,69,64,${0.85})`;
      ctx.fill();
      ctx.strokeStyle = "rgba(155,142,199,0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = `rgba(74,69,64,${0.95 * pulse})`;
      ctx.font = "bold 12px system-ui,-apple-system,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("你", upos.x, upos.y - ds - 6);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [width, height, xKey, yKey, userVector, archetypes, toScreen, handlePointerMove, handlePointerLeave]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="人格坐标可视化"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: "default",
        touchAction: "none",
      }}
    />
  );
}
