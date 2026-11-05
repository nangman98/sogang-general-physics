// 11.3 The Yo-Yo — pure model (no DOM).
// A yo-yo of mass M (a uniform disk of radius R, the axle's mass neglected, I_com = ½MR²) rolls down its string,
// which unwinds from the axle of radius R0. Like rolling down a ramp at θ = 90° on radius R0:
//   a_com = g/(1 + I_com/(MR0²)) downward (Eq. 11.3.1 in magnitude), and Mg − T = Ma gives T = M(g − a).
// The string does not slip on the axle: v = ωR0. Module 11.3 has no Sample Problem.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const DROP = 1.6;        // m of string

export function yoyo({ M, R, R0 }, g = G) {
  const I = 0.5 * M * R * R, a = g / (1 + I / (M * R0 * R0));
  return { I, a, T: M * (g - a), t: Math.sqrt(2 * DROP / a), alpha: a / R0 };
}
export function stateAt(t, p) {
  const s = yoyo(p), u = Math.min(Math.max(t, 0), s.t);
  return { t: u, y: 0.5 * s.a * u * u, v: s.a * u, w: s.a * u / p.R0, th: 0.5 * s.a * u * u / p.R0 };
}

const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function check(p, { aText, TText }) {
  const s = yoyo(p), a = parseNumber(aText), T = parseNumber(TText);
  const r = { aOk: false, TOk: false, aReason: null, TReason: null };
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, s.a)) r.aOk = true;
  else r.aReason = near(a, G) ? 'freefall' : near(a, G / 1.5) ? 'outerRadius' : 'value';
  if (!Number.isFinite(T)) r.TReason = 'unreadable';
  else if (near(T, s.T)) r.TOk = true;
  else r.TReason = near(T, p.M * G) ? 'weight' : 'value';
  return { ...r, ok: r.aOk && r.TOk };
}

export const params = [
  { id: 'M', label: '요요 질량', sym: '<i>M</i>', unit: 'kg', min: 0.05, max: 0.5, step: 0.01, value: 0.12 },
  { id: 'R', label: '바깥 반지름', sym: '<i>R</i>', unit: 'cm', min: 2, max: 6, step: 0.5, value: 3, format: v => `${v.toFixed(1)} cm` },
  { id: 'R0', label: '축 반지름', sym: '<i>R</i><sub>0</sub>', unit: 'cm', min: 0.3, max: 1.5, step: 0.1, value: 0.6, format: v => `${v.toFixed(1)} cm` },
];
// Slider radii are in cm; the physics works in m.
export const derive = p => ({ ...p, R: p.R / 100, R0: p.R0 / 100 });
export const duration = p => yoyo(p).t;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { ...stateAt(st.t, p), ...yoyo(p) }; }
