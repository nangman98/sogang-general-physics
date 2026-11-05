// node --test sims/ch20/20-3-multiplicity-entropy/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Table 20.4.1: six molecules, W = 1, 6, 15, 20, 15, 6, 1 (total 64), S = 0, 2.47, 3.74, 4.13 × 10⁻²³ J/K, P(IV) = 0.313, P(I) = 0.016', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(n => M.multiplicity(6 - n, 6)), [1, 6, 15, 20, 15, 6, 1]);
  assert.equal([0, 1, 2, 3, 4, 5, 6].reduce((s, n) => s + M.multiplicity(n, 6), 0), 64);
  assert.deepEqual([6, 5, 4, 3].map(n => M.S23(n, 6).toFixed(2)), ['0.00', '2.47', '3.74', '4.13']);
  assert.equal(M.probability(3, 6).toFixed(3), '0.313'); assert.equal(M.probability(6, 6).toFixed(3), '0.016');
  for (let N = 2; N <= M.NMAX_COUNT; N++) for (let n = 0; n <= N; n++) close(M.multiplicity(n, N), M.factorial(N) / (M.factorial(n) * M.factorial(N - n)));
});

test('Sample Problem 20.4.1: N = 100, W(50, 50) = 1.01 × 10²⁹ and W(100, 0) = 1', () => {
  assert.equal(M.multiplicity(50, 100).toExponential(2), '1.01e+29');
  assert.equal(M.multiplicity(100, 100), 1);
  close(Math.log(M.multiplicity(50, 100)), M.lnW(50, 100), 1e-12);
});

test('Sample Problem 20.4.2: Stirling (Eq. 20.4.3) gives S_f − S_i = Nk ln 2 (Eq. 20.4.5) = nR ln 2, 5.76 J/K for 1 mol', () => {
  const stirling = n => n * Math.log(n) - n;
  for (const N of [100, 1000]) close(M.K_B * (stirling(N) - 2 * stirling(N / 2)), N * M.K_B * Math.LN2, 1e-12);
  assert.equal((6.02e23 * M.K_B * Math.LN2).toFixed(2), '5.76');   // N = N_A (Eq. 19.1.1), Nk = nR (Eq. 19.2.4)
  // Exact ln W approaches N ln 2: the relative gap shrinks with N. The grader accepts Nk ln 2 from N = 220 on (2% tolerance).
  const gap = N => (N * Math.LN2 - M.lnW(N / 2, N)) / (N * Math.LN2);
  assert.ok(gap(40) > gap(200) && gap(200) > gap(1000) && gap(1000) > 0);
  assert.ok(gap(40) > 0.02 && gap(1000) < 0.006);
});

test('snapshots: every microstate equally likely, so the fractions seen approach W/2^N; same sequence every run', () => {
  for (const N of [2, 6, 8, 12]) {
    const h = M.hist(N)[M.SNAPS - 1];
    assert.equal(h.reduce((a, b) => a + b, 0), M.SNAPS);
    for (let n = 0; n <= N; n++) assert.ok(Math.abs(h[n] / M.SNAPS - M.probability(n, N)) < 0.05, `N ${N}, n1 ${n}`);
  }
  const a = M.snapshot(123, 8), b = M.snapshot(123, 8);
  assert.deepEqual(a, b);
  assert.equal(a.mol.filter(m => m[0] < M.BOX.L / 2).length, a.n1);
  for (const m of a.mol) assert.ok(m[0] > 0 && m[0] < M.BOX.L && m[1] > 0 && m[1] < M.BOX.H && m[2] > 0 && m[2] < M.BOX.D);
  assert.equal(M.snapIndex(0), 0); assert.equal(M.snapIndex(M.SNAPS / M.RATE), M.SNAPS - 1);
});

test('free expansion: all molecules on the left before the partition goes, then n1 stays near N/2 and S near S_f', () => {
  for (const N of [40, 200, 1000]) {
    for (let t = 0; t <= M.T_OPEN; t += 0.05) assert.equal(M.spread(t, N).n1, N);
    let sum = 0, k = 0;
    for (let t = 3; t <= M.RUN_EXPAND; t += 0.1, k++) sum += M.spread(t, N).n1 / N;
    assert.ok(Math.abs(sum / k - 0.5) < 0.06, `N ${N}: mean n1/N ${sum / k}`);
    close(M.S23(N, N), 0); assert.ok(M.S23(Math.round(sum / k * N), N) <= M.S23(N / 2, N) + 1e-12);
  }
  const a = M.spread(M.T_OPEN, 100), b = M.spread(M.T_OPEN + 1e-6, 100);
  a.mol.forEach((m, i) => assert.ok(Math.hypot(m[0] - b.mol[i][0], m[1] - b.mol[i][1], m[2] - b.mol[i][2]) < 1e-4));
});

test('grading with the named mistakes, distinct from the answer at the default values', () => {
  const p = Object.fromEntries(M.params.map(q => [q.id, q.value])), N = p.N, n1 = p.n1;
  const W = M.multiplicity(n1, N), P = 100 * W / 2 ** N;
  assert.equal(M.checkCount(p, { wText: String(W), pText: P.toFixed(2) }).ok, true);
  assert.equal(M.checkCount(p, { wText: String(W), pText: (P / 100).toFixed(4) }).ok, true);        // as a fraction
  assert.equal(M.checkCount(p, { wText: String(M.factorial(N) / M.factorial(n1)), pText: '1' }).wReason, 'oneFactorial');
  assert.equal(M.checkCount(p, { wText: String(M.factorial(N)), pText: '1' }).wReason, 'noDivide');
  assert.equal(M.checkCount(p, { wText: String(2 ** N), pText: '1' }).wReason, 'total');
  assert.equal(M.checkCount(p, { wText: '1', pText: (100 / (N + 1)).toFixed(2) }).pReason, 'equalConfig');
  assert.equal(M.checkCount(p, { wText: '1', pText: (100 / 2 ** N).toFixed(3) }).pReason, 'oneMicro');
  const x = { activity: 'expand', NB: p.NB }, S = M.S23(p.NB / 2, p.NB), lw = M.lnW(p.NB / 2, p.NB);
  assert.equal(M.checkExpand(x, { sText: S.toFixed(2) }).ok, true);
  assert.equal(M.checkExpand(x, { sText: (M.K_B * p.NB * Math.LN2 / 1e-23).toFixed(2) }).reason, 'stirling');
  assert.equal(M.checkExpand(x, { sText: (S / Math.LN10).toFixed(2) }).reason, 'log10');
  assert.equal(M.checkExpand(x, { sText: lw.toFixed(2) }).reason, 'noK');
  assert.equal(M.checkExpand(x, { sText: (S * 1e-23).toExponential(3) }).reason, 'units');
  assert.equal(M.checkExpand(x, { sText: '?' }).reason, 'unreadable');
  assert.equal(M.checkExpand({ activity: 'expand', NB: 1000 }, { sText: (M.K_B * 1000 * Math.LN2 / 1e-23).toFixed(1) }).ok, true);   // Stirling is within 2% at N = 1000
  assert.equal(M.checkExpand({ activity: 'expand', NB: 210 }, { sText: (M.K_B * 210 * Math.LN2 / 1e-23).toFixed(2) }).reason, 'stirling');
  assert.equal(M.checkExpand({ activity: 'expand', NB: 220 }, { sText: (M.K_B * 220 * Math.LN2 / 1e-23).toFixed(2) }).ok, true);
  const far = (a, b) => assert.ok(Math.abs(a - b) > 0.02 * Math.abs(b), `${a} too close to ${b}`);
  for (const v of [M.factorial(N) / M.factorial(n1), M.factorial(N), 2 ** N]) far(v, W);
  for (const v of [100 / (N + 1), 100 / 2 ** N]) far(v, P);
  for (const v of [M.K_B * p.NB * Math.LN2 / 1e-23, S / Math.LN10, lw]) far(v, S);
});
