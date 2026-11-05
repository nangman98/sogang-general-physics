// node --test sims/ch07/7-3-power/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 7.6.1: P1 = −6.0 W, P2 = +6.0 W, P_net = 0 and constant', () => {
  const p = { activity: 'two', m: 3, F1: 2.0, F2: 4.0, phi2: 60, v0: 3.0 };
  const s = M.stateAt(0, p);
  close(s.P1, -6.0); close(s.P2, 6.0); close(s.Pnet, 0);
  assert.equal(M.trend(p), 'same');
  close(M.stateAt(2, p).Pnet, 0); close(M.stateAt(2, p).v, 3.0);
});

test('Sample Problem 7.6.2: 80 hp at 11 m/s needs a thrust of 5.4 × 10³ N (Eqs. 7.6.4, 7.6.6)', () => {
  const P = 80 * 746, F = P / (11 * Math.cos(0));
  close(Math.round(F), 5425); close(+(F / 1e3).toFixed(1), 5.4);
  close(M.power(F, 11, 0), P);
});

test('P = dW/dt and P_avg = W/Δt hold along a run', () => {
  for (const p of [{ activity: 'pull', m: 4, F: 6, phi: 30, vi: 1 }, { activity: 'two', m: 4, F1: 3, F2: 5, phi2: 60, v0: 2 }, { activity: 'two', m: 2, F1: 1, F2: 8, phi2: 20, v0: 1 }]) {
    const T = M.duration(p);
    for (const t of [0.3, T / 2, T * 0.9]) {
      const h = 1e-5;
      close((M.stateAt(t + h, p).Wnet - M.stateAt(t - h, p).Wnet) / (2 * h), M.stateAt(t, p).Pnet, 1e-6);
      if (p.activity === 'two') close(M.stateAt(t, p).P1 + M.stateAt(t, p).P2, M.stateAt(t, p).Pnet);
    }
    close(M.averagePower(p), M.stateAt(T, p).Wnet / T);
  }
  // A box slowed to rest stops the run early.
  const slow = { activity: 'two', m: 1, F1: 4, F2: 0, phi2: 0, v0: 2 };
  close(M.duration(slow), 0.5); close(M.stateAt(0.5, slow).v, 0);
});

test('the net power grows whenever the net force along x is not zero', () => {
  for (const p of [{ activity: 'two', m: 4, F1: 3, F2: 5, phi2: 60, v0: 2 }, { activity: 'two', m: 4, F1: 1, F2: 5, phi2: 30, v0: 2 }]) {
    assert.equal(M.trend(p), 'up');
    assert.ok(M.stateAt(1, p).Pnet > M.stateAt(0, p).Pnet);
  }
});

test('grading with the named mistakes', () => {
  const p = { activity: 'pull', m: 4, F: 6, phi: 30, vi: 1 };            // P0 = 5.196 W
  const avg = M.averagePower(p), T = M.duration(p);
  assert.equal(M.checkPull(p, { P0Text: '5.20', avgText: avg.toFixed(2) }).ok, true);
  assert.equal(M.checkPull(p, { P0Text: '6', avgText: avg.toFixed(2) }).P0Reason, 'noCos');
  assert.equal(M.checkPull(p, { P0Text: '3', avgText: avg.toFixed(2) }).P0Reason, 'sin');
  assert.equal(M.checkPull(p, { P0Text: '5.2', avgText: M.stateAt(T, p).P.toFixed(2) }).avgReason, 'final');
  assert.equal(M.checkPull(p, { P0Text: '5.2', avgText: M.stateAt(T, p).W.toFixed(2) }).avgReason, 'noTime');
  const q = { activity: 'two', m: 4, F1: 3, F2: 5, phi2: 60, v0: 2 };      // P1 = −6 W, P2 = +5 W, trend up
  assert.equal(M.checkTwo(q, { P1Text: '-6', P2Text: '5', trendChoice: 'up' }).ok, true);
  assert.equal(M.checkTwo(q, { P1Text: '6', P2Text: '5', trendChoice: 'up' }).P1Reason, 'sign');
  assert.equal(M.checkTwo(q, { P1Text: '-6', P2Text: '10', trendChoice: 'up' }).P2Reason, 'noCos');
  assert.equal(M.checkTwo(q, { P1Text: '-6', P2Text: '5', trendChoice: 'down' }).trendReason, 'down');
});

test('every slider setting gives finite runs and keeps the box on the floor', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u, hi = c.max) => Math.min(hi, c.min + Math.round(u * (c.max - c.min) / c.step) * c.step);
  let seed = 13;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 400; k++) {
    const p = { activity: k % 2 ? 'two' : 'pull' };
    for (const id of ['m', 'phi', 'vi', 'F1', 'phi2', 'v0']) p[id] = pick(byId[id], rnd());
    p.F = pick(byId.F, rnd(), byId.F.bounds(p)[1]); p.F2 = pick(byId.F2, rnd(), byId.F2.bounds(p)[1]);
    const T = M.duration(p);
    assert.ok(Number.isFinite(T) && T >= 0 && T <= M.RUN);
    for (const t of [0, T / 2, T]) {
      const s = M.observe(M.at(t), p);
      for (const [key, val] of Object.entries(s)) if (typeof val === 'number') assert.ok(Number.isFinite(val), key);
      assert.ok(s.FN > 0 && s.v >= 0);
    }
  }
});
