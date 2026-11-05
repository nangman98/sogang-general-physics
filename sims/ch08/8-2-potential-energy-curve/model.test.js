// node --test sims/ch08/8-2-potential-energy-curve/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('U(x) is C¹, F = −dU/dx (Eq. 8.3.2), and the only equilibria are at 2.5 m, 5.0 m and x ≥ 6.3 m', () => {
  for (const x of [0.4, 1.7, 3.3, 4.6, 5.8, 7.0]) close((M.U(x + 1e-6) - M.U(x - 1e-6)) / 2e-6, M.dU(x), 1e-5);
  for (const x of [1.2, 2.5, 5.0, 6.3]) { close(M.U(x - 1e-9), M.U(x + 1e-9), 1e-6); close(M.dU(x - 1e-9), M.dU(x + 1e-9), 1e-5); }
  close(M.U(2.5), -4); close(M.U(5.0), 3); close(M.U(7.3), 1);
  close(M.force(2.5), 0); close(M.force(5.0), 0); close(M.force(7.3), 0);
  assert.ok(M.dU(2.6) > 0 && M.dU(2.4) < 0);                            // minimum: stable
  assert.ok(M.dU(4.9) > 0 && M.dU(5.1) < 0);                            // maximum: unstable
  for (let x = 0.01; x < 6.29; x += 0.01) if (Math.abs(x - 2.5) > 0.02 && Math.abs(x - 5) > 0.02) assert.ok(Math.abs(M.dU(x)) > 1e-6, `extra equilibrium near ${x}`);
});

test('Sample Problem 8.3.1 relations: K0 = 16.0 J, K1 = E_mec − U1 = 9.0 J, v1 = 3.0 m/s, turning point 1.9 m', () => {
  const K0 = 0.5 * M.MASS * 4.00 ** 2, E = K0 + 0;                     // the textbook particle is also 2.00 kg
  close(K0, 16.0);
  const K1 = E - 7.0;                                                    // (8.3.4) with U1 = 7.0 J read from its graph
  close(K1, 9.0); close(Math.sqrt(2 * K1 / M.MASS), 3.0);
  const d = (16 - 7.0) / (20 - 7.0) * (4.0 - 1.0);                       // similar triangles on the straight segment
  close(+d.toFixed(2), 2.08); close(+(4.0 - d).toFixed(1), 1.9);
});

test('turning points satisfy U = E_mec (Eq. 8.3.3 with K = 0); particle passes the hump only when E_mec > U(5 m)', () => {
  for (const E of [-3, 0, 2, 2.9]) {
    const tp = M.turning(E);
    close(M.U(tp.left), E, 1e-9); close(M.U(tp.right), E, 1e-9); assert.equal(tp.passes, false);
  }
  const hi = M.turning(5);
  assert.equal(hi.passes, true); assert.equal(hi.right, null); close(M.U(hi.left), 5, 1e-9);
});

test('RK4 run keeps E_mec, stays between the turning points, and escapes past the hump when allowed', () => {
  for (const E of [-2, 1, 2.5]) {
    const p = { activity: 'energy', E }, tp = M.turning(E), T = M.duration(p);
    for (let i = 0; i <= 200; i++) {
      const s = M.stateAt(T * i / 200, p);
      close(s.U + s.K, E, 1e-6);
      assert.ok(s.x >= tp.left - 1e-4 && s.x <= tp.right + 1e-4);
    }
  }
  const p = { activity: 'energy', E: 4 }, T = M.duration(p), end = M.stateAt(T, p);
  assert.ok(end.x > M.XMAX); close(end.K, 3, 1e-6);                     // K = E − 1 J on the flat run
});

test('equilibrium points after a small push: A oscillates, B runs away, C keeps its speed', () => {
  const a = { activity: 'equilibrium', point: 'A' }, b = { activity: 'equilibrium', point: 'B' }, c = { activity: 'equilibrium', point: 'C' };
  const Ta = M.duration(a);
  for (let i = 0; i <= 100; i++) assert.ok(Math.abs(M.stateAt(Ta * i / 100, a).x - 2.5) < 0.3);
  assert.ok(M.stateAt(M.duration(b), b).x > 6.3);
  for (const t of [0.5, 2, 3]) close(M.stateAt(t, c).v, M.PUSH, 1e-9);
});

test('grading', () => {
  const p = { activity: 'energy', E: 2 };                                  // turns back; at 4.0 m U = U(4)
  const K = 2 - M.U(M.XM);
  assert.equal(M.checkEnergy(p, { pass: 'back', KText: K.toFixed(2) }).ok, true);
  assert.equal(M.checkEnergy(p, { pass: 'pass', KText: K.toFixed(2) }).passReason, 'wrong');
  assert.equal(M.checkEnergy(p, { pass: 'back', KText: M.U(M.XM).toFixed(2) }).KReason, 'U');
  assert.equal(M.checkEnergy(p, { pass: 'back', KText: '2' }).KReason, 'E');
  const low = { activity: 'energy', E: -3 };                               // cannot reach 4.0 m
  assert.equal(M.checkEnergy(low, { pass: 'back', KText: '0' }).ok, true);
  assert.equal(M.checkEnergy(low, { pass: 'back', KText: '1' }).KReason, 'unreachable');
  assert.equal(M.checkEquilibrium({ point: 'B' }, 'unstable').ok, true);
  assert.equal(M.checkEquilibrium({ point: 'C' }, 'stable').reason, 'stable');
});
