// node --test sims/ch02/2-1-velocity-acceleration/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));

test('preset motions: v and a are the time derivatives of x and v', () => {
  const h = 1e-5;
  for (const id of M.MOTION_IDS) {
    const m = M.MOTIONS[id];
    for (const t of [0.3, 1.7, 2.5, 3.9, 5.2, 7.6]) {
      close(m.v(t), (m.x(t + h) - m.x(t - h)) / (2 * h), 1e-6);       // (2.2.1)
      close(m.a(t), (m.v(t + h) - m.v(t - h)) / (2 * h), 1e-6);       // (2.3.2)
    }
  }
});

test('secant slope tends to the tangent slope as Δt → 0', () => {
  for (const id of M.MOTION_IDS) {
    const m = M.MOTIONS[id];
    for (const q of ['x', 'v']) {
      let prev = Infinity;
      for (const dt of [0.5, 0.1, 0.01, 1e-3, 1e-4]) {
        const s = M.secant(m, 3.3, dt, q), err = Math.abs(s.slope - s.tangent);
        assert.ok(err <= prev + 1e-9, `${id} ${q} error grows at Δt = ${dt}`);
        prev = err;
      }
      assert.ok(prev < 1e-3, `${id} ${q} limit ${prev}`);
    }
  }
});

test('Sample Problem 2.1.1: displacement, time interval, average velocity, average speed', () => {
  const dx = M.displacement(0, 10.0 + 3.00);                       // (2.1.1) km
  close(dx, 13.0);
  const dtCar = 10.0 / 40.0, dt = dtCar + 0.500;                    // h
  close(dtCar, 0.250); close(dt, 0.750);
  close(+M.vAvg(0, 13.0, 0, dt).toFixed(1), 17.3);                 // (2.1.2) km/h
  close(+M.sAvg(10.0 + 3.00 + 3.00, 0.250 + 0.500 + 0.500).toFixed(1), 12.8);   // (2.1.3) km/h
});

// Elevator cab of Fig. 2.2.1, rebuilt from its a(t): +2 m/s² on 1–3 s, −4 m/s² on 8–9 s.
const elevator = {
  a: t => (t >= 1 && t < 3 ? 2 : t >= 8 && t < 9 ? -4 : 0),
  v: t => (t < 1 ? 0 : t < 3 ? 2 * (t - 1) : t < 8 ? 4 : t < 9 ? 4 - 4 * (t - 8) : 0),
  x: t => (t < 1 ? 0 : t < 3 ? (t - 1) ** 2 : t < 8 ? 4 + 4 * (t - 3) : t < 9 ? 24 + 4 * (t - 8) - 2 * (t - 8) ** 2 : 26),
};

test('Sample Problem 2.2.1: slope of x(t) during bc is +4.0 m/s, Δx = +20 m', () => {
  close(elevator.x(3.0), 4.0); close(elevator.x(8.0), 24);
  const s = M.secant(elevator, 3.0, 5.0, 'x');                       // (2.2.2)
  close(s.slope, 4.0);
  close(M.secant(elevator, 5.0, 1e-4, 'x').slope, 4.0, 1e-9);        // tangent equals the secant on a straight part
  close(4.0 * (8.0 - 3.0), s.dy);                                     // (2.2.3) area under v(t) equals Δx
  close(s.dy, 20);
  // Stationary parts: slope 0 before 1 s and after 9 s.
  close(M.secant(elevator, 0.2, 0.5, 'x').slope, 0); close(M.secant(elevator, 9.2, 0.5, 'x').slope, 0);
  // Fig. 2.2.1c: a is the slope of v(t).
  close(M.secant(elevator, 1.5, 1e-4, 'v').slope, 2, 1e-9); close(M.secant(elevator, 8.2, 1e-4, 'v').slope, -4, 1e-9);
});

const sp231 = { x: t => 4 - 27 * t + t ** 3, v: t => -27 + 3 * t * t, a: t => 6 * t };

test('Sample Problem 2.3.1: x = 4 − 27t + t³ gives v = 0, a = 18 m/s², x = −50 m at t = 3 s', () => {
  close(sp231.v(3), 0); close(sp231.a(3), 18); close(sp231.x(3), -50);
  close(M.secant(sp231, 3, 1e-6, 'x').slope, 0, 1e-5);
  close(M.secant(sp231, 3, 1e-6, 'v').slope, 18, 1e-5);
  // Fig. 2.3.2: (a) a = 0 at t = 0, (b) slowing at 1 s, (d) speeding up at 4 s.
  assert.equal(M.speedChange(sp231.v(0), sp231.a(0)), 'none');
  assert.equal(M.speedChange(sp231.v(1), sp231.a(1)), 'down');
  assert.equal(M.speedChange(sp231.v(4), sp231.a(4)), 'up');
});

test('Signs: v = −25 m/s braked to rest in 5.0 s has a_avg = +5.0 m/s² and slows', () => {
  const a = M.aAvg(-25, 0, 0, 5.0);                                  // (2.3.1)
  close(a, 5.0);
  assert.equal(M.speedChange(-25, a), 'down');
  assert.equal(M.speedChange(3, 2), 'up'); assert.equal(M.speedChange(-3, -2), 'up'); assert.equal(M.speedChange(3, -2), 'down');
});

test('estimate grading: limit value, still-wide secant, sign, height read as slope', () => {
  const m = M.MOTIONS.turn;                                           // v(2) = 3 m/s, a = −1.5 m/s²
  assert.equal(M.checkEstimate(m, 2, 0.01, 'x', '3').ok, true);
  assert.equal(M.checkEstimate(m, 2, 0.01, 'x', '3.04').ok, true);
  assert.equal(M.checkEstimate(m, 2, 2, 'x', String(M.secant(m, 2, 2, 'x').slope)).reason, 'secant');   // 1.5 m/s
  assert.equal(M.checkEstimate(m, 2, 0.01, 'x', '-3').reason, 'sign');
  assert.equal(M.checkEstimate(m, 2, 0.01, 'x', '1').reason, 'height');                                // x(2) = 1 m
  assert.equal(M.checkEstimate(m, 2, 0.01, 'x', '0.5').reason, 'ratio');                               // x(2)/2 s
  assert.equal(M.checkEstimate(m, 2, 0.01, 'x', 'abc').reason, 'unreadable');
  assert.equal(M.checkEstimate(m, 2, 0.5, 'v', '-1.5').ok, true);                                      // a on v–t
});

test('slope activity: velocity signs at the marked times', () => {
  const want = { restgo: ['0', '+', '+'], uniform: ['-', '-', '-'], speedup: ['+', '+', '+'], turn: ['+', '0', '-'], swing: ['+', '-', '0'] };
  for (const id of M.MOTION_IDS) {
    const r = M.checkSigns(M.MOTIONS[id], want[id]);
    assert.equal(r.ok, true, id);
  }
  const r = M.checkSigns(M.MOTIONS.turn, ['+', '+', '-']);
  assert.equal(r.ok, false); assert.equal(r.items[1].ok, false);
});

test('speed activity: four sign pairs, and the two typical wrong patterns', () => {
  const right = M.checkSpeed(['down', 'up', 'down', 'up']);
  assert.equal(right.ok, true);
  for (const it of right.items) assert.ok(Math.abs(it.v) > 1 && Math.abs(it.a) > 1);   // each pair is clearly signed
  assert.equal(M.checkSpeed(['down', 'down', 'up', 'up']).pattern, 'a-sign');
  assert.equal(M.checkSpeed(['up', 'down', 'down', 'up']).pattern, 'v-sign');
  assert.equal(M.checkSpeed(['up', 'up', 'up', 'up']).pattern, null);
  assert.equal(M.checkSpeed(['down', 'up', '', 'up']).complete, false);
});

test('observe: default secant and the turning point', () => {
  const o = M.observe(M.at(4), defaults);
  close(o.x, 4); close(o.v, 0); close(o.a, -1.5); assert.equal(o.change, 'none');
  close(o.sec.slope, 1.5);                                            // [2 s, 4 s] on x = −8 + 6t − 0.75t²
  close(o.sec.tangent, 3);
});
