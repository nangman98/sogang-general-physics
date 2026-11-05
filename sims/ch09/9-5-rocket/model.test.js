// node --test sims/ch09/9-5-rocket/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 9.9.1: R = 2.3 kg/s, v_rel = 2800 m/s, M_i = 850 kg: T = 6440 N, a = 7.6 m/s², below M_i g = 8330 N', () => {
  const p = { Mi: 850, Mf: 100, R: 2.3, vrel: 2800 };
  close(M.thrust(p), 6440); close(+(M.thrust(p) / 850).toFixed(1), 7.6);
  close(Math.round(850 * 9.8), 8330); assert.ok(M.thrust(p) < 850 * 9.8);
  close(M.stateAt(0, p).a, 6440 / 850);
});

test('second rocket equation (Eq. 9.9.7) and the first (Eq. 9.9.6) hold along the burn', () => {
  const p = { Mi: 1000, Mf: 400, R: 20, vrel: 2500 }, tb = M.burnTime(p);
  close(tb, 30); close(M.stateAt(tb, p).v, 2500 * Math.log(2.5)); close(M.deltaV(p), 2500 * Math.log(2.5));
  for (const t of [3, 12, 27]) {
    const h = 1e-4, s = M.stateAt(t, p);
    close((M.stateAt(t + h, p).v - M.stateAt(t - h, p).v) / (2 * h), s.a, 1e-6);            // a = dv/dt
    close(s.M * s.a, p.R * p.vrel, 1e-9);                                                     // R v_rel = M a
    close((M.stateAt(t + h, p).x - M.stateAt(t - h, p).x) / (2 * h), s.v, 1e-6);            // v = dx/dt
  }
  const c = M.stateAt(tb + 10, p);
  close(c.v, M.deltaV(p)); close(c.x, M.stateAt(tb, p).x + 10 * c.v, 1e-9); close(c.a, 0);
  // Doubling the mass ratio adds the same v_rel ln 2.
  close(M.deltaV({ Mi: 1000, Mf: 250, vrel: 2500 }) - M.deltaV({ Mi: 1000, Mf: 500, vrel: 2500 }), 2500 * Math.LN2);
});

test('grading with the named mistakes', () => {
  const p = { Mi: 1000, Mf: 400, R: 20, vrel: 2500 };                       // a0 = 50 m/s², Δv = 2291 m/s
  assert.equal(M.check(p, { aText: '50', vText: '2291' }).ok, true);
  assert.equal(M.check(p, { aText: '125', vText: '2291' }).aReason, 'final');
  assert.equal(M.check(p, { aText: '50', vText: (2500 * Math.log10(2.5)).toFixed(1) }).vReason, 'log10');
  assert.equal(M.check(p, { aText: '50', vText: '1500' }).vReason, 'linear');
  assert.equal(M.check(p, { aText: '50', vText: '6250' }).vReason, 'noLog');
});

test('every slider setting gives finite runs', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u, lo = c.min, hi = c.max) => Math.min(hi, Math.max(lo, c.min + Math.round(u * (c.max - c.min) / c.step) * c.step));
  let seed = 37;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 300; k++) {
    const p = {};
    for (const id of ['Mi', 'R', 'vrel']) p[id] = pick(byId[id], rnd());
    p.Mf = pick(byId.Mf, rnd(), ...byId.Mf.bounds(p));
    const T = M.duration(p);
    assert.ok(Number.isFinite(T) && T > M.COAST && T < 250);
    for (const t of [0, T / 2, T]) for (const [key, val] of Object.entries(M.stateAt(t, p))) if (typeof val === 'number') assert.ok(Number.isFinite(val), key);
  }
});
