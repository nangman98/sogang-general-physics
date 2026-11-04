// node --test sims/ch05/5-1-net-force/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));
const deg = d => d * Math.PI / 180;

test('Sample Problem 5.1.1: sled pushed with 130 N, then reversed in 4.5 s', () => {
  const m = 240, d = 2.3;
  const [ax] = M.acceleration(M.netForce([[130, 0]]), m);            // (5.1.1), x part of (5.1.2)
  close(+ax.toFixed(3), 0.542);
  close(+Math.sqrt(2 * ax * d).toFixed(1), 1.6);                       // (2.4.6) with v0 = 0
  const a = (-1.6 - 1.6) / 4.5;                                        // (2.4.1)
  close(+a.toFixed(3), -0.711);
  const [Fx] = M.netForce([[m * a, 0]]);
  close(+Fx.toFixed(0), -171);
});

test('Sample Problem 5.1.2: the third force gives a = 3.0 m/s² at 50° on the 2.0 kg tin', () => {
  const m = 2.0, pol = (F, t) => [F * Math.cos(deg(t)), F * Math.sin(deg(t))];
  const F1 = pol(10, -150), F2 = pol(20, 90);
  const ma = pol(m * 3.0, 50);
  const F3 = M.netForce([ma, F1.map(c => -c), F2.map(c => -c)]);         // (5.1.7)
  close(+F3[0].toFixed(1), 12.5); close(+F3[1].toFixed(1), -10.4);
  close(+Math.hypot(...F3).toFixed(0), 16);
  close(+(Math.atan2(F3[1], F3[0]) * 180 / Math.PI).toFixed(0), -40);
  const a = M.acceleration(M.netForce([F1, F2, F3]), m);                 // back through (5.1.6)
  close(Math.hypot(...a), 3.0); close(Math.atan2(a[1], a[0]) * 180 / Math.PI, 50);
});

test('Sample Problem 5.2.1: tilt of the vector sum of F_g and F_app is 76°', () => {
  const ax = 85 ** 2 / (2 * 90);                                       // (2.4.6)
  close(+ax.toFixed(1), 40.1);
  const m = 1, sum = M.netForce([[0, -m * M.G], [m * ax, 0]]);
  close(+(Math.atan2(sum[0], -sum[1]) * 180 / Math.PI).toFixed(0), 76);
});

test('Sample Problem 5.3.4: scale reading F_N = m(g + a), Eq. 5.2.6', () => {
  close(+M.normalForce({ m: 72.2 }).toFixed(0), 708);
  close(+M.normalForce({ m: 72.2, ay: 3.2 }).toFixed(0), 939);
  close(+M.normalForce({ m: 72.2, ay: -3.2 }).toFixed(0), 477);
  close(+(M.normalForce({ m: 72.2, ay: 3.2 }) - 72.2 * M.G).toFixed(0), 231);
});

test('force sets: net force, acceleration and the misconception answers differ', () => {
  const expect = [[10, 12.5, 53.13], [10, 8, -53.13], [2.8284, 5.6569, -135], [0, 0, null], [10, 20, 126.87]];
  M.PROBLEMS.forEach((_, i) => {
    const q = M.problem(i), [F, a, h] = expect[i];
    close(q.FnetMag, F, 1e-4); close(q.aMag, a, 1e-4);
    if (h === null) assert.equal(q.heading, null); else close(q.heading, h, 1e-4);
    if (!q.zero) {
      assert.ok(!M.near(q.scalarSum / q.m, q.aMag), `problem ${i + 1}: scalar sum gives the same a`);
      assert.ok(!M.near(q.FnetMag, q.aMag), `problem ${i + 1}: F_net and a coincide`);
    }
  });
  assert.equal(M.problem(5).index, 0);                                   // wraps around
});

test('net-force prediction grading', () => {
  const q = M.problem(0);                                               // F_net = (6, −8) N, a = 12.5 m/s² at 53°
  assert.equal(M.checkSum(q, { heading: 55, zero: false, aText: '12.5' }).ok, true);
  assert.equal(M.checkSum(q, { heading: 45, zero: false, aText: '12.4' }).ok, true);
  assert.equal(M.checkSum(q, { heading: 90, zero: false, aText: '12.5' }).dirReason, 'largest');
  assert.equal(M.checkSum(q, { heading: 200, zero: false, aText: '12.5' }).dirReason, 'direction');
  assert.equal(M.checkSum(q, { heading: 55, zero: false, aText: '17.5' }).aReason, 'scalar');
  assert.equal(M.checkSum(q, { heading: 55, zero: false, aText: '10' }).aReason, 'noMass');
  assert.equal(M.checkSum(q, { heading: 55, zero: true, aText: '0' }).dirReason, 'notZero');
  assert.equal(M.checkSum(q, { heading: 55, zero: false, aText: 'x' }).aReason, 'unreadable');
  const q4 = M.problem(3);                                              // balanced forces
  assert.equal(M.checkSum(q4, { heading: 0, zero: true, aText: '0' }).ok, true);
  assert.equal(M.checkSum(q4, { heading: 0, zero: false, aText: '0' }).dirReason, 'zeroMissed');
  assert.equal(M.checkSum(M.problem(4), { heading: 125, zero: false, aText: '20' }).ok, true);
  assert.equal(M.checkSum(M.problem(2), { heading: 230, zero: false, aText: '5.66' }).ok, true);   // −135° = 225°
});

test('pulled crate: y and x components of the second law', () => {
  const s = M.pulled({ m: 5, T: 30, theta: 30, f: 10 });
  close(s.Fg, 49); close(s.FN, 34);                                     // F_N = mg − T sin θ
  close(s.ax, (30 * Math.cos(deg(30)) - 10) / 5);
  close(s.FN + s.Ty - s.Fg, 0);                                         // a_y = 0
  close(M.pulled({ m: 5, T: 0, theta: 30, f: 0 }).FN, 5 * 9.8);          // Eq. 5.2.7
});

test('normal force never negative on the tension slider range', () => {
  const [mc, Tc, thc] = ['m', 'T', 'theta'].map(id => M.params.find(c => c.id === id));
  for (let m = mc.min; m <= mc.max; m += mc.step) for (let th = thc.min; th <= thc.max; th += thc.step) {
    const Tmax = M.maxTension({ m, theta: th });
    assert.ok(Tmax >= 0 && Tmax <= Tc.max);
    assert.ok(M.normalForce({ m, T: Tmax, theta: th }) >= -1e-9, `m ${m}, θ ${th}`);
  }
});

test('free-body prediction grading', () => {
  const p = { m: 5, T: 30, theta: 30, f: 10 };                           // F_N = 34 N, a_x = 3.20 m/s²
  assert.equal(M.checkFbd(p, { FNText: '34', aText: '3.2' }).ok, true);
  assert.equal(M.checkFbd(p, { FNText: '49', aText: '3.2' }).FNReason, 'mg');
  assert.equal(M.checkFbd(p, { FNText: '64', aText: '3.2' }).FNReason, 'plus');
  assert.equal(M.checkFbd(p, { FNText: '34', aText: '4' }).aReason, 'fullT');
  assert.equal(M.checkFbd(p, { FNText: '34', aText: '5.2' }).aReason, 'noFriction');
  assert.equal(M.checkFbd(p, { FNText: '34', aText: '-3.2' }).aReason, 'sign');
  assert.equal(M.checkFbd(p, { FNText: 'a', aText: '3.2' }).FNReason, 'unreadable');
});

test('motion: crate starts at rest (sum) or slides at v0; a decelerating crate stops and stays at rest (fbd)', () => {
  const p1 = { ...defaults, activity: 'sum', problem: '1' };
  const o1 = M.observe(M.at(2), p1);
  close(o1.dist, 0.5 * 12.5 * 4);                                         // a = 12.5 m/s² for 2 s, no travel limit
  close(o1.r[0] / o1.r[2], 6 / -8);                                      // moves along F_net
  const p4 = { ...p1, problem: '4' };
  close(M.observe(M.at(2), p4).dist, 0);                                  // balanced forces: stays at rest
  const slow = { activity: 'fbd', m: 5, T: 0, theta: 0, f: 10 };          // a_x = −2 m/s², stops at 0.5 s
  close(M.stopTime(slow), 0.5);
  close(M.observe(M.at(0.5), slow).v[0], 0);
  const later = M.observe(M.at(3), slow);                                 // still at rest where it stopped
  close(later.v[0], 0); close(later.r[0], 0.25); assert.equal(later.stopped, true); close(later.a[0], 0);
  const steady = { activity: 'fbd', m: 5, T: 10, theta: 0, f: 10 };       // F_net = 0: constant velocity
  close(M.observe(M.at(2), steady).v[0], M.V0); assert.equal(M.stopTime(steady), Infinity);
  const pf = { ...defaults, activity: 'fbd' };                            // a_x = 3.20 m/s², keeps speeding up
  close(M.observe(M.at(5), pf).v[0], M.V0 + M.pulled(pf).ax * 5);
  close(M.duration(pf), M.RUN);
});
