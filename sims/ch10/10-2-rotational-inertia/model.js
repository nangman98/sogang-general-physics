// 10.5 Calculating the Rotational Inertia — pure model (no DOM).
// Rotational inertias from Table 10.5.1 (mass M, radius R, length L) and the parallel-axis theorem
// I = I_com + Mh² (Eq. 10.5.2). A constant torque τ spins each body from rest about a fixed axis, α = τ/I (Eq. 10.7.4).
// Activities.
//   race:     shapes A and B with the same M and R (a thin rod of length 2R about its center) under the same τ.
//             Predict which spins up faster and α of A.
//   parallel: a thin rod of length L turned about an axis perpendicular to it at distance h from its center.
//             Predict I and α.
import { parseNumber } from '../../../core/format.js';

export const RUN = 3;          // s
// I = k M R² for each shape (rod: length 2R about its center, k = (2R)²/12 / R² = 1/3).
export const SHAPES = {
  hoop: { k: 1, label: '고리 (hoop)' },
  disk: { k: 1 / 2, label: '원판 (disk)' },
  sphere: { k: 2 / 5, label: '속이 찬 구 (solid sphere)' },
  shell: { k: 2 / 3, label: '얇은 구 껍질 (spherical shell)' },
  rod: { k: 1 / 3, label: '막대 (rod, 길이 2R)' },
};
export const inertia = (shape, M, R) => SHAPES[shape].k * M * R * R;
export const rodInertia = (M, L, h) => M * L * L / 12 + M * h * h;     // Eq. 10.5.2 with I_com = ML²/12

export function solve(p) {
  if (p.activity === 'parallel') { const I = rodInertia(p.M, p.L, p.h); return { IA: I, aA: p.tau / I }; }
  const IA = inertia(p.A, p.M, p.R), IB = inertia(p.B, p.M, p.R);
  return { IA, IB, aA: p.tau / IA, aB: p.tau / IB, faster: Math.abs(IA - IB) < 1e-12 ? 'same' : IA < IB ? 'A' : 'B' };
}
export function stateAt(t, p) {
  const s = solve(p), u = Math.min(Math.max(t, 0), RUN);
  return { t: u, wA: s.aA * u, thA: 0.5 * s.aA * u * u, wB: (s.aB ?? 0) * u, thB: 0.5 * (s.aB ?? 0) * u * u };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.001);
export function checkRace(p, { pick, aText }) {
  const s = solve(p), a = parseNumber(aText);
  const r = { pickOk: pick === s.faster, aOk: false, pickReason: null, aReason: null };
  if (!pick) r.pickReason = 'empty'; else if (!r.pickOk) r.pickReason = 'wrong';
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, s.aA)) r.aOk = true;
  else r.aReason = near(a, p.tau / (p.M * p.R * p.R)) && SHAPES[p.A].k !== 1 ? 'hoopFormula' : near(a, s.IA * p.tau) ? 'multiply' : near(a, p.tau / s.IA / p.R) ? 'radius' : 'value';
  return { ...r, ok: r.pickOk && r.aOk };
}
export function checkParallel(p, { IText, aText }) {
  const s = solve(p), I = parseNumber(IText), a = parseNumber(aText);
  const r = { IOk: false, aOk: false, IReason: null, aReason: null };
  if (!Number.isFinite(I)) r.IReason = 'unreadable';
  else if (near(I, s.IA)) r.IOk = true;
  else r.IReason = p.h > 0 && near(I, p.M * p.L * p.L / 12) ? 'noShift' : p.h > 0 && near(I, p.M * p.h * p.h) ? 'onlyShift' : near(I, p.M * p.L * p.L / 3) && Math.abs(p.h - p.L / 2) > 1e-9 ? 'end' : 'value';
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, s.aA)) r.aOk = true;
  else r.aReason = near(a, p.tau * s.IA) ? 'multiply' : 'value';
  return { ...r, ok: r.IOk && r.aOk };
}

// ---------- model contract ----------
const isRace = p => p.activity === 'race';
const isPar = p => p.activity === 'parallel';
const shapeOptions = Object.entries(SHAPES).map(([value, s]) => ({ value, label: s.label }));
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'race', options: [{ value: 'race', label: '모양 비교' }, { value: 'parallel', label: '평행축 정리' }] },
  { id: 'A', type: 'select', label: '물체 A', value: 'hoop', options: shapeOptions, showIf: isRace },
  { id: 'B', type: 'select', label: '물체 B', value: 'disk', options: shapeOptions, showIf: isRace },
  { id: 'M', label: '질량 (mass)', sym: '<i>M</i>', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 2 },
  { id: 'R', label: '반지름', sym: '<i>R</i>', unit: 'm', min: 0.2, max: 0.6, step: 0.05, value: 0.4, showIf: isRace },
  { id: 'L', label: '막대 길이', sym: '<i>L</i>', unit: 'm', min: 0.6, max: 1.6, step: 0.1, value: 1.2, showIf: isPar },
  { id: 'h', label: '축과 중심 사이 거리', sym: '<i>h</i>', unit: 'm', min: 0, max: 0.8, step: 0.05, value: 0.3, showIf: isPar, bounds: p => [0, p.L / 2] },
  { id: 'tau', label: '돌림힘 (torque)', sym: '<i>τ</i>', unit: 'N·m', min: 0.1, max: 2, step: 0.1, value: 0.5 },
];
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, ...stateAt(st.t, p), ...solve(p) }; }
