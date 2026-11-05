// 8.4–8.5 Work Done on a System by an External Force, Conservation of Energy — pure model (no DOM).
// Kinetic friction turns mechanical energy into thermal energy ΔE_th = f_k d (Eq. 8.4.7).
// Activities.
//   pull: a block slides on a level floor (μk) while a constant horizontal force F pulls it through d.
//         F d = ΔE_mec + ΔE_th (Eq. 8.4.8) with ΔE_mec = ΔK here. F ≥ f_k, so the block never slows to rest.
//   ramp: a block released from rest at height H slides down a plane at θ and then along the level floor, the same
//         μk on both, until it stops (Sample Problem 8.5.2 arrangement). Isolated system:
//         ΔE_mec + ΔE_th = 0, and the floor run is d = H(1/μk − 1/tan θ) (Eq. 8.5.8). The speed is kept at the
//         bottom of the plane (a smooth bend). tan θ > μk is enforced so the block starts to slide.
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
const rad = d => d * Math.PI / 180;
const deg = r => r * 180 / Math.PI;

// ---------- pull ----------
export function pull({ m, F, muk, d, v0 }, g = G) {
  const fk = muk * m * g, a = (F - fk) / m;
  const Ki = 0.5 * m * v0 * v0, W = F * d, Eth = fk * d, Kf = Ki + W - Eth;
  return { fk, a, Ki, W, Eth, Kf, dK: Kf - Ki, T: Math.abs(a) < 1e-12 ? d / v0 : (-v0 + Math.sqrt(v0 * v0 + 2 * a * d)) / a };
}
export function pullAt(t, p) {
  const s = pull(p), x = p.v0 * t + 0.5 * s.a * t * t, v = p.v0 + s.a * t;
  return { x, v, W: p.F * x, Eth: s.fk * x, K: 0.5 * p.m * v * v };
}

// ---------- ramp ----------
export const minAngle = muk => Math.ceil(deg(Math.atan(muk)) + 3);       // degrees, so tan θ > μk with room to spare
export function ramp({ m, H, theta, muk }, g = G) {
  const th = rad(theta), L = H / Math.sin(th);
  const a1 = g * (Math.sin(th) - muk * Math.cos(th)), t1 = Math.sqrt(2 * L / a1), v1 = a1 * t1;
  const a2 = muk * g, t2 = v1 / a2, d = v1 * v1 / (2 * a2);
  return { L, a1, t1, v1, a2, t2, d, E0: m * g * H, ratio: 1 / muk - 1 / Math.tan(th) };
}
// s: path length from the release point (L down the plane, then d along the floor).
export function rampAt(t, p, g = G) {
  const r = ramp(p, g), th = rad(p.theta);
  let s, v, onPlane;
  if (t <= r.t1) { s = 0.5 * r.a1 * t * t; v = r.a1 * t; onPlane = true; }
  else { const u = Math.min(t - r.t1, r.t2); s = r.L + r.v1 * u - 0.5 * r.a2 * u * u; v = r.v1 - r.a2 * u; onPlane = false; }
  const y = onPlane ? p.H - s * Math.sin(th) : 0;
  const Eth = onPlane ? p.muk * p.m * g * Math.cos(th) * s : p.muk * p.m * g * Math.cos(th) * r.L + p.muk * p.m * g * (s - r.L);
  return { s, v, y, onPlane, U: p.m * g * y, K: 0.5 * p.m * v * v, Eth };
}

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkPull(p, { EText, KText }) {
  const s = pull(p), e = parseNumber(EText), k = parseNumber(KText);
  const r = { EOk: false, KOk: false, EReason: null, KReason: null };
  if (!Number.isFinite(e)) r.EReason = 'unreadable';
  else if (near(e, s.Eth)) r.EOk = true;
  else r.EReason = near(e, s.W) ? 'work' : near(e, p.muk * p.d) ? 'noWeight' : 'value';
  if (!Number.isFinite(k)) r.KReason = 'unreadable';
  else if (near(k, s.Kf)) r.KOk = true;
  else r.KReason = near(k, s.Ki + s.W) ? 'noFriction' : (s.Ki > 0 && near(k, s.W - s.Eth)) ? 'noKi' : 'value';
  return { ...r, ok: r.EOk && r.KOk };
}
export function checkRamp(p, { dText, cmp }) {
  const r0 = ramp(p), x = parseNumber(dText);
  const r = { dOk: false, cOk: cmp === 'equal', dReason: null, cReason: null };
  if (!cmp) r.cReason = 'empty'; else if (!r.cOk) r.cReason = cmp;
  if (!Number.isFinite(x)) r.dReason = 'unreadable';
  else if (near(x, r0.d)) r.dOk = true;
  else r.dReason = near(x, p.H / p.muk) ? 'noPlane' : near(x, p.H * (1 / p.muk + 1 / Math.tan(rad(p.theta)))) ? 'sign' : near(x, p.H * p.muk) ? 'inverse' : 'value';
  return { ...r, ok: r.dOk && r.cOk };
}

// ---------- model contract ----------
const isPull = p => p.activity === 'pull';
const isRamp = p => p.activity === 'ramp';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'pull', options: [{ value: 'pull', label: '끌기' }, { value: 'ramp', label: '경사로와 바닥' }] },
  { id: 'm', label: '블록 질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 2 },
  { id: 'muk', label: '운동 마찰 계수', sym: '<i>μ</i><sub>k</sub>', min: 0.2, max: 0.8, step: 0.05, value: 0.3 },
  { id: 'F', label: '끄는 힘', sym: '<i>F</i>', unit: 'N', min: 0, max: 40, step: 1, value: 10, showIf: isPull, bounds: p => [Math.ceil(p.muk * p.m * G), 40] },
  { id: 'd', label: '끄는 거리', sym: '<i>d</i>', unit: 'm', min: 1, max: 6, step: 0.5, value: 4, showIf: isPull },
  { id: 'v0', label: '처음 속력', sym: '<i>v</i><sub>0</sub>', unit: 'm/s', min: 0.5, max: 4, step: 0.5, value: 2, showIf: isPull },
  { id: 'H', label: '출발 높이', sym: '<i>H</i>', unit: 'm', min: 0.5, max: 2.5, step: 0.1, value: 1.5, showIf: isRamp },
  { id: 'theta', label: '경사각', sym: '<i>θ</i>', unit: '°', min: 10, max: 70, step: 1, value: 40, showIf: isRamp, bounds: p => [Math.min(70, minAngle(p.muk)), 70] },
];

export function duration(p) { if (p.activity === 'ramp') { const r = ramp(p); return r.t1 + r.t2; } return pull(p).T; }
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  if (p.activity === 'ramp') return { activity: 'ramp', t: st.t, ...rampAt(st.t, p), E0: ramp(p).E0 };
  return { activity: 'pull', t: st.t, ...pullAt(st.t, p), Ki: pull(p).Ki };
}
