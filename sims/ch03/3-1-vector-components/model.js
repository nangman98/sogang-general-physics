// 3.1–3.2 Vectors and Their Components, Unit Vectors, Adding Vectors by Components — pure model (no DOM).
// Activities.
// components: one vector a = ax i + ay j + az k with its vector components, the angle θ of its xy part (Eqs. 3.1.5, 3.1.6, 3.2.1),
//   and the same vector on axes rotated by ϕ about z (Eqs. 3.2.8, 3.2.9).
// add: a and b placed head to tail, s = a + b (Eq. 3.1.1), a drone flying the two displacements, b + a (Eq. 3.1.2), a − b (Eq. 3.1.4).
// practice: graded questions on components, magnitude and angle, and sums and differences by components (Eqs. 3.1.5–3.2.7).
// Angles follow the textbook: measured from the positive x direction, counterclockwise positive (Module 3.1, Tactic 1).
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const DEG = Math.PI / 180;

// ---------- vector algebra (3-component arrays) ----------
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const sub = (a, b) => a.map((v, i) => v - b[i]);
export const scale = (a, s) => a.map(v => v * s);
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = a => Math.hypot(a[0], a[1], a[2]);
export const sum = list => list.reduce((r, v) => add(r, v), [0, 0, 0]);

// Angle of (x, y) from +x, counterclockwise positive, in degrees on (−180°, 180°]. NaN for the zero vector.
export function angleOf(x, y) {
  if (Math.abs(x) < 1e-12 && Math.abs(y) < 1e-12) return NaN;
  const t = Math.atan2(y, x) / DEG;
  return t <= -180 + 1e-12 ? 180 : t;
}
// What a calculator gives for tan⁻¹(ay/ax): only −90° to 90° (Module 3.1, Tactic 3).
export function calculatorAngle(x, y) {
  if (Math.abs(x) < 1e-12) return y > 0 ? 90 : y < 0 ? -90 : NaN;
  return Math.atan(y / x) / DEG;
}
// Two angles are the same direction when they differ by a whole number of turns (210° and −150°).
export function sameAngle(t1, t2, tol = 1) {
  const d = ((t1 - t2) % 360 + 540) % 360 - 180;
  return Math.abs(d) <= tol;
}
// Eq. (3.1.5): components of a vector in the xy plane given in magnitude-angle notation.
export const fromMagAngle = (a, thetaDeg) => [a * Math.cos(thetaDeg * DEG), a * Math.sin(thetaDeg * DEG), 0];
// Components on axes x′, y′ rotated by ϕ about z (Fig. 3.2.3). θ′ = θ − ϕ (Eq. 3.2.9), the vector itself is unchanged.
export function rotateAxes(v, phiDeg) {
  const c = Math.cos(phiDeg * DEG), s = Math.sin(phiDeg * DEG);
  return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]];
}
export const clean = v => v.map(x => (Math.abs(x) < 1e-12 ? 0 : x));

// ---------- controls ----------
const comp = p => p.activity === 'components';
const addOnly = p => p.activity === 'add';
const vecA = p => p.activity !== 'practice';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'components', options: [
    { value: 'components', label: '성분 분해' }, { value: 'add', label: '벡터 덧셈' }, { value: 'practice', label: '성분 계산' }] },
  { id: 'ax', label: '<span class="vsym">a</span> x 성분 (x component)', sym: '<i>a<sub>x</sub></i>', unit: 'm', min: -3, max: 3, step: 0.5, value: 2.5, showIf: vecA },
  { id: 'ay', label: '<span class="vsym">a</span> y 성분 (y component)', sym: '<i>a<sub>y</sub></i>', unit: 'm', min: -3, max: 3, step: 0.5, value: 1.5, showIf: vecA },
  { id: 'az', label: '<span class="vsym">a</span> z 성분 (z component)', sym: '<i>a<sub>z</sub></i>', unit: 'm', min: -3, max: 3, step: 0.5, value: 2, showIf: vecA },
  { id: 'phi', label: '좌표축 회전 (rotate the axes)', sym: '<i>ϕ</i>', unit: '°', min: 0, max: 90, step: 5, value: 0, showIf: comp },
  { id: 'bx', label: '<span class="vsym">b</span> x 성분 (x component)', sym: '<i>b<sub>x</sub></i>', unit: 'm', min: -3, max: 3, step: 0.5, value: -1, showIf: addOnly },
  { id: 'by', label: '<span class="vsym">b</span> y 성분 (y component)', sym: '<i>b<sub>y</sub></i>', unit: 'm', min: -3, max: 3, step: 0.5, value: 2.5, showIf: addOnly },
  { id: 'bz', label: '<span class="vsym">b</span> z 성분 (z component)', sym: '<i>b<sub>z</sub></i>', unit: 'm', min: -3, max: 3, step: 0.5, value: 1, showIf: addOnly },
  { id: 'commute', type: 'check', label: '순서 바꿔 더하기 (commutative law)', value: false, showIf: addOnly },
  { id: 'diff', type: 'check', label: '뺄셈 보기 (vector subtraction)', value: false, showIf: addOnly },
];
export const vectorA = p => [p.ax, p.ay, p.az];
export const vectorB = p => [p.bx, p.by, p.bz];

// ---------- head-to-tail prediction (add) ----------
// Three candidate arrows from the origin: the sum and two common mistakes (a − b, and b − a, the arrow joining the two heads
// when a and b are drawn tail to tail). The order of ①②③ depends on the vectors so the answer is not always the same place.
export function candidates(p) {
  const a = vectorA(p), b = vectorB(p);
  const list = [{ kind: 'sum', v: add(a, b) }, { kind: 'aminusb', v: sub(a, b) }, { kind: 'bminusa', v: sub(b, a) }];
  const key = Math.round(2 * (7 * a[0] + 3 * a[1] + 5 * a[2] + 2 * b[0] + 11 * b[1] + 13 * b[2]));
  const r = ((key % 3) + 3) % 3;
  return [...list.slice(r), ...list.slice(0, r)].map((c, i) => ({ ...c, label: String(i + 1) }));
}
// choice is the label '1', '2' or '3'. Degenerate cases (b = 0, or a = 0 and b − a = sum) count every equal arrow as right.
export function checkSum(p, choice) {
  const cs = candidates(p), picked = cs.find(c => c.label === choice);
  if (!picked) return { ok: false, reason: 'none' };
  const s = add(vectorA(p), vectorB(p));
  const ok = norm(sub(picked.v, s)) < 1e-9;
  return { ok, reason: ok ? null : picked.kind, answer: cs.find(c => c.kind === 'sum').label };
}

// ---------- drone flight (add) ----------
// The drone flies a, then b. While it flies a it carries the tail of b, so b ends head to tail (Fig. 3.1.2).
export const T_A = 1.6, T_B = 3.2, T_S = 3.8;   // s: end of a, end of b, end of drawing s
const ease = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
export function flight(p, t) {
  const a = vectorA(p), b = vectorB(p);
  const ua = ease(t / T_A), ub = ease((t - T_A) / (T_B - T_A)), us = ease((t - T_B) / (T_S - T_B));
  const drone = add(scale(a, ua), scale(b, ub));
  return { drone, bTail: scale(a, ua), sGrow: us, done: t >= T_S - 1e-9 };
}

// ---------- practice questions ----------
// Numbers are chosen for this screen, not taken from the textbook. Types:
// comp: a and θ given (xy plane), find the signs and values of ax, ay (Eq. 3.1.5, LO 3.1.3)
// angle: ax, ay given, find a and θ (Eq. 3.1.6, LO 3.1.4). Two of them make a calculator tan⁻¹ give the wrong quadrant.
// sum, diff: a and b in unit-vector notation, find r = a + b or d = a − b by components (Eqs. 3.2.4–3.2.7, LO 3.2.2)
// mag: three components given, find the magnitude (Pythagorean theorem twice, as in Sample Problem 3.1.1)
const QLIST = [
  { type: 'comp', mag: 5, theta: 130 },
  { type: 'angle', v: [-3, 2, 0] },
  { type: 'sum', a: [2, -1, 1.5], b: [-3, 2.5, 1] },
  { type: 'comp', mag: 4, theta: -60 },
  { type: 'mag', v: [2, -3, 1.5] },
  { type: 'angle', v: [-1.5, -3, 0] },
  { type: 'diff', a: [1.5, 3, -2], b: [2, -1, 1.5] },
  { type: 'comp', mag: 3, theta: 215 },
  { type: 'angle', v: [2.5, -2.5, 0] },
];
export const QCOUNT = QLIST.length;
export function question(index) {
  const q = QLIST[((index % QLIST.length) + QLIST.length) % QLIST.length];
  if (q.type === 'comp') return { ...q, index, v: clean(fromMagAngle(q.mag, q.theta)) };
  if (q.type === 'angle') return { ...q, index, mag: Math.hypot(q.v[0], q.v[1]), theta: angleOf(q.v[0], q.v[1]), calc: calculatorAngle(q.v[0], q.v[1]) };
  if (q.type === 'sum') return { ...q, index, r: add(q.a, q.b) };
  if (q.type === 'diff') return { ...q, index, r: sub(q.a, q.b) };
  return { ...q, index, mag: norm(q.v), magXY: Math.hypot(q.v[0], q.v[1]) };
}

const close = (x, target, rel = 0.01, abs = 0.03) => Math.abs(x - target) <= Math.max(abs, rel * Math.abs(target));
const signOf = x => (Math.abs(x) < 1e-9 ? '0' : x > 0 ? '+' : '-');
const num = text => parseNumber(text);

// comp: signs is [sx, sy] each '+', '0', '-' (or ''), texts [ax, ay].
export function checkComp(q, signs, texts) {
  const want = q.v.slice(0, 2), got = texts.map(num);
  const signOk = signs.map((s, i) => s === signOf(want[i]));
  if (got.some(x => !Number.isFinite(x))) return { ok: false, signOk, valueOk: [false, false], reason: 'unreadable' };
  const valueOk = got.map((x, i) => close(x, want[i]));
  let reason = null;
  if (!valueOk.every(Boolean)) {
    if (close(got[0], want[1]) && close(got[1], want[0])) reason = 'swap';
    else if (got.every((x, i) => close(Math.abs(x), Math.abs(want[i])))) reason = 'sign';
    else reason = 'value';
  } else if (!signOk.every(Boolean)) reason = 'signChoice';
  return { ok: reason === null, signOk, valueOk, reason };
}

// angle: texts [a, θ in degrees]. Any equal angle (θ + n·360°) is right.
export function checkAngle(q, texts) {
  const [a, t] = texts.map(num);
  if (!Number.isFinite(a) || !Number.isFinite(t)) return { ok: false, magOk: false, angleOk: false, reason: 'unreadable' };
  const magOk = close(a, q.mag), angleOk = sameAngle(t, q.theta, 1);
  let reason = null;
  if (!angleOk) reason = !sameAngle(q.calc, q.theta, 1) && sameAngle(t, q.calc, 1) ? 'calculator' : 'angle';
  else if (!magOk) reason = 'mag';
  return { ok: magOk && angleOk, magOk, angleOk, reason };
}

// sum, diff: texts [x, y, z].
export function checkComponents(q, texts) {
  const got = texts.map(num);
  if (got.some(x => !Number.isFinite(x))) return { ok: false, valueOk: [false, false, false], reason: 'unreadable' };
  const valueOk = got.map((x, i) => close(x, q.r[i]));
  const other = q.type === 'sum' ? sub(q.a, q.b) : add(q.a, q.b);
  let reason = null;
  if (!valueOk.every(Boolean)) reason = got.every((x, i) => close(x, other[i])) ? (q.type === 'sum' ? 'subtracted' : 'added') : 'value';
  return { ok: reason === null, valueOk, reason };
}

// mag: text a.
export function checkMag(q, text) {
  const a = num(text);
  if (!Number.isFinite(a)) return { ok: false, reason: 'unreadable' };
  if (close(a, q.mag)) return { ok: true, reason: null };
  return { ok: false, reason: close(a, q.magXY) ? 'noZ' : 'value' };
}

// ---------- model contract ----------
// Only the add activity runs in time (the drone). Rebuilding the scene starts again at t = 0 (no at()).
export const duration = () => T_S;
export const init = () => ({ t: 0 });
export const step = (s, dt) => ({ t: Math.min(s.t + dt, T_S) });
export function observe(s, p) {
  const o = { activity: p.activity, t: s.t };
  if (p.activity === 'practice') return o;
  const a = vectorA(p);
  o.a = a; o.mag = norm(a); o.theta = angleOf(a[0], a[1]); o.calc = calculatorAngle(a[0], a[1]);
  if (p.activity === 'components') { o.aPrime = clean(rotateAxes(a, p.phi)); o.thetaPrime = o.theta - p.phi; return o; }
  const b = vectorB(p);
  Object.assign(o, { b, s: add(a, b), d: sub(a, b), ...flight(p, s.t) });
  return o;
}
