import { useRef, useEffect } from "react";
import { ARCHETYPE_VECTORS, VECTOR_AXES, mapTo3D } from "../utils/blurEngine";
import { DIMENSIONS } from "../data/questions";

const AXES = VECTOR_AXES;

const ARCHETYPES = ARCHETYPE_VECTORS;

const TRAIT_DIM_MAP = {};
for (const [dimKey, dim] of Object.entries(DIMENSIONS)) {
  for (const trait of dim.traits) {
    TRAIT_DIM_MAP[trait] = dimKey;
  }
}

function rgba(rgb, a) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

function rotateY(p, a) {
  const c = Math.cos(a),
    s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}

function rotateX(p, a) {
  const c = Math.cos(a),
    s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
}

function project3D(p, cx, cy, fov) {
  const d = fov + p[2];
  const s = d > 0.1 ? fov / d : fov / 0.1;
  return { x: cx + p[0] * s, y: cy - p[1] * s, s, z: p[2] };
}

function drawWireframe(ctx, toScreen) {
  const corners = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const sc = corners.map(toScreen);
  ctx.strokeStyle = "rgba(200,195,190,0.1)";
  ctx.lineWidth = 0.5;
  edges.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(sc[a].x, sc[a].y);
    ctx.lineTo(sc[b].x, sc[b].y);
    ctx.stroke();
  });

  const gridAlpha = 0.06;
  const gridValues = [-0.5, 0, 0.5];
  gridValues.forEach((v) => {
    const lines = [
      [[-1, -1, v], [1, -1, v]],
      [[v, -1, -1], [v, -1, 1]],
      [[-1, -1, v], [-1, 1, v]],
      [[-1, v, -1], [-1, v, 1]],
      [[v, -1, -1], [v, 1, -1]],
      [[-1, v, -1], [1, v, -1]],
    ];
    ctx.strokeStyle = `rgba(200,195,190,${gridAlpha})`;
    ctx.lineWidth = 0.4;
    lines.forEach(([from, to]) => {
      const p1 = toScreen(from);
      const p2 = toScreen(to);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
  });
}

function drawAxes(ctx, toScreen) {
  const axisLines = [
    { from: [-1, 0, 0], to: [1, 0, 0], color: AXES[0].color },
    { from: [0, -1, 0], to: [0, 1, 0], color: AXES[1].color },
    { from: [0, 0, -1], to: [0, 0, 1], color: AXES[2].color },
  ];

  axisLines.forEach((axis) => {
    const s = toScreen(axis.from);
    const e = toScreen(axis.to);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.strokeStyle = rgba(axis.color, 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

function drawArchetypeVector(ctx, origin, end, color, label, isClosest, t) {
  const lineAlpha = isClosest ? 0.45 : 0.12;
  const dotAlpha = isClosest ? 0.7 : 0.35;
  const dotSize = isClosest ? 4.5 : 2.5;

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = rgba(color, lineAlpha);
  ctx.lineWidth = isClosest ? 1.5 : 0.8;
  ctx.stroke();

  if (isClosest) {
    const pulse = 0.6 + Math.sin(t * 0.025) * 0.4;
    const glow = ctx.createRadialGradient(end.x, end.y, 0, end.x, end.y, 14);
    glow.addColorStop(0, rgba(color, 0.3 * pulse));
    glow.addColorStop(1, rgba(color, 0));
    ctx.beginPath();
    ctx.arc(end.x, end.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(end.x, end.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(color, 0.2 * pulse);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(end.x, end.y, dotSize, 0, Math.PI * 2);
  ctx.fillStyle = rgba(color, dotAlpha);
  ctx.fill();

  ctx.fillStyle = rgba(color, isClosest ? 0.9 : 0.5);
  ctx.font = `${isClosest ? 11 : 9}px system-ui,-apple-system,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, end.x, end.y - (isClosest ? 11 : 7));
}

function drawTraitDot(ctx, screen, color, size, opacity, label, isTop, t) {
  const pulse = 0.7 + Math.sin(t * 0.02 + size * 10) * 0.3;
  const r = Math.max(0.8, size * screen.s);

  if (isTop) {
    const glow = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, r * 5);
    glow.addColorStop(0, rgba(color, opacity * 0.15 * pulse));
    glow.addColorStop(1, rgba(color, 0));
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, r * 5, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
  ctx.fillStyle = rgba(color, opacity * pulse);
  ctx.fill();

  if (isTop) {
    ctx.fillStyle = rgba(color, 0.75);
    ctx.font = "8px system-ui,-apple-system,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(label, screen.x, screen.y - r - 4);
  }
}

function drawTestSubject(ctx, screen, origin, t) {
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(screen.x, screen.y);
  ctx.strokeStyle = "rgba(74,69,64,0.3)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  const pulse = 0.75 + Math.sin(t * 0.03) * 0.25;
  const glow = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, 18);
  glow.addColorStop(0, `rgba(74,69,64,${0.18 * pulse})`);
  glow.addColorStop(0.5, `rgba(155,142,199,${0.1 * pulse})`);
  glow.addColorStop(1, "rgba(155,142,199,0)");
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 18, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  const ds = 5.5;
  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y - ds);
  ctx.lineTo(screen.x + ds, screen.y);
  ctx.lineTo(screen.x, screen.y + ds);
  ctx.lineTo(screen.x - ds, screen.y);
  ctx.closePath();
  ctx.fillStyle = `rgba(74,69,64,${0.65 * pulse})`;
  ctx.fill();
  ctx.strokeStyle = "rgba(155,142,199,0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = `rgba(74,69,64,${0.85 * pulse})`;
  ctx.font = "bold 11px system-ui,-apple-system,sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("你", screen.x, screen.y - 10);
}

function drawClosestLine(ctx, testScreen, closestScreen, color, t) {
  const pulse = 0.4 + Math.sin(t * 0.02) * 0.3;
  ctx.beginPath();
  ctx.moveTo(testScreen.x, testScreen.y);
  ctx.lineTo(closestScreen.x, closestScreen.y);
  ctx.strokeStyle = rgba(color, 0.2 * pulse);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

export default function VectorSpace3D({ dimensionScores, archetypeKey, scoredTraits, width = 280, height = 280 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const rotRef = useRef({ theta: 0.65, phi: 0.35 });
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const autoRef = useRef(true);
  const autoTimerRef = useRef(null);
  const traitDotsRef = useRef([]);
  const progressRef = useRef(0);
  const dataRef = useRef({});

  useEffect(() => {
    dataRef.current.scores = dimensionScores;
    dataRef.current.archetypeKey = archetypeKey;
    dataRef.current.scoredTraits = scoredTraits;
  });

  useEffect(() => {
    if (!scoredTraits || scoredTraits.length === 0) {
      traitDotsRef.current = [];
      return;
    }
    const maxScore = scoredTraits[0].score;
    traitDotsRef.current = scoredTraits.map((st, i) => {
      const dimKey = TRAIT_DIM_MAP[st.trait];
      const protoPos = dimKey ? ARCHETYPES[dimKey].pos : [0, 0, 0];
      const color = dimKey ? ARCHETYPES[dimKey].color : [180, 180, 180];
      const normScore = maxScore > 0 ? st.score / maxScore : 0;
      const scale = 0.12 + normScore * 0.88;
      return {
        pos: [protoPos[0] * scale, protoPos[1] * scale, protoPos[2] * scale],
        color,
        size: 1.8 + normScore * 2.8,
        opacity: 0.35 + normScore * 0.45,
        label: st.text,
        isTop: i < 3,
      };
    });
  }, [scoredTraits]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const fov = 350;
    const spaceScale = 115;

    const toScreen = (pos, progress = 1) => {
      const centered = [
        pos[0] * progress * spaceScale / 2,
        pos[1] * progress * spaceScale / 2,
        pos[2] * progress * spaceScale / 2,
      ];
      const r1 = rotateY(centered, rotRef.current.theta);
      const r2 = rotateX(r1, rotRef.current.phi);
      return project3D(r2, cx, cy, fov);
    };

    const onDown = (e) => {
      e.preventDefault();
      dragRef.current = { active: true, x: e.clientX, y: e.clientY };
      autoRef.current = false;
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      canvas.style.cursor = "grabbing";
    };

    const onMove = (e) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      rotRef.current.theta += dx * 0.007;
      rotRef.current.phi = Math.max(-1.1, Math.min(1.1, rotRef.current.phi + dy * 0.007));
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
    };

    const onUp = () => {
      dragRef.current.active = false;
      canvas.style.cursor = "grab";
      autoTimerRef.current = setTimeout(() => {
        autoRef.current = true;
      }, 3000);
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const draw = () => {
      timeRef.current += 1;
      const t = timeRef.current;

      if (autoRef.current) {
        rotRef.current.theta += 0.002;
      }

      if (progressRef.current < 1) {
        progressRef.current = Math.min(1, progressRef.current + 0.018);
      }
      const progress = progressRef.current;
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const scores = dataRef.current.scores;
      const aKey = dataRef.current.archetypeKey;
      const testPos = mapTo3D(scores);

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.48);
      bg.addColorStop(0, "rgba(245,243,240,0.5)");
      bg.addColorStop(0.7, "rgba(245,243,240,0.12)");
      bg.addColorStop(1, "rgba(245,243,240,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      drawWireframe(ctx, (pos) => toScreen(pos, easedProgress));
      drawAxes(ctx, (pos) => toScreen(pos, easedProgress));

      const origin = toScreen([0, 0, 0], easedProgress);

      const drawItems = [];

      Object.entries(ARCHETYPES).forEach(([key, arch]) => {
        const end = toScreen(arch.pos, easedProgress);
        drawItems.push({
          type: "arch",
          z: end.z,
          key,
          end,
          color: arch.color,
          label: arch.label,
          isClosest: key === aKey,
        });
      });

      if (traitDotsRef.current) {
        traitDotsRef.current.forEach((dot) => {
          const screen = toScreen(dot.pos, easedProgress);
          drawItems.push({
            type: "trait",
            z: screen.z,
            screen,
            color: dot.color,
            size: dot.size,
            opacity: dot.opacity,
            label: dot.label,
            isTop: dot.isTop,
          });
        });
      }

      const testScreen = toScreen(testPos, easedProgress);
      drawItems.push({
        type: "test",
        z: testScreen.z - 0.01,
        screen: testScreen,
      });

      drawItems.sort((a, b) => b.z - a.z);

      drawItems.forEach((item) => {
        if (item.type === "arch") {
          drawArchetypeVector(ctx, origin, item.end, item.color, item.label, item.isClosest, t);
        } else if (item.type === "trait") {
          drawTraitDot(ctx, item.screen, item.color, item.size, item.opacity, item.label, item.isTop, t);
        } else if (item.type === "test") {
          drawTestSubject(ctx, item.screen, origin, t);
        }
      });

      const activeArch = ARCHETYPES[aKey];
      if (activeArch) {
        const activeScreen = toScreen(activeArch.pos, easedProgress);
        drawClosestLine(ctx, testScreen, activeScreen, activeArch.color, t);
      }

      ctx.fillStyle = "rgba(181,173,163,0.5)";
      ctx.font = "9px system-ui,-apple-system,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("拖拽旋转", cx, height - 6);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px`, cursor: "grab", touchAction: "none" }}
    />
  );
}
