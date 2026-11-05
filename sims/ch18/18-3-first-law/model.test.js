// node --test sims/ch18/18-3-first-law/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const P = { activity: 'path', pi: 300, Vi: 1, pf: 100, Vf: 4, path: 'ibf', dir: 'iafbi' };

test('Sample Problem 18.5.1: boiling 1.00 kg of water at 1.01 × 10⁵ Pa from 1.00 × 10⁻³ m³ to 1.671 m³ → W = 169 kJ, Q = 2256 kJ, ΔE_int ≈ 2090 kJ', () => {
  // The segment formula is unit-free: Pa and m³ give J.
  const s = M.segment([1.00e-3, 1.01e5], [1.671, 1.01e5]);
  assert.equal((s.W / 1e3).toFixed(0), '169');
  const Q = 2256e3 * 1.00;                                            // Q = L_V m (Eq. 18.4.5, Table 18.4.2)
  const dE = Q - s.W;                                                  // Eq. 18.5.3
  assert.equal(Math.round(dE / 1e4) * 10, 2090);                      // 2087 kJ, written ≈ 2090 kJ
  assert.equal((s.W / 2260e3 * 100).toFixed(1), '7.5');              // the textbook's 169 kJ/2260 kJ
});

test('Eq. 18.5.2: W is the area under each path; Q and W depend on the path, ΔE_int = Q − W does not', () => {
  const dV = P.Vf - P.Vi, paths = { iaf: P.pi * dV, ibf: P.pf * dV, if: (P.pi + P.pf) / 2 * dV };
  const dE = 1.5 * (P.pf * P.Vf - P.pi * P.Vi);
  for (const [name, W] of Object.entries(paths)) {
    const a = M.along(M.pathPoints(name, P));
    close(a.W, W); close(a.Q - a.W, dE);
    // Trapezoid sum of p dV over the playback samples reproduces W.
    let sum = 0, prev = M.alongAt(M.pathPoints(name, P), 0);
    for (let k = 1; k <= 3000; k++) { const s = M.alongAt(M.pathPoints(name, P), k / 3000); sum += (s.p + prev.p) / 2 * (s.V - prev.V); prev = s; }
    close(sum, W, 1e-6);
  }
  assert.ok(new Set(Object.keys(paths).map(n => M.along(M.pathPoints(n, P)).Q.toFixed(6))).size === 3);
});

test('LO 18.5.4 and Table 18.5.1: compression gives negative W, constant volume gives W = 0 and ΔE_int = Q, a closed cycle gives ΔE_int = 0 and Q = W', () => {
  const back = M.along(M.pathPoints('if', P).reverse());
  close(back.W, -M.along(M.pathPoints('if', P)).W);
  const iso = M.segment([2, 100], [2, 300]);
  close(iso.W, 0); close(iso.dE, iso.Q);                               // Eq. 18.5.6
  const c1 = M.problem({ ...P, activity: 'cycle', dir: 'iafbi' }), c2 = M.problem({ ...P, activity: 'cycle', dir: 'ibfai' });
  close(c1.dE, 0); close(c1.Q, c1.W); close(c1.W, (P.pi - P.pf) * (P.Vf - P.Vi));   // Eq. 18.5.7
  close(c2.W, -c1.W); close(c1.pos, 900); close(c1.neg, -300);
});

test('Fig. 18.5.2b: on path iaf the gas absorbs heat during the constant-pressure expansion and loses heat during the constant-volume pressure drop', () => {
  const [i, a, f] = M.pathPoints('iaf', P);
  for (const u of [0.01, 0.5, 0.99]) {
    assert.ok(M.segment(i, a, u).rate > 0);
    assert.ok(M.segment(a, f, u).rate < 0);
  }
  // The heat rate is dE/du + dW/du (central difference along the segment).
  const h = 1e-5, q = u => M.segment(i, f, u).Q;
  for (const u of [0.2, 0.6]) close((q(u + h) - q(u - h)) / (2 * h), M.segment(i, f, u).rate, 1e-6);
});

test('playback: the state starts at i, ends at f (or back at i), and the running totals end at the path totals', () => {
  for (const p of [P, { ...P, path: 'line' }, { ...P, activity: 'cycle' }]) {
    const pr = M.problem(p), s0 = M.stateAt(0, p), s1 = M.stateAt(M.duration(p), p);
    close(s0.V, p.Vi); close(s0.p, p.pi); close(s0.W, 0);
    close(s1.W, pr.W); close(s1.Q, pr.Q); close(s1.dE, pr.dE);
  }
  close(M.stateAt(M.duration(P), P).V, P.Vf);
});

test('grading with the named mistakes; at the default settings every mistake is more than 2% from the answer', () => {
  const s = M.problem(P), f = x => x.toFixed(4);
  assert.equal(M.checkPath(P, { WText: f(s.W), QText: f(s.Q) }).ok, true);
  const wW = { sign: -s.W, refW: s.ref.W, units: s.W * 1000 };
  for (const [reason, w] of Object.entries(wW)) {
    assert.equal(M.checkPath(P, { WText: f(w), QText: f(s.Q) }).WReason, reason);
    assert.ok(Math.abs(w - s.W) > 0.02 * Math.abs(s.W), reason);
  }
  const wQ = { pathIndep: s.ref.Q, signW: s.dE - s.W, refSign: s.ref.Q + s.ref.W + s.W, noE: s.W, units: s.Q * 1000 };
  for (const [reason, q] of Object.entries(wQ)) {
    assert.equal(M.checkPath(P, { WText: f(s.W), QText: f(q) }).QReason, reason);
    assert.ok(Math.abs(q - s.Q) > 0.02 * Math.abs(s.Q), reason);
  }
  const L = { ...P, path: 'line' }, sl = M.problem(L);
  assert.equal(M.checkPath(L, { WText: f(P.pf * 3), QText: f(sl.Q) }).WReason, 'rect');
  assert.ok(Math.abs(P.pf * 3 - sl.W) > 0.02 * sl.W);

  const C = { ...P, activity: 'cycle' }, c = M.problem(C);
  assert.equal(M.checkCycle(C, { WText: f(c.W), QText: f(c.Q) }).ok, true);
  const cW = { sign: -c.W, oneSide: c.pos, sumAbs: c.pos - c.neg };
  for (const [reason, w] of Object.entries(cW)) {
    assert.equal(M.checkCycle(C, { WText: f(w), QText: f(c.Q) }).WReason, reason);
    assert.ok(Math.abs(w - c.W) > 0.02 * Math.abs(c.W), reason);
  }
  assert.equal(M.checkCycle(C, { WText: f(c.W), QText: '0' }).QReason, 'zero');
  assert.equal(M.checkCycle(C, { WText: f(c.W), QText: f(-c.Q) }).QReason, 'sign');
});
