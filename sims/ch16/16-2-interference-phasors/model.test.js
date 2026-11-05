// node --test sims/ch16/16-2-interference-phasors/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const S0 = { activity: 'same', ym: 6, phi: 130 };
const P0 = { activity: 'phasor', ym1: 5, ym2: 3, phiP: 110 };

test('Sample Problem 16.5.1: y_m = 9.8 mm, ϕ = 100° → y′_m = 13 mm, intermediate; ϕ = ±2.636 rad = ±0.42 wavelength gives 4.9 mm', () => {
  const s = M.sameAmp(9.8, 100);
  assert.equal(s.ym.toFixed(0), '13'); assert.equal(s.type, 'intermediate');
  const phi = 2.636 * 180 / Math.PI;
  assert.equal(M.sameAmp(9.8, phi).ym.toFixed(1), '4.9'); assert.equal(M.sameAmp(9.8, -phi).ym.toFixed(1), '4.9');
  assert.equal((2.636 / (2 * Math.PI)).toFixed(2), '0.42');
});

test('Table 16.5.1: amplitude and type for 0°, 120°, 180°, 240°, 360°, 865°', () => {
  const rows = [[0, 2, 'constructive'], [120, 1, 'intermediate'], [180, 0, 'destructive'], [240, 1, 'intermediate'], [360, 2, 'constructive'], [865, 0.60, 'intermediate']];
  for (const [phi, k, type] of rows) {
    const s = M.sameAmp(1, phi);
    assert.ok(Math.abs(s.ym - k) <= 0.02, `${phi}: ${s.ym}`); assert.equal(s.type, type);
  }
  assert.equal(M.sameAmp(1, 865).waves.toFixed(2), '2.40');
});

test('Sample Problem 16.6.1: y_m1 = 4.0 mm, y_m2 = 3.0 mm, ϕ = π/3 → 5.50, 2.60 mm, y′_m = 6.1 mm, β = 0.44 rad', () => {
  const s = M.phasorSum(4.0, 3.0, 60);
  assert.equal(s.h.toFixed(2), '5.50'); assert.equal(s.v.toFixed(2), '2.60');
  assert.equal(s.ym.toFixed(1), '6.1'); assert.equal((s.beta * Math.PI / 180).toFixed(2), '0.44');
});

test('superposition: y1 + y2 = y′_m sin(kx − ωt + β) everywhere, the phasor projections give the displacements at x = 0', () => {
  for (const p of [S0, P0, { activity: 'phasor', ym1: 2, ym2: 7.5, phiP: 300 }]) {
    for (const t of [0, 0.37, 1.6, 3.1]) {
      const o = M.stateAt(t, p), b = o.beta * Math.PI / 180, K = 2 * Math.PI / M.LAM, W = 2 * Math.PI / M.TP;
      o.xs.forEach((x, i) => close(o.ys[i], o.R * Math.sin(K * x - W * t + b), 1e-12));
      close(o.p1, o.a1 * Math.sin(o.th)); close(o.p2, o.a2 * Math.sin(o.th + o.phi * Math.PI / 180));
      close(o.pR, o.R * Math.sin(o.th + b));
    }
  }
  // Equal amplitudes: the phasor sum is Eq. 16.5.7 with β = ϕ/2 for ϕ < 180°.
  for (const phi of [0, 35, 130, 175]) { const s = M.phasorSum(6, 6, phi); close(s.ym, M.sameAmp(6, phi).ym); close(s.beta, phi / 2); }
});

test('grading with the named mistakes, each more than 2% from the answer at the default values', () => {
  const s = M.sameAmp(6, 130), f = 130 * Math.PI / 180;
  assert.equal(M.checkSame(S0, { ymText: s.ym.toFixed(3), type: 'intermediate' }).ok, true);
  const yMis = { noHalf: Math.abs(12 * Math.cos(f)), noPhase: 12, noTwo: s.ym / 2, degRad: Math.abs(12 * Math.cos(65)) };
  for (const [k, y] of Object.entries(yMis)) { assert.equal(M.checkSame(S0, { ymText: y.toFixed(4), type: 'intermediate' }).yReason, k); assert.ok(Math.abs(y - s.ym) > 0.02 * s.ym); }
  assert.equal(M.checkSame(S0, { ymText: s.ym.toFixed(3), type: 'destructive' }).tReason, 'type');
  assert.equal(M.checkSame(S0, { ymText: s.ym.toFixed(3), type: '' }).tReason, 'empty');
  const q = M.phasorSum(5, 3, 110);
  assert.equal(M.checkPhasor(P0, { ymText: q.ym.toFixed(3), bText: q.beta.toFixed(2) }).ok, true);
  assert.equal(M.checkPhasor(P0, { ymText: q.ym.toFixed(3), bText: (q.beta + 360).toFixed(2) }).bOk, true);
  const pMis = { scalar: 8, diff: 2, perp: Math.hypot(5, 3), sameAmp: 8 * Math.cos(55 * Math.PI / 180) };
  for (const [k, y] of Object.entries(pMis)) { assert.equal(M.checkPhasor(P0, { ymText: y.toFixed(4), bText: '0' }).yReason, k); assert.ok(Math.abs(y - q.ym) > 0.02 * q.ym); }
  const bMis = { half: 55, full: 110, fromTwo: 110 - q.beta, noHoriz: Math.atan2(q.v, 5) * 180 / Math.PI, radians: q.beta * Math.PI / 180 };
  for (const [k, b] of Object.entries(bMis)) { assert.equal(M.checkPhasor(P0, { ymText: '1', bText: b.toFixed(4) }).bReason, k); assert.ok(Math.abs(b - q.beta) > 0.02 * q.beta); }
  // ϕ = 180° with equal amplitudes: no resultant wave, any β is accepted.
  assert.equal(M.checkPhasor({ activity: 'phasor', ym1: 4, ym2: 4, phiP: 180 }, { ymText: '0', bText: '17' }).ok, true);
});
