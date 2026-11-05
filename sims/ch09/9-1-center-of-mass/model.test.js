// node --test sims/ch09/9-1-center-of-mass/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 9.1.1: 1.2, 2.5, 3.4 kg on a 140 cm triangle, com at (83 cm, 58 cm)', () => {
  const c = M.comOf({ m1: 1.2, m2: 2.5, m3: 3.4, a: 1.40 });
  close(c.M, 7.1); close(Math.round(c.x * 100), 83); close(Math.round(c.y * 100), 58);
});

test('Eq. 9.1.5 basics: equal masses give the centroid; the com moves toward the heavier particle', () => {
  const g = M.comOf({ m1: 1, m2: 1, m3: 1, a: 1.2 });
  close(g.x, 0.6); close(g.y, 1.2 * Math.sqrt(3) / 6);
  assert.ok(M.comOf({ m1: 1, m2: 5, m3: 1, a: 1.2 }).x > g.x);
  assert.ok(M.comOf({ m1: 1, m2: 1, m3: 5, a: 1.2 }).y > g.y);
});

test('explosion at the top: x momentum is kept, the com stays on the parabola and lands at the range R', () => {
  for (const p of [{ v0: 20, theta0: 50, f1: 0.5 }, { v0: 28, theta0: 35, f1: 0.2 }, { v0: 12, theta0: 70, f1: 0.85 }]) {
    const s = M.shell(p);
    close(s.m1 * 0 + s.m2 * (s.vx / s.m2), s.vx);                     // momentum per unit M along x, before = after
    const T = 2 * s.tTop;
    for (const t of [0, 0.3 * T, 0.6 * T, T]) {
      const o = M.shellAt(t, p);
      close(o.com[0], s.vx * t); close(o.com[1], s.vy * t - 0.5 * M.G * t * t, 1e-9);
      if (o.split) { close(s.m1 * o.one[0] + s.m2 * o.two[0], o.com[0], 1e-9); close(s.m1 * o.one[1] + s.m2 * o.two[1], o.com[1], 1e-9); }
    }
    const end = M.shellAt(T, p);
    close(end.com[0], s.R); close(end.one[1], 0, 1e-9); close(end.two[1], 0, 1e-9);
    close(end.one[0], s.R / 2); close(s.m1 * s.R / 2 + s.m2 * s.x2, s.R);
  }
  close(M.shell({ v0: 20, theta0: 50, f1: 0.5 }).x2, 1.5 * M.shell({ v0: 20, theta0: 50, f1: 0.5 }).R);
});

test('grading with the named mistakes', () => {
  const p = { m1: 1, m2: 2, m3: 3, a: 1.2 }, c = M.comOf(p);
  assert.equal(M.checkCom(p, { xText: c.x.toFixed(3), yText: c.y.toFixed(3) }).ok, true);
  assert.equal(M.checkCom(p, { xText: '0.6', yText: c.y.toFixed(3) }).xReason, 'unweighted');
  assert.equal(M.checkCom(p, { xText: (c.x * 6).toFixed(3), yText: c.y.toFixed(3) }).xReason, 'noDivide');
  const q = { v0: 20, theta0: 50, f1: 0.3 }, s = M.shell(q);
  assert.equal(M.checkExplode(q, { xText: s.x2.toFixed(2) }).ok, true);
  assert.equal(M.checkExplode(q, { xText: s.R.toFixed(2) }).reason, 'range');
  assert.equal(M.checkExplode(q, { xText: (1.5 * s.R).toFixed(2) }).reason, 'equalSplit');
});

test('every slider setting gives finite values', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u) => c.min + Math.round(u * (c.max - c.min) / c.step) * c.step;
  let seed = 23;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 300; k++) {
    const p = { activity: k % 2 ? 'explode' : 'com' };
    for (const id of ['m1', 'm2', 'm3', 'a', 'v0', 'theta0', 'f1']) p[id] = pick(byId[id], rnd());
    const T = M.duration(p);
    assert.ok(Number.isFinite(T) && T > 0);
    const o = M.observe(M.at(T * rnd()), p);
    if (o.activity === 'explode') for (const v of [...o.com, ...o.one, ...o.two]) assert.ok(Number.isFinite(v));
    else assert.ok(Number.isFinite(o.c.x) && Number.isFinite(o.c.y));
  }
});
