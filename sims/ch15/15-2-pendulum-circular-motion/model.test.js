// node --test sims/ch15/15-2-pendulum-circular-motion/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const rad = d => d * Math.PI / 180;
const S = { activity: 'pendulum', kind: 'simple', L: 1.2, thetaM: 60 };
const R = { ...S, kind: 'rod' };
const C = { activity: 'circle', xm: 20, w: 2.5, phi: 60 };

test('Eqs. 15.4.5–15.4.7, 15.4.10: T = 2π√(L/g) for the bob; the rod has I = mL²/3, h = L/2, so T = 2π√(I/mgh) = 2π√(2L/3g)', () => {
  close(M.smallPeriod(S), 2 * Math.PI * Math.sqrt(1.2 / 9.8));
  const m = 2, I = m * 1.2 ** 2 / 12 + m * 0.6 ** 2, h = 0.6;                  // parallel-axis theorem, Eq. 15.4.7
  close(I, m * 1.2 ** 2 / 3); close(M.smallPeriod(R), 2 * Math.PI * Math.sqrt(I / (m * M.G * h)));
  close(M.effLength(R), 0.8);
});

test('Sample Problem 15.4.1: meter stick pivoted at one end, T = 1.64 s and center of oscillation L0 = 2L/3 = 66.7 cm', () => {
  const p = { kind: 'rod', L: 1.0, thetaM: 5 };
  assert.equal(M.smallPeriod(p).toFixed(2), '1.64');
  assert.equal((M.effLength(p) * 100).toFixed(1), '66.7');
  close(M.smallPeriod(p), M.smallPeriod({ kind: 'simple', L: M.effLength(p) }));   // Eq. 15.4.11: same period as a simple pendulum of L0
});

test('stored RK4 motion: starts at θm at rest, satisfies d²θ/dt² = −(g/Le) sin θ (Eq. 15.4.2), keeps its energy, repeats after T', () => {
  for (const p of [S, R, { ...S, thetaM: 80, L: 0.5 }]) {
    const w2 = M.G / M.effLength(p), T = M.exactPeriod(p), h = 1e-4, th = t => M.pendulumAt(t, p).theta;
    close(th(0), rad(p.thetaM), 1e-12); close(M.pendulumAt(0, p).omega, 0, 1e-12);
    for (const t of [0.13, 0.71, 1.9, 3.3]) {
      close((th(t + h) - 2 * th(t) + th(t - h)) / (h * h), -w2 * Math.sin(th(t)), 1e-4);
      const { theta, omega } = M.pendulumAt(t, p);
      close(0.5 * omega ** 2 - w2 * Math.cos(theta), -w2 * Math.cos(rad(p.thetaM)), 1e-8);   // energy per unit I
    }
    close(th(T), rad(p.thetaM), 1e-9); close(th(T / 2), -rad(p.thetaM), 1e-8); close(th(T / 4), 0, 1e-8);
  }
});

test('the AGM period agrees with a separate fixed-step RK4 run of the textbook equation (quarter period at θ = 0)', () => {
  for (const thetaM of [10, 45, 80]) {
    const p = { kind: 'simple', L: 1.5, thetaM }, w2 = M.G / p.L, dt = 1e-4;
    let th = rad(thetaM), om = 0, t = 0;
    const f = (a, b) => [b, -w2 * Math.sin(a)];
    while (th > 0) {
      const k1 = f(th, om), k2 = f(th + dt / 2 * k1[0], om + dt / 2 * k1[1]), k3 = f(th + dt / 2 * k2[0], om + dt / 2 * k2[1]), k4 = f(th + dt * k3[0], om + dt * k3[1]);
      const nth = th + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), nom = om + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (nth <= 0) { t += dt * th / (th - nth); th = nth; break; }
      th = nth; om = nom; t += dt;
    }
    close(4 * t, M.exactPeriod(p), 1e-6);
  }
});

test('small angles: the true period approaches 2π√(L/g); at 60° it is 7.3 % longer, the choice answer follows the 1 % rule', () => {
  close(M.exactPeriod({ ...S, thetaM: 0.01 }) / M.smallPeriod(S), 1, 1e-8);
  assert.ok(M.exactPeriod({ ...S, thetaM: 5 }) / M.smallPeriod(S) - 1 < 1e-3);    // sin 5° differs from 5° in rad by about 0.1 %
  assert.equal((M.exactPeriod(S) / M.smallPeriod(S)).toFixed(3), '1.073');
  assert.equal(M.periodChoice({ ...S, thetaM: 10 }), 'same'); assert.equal(M.periodChoice(S), 'longer');
  assert.equal(M.periodChoice({ ...R, thetaM: 22 }), 'same'); assert.equal(M.periodChoice({ ...R, thetaM: 24 }), 'longer');
  close(M.smallAt(0, S), rad(60)); close(M.smallAt(M.smallPeriod(S) / 2, S), -rad(60));
  close(M.duration(S), M.RUN); close(M.duration({ ...S, L: 3, thetaM: 5 }), M.RUN);          // run length does not reveal T
});

test('Eqs. 15.4.13–15.4.15: P is the x projection of P′; v = dx/dt, a = −ω²x; P′ has speed ωxm and radial acceleration ω²xm', () => {
  for (const phi of [0, 60, 135, 300]) {
    const p = { ...C, phi }, A = p.xm / 100, h = 1e-5;
    for (const t of [0, 0.4, 1.7]) {
      const o = M.circleAt(t, p);
      close(o.x, o.ref[0], 1e-12); close(o.v, o.refV[0], 1e-12); close(o.a, o.refA[0], 1e-12);
      close(Math.hypot(...o.ref), A); close(Math.hypot(...o.refV), p.w * A); close(Math.hypot(...o.refA), p.w * p.w * A);
      close(o.refA[0] * o.ref[1] - o.refA[1] * o.ref[0], 0, 1e-12); assert.ok(o.refA[0] * o.ref[0] + o.refA[1] * o.ref[1] < 0);   // toward the center
      close((M.circleAt(t + h, p).x - M.circleAt(t - h, p).x) / (2 * h), o.v, 1e-7);
      close(o.a, -p.w * p.w * o.x, 1e-12);
    }
  }
  // Counterclockwise seen from above (+y): the angle runs from +x toward −z.
  assert.ok(M.circleAt(0.1, { ...C, phi: 0 }).ref[1] < 0);
  close(M.duration(C), 2 * 2 * Math.PI / C.w); assert.equal(M.loop(C), true); assert.equal(M.loop(S), false);
});

test('grading with the named mistakes; at the defaults every mistake is more than 2 % away from the answer', () => {
  for (const p of [S, R]) {
    const T0 = M.smallPeriod(p), mk = M.pendulumMistakes(p);
    for (const v of Object.values(mk)) assert.ok(!M.near(v, T0), `${p.kind} mistake ${v}`);
    assert.equal(M.checkPendulum(p, { TText: T0.toFixed(3), choice: 'longer' }).ok, true);
    for (const [why, val] of Object.entries(mk)) assert.equal(M.checkPendulum(p, { TText: String(val), choice: 'longer' }).TReason, why);
    assert.equal(M.checkPendulum(p, { TText: T0.toFixed(3), choice: 'same' }).cReason, 'same');
    assert.equal(M.checkPendulum(p, { TText: T0.toFixed(3), choice: '' }).cReason, 'empty');
  }
  const o = M.circleAt(0, C), mk = M.circleMistakes(C);
  for (const v of Object.values(mk.v)) assert.ok(!M.near(v, o.v), `v mistake ${v}`);
  for (const v of Object.values(mk.a)) assert.ok(!M.near(v, o.a), `a mistake ${v}`);
  assert.equal(M.checkCircle(C, { vText: o.v.toFixed(3), aText: o.a.toFixed(3) }).ok, true);
  for (const [why, val] of Object.entries(mk.v)) assert.equal(M.checkCircle(C, { vText: String(val), aText: String(o.a) }).vReason, why);
  for (const [why, val] of Object.entries(mk.a)) assert.equal(M.checkCircle(C, { vText: String(o.v), aText: String(val) }).aReason, why);
});
