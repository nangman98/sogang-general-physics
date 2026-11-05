// 16.1–16.2 Transverse Waves, Wave Speed on a Stretched String — pure model (no DOM).
// y(x, t) = y_m sin(kx − ωt) (Eq. 16.1.2), k = 2π/λ (16.1.5), ω = 2π/T (16.1.8), f = 1/T = ω/2π (16.1.9),
// v = ω/k = λ/T = λf (16.1.13), u = ∂y/∂t = −ωy_m cos(kx − ωt) (16.1.20), a_y = −ω²y_m sin(kx − ωt) (16.1.21),
// v = √(τ/μ) (16.2.5), μ = m/l (Module 16.2, linear density).
// Activities.
//   speed:   a rope of length l = 6.00 m and mass m under tension τ, straight and at rest at first. From t = 0 a driver at
//            x = 0 moves the end as y(0, t) = −y_m sin ωt, the motion Eq. 16.1.2 gives at x = 0 (Eq. 16.1.6). The rope then
//            carries y = h(kx − ωt) with h(φ) = y_m sin φ for φ ≤ 0 and h = 0 for φ > 0 (still at rest ahead of the wave).
//            This is a traveling wave of the form of Eq. 16.1.17, so its leading point x = vt moves at v. The run ends when
//            that point reaches the far end (t = l/v), before any reflection.
//   element: an established sinusoidal wave y = y_m sin(kx − ωt) (Eq. 16.1.2) on a long string; the student follows the
//            string element at x = 0, whose motion is y = −y_m sin ωt (Eq. 16.1.6).
import { parseNumber } from '../../../core/format.js';

export const LROPE = 6.0;          // m, rope length l in the speed activity
export const D = 2.0;              // m, marked string element in the speed activity
export const XE = [-1.5, 6.5];     // m, drawn part of the string in the element activity (marked element at x = 0)
export const NS = 480;             // samples along the drawn string
const TAU = 2 * Math.PI;
const clamp = (t, a, b) => Math.min(Math.max(t, a), b);
const sample = (a, b) => Array.from({ length: NS + 1 }, (_, i) => a + (b - a) * i / NS);
const XS_ROPE = sample(0, LROPE), XS_EL = sample(XE[0], XE[1]);

// ---------- textbook relations (SI, s = { ym, k, w }) ----------
export const waveSpeed = (tau, mu) => Math.sqrt(tau / mu);                     // Eq. 16.2.5
export const yAt = (x, t, s) => s.ym * Math.sin(s.k * x - s.w * t);              // Eq. 16.1.2
export const uAt = (x, t, s) => -s.w * s.ym * Math.cos(s.k * x - s.w * t);       // Eq. 16.1.20
export const ayAt = (x, t, s) => -s.w * s.w * s.ym * Math.sin(s.k * x - s.w * t); // Eq. 16.1.21

// ---------- speed ---------- (m in kg, f in Hz, ym in cm on the sliders)
export function rope({ tau, m, f, ym }) {
  const mu = m / LROPE, v = waveSpeed(tau, mu), lam = v / f;
  return { mu, v, lam, k: TAU / lam, w: TAU * f, f, T: 1 / f, ym: ym / 100, tEnd: LROPE / v };
}
// Displacement of the rope driven from rest at t = 0. Ahead of the leading point x = vt the rope is still straight.
export const ropeY = (x, t, s) => (x <= s.v * t ? yAt(x, t, s) : 0);
export const ropeU = (x, t, s) => (x <= s.v * t ? uAt(x, t, s) : 0);
export function speedAt(t, p) {
  const s = rope(p), u = clamp(t, 0, s.tEnd), front = s.v * u;
  const crest = front - 0.75 * s.lam;                 // first peak, phase kx − ωt = −3π/2
  return {
    t: u, xs: XS_ROPE, ys: XS_ROPE.map(x => ropeY(x, u, s)), front,
    crest: crest >= 0 ? crest : null, yd: ropeY(D, u, s), ud: ropeU(D, u, s), drive: ropeY(0, u, s),
  };
}

// ---------- element ---------- (ym in cm, lam in m, fe in Hz)
export function wave({ ym, lam, fe }) {
  const k = TAU / lam, w = TAU * fe, y = ym / 100;
  return { ym: y, k, w, lam, f: fe, T: 1 / fe, v: w / k, umax: w * y, amax: w * w * y, tTop: 0.75 / fe };
}
export function elementAt(t, p) {
  const s = wave(p), u = clamp(t, 0, 2 * s.T);
  // One peak (phase π/2) followed across [XE0 + 0.5, XE0 + 0.5 + λ); it jumps back one wavelength at the end.
  const x0 = XE[0] + 0.5, xc = (Math.PI / 2 + s.w * u) / s.k;
  const crest = x0 + (((xc - x0) % s.lam) + s.lam) % s.lam;
  return { t: u, xs: XS_EL, ys: XS_EL.map(x => yAt(x, u, s)), crest, y0: yAt(0, u, s), u0: uAt(0, u, s), a0: ayAt(0, u, s) };
}

export function duration(p) { return p.activity === 'element' ? 2 * wave(p).T : rope(p).tEnd; }
export function loop(p) { return p.activity === 'element'; }
export function stateAt(t, p) { return p.activity === 'element' ? { activity: 'element', ...elementAt(t, p) } : { activity: 'speed', ...speedAt(t, p) }; }

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
// vText in m/s, lText in m.
export function checkSpeed(p, { vText, lText }) {
  const s = rope(p), v = parseNumber(vText), l = parseNumber(lText);
  const r = { vOk: false, lOk: false, vReason: null, lReason: null };
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, s.v)) r.vOk = true;
  else r.vReason = near(v, p.tau / s.mu) ? 'noRoot' : near(v, Math.sqrt(s.mu / p.tau)) ? 'inverted' : near(v, Math.sqrt(p.tau / p.m)) ? 'mass' : 'value';
  if (!Number.isFinite(l)) r.lReason = 'unreadable';
  else if (near(l, s.lam)) r.lOk = true;
  else r.lReason = near(l, s.v * s.f) ? 'times' : near(l, s.v / s.w) ? 'omega' : 'value';
  return { ...r, ok: r.vOk && r.lOk };
}
// uText in m/s, tText in s.
export function checkElement(p, { uText, tText }) {
  const s = wave(p), u = parseNumber(uText), t = parseNumber(tText);
  const r = { uOk: false, tOk: false, uReason: null, tReason: null };
  if (!Number.isFinite(u)) r.uReason = 'unreadable';
  else if (near(Math.abs(u), s.umax)) r.uOk = true;
  else r.uReason = near(u, s.v) ? 'waveSpeed' : near(u, s.f * s.ym) ? 'noTwoPi' : near(u, s.amax) ? 'accel' : near(u, s.umax * 100) ? 'cm' : 'value';
  if (!Number.isFinite(t)) r.tReason = 'unreadable';
  else if (near(t, s.tTop)) r.tOk = true;
  else r.tReason = near(t, s.T / 4) ? 'upFirst' : near(t, s.T / 2) ? 'half' : near(t, s.T) ? 'full' : 'value';
  return { ...r, ok: r.uOk && r.tOk };
}

// ---------- model contract ----------
const isS = p => p.activity === 'speed';
const isE = p => p.activity === 'element';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'speed', options: [{ value: 'speed', label: '파동 속력' }, { value: 'element', label: '줄 요소의 운동' }] },
  { id: 'tau', label: '장력 (tension)', sym: '<i>τ</i>', unit: 'N', min: 5, max: 20, step: 0.5, value: 12, showIf: isS },
  { id: 'm', label: '밧줄 질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 1.2, max: 4.8, step: 0.1, value: 1.8, showIf: isS },
  { id: 'f', label: '진동수 (frequency)', sym: '<i>f</i>', unit: 'Hz', min: 2, max: 5, step: 0.1, value: 2.5, showIf: isS },
  { id: 'lam', label: '파장 (wavelength)', sym: '<i>λ</i>', unit: 'm', min: 1, max: 4, step: 0.1, value: 2.4, showIf: isE },
  { id: 'fe', label: '진동수 (frequency)', sym: '<i>f</i>', unit: 'Hz', min: 1, max: 3, step: 0.1, value: 1.6, showIf: isE },
  { id: 'ym', label: '진폭 (amplitude)', sym: '<i>y</i><sub>m</sub>', unit: 'cm', min: 5, max: 25, step: 1, value: 20 },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return stateAt(st.t, p); }
