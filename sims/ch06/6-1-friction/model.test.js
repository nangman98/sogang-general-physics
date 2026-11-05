// node --test sims/ch06/6-1-friction/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const rad = d => d * Math.PI / 180;

test('Sample Problem 6.1.1: 12.0 N pushed 30.0° below the horizontal on an 8.00 kg block stays at rest', () => {
  const p = { m: 8.0, F: 12.0, theta: 30.0, dir: 'push', mus: 0.700, muk: 0.400 };
  const s = M.angled(p);
  close(+s.Fx.toFixed(2), 10.39);                                     // (6.1.3)
  close(s.FN, 8.0 * M.G + 12.0 * Math.sin(rad(30)));                  // (6.1.5)
  close(+s.fsMax.toFixed(2), 59.08);                                  // (6.1.6)
  assert.equal(s.slides, false);
  close(+s.f.toFixed(1), 10.4);                                       // (6.1.7)
  close(s.a, 0);
});

test('Sample Problem 6.1.2: sliding down an 18° slope with μk = 0.040 gives a = 2.7 m/s²', () => {
  const s = M.incline({ m: 70, incl: 18, mus: 0.040, muk: 0.040 });
  assert.equal(s.slides, true);
  close(+s.a.toFixed(1), 2.7);
  close(s.a, M.G * (Math.sin(rad(18)) - 0.040 * Math.cos(rad(18))));
  close(s.f, 0.040 * 70 * M.G * Math.cos(rad(18)));                    // f_k = μk F_N with F_N = mg cos θ
});

test('Sample Problem 6.1.3: kinetic friction alone gives a = −μk g; 290 m skid means v0 = 58 m/s', () => {
  // Level road: the incline model at θ = 0 has F_N = mg, so f_k / m = μk g.
  const s = M.incline({ m: 1000, incl: 0, mus: 0.6, muk: 0.60 });
  close(s.FN, 1000 * M.G);
  const a = -0.60 * s.FN / 1000;
  const v0 = Math.sqrt(-2 * a * 290);
  close(+v0.toFixed(0), 58); close(Math.round(v0 * 3.6 / 10) * 10, 210);
});

test('ramp: static friction matches F up to μs F_N, then kinetic friction μk F_N acts (Eqs. 6.1.1, 6.1.2)', () => {
  const p = { m: 4, mus: 0.6, muk: 0.4 };
  const L = M.rampLimits(p);
  close(L.FN, 4 * M.G); close(L.fsMax, 0.6 * 4 * M.G); close(L.fk, 0.4 * 4 * M.G);
  close(L.tb, L.fsMax / M.RATE);
  for (const t of [0, 0.5, 1.5, L.tb]) { const o = M.rampAt(t, p); close(o.f, o.F); close(o.x, 0); close(o.v, 0); }
  for (const t of [L.tb + 1e-6, L.tb + 0.4, L.tb + 1.3]) {
    const o = M.rampAt(t, p);
    close(o.f, L.fk);
    close(p.m * o.a, o.F - o.f);                                       // second law along the floor
  }
  // x(τ) and v(τ) are the integrals of a(τ): check by finite differences.
  const t = L.tb + 0.8, h = 1e-5, o = M.rampAt(t, p);
  close((M.rampAt(t + h, p).x - M.rampAt(t - h, p).x) / (2 * h), o.v, 1e-6);
  close((M.rampAt(t + h, p).v - M.rampAt(t - h, p).v) / (2 * h), o.a, 1e-6);
  // The friction force drops at breakaway when μk < μs (Fig. 6.1.1g) and stays when μk = μs.
  assert.ok(M.rampAt(L.tb + 1e-6, p).f < M.rampAt(L.tb, p).f);
  close(M.rampAt(1.5 + 1e-6, { m: 2, mus: 0.5, muk: 0.5 }).F, M.RATE * (1.5 + 1e-6));
});

test('angled: a pull lowers F_N, a push raises it; sliding starts only when F cos θ exceeds μs F_N', () => {
  const base = { m: 5, F: 30, theta: 40, mus: 0.5, muk: 0.3 };
  const push = M.angled({ ...base, dir: 'push' }), pull = M.angled({ ...base, dir: 'pull' });
  close(push.FN, 5 * M.G + 30 * Math.sin(rad(40)));
  close(pull.FN, 5 * M.G - 30 * Math.sin(rad(40)));
  close(push.Fx, pull.Fx);
  assert.equal(push.slides, false);                                   // 23.0 N < 0.5 × 68.3 N
  assert.equal(pull.slides, true);                                    // 23.0 N > 0.5 × 29.7 N
  close(pull.a, (pull.Fx - 0.3 * pull.FN) / 5);
  // Exactly at the limit the block does not slide ("exceeds", property 2).
  const F = 0.5 * 5 * M.G, edge = M.angled({ m: 5, F, theta: 0, dir: 'push', mus: 0.5, muk: 0.3 });
  assert.equal(edge.slides, false); close(edge.f, F);
  // The pull slider never lifts the block off the floor.
  for (const th of [10, 30, 60]) assert.ok(M.angled({ ...base, F: M.pullLimit(5, th), theta: th, dir: 'pull' }).FN > 0);
});

test('incline: critical angle tan θc = μs, independent of the mass', () => {
  for (const mus of [0.1, 0.35, 0.6, 1.0]) {
    const c = M.incline({ m: 1, incl: 10, mus, muk: mus / 2 }).thetaC;
    close(Math.tan(rad(c)), mus);
    assert.equal(M.incline({ m: 3, incl: c - 0.01, mus, muk: mus / 2 }).slides, false);
    assert.equal(M.incline({ m: 3, incl: c + 0.01, mus, muk: mus / 2 }).slides, true);
    close(M.incline({ m: 1, incl: c + 5, mus, muk: mus / 2 }).a, M.incline({ m: 9, incl: c + 5, mus, muk: mus / 2 }).a);
  }
  const rest = M.incline({ m: 4, incl: 20, mus: 0.6, muk: 0.4 });
  close(rest.f, 4 * M.G * Math.sin(rad(20)));                          // static friction balances mg sin θ
  close(rest.a, 0);
  const slide = M.incline({ m: 4, incl: 40, mus: 0.6, muk: 0.4 });
  close(slide.a, M.G * (Math.sin(rad(40)) - 0.4 * Math.cos(rad(40))));
  assert.ok(slide.a > 0);
});

test('grading: ramp, angled and incline answers with the named mistakes', () => {
  const R = { m: 4, mus: 0.6, muk: 0.4 };                             // f_s,max = 23.52 N, f_k = 15.68 N
  assert.equal(M.checkRamp(R, { breakText: '23.5', afterText: '15.7' }).ok, true);
  assert.equal(M.checkRamp(R, { breakText: '15.68', afterText: '15.7' }).breakReason, 'kinetic');
  assert.equal(M.checkRamp(R, { breakText: '39.2', afterText: '15.7' }).breakReason, 'weight');
  assert.equal(M.checkRamp(R, { breakText: '23.5', afterText: '23.52' }).afterReason, 'static');
  assert.equal(M.checkRamp(R, { breakText: 'a', afterText: '15.7' }).breakReason, 'unreadable');

  const A = { m: 5, F: 20, theta: 30, dir: 'push', mus: 0.5, muk: 0.3 };   // F_N = 59 N, at rest, f = 17.3 N
  assert.equal(M.checkAngled(A, { move: 'rest', fText: '17.3' }).ok, true);
  assert.equal(M.checkAngled(A, { move: 'rest', fText: '29.5' }).fReason, 'fsmax');
  assert.equal(M.checkAngled(A, { move: 'rest', fText: '17.7' }).fReason, 'kineticAtRest');
  assert.equal(M.checkAngled(A, { move: 'slide', fText: '17.3' }).moveReason, 'wrong');
  const P = { m: 5, F: 30, theta: 40, dir: 'pull', mus: 0.5, muk: 0.3 };   // slides; with F_N = mg it would not
  assert.equal(M.checkAngled(P, { move: 'rest', fText: '8.9' }).moveReason, 'noFy');
  assert.equal(M.checkAngled(P, { move: 'slide', fText: (0.3 * M.angled(P).FN).toFixed(2) }).ok, true);
  assert.equal(M.checkAngled(P, { move: 'slide', fText: (0.3 * 5 * M.G).toFixed(2) }).fReason, 'noFy');

  const I = { m: 4, incl: 40, mus: 0.6, muk: 0.4 };                    // θc = 30.96°, a = 3.30 m/s²
  assert.equal(M.checkIncline(I, { cText: '31', aText: '3.30' }).ok, true);
  assert.equal(M.checkIncline(I, { cText: '36.9', aText: '3.30' }).cReason, 'sin');
  assert.equal(M.checkIncline(I, { cText: '53.1', aText: '3.30' }).cReason, 'cos');
  assert.equal(M.checkIncline(I, { cText: '31', aText: '6.30' }).aReason, 'noFriction');
  assert.equal(M.checkIncline(I, { cText: '31', aText: (M.G * (Math.sin(rad(40)) - 0.6 * Math.cos(rad(40)))).toFixed(3) }).aReason, 'static');
  assert.equal(M.checkIncline({ ...I, incl: 20 }, { cText: '31', aText: '0' }).ok, true);
  assert.equal(M.checkIncline({ ...I, incl: 20 }, { cText: '31', aText: '1.2' }).aReason, 'rest');
});

test('runs stop after the block slides TRAVEL; every slider setting gives finite values', () => {
  const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 300; k++) {
    const mus = 0.05 + Math.round(rnd() * 19) * 0.05, muk = 0.05 + Math.round(rnd() * (mus - 0.05) / 0.05) * 0.05;
    const m = 0.5 + Math.round(rnd() * 19) * 0.5, theta = Math.round(rnd() * 60), dir = rnd() < 0.5 ? 'push' : 'pull';
    const F = Math.min(Math.round(rnd() * 60), dir === 'pull' ? M.pullLimit(m, theta) : 60);
    for (const activity of ['ramp', 'angled', 'incline']) {
      const p = { ...defaults, activity, m, mus, muk, dir, F, theta, incl: Math.round(rnd() * 60) };
      const T = M.duration(p);
      assert.ok(Number.isFinite(T) && T > 0);
      const o = M.observe(M.at(T), p);
      for (const key of ['f', 'FN', 'a', 'v', 'x']) assert.ok(Number.isFinite(o[key]), `${activity} ${key}`);
      assert.ok(o.x <= M.TRAVEL + 1e-6 && o.x >= 0);
      assert.ok(o.FN > 0 && o.f >= 0);
      assert.ok(M.forceScale(p) > 0);
    }
  }
});
