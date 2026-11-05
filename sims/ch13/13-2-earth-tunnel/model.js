// 13.4 Gravitation Inside Earth — pure model (no DOM).
// A capsule of mass m falls from rest at the south pole through a tunnel to the north pole of a uniform,
// nonrotating Earth (Fig. 13.4.1). Inside, only the mass M_ins = M r³/R³ (Eq. 13.4.2) pulls: F = (GmM/R³) r (Eq. 13.4.3),
// F⃗ = −K r⃗ (Eq. 13.4.4), the form of Hooke's law. Outside, F = GmM/r² (Eq. 13.1.1).
// Motion along the tunnel axis y (north +): y(t) = −R cos ωt with ω = √(GM/R³), one round trip per run.
// Speed at the center from the work of a Hooke-law force (Eq. 7.4.6) and Eq. 7.2.8: ½mv² = ½KR², v = R√(K/m) = √(GM/R).
import { parseNumber } from '../../../core/format.js';

export const G = 6.67e-11;
export const EARTH = { M: 5.98e24, R: 6.37e6 };

export function force(m, r) {                                        // magnitude at distance r from the center
  const { M, R } = EARTH;
  return r <= R ? G * m * M * r / R ** 3 : G * m * M / (r * r);
}
export const insideMass = r => EARTH.M * Math.min(r / EARTH.R, 1) ** 3;
export function tunnel() {
  const { M, R } = EARTH, w = Math.sqrt(G * M / R ** 3);
  return { w, T: 2 * Math.PI / w, vc: w * R, gs: G * M / (R * R) };
}
export function stateAt(t, p) {
  const s = tunnel(), u = Math.min(Math.max(t, 0), s.T), y = -EARTH.R * Math.cos(s.w * u), vy = EARTH.R * s.w * Math.sin(s.w * u);
  return { t: u, y, vy, r: Math.abs(y), F: force(p.m, Math.abs(y)), Fy: -G * p.m * EARTH.M * y / EARTH.R ** 3, Mins: insideMass(Math.abs(y)) };
}

// ---------- grading ---------- (FText in N, vText in km/s)
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function check(p, { FText, vText }) {
  const s = tunnel(), r = p.q * EARTH.R, Fq = force(p.m, r), F = parseNumber(FText), V = parseNumber(vText);
  const out = { FOk: false, vOk: false, FReason: null, vReason: null };
  if (!Number.isFinite(F)) out.FReason = 'unreadable';
  else if (near(F, Fq)) out.FOk = true;
  else out.FReason = p.q > 0 && near(F, G * p.m * EARTH.M / (r * r)) ? 'allMass' : near(F, p.m * s.gs) && p.q < 0.99 ? 'surface' : 'value';
  if (!Number.isFinite(V)) out.vReason = 'unreadable';
  else if (near(V, s.vc / 1e3)) out.vOk = true;
  else out.vReason = near(V, Math.sqrt(2 * s.gs * EARTH.R) / 1e3) ? 'uniformG' : near(V, s.vc) ? 'units' : 'value';
  return { ...out, ok: out.FOk && out.vOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'm', label: '캡슐 질량', sym: '<i>m</i>', unit: 'kg', min: 50, max: 1000, step: 10, value: 200 },
  { id: 'q', label: '힘을 물을 위치 (중심에서, R 단위)', sym: '<i>r</i>/<i>R</i>', unit: '', min: 0, max: 1, step: 0.05, value: 0.4 },
];
export const duration = () => tunnel().T;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return stateAt(st.t, p); }
