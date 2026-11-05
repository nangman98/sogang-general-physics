// 11.8 Conservation of Angular Momentum — pure model (no DOM).
// A uniform disk (mass M, radius R, I_d = ½MR², Table 10.5.1c) turns freely like a merry-go-round about its central
// axis. A small body of mass m (a particle, I = mr²) rides on it at radius r_i and then crawls along a radius to r_f.
// No external torque acts about the axis, so L = Iω stays the same: I_i ω_i = I_f ω_f (Eq. 11.8.3).
// Timeline: rest of the body at r_i for T1, a crawl at constant radial speed for TC, then at r_f until RUN.
// The turned angle during the crawl is closed form: ∫ L dt/(I_d + m r²) with r linear in t.
import { parseNumber } from '../../../core/format.js';

export const T1 = 1.5, TC = 3, RUN = 6;     // s

export function system({ M, m, R, ri, rf, w0 }) {
  const Id = 0.5 * M * R * R, Ii = Id + m * ri * ri, If = Id + m * rf * rf, L = Ii * w0, wf = L / If;
  return { Id, Ii, If, L, wi: w0, wf, Ki: 0.5 * Ii * w0 * w0, Kf: 0.5 * If * wf * wf };
}
export function radiusAt(t, p) {
  if (t <= T1) return p.ri;
  if (t >= T1 + TC) return p.rf;
  return p.ri + (p.rf - p.ri) * (t - T1) / TC;
}
export function stateAt(t, p) {
  const s = system(p), u = Math.min(Math.max(t, 0), RUN), r = radiusAt(u, p), I = s.Id + p.m * r * r, w = s.L / I;
  const th1 = s.wi * T1;
  let th;
  if (u <= T1) th = s.wi * u;
  else {
    const tc = Math.min(u, T1 + TC) - T1, rr = radiusAt(T1 + tc, p), v = (p.rf - p.ri) / TC;
    let crawl;
    if (Math.abs(v) < 1e-12 || p.m === 0) crawl = s.wi * tc;
    else { const k = Math.sqrt(p.m / s.Id); crawl = s.L / (v * Math.sqrt(s.Id * p.m)) * (Math.atan(k * rr) - Math.atan(k * p.ri)); }
    th = th1 + crawl + (u > T1 + TC ? s.wf * (u - T1 - TC) : 0);
  }
  return { t: u, r, I, w, th, L: I * w, K: 0.5 * I * w * w, Ld: s.Id * w, Lm: p.m * r * r * w };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function check(p, { wText, kText }) {
  const s = system(p), w = parseNumber(wText), k = parseNumber(kText), ratio = s.Ii / s.If;
  const r = { wOk: false, kOk: false, wReason: null, kReason: null };
  if (!Number.isFinite(w)) r.wReason = 'unreadable';
  else if (near(w, s.wf)) r.wOk = true;
  else if (near(w, s.wi * s.If / s.Ii)) r.wReason = 'inverse';
  else if (near(w, s.wi)) r.wReason = 'same';
  else if (p.rf > 0 && near(w, s.wi * p.ri * p.ri / (p.rf * p.rf))) r.wReason = 'bodyOnly';
  else if (near(w, s.wi * (0.5 * p.M * p.R ** 2 * 2 + p.m * p.ri ** 2) / (p.M * p.R ** 2 + p.m * p.rf ** 2))) r.wReason = 'hoopI';
  else r.wReason = 'value';
  if (!Number.isFinite(k)) r.kReason = 'unreadable';
  else if (near(k, ratio)) r.kOk = true;
  else r.kReason = near(k, 1) ? 'conserved' : near(k, 1 / ratio) ? 'inverse' : near(k, ratio * ratio) ? 'square' : 'value';
  return { ...r, ok: r.wOk && r.kOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'M', label: '원판 질량', sym: '<i>M</i>', unit: 'kg', min: 2, max: 12, step: 0.5, value: 6 },
  { id: 'R', label: '원판 반지름', sym: '<i>R</i>', unit: 'm', min: 0.6, max: 1.5, step: 0.05, value: 1 },
  { id: 'm', label: '움직이는 물체 질량', sym: '<i>m</i>', unit: 'kg', min: 0.5, max: 3, step: 0.1, value: 1.5 },
  { id: 'ri', label: '처음 거리', sym: '<i>r</i><sub>i</sub>', unit: 'm', min: 0, max: 1.5, step: 0.05, value: 0.9, bounds: p => [0, p.R] },
  { id: 'rf', label: '나중 거리', sym: '<i>r</i><sub>f</sub>', unit: 'm', min: 0, max: 1.5, step: 0.05, value: 0.2, bounds: p => [0, p.R] },
  { id: 'w0', label: '처음 각속도', sym: '<i>ω</i><sub>i</sub>', unit: 'rad/s', min: 0.5, max: 3, step: 0.1, value: 1.5 },
];
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { ...stateAt(st.t, p), ...system(p) }; }
