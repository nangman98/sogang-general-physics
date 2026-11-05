// node --test sims/ch12/12-1-ladder/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const deg = x => x * 180 / Math.PI;

test('Sample Problem 12.2.3: L = 12 m, h = 9.3 m, m = 45 kg at L/3, M = 72 kg at L/2 → F_w = 407 N, F_py = 1146.6 N', () => {
  const theta = deg(Math.asin(9.3 / 12));
  const s = M.forces({ L: 12, m: 45, M: 72, theta, d: 6, c: 1 / 3 });
  close(s.h, 9.3); assert.equal(s.a.toFixed(2), '7.58');
  // The textbook rounds a to 7.58 m first and gets 407 N; the unrounded a gives 407.55 N.
  assert.ok(Math.abs(s.Fw - 407) <= 1); close(s.Fpx, s.Fw); close(s.Fpy, 1146.6);
});

test('balance of forces and of torques about O and about the top end', () => {
  const p = { L: 5, m: 15, M: 70, theta: 60, d: 3, c: 0.5 }, s = M.forces(p), g = M.G;
  const x = q => q * Math.cos(Math.PI / 3);                          // horizontal distance from O for a point at q along the ladder
  // About O (Eq. 12.2.4 form).
  close(-s.h * s.Fw + x(p.d) * p.M * g + x(p.c * p.L) * p.m * g, 0);
  // About the top end (h, a): pavement forces now have moment arms.
  close(s.h * s.Fpx - s.a * s.Fpy + (s.a - x(p.d)) * p.M * g + (s.a - x(p.c * p.L)) * p.m * g, 0);
});

test('climb: friction needed at the reach equals μ_s F_py; the run stops there', () => {
  const p = { activity: 'climb', L: 5, m: 15, M: 70, theta: 60, mu: 0.3 }, r = M.reach(p);
  assert.ok(r.d > 0 && r.d < p.L);
  close(M.forces({ ...p, d: r.d }).Fw, p.mu * (p.M + p.m) * M.G);
  const end = M.stateAt(M.duration(p), p);
  close(end.d, r.d); assert.equal(end.slip, true);
  assert.equal(M.stateAt(0.5, p).slip, false);
  assert.equal(M.reach({ ...p, mu: 0.6 }).top, true);                // a rough pavement lets the person reach the top
});

test('grading with the named mistakes', () => {
  const p = { activity: 'forces', L: 5, m: 15, M: 70, theta: 60, d: 3 }, s = M.forces(p);
  assert.equal(M.checkForces(p, { wText: s.Fw.toFixed(1), yText: s.Fpy.toFixed(1) }).ok, true);
  assert.equal(M.checkForces(p, { wText: (s.Fw * s.h * s.h / s.a / s.a).toFixed(1), yText: s.Fpy.toFixed(1) }).wReason, 'swap');
  assert.equal(M.checkForces(p, { wText: s.Fw.toFixed(1), yText: (70 * 9.8).toFixed(1) }).yReason, 'personOnly');
  assert.equal(M.checkForces(p, { wText: (9.8 * s.a * 70 * 3 / 5 / s.h).toFixed(1), yText: s.Fpy.toFixed(1) }).wReason, 'noLadder');
  const c = { activity: 'climb', L: 5, m: 15, M: 70, theta: 60, mu: 0.3 }, r = M.reach(c);
  assert.equal(M.checkClimb(c, { dText: r.d.toFixed(2) }).ok, true);
  assert.equal(M.checkClimb(c, { dText: (5 * 0.3 * 85 * Math.tan(Math.PI / 3) / 70).toFixed(2) }).reason, 'noLadder');
});
