// 7.6 Power — pure model (no DOM).
// Power due to a force is the rate at which it does work: P_avg = W/Δt (Eq. 7.6.1), P = dW/dt (Eq. 7.6.2),
// and for a constant force on a body moving along x, P = Fv cos φ = F⃗·v⃗ (Eqs. 7.6.6, 7.6.7).
// A box slides on a frictionless level floor along +x.
// Activities.
//   pull: one force F at φ above the horizontal; the box starts at v_i. Predict P at t = 0 and P_avg over RUN.
//   two:  F1 horizontal against the motion (φ1 = 180°) and F2 at φ2 above the horizontal (Sample Problem 7.6.1
//         arrangement). Predict P1 and P2 at t = 0 and whether the net power changes. The net power
//         P_net = F_x,net v changes at the rate F_x,net²/m, so it grows whenever F_x,net ≠ 0.
// Closed-form motion. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const RUN = 4;          // s, length of a run unless the box stops first
const rad = d => d * Math.PI / 180;

export const power = (F, v, phi) => F * v * Math.cos(rad(phi));         // Eq. 7.6.6

// Net force along x and the speed at t = 0 of each activity.
export function setup(p) {
  if (p.activity === 'two') return { Fx: p.F2 * Math.cos(rad(p.phi2)) - p.F1, v0: p.v0, FN: p.m * G - p.F2 * Math.sin(rad(p.phi2)) };
  return { Fx: p.F * Math.cos(rad(p.phi)), v0: p.vi, FN: p.m * G - p.F * Math.sin(rad(p.phi)) };
}
export function duration(p) {
  const { Fx, v0 } = setup(p), a = Fx / p.m;
  return a < 0 ? Math.min(RUN, v0 / -a) : RUN;                             // stop when the box comes to rest
}
export function stateAt(t, p) {
  const { Fx, v0, FN } = setup(p), a = Fx / p.m;
  const v = Math.max(0, v0 + a * t), x = v0 * t + 0.5 * a * t * t;
  const out = { t, v, x, a, FN, Pnet: Fx * v, Wnet: Fx * x };
  if (p.activity === 'two') {
    const c2 = Math.cos(rad(p.phi2));
    return { ...out, P1: power(p.F1, v, 180), P2: power(p.F2, v, p.phi2), W1: -p.F1 * x, W2: p.F2 * c2 * x };
  }
  return { ...out, P: power(p.F, v, p.phi), W: Fx * x };
}
export const averagePower = p => { const T = duration(p); return stateAt(T, p).Wnet / T; };    // Eq. 7.6.1
// Trend of the net power: 'same' when F_x,net = 0, otherwise 'up' (dP_net/dt = F_x,net²/m > 0).
export const trend = p => (Math.abs(setup(p).Fx) < 1e-9 ? 'same' : 'up');
// Largest force that keeps the box on the floor (F sin φ < mg), rounded down to a whole newton.
export const liftLimit = (m, phi) => (phi > 0 ? Math.floor(0.95 * m * G / Math.sin(rad(phi))) : Infinity);

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkPull(p, { P0Text, avgText }) {
  const P0 = stateAt(0, p).P, avg = averagePower(p), a = parseNumber(P0Text), b = parseNumber(avgText);
  const r = { P0Ok: false, avgOk: false, P0Reason: null, avgReason: null };
  if (!Number.isFinite(a)) r.P0Reason = 'unreadable';
  else if (near(a, P0)) r.P0Ok = true;
  else r.P0Reason = (p.phi > 0 && near(a, p.F * p.vi)) ? 'noCos' : (p.phi > 0 && near(a, p.F * p.vi * Math.sin(rad(p.phi)))) ? 'sin' : 'value';
  if (!Number.isFinite(b)) r.avgReason = 'unreadable';
  else if (near(b, avg)) r.avgOk = true;
  else {
    const T = duration(p), end = stateAt(T, p).P;
    r.avgReason = near(b, end) ? 'final' : near(b, P0) && Math.abs(end - P0) > 1e-9 ? 'initial' : near(b, stateAt(T, p).W) ? 'noTime' : 'value';
  }
  return { ...r, ok: r.P0Ok && r.avgOk };
}
export function checkTwo(p, { P1Text, P2Text, trendChoice }) {
  const s = stateAt(0, p), a = parseNumber(P1Text), b = parseNumber(P2Text);
  const r = { P1Ok: false, P2Ok: false, trendOk: trendChoice === trend(p), P1Reason: null, P2Reason: null, trendReason: null };
  if (!trendChoice) r.trendReason = 'empty';
  else if (!r.trendOk) r.trendReason = trendChoice;
  if (!Number.isFinite(a)) r.P1Reason = 'unreadable';
  else if (near(a, s.P1)) r.P1Ok = true;
  else r.P1Reason = Math.abs(s.P1) > 1e-9 && near(a, -s.P1) ? 'sign' : 'value';
  if (!Number.isFinite(b)) r.P2Reason = 'unreadable';
  else if (near(b, s.P2)) r.P2Ok = true;
  else r.P2Reason = (p.phi2 > 0 && near(b, p.F2 * p.v0)) ? 'noCos' : (p.phi2 > 0 && near(b, p.F2 * p.v0 * Math.sin(rad(p.phi2)))) ? 'sin' : 'value';
  return { ...r, ok: r.P1Ok && r.P2Ok && r.trendOk };
}

// ---------- model contract ----------
const isPull = p => p.activity === 'pull';
const isTwo = p => p.activity === 'two';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'pull', options: [{ value: 'pull', label: '한 힘의 일률' }, { value: 'two', label: '두 힘의 일률' }] },
  { id: 'm', label: '상자 질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 1, max: 10, step: 0.5, value: 1 },
  { id: 'F', label: '당기는 힘', sym: '<i>F</i>', unit: 'N', min: 0, max: 20, step: 1, value: 3, showIf: isPull, bounds: p => [0, Math.min(20, liftLimit(p.m, p.phi))] },
  { id: 'phi', label: '힘의 각 (수평 위)', sym: '<i>φ</i>', unit: '°', min: 0, max: 80, step: 1, value: 30, showIf: isPull },
  { id: 'vi', label: '처음 속력', sym: '<i>v</i><sub>i</sub>', unit: 'm/s', min: 0, max: 4, step: 0.5, value: 1, showIf: isPull },
  { id: 'F1', label: '미는 힘 (운동 반대)', sym: '<i>F</i><sub>1</sub>', unit: 'N', min: 0, max: 10, step: 0.5, value: 3, showIf: isTwo },
  { id: 'F2', label: '당기는 힘', sym: '<i>F</i><sub>2</sub>', unit: 'N', min: 0, max: 10, step: 0.5, value: 5, showIf: isTwo, bounds: p => [0, Math.min(10, liftLimit(p.m, p.phi2))] },
  { id: 'phi2', label: '당기는 각 (수평 위)', sym: '<i>φ</i><sub>2</sub>', unit: '°', min: 0, max: 80, step: 1, value: 60, showIf: isTwo },
  { id: 'v0', label: '처음 속력', sym: '<i>v</i>', unit: 'm/s', min: 0.5, max: 4, step: 0.5, value: 2, showIf: isTwo },
];

export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, ...stateAt(st.t, p) }; }
