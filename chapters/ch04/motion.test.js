import test from 'node:test';
import assert from 'node:assert/strict';
import { projectile, flightTime, range, maxHeight, trajectoryY, centripetal, period, circle, boat } from './motion.js';
import { snapDown, tickStep, place } from './view.js';

const near = (x, y, e = 1e-9) => assert.ok(Math.abs(x - y) < e, `${x} vs ${y}`);

test('projectile: landing point is R and the path is the trajectory equation (4.4.3-4.4.8)', () => {
  for (const [v0, th] of [[20, 45], [15, 30], [25, 70]]) {
    const T = flightTime(v0, th), p = projectile(v0, th, T);
    near(p.y, 0); near(p.x, range(v0, th));
    for (const t of [0.3, 0.7, 1.1]) { const q = projectile(v0, th, t); near(trajectoryY(v0, th, q.x), q.y); }
    near(projectile(v0, th, T / 2).vy, 0);
    near(projectile(v0, th, T / 2).y, maxHeight(v0, th));
  }
  // same launch speed: range is largest at 45 deg
  assert.ok(range(20, 45) > range(20, 40) && range(20, 45) > range(20, 50));
});

test('uniform circular motion (4.5.1, 4.5.2)', () => {
  near(centripetal(4, 2), 8);
  near(period(4, 2), Math.PI);
});

test('circle: constant speed, velocity along the tangent, acceleration v^2/r toward the center (4.5.3-4.5.7)', () => {
  for (const [v, r] of [[3, 4], [6, 2], [1, 5]]) {
    const T = period(v, r);
    for (const t of [0, 0.4, 1.3, T / 4, T / 2, 2.7]) {
      const c = circle(v, r, t);
      near(Math.hypot(c.x, c.y), r);
      near(Math.hypot(c.vx, c.vy), v);
      near(c.x * c.vx + c.y * c.vy, 0);                       // v is perpendicular to the radius
      near(Math.hypot(c.ax, c.ay), centripetal(v, r));
      near(c.ax * c.y - c.ay * c.x, 0);                       // a lies along the radius
      assert.ok(c.ax * c.x + c.ay * c.y < 0);                 // and points to the center
    }
    const c0 = circle(v, r, 0), cT = circle(v, r, T);
    near(c0.x, r); near(c0.y, 0); near(c0.vx, 0); near(c0.vy, v);
    near(cT.x, r, 1e-9); near(cT.y, 0, 1e-9);                // back to the start after one period
    near(circle(v, r, T / 4).y, r);                         // counterclockwise
  }
});

test('scene helpers: scale ladder, tick step, fitting points into the screen', () => {
  near(snapDown(10), 10); near(snapDown(9.5), 8); near(snapDown(22.8), 20); near(snapDown(0.95), 0.8); near(snapDown(1.24), 1.2);
  near(tickStep(20, 60), 5); near(tickStep(10, 60), 10); near(tickStep(44, 60), 2); near(tickStep(3, 60), 20);
  // both points fit and sit in the middle of what is left
  const { s, X0 } = place([{ x: 0, lo: 60, hi: 1000 }, { x: 40, lo: 60, hi: 1000 }], 30);
  near(s, 20); near(X0, 130);
  for (const p of [0, 40]) assert.ok(X0 + s * p >= 60 && X0 + s * p <= 1000);
  // a point on the left side needs room for the readout card
  const q = place([{ x: 0, lo: 60, hi: 1200 }, { x: -40, lo: 280, hi: 1200 }], 15);
  assert.ok(q.X0 - 40 * q.s >= 280 - 1e-9 && q.X0 <= 1200 + 1e-9 && q.s <= 15);
});

test('relative velocity of the boat (4.7.2)', () => {
  const b = boat(3, 1.5, 0, 24);
  assert.deepEqual(b.PA.map(v => +v.toFixed(12)), [1.5, 3]);
  near(b.time, 8); near(b.drift, 12);
  // heading upstream so that the boat goes straight across: sin th = vBA / vPB
  const th = (Math.asin(1.5 / 3) * 180) / Math.PI, s = boat(3, 1.5, th, 24);
  near(s.PA[0], 0, 1e-12); near(s.drift, 0, 1e-9);
});
