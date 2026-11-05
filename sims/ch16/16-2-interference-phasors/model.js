// 16.5–16.6 Interference of Waves, Phasors — pure model (no DOM).
// Two sinusoidal waves on one string travel in +x with the same k and ω:
//   y1 = y_m1 sin(kx − ωt) (Eq. 16.5.2, 16.6.1), y2 = y_m2 sin(kx − ωt + ϕ) (Eq. 16.5.3, 16.6.2), y′ = y1 + y2 (Eq. 16.5.1).
// Equal amplitudes: y′ = [2y_m cos ½ϕ] sin(kx − ωt + ½ϕ) (Eq. 16.5.6), y′_m = |2y_m cos ½ϕ| (Eq. 16.5.7).
// Any amplitudes: y′ = y′_m sin(kx − ωt + β) (Eq. 16.6.3). The phasors are vectors of lengths y_m1 and y_m2 at angles
// θ = kx − ωt and θ + ϕ from the horizontal axis (counterclockwise +). They turn clockwise at ω, and the projection on
// the vertical axis is the displacement (Module 16.6). Their vector sum, by components y′_mh = y_m1 + y_m2 cos ϕ and
// y′_mv = y_m2 sin ϕ (Sample Problem 16.6.1), gives y′_m and β.
// The drawing uses λ = 8.0 cm and T = 2.0 s. The answers do not depend on them.
// Amplitudes and displacements in mm, positions along the string in cm, angles in degrees on the screen.
import { parseNumber } from '../../../core/format.js';

export const LAM = 8.0;            // cm, drawn wavelength
export const TP = 2.0;             // s, drawn period
export const XLEN = 10.0;          // cm, drawn string from x = 0 (1.25 wavelengths)
export const NS = 360;
const K = 2 * Math.PI / LAM, W = 2 * Math.PI / TP, rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const XS = Array.from({ length: NS + 1 }, (_, i) => XLEN * i / NS);
export const wrap = d => ((d % 360) + 540) % 360 - 180;            // degrees to (−180, 180]

// Phasor sum. Returns the resultant amplitude and its phase constant β (degrees, (−180, 180]).
export function phasorSum(a1, a2, phiDeg) {
  const h = a1 + a2 * Math.cos(rad(phiDeg)), v = a2 * Math.sin(rad(phiDeg));
  return { h, v, ym: Math.hypot(h, v), beta: deg(Math.atan2(v, h)) };
}
// Equal amplitudes (Eq. 16.5.7) and the type of interference (Table 16.5.1).
export function sameAmp(ym, phiDeg) {
  const c = Math.cos(rad(phiDeg) / 2), r = Math.abs(2 * ym * c);
  const type = Math.abs(Math.abs(c) - 1) < 1e-9 ? 'constructive' : Math.abs(c) < 1e-9 ? 'destructive' : 'intermediate';
  return { ym: r, type, waves: phiDeg / 360 };
}

export function amps(p) {
  return p.activity === 'phasor' ? { a1: p.ym1, a2: p.ym2, phi: p.phiP } : { a1: p.ym, a2: p.ym, phi: p.phi };
}
export function stateAt(t, p) {
  const { a1, a2, phi } = amps(p), u = Math.min(Math.max(t, 0), duration(p)), f = rad(phi), s = phasorSum(a1, a2, phi);
  const y1 = x => a1 * Math.sin(K * x - W * u), y2 = x => a2 * Math.sin(K * x - W * u + f);
  const th = -W * u;                                               // phasor 1 angle at x = 0 (rad)
  return {
    t: u, xs: XS, y1s: XS.map(y1), y2s: XS.map(y2), ys: XS.map(x => y1(x) + y2(x)),
    th, a1, a2, phi, R: s.ym, beta: s.beta, p1: y1(0), p2: y2(0), pR: y1(0) + y2(0),
  };
}
export function duration() { return 2 * TP; }
export function loop() { return true; }

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
const nearAngle = (a, b) => Math.abs(wrap(a - b)) <= Math.max(0.02 * Math.abs(b), 0.5);
// ymText in mm, type one of constructive | destructive | intermediate.
export function checkSame(p, { ymText, type }) {
  const s = sameAmp(p.ym, p.phi), y = parseNumber(ymText), f = rad(p.phi);
  const r = { yOk: false, tOk: false, yReason: null, tReason: null };
  if (!Number.isFinite(y)) r.yReason = 'unreadable';
  else if (near(y, s.ym)) r.yOk = true;
  else r.yReason = near(y, Math.abs(2 * p.ym * Math.cos(f))) ? 'noHalf' : near(y, 2 * p.ym) ? 'noPhase' : near(y, s.ym / 2) ? 'noTwo'
    : near(y, Math.abs(2 * p.ym * Math.cos(p.phi / 2))) ? 'degRad' : 'value';
  if (!type) r.tReason = 'empty';
  else if (type === s.type) r.tOk = true;
  else r.tReason = 'type';
  return { ...r, ok: r.yOk && r.tOk };
}
// ymText in mm, bText in degrees.
export function checkPhasor(p, { ymText, bText }) {
  const s = phasorSum(p.ym1, p.ym2, p.phiP), y = parseNumber(ymText), b = parseNumber(bText), f = rad(p.phiP);
  const r = { yOk: false, bOk: false, yReason: null, bReason: null };
  if (!Number.isFinite(y)) r.yReason = 'unreadable';
  else if (near(y, s.ym)) r.yOk = true;
  else r.yReason = near(y, p.ym1 + p.ym2) ? 'scalar' : near(y, Math.abs(p.ym1 - p.ym2)) ? 'diff' : near(y, Math.hypot(p.ym1, p.ym2)) ? 'perp'
    : near(y, Math.abs((p.ym1 + p.ym2) * Math.cos(f / 2))) ? 'sameAmp' : 'value';
  if (!Number.isFinite(b)) r.bReason = 'unreadable';
  else if (s.ym < 1e-9 || nearAngle(b, s.beta)) r.bOk = true;      // no resultant wave: any β
  else r.bReason = nearAngle(b, p.phiP / 2) ? 'half' : nearAngle(b, p.phiP) ? 'full' : nearAngle(b, p.phiP - s.beta) ? 'fromTwo'
    : nearAngle(b, deg(Math.atan2(s.v, p.ym1))) ? 'noHoriz' : near(b, rad(s.beta)) ? 'radians' : 'value';
  return { ...r, ok: r.yOk && r.bOk };
}

// ---------- model contract ----------
const isS = p => p.activity === 'same';
const isP = p => p.activity === 'phasor';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'same', options: [{ value: 'same', label: '같은 진폭' }, { value: 'phasor', label: 'phasor 합' }] },
  { id: 'ym', label: '두 파의 진폭 (amplitude)', sym: '<i>y</i><sub>m</sub>', unit: 'mm', min: 1, max: 8, step: 0.1, value: 6, showIf: isS },
  { id: 'phi', label: '위상차 (phase difference)', sym: '<i>ϕ</i>', unit: '°', min: 0, max: 720, step: 5, value: 130, showIf: isS },
  { id: 'ym1', label: '파동 1의 진폭', sym: '<i>y</i><sub>m1</sub>', unit: 'mm', min: 1, max: 8, step: 0.1, value: 5, showIf: isP },
  { id: 'ym2', label: '파동 2의 진폭', sym: '<i>y</i><sub>m2</sub>', unit: 'mm', min: 1, max: 8, step: 0.1, value: 3, showIf: isP },
  { id: 'phiP', label: '위상 상수 (phase constant)', sym: '<i>ϕ</i>', unit: '°', min: 0, max: 360, step: 5, value: 110, showIf: isP },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return stateAt(st.t, p); }
