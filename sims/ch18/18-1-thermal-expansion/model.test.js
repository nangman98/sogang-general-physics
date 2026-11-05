// node --test sims/ch18/18-1-thermal-expansion/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 18.3.1: aluminum pole L = 2.0 m, α = 2.3 × 10⁻⁵/C°, 110 K → 290 K gives ΔL = 8.3 mm', () => {
  // Table 18.3.1 gives 23 × 10⁻⁶/C° for aluminum, the value the sample problem uses. Kelvin changes equal Celsius changes.
  const s = M.rod({ mat: 'aluminum', L: 2.0, Ti: 110 - 273.15, Tf: 290 - 273.15 });
  close(s.dT, 180); close(s.dL, 8.28e-3); assert.equal(s.dLmm.toFixed(1), '8.3');
});

test('Sample Problem 18.3.2: 37 000 L of diesel, β = 9.50 × 10⁻⁴/C°, ΔT = −23.0 K gives ΔV = −808 L and 36 190 L delivered', () => {
  const dV = M.volumeChange(37000, 9.50e-4, -23.0);
  assert.equal(Math.round(dV), -808);
  // The textbook writes 37 000 − 808 = 36 190 L, rounded to four figures.
  assert.equal(Math.round((37000 + dV) / 10) * 10, 36190);
});

test('Eqs. 18.3.1–18.3.3: ΔL ∝ L and ΔT, β = 3α, ΔA = 2αAΔT; the linear forms stay within 1% of the exact growth on every slider setting', () => {
  const a = M.rod({ mat: 'copper', L: 1, Ti: 20, Tf: 70 }), b = M.rod({ mat: 'copper', L: 2, Ti: 20, Tf: 120 });
  close(b.dL, 4 * a.dL);
  const c = M.cube({ mat: 'copper', side: 10, Ti: 20, Tf: 120 });
  close(c.beta, 3 * c.alpha);
  close(c.dV, 1000 * 3 * 17e-6 * 100); close(c.dA, 100 * 2 * 17e-6 * 100 * 100); close(c.dL, 10 * 17e-6 * 100);
  for (const mat of Object.keys(M.MATERIALS)) for (const [Ti, Tf] of [[-20, 200], [40, -40], [20, 25]]) {
    const s = M.cube({ mat, side: 10, Ti, Tf }), e = M.exact(s.alpha, Tf - Ti);
    assert.ok(Math.abs(s.dV / 1000 - e.V) <= 0.01 * Math.abs(e.V), `${mat} V`);
    assert.ok(Math.abs(s.dA / 1e4 - e.A) <= 0.01 * Math.abs(e.A), `${mat} A`);
  }
  // The hole grows with the plate, shrinks when cooled, and does not change when ΔT = 0.
  assert.equal(M.rod({ mat: 'steel', L: 1, Ti: 20, Tf: 100 }).hole, 'grow');
  assert.equal(M.rod({ mat: 'steel', L: 1, Ti: 20, Tf: -20 }).hole, 'shrink');
  assert.equal(M.rod({ mat: 'steel', L: 1, Ti: 20, Tf: 20 }).hole, 'same');
  close(M.rod({ mat: 'steel', L: 1, Ti: 20, Tf: 100 }).dD, M.HOLE * 11e-6 * 80);
});

test('playback: temperature goes evenly from T_i to T_f and ΔL follows Eq. 18.3.1 at every instant', () => {
  const p = { activity: 'rod', mat: 'brass', L: 2.4, Ti: 10, Tf: 160 };
  close(M.stateAt(0, p).dLmm, 0); close(M.stateAt(M.RUN, p).dLmm, M.rod(p).dLmm);
  const mid = M.stateAt(M.RUN / 2, p);
  close(mid.T, 85); close(mid.dLmm, 2.4 * 19e-6 * 75 * 1000);
  const q = { activity: 'cube', mat: 'lead', side: 12, Ti: 0, Tf: 100 };
  close(M.stateAt(M.RUN, q).dV, M.cube(q).dV);
});

test('grading with the named mistakes; at the default settings every mistake is more than 2% from the answer', () => {
  const p = { activity: 'rod', mat: 'steel', L: 1.5, Ti: 20, Tf: 150 }, s = M.rod(p);
  const f = x => x.toFixed(4);
  assert.equal(M.checkRod(p, { dLText: f(s.dLmm), hole: 'grow' }).ok, true);
  assert.equal(M.checkRod(p, { dLText: f(s.dLmm), hole: 'shrink' }).ok, false);
  assert.equal(M.checkRod(p, { dLText: f(3 * s.dLmm), hole: 'grow' }).dLReason, 'beta');
  assert.equal(M.checkRod(p, { dLText: f(1.5 * 11e-6 * 150 * 1000), hole: 'grow' }).dLReason, 'final');
  assert.equal(M.checkRod(p, { dLText: f(s.dLmm / 10), hole: 'grow' }).dLReason, 'units');
  assert.equal(M.checkRod({ ...p, Tf: -20 }, { dLText: f(-M.rod({ ...p, Tf: -20 }).dLmm), hole: 'shrink' }).dLReason, 'sign');
  for (const w of [3 * s.dLmm, 1.5 * 11e-6 * 150 * 1000, s.dLmm / 10]) assert.ok(Math.abs(w - s.dLmm) > 0.02 * s.dLmm);

  const c = { activity: 'cube', mat: 'steel', side: 8, Ti: 20, Tf: 150 }, t = M.cube(c);
  assert.equal(M.checkCube(c, { AText: f(t.dA), VText: f(t.dV) }).ok, true);
  assert.equal(M.checkCube(c, { AText: f(t.dA / 2), VText: f(t.dV) }).AReason, 'alpha');
  assert.equal(M.checkCube(c, { AText: f(t.dA * 1.5), VText: f(t.dV) }).AReason, 'beta');
  assert.equal(M.checkCube(c, { AText: f(t.dA / 100), VText: f(t.dV) }).AReason, 'units');
  assert.equal(M.checkCube(c, { AText: f(t.dA), VText: f(t.dV / 3) }).VReason, 'alpha');
  assert.equal(M.checkCube(c, { AText: f(t.dA), VText: f(t.dV * 2 / 3) }).VReason, 'area');
  assert.equal(M.checkCube(c, { AText: f(t.dA), VText: f(t.dV * 1000) }).VReason, 'units');
  for (const w of [t.dA / 2, t.dA * 1.5, t.dA / 100]) assert.ok(Math.abs(w - t.dA) > 0.02 * t.dA);
  for (const w of [t.dV / 3, t.dV * 2 / 3, t.dV * 1000]) assert.ok(Math.abs(w - t.dV) > 0.02 * t.dV);
  assert.equal(M.checkCube(c, { AText: 'abc', VText: '1' }).AReason, 'unreadable');
});
