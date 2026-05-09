import { useRef, useEffect } from "react";
import { ARCHETYPE_VECTORS, VECTOR_AXES } from "../utils/blurEngine";

const AXES = VECTOR_AXES;

const ARCHETYPES = ARCHETYPE_VECTORS;

function rgba(rgb, a) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
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

function dist3(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function generateParticles() {
  const particles = [];
  let seed = 42;
  Object.entries(ARCHETYPES).forEach(([key, arch]) => {
    const count = 10;
    for (let i = 0; i < count; i++) {
      seed += 1;
      const spread = 0.18;
      particles.push({
        pos: [
          Math.max(0.02, Math.min(0.98, arch.pos[0] + (seededRandom(seed * 3) - 0.5) * spread * 2)),
          Math.max(0.02, Math.min(0.98, arch.pos[1] + (seededRandom(seed * 3 + 1) - 0.5) * spread * 2)),
          Math.max(0.02, Math.min(0.98, arch.pos[2] + (seededRandom(seed * 3 + 2) - 0.5) * spread * 2)),
        ],
        color: arch.color,
        size: 1.2 + seededRandom(seed * 3 + 3) * 2.2,
        opacity: 0.2 + seededRandom(seed * 3 + 4) * 0.35,
        phase: seededRandom(seed * 3 + 5) * Math.PI * 2,
        archetype: key,
      });
    }
  });
  return particles;
}

function drawWireframe(ctx, toScreen) {
  const corners = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
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
  for (let i = 1; i <= 3; i++) {
    const v = i * 0.25;
    const lines = [
      [[0, 0, v], [1, 0, v]],
      [[v, 0, 0], [v, 0, 1]],
      [[0, 0, v], [0, 1, v]],
      [[0, v, 0], [0, v, 1]],
      [[v, 0, 0], [v, 1, 0]],
      [[0, v, 0], [1, v, 0]],
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
  }
}

function drawAxes(ctx, toScreen) {
  const origin = toScreen([0, 0, 0]);
  const ends = [toScreen([1, 0, 0]), toScreen([0, 1, 0]), toScreen([0, 0, 1])];

  AXES.forEach((axis, i) => {
    const end = ends[i];
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = rgba(axis.color, 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();

    const dx = end.x - origin.x;
    const dy = end.y - origin.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      const ux = dx / len,
        uy = dy / len;
      const as = 5;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - ux * as - uy * as * 0.4, end.y - uy * as + ux * as * 0.4);
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - ux * as + uy * as * 0.4, end.y - uy * as - ux * as * 0.4);
      ctx.strokeStyle = rgba(axis.color, 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const lo = 16;
    const lx = end.x + (len > 1 ? (dx / len) * lo : 0);
    const ly = end.y + (len > 1 ? (dy / len) * lo : 0);
    ctx.fillStyle = rgba(axis.color, 0.65);
    ctx.font = "10px system-ui,-apple-system,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(axis.label, lx, ly);
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

function drawParticle(ctx, screen, color, size, opacity, phase, t) {
  const pulse = 0.65 + Math.sin(t * 0.015 + phase) * 0.35;
  const s = Math.max(0.5, size * screen.s);

  const glow = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, s * 3);
  glow.addColorStop(0, rgba(color, opacity * 0.2 * pulse));
  glow.addColorStop(1, rgba(color, 0));
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, s * 3, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(screen.x, screen.y, Math.max(0.6, s * 0.4), 0, Math.PI * 2);
  ctx.fillStyle = rgba(color, opacity * 0.7 * pulse);
  ctx.fill();
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

export default function VectorSpace3D({ dimensionScores, archetypeKey, width = 280, height = 280 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const rotRef = useRef({ theta: 0.65, phi: 0.35 });
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const autoRef = useRef(true);
  const autoTimerRef = useRef(null);
  const particlesRef = useRef(null);
  const progressRef = useRef(0);
  const dataRef = useRef({});

  useEffect(() => {
    dataRef.current.scores = dimensionScores;
    dataRef.current.archetypeKey = archetypeKey;
  });

  useEffect(() => {
    particlesRef.current = generateParticles();
  }, []);

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
        (pos[0] * progress - 0.5) * spaceScale,
        (pos[1] * progress - 0.5) * spaceScale,
        (pos[2] * progress - 0.5) * spaceScale,
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
      const testPos = AXES.map((a) => scores?.[a.key]?.score ?? 0.5);

      let closestKey = aKey;
      let minDist = Infinity;
      Object.entries(ARCHETYPES).forEach(([k, v]) => {
        const d = dist3(testPos, v.pos);
        if (d < minDist) {
          minDist = d;
          closestKey = k;
        }
      });

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
          isClosest: key === closestKey,
        });
      });

      if (particlesRef.current) {
        particlesRef.current.forEach((p, i) => {
          const screen = toScreen(p.pos, easedProgress);
          drawItems.push({
            type: "particle",
            z: screen.z,
            screen,
            color: p.color,
            size: p.size,
            opacity: p.opacity,
            phase: p.phase,
            index: i,
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
        } else if (item.type === "particle") {
          drawParticle(ctx, item.screen, item.color, item.size, item.opacity, item.phase, t);
        } else if (item.type === "test") {
          drawTestSubject(ctx, item.screen, origin, t);
        }
      });

      const closestArch = ARCHETYPES[closestKey];
      if (closestArch) {
        const closestScreen = toScreen(closestArch.pos, easedProgress);
        drawClosestLine(ctx, testScreen, closestScreen, closestArch.color, t);
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
