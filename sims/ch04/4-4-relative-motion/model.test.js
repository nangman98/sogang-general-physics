// node --test sims/ch04/4-4-relative-motion/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b}`);
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));

test('Sample Problem 4.6.1: v_BA = 52 km/h, v_PA = −78 km/h gives v_PB = −130 km/h, and a_PA = a_PB = 2.2 m/s²', () => {
  const [vPB] = M.relative([-78], [52]);                       // Eq. (4.6.2)
  close(vPB, -130, 1e-12, 'v_PB');
  close(M.add([vPB], [52])[0], -78, 1e-12, 'back to v_PA');
  // Braking to rest relative to A in 10 s: v_PA from −78 to 0, v_PB from −130 to −52 km/h (Eq. 2.4.1 per frame).
  const kmh = 1 / 3.6, [vPBend] = M.relative([0], [52]);
  close(vPBend, -52, 1e-12, 'v_PB at rest');
  const aPA = (0 - -78) * kmh / 10, aPB = (vPBend - vPB) * kmh / 10;
  close(+aPA.toFixed(1), 2.2, 1e-12, 'a_PA'); close(+aPB.toFixed(1), 2.2, 1e-12, 'a_PB');
  close(aPA, aPB, 1e-12, 'Eq. (4.6.3) a_PA = a_PB');
});

test('Sample Problem 4.7.1: 215 km/h against a 65.0 km/h wind 20.0° east of north gives θ = 16.5°, v_PG = 228 km/h', () => {
  const w = 65.0, phi = 20.0 * Math.PI / 180;
  const r = M.aimAngle(215, w * Math.cos(phi), w * Math.sin(phi));   // y components cancel, x components add
  close(+r.theta.toFixed(1), 16.5, 1e-12, 'θ');
  close(Math.round(r.speedAlong), 228, 0, 'v_PG');
});

test('Eq. 4.7.2 on the river: v_PA = v_PB + v_BA, and the crossing time does not depend on the current', () => {
  for (const theta of [-45, -10, 0, 25, 60]) for (const w of [0, 1.3, 3]) {
    const p = { u: 3.4, w, theta }, v = M.velocities(p);
    v.vPA.forEach((c, i) => close(c, v.vPB[i] + v.vBA[i], 1e-12, 'sum'));
    close(Math.hypot(...v.vPB), 3.4, 1e-12, '|v_PB| = u');
    close(M.crossingTime(p), M.crossingTime({ ...p, w: 0 }), 1e-12, 'current-free crossing time');
    close(M.crossingTime(p), M.D / (3.4 * Math.cos(theta * Math.PI / 180)), 1e-12, 't = D/(u cos θ)');
  }
});

test('Eq. 4.7.1: r_PA = r_PB + r_BA at every time, and the boat reaches the far bank z = −D at the landing point', () => {
  const p = { u: 3, w: 1.5, theta: 20 }, T = M.crossingTime(p);
  for (const f of [0, 0.25, 0.6, 1, 1.4]) {
    const r = M.positions(p, T * f);
    r.rPA.forEach((c, i) => close(c, r.rPB[i] + r.rBA[i], 1e-12, 'sum'));
  }
  const end = M.positions(p, T);
  close(end.rPA[2], -M.D, 1e-9, 'far bank'); close(end.rPA[0], M.landingX(p), 1e-9, 'landing x');
  close(M.positions(p, 2 * T).rPA[2], -M.D, 1e-9, 'clamped after landing');
});

test('aiming: sin θ = v_BA / v_PB lands directly opposite, too slow a boat cannot', () => {
  const a = M.aimAngle(4, 2);
  close(a.theta, 30, 1e-12, 'θ');
  close(M.landingX({ u: 4, w: 2, theta: a.theta }), 0, 1e-9, 'x = 0');
  assert.equal(M.aimAngle(2, 2.5), null);
});

test('landing questions and grading reasons', () => {
  const q0 = M.landQuestion(0);
  close(q0.t, 8, 1e-12, 't'); close(q0.x, 12, 1e-12, 'x');
  assert.equal(M.checkLanding(q0, '8', '12').ok, true);
  assert.equal(M.checkLanding(q0, '8.1', '12.3').ok, true);
  const q1 = M.landQuestion(1);
  close(q1.x, 0, 1e-9, '30° upstream at 4 m/s cancels 2 m/s');
  assert.equal(M.checkLanding(q1, String(q1.t), '0').ok, true);
  assert.equal(M.checkLanding(q1, '6', '0').tWhy, 'nocos');                    // D/u ignores cos θ
  const q2 = M.landQuestion(2);
  assert.equal(M.checkLanding(q2, String(q2.t), String(-q2.x)).xWhy, 'sign');
  assert.equal(M.checkLanding(q2, String(q2.t), String(q2.w * q2.t)).xWhy, 'noheading');
  const vPA = M.velocities(q0).vPA;
  assert.equal(M.checkLanding(q0, String(M.D / Math.hypot(vPA[0], vPA[2])), '12').tWhy, 'resultant');
  assert.equal(M.checkLanding(q0, 'x', '12').reason, 'unreadable');
  const q3 = M.landQuestion(3);
  assert.ok(q3.x < 0, 'lands upstream');
  for (let i = 0; i < M.LCOUNT; i++) {
    const q = M.landQuestion(i);
    assert.ok(q.theta >= M.THETA[0] && q.theta <= M.THETA[1]);
    assert.equal(M.checkLanding(q, String(q.t), String(q.x)).ok, true);
  }
});

test('aim questions and grading reasons', () => {
  const q0 = M.aimQuestion(0);
  close(q0.theta, 30, 1e-12, 'θ'); close(q0.t, M.D / (4 * Math.cos(Math.PI / 6)), 1e-12, 't');
  assert.equal(M.checkAim(q0, '30', false).ok, true);
  assert.equal(M.checkAim(q0, '-30', false).reason, 'downstream');
  assert.equal(M.checkAim(q0, String(Math.atan(0.5) * 180 / Math.PI), false).reason, 'tan');
  assert.equal(M.checkAim(q0, '', true).reason, 'possible');
  const q3 = M.aimQuestion(3);
  assert.equal(q3.possible, false);
  assert.equal(M.checkAim(q3, '', true).ok, true);
  assert.equal(M.checkAim(q3, '40', false).reason, 'impossible');
  for (let i = 0; i < M.ACOUNT; i++) {
    const q = M.aimQuestion(i);
    if (q.possible) assert.ok(q.theta >= M.THETA[0] && q.theta <= M.THETA[1]);
  }
});

test('defaults and no NaN over the control ranges', () => {
  const o = M.observe(M.at(0), defaults);
  close(o.tc, 8, 1e-12, 't'); close(o.xLand, 12, 1e-12, 'x');
  for (const u of [2, 4, 6]) for (const w of [0, 1.5, 3]) for (const theta of [-45, 0, 60]) {
    const p = { ...defaults, u, w, theta };
    for (const f of [0, 0.5, 1]) {
      const s = M.observe(M.at(M.duration(p) * f), p);
      for (const x of [...s.vPA, ...s.rPA, ...s.rPB, s.tc, s.xLand]) assert.ok(Number.isFinite(x));
    }
  }
});
