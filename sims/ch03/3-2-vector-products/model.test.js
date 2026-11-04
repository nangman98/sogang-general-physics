// node --test sims/ch03/3-2-vector-products/model.test.js
// Sample Problem answers are from the textbook (Principles of Physics 12e, c03 pp. 55–56).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const near = (a, b, abs) => assert.ok(Math.abs(a - b) <= abs, `${a} vs ${b} (±${abs})`);
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));
const at = (o, extra) => ({ ...defaults, ...extra });

test('Sample Problem 3.3.1: angle between a = 3.0i − 4.0j and b = −2.0i + 3.0k', () => {
  const a = [3, -4, 0], b = [-2, 0, 3];
  near(M.norm(a), 5.00, 0.005);                       // Eq. 3.3.10
  near(M.norm(b), 3.61, 0.005);                       // Eq. 3.3.11
  close(M.dot(a, b), -6.0);                           // Eq. 3.3.4
  near(M.angleBetween(a, b), 109, 0.5);               // ϕ = 109° ≈ 110°
  near(Math.acos(-6.0 / (5.00 * 3.61)) / M.DEG, 109, 0.5);   // the textbook route through Eq. 3.3.9
});

test('Sample Problem 3.3.2: a = 18 units at 250° in the xy plane, b = 12 units along +z', () => {
  const a = [18 * Math.cos(250 * M.DEG), 18 * Math.sin(250 * M.DEG), 0], b = [0, 0, 12];
  const c = M.cross(a, b);
  near(M.norm(c), 216, 1e-9);                         // c = ab sin 90° = 216
  close(M.norm(c), M.norm(a) * M.norm(b) * Math.sin(M.angleBetween(a, b) * M.DEG));   // Eq. 3.3.5
  near(c[2], 0, 1e-9);                                // c lies in the xy plane
  near(Math.atan2(c[1], c[0]) / M.DEG, 160, 1e-9);    // 250° − 90° = 160° from +x
});

test('Sample Problem 3.3.3: c = a × b = −12i − 9j − 8k', () => {
  const a = [3, -4, 0], b = [-2, 0, 3];
  assert.deepEqual(M.clean(M.cross(a, b)), [-12, -9, -8]);
  close(M.dot(M.cross(a, b), a), 0); close(M.dot(M.cross(a, b), b), 0);   // perpendicular to both
});

test('unit vectors: i × j = k, j × k = i, k × i = j, i × i = 0, right-handed', () => {
  const i = [1, 0, 0], j = [0, 1, 0], k = [0, 0, 1];
  assert.deepEqual(M.clean(M.cross(i, j)), k);
  assert.deepEqual(M.clean(M.cross(j, k)), i);
  assert.deepEqual(M.clean(M.cross(k, i)), j);
  assert.deepEqual(M.clean(M.cross(i, i)), [0, 0, 0]);
  assert.deepEqual(M.clean(M.cross(j, i)), [0, 0, -1]);
});

test('Eqs. 3.3.1–3.3.6 agree for many pairs', () => {
  const pairs = [[[3, 1, 0], [1, 2, 2]], [[-2.5, 1, 3], [0.5, -3, 1]], [[1, 0, 0], [-1, 0.0001, 0]], [[2, 2, 2], [1, 1, 1]]];
  for (const [a, b] of pairs) {
    const f = M.angleBetween(a, b) * M.DEG, A = M.norm(a), B = M.norm(b);
    close(M.dot(a, b), A * B * Math.cos(f), 1e-9);                         // (3.3.1) = (3.3.4)
    close(M.dot(a, b), (A * Math.cos(f)) * B, 1e-9);                       // (3.3.2)
    close(M.dot(a, b), M.dot(b, a));                                        // commutative
    close(M.norm(M.cross(a, b)), A * B * Math.sin(f), 1e-9);              // (3.3.5)
    M.cross(b, a).forEach((x, i) => close(x, -M.cross(a, b)[i]));          // (3.3.6)
    assert.ok(M.angleBetween(a, b) >= 0 && M.angleBetween(a, b) <= 180);
  }
  assert.ok(M.parallel([2, 2, 2], [1, 1, 1]));
  assert.ok(Number.isNaN(M.angleBetween([0, 0, 0], [1, 0, 0])));
});

test('component of one vector along the other, b cos ϕ', () => {
  const a = [3, 1, 0], b = [1, 2, 2], r = M.along(a, b);
  close(r.comp, M.norm(b) * Math.cos(M.angleBetween(a, b) * M.DEG));
  close(M.dot(M.sub(b, r.foot), a), 0, 1e-12);                              // the dropped line is perpendicular to a
  const neg = M.along([1, 0, 0], [-2, 1, 0]);
  close(neg.comp, -2); [-2, 0, 0].forEach((x, i) => close(neg.foot[i], x));
});

test('right-hand rule prediction: one candidate is a × b, the place varies, parallel gives zero', () => {
  const cs = M.crossChoices(defaults);
  assert.equal(cs.list.length, 3);
  const right = cs.list.find(x => x.kind === 'right');
  right.v.forEach((x, i) => close(x, M.unit(M.cross(M.vectorA(defaults), M.vectorB(defaults)))[i]));
  assert.equal(M.checkCross(defaults, cs.answer).ok, true);
  assert.equal(M.checkCross(defaults, cs.list.find(x => x.kind === 'opposite').label).reason, 'opposite');
  assert.equal(M.checkCross(defaults, '3').reason, 'inPlane');
  assert.equal(M.checkCross(defaults, '4').reason, 'zero');
  assert.equal(M.checkCross(defaults, '').reason, 'none');
  const swapped = { ...defaults, ax: defaults.bx, ay: defaults.by, az: defaults.bz, bx: defaults.ax, by: defaults.ay, bz: defaults.az };
  assert.notEqual(M.crossChoices(swapped).answer, cs.answer);              // b × a points the other way
  const par = { ...defaults, bx: 1.5, by: 0.5, bz: 0 };                    // b = a / 2
  assert.equal(M.crossChoices(par).parallel, true);
  assert.equal(M.checkCross(par, '4').ok, true);
  assert.equal(M.checkCross(par, '1').reason, 'parallel');
});

test('practice: unit-vector cross products by the right-hand rule', () => {
  const dirs = [0, 4, 7, 10].map(i => M.question(i).dir);
  assert.deepEqual(dirs, ['-z', '+y', '0', '-x']);       // 2j × 3i, 3k × 2i, 2i × (−3i), 4j × (−2k)
  const q = M.question(0);
  assert.equal(M.checkUnit(q, '-z').ok, true);
  assert.equal(M.checkUnit(q, '+z').reason, 'opposite');
  assert.equal(M.checkUnit(q, '+x').reason, 'axis');
  assert.equal(M.checkUnit(q, '0').reason, 'zero');
  assert.equal(M.checkUnit(M.question(7), '+z').reason, 'parallel');
  assert.equal(M.checkUnit(q, '').reason, 'none');
});

test('practice: dot product and angle, cross product by components, sign, scalar times vector', () => {
  const d = M.question(1);                               // (2, 1, −2) · (1, 3, 2)
  assert.equal(d.d, 1); near(d.phi, 84.9, 0.05);
  assert.equal(M.checkDot(d, ['1', '84.9']).ok, true);
  assert.equal(M.checkDot(d, ['1', '95.1']).reason, 'supplement');
  assert.equal(M.checkDot(d, ['7', '84.9']).reason, 'dot');
  const d2 = M.question(6);
  assert.equal(d2.d, -10); near(d2.phi, 143.9, 0.05);
  const c = M.question(2);
  assert.deepEqual(c.c, [1, -2, 6]);
  assert.equal(M.checkCrossComponents(c, ['1', '−2', '6']).ok, true);
  assert.equal(M.checkCrossComponents(c, ['-1', '2', '-6']).reason, 'reversed');
  assert.equal(M.checkCrossComponents(c, ['1', '2', '6']).reason, 'value');
  const c2 = M.question(8);
  assert.deepEqual(c2.c, [2, 7, 4]);
  close(M.dot(c2.c, c2.a), 0); close(M.dot(c2.c, c2.b), 0);
  const s = M.question(3);
  assert.equal(s.sign, '0');                             // perpendicular in 3D
  assert.equal(M.checkSign(s, '0').ok, true); assert.equal(M.checkSign(s, '+').reason, 'sign');
  assert.equal(M.question(9).sign, '-');
  const k = M.question(5);                               // −2 (1.5i − j + 2k)
  assert.deepEqual(k.sv, [-3, 2, -4]); near(k.mag, Math.sqrt(29), 1e-12);
  assert.equal(M.checkScalar(k, 'opposite', '5.39').ok, true);
  assert.equal(M.checkScalar(k, 'same', '5.39').reason, 'direction');
  assert.equal(M.checkScalar(k, 'opposite', '2.69').reason, 'noScale');
});

test('observe: default pair a = (3, 1, 0), b = (1, 2.5, −1.5)', () => {
  const o = M.observe(M.init(defaults), defaults);
  assert.equal(o.dot, 5.5); assert.deepEqual(o.c, [-1.5, 4.5, 6.5]);       // 3 + 2.5 + 0, (1·(−1.5) − 2.5·0, 0·1 − (−1.5)·3, 3·2.5 − 1·1)
  near(o.phi, 55.65, 0.01); close(o.cMag, o.aMag * o.bMag * Math.sin(o.phi * M.DEG));
  close(o.bAlongA, 5.5 / Math.sqrt(10)); close(o.aAlongB, 5.5 / Math.sqrt(9.5));
  assert.equal(at(o, { activity: 'practice' }).activity, 'practice');
});
