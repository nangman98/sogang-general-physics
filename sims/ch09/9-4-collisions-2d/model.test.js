// node --test sims/ch09/9-4-collisions-2d/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const deg = r => r * 180 / Math.PI;

test('Sample Problem 9.8.1: Alfred 83 kg east at 6.2 km/h and Barbara 55 kg north at 7.8 km/h, θ = 39.8°, V = 4.86 km/h', () => {
  const s = M.stick({ mA: 83, mB: 55, vA: 6.2, vB: 7.8 });
  close(+Math.tan(s.theta * Math.PI / 180).toFixed(3), 0.834);
  close(+s.theta.toFixed(1), 39.8); close(+s.speed.toFixed(1), 4.9);
  close(s.speed, 4.86, 2e-3);                                            // textbook 4.86 uses the rounded 39.8°; exact 4.855
});

test('glancing elastic collision: momentum in x and y and kinetic energy are kept (Eqs. 9.8.3–9.8.5)', () => {
  for (const p of [{ m1: 1, m2: 1, v1i: 1.5, b: 0.25 }, { m1: 2, m2: 0.5, v1i: 2, b: 0.4 }, { m1: 0.5, m2: 3, v1i: 1, b: 0.1 }]) {
    const g = M.glancing(p);
    close(p.m1 * g.v1[0] + p.m2 * g.v2[0], p.m1 * p.v1i);                                    // (9.8.3)
    close(p.m1 * g.v1[1] + p.m2 * g.v2[1], 0, 1e-12);                                        // (9.8.4)
    close(0.5 * p.m1 * g.v1f ** 2 + 0.5 * p.m2 * g.v2f ** 2, 0.5 * p.m1 * p.v1i ** 2);         // (9.8.5)
    close(g.theta2, deg(Math.asin(p.b / (2 * M.R))));                                        // along the line of centers
    const s = M.stateAt(M.BEFORE, p);
    close(Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]), 2 * M.R, 1e-9);                     // touching at contact
  }
  const eq = M.glancing({ m1: 1, m2: 1, v1i: 1.5, b: 0.3 });
  close(eq.theta2 - eq.theta1, 90, 1e-9);                                                    // equal masses: 90° apart
  const head = M.glancing({ m1: 1, m2: 1, v1i: 1.5, b: 0 });
  close(head.v1f, 0, 1e-12); close(head.v2f, 1.5); close(head.theta2, 0);
});

test('stick: the pair leaves along the total momentum', () => {
  const p = { activity: 'stick', mA: 1.5, mB: 1, vA: 1.5, vB: 2 };
  const s = M.stick(p), o = M.stateAt(M.BEFORE + 1, p);
  close(o.a[0], s.V[0]); close(o.a[1], s.V[1]);
  close((p.mA + p.mB) * s.V[0], p.mA * p.vA); close((p.mA + p.mB) * s.V[1], p.mB * p.vB);
});

test('grading with the named mistakes', () => {
  const p = { m1: 1, m2: 1, v1i: 1.5, b: 0.25 }, g = M.glancing(p);                        // θ2 = 30°, v2f = 1.299 m/s
  assert.equal(M.checkGlancing(p, { thText: '30', vText: g.v2f.toFixed(3) }).ok, true);
  assert.equal(M.checkGlancing(p, { thText: '90', vText: g.v2f.toFixed(3) }).thReason, 'radius');
  assert.equal(M.checkGlancing(p, { thText: '60', vText: g.v2f.toFixed(3) }).thReason, 'complement');
  assert.equal(M.checkGlancing(p, { thText: '30', vText: '1.5' }).vReason, 'full');
  const q = { mA: 1.5, mB: 1, vA: 1.5, vB: 2 }, s = M.stick(q);
  assert.equal(M.checkStick(q, { thText: s.theta.toFixed(1), VText: s.speed.toFixed(3) }).ok, true);
  assert.equal(M.checkStick(q, { thText: deg(Math.atan2(2, 1.5)).toFixed(1), VText: s.speed.toFixed(3) }).thReason, 'noMass');
  assert.equal(M.checkStick(q, { thText: s.theta.toFixed(1), VText: ((1.5 * 1.5 + 2) / 2.5).toFixed(3) }).VReason, 'scalar');
});
