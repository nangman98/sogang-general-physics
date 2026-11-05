// node --test sims/ch10/10-3-torque/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 10.7.2: judo hip throw, F = −Iα/d1 = 300 N; with gravity at d2 = 0.12 m, F = 613.6 N', () => {
  const I = 15, alpha = -6.0, d1 = 0.30, d2 = 0.12, m = 80;
  const F1 = -I * alpha / d1;                                             // τ_net = −d1F = Iα (Eq. 10.7.4)
  close(F1, 300); close(-M.torque(d1, F1, 90), I * alpha);
  const F2 = (d2 * m * M.G - I * alpha) / d1;
  close(+F2.toFixed(1), 613.6);
  close(-M.torque(d1, F2, 90) + M.torque(d2, m * M.G, 90), I * alpha, 1e-12);
});

test('Sample Problem 10.7.1: balance of torques on the foot gives T = 151 N, and 442 N on a 17.74° incline', () => {
  const mg = 350, df = 0.18, db = 0.070, phi = 5.0;
  const T1 = (df * 0.40 * mg - db * 0.60 * mg) / (db * Math.cos(phi * Math.PI / 180));
  close(Math.round(T1), 151);
  close(-M.torque(df, 0.40 * mg, 90) + M.torque(db, 0.60 * mg, 90) + M.torque(db, T1, 90 - phi), 0, 1e-9);   // r_⊥ form
  const c = Math.cos(17.74 * Math.PI / 180);
  const T2 = (df * 0.65 * mg * c - db * 0.35 * mg * c) / (db * Math.cos(phi * Math.PI / 180));
  close(Math.round(T2), 442);
});

test('τ = rF sin φ (Eqs. 10.6.1–10.6.3): zero along the radial line, largest at 90°, and α = τ/I', () => {
  close(M.torque(0.4, 4, 0), 0); close(M.torque(0.4, 4, 180), 0, 1e-12); close(M.torque(0.4, 4, 90), 1.6);
  close(M.torque(0.4, 4, 30), 0.4 * (4 * Math.sin(Math.PI / 6)));        // r F_t
  close(M.torque(0.4, 4, 30), 0.4 * Math.sin(Math.PI / 6) * 4);          // r_⊥ F
  const s = M.solve({ activity: 'torque', M: 2, R: 0.5, F: 4, r: 0.4, phi: 60 });
  close(s.I, 0.25); close(s.alpha, s.tau / 0.25);
});

test('pulley: block, disk and no-slip equations agree; limits M → 0 and m → 0', () => {
  for (const p of [{ M: 2, R: 0.5, m: 1 }, { M: 5, R: 0.2, m: 0.2 }, { M: 0.5, R: 0.6, m: 3 }]) {
    const s = M.pulley(p);
    close(p.m * M.G - s.T, p.m * s.a);                                    // block
    close(s.T * p.R, s.I * s.alpha);                                      // disk, Eq. 10.7.4
    close(s.a, s.alpha * p.R);                                            // cord does not slip
  }
  close(M.pulley({ M: 1e-9, R: 0.5, m: 1 }).a, M.G, 1e-8);
  close(M.pulley({ M: 2, R: 0.5, m: 1e-9 }).a, 0, 1e-8);
  const p = { activity: 'pulley', M: 2, R: 0.5, m: 1 }, T = M.duration(p);
  close(M.stateAt(T, p).y, M.DROP, 1e-9);
});

test('grading with the named mistakes', () => {
  const q = { activity: 'torque', M: 2, R: 0.5, F: 4, r: 0.4, phi: 60 };   // τ = 1.386, α = 5.543
  const s = M.solve(q);
  assert.equal(M.checkTorque(q, { tText: s.tau.toFixed(3), aText: s.alpha.toFixed(3) }).ok, true);
  assert.equal(M.checkTorque(q, { tText: '0.8', aText: '5.54' }).tReason, 'cos');
  assert.equal(M.checkTorque(q, { tText: '1.6', aText: '5.54' }).tReason, 'noSin');
  assert.equal(M.checkTorque(q, { tText: (0.5 * 4 * Math.sin(Math.PI / 3)).toFixed(3), aText: '5.54' }).tReason, 'rim');
  assert.equal(M.checkTorque(q, { tText: '1.386', aText: (s.tau / 0.5).toFixed(3) }).aReason, 'hoopI');
  const p = { activity: 'pulley', M: 2, R: 0.5, m: 1 };                   // a = 4.9, T = 4.9
  assert.equal(M.checkPulley(p, { aText: '4.9', TText: '4.9' }).ok, true);
  assert.equal(M.checkPulley(p, { aText: '9.8', TText: '4.9' }).aReason, 'freefall');
  assert.equal(M.checkPulley(p, { aText: '3.27', TText: '4.9' }).aReason, 'hoopI');
  assert.equal(M.checkPulley(p, { aText: '4.9', TText: '9.8' }).TReason, 'weight');
});

test('every slider setting gives finite runs', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u, hi = c.max) => Math.min(hi, c.min + Math.round(u * (c.max - c.min) / c.step) * c.step);
  let seed = 43;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 300; k++) {
    const p = { activity: k % 2 ? 'pulley' : 'torque' };
    for (const id of ['M', 'R', 'F', 'phi', 'm']) p[id] = pick(byId[id], rnd());
    p.r = pick(byId.r, rnd(), p.R);
    const T = M.duration(p);
    assert.ok(Number.isFinite(T) && T > 0 && T < 10);
    for (const t of [0, T / 2, T]) for (const [key, val] of Object.entries(M.observe(M.at(t), p))) if (typeof val === 'number') assert.ok(Number.isFinite(val), key);
  }
});
