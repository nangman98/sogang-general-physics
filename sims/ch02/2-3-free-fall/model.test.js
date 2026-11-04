// node --test sims/ch02/2-3-free-fall/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));

test('g is 9.8 m/s² and the acceleration is −g at every time', () => {
  assert.equal(M.G, 9.8);
  for (const t of [0, 0.5, 1.53, 3]) assert.equal(M.stateAt(15, t).a, -9.8);
});

test('Sample Problem 2.5.1: a 48 m fall from rest takes 3.1 s and ends near −31 m/s', () => {
  const t = M.groundTime(0, 48);                                    // y − y0 = v0 t − ½ g t²
  close(t, Math.sqrt(48 / 4.9));
  close(+t.toFixed(1), 3.1);
  const v = M.groundVelocity(0, 48);                                // v² = v0² − 2g(y − y0)
  close(+v.toPrecision(2), -31);
  close(M.stateAt(0, t).y, -48, 1e-12);
});

test('Fig. 2.5.2 table: y and v at t = 1, 2, 3 s for a fall from rest', () => {
  const want = [[1, -4.9, -9.8], [2, -19.6, -19.6], [3, -44.1, -29.4]];
  for (const [t, y, v] of want) {
    const s = M.stateAt(0, t);
    close(+s.y.toFixed(1), y); close(+s.v.toFixed(1), v); close(s.a, -9.8);
  }
});

test('Table 2.4.1 in y notation agrees with the exact motion', () => {
  for (const v0 of [15, -4, 0, 2.5]) for (const t of [0, 0.4, 1.7, 3.2]) {
    const { y, v } = M.stateAt(v0, t);
    close(v, v0 - M.G * t);                                         // v = v0 − g t
    close(y, v0 * t - 0.5 * M.G * t * t);                           // y − y0 = v0 t − ½ g t²
    close(v * v, v0 * v0 - 2 * M.G * y);                            // v² = v0² − 2g(y − y0)
    close(y, 0.5 * (v0 + v) * t);                                   // (2.4.7) in y notation
    close(y, v * t + 0.5 * M.G * t * t);                            // (2.4.8) in y notation with a = −g
  }
});

test('highest point: v = 0, a = −g, y_max = v0²/2g', () => {
  const v0 = 15, tt = M.timeToTop(v0), s = M.stateAt(v0, tt);
  close(s.v, 0); close(s.a, -9.8); close(s.y, M.maxHeight(v0));
  close(M.maxHeight(v0), 225 / 19.6);
  assert.equal(M.timeToTop(-3), 0); assert.equal(M.maxHeight(-3), 0);
});

test('symmetry: ascent and descent take the same time, speeds match at every height', () => {
  for (const v0 of [3, 12, 24.5]) {
    const S = M.symmetry(v0, M.maxHeight(v0) * 0.4);
    close(S.ascent, S.descent); close(S.returnSpeed, v0);
    assert.equal(S.passes.length, 2);
    close(S.passes[0].t + S.passes[1].t, 2 * M.timeToTop(v0));
    close(S.passes[0].v, -S.passes[1].v);
    for (const ps of S.passes) close(ps.y, M.maxHeight(v0) * 0.4);
  }
  assert.equal(M.timesAt(10, M.maxHeight(10)).length, 1);
  assert.equal(M.timesAt(10, M.maxHeight(10) + 0.1).length, 0);
});

test('equal-interval images: descent images sit at the heights of the ascent images', () => {
  const v0 = 15, h = 20, ts = M.ghostTimes(v0, h), n = Math.round(M.timeToTop(v0) / M.ghostStep(v0));
  close(ts[n], M.timeToTop(v0));
  for (let k = 0; k <= n; k++) close(M.stateAt(v0, ts[k]).y, M.stateAt(v0, ts[2 * n - k]).y, 1e-9);
  // Spacing shrinks on the way up and grows on the way down.
  const y = ts.map(t => M.stateAt(v0, t).y), gaps = y.slice(1).map((v, i) => Math.abs(v - y[i]));
  for (let k = 1; k < n; k++) assert.ok(gaps[k] < gaps[k - 1]);
  for (let k = n + 1; k < gaps.length; k++) assert.ok(gaps[k] > gaps[k - 1]);
  assert.ok(ts[ts.length - 1] <= M.groundTime(v0, h));
  assert.equal(M.ghostStep(-3), 0.25);
});

test('top prediction grading names a = 0 separately', () => {
  assert.equal(M.checkTop('0', '-g').ok, true);
  assert.equal(M.checkTop('0', '0').reason, 'a-zero');
  assert.equal(M.checkTop('0', '+g').reason, 'a-up');
  assert.equal(M.checkTop('+', '-g').reason, 'v');
  assert.equal(M.checkTop('', '-g').reason, 'incomplete');
});

test('symmetry prediction grading', () => {
  assert.equal(M.checkSym('equal', 'equal').ok, true);
  assert.equal(M.checkSym('up', 'equal').tOk, false);
  assert.equal(M.checkSym('equal', 'less').sOk, false);
  assert.equal(M.checkSym('', 'less').reason, 'incomplete');
});

test('default throw: 10 m/s from 12 m', () => {
  close(M.duration(defaults), (10 + Math.sqrt(100 + 2 * 9.8 * 12)) / 9.8);
  const o = M.observe(M.at(M.timeToTop(10)), defaults);
  close(o.v, 0); close(o.y, 100 / 19.6); close(o.a, -9.8); close(o.speed, 0);
});
