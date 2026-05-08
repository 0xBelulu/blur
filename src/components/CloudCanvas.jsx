import { useRef, useEffect } from "react";

function colorToString(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export default function CloudCanvas({ cloudData, width = 320, height = 320 }) {
  const canvasRef = useRef(null);

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

    ctx.clearRect(0, 0, width, height);

    // Soft background wash
    const bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.42);
    bg.addColorStop(0, "rgba(245, 243, 240, 0.9)");
    bg.addColorStop(0.5, "rgba(245, 243, 240, 0.4)");
    bg.addColorStop(1, "rgba(245, 243, 240, 0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Draw vectors (decorative axes)
    cloudData.vectors.forEach((v) => {
      const endX = cx + Math.cos(v.angle) * v.length;
      const endY = cy + Math.sin(v.angle) * v.length;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = colorToString(v.color, v.opacity * 0.35);
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.stroke();

      // Small dot at tip
      ctx.beginPath();
      ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = colorToString(v.color, v.opacity * 0.6);
      ctx.fill();
    });

    // Draw particles - larger glow, no connections
    cloudData.particles.forEach((p) => {
      const x = cx + p.x;
      const y = cy + p.y;
      const c = p.color;

      // Outer soft halo
      const g1 = ctx.createRadialGradient(x, y, 0, x, y, p.size * 4);
      g1.addColorStop(0, colorToString(c, p.opacity * 0.2));
      g1.addColorStop(0.6, colorToString(c, p.opacity * 0.05));
      g1.addColorStop(1, colorToString(c, 0));
      ctx.beginPath();
      ctx.arc(x, y, p.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = g1;
      ctx.fill();

      // Inner glow
      const g2 = ctx.createRadialGradient(x, y, 0, x, y, p.size * 1.8);
      g2.addColorStop(0, colorToString(c, p.opacity * 0.6));
      g2.addColorStop(1, colorToString(c, 0));
      ctx.beginPath();
      ctx.arc(x, y, p.size * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = g2;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, p.size * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = colorToString(c, p.opacity * 0.9);
      ctx.fill();
    });

    // Multi-toned center glow
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
    cg.addColorStop(0, "rgba(155, 142, 199, 0.18)");
    cg.addColorStop(0.5, "rgba(143, 181, 196, 0.1)");
    cg.addColorStop(1, "rgba(245, 243, 240, 0)");
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();

    // Tiny center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(155, 142, 199, 0.5)";
    ctx.fill();

  }, [cloudData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
