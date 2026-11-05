// 16.7 Standing Waves and Resonance — pure model (no DOM).
// Two identical waves in opposite directions, y1 = y_m sin(kx − ωt) (Eq. 16.7.1) and y2 = y_m sin(kx + ωt) (Eq. 16.7.2),
// add to the standing wave y′ = [2y_m sin kx] cos ωt (Eq. 16.7.3). Nodes at x = nλ/2 (Eq. 16.7.5), antinodes at
// x = (n + ½)λ/2 (Eq. 16.7.7). A string of length L with both ends fixed resonates for λ = 2L/n (Eq. 16.7.8) at
// f = v/λ = nv/2L (Eq. 16.7.9), with v = √(τ/μ) (Eq. 16.2.5). The transverse velocity of an element,
// u = ∂y′/∂t = −[2y_m sin kx] ω sin ωt, follows from Eq. 16.7.3 (LO 16.7.4).
// Activities.
//   resonance: L, τ, μ and the harmonic number n are set. The string oscillates in its nth mode. The antinode
//              amplitude does not enter f_n, so the drawing uses min(0.20 m, λ/8).
//   nodes:     a fixed string L = 3.00 m, τ = 9.0 N, μ = 250 g/m (v = 6.00 m/s) in its nth mode, built from the two
//              traveling waves of amplitude y_m. The student follows the element at x_P.
// Playback: one period lasts TVIS = 1.6 s on the screen at 1× (slower than real time), or real time when T > TVIS.
import { parseNumber } from '../../../core/format.js';

export const TVIS = 1.6;                              // s, period on the screen at 1×
export const FIXED = { L: 3.0, tau: 9.0, mu: 250 };   // nodes activity (mu in g/m)
export const NS = 480;
const TAU = 2 * Math.PI;
const clampT = (t, T) => Math.min(Math.max(t, 0), T);
const sample = L => Array.from({ length: NS + 1 }, (_, i) => L * i / NS);

export const waveSpeed = (tau, mu) => Math.sqrt(tau / mu);                     // Eq. 16.2.5, SI
// nth resonance of a string with fixed ends (mu in g/m on the sliders).
export function resonance({ L, tau, mu, n }) {
  const v = waveSpeed(tau, mu / 1000), lam = 2 * L / n, f = v / lam;        // Eqs. 16.7.8, 16.7.9
  return { L, n, v, lam, f, T: 1 / f, k: TAU / lam, w: TAU * f };
}
export const standY = (x, t, s, ym) => 2 * ym * Math.sin(s.k * x) * Math.cos(s.w * t);           // Eq. 16.7.3
export const standU = (x, t, s, ym) => -2 * ym * Math.sin(s.k * x) * s.w * Math.sin(s.w * t);
export const travel1 = (x, t, s, ym) => ym * Math.sin(s.k * x - s.w * t);                         // Eq. 16.7.1
export const travel2 = (x, t, s, ym) => ym * Math.sin(s.k * x + s.w * t);                         // Eq. 16.7.2
export const nodes = s => Array.from({ length: s.n + 1 }, (_, i) => i * s.lam / 2);              // Eq. 16.7.5
export const antinodes = s => Array.from({ length: s.n }, (_, i) => (i + 0.5) * s.lam / 2);      // Eq. 16.7.7

// ---------- activities ----------
export function system(p) {
  return p.activity === 'nodes' ? resonance({ ...FIXED, n: p.nN }) : resonance(p);
}
export const drawAmp = s => Math.min(0.2, s.lam / 8);     // m, antinode amplitude drawn in the resonance activity
// Element at x_P (cm on the slider), traveling-wave amplitude y_m in cm.
export function probe(p) {
  const s = system(p), ym = p.ym / 100, x = p.xP / 100, A = Math.abs(2 * ym * Math.sin(s.k * x));
  return { s, ym, x, A, umax: s.w * A };
}
export function stateAt(t, p) {
  const s = system(p), u = clampT(t, 2 * s.T), xs = sample(s.L);
  if (p.activity === 'nodes') {
    const q = probe(p);
    return {
      activity: 'nodes', t: u, xs, ys: xs.map(x => standY(x, u, s, q.ym)), y1s: xs.map(x => travel1(x, u, s, q.ym)), y2s: xs.map(x => travel2(x, u, s, q.ym)),
      yP: standY(q.x, u, s, q.ym), uP: standU(q.x, u, s, q.ym),
    };
  }
  const ym = drawAmp(s) / 2;
  return { activity: 'resonance', t: u, xs, ys: xs.map(x => standY(x, u, s, ym)) };
}
export function duration(p) { return 2 * system(p).T; }
export function loop() { return true; }
// Physical seconds per screen second at 1× (the screen's timeScale).
export function playScale(p) { return Math.min(1, system(p).T / TVIS); }

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
// lText in m, fText in Hz.
export function checkResonance(p, { lText, fText }) {
  const s = resonance(p), l = parseNumber(lText), f = parseNumber(fText);
  const r = { lOk: false, fOk: false, lReason: null, fReason: null };
  if (!Number.isFinite(l)) r.lReason = 'unreadable';
  else if (near(l, s.lam)) r.lOk = true;
  else r.lReason = near(l, p.L / p.n) ? 'loop' : near(l, 2 * p.L) ? 'fundamental' : 'value';
  if (!Number.isFinite(f)) r.fReason = 'unreadable';
  else if (near(f, s.f)) r.fOk = true;
  else r.fReason = near(f, p.n * s.v / p.L) ? 'loop' : near(f, s.v / (2 * p.L)) ? 'fundamental'
    : near(f, waveSpeed(p.tau, p.mu) / s.lam) ? 'units' : near(f, s.v * s.lam) ? 'times' : 'value';
  return { ...r, ok: r.lOk && r.fOk };
}
// aText in cm, uText in m/s.
export function checkNodes(p, { aText, uText }) {
  const q = probe(p), a = parseNumber(aText), u = parseNumber(uText), kx = q.s.k * q.x, Acm = q.A * 100;
  const r = { aOk: false, uOk: false, aReason: null, uReason: null };
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, Acm)) r.aOk = true;
  else r.aReason = near(a, 2 * p.ym) ? 'everywhere' : near(a, Acm / 2) ? 'noTwo' : near(a, Math.abs(2 * p.ym * Math.cos(kx))) ? 'cos'
    : near(a, Math.abs(2 * p.ym * Math.sin(kx * Math.PI / 180))) ? 'degrees' : 'value';
  if (!Number.isFinite(u)) r.uReason = 'unreadable';
  else if (near(Math.abs(u), q.umax)) r.uOk = true;
  else r.uReason = near(u, q.s.v) ? 'waveSpeed' : near(u, q.s.f * q.A) ? 'noTwoPi' : near(u, q.s.w * 2 * q.ym) ? 'antinode'
    : near(u, q.s.w * q.s.w * q.A) ? 'accel' : near(u, q.umax * 100) ? 'cm' : 'value';
  return { ...r, ok: r.aOk && r.uOk };
}

// ---------- model contract ----------
const isR = p => p.activity === 'resonance';
const isN = p => p.activity === 'nodes';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'resonance', options: [{ value: 'resonance', label: '공명 진동수' }, { value: 'nodes', label: '마디와 배' }] },
  { id: 'L', label: '줄 길이', sym: '<i>L</i>', unit: 'm', min: 2, max: 5, step: 0.1, value: 3.6, showIf: isR },
  { id: 'tau', label: '장력 (tension)', sym: '<i>τ</i>', unit: 'N', min: 5, max: 20, step: 0.5, value: 15, showIf: isR },
  { id: 'mu', label: '선밀도 (linear density)', sym: '<i>μ</i>', unit: 'g/m', min: 200, max: 800, step: 10, value: 400, showIf: isR },
  { id: 'n', label: '배음 번호 (harmonic number)', sym: '<i>n</i>', unit: '', min: 1, max: 6, step: 1, value: 3, showIf: isR },
  { id: 'nN', label: '배음 번호 (harmonic number)', sym: '<i>n</i>', unit: '', min: 1, max: 5, step: 1, value: 3, showIf: isN },
  { id: 'ym', label: '진행파의 진폭 (amplitude)', sym: '<i>y</i><sub>m</sub>', unit: 'cm', min: 3, max: 12, step: 0.5, value: 7, showIf: isN },
  { id: 'xP', label: '줄 요소의 위치', sym: '<i>x</i>', unit: 'cm', min: 0, max: 300, step: 1, value: 62, showIf: isN },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return stateAt(st.t, p); }
