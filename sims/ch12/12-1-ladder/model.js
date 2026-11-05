// 12.2 Some Examples of Static Equilibrium — leaning ladder, pure model (no DOM).
// A ladder of length L and mass m (center of mass at fraction c of its length from the lower end, c = ½ on screen)
// leans against a frictionless wall at angle θ above the pavement: height h = L sin θ, base distance a = L cos θ.
// A person of mass M stands at distance d along the ladder from the lower end.
// Torques about the lower end O (counterclockwise +), as in Eq. 12.2.4: −h F_w + (d cos θ) Mg + (cL cos θ) mg = 0.
// Forces: F_px = F_w (static friction from the pavement, toward the wall), F_py = (M + m)g (normal force).
// Activities.
//   forces: predict F_w and F_py for the person at d.
//   climb:  pavement with coefficient μ_s. The person climbs from the bottom. Predict how far along the ladder the
//           person gets before the needed friction F_w reaches μ_s F_py (Eq. 6.1.1); the run stops there.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const CLIMB = 0.6;      // m/s along the ladder
const rad = d => d * Math.PI / 180;

export function forces({ L, m, M, theta, d, c = 0.5 }, g = G) {
  const h = L * Math.sin(rad(theta)), a = L * Math.cos(rad(theta));
  const Fw = g * a * (M * d / L + m * c) / h;
  return { h, a, Fw, Fpx: Fw, Fpy: (M + m) * g, F: Math.hypot(Fw, (M + m) * g) };
}
// Farthest distance along the ladder before slipping (clamped to [0, L]); raw value can fall outside.
export function reach(p, g = G) {
  const h = p.L * Math.sin(rad(p.theta)), a = p.L * Math.cos(rad(p.theta)), c = p.c ?? 0.5;
  const raw = p.L * (p.mu * (p.M + p.m) * h / a - p.m * c) / p.M;
  return { raw, d: Math.min(Math.max(raw, 0), p.L), top: raw >= p.L, start: raw <= 0 };
}
export function duration(p) {
  if (p.activity !== 'climb') return 2;                               // static: no run
  return reach(p).d / CLIMB + 0.8;
}
export function stateAt(t, p) {
  if (p.activity !== 'climb') return { t: 0, d: p.d, ...forces(p) };
  const r = reach(p), d = Math.min(Math.max(t, 0) * CLIMB, r.d);
  return { t, d, ...forces({ ...p, d }), fmax: p.mu * (p.M + p.m) * G, slip: !r.top && d >= r.d - 1e-9 && t * CLIMB >= r.d };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkForces(p, { wText, yText }) {
  const s = forces(p), w = parseNumber(wText), y = parseNumber(yText);
  const r = { wOk: false, yOk: false, wReason: null, yReason: null };
  if (!Number.isFinite(w)) r.wReason = 'unreadable';
  else if (near(w, s.Fw)) r.wOk = true;
  else r.wReason = near(w, s.Fw * s.h * s.h / (s.a * s.a)) ? 'swap' : near(w, G * s.a * p.M * p.d / p.L / s.h) ? 'noLadder' : 'value';
  if (!Number.isFinite(y)) r.yReason = 'unreadable';
  else if (near(y, s.Fpy)) r.yOk = true;
  else r.yReason = near(y, p.M * G) ? 'personOnly' : near(y, p.m * G) ? 'ladderOnly' : 'value';
  return { ...r, ok: r.wOk && r.yOk };
}
export function checkClimb(p, { dText }) {
  const r = reach(p), d = parseNumber(dText);
  if (!Number.isFinite(d)) return { ok: false, reason: 'unreadable' };
  if (near(d, r.d)) return { ok: true, reason: null };
  const noLadder = Math.min(Math.max(p.L * p.mu * (p.M + p.m) * Math.tan(rad(p.theta)) / p.M, 0), p.L);
  const personN = Math.min(Math.max(p.L * (p.mu * p.M * Math.tan(rad(p.theta)) - p.m * 0.5) / p.M, 0), p.L);
  if (near(d, noLadder)) return { ok: false, reason: 'noLadder' };
  if (near(d, personN)) return { ok: false, reason: 'personN' };
  return { ok: false, reason: 'value' };
}

// ---------- model contract ----------
const isF = p => p.activity === 'forces';
const isC = p => p.activity === 'climb';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'forces', options: [{ value: 'forces', label: '벽과 바닥의 힘' }, { value: 'climb', label: '어디까지 오를까' }] },
  { id: 'L', label: '사다리 길이', sym: '<i>L</i>', unit: 'm', min: 3, max: 8, step: 0.5, value: 5 },
  { id: 'theta', label: '바닥과 이루는 각', sym: '<i>θ</i>', unit: '°', min: 45, max: 80, step: 1, value: 60 },
  { id: 'm', label: '사다리 질량', sym: '<i>m</i>', unit: 'kg', min: 5, max: 30, step: 1, value: 15 },
  { id: 'M', label: '사람 질량', sym: '<i>M</i>', unit: 'kg', min: 40, max: 100, step: 1, value: 70 },
  { id: 'd', label: '사람의 위치 (사다리를 따라)', sym: '<i>d</i>', unit: 'm', min: 0, max: 8, step: 0.1, value: 3, showIf: isF, bounds: p => [0, p.L] },
  { id: 'mu', label: '바닥의 정지 마찰 계수', sym: '<i>μ</i><sub>s</sub>', unit: '', min: 0.15, max: 0.6, step: 0.01, value: 0.3, showIf: isC },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, ...stateAt(st.t, p) }; }
