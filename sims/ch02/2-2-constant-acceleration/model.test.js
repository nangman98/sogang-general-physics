// node --test sims/ch02/2-2-constant-acceleration/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));

test('Table 2.4.1 equations agree with the exact motion', () => {
  for (const c of [{ x0: -10, v0: 8, a: -2 }, { x0: 3, v0: -4.5, a: 1.7 }, { x0: 0, v0: 0, a: 3 }]) {
    for (const t of [0, 0.7, 3, 9.2]) {
      const { x, v, a } = M.stateAt(c, t), dx = x - c.x0;
      close(v, c.v0 + a * t);                                   // (2.4.1)
      close(dx, c.v0 * t + 0.5 * a * t * t);                    // (2.4.5)
      close(v * v, c.v0 ** 2 + 2 * a * dx);                     // (2.4.6)
      close(dx, 0.5 * (c.v0 + v) * t);                          // (2.4.7)
      close(dx, v * t - 0.5 * a * t * t);                       // (2.4.8)
    }
  }
});

test('Sample Problem 2.4.1: accelerate to 27.0 m/s, then pass the slower car', () => {
  const L = 4.5, v0 = 22.0, a = 3.5, v = 27.0;
  const t1 = (v - v0) / a;                                        // (2.4.1)
  close(+t1.toFixed(2), 1.43);
  const d1 = M.stateAt({ x0: 0, v0, a }, t1).x;                   // (2.4.5)
  close(+d1.toFixed(1), 35.0);
  // x_B2 = d1 + v t2 and x_A2 = 4L + v0 (t1 + t2), with x_B2 = x_A2 + 4L.
  const t2 = (8 * L + v0 * t1 - d1) / (v - v0);
  close(+t2.toFixed(2), 6.49);
  close(+(t1 + t2).toFixed(2), 7.91);
});

test('Sample Problem 2.4.2: woodpecker head stops in 1.87 mm', () => {
  const a = (0 - 7.49 ** 2) / (2 * 1.87e-3);                    // (2.4.6)
  close(+a.toPrecision(4), -1.500e4);
  close(+(Math.abs(a) / 9.8).toPrecision(3), 1.53e3);
});

test('Sample Problem 2.4.3: v versus x line through (20 m, 8 m/s) and (70 m, 0)', () => {
  const a = (0 - 8 ** 2) / (2 * (70 - 20));                     // (2.4.6)
  close(a, -0.64);
  const v0 = Math.sqrt(8 ** 2 - 2 * a * 20);
  close(+v0.toFixed(1), 9.5);
});

test('position range includes the turning point', () => {
  const [lo, hi] = M.xRange({ x0: -10, v0: 8, a: -2 });       // turns at t = 4 s, x = 6 m; x(10) = −30 m
  close(lo, -30); close(hi, 6);
  assert.deepEqual(M.vRange({ x0: 0, v0: 8, a: -2 }), [-12, 8]);
});

test('meeting times of the default cars are 4 s and 5 s', () => {
  const r = M.meetTimes(defaults);
  assert.equal(r.length, 2); close(r[0], 4); close(r[1], 5);
  for (const t of r) close(M.stateAt(M.carA(defaults), t).x, M.stateAt(M.carB(defaults), t).x);
});

test('meeting times: linear case, no meeting, start together', () => {
  close(M.meetTimes({ x0: 0, v0: 5, a: 0, x0B: 20, v0B: 1, aB: 0 })[0], 5);
  assert.deepEqual(M.meetTimes({ x0: 0, v0: 1, a: 0, x0B: 20, v0B: 1, aB: 0 }), []);
  assert.deepEqual(M.meetTimes({ x0: 0, v0: 0, a: 1, x0B: 50, v0B: 0, aB: 0 }, 5), []);   // meets at 10 s only
  assert.deepEqual(M.meetTimes({ x0: 5, v0: 2, a: 0, x0B: 5, v0B: 1, aB: 0 }), []);       // t = 0 is not counted
});

test('first meeting prediction is graded, the second meeting is named', () => {
  assert.equal(M.checkMeet(defaults, '4', false).ok, true);
  assert.equal(M.checkMeet(defaults, '4.03', false).ok, true);
  assert.equal(M.checkMeet(defaults, '5', false).reason, 'second');
  assert.equal(M.checkMeet(defaults, '6', false).reason, 'value');
  assert.equal(M.checkMeet(defaults, '', true).reason, 'meets');
  assert.equal(M.checkMeet({ ...defaults, x0B: 20, v0B: 9 }, '', true).ok, true);
});

test('missing-quantity questions are consistent and pick the right equation', () => {
  const seen = new Set();
  for (let i = 0; i < M.QCOUNT; i++) {
    const q = M.question(i), { dx, v0, v, a, t } = q.values;
    close(v, v0 + a * t); close(dx, v0 * t + 0.5 * a * t * t); close(v * v, v0 ** 2 + 2 * a * dx);
    assert.equal(q.given.length, 3);
    assert.ok(!q.given.includes(q.ask) && !q.given.includes(q.missing));
    const eq = M.EQUATIONS.find(e => e.no === q.equation);
    assert.equal(eq.missing, q.missing);
    seen.add(q.equation);
    assert.equal(M.checkMissing(q, q.equation, String(q.answer)).ok, true);
  }
  assert.equal(seen.size, 5);                                        // every row of Table 2.4.1 is used
});

test('missing-quantity grading: wrong equation, sign, unreadable', () => {
  const q = M.question(2);                                            // a = −2 m/s² from v² = v0² + 2a(x − x0)
  assert.equal(q.answer, -2);
  assert.equal(M.checkMissing(q, '2.4.6', '-2').ok, true);
  assert.equal(M.checkMissing(q, '2.4.6', '−2.0').ok, true);
  assert.equal(M.checkMissing(q, '2.4.1', '-2').eqOk, false);
  assert.equal(M.checkMissing(q, '2.4.6', '2').reason, 'sign');
  assert.equal(M.checkMissing(q, '2.4.6', 'abc').reason, 'unreadable');
});

test('observe at the default turning point', () => {
  const o = M.observe(M.at(4), defaults);
  close(o.x, 6); close(o.v, 0); close(o.a, -2); close(o.dx, 16);
});
