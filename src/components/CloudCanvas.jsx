import { useRef, useEffect, useCallback } from "react";

function colorToString(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export default function CloudCanvas({ cloudData, width = 320, height = 320, focus = 0.5 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const particleStatesRef = useRef(null);

  const initStates = useCallback(() => {
    if (!cloudData) return;
    particleStatesRef.current = cloudData.particles.map(() => ({
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      speedX: 0.15 + Math.random() * 0.25,
      speedY: 0.12 + Math.random() * 0.2,
      driftX: 1 + Math.random() * 2,
      driftY: 1 + Math.random() * 2,
    }));
  }, [cloudData]);

  useEffect(() => {
    initStates();
  }, [initStates]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cloudData) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const pStates = particleStatesRef.current;

    if (!pStates) return;

    const connectionDistance = 55;

    const draw = () => {
      timeRef.current += 1;
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, width * 0.45);
      bg.addColorStop(0, "rgba(245, 243, 240, 0.6)");
      bg.addColorStop(0.7, "rgba(245, 243, 240, 0.2)");
      bg.addColorStop(1, "rgba(245, 243, 240, 0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const positions = cloudData.particles.map((p, i) => {
        const ps = pStates[i];
        const dx = Math.sin(t * 0.006 * ps.speedX + ps.phaseX) * ps.driftX;
        const dy = Math.cos(t * 0.006 * ps.speedY + ps.phaseY) * ps.driftY;
        return { x: cx + p.x + dx, y: cy + p.y + dy, color: p.color, opacity: p.opacity, size: p.size };
      });

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const lineAlpha = (1 - dist / connectionDistance) * 0.15;
            const midColor = positions[i].color;
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.strokeStyle = colorToString(midColor, lineAlpha);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      cloudData.vectors.forEach((v, i) => {
        const angle = v.angle + Math.sin(t * 0.002) * 0.08;
        const lengthMod = 1 + Math.sin(t * 0.008 + i) * 0.05;
        const endX = cx + Math.cos(angle) * v.length * lengthMod;
        const endY = cy + Math.sin(angle) * v.length * lengthMod;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = colorToString(v.color, 0.12);
        ctx.lineWidth = 0.8;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(endX, endY, 2, 0, Math.PI * 2);
        ctx.fillStyle = colorToString(v.color, v.opacity * 0.5);
        ctx.fill();
      });

      positions.forEach((p, i) => {
        const pulse = 0.85 + Math.sin(t * 0.012 + i * 0.7) * 0.15;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        g.addColorStop(0, colorToString(p.color, p.opacity * 0.25 * pulse));
        g.addColorStop(1, colorToString(p.color, 0));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.5, p.size * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = colorToString(p.color, p.opacity * 0.85 * pulse);
        ctx.fill();
      });

      const centerPulse = 0.9 + Math.sin(t * 0.01) * 0.1;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35);
      cg.addColorStop(0, `rgba(155, 142, 199, ${0.12 * centerPulse})`);
      cg.addColorStop(0.5, `rgba(143, 181, 196, ${0.06 * centerPulse})`);
      cg.addColorStop(1, "rgba(245, 243, 240, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(155, 142, 199, ${0.4 + centerPulse * 0.15})`;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [cloudData, width, height, focus]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
