// node --test sims/ch15/15-4-forced-oscillation-resonance/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const P = { m: 0.5, k: 32, b: 0.5, Fm: 0.5, wd: 5 };

test('the forced oscillation x = xm cos(ωd t + ϕ) (Eq. 15.6.1) solves m d²x/dt² + b dx/dt + kx = Fm cos ωd t (Eq. 15.5.2 + driving force)', () => {
  for (const wd of [1.5, 5, 8, 11, 19]) {
    const p = { ...P, wd }, h = 1e-4, x = t => M.stateAt(t, p).x;
    for (const t of [0.1, 0.77, 2.4]) {
      const o = M.stateAt(t, p), acc = (x(t + h) - 2 * x(t) + x(t - h)) / (h * h);
      close((x(t + h) - x(t - h)) / (2 * h), o.v, 1e-6);
      close(p.m * acc + p.b * o.v + p.k * o.x, p.Fm * Math.cos(wd * t), 1e-5);
      close(o.F, p.k * o.ys, 1e-12);                 // the moving support pulls with k ys, Fm = kd
    }
    close(M.duration(p), 4 * Math.PI / wd); close(M.stateAt(M.duration(p), p).x, M.stateAt(0, p).x, 1e-12);
  }
});

test('the amplitude is the Problem 34 expression; limits Fm/k at ωd → 0, Fm/bω with ϕ = −π/2 at ωd = ω, Fm/mωd² far above', () => {
  const w = M.natural(P);
  for (const wd of [2, 7.5, 13]) {
    const s = M.forced({ ...P, wd });
    close(s.xm, P.Fm / Math.sqrt(P.m ** 2 * (wd ** 2 - w ** 2) ** 2 + P.b ** 2 * wd ** 2), 1e-12);
    assert.ok(s.phi <= 0 && s.phi > -Math.PI);
  }
  close(M.forced(P, 1e-6).xm, P.Fm / P.k, 1e-9); close(M.forced(P, 1e-6).phi, 0, 1e-6);
  const r = M.forced(P, w); close(r.xm, P.Fm / (P.b * w)); close(r.phi, -Math.PI / 2); close(r.vm, P.Fm / P.b);
  const far = M.forced(P, 1e4); close(far.xm * P.m * 1e8, P.Fm, 1e-4); assert.ok(far.phi < -Math.PI + 1e-3);
});

test('Eq. 15.6.2: the velocity amplitude peaks exactly at ωd = ω; the displacement amplitude peaks at √(ω² − b²/2m²), within 0.5 % of ω here', () => {
  const w = M.natural(P), scan = f => { let best = 0, at = 0; for (let i = 1; i <= 200000; i++) { const wd = i * 1e-4; const v = f(wd); if (v > best) { best = v; at = wd; } } return at; };
  close(scan(wd => M.forced(P, wd).vm), w, 2e-5);
  const pk = M.peak(P);
  close(scan(wd => M.forced(P, wd).xm), pk.wp, 2e-5);
  close(pk.wp, Math.sqrt(w * w - P.b ** 2 / (2 * P.m ** 2)));
  assert.ok(Math.abs(pk.wp / w - 1) < 0.005);
});

test('Fig. 15.6.1: less damping gives a taller and narrower peak (b against 2b)', () => {
  const w = M.natural(P), q = { ...P, b: 2 * P.b };
  assert.ok(M.peak(P).xm > 1.9 * M.peak(q).xm);
  const width = p => {                                    // full width where vm falls to 1/√2 of its peak
    const top = M.forced(p, w).vm / Math.SQRT2; let lo = 0, hi = 0;
    for (let i = 1; i <= 40000; i++) { const wd = i * 5e-4, v = M.forced(p, wd).vm; if (v >= top) { if (!lo) lo = wd; hi = wd; } }
    return hi - lo;
  };
  close(width(P), P.b / P.m, 1e-3); close(width(q), q.b / q.m, 1e-3);   // half-power width b/m
});

test('steady state energy: the driving force supplies on average what the damping force removes, ⟨Fv⟩ = ⟨bv²⟩', () => {
  for (const wd of [3, M.natural(P), 12]) {
    const p = { ...P, wd }, T = 2 * Math.PI / wd, n = 4000;
    let inP = 0, out = 0;
    for (let i = 0; i < n; i++) { const o = M.stateAt((i + 0.5) * T / n, p); inP += o.F * o.v; out += p.b * o.v * o.v; }
    close(inP / n, out / n, 1e-9);
  }
});

test('grading with the named mistakes; at the defaults every mistake is more than 2 % away from the answer', () => {
  const w = M.natural(P), xr = M.forced(P, w).xm * 100, mk = M.mistakes(P);
  close(w, 8); close(xr, 12.5);
  for (const v of Object.values(mk.w)) assert.ok(!M.near(v, w), `w mistake ${v}`);
  for (const v of Object.values(mk.x)) assert.ok(!M.near(v, xr), `x mistake ${v}`);
  assert.equal(M.check(P, { wText: '8', xText: '12.5' }).ok, true);
  for (const [why, val] of Object.entries(mk.w)) assert.equal(M.check(P, { wText: String(val), xText: '12.5' }).wReason, why);
  for (const [why, val] of Object.entries(mk.x)) assert.equal(M.check(P, { wText: '8', xText: String(val) }).xReason, why);
  assert.equal(M.check(P, { wText: 'x', xText: '1' }).wReason, 'unreadable');
  // The answers do not depend on the driving angular frequency set on the slider.
  assert.equal(M.check({ ...P, wd: 17 }, { wText: '8', xText: '12.5' }).ok, true);
});
