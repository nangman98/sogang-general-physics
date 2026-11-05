// 15.6 Forced Oscillations and Resonance — pure model (no DOM).
// The oscillator of Fig. 15.5.1 with its rigid support moving up and down at angular frequency ωd (Module 15.6 text).
// The support displacement ys = d cos ωd t changes the spring force on the block by k ys, an external driving force
// Fm cos ωd t with Fm = kd (Fm is the amplitude of that force, the symbol of Chapter 15 Problem 34).
// Newton's second law with the damping force of Eq. 15.5.1 (as Eq. 15.5.2 plus this force):
//   m d²x/dt² + b dx/dt + kx = Fm cos ωd t.
// Substituting the forced oscillation x(t) = xm cos(ωd t + ϕ) (Eq. 15.6.1) gives
//   xm = Fm / √(m²(ωd² − ω²)² + b²ωd²),  tan ϕ = −bωd / (m(ω² − ωd²)) with −π < ϕ ≤ 0,  ω = √(k/m) (Eq. 15.1.12).
// The xm expression is the one quoted in Chapter 15 Problem 34; the textbook body gives no amplitude formula.
// The velocity amplitude vm = ωd xm = Fm / √(m²(ωd² − ω²)²/ωd² + b²) is greatest exactly at ωd = ω (Eq. 15.6.2);
// xm is greatest at ωd = √(ω² − b²/2m²), close to ω for small b (the textbook's "approximately").
// Only the steady oscillation is shown, the motion after the start-up has died out.
import { parseNumber } from '../../../core/format.js';

export const WMAX = 20;          // rad/s, end of the ωd axis and of the slider

export const natural = ({ m, k }) => Math.sqrt(k / m);
export function forced(p, wd = p.wd) {
  const w = natural(p), D = p.m * (wd * wd - w * w), xm = p.Fm / Math.sqrt(D * D + (p.b * wd) ** 2);
  const phi = -Math.atan2(p.b * wd, p.m * (w * w - wd * wd));
  return { w, wd, xm, phi, vm: wd * xm, d: p.Fm / p.k };
}
// Largest displacement amplitude over ωd ≥ 0 and where it occurs.
export function peak(p) {
  const w = natural(p), q = w * w - p.b * p.b / (2 * p.m * p.m), wp = q > 0 ? Math.sqrt(q) : 0;
  return { wp, xm: forced(p, wp).xm };
}
export function stateAt(t, p) {
  const s = forced(p), ph = p.wd * t + s.phi;
  const x = s.xm * Math.cos(ph), v = -p.wd * s.xm * Math.sin(ph);
  return { t, x, v, ys: s.d * Math.cos(p.wd * t), F: p.Fm * Math.cos(p.wd * t), Fd: -p.b * v };
}

// ---------- grading ---------- (ωd in rad/s, xm in cm)
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function mistakes(p) {
  const w = natural(p);
  return {
    w: { freq: w / (2 * Math.PI), inverted: 1 / w, noRoot: p.k / p.m },
    x: { static: p.Fm / p.k * 100, velAmp: p.Fm / p.b, units: p.Fm / (p.b * w) },
  };
}
export function check(p, { wText, xText }) {
  const w = natural(p), xr = forced(p, w).xm * 100, W = parseNumber(wText), X = parseNumber(xText), mk = mistakes(p);
  const r = { wOk: false, xOk: false, wReason: null, xReason: null };
  if (!Number.isFinite(W)) r.wReason = 'unreadable';
  else if (near(W, w)) r.wOk = true;
  else r.wReason = Object.keys(mk.w).find(k => near(W, mk.w[k])) ?? 'value';
  if (!Number.isFinite(X)) r.xReason = 'unreadable';
  else if (near(X, xr)) r.xOk = true;
  else r.xReason = Object.keys(mk.x).find(k => near(X, mk.x[k])) ?? 'value';
  return { ...r, ok: r.wOk && r.xOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'm', label: '질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 0.2, max: 1, step: 0.05, value: 0.5 },
  { id: 'k', label: '용수철 상수 (spring constant)', sym: '<i>k</i>', unit: 'N/m', min: 10, max: 50, step: 1, value: 32 },
  { id: 'b', label: '감쇠 상수 (damping constant)', sym: '<i>b</i>', unit: 'kg/s', min: 0.2, max: 2, step: 0.05, value: 0.5 },
  { id: 'Fm', label: '구동력 진폭 (amplitude)', sym: '<i>F</i><sub>m</sub>', unit: 'N', min: 0.1, max: 1, step: 0.05, value: 0.5 },
  { id: 'wd', label: '구동 각진동수 (driving angular frequency)', sym: '<i>ω</i><sub>d</sub>', unit: 'rad/s', min: 1, max: WMAX, step: 0.1, value: 5 },
];
export const duration = p => 2 * 2 * Math.PI / p.wd;
export const loop = () => true;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { ...stateAt(st.t, p), ...forced(p) }; }
