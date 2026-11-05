// 15.1–15.2 Simple Harmonic Motion, Energy in Simple Harmonic Motion — pure model (no DOM).
// A block of mass m on a spring of constant k on a frictionless floor, the linear oscillator of Fig. 15.1.7.
// x(t) = xm cos(ωt + ϕ) (Eq. 15.1.3), v(t) = −ωxm sin(ωt + ϕ) (Eq. 15.1.6), a(t) = −ω²xm cos(ωt + ϕ) (Eq. 15.1.7),
// a = −ω²x (Eq. 15.1.8), F = −kx (Eq. 15.1.10), ω = √(k/m) (Eq. 15.1.12), T = 2π√(m/k) (Eq. 15.1.13), ω = 2πf (Eq. 15.1.5).
// U = ½kx² (Eq. 15.2.1), K = ½mv² (Eq. 15.2.2), E = U + K = ½kxm² (Eq. 15.2.4).
// The start position sets the phase constant with the values of Fig. 15.1.4: ϕ = 0 at +xm, π/2 passing 0 toward −x,
// π at −xm, 3π/2 passing 0 toward +x. The run lasts RUN seconds whatever the period, so the time axis and the time
// slider do not give the period away before the check.
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const RUN = 5;          // s of motion shown
export const START = {
  right: { label: '+xₘ에서 놓는다 (ϕ = 0)', phi: 0 },
  middleLeft: { label: '0에서 −x 방향으로 지난다 (ϕ = π/2)', phi: Math.PI / 2 },
  left: { label: '−xₘ에서 놓는다 (ϕ = π)', phi: Math.PI },
  middleRight: { label: '0에서 +x 방향으로 지난다 (ϕ = 3π/2)', phi: 3 * Math.PI / 2 },
};

// Oscillator constants. xm is in cm on the slider, everything here is SI.
export function oscillator({ m, k, xm }) {
  const w = Math.sqrt(k / m), T = 2 * Math.PI / w, A = xm / 100;
  return { w, T, f: 1 / T, A, vm: w * A, am: w * w * A, E: 0.5 * k * A * A, Fm: k * A };
}
export const periodOf = (m, k) => 2 * Math.PI * Math.sqrt(m / k);          // Eq. 15.1.13

export function stateAt(t, p) {
  const s = oscillator(p), ph = s.w * t + START[p.start].phi;
  const x = s.A * Math.cos(ph), v = -s.w * s.A * Math.sin(ph), a = -s.w * s.w * s.A * Math.cos(ph);
  const U = 0.5 * p.k * x * x, K = 0.5 * p.m * v * v;
  return { t, x, v, a, F: -p.k * x, U, K, E: U + K };
}

// Phase constant and amplitude from x(0), v(0), a(0) (Eqs. 15.1.14–15.1.16, the method of Sample Problem 15.1.2).
// ω² = −a(0)/x(0); xm cos ϕ = x(0) and xm sin ϕ = −v(0)/ω fix ϕ with xm > 0.
export function fromInitial(x0, v0, a0) {
  const w = Math.sqrt(-a0 / x0), phi = Math.atan2(-v0 / w, x0);
  return { w, phi: phi < 0 ? phi + 2 * Math.PI : phi, xm: Math.hypot(x0, v0 / w) };
}

// ---------- grading ---------- (T in s, vm in m/s)
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function mistakes(p) {
  const s = oscillator(p);
  return {
    T: { inverted: 2 * Math.PI / Math.sqrt(p.m / p.k), noTwoPi: 1 / s.w, freq: s.f, omega: s.w },
    v: { amp: s.A, accel: s.am, useF: s.f * s.A, units: s.vm * 100 },
  };
}
export function check(p, { TText, vText }) {
  const s = oscillator(p), T = parseNumber(TText), v = parseNumber(vText), mk = mistakes(p);
  const r = { TOk: false, vOk: false, TReason: null, vReason: null };
  if (!Number.isFinite(T)) r.TReason = 'unreadable';
  else if (near(T, s.T)) r.TOk = true;
  else r.TReason = Object.keys(mk.T).find(k => near(T, mk.T[k])) ?? 'value';
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(Math.abs(v), s.vm)) r.vOk = true;
  else r.vReason = Object.keys(mk.v).find(k => near(Math.abs(v), mk.v[k])) ?? 'value';
  return { ...r, ok: r.TOk && r.vOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'm', label: '질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 0.2, max: 2, step: 0.1, value: 0.8 },
  { id: 'k', label: '용수철 상수 (spring constant)', sym: '<i>k</i>', unit: 'N/m', min: 5, max: 50, step: 1, value: 20 },
  { id: 'xm', label: '진폭 (amplitude)', sym: '<i>x</i><sub>m</sub>', unit: 'cm', min: 4, max: 20, step: 1, value: 10 },
  { id: 'start', type: 'select', label: '처음 위치 (t = 0)', value: 'right', options: Object.entries(START).map(([value, o]) => ({ value, label: o.label })) },
];
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return stateAt(st.t, p); }
