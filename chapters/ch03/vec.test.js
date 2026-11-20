import test from 'node:test';
import assert from 'node:assert/strict';
import { add, mag, dot, cross, rad, angleDeg } from './vec.js';

const near = (x, y, e = 1e-9) => assert.ok(Math.abs(x - y) < e, `${x} vs ${y}`);

test('components add (Eqs. 3.2.4-3.2.5)', () => {
  assert.deepEqual(add([3, 2], [1, 4]), [4, 6]);
  near(mag([3, 4]), 5);
  near(angleDeg([0, 1]), 90);
  near(angleDeg([1, -1]), 315);
});

test('dot product: ab cos(phi) equals component form (Eqs. 3.3.1, 3.3.4)', () => {
  for (const p of [0, 30, 90, 120, 180]) {
    const a = [5 * Math.cos(rad(p)), 5 * Math.sin(rad(p)), 0], b = [8, 0, 0];
    near(dot(a, b), 5 * 8 * Math.cos(rad(p)));
  }
  // Sample Problem 3.3.1: a = 3.0i - 4.0j, b = -2.0i + 3.0k -> a.b = -6.0
  near(dot([3, -4, 0], [-2, 0, 3]), -6);
});

test('cross product: magnitude ab sin(phi), perpendicular, order flips sign (Eqs. 3.3.5, 3.3.6, 3.3.8)', () => {
  const a = [3, 0, 0], b = [2.5 * Math.cos(rad(60)), 2.5 * Math.sin(rad(60)), 0];
  const c = cross(a, b);
  near(mag(c), 3 * 2.5 * Math.sin(rad(60)));
  near(dot(c, a), 0); near(dot(c, b), 0);
  assert.deepEqual(cross(b, a).map(v => -v + 0), c.map(v => v + 0));
  // Sample Problem 3.3.3: a = 3i - 4j, b = -2i + 3k -> a x b = -12i - 9j - 8k
  assert.deepEqual(cross([3, -4, 0], [-2, 0, 3]), [-12, -9, -8]);
});

test('cross product z component over phi 0-360 deg: a along x, b turned by phi in the xy plane', () => {
  for (const phi of [30, 150, 210, 330]) {
    const b = [2 * Math.cos(rad(phi)), 2 * Math.sin(rad(phi)), 0];
    const c = cross([2.5, 0, 0], b);
    assert.ok(Math.abs(c[2] - 2.5 * 2 * Math.sin(rad(phi))) < 1e-12);
    assert.equal(Math.sign(c[2]), phi < 180 ? 1 : -1);          // -z beyond 180 deg
    assert.ok(Math.abs(cross(b, [2.5, 0, 0])[2] + c[2]) < 1e-12); // order flips the sign (3.3.6)
  }
});

test('difference by components and polar helpers (Eqs. 3.1.4, 3.2.7, 3.1.5)', async () => {
  const { sub, polar, between, ccw, snap } = await import('./vec.js');
  assert.deepEqual(sub([4, 1], [1, 3]), [3, -2]);
  assert.deepEqual(add([4, 1], [-1, -3]), sub([4, 1], [1, 3]));   // a - b = a + (-b)
  const p = polar(2, 30); near(p[0], 2 * Math.cos(rad(30))); near(p[1], 1);
  near(between(10, 60), 50); near(between(60, 10), 50); near(between(350, 20), 30); near(between(0, 180), 180); near(between(0, 250), 110);
  near(ccw(0, 70), 70); near(ccw(70, 0), 290); near(ccw(350, 20), 30); near(ccw(30, 30), 0);
  assert.equal(snap(1.26, 0.5), 1.5); assert.equal(snap(-0.74, 0.5), -0.5); assert.equal(snap(9, 0.5, -6, 6), 6); assert.equal(snap(0.30000000000000004, 0.1), 0.3);
  // a.b from polar form matches ab cos(phi) with phi the smaller angle
  const a = polar(4, 200), b = polar(6, 330);
  near(dot(a, b), 4 * 6 * Math.cos(rad(between(200, 330))));
  // c_z from polar form matches ab sin(phi) with phi measured ccw from a to b (0-360)
  near(cross([...a, 0], [...b, 0])[2], 4 * 6 * Math.sin(rad(ccw(200, 330))));
});
