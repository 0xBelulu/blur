import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { SPATIAL_SYMBOLS, STARDUST_PARTICLES } from '../src/components/optical/symbols.js';

export const opticalSource = () => readFileSync(new URL('../src/components/optical/useOpticalField.js', import.meta.url), 'utf8');

// Run the actual hook in a deterministic DOM/RAF host. Only ESM declarations
// are stripped; no animation, interaction or lifecycle logic is duplicated.
export function createOpticalHost(source = opticalSource(), options = {}) {
  let now = 10000;
  let nextFrame = 0;
  let refIndex = 0;
  let effectIndex = 0;
  let props = { ...options };
  let pendingEffects = [];
  const refs = [];
  const effects = [];
  const frames = new Map();
  const counts = { writes: 0, byProperty: {}, layoutReads: 0, frameCalls: 0 };
  const warnings = [];
  const nodes = [];
  const listeners = () => {
    const handlers = new Map();
    return {
      addEventListener(type, fn) {
        if (!handlers.has(type)) handlers.set(type, new Set());
        handlers.get(type).add(fn);
      },
      removeEventListener(type, fn) { handlers.get(type)?.delete(fn); },
      emit(type, event = {}) { for (const fn of handlers.get(type) || []) fn(event); },
      get listenerCount() { return [...handlers.values()].reduce((sum, set) => sum + set.size, 0); },
    };
  };
  const window = {
    ...listeners(),
    innerWidth: options.width ?? 1280,
    innerHeight: options.height ?? 900,
    matchMedia: () => ({ matches: !!options.coarse }),
  };
  const document = { ...listeners(), hidden: false, timeline: { currentTime: now } };
  class Element {
    constructor(kind) {
      this.kind = kind;
      this.animations = [];
      this.style = new Proxy({}, {
        set(target, key, value) {
          counts.writes++;
          counts.byProperty[key] = (counts.byProperty[key] || 0) + 1;
          target[key] = String(value);
          return true;
        },
      });
      if (options.waapi === false) this.animate = undefined;
      nodes.push(this);
    }
    get clientWidth() { counts.layoutReads++; return window.innerWidth; }
    get clientHeight() { counts.layoutReads++; return window.innerHeight; }
    closest() { return false; }
    getBoundingClientRect() {
      counts.layoutReads++;
      const scale = Number(this.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || 1) * (options.pageScale ?? 1);
      const width = window.innerWidth * scale, height = window.innerHeight * scale;
      return { left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2, width, height };
    }
    animate(keyframes, timing) {
      const animation = { keyframes, timing, startTime: now, cancelled: false, cancel() { this.cancelled = true; } };
      this.animations.push(animation);
      return animation;
    }
    opacity() {
      const animation = this.animations.findLast((item) => !item.cancelled);
      if (!animation) return Math.max(0, Number(this.style.opacity));
      const { duration, delay = 0 } = animation.timing;
      const progress = ((now - animation.startTime - delay) % duration) / duration;
      const frames = animation.keyframes;
      const next = frames.findIndex((frame) => frame.offset > progress);
      const index = next === -1 ? frames.length - 2 : Math.max(0, next - 1);
      const fraction = (progress - frames[index].offset) / (frames[index + 1].offset - frames[index].offset);
      return Number(frames[index].opacity) * (1 - fraction) + Number(frames[index + 1].opacity) * fraction;
    }
  }
  const hook = runInNewContext(source
    .replace(/^import .+ from .+;\r?$/gm, '')
    .replace('export function useOpticalField', 'function useOpticalField') + '\nuseOpticalField;', {
    useRef(value) {
      const index = refIndex++;
      return refs[index] || (refs[index] = { current: value });
    },
    useEffect(effect, deps) {
      const index = effectIndex++;
      const previous = effects[index];
      if (previous && deps?.every((value, i) => Object.is(value, previous.deps?.[i]))) return;
      pendingEffects.push(() => {
        previous?.cleanup?.();
        effects[index] = { deps, effect, cleanup: effect() };
      });
    },
    window, document, Element,
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(fn) { const id = ++nextFrame; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    performance: { now: () => now },
    console: { warn: (...args) => warnings.push(args) },
    SPATIAL_SYMBOLS, STARDUST_PARTICLES,
  });
  let result;
  function render(nextProps = props) {
    props = nextProps;
    refIndex = 0; effectIndex = 0;
    result = hook(props);
    result.containerRef.current ||= new Element('container');
    result.reticleRef.current ||= new Element('reticle');
    const symbols = props.symbols || SPATIAL_SYMBOLS;
    const dust = props.stardust || STARDUST_PARTICLES;
    symbols.forEach((_, i) => {
      result.elementsRef.current[i] ||= new Element('symbol');
      result.wrappersRef.current[i] ||= new Element('wrapper');
    });
    dust.forEach((_, i) => { result.dustRef.current[i] ||= new Element('dust'); });
    const commit = pendingEffects;
    pendingEffects = [];
    commit.forEach((effect) => effect());
    return result;
  }
  render();
  const resetCounts = () => { counts.writes = 0; counts.byProperty = {}; counts.layoutReads = 0; counts.frameCalls = 0; };
  resetCounts();
  return {
    counts, window, document, nodes, warnings, resetCounts,
    get result() { return result; },
    get symbols() { return props.symbols || SPATIAL_SYMBOLS; },
    get pendingFrames() { return frames.size; },
    get state() { return refs.find((ref) => ref.current?.camX !== undefined).current; },
    update(nextProps) { render({ ...props, ...nextProps }); },
    advance(time) { now = time; document.timeline.currentTime = time; },
    restartEffects() {
      effects.forEach((effect) => effect.cleanup?.());
      effects.forEach((effect) => { effect.cleanup = effect.effect(); });
    },
    step(time) {
      now = time; document.timeline.currentTime = time;
      const ready = [...frames.values()]; frames.clear();
      ready.forEach((fn) => { counts.frameCalls++; fn(time); });
    },
    resize(width, height) { window.innerWidth = width; window.innerHeight = height; window.emit('resize'); },
    visible(value) { document.hidden = !value; document.emit('visibilitychange'); },
    snapshot() {
      return JSON.parse(JSON.stringify({
        positions: this.state.currentPositions,
        container: result.containerRef.current.style,
        symbols: result.elementsRef.current.map((el) => el.style),
        reticle: result.reticleRef.current.style,
        dust: result.dustRef.current.map((el) => ({ transform: el.style.transform, opacity: el.opacity() })),
      }));
    },
    unmount() { effects.forEach((effect) => effect.cleanup?.()); },
  };
}

export function exerciseOpticalHost(host, frames = 600, fps = 60, mode = 'idle') {
  const snapshots = [];
  for (let i = 0; i < frames; i++) {
    const now = 10000 + i * 1000 / fps;
    if (mode === 'pointer' && i % 4 === 0) host.window.emit('pointermove', {
      clientX: 640 + Math.sin(i / 35) * 400,
      clientY: 450 + Math.cos(i / 40) * 250,
      pointerType: 'mouse',
    });
    if (mode === 'gyro' && i % 2 === 0) host.window.emit('deviceorientation', {
      beta: 50 + Math.sin(i / 40) * 12, gamma: Math.cos(i / 35) * 15,
    });
    if (i === 100) {
      const index = Math.min(6, host.symbols.length - 1);
      host.result.focusOnSymbolRef.current(host.symbols[index], index);
    }
    if (mode === 'persona' && i === 200) host.update({
      symbols: host.symbols.map((item, index) => ({
        ...item, z: Math.max(0.16, Math.min(0.92, item.z + (index % 2 ? 0.12 : -0.12))),
      })),
    });
    if (i === 300) host.resize(412, 915);
    if (i === 400) host.resize(1280, 900);
    host.step(now);
    if (i % 20 === 0) snapshots.push(host.snapshot());
  }
  return snapshots;
}
