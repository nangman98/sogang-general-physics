// node --test sims/ch16/16-1-traveling-wave/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const S0 = { activity: 'speed', tau: 12, m: 1.8, f: 2.5, ym: 20 };
const E0 = { activity: 'element', ym: 20, lam: 2.4, fe: 1.6 };

test('Sample Problem 16.1.1: λ = 10 mm → k = 200π rad/m, T = 20 ms → ω = 100π rad/s', () => {
  const s = M.wave({ ym: 0.3, lam: 0.010, fe: 1 / 0.020 });
  close(s.k, 200 * Math.PI); close(s.w, 100 * Math.PI);
});

test('Sample Problem 16.1.2: u = 7.20 mm/s and a_y = −14.2 mm/s² at x = 22.5 cm, t = 18.9 s', () => {
  const s = { ym: 0.00327, k: 72.1, w: 2.72 };
  assert.equal((M.uAt(0.225, 18.9, s) * 1e3).toFixed(2), '7.20');
  assert.equal((M.ayAt(0.225, 18.9, s) * 1e3).toFixed(1), '-14.2');
});

test('Sample Problem 16.2.1: τ = 400 N, pulses reach the knot after 1.77 × 10⁻³ s and 1.67 × 10⁻³ s', () => {
  const t1 = 3.0 / M.waveSpeed(400, 1.4e-4), t2 = 2.0 / M.waveSpeed(400, 2.8e-4);
  assert.equal((t1 * 1e3).toFixed(2), '1.77'); assert.equal((t2 * 1e3).toFixed(2), '1.67');
});

test('driven rope: v = √(τ/μ) = λf = ω/k, end motion −y_m sin ωt, straight ahead of x = vt, wave equation behind it', () => {
  const s = M.rope(S0);
  close(s.mu, 0.3); close(s.v, Math.sqrt(40)); close(s.v, s.lam * s.f); close(s.v, s.w / s.k);
  for (const t of [0.05, 0.31, 0.77]) close(M.ropeY(0, t, s), -s.ym * Math.sin(s.w * t));   // Eq. 16.1.6
  assert.equal(M.ropeY(s.v * 0.4 + 0.01, 0.4, s), 0);
  const o = M.speedAt(s.tEnd, S0);
  close(o.front, M.LROPE); close(M.ropeY(o.crest, s.tEnd, s), s.ym);                        // first peak at vt − 3λ/4
  // Central differences: ∂²y/∂t² = v² ∂²y/∂x² (Eq. 16.4.12) and ∂y/∂t = u (Eq. 16.1.20) behind the leading point.
  const h = 1e-4, y = (x, t) => M.ropeY(x, t, s);
  for (const [x, t] of [[0.4, 0.5], [1.7, 0.8], [3.1, 0.9]]) {
    const ytt = (y(x, t + h) - 2 * y(x, t) + y(x, t - h)) / (h * h), yxx = (y(x + h, t) - 2 * y(x, t) + y(x - h, t)) / (h * h);
    close(ytt, s.v * s.v * yxx, 1e-5);
    close((y(x, t + h) - y(x, t - h)) / (2 * h), M.ropeU(x, t, s), 1e-6);
  }
});

test('string element at x = 0: first reaches +y_m at 3T/4, u_max = ωy_m, a_y = −ω²y', () => {
  const s = M.wave(E0);
  close(M.elementAt(s.tTop, E0).y0, s.ym);
  for (let i = 0; i < 300; i++) { const t = s.tTop * i / 300; assert.ok(M.elementAt(t, E0).y0 < s.ym - 1e-9); }
  let um = 0; for (let i = 0; i <= 2000; i++) um = Math.max(um, Math.abs(M.elementAt(2 * s.T * i / 2000, E0).u0));
  close(um, s.umax, 1e-5);
  for (const t of [0.1, 0.37]) { const o = M.elementAt(t, E0); close(o.a0, -s.w * s.w * o.y0); }
  const o = M.elementAt(0.2, E0); close(M.yAt(o.crest, 0.2, s), s.ym); assert.ok(o.crest >= M.XE[0] && o.crest < M.XE[1]);
});

test('grading with the named mistakes, each more than 2% from the answer at the default values', () => {
  const s = M.rope(S0), w = M.wave(E0);
  assert.equal(M.checkSpeed(S0, { vText: s.v.toFixed(3), lText: s.lam.toFixed(3) }).ok, true);
  const vMis = { noRoot: 12 / s.mu, inverted: Math.sqrt(s.mu / 12), mass: Math.sqrt(12 / 1.8) };
  for (const [k, v] of Object.entries(vMis)) { assert.equal(M.checkSpeed(S0, { vText: v.toFixed(4), lText: '1' }).vReason, k); assert.ok(Math.abs(v - s.v) > 0.02 * s.v); }
  const lMis = { times: s.v * s.f, omega: s.v / s.w };
  for (const [k, l] of Object.entries(lMis)) { assert.equal(M.checkSpeed(S0, { vText: '1', lText: l.toFixed(4) }).lReason, k); assert.ok(Math.abs(l - s.lam) > 0.02 * s.lam); }
  assert.equal(M.checkElement(E0, { uText: w.umax.toFixed(3), tText: w.tTop.toFixed(4) }).ok, true);
  const uMis = { waveSpeed: w.v, noTwoPi: w.f * w.ym, accel: w.amax, cm: w.umax * 100 };
  for (const [k, u] of Object.entries(uMis)) { assert.equal(M.checkElement(E0, { uText: u.toFixed(4), tText: '1' }).uReason, k); assert.ok(Math.abs(u - w.umax) > 0.02 * w.umax); }
  const tMis = { upFirst: w.T / 4, half: w.T / 2, full: w.T };
  for (const [k, t] of Object.entries(tMis)) { assert.equal(M.checkElement(E0, { uText: '1', tText: t.toFixed(4) }).tReason, k); assert.ok(Math.abs(t - w.tTop) > 0.02 * w.tTop); }
  assert.equal(M.checkSpeed(S0, { vText: 'abc', lText: '1' }).vReason, 'unreadable');
});
