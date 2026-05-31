import { useRef, useEffect, useCallback } from "react";
import { ARCHETYPE_VECTORS, VECTOR_AXES, mapTo3D } from "../utils/blurEngine";

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

function makeToScreen(width, height, rotRef, progress = 1) {
  const cx = width / 2;
  const cy = height / 2;
  const fov = 350;
  const spaceScale = Math.min(width, height) * 0.4;

  return (pos) => {
    const centered = [
      (pos[0] * progress * spaceScale) / 2,
      (pos[1] * progress * spaceScale) / 2,
      (pos[2] * progress * spaceScale) / 2,
    ];
    const r1 = rotateY(centered, rotRef.current.theta);
    const r2 = rotateX(r1, rotRef.current.phi);
    return project3D(r2, cx, cy, fov);
  };
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
  ctx.strokeStyle = "rgba(160,155,148,0.35)";
  ctx.lineWidth = 1;
  edges.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(sc[a].x, sc[a].y);
    ctx.lineTo(sc[b].x, sc[b].y);
    ctx.stroke();
  });

  const gridAlpha = 0.18;
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
    ctx.strokeStyle = `rgba(160,155,148,${gridAlpha})`;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 3]);
    lines.forEach(([from, to]) => {
      const p1 = toScreen(from);
      const p2 = toScreen(to);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  });
}

function drawAxes(ctx, toScreen) {
  const axisLines = [
    { from: [-1, 0, 0], to: [1, 0, 0], color: VECTOR_AXES[0].color },
    { from: [0, -1, 0], to: [0, 1, 0], color: VECTOR_AXES[1].color },
    { from: [0, 0, -1], to: [0, 0, 1], color: VECTOR_AXES[2].color },
  ];

  axisLines.forEach((axis) => {
    const s = toScreen(axis.from);
    const e = toScreen(axis.to);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.strokeStyle = rgba(axis.color, 0.7);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const dir = { x: e.x - s.x, y: e.y - s.y };
    const len = Math.hypot(dir.x, dir.y);
    if (len > 0) {
      const nx = dir.x / len;
      const ny = dir.y / len;
      const ax = 6;
      const ay = 4;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x - nx * ax - ny * ay, e.y - ny * ax + nx * ay);
      ctx.lineTo(e.x - nx * ax + ny * ay, e.y - ny * ax - nx * ay);
      ctx.closePath();
      ctx.fillStyle = rgba(axis.color, 0.7);
      ctx.fill();
    }
  });
}

function drawArchetypeVector(ctx, origin, end, color, label, isClosest, isHovered, t, index, total) {
  const lineAlpha = isClosest ? 0.75 : isHovered ? 0.6 : 0.35;
  const dotAlpha = isClosest ? 1 : isHovered ? 0.9 : 0.65;
  const dotSize = isClosest ? 6 : isHovered ? 5 : 3.5;

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = rgba(color, lineAlpha);
  ctx.lineWidth = isClosest ? 2.5 : isHovered ? 2 : 1.2;
  ctx.stroke();

  const pulse = 0.6 + Math.sin(t * 0.025) * 0.4;

  if (isClosest) {
    const glow = ctx.createRadialGradient(end.x, end.y, 0, end.x, end.y, 20);
    glow.addColorStop(0, rgba(color, 0.45 * pulse));
    glow.addColorStop(1, rgba(color, 0));
    ctx.beginPath();
    ctx.arc(end.x, end.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(end.x, end.y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(color, 0.4 * pulse);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (isHovered) {
    const glow = ctx.createRadialGradient(end.x, end.y, 0, end.x, end.y, 18);
    glow.addColorStop(0, rgba(color, 0.3 * pulse));
    glow.addColorStop(1, rgba(color, 0));
    ctx.beginPath();
    ctx.arc(end.x, end.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(end.x, end.y, dotSize, 0, Math.PI * 2);
  ctx.fillStyle = rgba(color, dotAlpha);
  ctx.fill();

  ctx.strokeStyle = rgba(color, dotAlpha * 0.5);
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 轮播高亮标签：每隔 150 帧（约 2.5 秒 @ 60fps）切换一次
  const cycleIndex = Math.floor(t / 150) % total;
  const isLit = isClosest || isHovered || cycleIndex === index;

  const labelAlpha = isLit ? 0.95 : 0.35;
  const fontSize = isLit ? 11 : 9;

  // 标签放在末端点偏上方，根据 index 做轻微 x 偏移避免全部垂直堆叠
  const staggerX = ((index % 3) - 1) * 10; // -10, 0, 10 循环

  ctx.save();
  ctx.font = `${isLit ? "bold " : ""}${fontSize}px system-ui,-apple-system,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  const textY = end.y - dotSize - 6;

  // 高亮时给一个淡淡的背景发光
  if (isLit) {
    ctx.shadowColor = rgba(color, 0.6);
    ctx.shadowBlur = 8;
  }

  ctx.fillStyle = rgba(color, labelAlpha);
  ctx.fillText(label, end.x + staggerX, textY);

  ctx.restore();
}

function drawTestSubject(ctx, screen, origin, t) {
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(screen.x, screen.y);
  ctx.strokeStyle = "rgba(74,69,64,0.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  const pulse = 0.75 + Math.sin(t * 0.03) * 0.25;

  const glow = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, 24);
  glow.addColorStop(0, `rgba(74,69,64,${0.3 * pulse})`);
  glow.addColorStop(0.4, `rgba(155,142,199,${0.2 * pulse})`);
  glow.addColorStop(1, "rgba(155,142,199,0)");
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 24, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  const ds = 6.5;
  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y - ds);
  ctx.lineTo(screen.x + ds, screen.y);
  ctx.lineTo(screen.x, screen.y + ds);
  ctx.lineTo(screen.x - ds, screen.y);
  ctx.closePath();
  ctx.fillStyle = `rgba(74,69,64,${0.85 * pulse})`;
  ctx.fill();
  ctx.strokeStyle = "rgba(155,142,199,0.8)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = `rgba(74,69,64,${0.95 * pulse})`;
  ctx.font = "bold 12px system-ui,-apple-system,sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  ctx.shadowColor = rgba([245, 243, 240], 0.9);
  ctx.shadowBlur = 4;
  ctx.fillText("你", screen.x, screen.y - 12);
  ctx.shadowBlur = 0;
}

export default function VectorSpace3D({
  userVector,
  archetypeKey,
  width = 280,
  height = 280,
  onHoverArchetype,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const rotRef = useRef({ theta: 0.65, phi: 0.35 });
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const autoRef = useRef(true);
  const autoTimerRef = useRef(null);
  const progressRef = useRef(0);
  const dataRef = useRef({});
  const hoveredRef = useRef(null);

  useEffect(() => {
    dataRef.current.userVector = userVector;
    dataRef.current.archetypeKey = archetypeKey;
  }, [userVector, archetypeKey]);

  const handlePointerMove = useCallback(
    (e) => {
      if (dragRef.current.active) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (width / rect.width);
      const y = (e.clientY - rect.top) * (height / rect.height);

      const toScreen = makeToScreen(width, height, rotRef);

      let closest = null;
      let closestDist = Infinity;

      Object.entries(ARCHETYPE_VECTORS).forEach(([key, arch]) => {
        const end = toScreen(arch.pos);
        const dist = Math.hypot(end.x - x, end.y - y);
        if (dist < 24 && dist < closestDist) {
          closestDist = dist;
          closest = { key, label: arch.label, color: arch.color };
        }
      });

      hoveredRef.current = closest;
      if (onHoverArchetype) {
        onHoverArchetype(closest?.key || null);
      }
    },
    [width, height, onHoverArchetype]
  );

  const handlePointerLeave = useCallback(() => {
    hoveredRef.current = null;
    if (onHoverArchetype) onHoverArchetype(null);
  }, [onHoverArchetype]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

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
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

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

      const toScreen = (pos) => makeToScreen(width, height, rotRef, easedProgress)(pos);

      const uVec = dataRef.current.userVector;
      const aKey = dataRef.current.archetypeKey;
      const testPos = uVec ? mapTo3D(uVec) : [0, 0, 0];

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.48);
      bg.addColorStop(0, "rgba(240,238,234,0.7)");
      bg.addColorStop(0.7, "rgba(240,238,234,0.25)");
      bg.addColorStop(1, "rgba(240,238,234,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      drawWireframe(ctx, toScreen);
      drawAxes(ctx, toScreen);

      const origin = toScreen([0, 0, 0]);

      const drawItems = [];

      const currentHovered = hoveredRef.current;
      const totalArchetypes = Object.keys(ARCHETYPE_VECTORS).length;
      Object.entries(ARCHETYPE_VECTORS).forEach(([key, arch], index) => {
        const end = toScreen(arch.pos);
        const isClosest = key === aKey;
        const isHovered = currentHovered?.key === key;
        drawItems.push({
          type: "arch",
          z: end.z,
          key,
          end,
          color: arch.color,
          label: arch.label,
          isClosest,
          isHovered,
          index,
          total: totalArchetypes,
        });
      });

      const testScreen = toScreen(testPos);
      drawItems.push({
        type: "test",
        z: testScreen.z - 0.01,
        screen: testScreen,
      });

      drawItems.sort((a, b) => b.z - a.z);

      drawItems.forEach((item) => {
        if (item.type === "arch") {
          drawArchetypeVector(ctx, origin, item.end, item.color, item.label, false, item.isHovered, t, item.index, item.total);
        } else if (item.type === "test") {
          drawTestSubject(ctx, item.screen, origin, t);
        }
      });

      ctx.fillStyle = "rgba(140,132,122,0.65)";
      ctx.font = "10px system-ui,-apple-system,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("拖拽旋转", cx, height - 8);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [width, height, handlePointerMove, handlePointerLeave]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="3D 人格向量空间可视化"
      style={{ width: `${width}px`, height: `${height}px`, cursor: "grab", touchAction: "none" }}
    />
  );
}
