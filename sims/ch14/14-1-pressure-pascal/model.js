// 14.2–14.4 Fluids at Rest, Measuring Pressure, Pascal's Principle — pure model (no DOM).
// Activities.
//   depth:     a pressure probe is lowered from the surface of an open tank to depth h. p = p0 + ρgh (Eq. 14.2.4);
//              gauge pressure p − p0 = ρgh. Densities from Table 14.1.1, p0 = 1 atm = 1.01 × 10⁵ Pa (Module 14.1 text).
//   hydraulic: hydraulic lever (Fig. 14.4.2). An input force F_i pushes the input piston (area A_i) down d_i.
//              F_o = F_i A_o/A_i (Eq. 14.4.3), d_o = d_i A_i/A_o (Eq. 14.4.4), W = F_o d_o = F_i d_i (Eq. 14.4.5).
// The run lowers the probe or pushes the piston at a steady rate over RUN seconds.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const P0 = 1.01e5;      // Pa
export const RUN = 3;          // s
export const LIQUIDS = {
  water: { label: '물 (20°C, 1 atm)', rho: 998 },
  seawater: { label: '바닷물 (20°C, 1 atm)', rho: 1024 },
  mercury: { label: '수은 (mercury)', rho: 13600 },
};

export function depth({ liquid, h }) {
  const rho = LIQUIDS[liquid].rho, gauge = rho * G * h;
  return { rho, gauge, p: P0 + gauge };
}
// Slider units: areas in cm², F_i in N, d_i in cm.
export function hydraulic({ Ai, Ao, Fi, di }) {
  return { Fo: Fi * Ao / Ai, do: di * Ai / Ao, W: Fi * di / 100, dp: Fi / (Ai * 1e-4) };
}
export function stateAt(t, p) {
  const u = Math.min(Math.max(t, 0), RUN), f = u / RUN;
  if (p.activity === 'hydraulic') { const s = hydraulic(p); return { ...s, doFull: s.do, t: u, f, di: p.di * f, do: s.do * f }; }
  const y = p.h * f; return { t: u, f, y, ...depth({ ...p, h: y }) };
}

// ---------- grading ---------- (pressures in kPa; force in N, distance in cm)
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkDepth(p, { gText, pText }) {
  const s = depth(p), g = parseNumber(gText), P = parseNumber(pText), gk = s.gauge / 1e3, pk = s.p / 1e3;
  const r = { gOk: false, pOk: false, gReason: null, pReason: null };
  if (!Number.isFinite(g)) r.gReason = 'unreadable';
  else if (near(g, gk)) r.gOk = true;
  else r.gReason = near(g, pk) ? 'absolute' : near(g, s.rho * p.h / 1e3) ? 'noG' : near(g, gk * 1e3) ? 'units' : 'value';
  if (!Number.isFinite(P)) r.pReason = 'unreadable';
  else if (near(P, pk)) r.pOk = true;
  else r.pReason = near(P, gk) ? 'noP0' : 'value';
  return { ...r, ok: r.gOk && r.pOk };
}
export function checkHydraulic(p, { FText, dText }) {
  const s = hydraulic(p), F = parseNumber(FText), D = parseNumber(dText);
  const r = { FOk: false, dOk: false, FReason: null, dReason: null };
  if (!Number.isFinite(F)) r.FReason = 'unreadable';
  else if (near(F, s.Fo)) r.FOk = true;
  else r.FReason = near(F, p.Fi * p.Ai / p.Ao) ? 'inverse' : near(F, p.Fi) ? 'same' : 'value';
  if (!Number.isFinite(D)) r.dReason = 'unreadable';
  else if (near(D, s.do)) r.dOk = true;
  else r.dReason = near(D, p.di * p.Ao / p.Ai) ? 'inverse' : near(D, p.di) ? 'same' : 'value';
  return { ...r, ok: r.FOk && r.dOk };
}

// ---------- model contract ----------
const isD = p => p.activity === 'depth';
const isH = p => p.activity === 'hydraulic';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'depth', options: [{ value: 'depth', label: '깊이와 압력' }, { value: 'hydraulic', label: '유압 지렛대' }] },
  { id: 'liquid', type: 'select', label: '액체', value: 'water', options: Object.entries(LIQUIDS).map(([value, l]) => ({ value, label: l.label })), showIf: isD },
  { id: 'h', label: '탐침의 깊이', sym: '<i>h</i>', unit: 'm', min: 0.5, max: 10, step: 0.5, value: 6, showIf: isD },
  { id: 'Ai', label: '입력 피스톤 넓이', sym: '<i>A</i><sub>i</sub>', unit: 'cm²', min: 5, max: 50, step: 5, value: 10, showIf: isH },
  { id: 'Ao', label: '출력 피스톤 넓이', sym: '<i>A</i><sub>o</sub>', unit: 'cm²', min: 50, max: 500, step: 10, value: 200, showIf: isH },
  { id: 'Fi', label: '입력 힘', sym: '<i>F</i><sub>i</sub>', unit: 'N', min: 10, max: 300, step: 10, value: 100, showIf: isH },
  { id: 'di', label: '입력 피스톤이 내려간 거리', sym: '<i>d</i><sub>i</sub>', unit: 'cm', min: 5, max: 40, step: 1, value: 20, showIf: isH },
];
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, ...stateAt(st.t, p) }; }
