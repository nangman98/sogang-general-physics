import test from 'node:test';
import assert from 'node:assert/strict';
import { velocity, position, extent, landing, G } from './kinematics.js';

const near = (x, y, e = 1e-9) => assert.ok(Math.abs(x - y) < e, `${x} vs ${y}`);

test('constant acceleration equations agree (2.4.1, 2.4.5-2.4.8)', () => {
  for (const [x0, v0, a, t] of [[0, 8, -4, 1.5], [2, -3, 5, 2], [0, 10, 0, 4]]) {
    const v = velocity(v0, a, t), x = position(x0, v0, a, t);
    near(v * v, v0 * v0 + 2 * a * (x - x0));          // (2.4.6)
    near(x - x0, 0.5 * (v0 + v) * t);                  // (2.4.7)
    near(x - x0, v * t - 0.5 * a * t * t);             // (2.4.8)
    const h = 1e-6;
    near((position(x0, v0, a, t + h) - position(x0, v0, a, t - h)) / (2 * h), v, 1e-6);   // v = dx/dt (2.2.1)
  }
});

test('turning point: v = 0 while a stays the same', () => {
  const v0 = 8, a = -4, tTurn = -v0 / a;
  near(velocity(v0, a, tTurn), 0);
  assert.ok(position(0, v0, a, tTurn) > position(0, v0, a, tTurn - 0.1));
  assert.ok(position(0, v0, a, tTurn) > position(0, v0, a, tTurn + 0.1));   // farthest point
  near(position(0, v0, a, 4), 0);                                            // back at x0 after 4 s
});

test('extent of x over [0, T] includes the turning point', () => {
  assert.deepEqual(extent(0, 8, -4, 4), [0, 8]);
  assert.deepEqual(extent(0, 8, -4, 6), [-24, 8]);
  assert.deepEqual(extent(0, 10, 0, 4), [0, 40]);
  assert.deepEqual(extent(0, -10, -5, 4), [-80, 0]);
  assert.deepEqual(extent(2, 0, 0, 4), [2, 2]);
});

test('landing time for free fall (a = -g)', () => {
  near(landing(0, 15), 2 * 15 / G);                        // back to the launch height
  near(landing(20, 0), Math.sqrt(2 * 20 / G));             // dropped from rest
  near(landing(0, -3), 0);
  for (const [y0, v0] of [[20, 10], [30, -15], [5, 20]]) {
    const T = landing(y0, v0);
    near(position(y0, v0, -G, T), 0);
    assert.ok(velocity(v0, -G, T) < 0);
  }
});
