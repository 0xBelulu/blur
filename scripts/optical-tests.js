import assert from 'node:assert/strict';
import test from 'node:test';
import { createOpticalHost, exerciseOpticalHost } from './optical-harness.js';
import { SPATIAL_SYMBOLS } from '../src/components/optical/symbols.js';

test('optical field sleeps when hidden, resumes one loop, and releases every listener/animation', () => {
  const host = createOpticalHost();
  host.step(10000);
  assert.equal(host.pendingFrames, 1);
  host.visible(false);
  assert.equal(host.pendingFrames, 0);
  host.resetCounts();
  host.step(11000);
  assert.equal(host.counts.writes, 0);
  host.visible(true); host.visible(true);
  assert.equal(host.pendingFrames, 1);
  host.step(12000);
  assert.equal(host.pendingFrames, 1);
  host.unmount();
  assert.equal(host.pendingFrames, 0);
  assert.equal(host.window.listenerCount + host.document.listenerCount, 0);
  assert.ok(host.nodes.flatMap((el) => el.animations).every((animation) => animation.cancelled));
  host.visible(true);
  assert.equal(host.pendingFrames, 0);
});

test('responsive visibility, tap tracking, focus release, and live symbol changes remain correct', () => {
  const host = createOpticalHost(undefined, { width: 412, height: 915, coarse: true });
  host.step(10000);
  SPATIAL_SYMBOLS.forEach((item, i) => {
    assert.equal(host.result.elementsRef.current[i].style.display, item.mobileHidden ? 'none' : 'block');
  });
  host.result.focusOnSymbolRef.current(SPATIAL_SYMBOLS[6], 6);
  host.step(10250);
  assert.equal(host.state.activeFocusedId, SPATIAL_SYMBOLS[6].id);
  assert.equal(host.state.reticle.trackIndex, 6);
  assert.ok(Number(host.result.reticleRef.current.style.opacity) > 0);
  host.step(14500);
  assert.equal(host.state.activeFocusedId, null);
  assert.equal(host.result.reticleRef.current.style.opacity, '0');
  host.resize(1280, 900); host.step(14516);
  assert.ok(host.result.elementsRef.current.every((el) => el.style.display === 'block'));
  const changed = SPATIAL_SYMBOLS.map((item) => ({ ...item, x: item.x / 2, z: 0.4 }));
  host.update({ symbols: changed, focusMode: 'persona', focusZ: 0.4, opacityCap: 0.5, minBlur: 1.5 });
  host.step(14532);
  assert.equal(host.result.wrappersRef.current[0].style.left, `${changed[0].x}%`);
  assert.equal(host.state.currentPositions[0].z, 0.4);
  assert.equal(host.warnings.length, 0);
  host.unmount();
});

test('120 Hz remains uncapped; stationary dust needs no per-frame DOM updates', () => {
  const host = createOpticalHost();
  host.step(10000);
  const dustTransforms = host.result.dustRef.current.map((el) => el.style.transform);
  host.resetCounts();
  exerciseOpticalHost(host, 120, 120);
  assert.equal(host.counts.frameCalls, 120);
  assert.deepEqual(host.result.dustRef.current.map((el) => el.style.transform), dustTransforms);
  assert.equal(host.counts.byProperty.display || 0, 0);
  assert.ok(host.counts.writes < 2500, `unexpected per-frame DOM work: ${host.counts.writes}`);
  assert.equal(host.warnings.length, 0);
  host.unmount();
});

test('browsers without WAAPI preserve the original sinusoidal dust pulse', () => {
  const host = createOpticalHost(undefined, { waapi: false });
  host.step(12345);
  host.result.dustRef.current.forEach((el, i) => {
    assert.equal(el.style.opacity, (0.3 + 0.5 * Math.sin(12345 * 0.0018 + i * 1.2)).toFixed(2));
  });
  assert.equal(host.warnings.length, 0);
  host.unmount();
});

test('Strict Mode effect restart keeps a single live loop and one animation per dust node', () => {
  const host = createOpticalHost();
  host.step(10000);
  const before = host.snapshot();
  host.restartEffects();
  assert.equal(host.pendingFrames, 1);
  host.step(10000);
  assert.deepEqual(host.snapshot().dust, before.dust);
  host.result.dustRef.current.forEach((el) => {
    assert.equal(el.animations.filter((animation) => !animation.cancelled).length, 1);
  });
  assert.equal(host.warnings.length, 0);
  host.unmount();
});

test('compositor pulse stays within 0.001 opacity of the sine, including the dark phase', () => {
  const host = createOpticalHost();
  const duration = 2 * Math.PI / 0.0018;
  for (let i = 0; i <= 4096; i++) {
    const time = duration * i / 4096;
    host.advance(time);
    const expected = Math.max(0, 0.3 + 0.5 * Math.sin(time * 0.0018));
    assert.ok(Math.abs(host.result.dustRef.current[0].opacity() - expected) < 0.001);
  }
  host.unmount();
});

test('persistent scenes suspend rendering, input and dust without recreating nodes or animations', () => {
  const host = createOpticalHost(undefined, { width: 412, height: 915, coarse: true });
  host.step(10000);
  const nodes = [...host.nodes];
  const animations = host.nodes.flatMap((node) => node.animations);
  const listeners = host.window.listenerCount + host.document.listenerCount;
  host.update({ active: false });
  assert.equal(host.pendingFrames, 0);
  assert.ok(animations.every((animation) => animation.playState === 'paused'));
  const state = JSON.stringify(host.state);
  const snapshot = host.snapshot();
  host.resetCounts();
  host.step(20000);
  host.window.emit('pointermove', { clientX: 100, clientY: 100, pointerType: 'mouse' });
  host.window.emit('pointerdown', { clientX: 100, clientY: 100, pointerType: 'touch' });
  host.window.emit('pointerleave');
  host.window.emit('deviceorientation', { beta: 75, gamma: 20 });
  host.result.focusOnSymbolRef.current(host.symbols[0], 0);
  assert.equal(JSON.stringify(host.state), state);
  assert.deepEqual(host.snapshot(), snapshot);
  assert.equal(host.counts.writes, 0);
  // Visibility changes must not wake an inactive scene.
  host.visible(false); host.visible(true);
  assert.equal(host.pendingFrames, 0);
  for (let i = 0; i < 12; i++) {
    host.update({ active: true });
    host.visible(true);
    assert.equal(host.pendingFrames, 1);
    host.step(20000 + i * 16);
    assert.equal(host.pendingFrames, 1);
    host.update({ active: false });
    assert.equal(host.pendingFrames, 0);
  }
  assert.deepEqual(host.nodes, nodes);
  assert.deepEqual(host.nodes.flatMap((node) => node.animations), animations);
  assert.ok(animations.every((animation) => !animation.cancelled));
  assert.equal(host.window.listenerCount + host.document.listenerCount, listeners);
  assert.equal(host.warnings.length, 0);
  host.unmount();
  assert.equal(host.window.listenerCount + host.document.listenerCount, 0);
});

test('inactive initial mount and scene changes resume with current symbols and no stale focus lock', () => {
  const host = createOpticalHost(undefined, { active: false });
  assert.equal(host.pendingFrames, 0);
  host.restartEffects();
  assert.equal(host.pendingFrames, 0);
  host.visible(false);
  host.update({ active: true });
  assert.equal(host.pendingFrames, 0);
  host.visible(true);
  host.step(10000);
  host.result.focusOnSymbolRef.current(host.symbols[0], 0);
  host.step(10016);
  assert.notEqual(host.state.activeFocusedId, null);
  host.update({ active: false });
  const symbols = host.symbols.map((item) => ({ ...item, id: `persona-${item.id}`, z: 0.4 }));
  host.update({ symbols, focusMode: 'persona', focusZ: 0.4 });
  assert.equal(host.state.activeFocusedId, null);
  assert.equal(host.state.reticle.trackIndex, -1);
  host.update({ active: true });
  host.step(10032);
  assert.equal(host.pendingFrames, 1);
  assert.equal(host.result.reticleRef.current.style.opacity, '0');
  assert.ok(host.state.currentPositions.every((position) => position.z === 0.4));
  assert.equal(host.warnings.length, 0);
  host.unmount();
});
