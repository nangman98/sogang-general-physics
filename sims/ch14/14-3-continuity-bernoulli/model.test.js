// node --test sims/ch14/14-3-continuity-bernoulli/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 14.7.1 form: horizontal pipe, A2 = A1/2 → R_V = A1√(2Δp/3ρ)', () => {
  // With ρ = 791 kg/m³ and Δp = 4120 Pa the textbook gets 2.24 × 10⁻³ m³/s; the same relation holds here for water.
  const A1 = 1.20e-3, rho = 791, dp = 4120; assert.equal((A1 * Math.sqrt(2 * dp / (3 * rho)) * 1e3).toFixed(2), '2.24');
  const p = { A1: 60, A2: 30, v1: 1.3, dy: 0, p1: 50 }, s = M.flow(p);
  close(s.R, 60e-4 * Math.sqrt(2 * s.dp / (3 * M.RHO)));
});

test('Sample Problem 14.6.1: continuity with free fall, A0 = 1.2 cm², A = 0.35 cm², h = 45 mm → v0 = 28.6 cm/s, R_V = 34 cm³/s', () => {
  const A0 = 1.2, A = 0.35, h = 0.045, v0 = Math.sqrt(2 * 9.8 * h * A * A / (A0 * A0 - A * A));
  assert.equal((v0 * 100).toFixed(1), '28.6'); assert.equal(Math.round(A0 * v0 * 100), 34);
});

test('continuity and Bernoulli hold at every point; R_V is the same everywhere', () => {
  const p = { A1: 60, A2: 20, v1: 1, dy: 0.5, p1: 50 }, s = M.flow(p);
  close(s.v2, 3);
  const B = q => q.p + 0.5 * M.RHO * q.v ** 2 + M.RHO * M.G * q.y;
  const B0 = B(M.at_x(0, p));
  for (const x of [1, 3.5, 4.2, 6, 8]) { const q = M.at_x(x, p); close(B(q), B0, 1e-12); close(q.v * q.A, s.R, 1e-12); }
  close(M.at_x(8, p).p, s.p2, 1e-12);
});

test('tracer particles: travel time integrates dx/v and the motion follows the local speed', () => {
  const p = { A1: 60, A2: 20, v1: 1, dy: 0, p1: 50 }, T = M.travelTime(p);
  // Horizontal pipe: wide part 3 m at 1 m/s and narrow part 3 m at 3 m/s; the taper time is between.
  assert.ok(T > 3 + 1 + 2 / 3 && T < 3 + 1 + 2);
  const dt = 1e-3, x0 = M.xAt(0.5, p), x1 = M.xAt(0.5 + dt, p); close((x1 - x0) / dt, 1, 1e-3);
  const y0 = M.xAt(T - 0.3, p), y1 = M.xAt(T - 0.3 + dt, p); close((y1 - y0) / dt, 3, 1e-3);
});

test('grading with the named mistakes', () => {
  const p = { A1: 60, A2: 20, v1: 1, dy: 0.5, p1: 50 }, s = M.flow(p);
  assert.equal(M.check(p, { vText: '3', pText: (s.p2 / 1e3).toFixed(2) }).ok, true);
  assert.equal(M.check(p, { vText: (1 / 3).toFixed(3), pText: (s.p2 / 1e3).toFixed(2) }).vReason, 'inverse');
  assert.equal(M.check(p, { vText: '3', pText: ((50e3 - 3992) / 1e3).toFixed(3) }).pReason, 'noHeight');
  assert.equal(M.check(p, { vText: '3', pText: ((50e3 + s.dp) / 1e3).toFixed(2) }).pReason, 'sign');
});
