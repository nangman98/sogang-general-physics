// 12.3 Elasticity — tension and compression, pure model (no DOM).
// A rod of radius R and length L is held at one end; a force F acts perpendicular to the other end face.
// Stress F/A (A = πR²), strain ΔL/L, F/A = E ΔL/L (Eq. 12.3.2). Values from Table 12.3.1.
// The table gives the strength of glass, concrete, wood and bone in compression, so those rods are pushed; the others
// are pulled. The force is limited so that the stress stays in the linear range: up to the yield strength S_y where
// the table lists one, otherwise up to the ultimate strength S_u.
// The run ramps the force from 0 to F over RUN seconds.
import { parseNumber } from '../../../core/format.js';

export const RUN = 3;          // s
// E in 10⁹ N/m², S_u and S_y in 10⁶ N/m² (Table 12.3.1).
export const MATERIALS = {
  steel: { label: '강철 (structural steel)', E: 200, Su: 400, Sy: 250, mode: 'tension' },
  aluminum: { label: '알루미늄 (aluminum)', E: 70, Su: 110, Sy: 95, mode: 'tension' },
  polystyrene: { label: '폴리스타이렌 (polystyrene)', E: 3, Su: 48, Sy: null, mode: 'tension' },
  glass: { label: '유리 (glass)', E: 65, Su: 50, Sy: null, mode: 'compression' },
  concrete: { label: '콘크리트 (concrete, 고강도)', E: 30, Su: 40, Sy: null, mode: 'compression' },
  wood: { label: '나무 (wood, Douglas fir)', E: 13, Su: 50, Sy: null, mode: 'compression' },
  bone: { label: '뼈 (bone)', E: 9, Su: 170, Sy: null, mode: 'compression' },
};
export const limit = mat => (MATERIALS[mat].Sy ?? MATERIALS[mat].Su) * 1e6;   // N/m², end of the linear range here

// p.R in mm, p.L in m, p.F in kN (slider units).
export function solve({ mat, R, L, F }) {
  const m = MATERIALS[mat], A = Math.PI * (R * 1e-3) ** 2, stress = F * 1e3 / A, E = m.E * 1e9;
  const strain = stress / E;
  return { A, stress, strain, dL: strain * L, E, Fmax: limit(mat) * A / 1e3, mode: m.mode };
}
export function stateAt(t, p) {
  const u = Math.min(Math.max(t, 0), RUN), s = solve({ ...p, F: p.F * u / RUN });
  return { t: u, Fnow: p.F * u / RUN, ...s };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
// sText in 10⁶ N/m², dText in mm.
export function check(p, { sText, dText }) {
  const s = solve(p), S = parseNumber(sText), D = parseNumber(dText), Smpa = s.stress / 1e6, Dmm = s.dL * 1e3;
  const r = { sOk: false, dOk: false, sReason: null, dReason: null };
  if (!Number.isFinite(S)) r.sReason = 'unreadable';
  else if (near(S, Smpa)) r.sOk = true;
  else r.sReason = near(S, Smpa / 4) ? 'diameter' : near(S, Smpa * Math.PI) ? 'noPi' : near(S, Smpa * 1e-3) || near(S, Smpa * 1e3) ? 'units' : 'value';
  if (!Number.isFinite(D)) r.dReason = 'unreadable';
  else if (near(D, Dmm)) r.dOk = true;
  else r.dReason = near(D, Dmm / p.L) ? 'noL' : near(D, Dmm * 1e-3) || near(D, Dmm * 1e3) ? 'units' : 'value';
  return { ...r, ok: r.sOk && r.dOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'mat', type: 'select', label: '재료', value: 'steel', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
  { id: 'R', label: '막대 반지름', sym: '<i>R</i>', unit: 'mm', min: 3, max: 15, step: 0.5, value: 8 },
  { id: 'L', label: '막대 길이', sym: '<i>L</i>', unit: 'm', min: 0.5, max: 2, step: 0.1, value: 1.2 },
  { id: 'F', label: '힘의 크기', sym: '<i>F</i>', unit: 'kN', min: 0, max: 180, step: 0.5, value: 40,
    bounds: p => [0, Math.floor(limit(p.mat) * Math.PI * (p.R * 1e-3) ** 2 / 1e3 / 0.5) * 0.5] },
];
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { mat: p.mat, ...stateAt(st.t, p) }; }
