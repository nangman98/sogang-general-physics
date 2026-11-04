// node --test sims/ch03/3-1-vector-components/model.test.js
// Sample Problem answers are from the textbook (Principles of Physics 12e, c03 pp. 45, 49–50).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const near = (a, b, abs) => assert.ok(Math.abs(a - b) <= abs, `${a} vs ${b} (±${abs})`);
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));

test('Sample Problem 3.1.1: cave displacement 2.6 km west, 3.9 km south, 0.025 km up', () => {
  const d = [-2.6, -3.9, 0.025];                       // +x east, +y north, +z up (km)
  const dh = Math.hypot(d[0], d[1]);
  near(dh, 4.69, 0.005);                               // d_h = 4.69 km
  near(Math.atan(3.9 / 2.6) / M.DEG, 56, 0.5);         // θ_h = 56°
  assert.ok(M.sameAngle(M.angleOf(d[0], d[1]), 180 + 56.31, 0.01));   // 56° south of west, measured from +x
  near(M.norm(d), 4.69, 0.005);                        // d = 4.69 km ≈ 4.7 km
  near(+M.norm(d).toFixed(1), 4.7, 1e-12);
  near(Math.atan(0.025 / 4.69) / M.DEG, 0.3, 0.05);    // θ_v = 0.3°
});

test('Sample Problem 3.2.1: r = a + b + c by components', () => {
  const r = M.sum([[4.2, -1.5, 0], [-1.6, 2.9, 0], [0, -3.7, 0]]);
  near(r[0], 2.6, 1e-12); near(r[1], -2.3, 1e-12); near(r[2], 0, 1e-12);
  near(M.norm(r), 3.5, 0.05);                          // r ≈ 3.5 m
  assert.equal(Math.round(M.angleOf(r[0], r[1])), -41);   // θ = −41°, clockwise
});

test('Sample Problem 3.2.2: desert ant, five runs of 6.0 cm', () => {
  const runs = [0, 150, 180, -120, 90].map(t => M.fromMagAngle(6.0, t));
  const table = runs.map(v => [+v[0].toFixed(1), +v[1].toFixed(1)]);
  assert.deepEqual(table.map(r => r[0]), [6.0, -5.2, -6.0, -3.0, 0]);     // Table 3.2.1 dx (cm)
  assert.deepEqual(table.map(r => Math.abs(r[1]) < 1e-12 ? 0 : r[1]), [0, 3.0, 0, -5.2, 6.0]);   // dy (cm)
  const net = M.sum(runs);
  near(net[0], -8.2, 0.05); near(net[1], 3.8, 0.05);
  near(M.norm(net), 9.0, 0.05);                        // d_net = 9.0 cm
  near(M.calculatorAngle(-8.2, 3.8), -24.86, 0.005);   // calculator answer, fourth quadrant
  near(M.calculatorAngle(-8.2, 3.8) + 180, 155.14, 0.005);
  near(M.angleOf(net[0], net[1]), 155, 0.5);           // θ = 155°
  const home = M.scale(net, -1);
  near(M.norm(home), 9.0, 0.05); near(M.angleOf(home[0], home[1]), -25, 0.5);   // d_home = 9.0 cm at −25°
});

test('Eq. 3.1.5 and 3.1.6 are inverses, and the textbook angle convention holds', () => {
  for (const [a, t] of [[5, 130], [4, -60], [3, 215], [2, 0], [2, 90], [2, 180]]) {
    const v = M.fromMagAngle(a, t);
    close(Math.hypot(v[0], v[1]), a);
    assert.ok(M.sameAngle(M.angleOf(v[0], v[1]), t, 1e-9));
  }
  assert.ok(M.sameAngle(210, -150, 1e-9));             // 210° and −150° are the same angle
  close(M.angleOf(-1, 0), 180);                         // (−180°, 180°]
  close(40 * M.DEG, 0.698, 1e-3);                       // 40° = 0.70 rad
  assert.ok(Number.isNaN(M.angleOf(0, 0)));
});

test('Eqs. 3.2.8 and 3.2.9: rotating the axes changes the components, not the vector', () => {
  const a = [2.5, 1.5, 2];
  for (const phi of [0, 20, 45, 90]) {
    const p = M.rotateAxes(a, phi);
    close(Math.hypot(p[0], p[1]), Math.hypot(a[0], a[1]));
    close(p[2], a[2]);
    close(M.angleOf(a[0], a[1]), M.angleOf(p[0], p[1]) + phi);   // θ = θ′ + ϕ
  }
  const q = M.rotateAxes([1, 0, 0], 90);
  close(q[0], 0, 1e-12); close(q[1], -1);
});

test('three components: the magnitude is the Pythagorean theorem used twice', () => {
  const v = [2, -3, 1.5], h = Math.hypot(v[0], v[1]);
  close(M.norm(v), Math.hypot(h, v[2]));
  close(M.norm(v), Math.sqrt(15.25));
});

test('vector sum is commutative, and a − b = a + (−b)', () => {
  const a = M.vectorA(defaults), b = M.vectorB(defaults);
  assert.deepEqual(M.add(a, b), M.add(b, a));                     // Eq. 3.1.2
  assert.deepEqual(M.sub(a, b), M.add(a, M.scale(b, -1)));        // Eq. 3.1.4
});

test('head-to-tail prediction: one candidate is the sum, the place of the answer varies', () => {
  const cs = M.candidates(defaults);
  assert.deepEqual(cs.map(c => c.label), ['1', '2', '3']);
  assert.equal(cs.filter(c => c.kind === 'sum').length, 1);
  const right = cs.find(c => c.kind === 'sum').label;
  assert.equal(M.checkSum(defaults, right).ok, true);
  for (const c of cs.filter(c => c.kind !== 'sum')) assert.equal(M.checkSum(defaults, c.label).reason, c.kind);
  assert.equal(M.checkSum(defaults, '').reason, 'none');
  const places = new Set();
  for (const bx of [-3, -2.5, -2, -1.5, -1, -0.5, 0]) places.add(M.checkSum({ ...defaults, bx }, '1').ok);
  assert.equal(places.size, 2);                                    // sometimes ① is right, sometimes not
});

test('drone flight: a first, carrying the tail of b, then b', () => {
  const a = M.vectorA(defaults), b = M.vectorB(defaults);
  let f = M.flight(defaults, 0);
  assert.deepEqual(f.drone, [0, 0, 0]); assert.equal(f.sGrow, 0);
  f = M.flight(defaults, M.T_A);
  f.drone.forEach((x, i) => close(x, a[i])); f.bTail.forEach((x, i) => close(x, a[i]));
  f = M.flight(defaults, M.T_S);
  f.drone.forEach((x, i) => close(x, a[i] + b[i])); assert.equal(f.sGrow, 1); assert.equal(f.done, true);
  const s = M.step(M.init(defaults), 10);
  close(s.t, M.T_S);
});

test('practice: components from magnitude and angle, with sign and swap mistakes named', () => {
  const q = M.question(0);                                          // 5.00 m at 130°: ax = −3.21 m, ay = 3.83 m
  close(q.v[0], 5 * Math.cos(130 * M.DEG)); close(q.v[1], 5 * Math.sin(130 * M.DEG));
  assert.equal(M.checkComp(q, ['-', '+'], ['-3.21', '3.83']).ok, true);
  assert.equal(M.checkComp(q, ['-', '+'], ['−3.2', '3.8']).ok, true);        // two figures, U+2212 minus
  assert.equal(M.checkComp(q, ['+', '-'], ['3.83', '-3.21']).reason, 'swap'); // sin and cos exchanged
  assert.equal(M.checkComp(q, ['+', '+'], ['3.21', '3.83']).reason, 'sign');
  assert.equal(M.checkComp(q, ['+', '+'], ['-3.21', '3.83']).reason, 'signChoice');
  assert.equal(M.checkComp(q, ['-', '+'], ['-2.5', '3.83']).reason, 'value');
  assert.equal(M.checkComp(q, ['-', '+'], ['abc', '1']).reason, 'unreadable');
});

test('practice: magnitude and angle, a calculator tan⁻¹ in the wrong quadrant is named', () => {
  const q = M.question(1);                                          // ax = −3, ay = 2
  close(q.mag, Math.sqrt(13)); near(q.theta, 146.31, 0.01); near(q.calc, -33.69, 0.01);
  assert.equal(M.checkAngle(q, ['3.61', '146']).ok, true);
  assert.equal(M.checkAngle(q, ['3.61', '-214']).ok, true);         // the same angle
  assert.equal(M.checkAngle(q, ['3.61', '-33.7']).reason, 'calculator');
  assert.equal(M.checkAngle(q, ['3.61', '120']).reason, 'angle');
  assert.equal(M.checkAngle(q, ['5', '146.3']).reason, 'mag');
  const q4 = M.question(8);                                         // ax = 2.5, ay = −2.5: calculator is right here
  assert.equal(M.checkAngle(q4, ['3.54', '-45']).ok, true);
  assert.equal(M.checkAngle(q4, ['3.54', '315']).ok, true);
});

test('practice: sums and differences by components, the 3D magnitude', () => {
  const s = M.question(2);
  assert.deepEqual(s.r, [-1, 1.5, 2.5]);
  assert.equal(M.checkComponents(s, ['-1', '1.5', '2.5']).ok, true);
  assert.equal(M.checkComponents(s, ['5', '-3.5', '0.5']).reason, 'subtracted');
  const d = M.question(6);
  assert.deepEqual(d.r, [-0.5, 4, -3.5]);
  assert.equal(M.checkComponents(d, ['−0.5', '4', '−3.5']).ok, true);
  assert.equal(M.checkComponents(d, ['3.5', '2', '-0.5']).reason, 'added');
  const m = M.question(4);
  near(m.mag, 3.91, 0.005);
  assert.equal(M.checkMag(m, '3.91').ok, true);
  assert.equal(M.checkMag(m, '3.61').reason, 'noZ');
  assert.equal(M.checkMag(m, 'x').reason, 'unreadable');
  for (let i = 0; i < M.QCOUNT; i++) assert.ok(M.question(i).type);
});

test('observe: components activity and add activity', () => {
  const o = M.observe(M.init(defaults), defaults);
  close(o.mag, Math.sqrt(2.5 ** 2 + 1.5 ** 2 + 2 ** 2));
  near(o.theta, 30.96, 0.01);
  const o2 = M.observe({ t: M.T_S }, { ...defaults, activity: 'add' });
  assert.deepEqual(o2.s, [1.5, 4, 3]); assert.equal(o2.done, true);
});
