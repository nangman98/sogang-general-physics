// node --test sims/ch18/18-4-conduction-radiation/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const S = { activity: 'slab', m2: 'pine', L2: 2, m1: 'fiberglass', L1: 5, A: 4, TH: 22, TC: -5 };
const R = { activity: 'rad', r: 10, eps: 0.7, T: 80, Tenv: 20 };

test('Sample Problem 18.6.1: pine L_a, brick L_d = 2.0L_a with k_d = 5.0k_a, T1 = 25°C, T2 = 20°C, T5 = −10°C → T4 = −8.0°C', () => {
  // The two middle layers are unknown but equal; L/k = 2.8 L_a/k_a makes T2 = 20°C. The answer does not depend on it.
  const s = M.layers([{ k: 1, L: 1 }, { k: 1, L: 2.8 }, { k: 1, L: 2.8 }, { k: 5, L: 2 }], 1, 25, -10);
  close(s.T[1], 20); close(s.T[3], -8); close(s.T[4], -10);
  close((1 * 2 / (5 * 1)) * (25 - 20) + -10, -8);                      // the textbook's closed form for T4
});

test('Sample Problem 18.6.2: water layer ε = 0.90, A = 9.0 cm², 273 K under a 250 K sky → P_net = −7.57 × 10⁻² W, t = 2.13 × 10⁴ s = 5.9 h', () => {
  const r = M.rates(0.90, 9.0e-4, 273, 250, 5.67e-8);                   // the sample problem uses σ = 5.67 × 10⁻⁸
  assert.equal(r.Pnet.toExponential(2), '-7.57e-2');
  const Q = 4190 * 4.5e-3 * (0 - 6.0) - 4.5e-3 * 3.33e5;               // −113 J − 1499 J (c = 4190 J/kg·K as in the sample problem)
  assert.equal(Math.round(Q), -1612);
  const t = Q / r.Pnet;
  assert.equal(t.toExponential(2), '2.13e+4'); assert.equal((t / 3600).toFixed(1), '5.9');
});

test('Eqs. 18.6.1–18.6.5: the same rate crosses both layers, T_X matches Eq. 18.6.4, and one layer gives Eq. 18.6.1', () => {
  const s = M.slab(S);
  close(s.k2 * S.A * (S.TH - s.TX) / s.l2, s.k1 * S.A * (s.TX - S.TC) / s.l1);              // Eq. 18.6.3
  close(s.TX, (s.k1 * s.l2 * S.TC + s.k2 * s.l1 * S.TH) / (s.k1 * s.l2 + s.k2 * s.l1));      // Eq. 18.6.4
  close(s.P, S.A * (S.TH - S.TC) / (s.l1 / s.k1 + s.l2 / s.k2));                              // Eq. 18.6.5
  const one = M.layers([{ k: 235, L: 0.03 }], 2, 100, 0);
  close(one.P, 235 * 2 * 100 / 0.03); close(one.R[0], 0.03 / 235);                            // Eqs. 18.6.1, 18.6.2
  // P doubles with A and with ΔT; the interface lies between the two faces on every material pair.
  close(M.slab({ ...S, A: 8 }).P, 2 * s.P);
  for (const m2 of Object.keys(M.MATERIALS)) for (const m1 of Object.keys(M.MATERIALS)) {
    const q = M.slab({ ...S, m2, m1 });
    assert.ok(q.P > 0 && q.TX < S.TH && q.TX > S.TC, `${m2} ${m1}`);
  }
});

test('Eqs. 18.6.7–18.6.9: P_rad ∝ εAT⁴ with T in kelvins, P_net = 0 when T = T_env, sign follows T_env − T', () => {
  const s = M.radiation(R);
  close(s.A, 4 * Math.PI * 0.01); close(s.Prad, M.SIGMA * 0.7 * s.A * 353.15 ** 4); close(s.Pnet, s.Pabs - s.Prad);
  const hot = M.rates(1, 1, 600, 300), cold = M.rates(1, 1, 300, 300);
  close(hot.Prad, 16 * cold.Prad); close(cold.Pnet, 0);
  assert.ok(M.radiation({ ...R, T: 0, Tenv: 20 }).Pnet > 0 && s.Pnet < 0);
});

test('grading with the named mistakes; at the default settings every mistake is more than 2% from the answer', () => {
  const s = M.slab(S), f = x => x.toFixed(5), dT = S.TH - S.TC;
  assert.equal(M.checkSlab(S, { PText: f(s.P), TText: f(s.TX) }).ok, true);
  const wP = { oneLayer: S.A * dT / s.R1, addK: (s.k1 + s.k2) * S.A * dT / (s.l1 + s.l2), units: s.P / 100 };
  for (const [reason, w] of Object.entries(wP)) {
    assert.equal(M.checkSlab(S, { PText: f(w), TText: f(s.TX) }).PReason, reason);
    assert.ok(Math.abs(w - s.P) > 0.02 * s.P, reason);
  }
  assert.ok(Math.abs(S.A * dT / s.R2 - s.P) > 0.02 * s.P);
  const wT = { midpoint: (S.TH + S.TC) / 2, swap: S.TH - dT * s.R1 / (s.R1 + s.R2), kelvin: s.TX + M.K0 };
  for (const [reason, w] of Object.entries(wT)) {
    assert.equal(M.checkSlab(S, { PText: f(s.P), TText: f(w) }).TReason, reason);
    assert.ok(Math.abs(w - s.TX) > 0.02 * Math.abs(s.TX), reason);
  }

  const r = M.radiation(R), k = M.SIGMA * R.eps * r.A;
  assert.equal(M.checkRad(R, { RText: f(r.Prad), NText: f(r.Pnet) }).ok, true);
  const wR = { celsius: k * 80 ** 4, noEps: r.Prad / 0.7, disk: r.Prad / 4 };
  for (const [reason, w] of Object.entries(wR)) {
    assert.equal(M.checkRad(R, { RText: f(w), NText: f(r.Pnet) }).RReason, reason);
    assert.ok(Math.abs(w - r.Prad) > 0.02 * r.Prad, reason);
  }
  const wN = { sign: -r.Pnet, emitOnly: -r.Prad, celsius: k * (20 ** 4 - 80 ** 4), diff4: -k * 60 ** 4 };
  for (const [reason, w] of Object.entries(wN)) {
    assert.equal(M.checkRad(R, { RText: f(r.Prad), NText: f(w) }).NReason, reason);
    assert.ok(Math.abs(w - r.Pnet) > 0.02 * Math.abs(r.Pnet), reason);
  }
});
