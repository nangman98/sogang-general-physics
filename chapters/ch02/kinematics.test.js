import test from 'node:test';
import assert from 'node:assert/strict';
import { velocity, position } from './kinematics.js';

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
