// node --test sims/ch10/10-2-rotational-inertia/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 10.5.1: two particles m on a massless rod L; I = ½mL² (center), mL² (end, also by Eq. 10.5.2)', () => {
  const m = 1.3, L = 0.9;
  const center = m * (L / 2) ** 2 + m * (L / 2) ** 2, end = m * 0 ** 2 + m * L ** 2;
  close(center, 0.5 * m * L * L); close(end, m * L * L);
  close(center + 2 * m * (L / 2) ** 2, end);                            // parallel-axis theorem
});

test('Sample Problem 10.5.2: uniform rod, I_com = ML²/12 by integration and I_end = ML²/3 by Eq. 10.5.2', () => {
  const Mr = 2.5, L = 1.4, n = 20000;
  let I = 0;
  for (let i = 0; i < n; i++) { const x = -L / 2 + (i + 0.5) * L / n; I += x * x * Mr / n; }
  close(I, Mr * L * L / 12, 1e-8);
  close(M.rodInertia(Mr, L, 0), Mr * L * L / 12); close(M.rodInertia(Mr, L, L / 2), Mr * L * L / 3);
});

test('Table 10.5.1 coefficients and α = τ/I (Eq. 10.7.4): smaller I spins up faster', () => {
  close(M.inertia('hoop', 2, 0.4), 0.32); close(M.inertia('disk', 2, 0.4), 0.16);
  close(M.inertia('sphere', 2, 0.4), 0.128); close(M.inertia('shell', 2, 0.4), 2 / 3 * 0.32);
  close(M.inertia('rod', 2, 0.4), 2 * 0.8 ** 2 / 12);
  const s = M.solve({ activity: 'race', A: 'hoop', B: 'disk', M: 2, R: 0.4, tau: 0.5 });
  assert.equal(s.faster, 'B'); close(s.aA, 0.5 / 0.32); close(s.aB, 0.5 / 0.16);
  assert.equal(M.solve({ activity: 'race', A: 'disk', B: 'disk', M: 2, R: 0.4, tau: 0.5 }).faster, 'same');
  const o = M.stateAt(2, { activity: 'race', A: 'sphere', B: 'shell', M: 1, R: 0.3, tau: 1 });
  close(o.wA, 2 / (0.4 * 0.09)); close(o.thA, 0.5 * (1 / 0.036) * 4);
});

test('grading with the named mistakes', () => {
  const p = { activity: 'race', A: 'disk', B: 'hoop', M: 2, R: 0.4, tau: 0.5 };       // I_A = 0.16, α_A = 3.125
  assert.equal(M.checkRace(p, { pick: 'A', aText: '3.125' }).ok, true);
  assert.equal(M.checkRace(p, { pick: 'B', aText: '3.125' }).pickReason, 'wrong');
  assert.equal(M.checkRace(p, { pick: 'A', aText: '1.5625' }).aReason, 'hoopFormula');
  assert.equal(M.checkRace(p, { pick: 'A', aText: '0.08' }).aReason, 'multiply');
  const q = { activity: 'parallel', M: 2, L: 1.2, h: 0.3, tau: 0.5 };                  // I = 0.24 + 0.18 = 0.42
  assert.equal(M.checkParallel(q, { IText: '0.42', aText: (0.5 / 0.42).toFixed(3) }).ok, true);
  assert.equal(M.checkParallel(q, { IText: '0.24', aText: '1.19' }).IReason, 'noShift');
  assert.equal(M.checkParallel(q, { IText: '0.18', aText: '1.19' }).IReason, 'onlyShift');
  assert.equal(M.checkParallel(q, { IText: '0.96', aText: '1.19' }).IReason, 'end');
});
