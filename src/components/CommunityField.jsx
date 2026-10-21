import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PROJECTION_AXIS_COPY } from '../../shared/projection.js';
import { ACCENT, DEEP, HINT, INK, PAPER, rgba } from '../utils/palette.js';

/**
 * 星图的画法，借的是 SpaceEngine 的思路，但把「光」换成了「墨」。
 *
 * 它在黑底上做三件事：小于一个像素的东西并进背景亮度（LOD）、星体是带衰减的
 * 光斑而不是圆点、密集处几十个光斑叠成一片连续的光。所以放大不是把点变大，
 * 而是让更多东西被分辨出来；点多也不会变成一排排小点。
 *
 * 这里底色是暖白纸，加法混合只会迅速糊成白色。所以反过来：**重叠等于积墨**。
 * 四层，从下到上：
 *   1. 纸面  —— 一层几乎看不见的径向渐变，让尘埃有「底」
 *   2. 墨雾  —— 1/6 分辨率的累积层，放大回来就是一片软的水彩；点越多越明显
 *   3. 颗粒  —— 每个点一个软光斑；点少时更大更实，点多时退成纹理
 *   4. 自己  —— 唯一的实心标记，永远是画面里最清楚的东西
 *
 * 稀疏和密集由 density 这一个数驱动，没有第二套逻辑。
 */
const PAD = 34;
const FOCUS_RADIUS = 104;
const IDLE_AFTER = 2200;
const IDLE_EVERY = 4;
// 墨雾层的分辨率：1/6 放大回来，天然就是一层模糊，不需要 canvas filter。
const WASH_SCALE = 6;

const screenX = (x, cx, scale) => cx + x * scale;
const screenY = (y, cy, scale) => cy - y * scale;
// 视差深度用序号推出来，不随机：同一个人每次打开都在同一层。
const depthOf = (index) => 0.25 + ((index * 37) % 100) / 100 * 0.75;
// 亮度差异同样只由序号决定，是视觉层次，不是身份。
const lumaOf = (index) => 0.55 + ((index * 53) % 100) / 100 * 0.45;

/** 0 = 空旷，1 = 密集。所有「少和多怎么画」的判断都只读这一个数。 */
function densityOf(total) {
  return Math.min(1, Math.max(0, (total - 6) / 140));
}

/**
 * 一颗尘埃的形状：实心核 + 快速衰减的边。
 * 用均匀的径向渐变会画成一团雾——中心必须够实，边缘才敢散。
 */
function sprite(radius, color, stops = [[0, 1], [0.2, 0.75], [0.5, 0.18], [1, 0]]) {
  const size = Math.ceil(radius * 4);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [offset, alpha] of stops) gradient.addColorStop(offset, rgba(color, alpha));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export default function CommunityField({ points = [], you = null, className = '', label = '星图：每个人是一个没有名字的点' }) {
  const canvasRef = useRef(null);
  const boxRef = useRef(null);
  const pointsRef = useRef(points);
  const youRef = useRef(you);
  const pointerRef = useRef({ x: 0, y: 0, active: false, at: 0 });
  const buildWashRef = useRef(() => {});
  const reduceMotion = useReducedMotion();

  useEffect(() => { pointsRef.current = points; }, [points]);
  useEffect(() => { youRef.current = you; }, [you]);

  // 墨雾不随时间变化，只在点数或尺寸变化时重算一次——它比颗粒贵得多。
  useEffect(() => { buildWashRef.current(); }, [points]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    const context = canvas.getContext('2d');
    const wash = document.createElement('canvas');
    const washContext = wash.getContext('2d');
    const moteSprite = sprite(6, DEEP);
    const halo = sprite(22, DEEP, [[0, 0.55], [0.35, 0.22], [1, 0]]);
    const geometry = { width: 0, height: 0, cx: 0, cy: 0, scale: 1 };
    let frame = 0;
    let count = 0;
    let start = performance.now();

    const buildWash = () => {
      const { width, height, cx, cy, scale } = geometry;
      if (!width || !height) return;
      wash.width = Math.max(1, Math.round(width / WASH_SCALE));
      wash.height = Math.max(1, Math.round(height / WASH_SCALE));
      washContext.clearRect(0, 0, wash.width, wash.height);
      washContext.fillStyle = rgba(DEEP, 0.5);
      // 每点在低分辨率上画一小团；重叠的地方自然积到更浓，放大后就是水彩。
      // 团要够大：半径 1.7（1/6 分辨率）只是「模糊的同一批点」，撑开成 3.2 才会彼此
      // 连成一片——SpaceEngine 在缩小时也不是把星变小，而是让它们并进亮度里。
      for (const [x, y] of pointsRef.current) {
        washContext.beginPath();
        washContext.arc(screenX(x, cx, scale) / WASH_SCALE, screenY(y, cy, scale) / WASH_SCALE, 3.2, 0, Math.PI * 2);
        washContext.fill();
      }
    };
    buildWashRef.current = buildWash;

    const resize = () => {
      const rect = box.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      geometry.width = Math.max(1, Math.round(rect.width));
      geometry.height = Math.max(1, Math.round(rect.height));
      geometry.cx = geometry.width / 2;
      geometry.cy = geometry.height / 2;
      geometry.scale = Math.max(1, Math.min(geometry.width, geometry.height) / 2 - PAD);
      canvas.width = Math.round(geometry.width * ratio);
      canvas.height = Math.round(geometry.height * ratio);
      canvas.style.width = `${geometry.width}px`;
      canvas.style.height = `${geometry.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      start = performance.now();
      buildWash();
    };

    const paint = (timestamp) => {
      const elapsed = timestamp - start;
      const { width, height, cx, cy, scale } = geometry;
      const pointer = pointerRef.current;
      const list = pointsRef.current;
      const total = list.length + (youRef.current ? 1 : 0);
      const density = densityOf(total);
      // 点少的时候每一颗都该看得清，点多了就该退成纹理——同一个数控制两边。
      const moteAlpha = 0.58 - 0.4 * density;
      const moteSize = 1 + 0.45 * (1 - Math.min(1, total / 40));
      // LOD：点太多时只画其中一部分，其余的交给墨雾。SpaceEngine 在缩小时不是把星
      // 变小，而是让小于一个像素的东西并进背景亮度——这里同理，别让颗粒变成噪点。
      const stride = total > 1200 ? 4 : total > 500 ? 2 : 1;

      context.clearRect(0, 0, width, height);

      // 纸面只托住这块区域，不能把自己刷成一层奶白——尘埃的对比度全被它吃掉。
      const plate = context.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.15);
      plate.addColorStop(0, rgba(PAPER, 0.34));
      plate.addColorStop(0.72, rgba(PAPER, 0.14));
      plate.addColorStop(1, rgba(PAPER, 0));
      context.fillStyle = plate;
      context.fillRect(0, 0, width, height);

      // 墨雾：空旷时不画，免得几个点也糊成一片脏。
      if (density > 0.01) {
        context.save();
        context.globalCompositeOperation = 'multiply';
        context.globalAlpha = 0.42 * density;
        context.imageSmoothingEnabled = true;
        context.drawImage(wash, 0, 0, width, height);
        context.restore();
      }

      if (pointer.active) {
        const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, FOCUS_RADIUS * 1.5);
        glow.addColorStop(0, rgba(ACCENT, 0.06));
        glow.addColorStop(1, rgba(ACCENT, 0));
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
      }

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

      // 点很少时给每一颗一圈极淡的光晕：一两粒尘埃不该像屏幕上的坏点。
      if (total <= 12) {
        context.globalAlpha = 0.42;
        for (let index = 0; index < list.length; index += 1) {
          const [x, y] = list[index];
          const px = screenX(x, cx, scale);
          const py = screenY(y, cy, scale);
          context.drawImage(halo, px - 34, py - 34, 68, 68);
        }
        context.globalAlpha = 1;
      }

      for (let index = 0; index < list.length; index += 1) {
        if (stride > 1 && index % stride !== 0) continue;
        const [x, y] = list[index];
        const depth = depthOf(index);
        const drift = reduceMotion ? 0 : Math.sin(elapsed / 2600 + index * 1.7) * 1.6 * depth;
        const parallax = pointer.active ? 1 : 0;
        const px = screenX(x, cx, scale) + drift + (pointer.x - cx) * 0.014 * depth * parallax;
        const py = screenY(y, cy, scale) + Math.cos(elapsed / 3100 + index * 2.3) * 1.2 * depth + (pointer.y - cy) * 0.014 * depth * parallax;

        let alpha = moteAlpha * lumaOf(index);
        let size = 9 * moteSize * (0.8 + depth * 0.5);
        if (pointer.active) {
          const distance = Math.hypot(px - pointer.x, py - pointer.y);
          if (distance < FOCUS_RADIUS) {
            const near = 1 - distance / FOCUS_RADIUS;
            alpha += near * 0.32;
            size *= 1 + near * 0.5;
          }
        }
        if (!reduceMotion) alpha *= 0.92 + Math.sin(elapsed / 1500 + index * 1.1) * 0.08;

        context.globalAlpha = Math.min(1, alpha);
        context.drawImage(moteSprite, px - size / 2, py - size / 2, size, size);
        // 实心核：没有它，稀疏的几个点只是纸上的脏斑，读不出「一颗」。
        context.globalAlpha = Math.min(1, alpha * 1.5);
        context.beginPath();
        context.arc(px, py, 1.25, 0, Math.PI * 2);
        context.fillStyle = rgba(DEEP, 1);
        context.fill();
      }
      context.globalAlpha = 1;

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
