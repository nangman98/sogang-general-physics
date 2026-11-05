// node --test sims/ch16/16-3-standing-waves/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const R0 = { activity: 'resonance', L: 3.6, tau: 15, mu: 400, n: 3 };
const N0 = { activity: 'nodes', nN: 3, ym: 7, xP: 62 };

test('Sample Problem 16.7.1: L = 30.3 cm, f = 62.0 Hz, third harmonic → T = 16.1 ms, λ = 20.2 cm, v = 12.5 m/s, τ = 5.85 × 10⁻² N', () => {
  const L = 0.303, f = 62.0, mu = 3.73e-4, v = 2 * L * f / 3, tau = mu * v * v;   // f = 3v/2L (Eq. 16.7.9), v = √(τ/μ)
  assert.equal((v).toFixed(1), '12.5'); assert.equal((tau * 100).toFixed(2), '5.85');
  const s = M.resonance({ L, tau, mu: mu * 1000, n: 3 });
  close(s.f, 62.0, 1e-12); assert.equal((s.T * 1e3).toFixed(1), '16.1'); assert.equal((s.lam * 100).toFixed(1), '20.2');
});

test('harmonic series f_n = n f_1 (Checkpoint 16.7.2: f_1 = 75 Hz gives 150, 225, 300, 375 Hz and f_7 = 525 Hz)', () => {
  const tau = 0.25e-3 * (2 * 1.0 * 75) ** 2;             // a 1.00 m string with f_1 = 75 Hz
  const f = n => M.resonance({ L: 1.0, tau, mu: 0.25, n }).f;
  [75, 150, 225, 300, 375].forEach((g, i) => close(f(i + 1), g, 1e-12)); close(f(7), 525, 1e-12);
});

test('standing wave: sum of the two traveling waves, fixed ends and nodes stay at rest, antinodes reach 2y_m, nodes λ/2 apart', () => {
  for (const n of [1, 2, 3, 5]) {
    const s = M.resonance({ ...R0, n }), ym = 0.05;
    for (const t of [0, 0.13, 0.41, 0.97]) {
      for (const x of [0.2, 1.1, 2.9]) close(M.standY(x, t, s, ym), M.travel1(x, t, s, ym) + M.travel2(x, t, s, ym), 1e-12);
      for (const x of M.nodes(s)) assert.ok(Math.abs(M.standY(x, t, s, ym)) < 1e-12);
    }
    close(M.nodes(s)[n], s.L, 1e-12);                                   // the far end is the last node
    for (const x of M.antinodes(s)) close(Math.abs(M.standY(x, 0, s, ym)), 2 * ym, 1e-12);
    const nd = M.nodes(s); for (let i = 1; i < nd.length; i++) close(nd[i] - nd[i - 1], s.lam / 2, 1e-12);
  }
});

test('element at x_P: amplitude |2y_m sin kx|, u = ∂y′/∂t by central differences, u_max = ωA', () => {
  const q = M.probe(N0), s = q.s, h = 1e-6;
  close(s.v, 6.0, 1e-12); close(s.f, 3.0, 1e-12);
  for (const t of [0.05, 0.21, 0.6]) close((M.standY(q.x, t + h, s, q.ym) - M.standY(q.x, t - h, s, q.ym)) / (2 * h), M.standU(q.x, t, s, q.ym), 1e-6);
  let um = 0, ym = 0;
  for (let i = 0; i <= 4000; i++) { const o = M.stateAt(2 * s.T * i / 4000, N0); um = Math.max(um, Math.abs(o.uP)); ym = Math.max(ym, Math.abs(o.yP)); }
  close(um, q.umax, 1e-5); close(ym, q.A, 1e-5);
});

test('playback: one period lasts TVIS on the screen, or real time for slow modes', () => {
  const s = M.system(R0); close(s.T / M.playScale(R0), M.TVIS); assert.ok(M.playScale(R0) < 1);
  const slow = { ...R0, L: 5, tau: 5, mu: 800, n: 1 }; assert.equal(M.playScale(slow), 1);
});

test('grading with the named mistakes, each more than 2% from the answer at the default values', () => {
  const s = M.resonance(R0);
  assert.equal(M.checkResonance(R0, { lText: s.lam.toFixed(3), fText: s.f.toFixed(3) }).ok, true);
  const lMis = { loop: 3.6 / 3, fundamental: 7.2 };
  for (const [k, l] of Object.entries(lMis)) { assert.equal(M.checkResonance(R0, { lText: l.toFixed(4), fText: '1' }).lReason, k); assert.ok(Math.abs(l - s.lam) > 0.02 * s.lam); }
  const fMis = { loop: 3 * s.v / 3.6, fundamental: s.v / 7.2, units: Math.sqrt(15 / 400) / s.lam, times: s.v * s.lam };
  for (const [k, f] of Object.entries(fMis)) { assert.equal(M.checkResonance(R0, { lText: '1', fText: f.toFixed(4) }).fReason, k); assert.ok(Math.abs(f - s.f) > 0.02 * s.f); }
  const q = M.probe(N0), kx = q.s.k * q.x, A = q.A * 100;
  assert.equal(M.checkNodes(N0, { aText: A.toFixed(3), uText: q.umax.toFixed(3) }).ok, true);
  const aMis = { everywhere: 14, noTwo: A / 2, cos: Math.abs(14 * Math.cos(kx)), degrees: Math.abs(14 * Math.sin(kx * Math.PI / 180)) };
  for (const [k, a] of Object.entries(aMis)) { assert.equal(M.checkNodes(N0, { aText: a.toFixed(4), uText: '1' }).aReason, k); assert.ok(Math.abs(a - A) > 0.02 * A); }
  const uMis = { waveSpeed: 6, noTwoPi: q.s.f * q.A, antinode: q.s.w * 0.14, accel: q.s.w ** 2 * q.A, cm: q.umax * 100 };
  for (const [k, u] of Object.entries(uMis)) { assert.equal(M.checkNodes(N0, { aText: '1', uText: u.toFixed(4) }).uReason, k); assert.ok(Math.abs(u - q.umax) > 0.02 * q.umax); }
});
