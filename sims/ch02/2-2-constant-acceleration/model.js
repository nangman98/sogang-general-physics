// 2.4 Constant Acceleration — pure model (no DOM).
// Activities. graphs: x–t, v–t, a–t linked to one car (Eqs. 2.4.1, 2.4.5, 2.4.6).
// missing: choose the Table 2.4.1 equation by its "Missing Quantity", then compute (LO 2.4.1).
// meet: two cars, the crossing of their x–t curves is the same time and the same position.
// Exact solution at every time, no integrator. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const T = 10;                       // s, time span of the graphs

const notMissing = p => p.activity !== 'missing';
const meetOnly = p => p.activity === 'meet';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'graphs', options: [
    { value: 'graphs', label: '그래프 연동' }, { value: 'missing', label: '빠진 양' }, { value: 'meet', label: '두 자동차' }] },
  { id: 'x0', label: '처음 위치 (initial position)', sym: '<i>x</i><sub>0</sub>', unit: 'm', min: -50, max: 50, step: 1, value: -10, showIf: notMissing },
  { id: 'v0', label: '처음 속도 (initial velocity)', sym: '<i>v</i><sub>0</sub>', unit: 'm/s', min: -30, max: 30, step: 0.5, value: 8, showIf: notMissing },
  { id: 'a', label: '가속도 (acceleration)', sym: '<i>a</i>', unit: 'm/s²', min: -10, max: 10, step: 0.1, value: -2, showIf: notMissing },
  { id: 'x0B', label: 'B의 처음 위치 (initial position)', sym: '<i>x</i><sub>0,B</sub>', unit: 'm', min: -50, max: 50, step: 1, value: 10, showIf: meetOnly },
  { id: 'v0B', label: 'B의 처음 속도 (initial velocity)', sym: '<i>v</i><sub>0,B</sub>', unit: 'm/s', min: -30, max: 30, step: 0.5, value: -1, showIf: meetOnly },
  { id: 'aB', label: 'B의 가속도 (acceleration)', sym: '<i>a</i><sub>B</sub>', unit: 'm/s²', min: -10, max: 10, step: 0.1, value: 0, showIf: meetOnly },
  { id: 'arrows', type: 'check', label: '속도·가속도 화살표', value: false, showIf: notMissing },
];

// Constant-acceleration motion, Eqs. (2.4.1) and (2.4.5).
export function stateAt({ x0, v0, a }, t) {
  return { x: x0 + v0 * t + 0.5 * a * t * t, v: v0 + a * t, a };
}
export const carA = p => ({ x0: p.x0, v0: p.v0, a: p.a });
export const carB = p => ({ x0: p.x0B, v0: p.v0B, a: p.aB });

// Smallest and largest position over [0, tMax] (the turning point t = −v0/a may lie inside).
export function xRange(c, tMax = T) {
  const ts = [0, tMax];
  if (c.a !== 0) { const tt = -c.v0 / c.a; if (tt > 0 && tt < tMax) ts.push(tt); }
  const xs = ts.map(t => stateAt(c, t).x);
  return [Math.min(...xs), Math.max(...xs)];
}
export function vRange(c, tMax = T) {
  const vs = [c.v0, c.v0 + c.a * tMax];
  return [Math.min(...vs), Math.max(...vs)];
}

// Times in (0, tMax] when B and A are at the same position: (x0B − x0A) + (v0B − v0A)t + ½(aB − aA)t² = 0.
export function meetTimes(p, tMax = T) {
  const c0 = p.x0B - p.x0, c1 = p.v0B - p.v0, c2 = 0.5 * (p.aB - p.a);
  let roots = [];
  if (Math.abs(c2) < 1e-12) {
    if (Math.abs(c1) > 1e-12) roots = [-c0 / c1];
  } else {
    const disc = c1 * c1 - 4 * c2 * c0;
    if (disc >= 0) {
      const q = -0.5 * (c1 + (c1 >= 0 ? 1 : -1) * Math.sqrt(disc));   // stable form of the quadratic formula
      roots = q === 0 ? [0] : [q / c2, c0 / q];
    }
  }
  return [...new Set(roots.map(t => +t.toFixed(12)))].filter(t => t > 1e-9 && t <= tMax + 1e-9).sort((a, b) => a - b);
}

// Prediction "first meeting time". none = the student says the cars do not meet within T.
export function checkMeet(p, text, none) {
  const roots = meetTimes(p);
  if (none) return { ok: roots.length === 0, reason: roots.length ? 'meets' : null, roots };
  const x = parseNumber(text);
  if (!Number.isFinite(x)) return { ok: false, reason: 'unreadable', roots };
  if (!roots.length) return { ok: false, reason: 'none', roots };
  const close = t => Math.abs(x - t) <= Math.max(0.05, 0.01 * t);
  if (close(roots[0])) return { ok: true, reason: null, roots };
  if (roots[1] !== undefined && close(roots[1])) return { ok: false, reason: 'second', roots };
  return { ok: false, reason: 'value', roots };
}

// ---------- missing quantity (Table 2.4.1) ----------
export const QUANTITIES = ['dx', 'v0', 'v', 'a', 't'];
export const QTEX = { dx: 'x - x_0', v0: 'v_0', v: 'v', a: 'a', t: 't' };
export const QUNIT = { dx: 'm', v0: 'm/s', v: 'm/s', a: 'm/s²', t: 's' };
export const QNAME = { dx: '변위 (displacement)', v0: '처음 속도 (initial velocity)', v: '속도 (velocity)', a: '가속도 (acceleration)', t: '시간 (time)' };
export const EQUATIONS = [
  { no: '2.4.1', missing: 'dx', tex: 'v = v_0 + at' },
  { no: '2.4.5', missing: 'v', tex: 'x - x_0 = v_0 t + \\tfrac{1}{2}at^2' },
  { no: '2.4.6', missing: 't', tex: 'v^2 = v_0^2 + 2a(x - x_0)' },
  { no: '2.4.7', missing: 'a', tex: 'x - x_0 = \\tfrac{1}{2}(v_0 + v)t' },
  { no: '2.4.8', missing: 'v0', tex: 'x - x_0 = vt - \\tfrac{1}{2}at^2' },
];

// Deterministic list. Each motion starts at x0 = 0 with v0, a and lasts t. ask is found, missing is not given.
// Asked quantities never need a root of a quadratic with two admissible answers.
const QLIST = [
  { v0: 4, a: 2, t: 3, ask: 'v', missing: 'dx' },
  { v0: 0, a: 3, t: 4, ask: 'dx', missing: 'v' },
  { v0: 12, a: -2, t: 4, ask: 'a', missing: 't' },
  { v0: 6, a: 2, t: 4, ask: 'dx', missing: 'a' },
  { v0: 4, a: 1.5, t: 4, ask: 'dx', missing: 'v0' },
  { v0: 20, a: -5, t: 4, ask: 't', missing: 'dx' },
  { v0: 3, a: 2, t: 5, ask: 'v', missing: 't', note: '자동차는 계속 +<i>x</i> 방향으로 간다 (<i>v</i> > 0)' },
  { v0: 2, a: 1.2, t: 5, ask: 't', missing: 'a' },
];
export const QCOUNT = QLIST.length;
export function question(index) {
  const b = QLIST[((index % QLIST.length) + QLIST.length) % QLIST.length];
  const end = stateAt({ x0: 0, v0: b.v0, a: b.a }, b.t);
  const values = { dx: end.x, v0: b.v0, v: end.v, a: b.a, t: b.t };
  const given = QUANTITIES.filter(k => k !== b.ask && k !== b.missing);
  const equation = EQUATIONS.find(e => e.missing === b.missing).no;
  return { index, ...b, values, given, answer: values[b.ask], equation };
}

export function checkMissing(q, eqNo, text) {
  const eqOk = eqNo === q.equation;
  const x = parseNumber(text);
  if (!Number.isFinite(x)) return { ok: false, eqOk, valueOk: false, reason: 'unreadable' };
  const tol = 0.01 * Math.abs(q.answer) + 1e-9;
  const valueOk = Math.abs(x - q.answer) <= tol;
  const sign = !valueOk && Math.abs(x + q.answer) <= tol;
  return { ok: eqOk && valueOk, eqOk, valueOk, reason: valueOk ? null : sign ? 'sign' : 'value' };
}

// ---------- model contract ----------
export const duration = () => T;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(s, p) {
  const A = stateAt(carA(p), s.t);
  const o = { activity: p.activity, t: s.t, x: A.x, v: A.v, a: A.a, dx: A.x - p.x0 };
  if (p.activity === 'meet') { o.B = stateAt(carB(p), s.t); o.gap = o.B.x - A.x; }
  return o;
}
