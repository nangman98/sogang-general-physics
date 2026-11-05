// node --test sims/ch07/7-2-variable-force-work/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 7.4.1: k = 408 N/m, W_s = −0.059 J from 0 to 17 mm, +0.030 J from 17 mm to −12 mm', () => {
  const k = 4.9 / 12e-3;                                                  // Hooke's law (7.4.2) at x1 = 12 mm
  close(Math.round(k), 408);
  close(M.springForce(k, 12e-3), -4.9);
  close(+M.springWork(k, 0, 17e-3).toFixed(3), -0.059);                  // (7.4.7)
  close(+M.springWork(k, 17e-3, -12e-3).toFixed(3), 0.030);              // (7.4.6)
});

test('spring work is the signed area under F = −kx between x_i and x_f, in either direction', () => {
  for (const [k, a, b] of [[200, 0, 0.2], [200, 0.2, 0], [350, -0.25, 0.1], [80, 0.3, -0.3], [500, -0.1, -0.05]]) {
    const pieces = M.springPieces(k, a, b);
    close(pieces.reduce((s, q) => s + q.work, 0), M.springWork(k, a, b));
    for (const q of pieces) close(q.work, 0.5 * (q.f0 + q.f1) * (q.to - q.from));   // trapezoid with direction
    // Numerical integral of F dx along the motion.
    let W = 0; const n = 2000;
    for (let i = 0; i < n; i++) { const x0 = a + (b - a) * i / n, x1 = a + (b - a) * (i + 1) / n; W += 0.5 * (M.springForce(k, x0) + M.springForce(k, x1)) * (x1 - x0); }
    close(W, M.springWork(k, a, b), 1e-9);
  }
  const o = M.observe(M.at(M.SLOW), { activity: 'spring', k: 200, xi: 0.1, xf: -0.2 });
  close(o.x, -0.2); close(o.Wa, -o.Ws);                                    // (7.4.9)
  close(o.Ws, 0.5 * 200 * 0.01 - 0.5 * 200 * 0.04);
});

test('graph: work is the exact area of the trapezoids; K_f = K_i + W', () => {
  const p = { activity: 'graph', m: 2, vi: 1, F0: 2, F2: 8, F4: 8, F6: 3 };
  close(M.graphWork(p), 0.5 * (2 + 8) * 2 + 8 * 2 + 0.5 * (8 + 3) * 2);
  close(M.regions(p).reduce((s, r) => s + r.area, 0), M.graphWork(p));
  let W = 0; const n = 6000;
  for (let i = 0; i < n; i++) { const x0 = 6 * i / n, x1 = 6 * (i + 1) / n; W += 0.5 * (M.forceAt(x0, p) + M.forceAt(x1, p)) * (x1 - x0); }
  close(W, M.graphWork(p), 1e-9);
  close(M.kinetic(2, M.speedAt(6, p)), M.kinetic(2, 1) + M.graphWork(p));
});

test('graph motion: a constant force gives x = v_i t + ½(F/m)t²; dx/dt = v(x) in general', () => {
  const c = { activity: 'graph', m: 1.5, vi: 2, F0: 4, F2: 4, F4: 4, F6: 4 };
  for (const t of [0.2, 0.7, 1.1]) close(M.graphAt(t, c), 2 * t + 0.5 * (4 / 1.5) * t * t, 2e-6);   // interpolation of t(x) on 2000 cells
  const p = { activity: 'graph', m: 2, vi: 1, F0: 2, F2: 8, F4: 0, F6: 12 };
  const T = M.duration(p);
  close(M.graphAt(T, p), 6);
  for (const t of [0.3 * T, 0.6 * T, 0.9 * T]) {
    // h spans several interpolation cells, so the difference quotient sees the true slope, not one cell's chord.
    const h = 5e-3, x = M.graphAt(t, p);
    close((M.graphAt(t + h, p) - M.graphAt(t - h, p)) / (2 * h), M.speedAt(x, p), 1e-3);
  }
});

test('grading with the named mistakes', () => {
  const S = { k: 200, xi: 0, xf: 0.2 };                                    // W_s = −4 J, W_a = +4 J
  assert.equal(M.checkSpring(S, { sText: '-4', aText: '4' }).ok, true);
  assert.equal(M.checkSpring(S, { sText: '4', aText: '4' }).sReason, 'sign');
  assert.equal(M.checkSpring(S, { sText: '-8', aText: '4' }).sReason, 'noHalf');
  assert.equal(M.checkSpring(S, { sText: '-4', aText: '-4' }).aReason, 'same');
  const D = { k: 200, xi: 0.1, xf: 0.2 };                                  // W_s = −3 J; ½k(Δx)² = 1 J
  assert.equal(M.checkSpring(D, { sText: '-1', aText: '3' }).sReason, 'delta');
  const p = { m: 2, vi: 2, F0: 2, F2: 8, F4: 8, F6: 3 };                    // W = 37 J, v_f = 6.40 m/s
  const v = M.speedAt(6, p);
  assert.equal(M.checkGraph(p, { WText: '37', vText: v.toFixed(2) }).ok, true);
  assert.equal(M.checkGraph(p, { WText: '38', vText: v.toFixed(2) }).WReason, 'rectangles');   // right-end heights 8, 8, 3
  assert.equal(M.checkGraph(p, { WText: '48', vText: v.toFixed(2) }).WReason, 'peak');
  assert.equal(M.checkGraph(p, { WText: '37', vText: Math.sqrt(37).toFixed(3) }).vReason, 'noKi');
  assert.equal(M.checkGraph(p, { WText: '37', vText: (2 + Math.sqrt(37)).toFixed(3) }).vReason, 'addSpeeds');
});

test('every slider setting gives finite runs', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u) => c.min + Math.round(u * (c.max - c.min) / c.step) * c.step;
  let seed = 9;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 300; k++) {
    const p = { activity: k % 2 ? 'graph' : 'spring' };
    for (const id of ['k', 'xi', 'xf', 'm', 'vi', 'F0', 'F2', 'F4', 'F6']) p[id] = pick(byId[id], rnd());
    const T = M.duration(p);
    assert.ok(Number.isFinite(T) && T > 0 && T < 30, `T = ${T}`);
    for (const t of [0, T / 2, T]) for (const [key, val] of Object.entries(M.observe(M.at(t), p))) if (typeof val === 'number') assert.ok(Number.isFinite(val), key);
  }
});
