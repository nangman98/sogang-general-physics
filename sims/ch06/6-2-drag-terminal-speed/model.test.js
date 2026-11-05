// node --test sims/ch06/6-2-drag-terminal-speed/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const ball = { m: 0.15, C: 0.5, A: M.area(4) };

test('terminal speed (Eq. 6.2.3): the drag (Eq. 6.2.1) equals Fg at v = vt', () => {
  const V = M.terminal(ball);
  close(M.drag(ball, V), ball.m * M.G);
  close(V, Math.sqrt(2 * ball.m * M.G / (ball.C * M.RHO * ball.A)));
  close(M.area(10), Math.PI * 0.01);
});

test('exact fall from rest satisfies D − Fg = ma (Eq. 6.2.2) and ds/dt = v', () => {
  for (const t of [0.1, 0.7, 2.5, 6]) {
    const o = M.fallAt(t, ball), h = 1e-5;
    const up = M.fallAt(t + h, ball), dn = M.fallAt(t - h, ball);
    close((up.v - dn.v) / (2 * h), -o.ay, 1e-6);                      // speed grows as the body accelerates down
    close(o.D - ball.m * M.G, ball.m * o.ay);                          // (6.2.2) with +y up
    close(o.D, M.drag(ball, o.v));
    close((up.s - dn.s) / (2 * h), o.v, 1e-6);
    assert.ok(o.v < o.vt && o.ay < 0);
  }
  const start = M.fallAt(0, ball);
  close(start.v, 0); close(start.s, 0); close(start.ay, -M.G);         // free fall at the start
  const late = M.fallAt(40, ball);
  close(late.v, late.vt, 1e-6); close(late.ay, 0, 1e-6);
});

test('Table 6.2.1: the 95 % distances follow from the exact solution', () => {
  // 95 % of vt is reached after s = (vt²/g) ln cosh(atanh 0.95).
  const s95 = vt => vt * vt / M.G * Math.log(Math.cosh(Math.atanh(0.95)));
  close(Math.round(s95(145) / 100) * 100, 2500);
  close(Math.round(s95(60) / 10) * 10, 430);
  close(Math.round(s95(42) / 10) * 10, 210);
  close(Math.round(s95(31)), 114);                                     // table 115 m
  close(Math.round(s95(9)), 10);
  // The same distance from fallAt: the body with vt = 42 m/s is at 0.95 vt when it has fallen 210 m.
  const b = { m: 1, C: 1, A: 2 * M.G / (M.RHO * 42 * 42) };
  close(M.terminal(b), 42);
  const t95 = 42 / M.G * Math.atanh(0.95);
  close(M.fallAt(t95, b).v, 0.95 * 42); close(Math.round(M.fallAt(t95, b).s / 10) * 10, 210);
});

test('Sample Problem 6.2.1: doubling A changes 97 km/h to 69 km/h', () => {
  const p = { activity: 'compare', m: 0.15, r: 4, C: 0.5, km: 1, kA: 2 };
  close(M.ratio(p), Math.sqrt(0.5));
  close(Math.round(97 * M.ratio(p)), 69);
  const [one, two] = M.bodies(p);
  close(M.terminal(two) / M.terminal(one), M.ratio(p));
  close(two.A, 2 * one.A); close(two.m, one.m);
});

test('grading: vt, the acceleration at vt, and the ratio with the named mistakes', () => {
  const p = { activity: 'fall', m: 0.15, r: 4, C: 0.5 }, V = M.terminal(M.bodies(p)[0]);
  assert.equal(M.checkFall(p, { vText: V.toFixed(2), accel: 'zero' }).ok, true);
  assert.equal(M.checkFall(p, { vText: V.toFixed(2), accel: 'g' }).aReason, 'g');
  assert.equal(M.checkFall(p, { vText: (V / Math.SQRT2).toFixed(2), accel: 'zero' }).vReason, 'noHalf');
  assert.equal(M.checkFall(p, { vText: (V / 100).toFixed(4), accel: 'zero' }).vReason, 'cm');
  assert.equal(M.checkFall(p, { vText: 'abc', accel: 'zero' }).vReason, 'unreadable');
  const q = { activity: 'compare', km: 1, kA: 2 };
  assert.equal(M.checkCompare(q, { rText: '0.707' }).ok, true);
  assert.equal(M.checkCompare(q, { rText: '0.5' }).reason, 'linear');
  assert.equal(M.checkCompare(q, { rText: '1.41' }).reason, 'inverse');
  const w = { activity: 'compare', km: 2, kA: 1.5 };
  assert.equal(M.checkCompare(w, { rText: (1 / Math.sqrt(1.5)).toFixed(3) }).reason, 'areaOnly');
  assert.equal(M.checkCompare(w, { rText: Math.sqrt(2).toFixed(3) }).reason, 'massOnly');
});

test('every slider setting gives finite values within the run', () => {
  const ranges = Object.fromEntries(M.params.filter(c => c.min !== undefined).map(c => [c.id, c]));
  const pick = (c, u) => c.min + Math.round(u * (c.max - c.min) / c.step) * c.step;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 400; k++) {
    const p = { activity: k % 2 ? 'compare' : 'fall' };
    for (const id of Object.keys(ranges)) p[id] = pick(ranges[id], rnd());
    const T = M.duration(p);
    assert.ok(Number.isFinite(T) && T > 0 && T < 60, `T = ${T}`);
    for (const o of M.observe(M.at(T), p).list) {
      for (const key of ['v', 's', 'D', 'ay']) assert.ok(Number.isFinite(o[key]));
      assert.ok(o.v / o.vt > 0.99 && o.v <= o.vt);
    }
  }
});
