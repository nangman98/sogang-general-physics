// node --test sims/ch11/11-3-yoyo/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Eq. 11.3.1: a = g/(1 + I_com/MR0²); the linear and angular forms of the second law agree', () => {
  for (const p of [{ M: 0.12, R: 0.035, R0: 0.004 }, { M: 0.5, R: 0.06, R0: 0.015 }, { M: 0.05, R: 0.02, R0: 0.002 }]) {
    const s = M.yoyo(p);
    close(p.M * M.G - s.T, p.M * s.a);                                   // linear
    close(s.T * p.R0, s.I * s.alpha);                                    // torque about the center
    close(s.a, s.alpha * p.R0);                                          // string does not slip
    assert.ok(s.a < M.G && s.T < p.M * M.G);
  }
  close(M.yoyo({ M: 1, R: 0.03, R0: 0.03 }).a, M.G / 1.5);                // R0 = R: a solid disk rolling down a vertical string
});

test('energy: Mg y = ½Mv² + ½Iω² along the drop', () => {
  const p = { M: 0.12, R: 0.035, R0: 0.004 }, s = M.yoyo(p);
  for (const t of [0.2 * s.t, 0.7 * s.t, s.t]) { const o = M.stateAt(t, p); close(p.M * M.G * o.y, 0.5 * p.M * o.v ** 2 + 0.5 * s.I * o.w ** 2); }
  close(M.stateAt(s.t, p).y, M.DROP);
});

test('grading with the named mistakes; slider radii in cm become m', () => {
  const p = M.derive({ M: 0.12, R: 3.5, R0: 0.4 }), s = M.yoyo(p);
  close(p.R, 0.035); close(p.R0, 0.004);
  assert.equal(M.check(p, { aText: s.a.toFixed(4), TText: s.T.toFixed(4) }).ok, true);
  assert.equal(M.check(p, { aText: '9.8', TText: s.T.toFixed(4) }).aReason, 'freefall');
  assert.equal(M.check(p, { aText: (9.8 / 1.5).toFixed(3), TText: s.T.toFixed(4) }).aReason, 'outerRadius');
  assert.equal(M.check(p, { aText: s.a.toFixed(4), TText: (0.12 * 9.8).toFixed(3) }).TReason, 'weight');
});
