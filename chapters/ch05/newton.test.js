import test from 'node:test';
import assert from 'node:assert/strict';
import { accel, gravity, normalForce, contact, pulley, G } from './newton.js';

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

test('block on table, block hanging (5.3.4, 5.3.6, 5.3.7, 5.3.9)', () => {
  const p = pulley(3.3, 2.1);                    // textbook Sample Problem 5.3.1 masses
  near(p.a, 2.1 * G / 5.4);
  near(p.T, 3.3 * p.a);                          // (5.3.4) T = Ma
  near(p.T - 2.1 * G, -2.1 * p.a);               // (5.3.6) T - mg = -ma
  near(p.T, 3.3 / 5.4 * 2.1 * G);                // (5.3.9)
  assert.ok(Math.abs(p.a - 3.8) < 0.05 && Math.abs(p.T - 13) < 0.5);   // textbook answers 3.8 m/s^2, 13 N
  assert.ok(p.a < G && p.T < 2.1 * G);
  near(pulley(3.3, 2.1, 0).a, 0); near(pulley(3.3, 2.1, 0).T, 0);      // g = 0: no motion, no tension
});
