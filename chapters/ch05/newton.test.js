import test from 'node:test';
import assert from 'node:assert/strict';
import { accel, gravity, normalForce, contact, G } from './newton.js';

const near = (x, y, e = 1e-9) => assert.ok(Math.abs(x - y) < e, `${x} vs ${y}`);

test('second law and unit (5.1.1, 5.1.3)', () => {
  near(accel(10, 2), 5);
  near(accel(1, 1), 1);   // 1 N on 1 kg gives 1 m/s^2
});

test('gravity and normal force in an elevator (5.2.1, 5.2.6, 5.2.7)', () => {
  near(gravity(60), 60 * G);
  near(normalForce(60, 0), 60 * G);          // not accelerating: F_N = mg (5.2.7)
  near(normalForce(60, 2), 60 * (G + 2));    // accelerating up: heavier reading
  near(normalForce(60, -G), 0);              // free fall: scale reads zero
});

test('third law pair and the system (5.3.1, 5.3.2)', () => {
  const c = contact(20, 3, 2);
  near(c.a, 4); near(c.FBA, 8); near(c.FAB, -8);
  near(20 + c.FAB, 3 * c.a);                 // A alone: F + F_AB = mA a
  near(c.FBA, 2 * c.a);                      // B alone: F_BA = mB a
});
