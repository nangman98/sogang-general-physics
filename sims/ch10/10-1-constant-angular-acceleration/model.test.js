// node --test sims/ch10/10-1-constant-angular-acceleration/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 10.2.1: ω0 = −4.6 rad/s, α = 0.35 rad/s² reaches θ = 5.0 rev at t = 32 s; it stops turning at t = 13 s', () => {
  const p = { w0: -4.6, alpha: 0.35, r: 0 };
  const t = (-p.w0 + Math.sqrt(p.w0 ** 2 + 2 * p.alpha * 10 * Math.PI)) / p.alpha;    // root of (10.2.2)
  close(Math.round(t), 32); close(M.stateAt(t, p).th, 10 * Math.PI, 1e-9); close(M.rev(M.stateAt(t, p).th), 5, 1e-9);
  const tStop = -p.w0 / p.alpha;
  close(Math.round(tStop), 13); close(M.stateAt(tStop, p).w, 0, 1e-12);
});

test('Sample Problem 10.3.1: from rest a_r = 2 a_t θ; a = 4g with a_t = g at θ = 1.94 rad = 111°', () => {
  for (const [alpha, r, t] of [[0.4, 1.1, 2.5], [0.9, 0.3, 4], [0.05, 1.2, 7]]) {
    const s = M.stateAt(t, { w0: 0, alpha, r });
    close(s.ar, 2 * s.at * s.th);
  }
  const th = Math.sqrt(16 - 1) / 2;                                       // (4g)² = g² + (2gθ)²
  close(+th.toFixed(2), 1.94); close(Math.round(th * 180 / Math.PI), 111);
});

test('Eqs. 10.2.1, 10.2.2, 10.3.2, 10.3.6, 10.3.7: dθ/dt = ω, dω/dt = α, v = ωr, a_t = αr, a_r = ω²r', () => {
  const p = { w0: -1, alpha: 0.5, r: 0.8 };
  for (const t of [0.7, 2, 4.4]) {
    const h = 1e-5, s = M.stateAt(t, p);
    close((M.stateAt(t + h, p).th - M.stateAt(t - h, p).th) / (2 * h), s.w, 1e-8);
    close((M.stateAt(t + h, p).w - M.stateAt(t - h, p).w) / (2 * h), p.alpha, 1e-8);
    close(s.v, s.w * 0.8); close(s.at, 0.4); close(s.ar, s.w ** 2 * 0.8); close(s.a, Math.hypot(s.at, s.ar));
  }
});

test('grading with the named mistakes', () => {
  const p = { w0: -1, alpha: 0.5, t1: 5, r: 0.8 };                       // ω = 1.5 rad/s, θ = 1.25 rad = 0.199 rev
  const s = M.stateAt(5, p);
  assert.equal(M.checkAngular(p, { wText: '1.5', nText: M.rev(s.th).toFixed(3) }).ok, true);
  assert.equal(M.checkAngular(p, { wText: '-1.5', nText: '0.199' }).wReason, 'sign');
  assert.equal(M.checkAngular(p, { wText: '2.5', nText: '0.199' }).wReason, 'noW0');
  assert.equal(M.checkAngular(p, { wText: '1.5', nText: '1.25' }).nReason, 'radians');
  assert.equal(M.checkAngular(p, { wText: '1.5', nText: M.rev(-5 + 12.5).toFixed(3) }).nReason, 'noHalf');
  assert.equal(M.checkLinear(p, { vText: '1.2', aText: '1.8' }).ok, true);    // v = 1.2 m/s, a_r = 1.8 m/s²
  assert.equal(M.checkLinear(p, { vText: '1.875', aText: '1.8' }).vReason, 'divide');
  assert.equal(M.checkLinear(p, { vText: '1.2', aText: '0.4' }).aReason, 'tangential');
  assert.equal(M.checkLinear(p, { vText: '1.2', aText: '1.2' }).aReason, 'noSquare');
});

test('every slider setting gives finite values', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u) => c.min + Math.round(u * (c.max - c.min) / c.step) * c.step;
  let seed = 41;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 300; k++) {
    const p = { activity: k % 2 ? 'linear' : 'angular' };
    for (const id of ['w0', 'alpha', 't1', 'r']) p[id] = pick(byId[id], rnd());
    const T = M.duration(p);
    for (const t of [0, T / 2, T]) for (const [key, val] of Object.entries(M.observe(M.at(t), p))) if (typeof val === 'number') assert.ok(Number.isFinite(val), key);
  }
});
