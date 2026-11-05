// node --test sims/ch15/15-3-damped-oscillation/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const P = { m: 0.4, k: 25, b: 0.12, xm: 10 };

test('Eqs. 15.5.2–15.5.5: x(t) solves m d²x/dt² + b dx/dt + kx = 0, v = dx/dt, x(0) = xm; b → 0 gives ω′ = √(k/m)', () => {
  for (const p of [P, { m: 0.2, k: 40, b: 0.5, xm: 15 }, { m: 1, k: 10, b: 0.25, xm: 5 }]) {
    const h = 1e-4, x = t => M.stateAt(t, p).x;
    for (const t of [0.05, 0.8, 2.3, 7.1]) {
      const o = M.stateAt(t, p);
      close((x(t + h) - x(t - h)) / (2 * h), o.v, 1e-6);
      const acc = (x(t + h) - 2 * x(t) + x(t - h)) / (h * h);
      close(p.m * acc + p.b * o.v + p.k * o.x, 0, 1e-5);
      close(o.Fd, -p.b * o.v, 1e-12);                                  // Eq. 15.5.1
    }
    close(M.stateAt(0, p).x, p.xm / 100, 1e-12);
  }
  const s = M.oscillator({ ...P, b: 1e-9 });
  close(s.wd, Math.sqrt(P.k / P.m), 1e-12);
});

test('amplitude xm e^(−bt/2m) halves at 2m ln 2 / b; Eq. 15.5.6 energy halves at m ln 2 / b, half that time', () => {
  const s = M.oscillator(P);
  close(M.stateAt(s.tAmp, P).amp, s.A / 2, 1e-12);
  close(M.stateAt(s.tE, P).Eapprox, s.E0 / 2, 1e-12);
  close(s.tE, s.tAmp / 2, 1e-12);
  // x touches the envelope at every peak of cos(ω′t) and never leaves it.
  for (let i = 0; i <= 400; i++) { const o = M.stateAt(i * M.RUN / 400, P); assert.ok(Math.abs(o.x) <= o.amp + 1e-15); }
});

test('energy balance: K + U plus the work of the damping force ∫ b v² dt stays equal to the starting energy', () => {
  for (const p of [P, { m: 0.2, k: 40, b: 0.5, xm: 15 }]) {
    const n = 20000, T = 6, h = T / n, f = t => p.b * M.stateAt(t, p).v ** 2;
    let W = 0;
    for (let i = 0; i < n; i += 2) W += h / 3 * (f(i * h) + 4 * f((i + 1) * h) + f((i + 2) * h));   // Simpson
    const o0 = M.stateAt(0, p), o = M.stateAt(T, p);
    close(o.E + W, o0.E, 1e-6);
    close(o.Eth, W, 1e-6); close(o0.Eth, 0, 1e-12);
  }
});

test('Eq. 15.5.6 holds for small b: K + U averaged over one period is within 1 % of ½kxm² e^(−bt/m)', () => {
  const s = M.oscillator(P);
  for (const t0 of [1, 3, 6]) {
    let sum = 0; const n = 2000;
    for (let i = 0; i < n; i++) sum += M.stateAt(t0 + (i + 0.5) * s.T / n, P).E;
    const tm = t0 + s.T / 2;
    assert.ok(Math.abs(sum / n / M.stateAt(tm, P).Eapprox - 1) < 0.01);
  }
});

test('Sample Problem 15.5.1: m = 250 g, k = 85 N/m, b = 70 g/s → √(km) = 4.6 kg/s, T = 0.34 s, amplitude half 5.0 s, energy half 2.5 s', () => {
  const p = { m: 0.25, k: 85, b: 0.07, xm: 10 }, s = M.oscillator(p);
  assert.equal(Math.sqrt(p.k * p.m).toFixed(1), '4.6');
  assert.equal((2 * Math.PI * Math.sqrt(p.m / p.k)).toFixed(2), '0.34');            // Eq. 15.1.13, since b ≪ √(km)
  assert.ok(Math.abs(s.wd / s.w - 1) < 1e-4);
  assert.equal(s.tAmp.toFixed(1), '5.0'); assert.equal(s.tE.toFixed(1), '2.5');
  assert.equal(Math.round(s.tAmp / s.T), 15);                                       // about 15 periods
});

test('slider bounds: b ≥ 0.25 m keeps the half-amplitude time inside the run, and ω′ is real over the whole range', () => {
  const bp = M.params.find(q => q.id === 'b');
  for (let m = 0.2; m <= 1.0001; m += 0.05) {
    const [lo, hi] = bp.bounds({ m });
    assert.ok(lo >= 0.25 * m - 1e-12 && hi === 0.5);
    assert.ok(M.oscillator({ m, k: 10, b: lo, xm: 15 }).tAmp < M.RUN);
    for (const k of [10, 40]) assert.ok(k / m > (hi / (2 * m)) ** 2);
  }
  close(bp.bounds({ m: 0.4 })[0], 0.1, 1e-12);
  close(M.duration(P), M.RUN); close(M.duration({ ...P, b: 0.5 }), M.RUN);
});

test('grading with the named mistakes; at the defaults every mistake is more than 2 % away from the answer', () => {
  const s = M.oscillator(P), mk = M.mistakes(P);
  for (const v of Object.values(mk.amp)) assert.ok(!M.near(v, s.tAmp), `amp mistake ${v}`);
  for (const v of Object.values(mk.E)) assert.ok(!M.near(v, s.tE), `E mistake ${v}`);
  assert.equal(M.check(P, { ampText: s.tAmp.toFixed(3), EText: s.tE.toFixed(3) }).ok, true);
  for (const [why, val] of Object.entries(mk.amp)) assert.equal(M.check(P, { ampText: String(val), EText: String(s.tE) }).aReason, why);
  for (const [why, val] of Object.entries(mk.E)) assert.equal(M.check(P, { ampText: String(s.tAmp), EText: String(val) }).eReason, why);
  assert.equal(M.check(P, { ampText: '', EText: '1' }).aReason, 'unreadable');
});
