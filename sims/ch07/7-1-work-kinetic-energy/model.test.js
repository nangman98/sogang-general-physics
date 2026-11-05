// node --test sims/ch07/7-1-work-kinetic-energy/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 7.1.1: two locomotives after 3.2 km at 0.26 m/s² carry K = 2.0 × 10⁸ J', () => {
  const m = 1.2e6 / M.G, v = Math.sqrt(2 * 0.26 * 3.2e3);
  close(+(m / 1e5).toFixed(2), 1.22); close(+v.toFixed(1), 40.8);
  close(+(2 * M.kinetic(m, v) / 1e8).toFixed(1), 2.0);
});

test('Sample Problem 7.2.1: two spies, W1 = 88.33 J, W2 = 65.11 J, W = 153 J, v_f = 1.17 m/s', () => {
  const s = M.two({ m: 225, F1: 12.0, th1: 30.0, F2: 10.0, th2: 40.0, d: 8.50 });
  close(+s.W1.toFixed(2), 88.33); close(+s.W2.toFixed(2), 65.11);
  close(+s.W.toFixed(1), 153.4); close(s.Wg, 0); close(s.WN, 0);
  close(+s.vf.toFixed(2), 1.17);
});

test('Sample Problem 7.2.2: W = F⃗·d⃗ = −6.0 J and K_f = 4.0 J from K_i = 10 J', () => {
  // The textbook crate moves along −x with F_x = +2.0 N. Mirrored in x: d⃗ = (3.0 m) î, F_x = −2.0 N, F_y = −6.0 N.
  const p = { m: 5, vi: 2, d: 3.0, Fx: -2.0, Fy: -6.0 };
  const s = M.wind(p);
  close(s.Ki, 10); close(s.W, -6.0); close(s.Kf, 4.0);
});

test('work–kinetic energy theorem (Eq. 7.2.8) holds at every instant of a run', () => {
  for (const p of [{ activity: 'two', m: 20, d: 4, F1: 15, th1: 25, F2: 12, th2: 35 },
                   { activity: 'wind', m: 20, d: 4, vi: 2, Fx: -4, Fy: -6 },
                   { activity: 'wind', m: 3, d: 2, vi: 1.5, Fx: 7, Fy: 12 }]) {
    const s = M.solve(p), T = M.duration(p);
    for (const t of [0, T / 4, T / 2, T]) {
      const o = M.observe(M.at(t), p);
      close(M.kinetic(p.m, o.v) - s.Ki, o.Wsofar, 1e-9);
    }
    close(M.observe(M.at(T), p).x, p.d, 1e-9);
    close(M.kinetic(p.m, M.observe(M.at(T), p).v), s.Kf, 1e-9);
  }
  // Stopping exactly at x = d when K_f = 0.
  const p = { activity: 'wind', m: 2, d: 2, vi: 2, Fx: -2, Fy: 0 };
  close(M.wind(p).Kf, 0); close(M.observe(M.at(M.duration(p)), p).x, 2, 1e-9);
});

test('normal and gravitational forces do no work; F_y never lifts the crate', () => {
  const s = M.two({ m: 10, F1: 30, th1: 20, F2: 25, th2: 50, d: 3 });
  close(s.Wg, 0); close(s.WN, 0);
  assert.ok(M.two({ m: 5, F1: 0, th1: 0, F2: M.pullLimit({ m: 5, F1: 0, th1: 0, th2: 60 }), th2: 60, d: 3 }).FN > 0);
  close(M.wind({ m: 4, vi: 2, d: 3, Fx: 3, Fy: 15 }).W, M.wind({ m: 4, vi: 2, d: 3, Fx: 3, Fy: -15 }).W);
});

test('grading with the named mistakes', () => {
  const p = { m: 20, d: 4, F1: 15, th1: 25, F2: 12, th2: 35 };          // W = 93.70 J, v_f = 3.06 m/s
  const s = M.two(p);
  assert.equal(M.checkTwo(p, { WText: s.W.toFixed(1), vText: s.vf.toFixed(2) }).ok, true);
  assert.equal(M.checkTwo(p, { WText: (4 * (15 * Math.sin(25 * Math.PI / 180) + 12 * Math.sin(35 * Math.PI / 180))).toFixed(2), vText: '3.06' }).WReason, 'sin');
  assert.equal(M.checkTwo(p, { WText: '108', vText: '3.06' }).WReason, 'noCos');
  assert.equal(M.checkTwo(p, { WText: s.W1.toFixed(2), vText: '3.06' }).WReason, 'oneForce');
  assert.equal(M.checkTwo(p, { WText: s.W.toFixed(1), vText: Math.sqrt(s.W / 20).toFixed(3) }).vReason, 'noHalf');
  const q = { m: 20, d: 4, vi: 2, Fx: -4, Fy: -6 };                       // W = −16 J, K_f = 24 J
  assert.equal(M.checkWind(q, { WText: '-16', KText: '24' }).ok, true);
  assert.equal(M.checkWind(q, { WText: '16', KText: '24' }).WReason, 'sign');
  assert.equal(M.checkWind(q, { WText: (Math.hypot(4, 6) * 4).toFixed(2), KText: '24' }).WReason, 'magnitude');
  assert.equal(M.checkWind(q, { WText: '-24', KText: '24' }).WReason, 'perp');
  assert.equal(M.checkWind(q, { WText: '-16', KText: '56' }).KReason, 'minus');
  assert.equal(M.checkWind(q, { WText: '-16', KText: '-16' }).KReason, 'noKi');
});

test('every slider setting gives a finite run that ends at x = d', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u, lo = c.min, hi = c.max) => Math.min(hi, Math.max(lo, c.min + Math.round(u * (c.max - c.min) / c.step) * c.step));
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 500; k++) {
    for (const activity of ['two', 'wind']) {
      const p = { activity };
      for (const id of ['m', 'd', 'F1', 'th1', 'th2', 'vi']) p[id] = pick(byId[id], rnd());
      const [f2lo, f2hi] = byId.F2.bounds(p); p.F2 = pick(byId.F2, rnd(), f2lo, f2hi);
      const [fxlo, fxhi] = byId.Fx.bounds(p); p.Fx = pick(byId.Fx, rnd(), fxlo, fxhi);
      const [fylo, fyhi] = byId.Fy.bounds(p); p.Fy = pick(byId.Fy, rnd(), fylo, fyhi);
      const T = M.duration(p);
      assert.ok(Number.isFinite(T) && T > 0 && T < 60, `${activity} T = ${T} ${JSON.stringify(p)}`);
      const o = M.observe(M.at(T), p);
      if (Math.abs(o.Fx) > 0 || o.vi > 0) close(o.x, p.d, 1e-6); else close(o.x, 0);   // no force and no speed: no motion
      assert.ok(o.FN > 0 && o.Kf >= -1e-9);
    }
  }
});
