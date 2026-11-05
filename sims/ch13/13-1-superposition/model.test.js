// node --test sims/ch13/13-1-superposition/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 13.2.1: m1 = 6.0 kg, m2 = m3 = 4.0 kg at a = 2.0 cm (+y) and 2a (−x) → 4.12 × 10⁻⁶ N at 104°', () => {
  const s = M.forces({ m1: 6, m2: 4, r2: 2, phi2: 90, m3: 4, r3: 4, phi3: 180 });
  assert.equal((s.F12 * 1e6).toFixed(2), '4.00'); assert.equal((s.F13 * 1e6).toFixed(2), '1.00');
  // The textbook rounds F12 and F13 to 4.00 and 1.00 before adding; unrounded they give 4.125 × 10⁻⁶ N.
  assert.ok(Math.abs(s.F * 1e6 - 4.12) <= 0.01); assert.equal(Math.round(s.angle), 104);
  // The calculator's inverse tangent gives −76° (Fig. 13.2.1f); the grader names that mistake.
  const p = { m1: 6, m2: 4, r2: 2, phi2: 90, m3: 4, r3: 4, phi3: 180 };
  assert.equal(M.check(p, { FText: '4.12', aText: '-76' }).aReason, 'quadrant');
  assert.equal(M.check(p, { FText: '4.12', aText: '104' }).ok, true);
  assert.equal(M.check(p, { FText: '4.12', aText: '-256' }).ok, true);   // the same direction
});

test('Eq. 13.1.1: inverse square and proportional to each mass; superposition is a vector sum', () => {
  const p = { m1: 4, m2: 5, r2: 2, phi2: 60, m3: 8, r3: 3, phi3: 210 }, s = M.forces(p);
  close(M.forces({ ...p, r2: 4 }).F12, s.F12 / 4); close(M.forces({ ...p, m1: 8 }).F13, 2 * s.F13);
  close(s.net[0], s.v12[0] + s.v13[0]); close(Math.hypot(...s.v12), s.F12);
  assert.ok(s.F < s.F12 + s.F13);
});

test('grading with the named mistakes', () => {
  const p = { m1: 4, m2: 5, r2: 2, phi2: 60, m3: 8, r3: 3, phi3: 210 }, s = M.forces(p);
  assert.equal(M.check(p, { FText: (s.F * 1e6).toFixed(3), aText: s.angle.toFixed(1) }).ok, true);
  assert.equal(M.check(p, { FText: ((s.F12 + s.F13) * 1e6).toFixed(3), aText: s.angle.toFixed(1) }).FReason, 'scalarSum');
  assert.equal(M.check(p, { FText: (s.F * 1e6).toFixed(3), aText: (s.angle + 180).toFixed(1) }).aReason, 'quadrant');
});
