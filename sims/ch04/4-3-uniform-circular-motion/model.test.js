// node --test sims/ch04/4-3-uniform-circular-motion/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b}`);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));

test('Sample Problem 4.5.1: v = 640.31 m/s, half a circle in 24.0 s, a = 83.81 m/s² ≈ 8.6g', () => {
  const v = Math.hypot(400, 500);
  close(+v.toFixed(2), 640.31, 1e-9, 'v');
  const T = 2 * 24.0;                                     // final velocity reverses the initial one
  const r = v * T / (2 * Math.PI);                         // Eq. (4.5.2) solved for r
  close(M.period(r, v), T, 1e-9, 'T');
  const a = M.centripetal(v, r);                           // Eq. (4.5.1)
  close(a, 2 * Math.PI * v / T, 1e-9, 'a = 2πv/T');
  // 2π(640.31 m/s)/(48.0 s) = 83.817 m/s². The textbook prints 83.81, so the check is to its last digit.
  close(a, 83.81, 0.01, 'a');
  close(+(a / 9.8).toFixed(1), 8.6, 1e-9, 'a in g units');
});

test('Sample Problem 4.5.2: a = g = 9.20 m/s² at r = 6.37 × 10⁶ m + 200 km gives v = 7.77 km/s and T = 1.47 h', () => {
  const r = 6.37e6 + 200e3, v = M.speedForAcceleration(9.20, r);
  close(Math.round(v / 10) * 10, 7770, 0, 'v');
  close(+(v / 1000).toFixed(2), 7.77, 1e-9, 'v in km/s');
  close(+(M.period(r, v) / 3600).toFixed(2), 1.47, 1e-9, 'T in h');
  close(M.centripetal(v, r), 9.20, 1e-9, 'back to a');
});

test('Eqs. 4.5.3–4.5.6: v tangent with magnitude v, a toward the centre with magnitude v²/r, always perpendicular', () => {
  for (const [r, v] of [[20, 10], [10, 14], [40, 4]]) for (const dir of [1, -1]) {
    for (let k = 0; k < 24; k++) {
      const phi = k * Math.PI / 12, s = M.circular(r, v, phi, dir);
      close(Math.hypot(...s.position), r, 1e-9, 'on the circle');
      close(Math.hypot(...s.velocity), v, 1e-9, '|v|');
      close(Math.hypot(...s.acceleration), v * v / r, 1e-9, '|a|');
      close(dot(s.velocity, s.position), 0, 1e-9, 'v ⊥ r');
      close(dot(s.velocity, s.acceleration), 0, 1e-9, 'v ⊥ a');
      // a = −(v²/r²) r: toward the centre.
      s.acceleration.forEach((c, i) => close(c, -(v * v / (r * r)) * s.position[i], 1e-9, 'a ∥ −r'));
      // Textbook components with textbook y = scene −z (counterclockwise case).
      if (dir === 1) {
        close(s.velocity[0], -v * Math.sin(phi), 1e-9, 'vx'); close(-s.velocity[2], v * Math.cos(phi), 1e-9, 'vy');
        close(s.acceleration[0], -(v * v / r) * Math.cos(phi), 1e-9, 'ax'); close(-s.acceleration[2], -(v * v / r) * Math.sin(phi), 1e-9, 'ay');
      }
    }
  }
});

test('velocity is the time derivative of position (counterclockwise seen from +y)', () => {
  const r = 20, v = 10, w = v / r, h = 1e-6;
  for (const t of [0, 1.3, 7]) {
    const p1 = M.circular(r, v, w * (t - h)).position, p2 = M.circular(r, v, w * (t + h)).position;
    M.circular(r, v, w * t).velocity.forEach((c, i) => close(c, (p2[i] - p1[i]) / (2 * h), 1e-5, 'dr/dt'));
  }
  const s = M.circular(r, v, 0, 1);
  assert.ok(s.velocity[2] < 0, 'at +x the car moves toward −z, counterclockwise seen from above');
});

test('observe: one period brings the car back, the angle between v and a is 90°', () => {
  const T = M.period(defaults.r, defaults.v);
  close(T, 2 * Math.PI * 2, 1e-12, 'T = 2π(20)/10');
  const a = M.observe(M.at(0), defaults), b = M.observe(M.at(T), defaults);
  a.position.forEach((c, i) => close(c, b.position[i], 1e-9, 'periodic'));
  close(a.angle, 90, 1e-9, 'angle');
  close(a.a, 5, 1e-12, 'a = 10²/20');
  close(M.duration(defaults), 2 * T, 1e-12, 'two laps');
});

test('direction questions: answers are forward for v and inward for a, numbers differ', () => {
  for (let i = 0; i < M.DCOUNT; i++) {
    const q = M.dirQuestion(i);
    const v = M.checkDirection(q, 'v', '0').answer, a = M.checkDirection(q, 'a', '0').answer;
    assert.notEqual(v, a, `q${i}`);
    assert.equal(M.checkDirection(q, 'v', v).ok, true);
    assert.equal(M.checkDirection(q, 'a', a).ok, true);
    const vd = q.choices.v.find(c => c.no === v).dir, ad = q.choices.a.find(c => c.no === a).dir;
    close(M.angleBetween(vd, q.state.velocity), 0, 1e-4, 'v answer is the velocity');   // acos near 1 loses digits
    close(M.angleBetween(ad, q.state.acceleration), 0, 1e-4, 'a answer is the acceleration');
    for (const kind of ['v', 'a']) for (const c of q.choices[kind]) if (c.no !== (kind === 'v' ? v : a)) assert.equal(M.checkDirection(q, kind, c.no).reason, c.key);
  }
  assert.equal(M.checkDirection(M.dirQuestion(0), 'v', '').reason, 'none');
});

test('size questions: values and ratios from Eqs. 4.5.1 and 4.5.2', () => {
  const q0 = M.sizeQuestion(0);
  close(q0.answer, 5, 1e-12, 'a = 100/20');
  assert.equal(M.checkSize(q0, '5').ok, true);
  assert.equal(M.checkSize(q0, '5.05').ok, true);
  assert.equal(M.checkSize(q0, '0.5').reason, 'nosquare');            // v/r instead of v²/r
  assert.equal(M.checkSize(q0, 'abc').reason, 'unreadable');
  const q1 = M.sizeQuestion(1);
  close(q1.answer, 4, 1e-12, 'v doubled');
  assert.equal(M.checkSize(q1, '4').ok, true);
  assert.equal(M.checkSize(q1, '2').reason, 'linear');
  assert.equal(M.checkSize(q1, '0.25').reason, 'inverse');
  close(M.sizeQuestion(2).answer, 2 * Math.PI * 12 / 6, 1e-12, 'T = 2πr/v');
  close(M.sizeQuestion(3).answer, 0.5, 1e-12, 'r doubled at the same v');
  assert.equal(M.checkSize(M.sizeQuestion(3), '2').reason, 'inverse');
  const q4 = M.sizeQuestion(4);
  close(q4.answer, 4 * Math.PI ** 2 * 30 / 400, 1e-12, 'a = 4π²r/T²');
  close(q4.answer, 2.96, 0.005, 'about 2.96 m/s²');
  close(M.sizeQuestion(5).answer, 2, 1e-12, 'r doubled at the same T');
  for (let i = 0; i < M.SCOUNT; i++) {
    const q = M.sizeQuestion(i);
    assert.equal(M.checkSize(q, String(q.answer)).ok, true, `q${i} own answer`);
    if (q.type === 'ratio') assert.ok(M.RATIOS.includes(q.answer), `q${i} ratio is a choice`);
  }
});

test('no NaN over the control ranges', () => {
  for (const r of [10, 25, 40]) for (const v of [4, 9, 14]) {
    const p = { ...defaults, r, v };
    for (const f of [0, 0.3, 1]) {
      const o = M.observe(M.at(M.duration(p) * f), p);
      for (const x of [...o.position, ...o.velocity, ...o.acceleration, o.angle, o.T]) assert.ok(Number.isFinite(x));
    }
  }
});
