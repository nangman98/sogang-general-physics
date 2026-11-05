// node --test sims/ch13/13-2-earth-tunnel/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const { R, M: ME } = M.EARTH;

test('Eqs. 13.4.1–13.4.3: inside mass M r³/R³ gives a force linear in r; it joins Eq. 13.1.1 at the surface', () => {
  const m = 100;
  for (const q of [0.1, 0.5, 0.9]) close(M.force(m, q * R), M.G * m * M.insideMass(q * R) / (q * R) ** 2);
  close(M.force(m, 0.5 * R) / M.force(m, 0.25 * R), 2);
  close(M.force(m, R), M.G * m * ME / R ** 2); close(M.force(m, 2 * R), M.force(m, R) / 4);
  assert.equal(M.force(m, 0), 0);
});

test('Eq. 13.4.4: the motion satisfies m d²y/dt² = −K y and reaches the north pole at half a period', () => {
  const p = { m: 200, q: 0.4 }, s = M.tunnel(), K = M.G * p.m * ME / R ** 3, h = 0.5;
  for (const t of [300, 1500, 3100]) {
    const y = q => M.stateAt(q, p).y;
    close(p.m * (y(t + h) - 2 * y(t) + y(t - h)) / (h * h), -K * y(t), 1e-6);
    close(M.stateAt(t, p).Fy, -K * y(t));
  }
  close(M.stateAt(s.T / 2, p).y, R, 1e-12); close(M.stateAt(0, p).y, -R);
  assert.equal(Math.round(s.T / 60), 84);                             // about 84 min for a round trip
});

test('speed at the center: ½mv² equals the work ½KR² of the Hooke-law force (Eqs. 7.4.6, 7.2.8)', () => {
  const p = { m: 200, q: 0.4 }, s = M.tunnel(), K = M.G * p.m * ME / R ** 3;
  close(0.5 * p.m * s.vc ** 2, 0.5 * K * R * R);
  close(Math.abs(M.stateAt(s.T / 4, p).vy), s.vc);
  assert.equal((s.vc / 1e3).toFixed(2), '7.91');
});

test('grading with the named mistakes', () => {
  const p = { m: 200, q: 0.4 }, s = M.tunnel(), F = M.force(200, 0.4 * R);
  assert.equal(M.check(p, { FText: F.toFixed(1), vText: (s.vc / 1e3).toFixed(2) }).ok, true);
  assert.equal(M.check(p, { FText: (M.G * 200 * ME / (0.4 * R) ** 2).toFixed(0), vText: '7.91' }).FReason, 'allMass');
  assert.equal(M.check(p, { FText: (200 * s.gs).toFixed(0), vText: '7.91' }).FReason, 'surface');
  assert.equal(M.check(p, { FText: F.toFixed(1), vText: (Math.sqrt(2 * s.gs * R) / 1e3).toFixed(2) }).vReason, 'uniformG');
});
