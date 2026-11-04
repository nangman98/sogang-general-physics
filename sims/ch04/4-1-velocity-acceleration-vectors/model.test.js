// node --test sims/ch04/4-1-velocity-acceleration-vectors/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b}`);
const closeVec = (a, b, tol, msg = '') => a.forEach((v, i) => close(v, b[i], tol, `${msg}[${i}]`));
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));

// Sample Problem 4.1.1 path: x = −0.31t² + 7.2t + 28, y = 0.22t² − 9.1t + 30 (Eqs. 4.1.5, 4.1.6).
const rabbit = M.quadratic([28, 30, 0], [7.2, -9.1, 0], [-0.62, 0.44, 0]);

test('textbook example after Eq. 4.2.2: (12 m)i + (3.0 m)k in 2.0 s gives (6.0 m/s)i + (1.5 m/s)k', () => {
  const P = M.quadratic([0, 0, 0], [6, 0, 1.5], [0, 0, 0]);
  const { dr, vavg } = M.averageVelocity(P, 0, 2.0);
  closeVec(dr, [12, 0, 3], 1e-12, 'Δr');
  closeVec(vavg, [6.0, 0, 1.5], 1e-12, 'v_avg');
});

test('Sample Problem 4.2.1: rabbit velocity at t = 15 s is (−2.1 m/s)i + (−2.5 m/s)j, 3.3 m/s at −130°', () => {
  const v = rabbit.vel(15);
  close(v[0], -2.1, 1e-9, 'vx'); close(v[1], -2.5, 1e-9, 'vy');
  close(+M.norm(v).toFixed(1), 3.3, 1e-12, '|v|');
  close(Math.round(M.angle2D(v[0], v[1])), -130, 0, 'angle');
  const r = rabbit.pos(15);                                   // SP 4.1.1 position (66 m)i − (57 m)j
  close(Math.round(r[0]), 66, 0, 'x'); close(Math.round(r[1]), -57, 0, 'y');
});

test('Sample Problem 4.3.1: rabbit acceleration is (−0.62 m/s²)i + (0.44 m/s²)j, 0.76 m/s² at 145°', () => {
  for (const t of [0, 15, 25]) closeVec(rabbit.acc(t), [-0.62, 0.44, 0], 1e-12, `a(${t})`);
  const a = rabbit.acc(15);
  close(+M.norm(a).toFixed(2), 0.76, 1e-12, '|a|');
  close(Math.round(M.angle2D(a[0], a[1])), 145, 0, 'angle');
  // a = dv/dt: the average acceleration equals a for every Δt because a is constant.
  closeVec(M.averageAcceleration(rabbit, 15, 4).aavg, [-0.62, 0.44, 0], 1e-12, 'a_avg');
});

test('Sample Problem 4.3.2: v0 = (−2.0, 4.0) m/s, a = 3.0 m/s² at 130°, v(5.0 s) ≈ (−12 m/s)i + (16 m/s)j', () => {
  const th = 130 * Math.PI / 180, a = [3.0 * Math.cos(th), 3.0 * Math.sin(th), 0];
  close(+a[0].toFixed(2), -1.93, 1e-12, 'ax'); close(+a[1].toFixed(2), 2.30, 1e-12, 'ay');
  // The textbook inserts the rounded components −1.93 and 2.30 m/s², which gives vy = 15.50 m/s and then 16 m/s.
  const vBook = M.quadratic([0, 0, 0], [-2.0, 4.0, 0], [-1.93, 2.30, 0]).vel(5.0);
  close(vBook[1], 15.50, 1e-9, 'vy with rounded a');
  close(Math.round(vBook[0]), -12, 0, 'vx'); close(Math.round(vBook[1]), 16, 0, 'vy');
  // Unrounded components give the same magnitude and angle as the textbook answer.
  const v = M.quadratic([0, 0, 0], [-2.0, 4.0, 0], a).vel(5.0);
  close(+M.norm(v).toFixed(1), 19.4, 1e-12, '|v|');
  close(Math.round(M.angle2D(v[0], v[1])), 127, 0, 'angle');
});

test('analytic v and a are the derivatives of r on every stage path (Eqs. 4.2.5, 4.3.4)', () => {
  const h = 1e-5;
  for (const [id, P] of Object.entries(M.PATHS)) {
    for (const t of [0.3, 2.7, 5.5, P.T - 0.4]) {
      const dr = M.scale(M.sub(P.pos(t + h), P.pos(t - h)), 1 / (2 * h));
      const dv = M.scale(M.sub(P.vel(t + h), P.vel(t - h)), 1 / (2 * h));
      closeVec(P.vel(t), dr, 1e-6, `${id} v(${t})`);
      closeVec(P.acc(t), dv, 1e-6, `${id} a(${t})`);
    }
  }
});

test('Δt → 0: v_avg turns into v and a_avg into a (Eqs. 4.2.3, 4.3.2)', () => {
  for (const [id, P] of Object.entries(M.PATHS)) {
    const rows = M.shrinkTable(P, 2.5, 'vel'), arows = M.shrinkTable(P, 2.5, 'acc');
    for (let i = 1; i < rows.length; i++) {
      assert.ok(rows[i].angle <= rows[i - 1].angle + 1e-9, `${id} angle shrinks`);
      assert.ok(arows[i].angle <= arows[i - 1].angle + 1e-9 || arows[i].angle < 1e-6, `${id} a angle shrinks`);
    }
    const last = rows[rows.length - 1];
    assert.ok(last.angle < 0.5, `${id} v_avg within 0.5° of v at Δt = 0.01 s (${last.angle})`);
    close(last.size, last.exact, 0.01 * last.exact, `${id} |v_avg| → |v|`);
    assert.ok(arows[arows.length - 1].angle < 0.5, `${id} a_avg within 0.5° of a`);
  }
});

test('constant-acceleration path: v_avg over Δt equals v at the midpoint, a is the same everywhere', () => {
  const P = M.PATHS.const;
  closeVec(M.averageVelocity(P, 1, 2).vavg, P.vel(2), 1e-12, 'midpoint');
  closeVec(P.acc(0.5), P.acc(7.5), 0, 'a constant');
});

test('helix: constant speed, a perpendicular to v (preview of Module 4.5)', () => {
  const P = M.PATHS.helix;
  for (const t of [0, 1.7, 6, 11]) {
    close(M.norm(P.vel(t)), M.norm(P.vel(0)), 1e-12, 'speed');
    close(M.angleBetween(P.vel(t), P.acc(t)), 90, 1e-9, 'angle');
  }
});

test('stage paths stay above the board and inside it for t in [0, T]', () => {
  for (const [id, P] of Object.entries(M.PATHS)) {
    for (let i = 0; i <= 200; i++) {
      const [x, y, z] = P.pos(P.T * i / 200);
      assert.ok(y >= 0.9 && y <= 7.5, `${id} height ${y}`);
      assert.ok(Math.abs(x) <= 9 && Math.abs(z) <= 6, `${id} inside board ${x}, ${z}`);
    }
  }
});

test('prediction: four separated arrows, one right answer, every distractor graded with its reason', () => {
  for (let i = 0; i < M.QCOUNT; i++) {
    const q = M.question(i);
    for (const kind of ['v', 'a']) {
      const list = q.choices[kind];
      assert.equal(list.length, 4, `q${i} ${kind} has 4 choices`);
      assert.deepEqual(list.map(c => c.no), ['1', '2', '3', '4']);
      for (let m = 0; m < 4; m++) for (let n = m + 1; n < 4; n++) {
        assert.ok(M.angleBetween(list[m].dir, list[n].dir) >= M.MIN_SEPARATION, `q${i} ${kind} separation`);
      }
      const right = M.checkDirection(q, kind, M.checkDirection(q, kind, '0').answer);
      assert.equal(right.ok, true);
      const truth = kind === 'v' ? q.v : q.a;
      close(M.angleBetween(list.find(c => c.no === right.answer).dir, truth), 0, 1e-6, 'answer is the true direction');
      for (const c of list) if (c.no !== right.answer) assert.equal(M.checkDirection(q, kind, c.no).reason, c.key);
    }
  }
  // The right arrow number is not always the same.
  const nos = new Set(Array.from({ length: M.QCOUNT }, (_, i) => M.checkDirection(M.question(i), 'v', '0').answer));
  assert.ok(nos.size >= 3);
  for (let i = 0; i < M.QCOUNT; i++) {
    const q = M.question(i);
    assert.notEqual(M.checkDirection(q, 'v', '0').answer, M.checkDirection(q, 'a', '0').answer, `q${i} v and a answers differ`);
  }
});

test('observe at the default state', () => {
  const o = M.observe(M.at(0), defaults);                     // helix, t1 = 0, Δt = 2 s
  const R = 5, w = Math.PI / 6, c = 0.4, dt = 2;
  const chord = [R * Math.sin(w * dt) / dt, c, (R * Math.cos(w * dt) - R) / dt];
  closeVec(o.vavg, chord, 1e-12, 'v_avg');
  closeVec(o.v1, [R * w, c, 0], 1e-12, 'v');
  // Horizontal parts differ by ωΔt/2 = 30°; the common climb c makes the 3D angle a little smaller.
  const expect = Math.acos((chord[0] * R * w + c * c) / (Math.hypot(...chord) * Math.hypot(R * w, c))) * 180 / Math.PI;
  close(o.angleV, expect, 1e-9, 'angle');
  assert.ok(o.angleV < 30 && o.angleV > 25);
});

test('no NaN over the control ranges', () => {
  for (const path of Object.keys(M.PATHS)) for (const dt of [0.05, 1, 3]) {
    const p = { ...defaults, path, dt }, T = M.duration(p);
    for (const f of [0, 0.5, 1]) {
      const o = M.observe(M.at(T * f), p);
      for (const v of [...o.r1, ...o.vavg, ...o.aavg, o.angleV]) assert.ok(Number.isFinite(v));
    }
  }
});
