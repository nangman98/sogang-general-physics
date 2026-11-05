// 10.6–10.7 Torque, Newton's Second Law for Rotation — pure model (no DOM).
// Torque of a force F at position r from the axis: τ = rF sin φ = rF_t = r_⊥F (Eqs. 10.6.1–10.6.3),
// counterclockwise positive. τ_net = Iα (Eq. 10.7.4).
// Activities.
//   torque: a uniform disk (I = ½MR², Table 10.5.1) on a fixed axle; a force F, fixed relative to the disk, acts at
//           distance r from the axle at angle φ from the radial line. Predict τ and α.
//   pulley: the disk is a pulley; a light cord wrapped around its rim holds a hanging block m. The cord does not slip:
//           block mg − T = ma, disk TR = Iα, a = αR, so a = mg/(m + M/2), T = ½Ma, α = a/R.
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const RUN = 3;          // s for the torque activity
export const DROP = 2.2;       // m the block falls in the pulley activity
const rad = d => d * Math.PI / 180;

export const torque = (r, F, phi) => r * F * Math.sin(rad(phi));        // Eq. 10.6.1
export const diskI = (M, R) => 0.5 * M * R * R;

export function pulley({ M, R, m }, g = G) {
  const a = m * g / (m + M / 2);
  return { a, T: 0.5 * M * a, alpha: a / R, I: diskI(M, R) };
}
export function solve(p) {
  if (p.activity === 'pulley') return pulley(p);
  const tau = torque(p.r, p.F, p.phi), I = diskI(p.M, p.R);
  return { tau, I, alpha: tau / I };
}
export function duration(p) {
  if (p.activity === 'pulley') return Math.sqrt(2 * DROP / pulley(p).a);
  return RUN;
}
export function stateAt(t, p) {
  const s = solve(p), u = Math.min(Math.max(t, 0), duration(p));
  return { t: u, w: s.alpha * u, th: 0.5 * s.alpha * u * u, y: p.activity === 'pulley' ? 0.5 * s.a * u * u : 0, v: p.activity === 'pulley' ? s.a * u : 0 };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.001);
export function checkTorque(p, { tText, aText }) {
  const s = solve(p), t = parseNumber(tText), a = parseNumber(aText);
  const r = { tOk: false, aOk: false, tReason: null, aReason: null };
  if (!Number.isFinite(t)) r.tReason = 'unreadable';
  else if (near(t, s.tau)) r.tOk = true;
  else r.tReason = (Math.abs(Math.cos(rad(p.phi))) > 0.01 && near(t, p.r * p.F * Math.cos(rad(p.phi)))) ? 'cos' : near(t, p.r * p.F) && Math.abs(Math.sin(rad(p.phi)) - 1) > 0.01 ? 'noSin' : near(t, p.R * p.F * Math.sin(rad(p.phi))) && p.r !== p.R ? 'rim' : 'value';
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, s.alpha)) r.aOk = true;
  else r.aReason = near(a, s.tau / (p.M * p.R * p.R)) ? 'hoopI' : near(a, s.tau * s.I) ? 'multiply' : 'value';
  return { ...r, ok: r.tOk && r.aOk };
}
export function checkPulley(p, { aText, TText }) {
  const s = pulley(p), a = parseNumber(aText), T = parseNumber(TText);
  const r = { aOk: false, TOk: false, aReason: null, TReason: null };
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, s.a)) r.aOk = true;
  else r.aReason = near(a, G) ? 'freefall' : near(a, p.m * G / (p.m + p.M)) ? 'hoopI' : near(a, p.m * G / p.M * 2) ? 'noBlockMass' : 'value';
  if (!Number.isFinite(T)) r.TReason = 'unreadable';
  else if (near(T, s.T)) r.TOk = true;
  else r.TReason = near(T, p.m * G) ? 'weight' : 'value';
  return { ...r, ok: r.aOk && r.TOk };
}

// ---------- model contract ----------
const isT = p => p.activity === 'torque';
const isP = p => p.activity === 'pulley';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'torque', options: [{ value: 'torque', label: '돌림힘' }, { value: 'pulley', label: '도르래와 매단 블록' }] },
  { id: 'M', label: '원판 질량', sym: '<i>M</i>', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 2 },
  { id: 'R', label: '원판 반지름', sym: '<i>R</i>', unit: 'm', min: 0.2, max: 0.6, step: 0.05, value: 0.5 },
  { id: 'F', label: '힘의 크기', sym: '<i>F</i>', unit: 'N', min: 0, max: 10, step: 0.5, value: 4, showIf: isT },
  { id: 'r', label: '힘이 작용하는 거리', sym: '<i>r</i>', unit: 'm', min: 0.05, max: 0.6, step: 0.05, value: 0.4, showIf: isT, bounds: p => [0.05, p.R] },
  { id: 'phi', label: '힘과 반지름 방향 사이 각', sym: '<i>φ</i>', unit: '°', min: 0, max: 180, step: 5, value: 60, showIf: isT },
  { id: 'm', label: '매단 블록 질량', sym: '<i>m</i>', unit: 'kg', min: 0.2, max: 3, step: 0.1, value: 1, showIf: isP },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, ...stateAt(st.t, p), ...solve(p) }; }
