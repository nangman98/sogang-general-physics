// node --test sims/ch05/5-2-connected-bodies/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));
const sin = d => Math.sin(d * Math.PI / 180);

test('Sample Problem 5.3.1: block on a frictionless table and hanging block (θ = 0)', () => {
  const p = { M: 3.3, m: 2.1, theta: 0 };
  const { a, T } = M.incline(p);
  close(a, p.m * M.G / (p.M + p.m));                                   // (5.3.7)
  close(T, p.M * p.m * M.G / (p.M + p.m));                             // (5.3.8)
  close(T, p.M / (p.M + p.m) * p.m * M.G);                             // (5.3.9)
  close(+a.toFixed(1), 3.8); close(+T.toFixed(0), 13);
  close(T, p.M * a);                                                   // (5.3.4)
  close(T - p.m * M.G, -p.m * a);                                      // (5.3.6)
});

test('Sample Problem 5.3.1 special cases: g = 0, M = 0, m → ∞', () => {
  assert.deepEqual(M.incline({ M: 3.3, m: 2.1, theta: 0 }, 0), { a: 0, T: 0 });
  const free = M.incline({ M: 0, m: 2.1, theta: 0 });
  close(free.a, M.G); close(free.T, 0);
  const heavy = M.incline({ M: 3.3, m: 1e9, theta: 0 });
  close(heavy.a, M.G, 1e-6); close(heavy.T, 3.3 * M.G, 1e-6);
});

test('Sample Problem 5.3.2: cord pulls a 5.00 kg box up a 30.0° frictionless plane with 25.0 N', () => {
  close(+(5.0 * M.G).toFixed(1), 49.0);
  close(+M.alongIncline(5.0, 25.0, 30.0).toFixed(3), 0.100);           // (5.3.10)
});

test('incline: both second-law equations hold for the solution', () => {
  for (const p of [{ M: 3, m: 2, theta: 30 }, { M: 4, m: 0.5, theta: 60 }, { M: 0.5, m: 4, theta: 10 }, { M: 2.2, m: 1.7, theta: 45 }]) {
    const { a, T } = M.incline(p);
    close(M.alongIncline(p.M, T, p.theta), a);                         // T − Mg sin θ = Ma
    close(M.hangingAccel(p.m, T), a);                                  // T − mg = −ma
  }
  close(M.incline({ M: 4, m: 2, theta: 30 }).a, 0);                    // m = M sin θ: balanced
  close(M.incline({ M: 4, m: 2, theta: 30 }).T, 2 * M.G);
});

test("Atwood's machine: a and T from the two block equations", () => {
  const { a, T } = M.atwood({ m1: 2, m2: 3 });
  close(a, 1.96); close(T, 23.52);
  close(T - 2 * M.G, 2 * a);                                           // block 1: T − m1 g = m1 a
  close(T - 3 * M.G, -3 * a);                                          // block 2: T − m2 g = −m2 a
  const eq = M.atwood({ m1: 2.5, m2: 2.5 });                          // equal masses: at rest, T = mg
  assert.equal(eq.a, 0); close(eq.T, 2.5 * M.G);
  const r = M.atwood({ m1: 3, m2: 2 });
  assert.ok(r.a < 0); close(r.T, 23.52);
  for (const [m1, m2] of [[0.5, 4], [4, 0.5], [1.3, 3.3]]) {           // a < g and T between the two weights
    const s = M.atwood({ m1, m2 });
    assert.ok(Math.abs(s.a) < M.G);
    assert.ok(s.T > Math.min(m1, m2) * M.G && s.T < Math.max(m1, m2) * M.G);
  }
});

test('prediction grading: direction, magnitude, tension and the named mistakes', () => {
  const A = { activity: 'atwood', m1: 2, m2: 3 };                      // a = 1.96 m/s², T = 23.5 N
  assert.equal(M.check(A, { dir: 'pos', aText: '1.96', TText: '23.5' }).ok, true);
  assert.equal(M.check(A, { dir: 'neg', aText: '1.96', TText: '23.5' }).dirReason, 'wrong');
  assert.equal(M.check(A, { dir: 'pos', aText: '9.8', TText: '23.5' }).aReason, 'freefall');
  assert.equal(M.check(A, { dir: 'pos', aText: '3.27', TText: '23.5' }).aReason, 'oneMass');   // (m2 − m1)g/m2
  assert.equal(M.check(A, { dir: 'pos', aText: '1.96', TText: '29.4' }).TReason, 'weight');    // m2 g
  assert.equal(M.check(A, { dir: 'pos', aText: '1.96', TText: '19.6' }).TReason, 'weight');    // m1 g
  assert.equal(M.check(A, { dir: 'pos', aText: '1.96', TText: 'x' }).TReason, 'unreadable');
  const E = { activity: 'atwood', m1: 2.5, m2: 2.5 };
  assert.equal(M.check(E, { dir: 'none', aText: '0', TText: '24.5' }).ok, true);
  const I = { activity: 'incline', M: 3, m: 2, theta: 30 };            // a = 0.980 m/s², T = 17.6 N
  assert.equal(M.check(I, { dir: 'pos', aText: '0.98', TText: '17.64' }).ok, true);
  assert.equal(M.check(I, { dir: 'pos', aText: '1.96', TText: '17.64' }).aReason, 'noSin');    // |m − M| g/(M + m)
  assert.equal(M.check(I, { dir: 'pos', aText: '1.17', TText: '17.64' }).aReason, 'cos');      // |m − M cos θ| g/(M + m)
  assert.equal(M.check(I, { dir: 'pos', aText: '0.98', TText: '19.6' }).TReason, 'weight');    // mg
  assert.equal(M.check({ activity: 'incline', M: 4, m: 1, theta: 30 }, { dir: 'neg', aText: '1.96', TText: '11.76' }).ok, true);
});

test('runs stop before the blocks travel more than TRAVEL; balanced blocks stay at rest', () => {
  for (const p of [defaults, { ...defaults, activity: 'incline' }, { activity: 'atwood', m1: 0.1, m2: 10 }, { activity: 'incline', M: 0.1, m: 10, theta: 90 }]) {
    const T = M.duration(p), o = M.observe(M.at(T), p);
    assert.ok(Math.abs(o.s) <= M.TRAVEL[p.activity] + 1e-9);
    close(o.v, o.a * T);
  }
  const E = { activity: 'atwood', m1: 2, m2: 2 };
  close(M.duration(E), M.T_MAX); close(M.observe(M.at(2), E).s, 0);
  close(M.observe(M.at(0.5), { activity: 'atwood', m1: 2, m2: 3 }).s, 0.5 * 1.96 * 0.25);
  close(sin(30), 0.5);
});
