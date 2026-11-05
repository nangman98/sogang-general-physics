// node --test sims/ch08/8-3-thermal-energy/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 8.4.1: 25 men pull a 9000 kg statue 45 m in 2 min, W = ΔE_th = 1.8 × 10⁶ J', () => {
  const F = 25 * 2 * 80 * M.G, m = 9000;
  const p = { m, F, muk: F / (m * M.G), d: 45, v0: 45 / 120 };           // pulled at constant speed: F = f_k
  const s = M.pull(p);
  close(s.a, 0, 1e-12); close(s.T, 120, 1e-9);
  close(+(s.W / 1e6).toFixed(1), 1.8); close(s.Eth, s.W); close(s.dK, 0, 1e-9);
  close(+(F * 1e4 / 1e8).toFixed(1), 3.9);                               // 10 km
});

test('Sample Problem 8.5.1: ΔE_th = ½mv0² − mg(y − y0) = 30 J for the beagle', () => {
  const dEth = 0.5 * 6.0 * 7.8 ** 2 - 6.0 * M.G * (11.1 - 8.5);
  close(Math.round(dEth), 30);
});

test('Sample Problem 8.5.2: runout d/H = 1/μk − 1/tan θ = 0.67 at μk = 0.60, θ = 45°; d/H = 20 needs μk ≈ 0.05', () => {
  const r = M.ramp({ m: 1, H: 1, theta: 45, muk: 0.60 });
  close(+r.ratio.toFixed(2), 0.67); close(r.d, r.ratio, 1e-12);          // H = 1 m
  close(+(1 / (20 + 1 / Math.tan(Math.PI / 4))).toFixed(2), 0.05);
});

test('ramp: U + K + E_th stays mgH at every instant, and the block stops d past the bottom', () => {
  for (const p of [{ m: 2, H: 1.5, theta: 40, muk: 0.3 }, { m: 0.5, H: 2.5, theta: 20, muk: 0.2 }, { m: 5, H: 0.5, theta: 70, muk: 0.8 }]) {
    const r = M.ramp(p), T = M.duration({ activity: 'ramp', ...p });
    for (let i = 0; i <= 50; i++) { const o = M.rampAt(T * i / 50, p); close(o.U + o.K + o.Eth, r.E0, 1e-9); }
    const end = M.rampAt(T, p);
    close(end.v, 0, 1e-9); close(end.s - r.L, p.H * (1 / p.muk - 1 / Math.tan(p.theta * Math.PI / 180)), 1e-9);
    close(end.Eth, p.m * M.G * p.H, 1e-9);
  }
});

test('pull: F x = ΔK + ΔE_th (Eq. 8.4.8 with ΔU = 0) at every instant', () => {
  const p = { m: 2, F: 10, muk: 0.3, d: 4, v0: 2 };
  const s = M.pull(p);
  for (let i = 0; i <= 20; i++) { const o = M.pullAt(s.T * i / 20, p); close(o.W, o.K - s.Ki + o.Eth, 1e-9); }
  close(M.pullAt(s.T, p).x, 4, 1e-9);
  close(s.Eth, 0.3 * 2 * M.G * 4);
});

test('grading with the named mistakes', () => {
  const p = { m: 2, F: 10, muk: 0.3, d: 4, v0: 2 };                       // E_th = 23.52 J, K_f = 4 + 40 − 23.52 = 20.48 J
  assert.equal(M.checkPull(p, { EText: '23.5', KText: '20.5' }).ok, true);
  assert.equal(M.checkPull(p, { EText: '40', KText: '20.5' }).EReason, 'work');
  assert.equal(M.checkPull(p, { EText: '1.2', KText: '20.5' }).EReason, 'noWeight');
  assert.equal(M.checkPull(p, { EText: '23.5', KText: '44' }).KReason, 'noFriction');
  assert.equal(M.checkPull(p, { EText: '23.5', KText: '16.48' }).KReason, 'noKi');
  const q = { m: 2, H: 1.5, theta: 40, muk: 0.3 }, d = M.ramp(q).d;
  assert.equal(M.checkRamp(q, { dText: d.toFixed(2), cmp: 'equal' }).ok, true);
  assert.equal(M.checkRamp(q, { dText: '5', cmp: 'equal' }).dReason, 'noPlane');
  assert.equal(M.checkRamp(q, { dText: d.toFixed(2), cmp: 'less' }).cReason, 'less');
});

test('every slider setting gives finite runs; the block always starts to slide on the plane', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u, lo = c.min, hi = c.max) => Math.min(hi, Math.max(lo, c.min + Math.round(u * (c.max - c.min) / c.step) * c.step));
  let seed = 17;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 400; k++) {
    const p = { activity: k % 2 ? 'ramp' : 'pull' };
    for (const id of ['m', 'muk', 'd', 'v0', 'H']) p[id] = pick(byId[id], rnd());
    p.F = pick(byId.F, rnd(), ...byId.F.bounds(p)); p.theta = pick(byId.theta, rnd(), ...byId.theta.bounds(p));
    assert.ok(Math.tan(p.theta * Math.PI / 180) > p.muk);
    const T = M.duration(p);
    assert.ok(Number.isFinite(T) && T > 0 && T < 60, `T = ${T}`);
    for (const t of [0, T / 2, T]) for (const [key, val] of Object.entries(M.observe(M.at(t), p))) if (typeof val === 'number') assert.ok(Number.isFinite(val), key);
  }
});
