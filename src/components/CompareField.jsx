import { useEffect, useRef } from 'react';

const MINE = [151, 130, 191];
const THEIRS = [83, 145, 163];
const SHARED = [129, 137, 200];
const TAU = Math.PI * 2;

const rgba = (color, alpha) => `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;

/**
 * 两个人的光场：两枚干净的光环缓慢漂移，交叠处凝成一块透镜。
 * 颜色只活在形状里 —— 环、透镜、边缘微光，其余留给纸。
 */
export default function CompareField({ overlap }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });
  const ratioRef = useRef(overlap / 100);
  const startRef = useRef(0);

  useEffect(() => {
    ratioRef.current = Math.max(0, Math.min(1, overlap / 100));
  }, [overlap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas.getContext('2d');
    const size = { w: 900, h: 320 };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.w = Math.max(280, rect.width);
      size.h = Math.max(180, rect.height);
      canvas.width = Math.round(size.w * dpr);
      canvas.height = Math.round(size.h * dpr);
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    const onMove = (event) => {
      const rect = wrap.getBoundingClientRect();
      pointerRef.current.tx = (event.clientX - rect.left) / rect.width;
      pointerRef.current.ty = (event.clientY - rect.top) / rect.height;
    };
    const onLeave = () => {
      pointerRef.current.tx = 0.5;
      pointerRef.current.ty = 0.5;
    };
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);

    startRef.current = performance.now();
    let frame = 0;

    const draw = (time) => {
      const { w, h } = size;
      const elapsed = time - startRef.current;
      const progress = Math.min(1, elapsed / 1150);
      const ease = 1 - Math.pow(1 - progress, 3);

      const pointer = pointerRef.current;
      pointer.x += (pointer.tx - pointer.x) * 0.07;
      pointer.y += (pointer.ty - pointer.y) * 0.07;
      const leanX = (pointer.x - 0.5) * 2;
      const leanY = (pointer.y - 0.5) * 2;

      const radius = Math.min(h * 0.42, w * 0.19);
      const cx = w / 2;
      const cy = h / 2;

      const target = radius * 2 * Math.pow(1 - ratioRef.current, 0.62);
      const distance = target + (1 - ease) * radius * 1.2;

      const driftA = Math.sin(elapsed * 0.00052) * radius * 0.05;
      const driftB = Math.cos(elapsed * 0.00044) * radius * 0.045;

      const ax = cx - distance / 2 + driftA + leanX * radius * 0.05;
      const ay = cy + Math.sin(elapsed * 0.00038) * radius * 0.03 + leanY * radius * 0.04;
      const bx = cx + distance / 2 + driftB + leanX * radius * 0.05;
      const by = cy + Math.cos(elapsed * 0.00033) * radius * 0.03 + leanY * radius * 0.04;

      const alpha = ease;
      ctx.clearRect(0, 0, w, h);

      /* 只在圆环外缘留一圈极淡的光，不再铺满整片 */
      const rimGlow = (x, y, color) => {
        const outer = radius * 1.34;
        const glow = ctx.createRadialGradient(x, y, radius * 0.86, x, y, outer);
        glow.addColorStop(0, rgba(color, 0));
        glow.addColorStop(0.34, rgba(color, 0.15 * alpha));
        glow.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, outer, 0, TAU);
        ctx.fill();
      };

      rimGlow(ax, ay, MINE);
      rimGlow(bx, by, THEIRS);

      ctx.beginPath();
      ctx.arc(ax, ay, radius, 0, TAU);
      ctx.fillStyle = rgba(MINE, 0.035 * alpha);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, TAU);
      ctx.fillStyle = rgba(THEIRS, 0.035 * alpha);
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ax, ay, radius, 0, TAU);
      ctx.strokeStyle = rgba(MINE, 0.62 * alpha);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, TAU);
      ctx.strokeStyle = rgba(THEIRS, 0.62 * alpha);
      ctx.stroke();

      const gap = Math.hypot(bx - ax, by - ay);
      if (gap > 1 && gap < radius * 2 - 0.5) {
        const angle = Math.atan2(by - ay, bx - ax);
        const half = Math.acos(Math.min(1, gap / 2 / radius));

        ctx.beginPath();
        ctx.arc(ax, ay, radius, angle - half, angle + half);
        ctx.arc(bx, by, radius, angle + Math.PI - half, angle + Math.PI + half);

        const breath = 0.94 + Math.sin(elapsed * 0.0011) * 0.06;
        ctx.fillStyle = rgba(SHARED, 0.16 * alpha * breath);
        ctx.fill();

        ctx.lineWidth = 1.4;
        ctx.strokeStyle = `rgba(255,255,255,${0.9 * alpha})`;
        ctx.stroke();
      }

      /* 两枚极小的核心点，给"人"一个位置 */
      const core = (x, y, color) => {
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, TAU);
        ctx.fillStyle = rgba(color, 0.9 * alpha);
        ctx.fill();
      };
      core(ax, ay, MINE);
      core(bx, by, THEIRS);

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <div className="cmp-field" ref={wrapRef}>
    <canvas ref={canvasRef} role="img"
      aria-label={`两个人格轮廓的重合程度 ${Math.round(overlap)}%`} />
  </div>;
}
