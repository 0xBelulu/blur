import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createOpticalHost, exerciseOpticalHost, opticalSource } from './optical-harness.js';
import { solveProfile } from '../src/utils/blurEngine.js';
import { buildPersonaSymbols } from '../src/utils/personaSymbols.js';

const base = process.argv[2] || 'HEAD';
assert.match(base, /^[\w./~-]+$/, 'Expected a local git ref');
const before = execFileSync('git', ['show', `${base}:src/components/optical/useOpticalField.js`], { encoding: 'utf8' });
const after = opticalSource();
const reports = [];
for (const [mode, fps, options] of [
  ['idle', 60, {}], ['pointer', 60, {}], ['gyro', 120, { width: 412, height: 915, coarse: true }],
  ['persona', 120, { symbols: buildPersonaSymbols(solveProfile([]).field), focusMode: 'persona', focusZ: 0.4, opacityCap: 0.5, minBlur: 1.5 }],
]) {
  const oldHost = createOpticalHost(before, options);
  const newHost = createOpticalHost(after, options);
  const oldFrames = exerciseOpticalHost(oldHost, 600, fps, mode);
  const newFrames = exerciseOpticalHost(newHost, 600, fps, mode);
  let maxPulseDifference = 0;
  for (let i = 0; i < oldFrames.length; i++) {
    const old = oldFrames[i], current = newFrames[i];
    for (let j = 0; j < old.dust.length; j++) {
      assert.equal(current.dust[j].transform, old.dust[j].transform);
      maxPulseDifference = Math.max(maxPulseDifference, Math.abs(old.dust[j].opacity - current.dust[j].opacity));
    }
    assert.ok(maxPulseDifference < 0.006, `dust pulse changed by ${maxPulseDifference}`);
    delete old.dust; delete current.dust;
    assert.deepEqual(current, old, `visual state changed: ${mode}, frame ${i * 20}`);
  }
  assert.equal(newHost.warnings.length, 0);
  reports.push({ mode, fps, frames: 600, beforeWrites: oldHost.counts.writes, afterWrites: newHost.counts.writes,
    reduction: `${(100 * (1 - newHost.counts.writes / oldHost.counts.writes)).toFixed(1)}%`, maxPulseDifference });
  oldHost.unmount(); newHost.unmount();
}
console.log('Deterministic JS/DOM comparison; this does not measure GPU paint time or device FPS.');
console.table(reports);
