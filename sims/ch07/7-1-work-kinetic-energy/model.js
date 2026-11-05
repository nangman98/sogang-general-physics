// 7.2 Work and Kinetic Energy — pure model (no DOM).
// A crate slides on a frictionless level floor (x along the floor, y up) through a displacement d along +x.
// Constant forces do work W = F d cos φ = F⃗·d⃗ (Eqs. 7.2.5, 7.2.6). The gravitational and normal forces are
// perpendicular to d⃗ and do no work. The work–kinetic energy theorem ΔK = W (Eq. 7.2.8) gives K_f = K_i + W (7.2.9).
// Activities.
//   two:  from rest, a push F1 at θ1 below the horizontal and a pull F2 at θ2 above it (Sample Problem 7.2.1
//         arrangement). Predict the net work and the final speed.
//   wind: the crate already slides at v_i; a steady force F⃗ = F_x î + F_y ĵ acts (Sample Problem 7.2.2
//         arrangement). Predict W = F⃗·d⃗ and K_f.
// Closed-form motion, no integrator. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
const rad = d => d * Math.PI / 180;

export const kinetic = (m, v) => 0.5 * m * v * v;                        // Eq. 7.1.1

export function two({ m, F1, th1, F2, th2, d }, g = G) {
  const c1 = Math.cos(rad(th1)), c2 = Math.cos(rad(th2));
  const W1 = F1 * d * c1, W2 = F2 * d * c2, W = W1 + W2;
  const FN = m * g + F1 * Math.sin(rad(th1)) - F2 * Math.sin(rad(th2));
  return { W1, W2, W, Wg: 0, WN: 0, FN, Fx: F1 * c1 + F2 * c2, Ki: 0, Kf: W, vi: 0, vf: Math.sqrt(2 * W / m) };
}
// Largest pull that keeps the crate on the floor (F2 sin θ2 < mg + F1 sin θ1), rounded down to a whole newton.
export const pullLimit = ({ m, F1, th1, th2 }, g = G) => (th2 > 0 ? Math.floor(0.95 * (m * g + F1 * Math.sin(rad(th1))) / Math.sin(rad(th2))) : Infinity);

export function wind({ m, vi, d, Fx, Fy }, g = G) {
  const Ki = kinetic(m, vi), W = Fx * d, Kf = Ki + W;                      // F⃗·d⃗ with d⃗ = d î
  return { W, Ki, Kf, Fx, FN: m * g - Fy, vi, vf: Math.sqrt(Math.max(0, 2 * Kf / m)) };
}
// Most negative F_x that still lets the crate reach x = d (K_f ≥ 0), rounded up to a whole newton.
export const windLimit = ({ m, vi, d }) => Math.ceil(-kinetic(m, vi) / d);

export const solve = p => (p.activity === 'wind' ? wind(p) : two(p));

// Position along the floor and speed at time t (constant acceleration a = F_x,net / m).
export function motionAt(t, p) {
  const s = solve(p), a = s.Fx / p.m, v0 = s.vi;
  return { x: v0 * t + 0.5 * a * t * t, v: v0 + a * t, a };
}
export function duration(p) {
  const s = solve(p), a = s.Fx / p.m, v0 = s.vi, d = p.d;
  if (Math.abs(a) < 1e-12) return v0 > 0 ? d / v0 : 3;
  const disc = v0 * v0 + 2 * a * d;
  return (-v0 + Math.sqrt(Math.max(0, disc))) / a;
}

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkTwo(p, { WText, vText }) {
  const s = two(p), W = parseNumber(WText), v = parseNumber(vText);
  const r = { WOk: false, vOk: false, WReason: null, vReason: null };
  if (!Number.isFinite(W)) r.WReason = 'unreadable';
  else if (near(W, s.W)) r.WOk = true;
  else {
    const sinW = p.d * (p.F1 * Math.sin(rad(p.th1)) + p.F2 * Math.sin(rad(p.th2)));
    r.WReason = near(W, sinW) ? 'sin' : near(W, (p.F1 + p.F2) * p.d) ? 'noCos' : (near(W, s.W1) || near(W, s.W2)) ? 'oneForce' : 'value';
  }
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, s.vf)) r.vOk = true;
  else r.vReason = near(v, Math.sqrt(s.W / p.m)) ? 'noHalf' : near(v, 2 * s.W / p.m) ? 'noRoot' : 'value';
  return { ...r, ok: r.WOk && r.vOk };
}
export function checkWind(p, { WText, KText }) {
  const s = wind(p), W = parseNumber(WText), K = parseNumber(KText);
  const r = { WOk: false, KOk: false, WReason: null, KReason: null };
  if (!Number.isFinite(W)) r.WReason = 'unreadable';
  else if (near(W, s.W)) r.WOk = true;
  else r.WReason = near(W, Math.hypot(p.Fx, p.Fy) * p.d) ? 'magnitude' : (Math.abs(p.Fy) > 0 && near(W, p.Fy * p.d)) ? 'perp' : (Math.abs(s.W) > 1e-9 && near(W, -s.W)) ? 'sign' : 'value';
  if (!Number.isFinite(K)) r.KReason = 'unreadable';
  else if (near(K, s.Kf)) r.KOk = true;
  else r.KReason = (Math.abs(s.W) > 1e-9 && near(K, s.Ki - s.W)) ? 'minus' : near(K, s.W) ? 'noKi' : 'value';
  return { ...r, ok: r.WOk && r.KOk };
}

// ---------- model contract ----------
const isTwo = p => p.activity === 'two';
const isWind = p => p.activity === 'wind';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'two', options: [{ value: 'two', label: '두 힘의 일' }, { value: 'wind', label: '단위 벡터로 일' }] },
  { id: 'm', label: '상자 질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 1, max: 10, step: 0.5, value: 2 },
  { id: 'd', label: '변위 크기', sym: '<i>d</i>', unit: 'm', min: 1, max: 5, step: 0.5, value: 4 },
  { id: 'F1', label: '미는 힘', sym: '<i>F</i><sub>1</sub>', unit: 'N', min: 0, max: 20, step: 1, value: 6, showIf: isTwo },
  { id: 'th1', label: '미는 각 (수평 아래)', sym: '<i>θ</i><sub>1</sub>', unit: '°', min: 0, max: 60, step: 1, value: 25, showIf: isTwo },
  { id: 'F2', label: '당기는 힘', sym: '<i>F</i><sub>2</sub>', unit: 'N', min: 0, max: 20, step: 1, value: 5, showIf: isTwo,
    bounds: p => [0, Math.min(20, pullLimit(p))] },
  { id: 'th2', label: '당기는 각 (수평 위)', sym: '<i>θ</i><sub>2</sub>', unit: '°', min: 0, max: 60, step: 1, value: 35, showIf: isTwo },
  { id: 'vi', label: '처음 속력', sym: '<i>v</i><sub>i</sub>', unit: 'm/s', min: 0.5, max: 4, step: 0.5, value: 3, showIf: isWind },
  { id: 'Fx', label: '바람 힘 x 성분', sym: '<i>F</i><sub>x</sub>', unit: 'N', min: -20, max: 20, step: 1, value: -1, showIf: isWind,
    bounds: p => [Math.max(-20, windLimit(p)), 20] },
  { id: 'Fy', label: '바람 힘 y 성분', sym: '<i>F</i><sub>y</sub>', unit: 'N', min: -20, max: 20, step: 1, value: -6, showIf: isWind,
    bounds: p => [-20, Math.min(20, Math.floor(0.95 * p.m * G))] },
];

export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  const s = solve(p), mo = motionAt(st.t, p);
  const Fx = s.Fx, Wsofar = Fx * mo.x;
  return { activity: p.activity, t: st.t, ...s, x: mo.x, v: Math.max(0, mo.v), a: mo.a, Wsofar, K: s.Ki + Wsofar };
}
