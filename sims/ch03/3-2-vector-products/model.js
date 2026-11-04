// 3.3 Multiplying Vectors — pure model (no DOM).
// Activities.
// dot: a · b = ab cos ϕ = ax bx + ay by + az bz (Eqs. 3.3.1, 3.3.2, 3.3.4) with the component of one vector along the other.
// cross: c = a × b, magnitude c = ab sin ϕ (Eq. 3.3.5), direction by the right-hand rule, b × a = −(a × b) (Eq. 3.3.6).
//   The student picks the direction of c before it is drawn.
// practice: graded questions on unit-vector cross products, dot products and angles, cross products by components (Eq. 3.3.8),
//   the sign of a dot product, and a scalar times a vector.
// Vectors are numbers without units, as in Sample Problems 3.3.1 and 3.3.3. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const DEG = Math.PI / 180;
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const sub = (a, b) => a.map((v, i) => v - b[i]);
export const scale = (a, s) => a.map(v => v * s);
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];          // Eq. (3.3.4)
export const norm = a => Math.hypot(a[0], a[1], a[2]);
// Eq. (3.3.8), term by term in the textbook order: (ay bz − by az) i + (az bx − bz ax) j + (ax by − bx ay) k.
export const cross = (a, b) => [a[1] * b[2] - b[1] * a[2], a[2] * b[0] - b[2] * a[0], a[0] * b[1] - b[0] * a[1]];
export const unit = a => { const n = norm(a); return n < 1e-12 ? null : scale(a, 1 / n); };
export const clean = v => v.map(x => (Math.abs(x) < 1e-12 ? 0 : x));

// Angle between two vectors, 0° to 180° (the smaller angle, as Eq. 3.3.5 needs). NaN if either is zero.
export function angleBetween(a, b) {
  if (norm(a) < 1e-12 || norm(b) < 1e-12) return NaN;
  return Math.atan2(norm(cross(a, b)), dot(a, b)) / DEG;
}
// Scalar component of b along the direction of a, b cos ϕ, and the foot of the perpendicular dropped from the head of b.
export function along(a, b) {
  const n = norm(a);
  if (n < 1e-12) return { comp: NaN, foot: [0, 0, 0] };
  return { comp: dot(a, b) / n, foot: scale(a, dot(a, b) / (n * n)) };
}
export const parallel = (a, b) => norm(cross(a, b)) <= 1e-9 * Math.max(1, norm(a) * norm(b));

// ---------- controls ----------
const notPractice = p => p.activity !== 'practice';
const sl = (id, value, show = notPractice) => ({ id, label: `<span class="vsym">${id[0]}</span> ${id[1]} 성분 (${id[1]} component)`, sym: `<i>${id[0]}<sub>${id[1]}</sub></i>`, unit: '', min: -3, max: 3, step: 0.5, value, showIf: show });
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'dot', options: [
    { value: 'dot', label: '내적' }, { value: 'cross', label: '외적' }, { value: 'practice', label: '곱 계산' }] },
  sl('ax', 3), sl('ay', 1), sl('az', 0),
  sl('bx', 1), sl('by', 2.5), sl('bz', -1.5),
  { id: 'proj', type: 'tabs', label: '성분 보기', value: 'b', showIf: p => p.activity === 'dot', options: [
    { value: 'b', label: '<i>b</i> cos <i>ϕ</i>' }, { value: 'a', label: '<i>a</i> cos <i>ϕ</i>' }] },
  { id: 'reverse', type: 'check', label: '순서 바꾼 곱 b × a 보기', value: false, showIf: p => p.activity === 'cross' },
];
export const vectorA = p => [p.ax, p.ay, p.az];
export const vectorB = p => [p.bx, p.by, p.bz];

// ---------- right-hand rule prediction (cross) ----------
// ① and ② lie along the two normals of the plane of a and b, ③ lies in that plane between a and b
// (the common mistake that a × b lies between the two vectors), ④ is "zero". ① is the normal pointing more upward
// (+y, then +z, then +x), so whether ① or ② is a × b depends on the vectors.
export function crossChoices(p) {
  const a = vectorA(p), b = vectorB(p), c = cross(a, b);
  if (parallel(a, b)) return { parallel: true, list: [], answer: '4' };
  const n = unit(c), m = scale(n, -1);
  const up = v => v[1] * 1e6 + v[2] * 1e3 + v[0];
  const [first, second] = up(n) >= up(m) ? [n, m] : [m, n];
  const ua = unit(a), ub = unit(b), mid = unit(add(ua, ub)) ?? unit(cross(n, ua));
  const list = [{ label: '1', v: first, kind: first === n ? 'right' : 'opposite' }, { label: '2', v: second, kind: second === n ? 'right' : 'opposite' }, { label: '3', v: mid, kind: 'inPlane' }];
  return { parallel: false, list, answer: list.find(x => x.kind === 'right').label };
}
export function checkCross(p, choice) {
  const cs = crossChoices(p);
  if (!['1', '2', '3', '4'].includes(choice)) return { ok: false, reason: 'none', answer: cs.answer };
  if (cs.parallel) return { ok: choice === '4', reason: choice === '4' ? null : 'parallel', answer: '4' };
  if (choice === '4') return { ok: false, reason: 'zero', answer: cs.answer };
  const kind = cs.list.find(x => x.label === choice).kind;
  return { ok: kind === 'right', reason: kind === 'right' ? null : kind, answer: cs.answer };
}

// ---------- practice questions ----------
// Numbers are chosen for this screen, not taken from the textbook.
const E = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
const QLIST = [
  { type: 'unit', a: scale(E.y, 2), b: scale(E.x, 3) },
  { type: 'dot', a: [2, 1, -2], b: [1, 3, 2] },
  { type: 'cross', a: [2, 1, 0], b: [0, 3, 1] },
  { type: 'sign', a: [2, 2, 0], b: [-1, 1, 3] },
  { type: 'unit', a: scale(E.z, 3), b: scale(E.x, 2) },
  { type: 'scalar', s: -2, v: [1.5, -1, 2] },
  { type: 'dot', a: [4, -1, 0], b: [-2, 2, 1] },
  { type: 'unit', a: scale(E.x, 2), b: scale(E.x, -3) },
  { type: 'cross', a: [1, -2, 3], b: [2, 0, -1] },
  { type: 'sign', a: [3, 0, 1], b: [-1, 2, 2] },
  { type: 'unit', a: scale(E.y, 4), b: scale(E.z, -2) },
];
export const QCOUNT = QLIST.length;
export const DIRS = ['+x', '-x', '+y', '-y', '+z', '-z', '0'];
export function direction(v) {
  if (norm(v) < 1e-9) return '0';
  const k = [0, 1, 2].reduce((m, i) => (Math.abs(v[i]) > Math.abs(v[m]) ? i : m), 0);
  return (v[k] > 0 ? '+' : '-') + 'xyz'[k];
}
const signOf = x => (Math.abs(x) < 1e-9 ? '0' : x > 0 ? '+' : '-');
export function question(index) {
  const q = QLIST[((index % QLIST.length) + QLIST.length) % QLIST.length];
  const out = { ...q, index };
  if (q.type === 'scalar') return { ...out, sv: scale(q.v, q.s), mag: Math.abs(q.s) * norm(q.v), same: q.s > 0 ? 'same' : 'opposite' };
  out.c = clean(cross(q.a, q.b)); out.d = dot(q.a, q.b); out.phi = angleBetween(q.a, q.b);
  if (q.type === 'unit') out.dir = direction(out.c);
  if (q.type === 'sign') out.sign = signOf(out.d);
  return out;
}

const close = (x, target, rel = 0.01, abs = 0.03) => Math.abs(x - target) <= Math.max(abs, rel * Math.abs(target));
const num = t => parseNumber(t);

// unit: choice is one of DIRS.
export function checkUnit(q, choice) {
  if (!DIRS.includes(choice)) return { ok: false, reason: 'none' };
  if (choice === q.dir) return { ok: true, reason: null };
  if (q.dir === '0') return { ok: false, reason: 'parallel' };
  if (choice === '0') return { ok: false, reason: 'zero' };
  if (choice[1] === q.dir[1]) return { ok: false, reason: 'opposite' };
  return { ok: false, reason: 'axis' };
}
// dot: texts [a · b, ϕ in degrees].
export function checkDot(q, texts) {
  const [d, f] = texts.map(num);
  if (!Number.isFinite(d) || !Number.isFinite(f)) return { ok: false, dotOk: false, angleOk: false, reason: 'unreadable' };
  const dotOk = close(d, q.d), angleOk = Math.abs(f - q.phi) <= 1;
  let reason = null;
  if (!dotOk) reason = 'dot';
  else if (!angleOk) reason = Math.abs(f - (180 - q.phi)) <= 1 ? 'supplement' : 'angle';
  return { ok: reason === null, dotOk, angleOk, reason };
}
// cross: texts [cx, cy, cz].
export function checkCrossComponents(q, texts) {
  const got = texts.map(num);
  if (got.some(x => !Number.isFinite(x))) return { ok: false, valueOk: [false, false, false], reason: 'unreadable' };
  const valueOk = got.map((x, i) => close(x, q.c[i]));
  let reason = null;
  if (!valueOk.every(Boolean)) reason = got.every((x, i) => close(x, -q.c[i])) ? 'reversed' : 'value';
  return { ok: reason === null, valueOk, reason };
}
// sign: choice '+', '0', '-'.
export function checkSign(q, choice) {
  if (!['+', '0', '-'].includes(choice)) return { ok: false, reason: 'none' };
  return { ok: choice === q.sign, reason: choice === q.sign ? null : 'sign' };
}
// scalar: choice 'same' or 'opposite', text |s v|.
export function checkScalar(q, choice, text) {
  if (!['same', 'opposite'].includes(choice)) return { ok: false, reason: 'none' };
  const m = num(text);
  if (!Number.isFinite(m)) return { ok: false, reason: 'unreadable' };
  const dirOk = choice === q.same, magOk = close(m, q.mag);
  return { ok: dirOk && magOk, dirOk, magOk, reason: !dirOk ? 'direction' : !magOk ? (close(m, norm(q.v)) ? 'noScale' : 'mag') : null };
}

// ---------- model contract ----------
// Nothing moves in time. The cross-product reveal is a short animation inside the view.
export const init = () => ({ t: 0 });
export function observe(s, p) {
  const o = { activity: p.activity, t: 0 };
  if (p.activity === 'practice') return o;
  const a = vectorA(p), b = vectorB(p);
  Object.assign(o, { a, b, aMag: norm(a), bMag: norm(b), phi: angleBetween(a, b), dot: dot(a, b), c: clean(cross(a, b)) });
  o.cMag = norm(o.c);
  o.bAlongA = along(a, b).comp; o.aAlongB = along(b, a).comp;
  return o;
}
