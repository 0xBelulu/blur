import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PROJECTION_AXIS_COPY } from '../../shared/projection.js';
import { ACCENT, DEEP, HINT, INK, PAPER, rgba } from '../utils/palette.js';

const PAD = 34;
const MOTE_RADIUS = 1.8;
const FOCUS_RADIUS = 104;
// 静止下来之后降到 1/4 帧率：尘埃还在慢慢呼吸，但不再占满主线程。
const IDLE_AFTER = 2200;
const IDLE_EVERY = 4;

const screenX = (x, cx, scale) => cx + x * scale;
const screenY = (y, cy, scale) => cy - y * scale;
// 视差深度用序号推出来，不随机：同一个人每次打开都在同一层。
const depthOf = (index) => 0.25 + ((index * 37) % 100) / 100 * 0.75;

export default function CommunityField({ points = [], you = null, className = '', label = '星图：每个人是一个没有名字的点' }) {
  const canvasRef = useRef(null);
  const boxRef = useRef(null);
  const pointsRef = useRef(points);
  const youRef = useRef(you);
  const pointerRef = useRef({ x: 0, y: 0, active: false, at: 0 });
  const reduceMotion = useReducedMotion();

  useEffect(() => { pointsRef.current = points; }, [points]);
  useEffect(() => { youRef.current = you; }, [you]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    const context = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let frame = 0;
    let count = 0;
    let start = performance.now();

    const resize = () => {
      const rect = box.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      start = performance.now();
    };

    const paint = (timestamp) => {
      const elapsed = timestamp - start;
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.max(1, Math.min(width, height) / 2 - PAD);
      const pointer = pointerRef.current;

      context.clearRect(0, 0, width, height);

      // 一层几乎看不见的纸面：让这片尘埃有一块「底」，而不是漂在页面上。
      const plate = context.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.15);
      plate.addColorStop(0, rgba(PAPER, 0.55));
      plate.addColorStop(0.72, rgba(PAPER, 0.22));
      plate.addColorStop(1, rgba(PAPER, 0));
      context.fillStyle = plate;
      context.fillRect(0, 0, width, height);

      // 指针附近的一层极淡光：没有它，人少的场就是一张空白纸。
      if (pointer.active) {
        const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, FOCUS_RADIUS * 1.5);
        glow.addColorStop(0, rgba(ACCENT, 0.07));
        glow.addColorStop(1, rgba(ACCENT, 0));
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
      }

      // 四个边缘标签：坐标系的名字，不是数据。没有网格、没有轴、没有原型点。
      if (width > 260 && height > 220) {
        context.font = '10px system-ui,-apple-system,sans-serif';
        context.fillStyle = rgba(HINT, 0.85);
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.fillText(PROJECTION_AXIS_COPY.x.negative, 12, cy);
        context.textAlign = 'right';
        context.fillText(PROJECTION_AXIS_COPY.x.positive, width - 12, cy);
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillText(PROJECTION_AXIS_COPY.y.positive, cx, 12);
        context.textBaseline = 'bottom';
        context.fillText(PROJECTION_AXIS_COPY.y.negative, cx, height - 12);
      }

      const list = pointsRef.current;
      for (let index = 0; index < list.length; index += 1) {
        const [x, y] = list[index];
        const depth = depthOf(index);
        const drift = reduceMotion ? 0 : Math.sin(elapsed / 2600 + index * 1.7) * 1.6 * depth;
        const parallax = pointer.active ? 1 : 0;
        const px = screenX(x, cx, scale) + drift + (pointer.x - cx) * 0.014 * depth * parallax;
        const py = screenY(y, cy, scale) + Math.cos(elapsed / 3100 + index * 2.3) * 1.2 * depth + (pointer.y - cy) * 0.014 * depth * parallax;

        let alpha = 0.26 + 0.12 * depth;
        let radius = MOTE_RADIUS * (0.8 + depth * 0.5);
        if (pointer.active) {
          const distance = Math.hypot(px - pointer.x, py - pointer.y);
          if (distance < FOCUS_RADIUS) {
            const near = 1 - distance / FOCUS_RADIUS;
            alpha += near * 0.34;
            radius += near * 0.9;
          }
        }
        if (!reduceMotion) alpha += Math.sin(elapsed / 1500 + index * 1.1) * 0.05;

        context.beginPath();
        context.arc(px, py, radius, 0, Math.PI * 2);
        // 冷一点的蓝紫，和页面主色同族：尘埃不该是暖灰的，那会读成纸屑。
        context.fillStyle = rgba(DEEP, Math.max(0.12, alpha));
        context.fill();
      }

      const own = youRef.current;
      if (own) {
        const pulse = reduceMotion ? 1 : 0.82 + Math.sin(elapsed / 900) * 0.18;
        const px = screenX(own[0], cx, scale);
        const py = screenY(own[1], cy, scale);

        const glow = context.createRadialGradient(px, py, 0, px, py, 34);
        glow.addColorStop(0, rgba(ACCENT, 0.3 * pulse));
        glow.addColorStop(1, rgba(ACCENT, 0));
        context.beginPath();
        context.arc(px, py, 34, 0, Math.PI * 2);
        context.fillStyle = glow;
        context.fill();

        const size = 5.4 * (reduceMotion ? 1 : 0.94 + pulse * 0.06);
        context.beginPath();
        context.moveTo(px, py - size);
        context.lineTo(px + size, py);
        context.lineTo(px, py + size);
        context.lineTo(px - size, py);
        context.closePath();
        context.fillStyle = rgba(ACCENT, 0.92);
        context.fill();
        context.strokeStyle = rgba(INK, 0.35);
        context.lineWidth = 1;
        context.stroke();

        context.font = '11px system-ui,-apple-system,sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'bottom';
        context.fillStyle = rgba(INK, 0.62);
        context.fillText('你', px, py - size - 7);
      }
    };

    const loop = (timestamp) => {
      count += 1;
      const idle = timestamp - pointerRef.current.at > IDLE_AFTER;
      if (!idle || count % IDLE_EVERY === 0) paint(timestamp);
      frame = requestAnimationFrame(loop);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(box);

    if (reduceMotion) paint(performance.now());
    else frame = requestAnimationFrame(loop);

    const move = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left, y: event.clientY - rect.top, active: true, at: performance.now(),
      };
    };
    const leave = () => { pointerRef.current = { ...pointerRef.current, active: false, at: performance.now() }; };

    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerdown', move);
    canvas.addEventListener('pointerleave', leave);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerdown', move);
      canvas.removeEventListener('pointerleave', leave);
    };
  }, [reduceMotion]);

  return (
    <div ref={boxRef} className={className}>
      <canvas ref={canvasRef} role="img" aria-label={label} className="block h-full w-full" style={{ touchAction: 'pan-y' }} />
    </div>
  );
}
