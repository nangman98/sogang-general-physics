// node --test sims/ch09/9-3-collisions-1d/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 9.6.1: head-on cars that stick; with an 80 kg passenger V = 0.694 m/s, Δv1 = −24.3, Δv2 = +25.7 m/s', () => {
  const a = M.inelastic({ m1: 1400, m2: 1400, v1i: 25, v2i: -25 });
  close(a.V, 0); close(a.V - (-25), 25);
  const b = M.inelastic({ m1: 1480, m2: 1400, v1i: 25, v2i: -25 });
  close(+b.V.toFixed(3), 0.694); close(+(b.V - 25).toFixed(1), -24.3); close(+(b.V + 25).toFixed(1), 25.7);
});

test('Sample Problem 9.7.1: m1 = 2.0 kg hits m2 = 6.0 kg at 10 m/s: v2 = 5.0 m/s, v1 = −5.0 m/s; then m2 stops on m3 = 6.0 kg', () => {
  const one = M.elastic({ m1: 2.0, m2: 6.0, v1i: 10, v2i: 0 });
  close(one.v1f, -5.0); close(one.v2f, 5.0);
  const two = M.elastic({ m1: 6.0, m2: 6.0, v1i: 5.0, v2i: 0 });
  close(two.v1f, 0); close(two.v2f, 5.0);
});

test('momentum is conserved; kinetic energy only in the elastic case (Eqs. 9.6.2, 9.7.11)', () => {
  for (const p of [{ m1: 1, m2: 2, v1i: 2, v2i: 0 }, { m1: 3.5, m2: 0.5, v1i: 1, v2i: -2 }, { m1: 2, m2: 2, v1i: -1, v2i: -2.5 }]) {
    const e = M.elastic(p), c = M.inelastic(p), P = p.m1 * p.v1i + p.m2 * p.v2i, K = M.kinetic(p.m1, p.v1i) + M.kinetic(p.m2, p.v2i);
    close(p.m1 * e.v1f + p.m2 * e.v2f, P); close(M.kinetic(p.m1, e.v1f) + M.kinetic(p.m2, e.v2f), K);
    close((p.m1 + p.m2) * c.V, P); assert.ok(M.kinetic(p.m1 + p.m2, c.V) < K);
    close(e.v2f - e.v1f, -(p.v2i - p.v1i));                              // relative speed reverses
  }
  close(M.elastic({ m1: 2, m2: 2, v1i: 3, v2i: 0 }).v1f, 0);             // (9.7.8) equal masses
  close(M.elastic({ m1: 2, m2: 2, v1i: 3, v2i: 0 }).v2f, 3);
  close(M.elastic({ m1: 1, m2: 1e9, v1i: 3, v2i: 0 }).v1f, -3, 1e-8);     // massive target
  close(M.elastic({ m1: 1e9, m2: 1, v1i: 3, v2i: 0 }).v2f, 6, 1e-8);      // (9.7.9) massive projectile
});

test('the center of mass moves at constant velocity through the collision (Eq. 9.6.6)', () => {
  for (const activity of ['elastic', 'inelastic']) {
    const p = { activity, m1: 1.5, m2: 3, v1i: 2.5, v2i: -0.5 }, T = M.duration(p), s0 = M.stateAt(0, p);
    for (const t of [0.2, M.collisionTime(p), 0.9 * T]) close(M.stateAt(t, p).xcom, s0.xcom + s0.vcom * t, 1e-9);
    const tc = M.collisionTime(p);
    close(M.stateAt(tc, p).x2 - M.stateAt(tc, p).x1, M.LEN, 1e-9);       // touching at the collision
  }
});

test('grading with the named mistakes', () => {
  const p = { m1: 1, m2: 2, v1i: 2, v2i: 0 };                              // v1f = −0.667, v2f = 1.333, V = 0.667
  assert.equal(M.checkElastic(p, { aText: '-0.667', bText: '1.333' }).ok, true);
  assert.equal(M.checkElastic(p, { aText: '0.667', bText: '1.333' }).aReason, 'sign');
  assert.equal(M.checkElastic(p, { aText: '0', bText: '2' }).aReason, 'swap');
  const q = { m1: 1, m2: 2, v1i: 2, v2i: -1 };                             // V = 0, loss = 2 + 1 = 3 J
  const r = M.checkInelastic(q, { VText: '0', lossText: '3' });
  assert.equal(r.ok, true); close(r.loss, 3);
  assert.equal(M.checkInelastic(q, { VText: '0.667', lossText: '3' }).VReason, 'noV2');
  assert.equal(M.checkInelastic(q, { VText: '0.5', lossText: '3' }).VReason, 'average');
  assert.equal(M.checkInelastic(q, { VText: '0', lossText: '0' }).LReason, 'zero');
});

test('every slider setting collides on the track and ends in time', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u, hi = c.max) => Math.min(hi, c.min + Math.round(u * (c.max - c.min) / c.step) * c.step);
  let seed = 31;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 500; k++) {
    const p = { activity: k % 2 ? 'inelastic' : 'elastic' };
    for (const id of ['m1', 'm2', 'v1i']) p[id] = pick(byId[id], rnd());
    p.v2i = pick(byId.v2i, rnd(), byId.v2i.bounds(p)[1]);
    const tc = M.collisionTime(p), s = M.stateAt(tc, p), T = M.duration(p);
    assert.ok(tc > 0 && tc < 6 && T >= tc && T < 12);
    assert.ok(Math.abs(s.x1) + M.LEN / 2 <= M.END && Math.abs(s.x2) + M.LEN / 2 <= M.END, JSON.stringify(p));
  }
});
