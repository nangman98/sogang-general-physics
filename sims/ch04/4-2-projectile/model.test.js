// node --test sims/ch04/4-2-projectile/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const base = { v0: 20, theta0: 45, phi: 0 };
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('horizontal range matches Eq. (4.4.8)', () => {
  close(M.range(base), 400 / 9.8, 1e-12, 'R');
  close(M.at(M.duration(base), base).position_m[0], M.range(base), 1e-9, 'x at landing');
});

test('textbook Sample Problem: launch speed 82.0 m/s at 45° gives range 686 m', () => {
  assert.equal(Math.round(M.range({ v0: 82.0, theta0: 45, phi: 0 })), 686);
});

test('maximum height at half the flight time', () => {
  const s = M.at(M.duration(base) / 2, base);
  close(s.position_m[1], M.maxHeight(base), 1e-12, 'y at T/2');
  close(s.velocity_m_s[1], 0, 1e-12, 'vy at apex');
  close(M.maxHeight(base), 10.204081632653061, 1e-12, 'H');
});

test('lands at launch height with reversed vertical velocity', () => {
  const s = M.at(M.duration(base), base);
  close(s.position_m[1], 0, 1e-9, 'y(T)');
  close(s.velocity_m_s[1], -M.components(base).v0y, 1e-9, 'vy(T)');
});

test('trajectory obeys Eq. (4.4.7)', () => {
  for (const p of [base, { v0: 13, theta0: 22, phi: 0 }, { v0: 29, theta0: 71, phi: 0 }]) {
    const th = p.theta0 * Math.PI / 180, T = M.duration(p);
    for (let i = 0; i <= 20; i++) {
      const [x, y] = M.at(T * i / 20, p).position_m;
      const expect = Math.tan(th) * x - M.G * x * x / (2 * (p.v0 * Math.cos(th)) ** 2);
      close(y, expect, 1e-9, `y(x) at i=${i}`);
    }
  }
});

test('turning the launch plane keeps height and in-plane distance', () => {
  const t = 1.1;
  const a = M.at(t, base), b = M.at(t, { ...base, phi: 30 });
  close(b.position_m[1], a.position_m[1], 1e-12, 'height');
  close(Math.hypot(b.position_m[0], b.position_m[2]), a.position_m[0], 1e-12, 'horizontal distance');
  assert.ok(b.position_m[2] < 0, 'positive phi turns toward −z (counterclockwise seen from +y)');
});

test('no NaN or Infinity over the control ranges', () => {
  for (const v0 of [10, 15, 20, 25, 30]) for (const theta0 of [10, 30, 45, 60, 80]) for (const phi of [-60, 0, 60]) {
    const p = { v0, theta0, phi }, T = M.duration(p);
    for (const f of [0, 0.37, 1, 1.5]) {
      const s = M.observe(M.at(T * f, p), p);
      for (const v of [...s.position_m, ...s.velocity_m_s, s.range_m, s.flightTime_s]) assert.ok(Number.isFinite(v));
    }
  }
});
