// node --test sims/ch08/8-1-mechanical-energy/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const rad = d => d * Math.PI / 180;

test('Sample Problem 8.2.1: from rest at 8.5 m on a frictionless slide, v = 13 m/s at the bottom', () => {
  const v = M.endSpeed({ h: 8.5, yB: 0, v0: 0 });
  close(v, Math.sqrt(2 * M.G * 8.5)); close(+v.toFixed(0), 13);
});

test('track shapes: same ends, smooth joins, and the same end speed', () => {
  for (const shape of ['gentle', 'hill']) {
    const p = { h: 6, yB: 2, v0: 1, shape };
    close(M.profile(0, p).y, 6); close(M.profile(M.LEN, p).y, 2);
    close(M.profile(0, p).dy, 0); close(M.profile(M.LEN, p).dy, 0);
    for (const x of [0.35 * M.LEN, 0.7 * M.LEN]) {                       // joins of the hill shape
      const a = M.profile(x - 1e-7, p), b = M.profile(x + 1e-7, p);
      close(a.y, b.y, 1e-6); close(a.dy, b.dy, 1e-5);
    }
    for (const x of [1.3, 4.4, 8.8]) close((M.profile(x + 1e-6, p).y - M.profile(x - 1e-6, p).y) / 2e-6, M.profile(x, p).dy, 1e-5);
    assert.ok([...Array(101).keys()].every(i => M.profile(i / 100 * M.LEN, p).y <= 6 + 1e-12));   // never above the start
    close(M.speedAt(M.LEN, p), M.endSpeed(p));
  }
  const a = M.duration({ activity: 'track', h: 6, yB: 2, v0: 1, shape: 'gentle' }), b = M.duration({ activity: 'track', h: 6, yB: 2, v0: 1, shape: 'hill' });
  assert.ok(Math.abs(a - b) > 0.05, 'the two shapes take different times');
});

test('track motion: K + U stays E_mec (Eq. 8.2.6) and dx/dt = v cos(slope)', () => {
  const p = { activity: 'track', h: 7, yB: 1, v0: 2, shape: 'hill', m: 3 };
  const T = M.duration(p), E0 = M.observe(M.at(0), p).E;
  for (let i = 0; i <= 20; i++) close(M.observe(M.at(T * i / 20), p).E, E0, 1e-12);
  for (const t of [0.2 * T, 0.5 * T, 0.8 * T]) {
    const h = 2e-3, o = M.observe(M.at(t), p);
    close((M.trackAt(t + h, p) - M.trackAt(t - h, p)) / (2 * h), o.v / Math.hypot(1, o.dy), 1e-3);
  }
  close(M.trackAt(T, p), M.LEN);
});

test('pendulum: exact period from K(k), energy kept by the RK4 table, swing to −θ0 at T/2', () => {
  const small = { L: 1.5, theta0: 5 };
  close(M.period(small) / (2 * Math.PI * Math.sqrt(1.5 / M.G)), 1.000476, 1e-5);
  close(M.period({ L: 1, theta0: 60 }) / (2 * Math.PI * Math.sqrt(1 / M.G)), 1.07318, 1e-5);
  const p = { activity: 'pendulum', L: 2, theta0: 70, m: 1 };
  const T = M.period(p), E0 = M.observe(M.at(0), p).E0;
  for (let i = 0; i <= 40; i++) close(M.observe(M.at(T * i / 40 + 0.0013), p).E, E0, 1e-6);
  close(M.pendulumAt(T / 2, p).theta, -rad(70), 1e-6);
  close(M.pendulumAt(T / 4, p).theta, 0, 1e-6);
  close(Math.abs(M.pendulumAt(T / 4, p).omega) * 2, M.bottomSpeed(p), 1e-6);
});

test('grading with the named mistakes', () => {
  const p = { h: 6, yB: 2, v0: 3 };                                      // v_B = √(9 + 78.4) = 9.35 m/s
  const V = M.endSpeed(p);
  assert.equal(M.checkTrack(p, { vText: V.toFixed(2), shapeChoice: 'same' }).ok, true);
  assert.equal(M.checkTrack(p, { vText: V.toFixed(2), shapeChoice: 'differ' }).sReason, 'shape');
  assert.equal(M.checkTrack(p, { vText: Math.sqrt(2 * M.G * 4).toFixed(3), shapeChoice: 'same' }).vReason, 'noV0');
  assert.equal(M.checkTrack(p, { vText: Math.sqrt(2 * M.G * 6 + 9).toFixed(3), shapeChoice: 'same' }).vReason, 'noYB');
  assert.equal(M.checkTrack(p, { vText: (3 + Math.sqrt(2 * M.G * 4)).toFixed(3), shapeChoice: 'same' }).vReason, 'addSpeeds');
  const q = { L: 2, theta0: 50 };
  const v = M.bottomSpeed(q);
  assert.equal(M.checkPendulum(q, { vText: v.toFixed(2), angleText: '50' }).ok, true);
  assert.equal(M.checkPendulum(q, { vText: Math.sqrt(2 * M.G * 2).toFixed(3), angleText: '50' }).vReason, 'fullL');
  assert.equal(M.checkPendulum(q, { vText: Math.sqrt(2 * M.G * 2 * Math.cos(rad(50))).toFixed(3), angleText: '50' }).vReason, 'cos');
  assert.equal(M.checkPendulum(q, { vText: v.toFixed(2), angleText: '40' }).aReason, 'less');
});

test('every slider setting gives finite runs', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u, hi = c.max) => Math.min(hi, c.min + Math.round(u * (c.max - c.min) / c.step) * c.step);
  let seed = 21;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 200; k++) {
    const p = { activity: k % 2 ? 'pendulum' : 'track', shape: rnd() < 0.5 ? 'gentle' : 'hill' };
    for (const id of ['h', 'v0', 'm', 'L', 'theta0']) p[id] = pick(byId[id], rnd());
    p.yB = pick(byId.yB, rnd(), p.h - 0.5);
    const T = M.duration(p);
    assert.ok(Number.isFinite(T) && T > 0 && T < 30, `T = ${T}`);
    for (const t of [0, T / 3, T]) for (const [key, val] of Object.entries(M.observe(M.at(t), p))) if (typeof val === 'number') assert.ok(Number.isFinite(val), key);
  }
});
