// node --test sims/ch15/15-1-spring-shm-energy/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const deg = r => r * 180 / Math.PI;
const P = { m: 0.8, k: 20, xm: 10, start: 'right' };

test('Eqs. 15.1.6–15.1.8 and 15.1.10: v = dx/dt, a = dv/dt = −ω²x, F = ma = −kx (central differences)', () => {
  for (const start of Object.keys(M.START)) {
    const p = { ...P, start }, s = M.oscillator(p), h = 1e-5, x = t => M.stateAt(t, p).x, v = t => M.stateAt(t, p).v;
    for (const t of [0.1, 0.47, 1.3, 2.2]) {
      const o = M.stateAt(t, p);
      close((x(t + h) - x(t - h)) / (2 * h), o.v, 1e-7);
      close((v(t + h) - v(t - h)) / (2 * h), o.a, 1e-7);
      close(o.a, -s.w * s.w * o.x, 1e-12);
      close(p.m * o.a, o.F, 1e-12); close(o.F, -p.k * o.x, 1e-12);
    }
  }
});

test('Eqs. 15.1.5, 15.1.12, 15.1.13: ω = √(k/m) = 2π/T; the motion repeats after T; amplitudes vm = ωxm, am = ω²xm', () => {
  const s = M.oscillator(P);
  close(s.w, 5); close(s.T, 2 * Math.PI / 5); close(s.T, M.periodOf(0.8, 20)); close(s.f * s.T, 1);
  for (const t of [0, 0.3, 0.9]) { close(M.stateAt(t + s.T, P).x, M.stateAt(t, P).x, 1e-12); close(M.stateAt(t + s.T, P).v, M.stateAt(t, P).v, 1e-12); }
  close(M.duration(P), M.RUN); close(M.duration({ ...P, m: 2, k: 5 }), M.RUN);     // the run length does not depend on T
  close(Math.abs(M.stateAt(s.T / 4, P).v), s.vm); close(s.vm, 0.5); close(Math.abs(M.stateAt(0, P).a), s.am); close(s.am, 2.5);
});

test('Fig. 15.1.4: the start choices give ϕ = 0, π/2, π, 3π/2 (position and direction at t = 0)', () => {
  const o = start => M.stateAt(0, { ...P, start }), A = 0.1;
  close(o('right').x, A); close(o('right').v, 0, 1e-12);
  close(o('left').x, -A); close(o('left').v, 0, 1e-12);
  close(o('middleLeft').x, 0, 1e-12); assert.ok(o('middleLeft').v < 0);
  close(o('middleRight').x, 0, 1e-12); assert.ok(o('middleRight').v > 0);
});

test('Eqs. 15.2.1–15.2.4: K + U = ½kxm² at every instant; all kinetic at x = 0, all potential at x = ±xm', () => {
  for (const start of Object.keys(M.START)) {
    const p = { ...P, start }, s = M.oscillator(p);
    for (let i = 0; i <= 40; i++) close(M.stateAt(i * s.T / 17, p).E, s.E, 1e-12);
  }
  const s = M.oscillator(P);
  close(M.stateAt(s.T / 4, P).K, s.E); close(M.stateAt(s.T / 4, P).U, 0, 1e-12);
  close(M.stateAt(s.T / 2, P).U, s.E); close(M.stateAt(s.T / 2, P).K, 0, 1e-12);
});

test('Sample Problem 15.1.1: board end acts as a = −(3k/m)x, T = 2π√(m/3k) = 0.35 s (m = 12 kg, k = 1300 N/m)', () => {
  assert.equal(M.periodOf(12, 3 * 1300).toFixed(2), '0.35');
});

test('Sample Problem 15.1.2: x(0) = −8.50 cm, v(0) = −0.920 m/s, a(0) = +47.0 m/s² → ω = 23.5 rad/s, ϕ = 155°, xm = 9.4 cm', () => {
  const r = M.fromInitial(-0.085, -0.92, 47.0);
  assert.equal(r.w.toFixed(1), '23.5');
  assert.equal(Math.round(deg(r.phi)), 155);
  assert.equal((r.xm * 100).toFixed(1), '9.4');
  // The textbook rounds ϕ to 155°. With the unrounded ϕ = 155.3° the three initial values come back exactly.
  const x0 = r.xm * Math.cos(r.phi), v0 = -r.w * r.xm * Math.sin(r.phi), a0 = -r.w * r.w * r.xm * Math.cos(r.phi);
  close(x0, -0.085); close(v0, -0.92); close(a0, 47.0);
});

test('Sample Problem 15.2.1: m = 2.72 × 10⁵ kg, f = 10.0 Hz, xm = 20.0 cm → E = 2.147 × 10⁷ J, vm = 12.6 m/s', () => {
  const m = 2.72e5, k = m * (2 * Math.PI * 10) ** 2, s = M.oscillator({ m, k, xm: 20 });
  // The textbook carries k = 1.073 × 10⁹ N/m (unrounded 1.0738 × 10⁹), so it prints E = 2.147 × 10⁷ J where the
  // unrounded value is 2.148 × 10⁷ J. Both give the answer E ≈ 2.1 × 10⁷ J and vm = 12.6 m/s.
  assert.ok(Math.abs(k / 1.073e9 - 1) < 1e-3); assert.ok(Math.abs(s.E / 2.147e7 - 1) < 1e-3);
  assert.equal((s.E / 1e7).toFixed(1), '2.1');
  assert.equal(s.vm.toFixed(1), '12.6');
});

test('Sample Problem 15.2.2: m = 680 g, k = 65 N/m, xm = 11 cm → E = 0.393 J, at x = xm/2 U = 0.098 J, K = 0.30 J', () => {
  const p = { m: 0.68, k: 65, xm: 11, start: 'right' }, s = M.oscillator(p);
  assert.equal(s.E.toFixed(3), '0.393');
  const o = M.stateAt(Math.PI / 3 / s.w, p);               // cos(ωt) = ½
  close(o.x, 0.055, 1e-12);
  // K = 0.2949 J. The textbook subtracts the rounded values, 0.393 − 0.098 = 0.295 ≈ 0.30 J.
  assert.equal(o.U.toFixed(3), '0.098'); assert.equal(o.K.toFixed(3), '0.295'); close(o.K, s.E - o.U, 1e-12);
});

test('grading with the named mistakes; at the defaults every mistake is more than 2 % away from the answer', () => {
  const s = M.oscillator(P), mk = M.mistakes(P);
  for (const v of Object.values(mk.T)) assert.ok(!M.near(v, s.T), `T mistake ${v}`);
  for (const v of Object.values(mk.v)) assert.ok(!M.near(v, s.vm), `v mistake ${v}`);
  assert.equal(M.check(P, { TText: s.T.toFixed(3), vText: s.vm.toFixed(3) }).ok, true);
  for (const [why, val] of Object.entries(mk.T)) assert.equal(M.check(P, { TText: String(val), vText: '0.5' }).TReason, why);
  for (const [why, val] of Object.entries(mk.v)) assert.equal(M.check(P, { TText: '1.257', vText: String(val) }).vReason, why);
  assert.equal(M.check(P, { TText: 'abc', vText: '0.5' }).TReason, 'unreadable');
});
