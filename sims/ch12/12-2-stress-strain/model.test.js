// node --test sims/ch12/12-2-stress-strain/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 12.3.1: steel, R = 9.5 mm, L = 81 cm, F = 62 kN → 2.2 × 10⁸ N/m², ΔL = 0.89 mm, strain 1.1 × 10⁻³', () => {
  const s = M.solve({ mat: 'steel', R: 9.5, L: 0.81, F: 62 });
  assert.equal((s.stress / 1e8).toFixed(1), '2.2');
  assert.equal((s.dL * 1e3).toFixed(2), '0.89');
  assert.equal((s.strain * 1e3).toFixed(1), '1.1');
  assert.ok(s.stress < M.limit('steel'));                             // "dangerously close to its yield strength"
});

test('Table 12.3.1 values and the linear range limit', () => {
  assert.deepEqual([M.MATERIALS.steel.E, M.MATERIALS.steel.Su, M.MATERIALS.steel.Sy], [200, 400, 250]);
  assert.deepEqual([M.MATERIALS.aluminum.E, M.MATERIALS.aluminum.Su, M.MATERIALS.aluminum.Sy], [70, 110, 95]);
  assert.deepEqual(['glass', 'concrete', 'wood', 'bone', 'polystyrene'].map(k => [M.MATERIALS[k].E, M.MATERIALS[k].Su]), [[65, 50], [30, 40], [13, 50], [9, 170], [3, 48]]);
  close(M.limit('steel'), 250e6); close(M.limit('bone'), 170e6);
  const f = M.params.find(q => q.id === 'F');
  for (const mat of Object.keys(M.MATERIALS)) for (const R of [3, 8, 15]) {
    const hi = f.bounds({ mat, R }); assert.ok(hi[1] <= f.max, `${mat} ${R}`);
    assert.ok(M.solve({ mat, R, L: 1, F: hi[1] }).stress <= M.limit(mat) * (1 + 1e-12));
  }
});

test('Eq. 12.3.2 holds along the force ramp; strain is the same for every length', () => {
  const p = { mat: 'aluminum', R: 6, L: 1.5, F: 8 };
  for (const t of [0.5, 1.7, 3]) { const o = M.stateAt(t, p); close(o.Fnow * 1e3 / o.A, o.E * o.dL / p.L); }
  close(M.solve({ ...p, L: 0.5 }).strain, M.solve(p).strain);
});

test('grading with the named mistakes', () => {
  const p = { mat: 'steel', R: 8, L: 1.2, F: 40 }, s = M.solve(p), S = s.stress / 1e6, D = s.dL * 1e3;
  assert.equal(M.check(p, { sText: S.toFixed(1), dText: D.toFixed(3) }).ok, true);
  assert.equal(M.check(p, { sText: (S / 4).toFixed(1), dText: D.toFixed(3) }).sReason, 'diameter');
  assert.equal(M.check(p, { sText: (S * Math.PI).toFixed(1), dText: D.toFixed(3) }).sReason, 'noPi');
  assert.equal(M.check(p, { sText: S.toFixed(1), dText: (D / 1.2).toFixed(3) }).dReason, 'noL');
  assert.equal(M.check(p, { sText: S.toFixed(1), dText: (D / 1000).toFixed(6) }).dReason, 'units');
});
