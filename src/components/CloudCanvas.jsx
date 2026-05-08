import { useRef, useEffect } from "react";

export default function CloudCanvas({ cloudData, width = 360, height = 360 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cloudData) return;
    
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw particles with soft glow
    cloudData.particles.forEach((p) => {
      const x = centerX + p.x;
      const y = centerY + p.y;
      
      // Glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3);
      gradient.addColorStop(0, p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, "0"));
      gradient.addColorStop(1, p.color + "00");
      
      ctx.beginPath();
      ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Core
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.opacity * 200 + 55).toString(16).padStart(2, "0");
      ctx.fill();
    });
    
    // Draw vectors
    cloudData.vectors.forEach((v) => {
      const endX = centerX + Math.cos(v.angle) * v.length;
      const endY = centerY + Math.sin(v.angle) * v.length;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = v.color + Math.floor(v.opacity * 150).toString(16).padStart(2, "0");
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Arrow head
      const arrowSize = 6;
      const arrowAngle = Math.atan2(endY - centerY, endX - centerX);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = v.color + Math.floor(v.opacity * 200).toString(16).padStart(2, "0");
      ctx.fill();
    });
    
    // Draw center glow
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
    centerGradient.addColorStop(0, "rgba(155, 142, 199, 0.2)");
    centerGradient.addColorStop(1, "rgba(155, 142, 199, 0)");
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
    ctx.fillStyle = centerGradient;
    ctx.fill();
    
  }, [cloudData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="rounded-full"
    />
  );
}
