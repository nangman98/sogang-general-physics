import test from 'node:test';
import assert from 'node:assert/strict';
import { accel, gravity, normalForce, contact, pulley, advance, hitTime, G } from './newton.js';

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

test('pushing B from the right: the pair still points apart (5.3.1, 5.3.2)', () => {
  const c = contact(-20, 3, 2);
  near(c.a, -4); near(c.FAB, -12); near(c.FBA, 12);
  near(c.FAB, 3 * c.a);                      // A alone: F_AB = mA a
  near(-20 + c.FBA, 2 * c.a);                // B alone: F + F_BA = mB a
  const z = contact(0, 3, 2);
  near(z.a, 0); near(z.FBA, 0); near(z.FAB, 0);
  for (const F of [-30, -7, 7, 30]) {        // a contact force never pulls
    const p = contact(F, 4, 1.5);
    assert.ok(p.FBA >= 0 && p.FAB <= 0);
    near(p.FBA + p.FAB, 0);
  }
});

test('constant-acceleration step and hit time', () => {
  const [x, v] = advance(1, 2, 3, 2);
  near(x, 1 + 4 + 6); near(v, 8);
  let s = [0, 0];
  for (let i = 0; i < 100; i++) s = advance(...s, 3.8, 0.01);   // many small steps = one big step
  near(s[0], 0.5 * 3.8 * 1); near(s[1], 3.8);
  near(hitTime(0, 0, 2, 1), 1);              // x = t^2
  near(hitTime(0.25, 0, 2, 1), Math.sqrt(0.75));
  near(hitTime(0, 3, 0, 6), 2);              // constant speed
  near(hitTime(0, 5, -2, 4), 1);             // first of the two crossings (t = 1, 4)
  assert.equal(hitTime(0, 0, -2, 1), Infinity);
  assert.equal(hitTime(0, 0, 0, 1), Infinity);
  near(hitTime(1, 0, 2, 1), 0);
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
