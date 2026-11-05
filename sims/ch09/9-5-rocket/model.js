// 9.9 Systems with Varying Mass: A Rocket — pure model (no DOM).
// A rocket in deep space (no gravity, no drag) burns fuel at a constant rate R; exhaust leaves at v_rel relative to
// the rocket. First rocket equation R v_rel = M a (Eq. 9.9.6), so the thrust is T = R v_rel. Second rocket equation
// v_f − v_i = v_rel ln(M_i/M_f) (Eq. 9.9.7). With M(t) = M_i − R t during the burn:
//   v(t) = v_rel ln(M_i/M(t)),  x(t) = (v_rel/R)[(M_i − M) − M ln(M_i/M)]   (v_i = 0, x_i = 0).
// After the burn the rocket coasts. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const COAST = 20;        // s of physical time shown after burnout

export const burnTime = ({ Mi, Mf, R }) => (Mi - Mf) / R;
export const thrust = ({ R, vrel }) => R * vrel;                          // Eq. 9.9.6
export const deltaV = ({ Mi, Mf, vrel }) => vrel * Math.log(Mi / Mf);     // Eq. 9.9.7
export function stateAt(t, p) {
  const tb = burnTime(p), tt = Math.max(0, t);
  const burning = tt < tb, u = Math.min(tt, tb), M = p.Mi - p.R * u;
  const v = p.vrel * Math.log(p.Mi / M);
  const xb = (p.vrel / p.R) * ((p.Mi - M) - M * Math.log(p.Mi / M));
  return { t: tt, M, v, x: xb + (burning ? 0 : v * (tt - tb)), a: burning ? thrust(p) / M : 0, burning, T: burning ? thrust(p) : 0 };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function check(p, { aText, vText }) {
  const a0 = thrust(p) / p.Mi, dv = deltaV(p), a = parseNumber(aText), v = parseNumber(vText);
  const r = { aOk: false, vOk: false, aReason: null, vReason: null };
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, a0)) r.aOk = true;
  else r.aReason = near(a, thrust(p) / p.Mf) ? 'final' : near(a, p.vrel / p.Mi) ? 'noRate' : 'value';
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, dv)) r.vOk = true;
  else r.vReason = near(v, p.vrel * Math.log10(p.Mi / p.Mf)) ? 'log10' : near(v, p.vrel * (p.Mi - p.Mf) / p.Mi) ? 'linear' : near(v, p.vrel * (p.Mi / p.Mf)) ? 'noLog' : near(v, p.vrel * (p.Mi - p.Mf) / p.Mf) ? 'linear' : 'value';
  return { ...r, ok: r.aOk && r.vOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'Mi', label: '처음 질량', sym: '<i>M</i><sub>i</sub>', unit: 'kg', min: 500, max: 2000, step: 50, value: 1000 },
  { id: 'Mf', label: '연료를 다 태운 질량', sym: '<i>M</i><sub>f</sub>', unit: 'kg', min: 100, max: 1900, step: 50, value: 400, bounds: p => [Math.max(100, Math.ceil(0.15 * p.Mi / 50) * 50), p.Mi - 100] },
  { id: 'R', label: '연료 소모율', sym: '<i>R</i>', unit: 'kg/s', min: 10, max: 50, step: 1, value: 20 },
  { id: 'vrel', label: '배기 속력 (상대)', sym: '<i>v</i><sub>rel</sub>', unit: 'm/s', min: 1000, max: 4000, step: 100, value: 2500 },
];
export function duration(p) { return burnTime(p) + COAST; }
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { ...stateAt(st.t, p), tb: burnTime(p) }; }
