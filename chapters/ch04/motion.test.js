import test from 'node:test';
import assert from 'node:assert/strict';
import { projectile, flightTime, range, maxHeight, trajectoryY, centripetal, period, boat } from './motion.js';

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

test('relative velocity of the boat (4.7.2)', () => {
  const b = boat(3, 1.5, 0, 24);
  assert.deepEqual(b.PA.map(v => +v.toFixed(12)), [1.5, 3]);
  near(b.time, 8); near(b.drift, 12);
  // heading upstream so that the boat goes straight across: sin th = vBA / vPB
  const th = (Math.asin(1.5 / 3) * 180) / Math.PI, s = boat(3, 1.5, th, 24);
  near(s.PA[0], 0, 1e-12); near(s.drift, 0, 1e-9);
});
