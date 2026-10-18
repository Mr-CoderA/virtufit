import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapFinger, DwellSelector, isPointing } from '../../src/components/fitting-room/gesture.mjs';
test('mirroring and cover crop map the finger onto the same screen position', () => {
  const rect = { left: 20, top: 50, width: 1000, height: 1000 };
  assert.deepEqual(mapFinger({ x: .5, y: .5 }, 1600, 900, rect), { x: 520, y: 550 });
  assert.ok(mapFinger({ x: 0, y: .5 }, 1600, 900, rect).x > rect.left + rect.width);
  assert.deepEqual(mapFinger({ x: 1, y: 0 }, 1000, 1000, rect), { x: 20, y: 50 });
});
test('one-second dwell fires once and rearms after leaving', () => {
  const s = new DwellSelector(), p = { x: 100, y: 100 };
  assert.equal(s.update('coat', p, 0).progress, 0);
  assert.equal(s.update('coat', p, 999).selected, null);
  assert.equal(s.update('coat', p, 1000).selected, 'coat');
  assert.equal(s.update('coat', p, 2000).selected, null);
  s.update(null, null, 2100);
  s.update('coat', p, 2200);
  assert.equal(s.update('coat', p, 3200).selected, 'coat');
});
test('changing target or moving too far resets the timer', () => {
  const s = new DwellSelector(); s.update('a', { x: 0, y: 0 }, 0);
  assert.equal(s.update('b', { x: 0, y: 0 }, 900).progress, 0);
  assert.equal(s.update('b', { x: 80, y: 0 }, 1900).progress, 0);
});
test('missing hand cannot trigger selection', () => assert.equal(isPointing([]), false));
