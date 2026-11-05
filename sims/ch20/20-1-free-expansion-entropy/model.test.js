// node --test sims/ch20/20-1-free-expansion-entropy/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 20.1.2: 1.00 mol, V_f/V_i = 2 → ΔS = nR ln 2 = +5.76 J/K', () => {
  const g = M.gas({ n: 1, T: 300, Vi: 10, r: 2 });
  assert.equal(g.dS.toFixed(2), '5.76');
});

test('isothermal path: pV = nRT all along, Q = W = ∫p dV, and ΔS = ∫dQ/T = nR ln r (Eqs. 19.2.10, 20.1.1, 20.1.2)', () => {
  const p = { n: 2, T: 300, Vi: 10, r: 3 }, g = M.gas(p), steps = 20000;
  for (const t of [0, M.T_OPEN, 2, 4, M.T_END, M.RUN]) { const s = M.isoAt(t, p); close(s.p * s.V, p.n * M.R * p.T); }
  close(M.isoAt(0, p).V, p.Vi); close(M.isoAt(M.RUN, p).V, g.Vf); close(M.isoAt(M.RUN, p).Q, g.Q);
  let W = 0;                                          // Simpson's rule for ∫ p dV (kPa·L = J)
  const h = (g.Vf - p.Vi) / steps, pr = V => p.n * M.R * p.T / V;
  for (let i = 0; i < steps; i += 2) { const a = p.Vi + i * h; W += h / 3 * (pr(a) + 4 * pr(a + h) + pr(a + 2 * h)); }
  close(W, g.Q, 1e-10); close(W / p.T, g.dS, 1e-10); close(g.dS, p.n * M.R * Math.log(p.r));
});

test('entropy is a state function: another reversible path between i and f gives the same ΔS (LO 20.1.2, Eq. 20.1.4)', () => {
  // Isobaric expansion at p_i from V_i to V_f (T rises to rT), then isochoric cooling back to T. Monatomic gas,
  // C_V = (3/2)R (Eq. 19.7.7), C_p = C_V + R. ΔS = ∫ nC_p dT/T + ∫ nC_V dT/T, integrated numerically.
  const p = { n: 1.5, T: 350, Vi: 8, r: 2.5 }, g = M.gas(p), CV = 1.5 * M.R, CP = CV + M.R, steps = 20000;
  const integ = (C, T0, T1) => { let s = 0; const h = (T1 - T0) / steps; for (let i = 0; i < steps; i += 2) { const a = T0 + i * h; s += h / 3 * (1 / a + 4 / (a + h) + 1 / (a + 2 * h)); } return p.n * C * s; };
  close(integ(CP, p.T, p.r * p.T) + integ(CV, p.r * p.T, p.T), g.dS, 1e-9);
});

test('free-expansion molecules: inside the box, in the left chamber before opening, spread over V_f after, same every run', () => {
  for (const r of [1.5, 3, 4]) {
    const Li = M.BOX.L / r;
    for (let t = 0; t <= M.T_OPEN; t += 0.05) for (const m of M.molecules(t, r)) assert.ok(m[0] >= M.RM - 1e-9 && m[0] <= Li - M.RM + 1e-9);
    let frac = 0, k = 0;
    for (let t = M.T_EQ; t <= M.RUN; t += 0.1, k++) {
      const mol = M.molecules(t, r);
      for (const m of mol) { assert.ok(m[0] >= 0 && m[0] <= M.BOX.L && m[1] >= 0 && m[1] <= M.BOX.H && m[2] >= 0 && m[2] <= M.BOX.D); }
      frac += mol.filter(m => m[0] > Li).length / M.N_MOL;
    }
    assert.ok(Math.abs(frac / k - (1 - 1 / r)) < 0.12, `r = ${r}: right-chamber fraction ${frac / k}`);
  }
  assert.deepEqual(M.molecules(2.37, 3), M.molecules(2.37, 3));
  // Continuous at the opening: a molecule does not jump when the partition goes.
  const a = M.molecules(M.T_OPEN, 3), b = M.molecules(M.T_OPEN + 1e-6, 3);
  a.forEach((m, i) => assert.ok(Math.hypot(m[0] - b[i][0], m[1] - b[i][1], m[2] - b[i][2]) < 1e-4));
});

test('grading with the named mistakes, distinct from the answer at the default values', () => {
  const p = Object.fromEntries(M.params.map(q => [q.id, q.value])), g = M.gas(p);
  const lg = Math.log10(p.r), Q = g.Q.toFixed(1), S = g.dS.toFixed(3);
  assert.equal(M.check(p, { QText: Q, SText: S }).ok, true);
  assert.equal(M.check(p, { QText: '0', SText: S }).QReason, 'zero');
  assert.equal(M.check(p, { QText: (p.n * M.R * p.T * lg).toFixed(1), SText: S }).QReason, 'log10');
  assert.equal(M.check(p, { QText: (g.pi * (g.Vf - p.Vi)).toFixed(1), SText: S }).QReason, 'isobaric');
  assert.equal(M.check(p, { QText: (g.Q / p.n).toFixed(1), SText: S }).QReason, 'noN');
  assert.equal(M.check(p, { QText: Q, SText: '0' }).SReason, 'zero');
  assert.equal(M.check(p, { QText: Q, SText: Q }).SReason, 'noT');
  assert.equal(M.check(p, { QText: Q, SText: '-' + S }).SReason, 'sign');
  assert.equal(M.check(p, { QText: Q, SText: (p.n * M.R * lg).toFixed(3) }).SReason, 'log10');
  assert.equal(M.check(p, { QText: 'abc', SText: S }).QReason, 'unreadable');
  for (const [x, y] of [[p.n * M.R * p.T * lg, g.Q], [g.pi * (g.Vf - p.Vi), g.Q], [g.Q / p.n, g.Q], [p.n * M.R * lg, g.dS]]) assert.ok(Math.abs(x - y) > 0.02 * Math.abs(y));
});
