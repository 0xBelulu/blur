import { useRef, useEffect } from "react";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles.js";
import { DIMENSIONS } from "../data/dimensions.js";

function rgba(rgb, a) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

const THROTTLE_IDLE = 4;

export default function TraitSpace2D({
  userVector,
  xKey,
  yKey,
  width = 360,
  height = 360,
  onHoverArchetype,
  showUser = true,
  onClickArchetype,
  participants = [],
  userLabel = "你",
  showArchetypes = true,
  showArchetypeLabels = true,
  userColor = [74, 69, 64],
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startRef = useRef(0);
  const hoveredRef = useRef(null);
  const onHoverRef = useRef(onHoverArchetype);
  const onClickRef = useRef(onClickArchetype);
  const userVectorRef = useRef(userVector);
  const showUserRef = useRef(showUser);
  const participantsRef = useRef(participants);
  const userLabelRef = useRef(userLabel);
  const userColorRef = useRef(userColor);
  const labelsRef = useRef(showArchetypeLabels);
  const frameCountRef = useRef(0);
  const idleRef = useRef(false);

  useEffect(() => {
    onHoverRef.current = onHoverArchetype;
  });

  useEffect(() => {
    onClickRef.current = onClickArchetype;
  });

  useEffect(() => {
    showUserRef.current = showUser;
  }, [showUser]);

  useEffect(() => {
    participantsRef.current = participants;
    userLabelRef.current = userLabel;
    userColorRef.current = userColor;
  }, [participants, userLabel, userColor]);

  useEffect(() => {
    userVectorRef.current = userVector;
  }, [userVector]);

  useEffect(() => {
    labelsRef.current = showArchetypeLabels;
  }, [showArchetypeLabels]);

  useEffect(() => {
    startRef.current = performance.now();
    hoveredRef.current = null;
    idleRef.current = false;
    frameCountRef.current = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const toScreen = (x, y, progress = 1) => {
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.32 * progress;
      return { x: cx + x * scale, y: cy - y * scale };
    };

    const archetypes = (showArchetypes ? Object.entries(ARCHETYPE_PROFILES) : []).map(([key, profile]) => ({
      key,
      label: profile.title,
      color: profile.color,
      x: profile.vector[xKey] || 0,
      y: profile.vector[yKey] || 0,
    }));

    const bgCx = width / 2;
    const bgCy = height / 2;
    const bgGrad = ctx.createRadialGradient(bgCx, bgCy, 20, bgCx, bgCy, width * 0.48);
    bgGrad.addColorStop(0, "rgba(240,238,234,0.7)");
    bgGrad.addColorStop(0.7, "rgba(240,238,234,0.25)");
    bgGrad.addColorStop(1, "rgba(240,238,234,0)");

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (width / rect.width);
      const my = (e.clientY - rect.top) * (height / rect.height);

      let closest = null;
      let closestDist = Infinity;

      archetypes.forEach((arch) => {
        const pos = toScreen(arch.x, arch.y, 1);
        const dist = Math.hypot(pos.x - mx, pos.y - my);
        if (dist < 22 && dist < closestDist) {
          closestDist = dist;
          closest = arch.key;
        }
      });

      const prev = hoveredRef.current;
      hoveredRef.current = closest;
      if (prev !== closest) {
        idleRef.current = false;
        frameCountRef.current = 0;
      }
      if (onHoverRef.current) onHoverRef.current(closest);
    };

    const handlePointerLeave = () => {
      hoveredRef.current = null;
      idleRef.current = false;
      frameCountRef.current = 0;
      if (onHoverRef.current) onHoverRef.current(null);
    };

    const handleClick = (e) => {
      if (!onClickRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (width / rect.width);
      const my = (e.clientY - rect.top) * (height / rect.height);

      let closest = null;
      let closestDist = Infinity;

      archetypes.forEach((arch) => {
        const pos = toScreen(arch.x, arch.y, 1);
        const dist = Math.hypot(pos.x - mx, pos.y - my);
        if (dist < 22 && dist < closestDist) {
          closestDist = dist;
          closest = arch.key;
        }
      });

      if (closest) onClickRef.current(closest);
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("click", handleClick);

    const draw = (timestamp) => {
      const elapsed = timestamp - startRef.current;
      const p = Math.min(1, elapsed / 700);
      const eased = 1 - Math.pow(1 - p, 3);

      if (p >= 1) {
        frameCountRef.current++;
        if (frameCountRef.current > 30 && !idleRef.current) {
          idleRef.current = true;
          frameCountRef.current = 0;
        }
        if (idleRef.current && frameCountRef.current % THROTTLE_IDLE !== 0) {
          animRef.current = requestAnimationFrame(draw);
          return;
        }
      }

      const uv = userVectorRef.current;
      const ux = uv?.[xKey] || 0;
      const uy = uv?.[yKey] || 0;

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

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

      const xInfo = DIMENSIONS[xKey];
      const yInfo = DIMENSIONS[yKey];
      const center = toScreen(0, 0, eased);
      ctx.font = "10px system-ui,-apple-system,sans-serif";
      ctx.fillStyle = "rgba(140,132,122,0.75)";

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(xInfo.negative, xStart.x - 10, xStart.y);
      ctx.textAlign = "left";
      ctx.fillText(xInfo.positive, xEnd.x + 10, xEnd.y);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(yInfo.negative, center.x - 8, yStart.y + 8);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(yInfo.positive, center.x - 8, yEnd.y - 8);

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

        if (!labelsRef.current && !isHover) return;
        ctx.font = `${isHover ? "bold " : ""}10px system-ui,-apple-system,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = rgba(arch.color, isHover ? 0.95 : 0.55);
        ctx.fillText(arch.label, pos.x, pos.y - size - 4);
      });

      const upos = toScreen(ux, uy, eased);
      const ownColor = userColorRef.current;

      participantsRef.current.forEach((participant) => {
        const color = participant.color || [92, 141, 159];
        const pos = toScreen(participant.vector[xKey] || 0, participant.vector[yKey] || 0, eased);
        ctx.beginPath();
        ctx.moveTo(upos.x, upos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = rgba(color, 0.4);
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = rgba(color, 0.15);
        ctx.fill();
        ctx.strokeStyle = rgba(color, 0.95);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = "bold 12px system-ui,-apple-system,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = rgba(color, 1);
        ctx.fillText(participant.label, pos.x, pos.y + 14, 100);
      });

      if (showUserRef.current) {
        const pulse = 0.75 + Math.sin(elapsed * 0.0018) * 0.25;

        const glow = ctx.createRadialGradient(upos.x, upos.y, 0, upos.x, upos.y, 24);
        glow.addColorStop(0, rgba(ownColor, 0.25 * pulse));
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
        ctx.fillStyle = rgba(ownColor, 0.9);
        ctx.fill();
        ctx.strokeStyle = "rgba(155,142,199,0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = rgba(ownColor, 1);
        ctx.font = "bold 12px system-ui,-apple-system,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(userLabelRef.current, upos.x, upos.y - ds - 6);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("click", handleClick);
    };
  }, [width, height, xKey, yKey, showArchetypes]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="人格坐标可视化"
      style={{
        width: `${width}px`,
        maxWidth: "100%",
        height: "auto",
        aspectRatio: "1 / 1",
        cursor: "default",
        touchAction: "pan-y",
      }}
    />
  );
}
