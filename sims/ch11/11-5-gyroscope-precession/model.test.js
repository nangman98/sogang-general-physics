// node --test sims/ch11/11-5-gyroscope-precession/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

test('Eq. 11.9.6: Ω = Mgr/(Iω); with I = ½MR_w² the mass cancels (LO 11.9.3)', () => {
  const base = { Rw: 0.2, r: 0.3, w: 150, sense: 'out' };
  const a = M.gyro({ ...base, M: 0.5 }), b = M.gyro({ ...base, M: 3 });
  close(a.Om, 2 * M.G * 0.3 / (0.04 * 150)); close(a.Om, b.Om);
  close(a.tau, 0.5 * M.G * 0.3); close(a.L, 0.5 * 0.5 * 0.04 * 150);
});

test('Checkpoint 11.9.1 trends: Ω falls as ω grows, stays with M, falls with smaller g', () => {
  const p = { M: 1.2, Rw: 0.2, r: 0.3, w: 150, sense: 'out' };
  assert.ok(M.gyro({ ...p, w: 300 }).Om < M.gyro(p).Om);
  close(M.gyro({ ...p, M: 2.4 }).Om, M.gyro(p).Om);
  close(M.gyro(p, 9.7).Om / M.gyro(p).Om, 9.7 / M.G);
});

test('dL⃗/dt equals τ⃗ = r⃗ × M g⃗ at every instant, for both spin senses', () => {
  for (const sense of ['out', 'in']) {
    const p = { M: 1.2, Rw: 0.2, r: 0.3, w: 150, sense }, h = 1e-5;
    for (const t of [0.5, 2, 5]) {
      const a = M.stateAt(t - h, p).Lvec, b = M.stateAt(t + h, p).Lvec, dL = a.map((x, i) => (b[i] - x) / (2 * h));
      const e = M.stateAt(t, p).shaft, tau = cross(e.map(c => c * p.r), [0, -p.M * M.G, 0]);
      for (let i = 0; i < 3; i++) close(dL[i], tau[i], 1e-6);
      close(Math.hypot(...M.stateAt(t, p).Lvec), M.gyro(p).L);       // only the direction changes
    }
  }
  assert.equal(M.gyro({ M: 1, Rw: 0.2, r: 0.3, w: 150, sense: 'out' }).turn, 'ccw');
  assert.equal(M.gyro({ M: 1, Rw: 0.2, r: 0.3, w: 150, sense: 'in' }).turn, 'cw');
});

test('grading with the named mistakes', () => {
  const p = { M: 1.2, Rw: 0.2, r: 0.3, w: 150, sense: 'out' }, s = M.gyro(p);
  assert.equal(M.check(p, { OText: s.Om.toFixed(3), pick: 'ccw' }).ok, true);
  assert.equal(M.check(p, { OText: s.Om.toFixed(3), pick: 'cw' }).pickReason, 'wrong');
  assert.equal(M.check(p, { OText: (s.L / s.tau).toFixed(3), pick: 'ccw' }).OReason, 'inverse');
  assert.equal(M.check(p, { OText: (s.Om / 2).toFixed(3), pick: 'ccw' }).OReason, 'hoopI');
  assert.equal(M.check(p, { OText: (s.Om * 2 * Math.PI).toFixed(3), pick: 'ccw' }).OReason, 'twoPi');
});
