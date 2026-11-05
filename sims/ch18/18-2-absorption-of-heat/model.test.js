// node --test sims/ch18/18-2-absorption-of-heat/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 18.4.1: copper slug 75 g at 312°C, water 220 g and beaker 45 cal/K at 12°C → T_f = 19.6°C', () => {
  // Worked in calories as the textbook does: c_cu = 0.0923 cal/g·K (Table 18.4.1), c_w = 1.00 cal/g·K.
  const e = M.equilibrium([{ C: 0.0923 * 75, T: 312 }, { C: 1.00 * 220, T: 12 }, { C: 45, T: 12 }]);
  assert.equal(e.Tf.toFixed(1), '19.6');
  close(e.Q.reduce((s, q) => s + q, 0), 0);                          // Eq. 18.4.11
  // The textbook's Q_w ≈ 1670 cal, Q_b ≈ 342 cal, Q_c ≈ −2020 cal use T_f rounded to 19.6°C (unrounded: 1680, 344, −2024).
  const T = +e.Tf.toFixed(1), Qw = 220 * (T - 12), Qb = 45 * (T - 12), Qc = 0.0923 * 75 * (T - 312);
  assert.ok(Math.abs(Qw - 1670) <= 5 && Math.abs(Qb - 342) <= 0.5 && Math.abs(Qc + 2020) <= 5, `${Qw} ${Qb} ${Qc}`);
});

test('Sample Problem 18.4.2: 720 g of ice at −10°C to water at 15°C needs 15.98 + 239.8 + 45.22 ≈ 300 kJ; 210 kJ leaves 580 g water and 140 g ice at 0°C', () => {
  // The sample problem warms the liquid with c = 4186.8 J/kg·K (Eq. 18.4.4); Table 18.4.1 and the screen use 4187.
  const c = M.curve({ m: 720, Ti: -10, Tf: 15, boil: false }, { cWater: 4186.8 });
  assert.equal(c.steps[0].Q.toFixed(0), '15984'); close(c.steps[1].Q, 239760); assert.equal(c.steps[2].Q.toFixed(0), '45217');
  assert.equal((c.Q / 1000).toFixed(0), '301');                        // 300.96 kJ, written ≈ 300 kJ
  assert.equal(c.most, 'melt');
  const s = M.curveAt(210e3, { m: 720, Ti: -10, Tf: 15, boil: false });
  assert.equal(s.T, 0); assert.equal(s.water.toFixed(3), '0.583'); assert.equal(Math.round(s.ice * 100) * 10, 140);
});

test('heating curve: temperature rises on Eq. 18.4.3 and stays at 0°C and 100°C on Eq. 18.4.5; the masses add up', () => {
  const p = { m: 300, Ti: -30, Tf: 60, boil: true }, c = M.curve(p);
  close(c.Q, M.C_ICE * 0.3 * 30 + M.LF * 0.3 + M.C_WATER * 0.3 * 100 + M.LV * 0.3);
  assert.equal(c.most, 'boil');
  for (const f of [0, 0.03, 0.2, 0.31, 0.5, 0.77, 0.99, 1]) {
    const s = M.curveAt(f * c.Q, p);
    close(s.ice + s.water + s.steam, 0.3);
    assert.ok(s.T >= -30 - 1e-9 && s.T <= 100 + 1e-9);
  }
  close(M.curveAt(c.steps[0].Q1, p).T, 0); close(M.curveAt((c.steps[1].Q0 + c.steps[1].Q1) / 2, p).ice, 0.15);
  close(M.curveAt(c.steps[2].Q1, p).T, 100); close(M.curveAt(c.Q, p).steam, 0.3);
  // Slope of each warming step is 1/(cm).
  const h = 1, a = M.curveAt(c.steps[2].Q0 + 1000, p).T, b = M.curveAt(c.steps[2].Q0 + 1000 + h, p).T;
  close((b - a) / h, 1 / (M.C_WATER * 0.3), 1e-6);
});

test('mixing: the two transfers add to zero, T_f lies between the start temperatures and stays below 100°C on every slider setting', () => {
  const p = { solid: 'aluminum', ms: 200, Ts: 150, mw: 300, Tw: 20 }, s = M.mix(p);
  close(s.Qs + s.Qw, 0); close(s.Cs * (s.Tf - 150) + s.Cw * (s.Tf - 20), 0);
  close(M.mixAt(s.Qw, p).Ts, s.Tf); close(M.mixAt(s.Qw, p).Tw, s.Tf);
  for (const solid of Object.keys(M.SOLIDS)) for (const ms of [50, 300]) for (const mw of [200, 600]) for (const Ts of [50, 250]) for (const Tw of [5, 40]) {
    const q = M.mix({ solid, ms, Ts, mw, Tw });
    assert.ok(q.Tf > Tw && q.Tf < Ts && q.Tf < 100, `${solid} ${ms} ${mw} ${Ts} ${Tw}`);
  }
});

test('grading with the named mistakes; at the default settings every mistake is more than 2% from the answer', () => {
  const p = { activity: 'curve', m: 250, Ti: -20, Tf: 40, boil: false }, c = M.curve(p), kJ = c.Q / 1000;
  const f = x => x.toFixed(4), [s1, s2] = c.steps;
  assert.equal(M.checkCurve(p, { QText: f(kJ), most: 'melt' }).ok, true);
  assert.equal(M.checkCurve(p, { QText: f(kJ), most: 'water' }).mostOk, false);
  const wrong = { noLatent: kJ - s2.Q / 1000, noIce: kJ - s1.Q / 1000, oneC: kJ - s1.Q / 1000 + M.C_WATER * 0.25 * 20 / 1000, swapL: kJ + (M.LV - M.LF) * 0.25 / 1000, units: c.Q };
  for (const [reason, w] of Object.entries(wrong)) {
    assert.equal(M.checkCurve(p, { QText: f(w), most: 'melt' }).QReason, reason);
    assert.ok(Math.abs(w - kJ) > 0.02 * kJ, reason);
  }
  const b = { ...p, boil: true }, cb = M.curve(b);
  assert.equal(M.checkCurve(b, { QText: f(cb.Q / 1000 - M.LV * 0.25 / 1000), most: 'boil' }).QReason, 'noVapor');

  const q = { activity: 'mix', solid: 'aluminum', ms: 200, Ts: 150, mw: 300, Tw: 20 }, s = M.mix(q);
  assert.equal(M.checkMix(q, { TText: f(s.Tf), QText: f(s.Qw / 1000) }).ok, true);
  const wT = { average: 85, massOnly: 72, noMass: (900 * 150 + 4187 * 20) / (900 + 4187), swapC: (4187 * 200 * 150 + 900 * 300 * 20) / (4187 * 200 + 900 * 300), kelvin: s.Tf + 273.15 };
  for (const [reason, w] of Object.entries(wT)) {
    assert.equal(M.checkMix(q, { TText: f(w), QText: f(s.Qw / 1000) }).TReason, reason);
    assert.ok(Math.abs(w - s.Tf) > 0.02 * s.Tf, reason);
  }
  const wQ = { sign: -s.Qw / 1000, solidAll: s.Cs * 130 / 1000, units: s.Qw };
  for (const [reason, w] of Object.entries(wQ)) {
    assert.equal(M.checkMix(q, { TText: f(s.Tf), QText: f(w) }).QReason, reason);
    assert.ok(Math.abs(w - s.Qw / 1000) > 0.02 * s.Qw / 1000, reason);
  }
});
