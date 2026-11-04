// 5.3 Applying Newton's Laws — connected bodies, pure model (no DOM).
// Activities.
//   atwood:  Atwood's machine. Blocks of mass m1 and m2 hang from a cord over a pulley.
//            Block 1: T − m1 g = m1 a, block 2: T − m2 g = −m2 a (a > 0 when block 2 moves down).
//   incline: sliding block S (mass M) on a frictionless plane inclined at θ, tied by a cord over a pulley at the
//            top to hanging block H (mass m). Along the plane T − Mg sin θ = Ma, for H T − mg = −ma (Eq. 5.3.6),
//            a > 0 when S moves up the plane. θ = 0 is Sample Problem 5.3.1 (Eqs. 5.3.7, 5.3.8).
// Cord and pulley are massless, the cord does not stretch, so both blocks have the same acceleration magnitude.
// Exact solution at every time, no integrator. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;          // m/s², exact value used in the textbook
// m, how far each block moves before one reaches the floor or the pulley (tall stand as in the department's earlier
// Atwood lab, a 5 m plane on a 3 m table). The run stops there.
export const TRAVEL = { atwood: 3.5, incline: 1.6 };
export const T_MAX = 10;       // s, run when the blocks stay at rest
const rad = d => d * Math.PI / 180;

// Atwood's machine. Returns a (signed, block 2 down is +) and the tension T.
export function atwood({ m1, m2 }, g = G) {
  return { a: (m2 - m1) * g / (m1 + m2), T: 2 * m1 * m2 * g / (m1 + m2) };
}
// Block on a frictionless incline tied to a hanging block. a > 0: S up the plane, H down.
export function incline({ M, m, theta }, g = G) {
  const s = Math.sin(rad(theta));
  return { a: (m - M * s) * g / (M + m), T: M * m * g * (1 + s) / (M + m) };
}
// Second law along the plane for a body pulled up it by a cord, Eq. (5.3.10) solved for a.
export const alongIncline = (mass, T, theta, g = G) => (T - mass * g * Math.sin(rad(theta))) / mass;
// Second law for a hanging body, Eq. (5.3.6) solved for a (a > 0 when it moves down).
export const hangingAccel = (mass, T, g = G) => (mass * g - T) / mass;

export function solve(p) {
  return p.activity === 'incline' ? incline(p) : atwood(p);
}

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export const direction = a => (Math.abs(a) < 1e-9 ? 'none' : a > 0 ? 'pos' : 'neg');

// dir: 'pos' | 'neg' | 'none' (atwood: block 2 down | block 1 down | at rest, incline: S up | S down | at rest).
export function check(p, { dir, aText, TText }) {
  const { a, T } = solve(p), A = Math.abs(a);
  const ax = parseNumber(aText), Tx = parseNumber(TText);
  const r = { dirOk: dir === direction(a), aOk: false, TOk: false, dirReason: null, aReason: null, TReason: null };
  if (!dir) r.dirReason = 'empty';
  else if (!r.dirOk) r.dirReason = 'wrong';
  if (!Number.isFinite(ax)) r.aReason = 'unreadable';
  else {
    r.aOk = near(Math.abs(ax), A);
    if (!r.aOk) {
      if (near(Math.abs(ax), G)) r.aReason = 'freefall';
      else if (p.activity === 'incline' && p.theta > 0 && near(Math.abs(ax), Math.abs(p.m - p.M) * G / (p.M + p.m))) r.aReason = 'noSin';
      else if (p.activity === 'incline' && p.theta > 0 && near(Math.abs(ax), Math.abs(p.m - p.M * Math.cos(rad(p.theta))) * G / (p.M + p.m))) r.aReason = 'cos';
      else if (p.activity !== 'incline' && A > 1e-9 && (near(Math.abs(ax), A * (p.m1 + p.m2) / p.m2) || near(Math.abs(ax), A * (p.m1 + p.m2) / p.m1))) r.aReason = 'oneMass';
      else r.aReason = 'value';
    }
  }
  if (!Number.isFinite(Tx)) r.TReason = 'unreadable';
  else {
    r.TOk = near(Tx, T);
    if (!r.TOk) {
      const weights = p.activity === 'incline' ? [p.m * G] : [p.m1 * G, p.m2 * G];
      r.TReason = A > 1e-9 && weights.some(w => near(Tx, w)) ? 'weight' : 'value';
    }
  }
  return { ...r, ok: r.dirOk && r.aOk && r.TOk };
}

// ---------- model contract ----------
const atw = p => p.activity === 'atwood';
const inc = p => p.activity === 'incline';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'atwood', options: [
    { value: 'atwood', label: '애트우드 기계' }, { value: 'incline', label: '빗면' }] },
  { id: 'm1', label: '블록 1 질량 (mass)', sym: '<i>m</i><sub>1</sub>', unit: 'kg', min: 0.1, max: 10, step: 0.1, value: 2, showIf: atw },
  { id: 'm2', label: '블록 2 질량 (mass)', sym: '<i>m</i><sub>2</sub>', unit: 'kg', min: 0.1, max: 10, step: 0.1, value: 2.4, showIf: atw },
  { id: 'M', label: '미끄러지는 블록 (sliding block)', sym: '<i>M</i>', unit: 'kg', min: 0.1, max: 10, step: 0.1, value: 3, showIf: inc },
  { id: 'm', label: '매단 블록 (hanging block)', sym: '<i>m</i>', unit: 'kg', min: 0.1, max: 10, step: 0.1, value: 2, showIf: inc },
  { id: 'theta', label: '빗면 각', sym: '<i>θ</i>', unit: '°', min: 0, max: 90, step: 1, value: 30, showIf: inc },
];

export function duration(p) {
  const A = Math.abs(solve(p).a), D = TRAVEL[p.activity] ?? TRAVEL.atwood;
  return A > 1e-9 ? Math.min(T_MAX, Math.sqrt(2 * D / A)) : T_MAX;
}
// Arrow scales (m per N, m per m/s²): the largest force is 1.5 m long and the acceleration at most 1.2 m.
export function scales(p) {
  const { a, T } = solve(p), w = p.activity === 'incline' ? [p.M, p.m] : [p.m1, p.m2];
  return { F: 1.5 / Math.max(T, ...w.map(m => m * G), 1e-9), a: Math.min(1 / 4, 1.2 / Math.max(Math.abs(a), 1e-9)) };
}
export const init = () => ({ t: 0 });
export const at = t => ({ t });
// s: distance moved along the positive sense (block 2 down, or S up the plane), v: velocity in that sense.
export function observe(st, p) {
  const { a, T } = solve(p), t = st.t;
  return { activity: p.activity, t, a, T, s: 0.5 * a * t * t, v: a * t, speed: Math.abs(a * t) };
}
