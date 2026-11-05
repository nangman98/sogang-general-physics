// 18.6 Heat Transfer Mechanisms — pure model (no DOM). Static screen: no run.
// Conduction P_cond = kA(T_H − T_C)/L (Eq. 18.6.1), R = L/k (Eq. 18.6.2). A composite slab in the steady state carries
// the same rate through every layer (Eq. 18.6.3); with layer 2 on the hot side and layer 1 on the cold side (Fig. 18.6.2)
// T_X = (k1L2T_C + k2L1T_H)/(k1L2 + k2L1) (Eq. 18.6.4) and P_cond = A(T_H − T_C)/(L1/k1 + L2/k2) (Eq. 18.6.5);
// any number of layers follows Eq. 18.6.6.
// Radiation P_rad = σεAT⁴ (Eq. 18.6.7), P_abs = σεAT_env⁴ (Eq. 18.6.8), P_net = σεA(T_env⁴ − T⁴) (Eq. 18.6.9),
// σ = 5.6704 × 10⁻⁸ W/m²·K⁴, temperatures in kelvins (T = T_C + 273.15, Eq. 18.2.1).
// Activities.
//   slab:  two layers between a hot and a cold reservoir. Predict P_cond and the interface temperature T_X.
//   rad:   a sphere of radius r (A = 4πr²) with emissivity ε at T in surroundings at T_env. Predict P_rad and P_net.
// Thermal conductivities from Table 18.6.1. The emissivity is a slider (the text gives no table of ε).
import { parseNumber } from '../../../core/format.js';

export const SIGMA = 5.6704e-8;
export const K0 = 273.15;
export const MATERIALS = {
  steel: { label: '스테인리스강 (Stainless steel)', k: 14 },
  lead: { label: '납 (Lead)', k: 35 },
  iron: { label: '철 (Iron)', k: 67 },
  brass: { label: '황동 (Brass)', k: 109 },
  aluminum: { label: '알루미늄 (Aluminum)', k: 235 },
  copper: { label: '구리 (Copper)', k: 401 },
  silver: { label: '은 (Silver)', k: 428 },
  air: { label: '건조한 공기 (Air, dry)', k: 0.026 },
  helium: { label: '헬륨 (Helium)', k: 0.15 },
  hydrogen: { label: '수소 (Hydrogen)', k: 0.18 },
  foam: { label: '폴리우레탄 폼 (Polyurethane foam)', k: 0.024 },
  rockwool: { label: '암면 (Rock wool)', k: 0.043 },
  fiberglass: { label: '유리 섬유 (Fiberglass)', k: 0.048 },
  pine: { label: '소나무 목재 (White pine)', k: 0.11 },
  glass: { label: '창유리 (Window glass)', k: 1.0 },
};

// ---------- conduction ----------
// layers from the hot face to the cold face, each { k, L } (SI). Returns the rate and the face temperatures.
export function layers(list, A, TH, TC) {
  const Rs = list.map(l => l.L / l.k), sum = Rs.reduce((s, r) => s + r, 0), P = A * (TH - TC) / sum;   // Eq. 18.6.6
  const T = [TH];
  for (const r of Rs) T.push(T[T.length - 1] - P * r / A);                                            // Eq. 18.6.1 per layer
  return { P, R: Rs, T };
}
// Slider units: L in cm, A in m², temperatures in °C.
export function slab({ m2, L2, m1, L1, A, TH, TC }) {
  const k2 = MATERIALS[m2].k, k1 = MATERIALS[m1].k, l2 = L2 / 100, l1 = L1 / 100;
  const s = layers([{ k: k2, L: l2 }, { k: k1, L: l1 }], A, TH, TC);
  return { k1, k2, l1, l2, R1: l1 / k1, R2: l2 / k2, P: s.P, TX: s.T[1] };
}

// ---------- radiation ----------
// Rates for emissivity eps, area A (m²), surface and surroundings temperatures in kelvins (Eqs. 18.6.7–18.6.9).
export function rates(eps, A, TK, EK, sigma = SIGMA) {
  const Prad = sigma * eps * A * TK ** 4, Pabs = sigma * eps * A * EK ** 4;
  return { Prad, Pabs, Pnet: Pabs - Prad };
}
// Slider units: r in cm, temperatures in °C.
export function radiation({ r, eps, T, Tenv }) {
  const A = 4 * Math.PI * (r / 100) ** 2, TK = T + K0, EK = Tenv + K0;
  return { A, TK, EK, ...rates(eps, A, TK, EK) };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkSlab(p, { PText, TText }) {        // P in W, T_X in °C
  const s = slab(p), P = parseNumber(PText), T = parseNumber(TText), dT = p.TH - p.TC;
  const r = { POk: false, TOk: false, PReason: null, TReason: null };
  if (!Number.isFinite(P)) r.PReason = 'unreadable';
  else if (near(P, s.P)) r.POk = true;
  else if (near(P, p.A * dT / s.R2) || near(P, p.A * dT / s.R1)) r.PReason = 'oneLayer';
  else if (near(P, (s.k1 + s.k2) * p.A * dT / (s.l1 + s.l2))) r.PReason = 'addK';
  else if (near(P, s.P / 100) || near(P, s.P * 100)) r.PReason = 'units';
  else r.PReason = 'value';
  if (!Number.isFinite(T)) r.TReason = 'unreadable';
  else if (near(T, s.TX)) r.TOk = true;
  else if (near(T, (p.TH + p.TC) / 2)) r.TReason = 'midpoint';
  else if (near(T, p.TH - dT * s.R1 / (s.R1 + s.R2))) r.TReason = 'swap';
  else if (near(T, s.TX + K0)) r.TReason = 'kelvin';
  else r.TReason = 'value';
  return { ...r, ok: r.POk && r.TOk };
}
export function checkRad(p, { RText, NText }) {        // W
  const s = radiation(p), R = parseNumber(RText), N = parseNumber(NText);
  const c = { A: s.A, f: p.eps * SIGMA * s.A };
  const r = { ROk: false, NOk: false, RReason: null, NReason: null };
  if (!Number.isFinite(R)) r.RReason = 'unreadable';
  else if (near(R, s.Prad)) r.ROk = true;
  else if (near(R, c.f * p.T ** 4)) r.RReason = 'celsius';
  else if (near(R, s.Prad / p.eps)) r.RReason = 'noEps';
  else if (near(R, SIGMA * p.eps * Math.PI * (p.r / 100) ** 2 * s.TK ** 4)) r.RReason = 'disk';
  else r.RReason = 'value';
  if (!Number.isFinite(N)) r.NReason = 'unreadable';
  else if (near(N, s.Pnet)) r.NOk = true;
  else if (s.Pnet !== 0 && near(N, -s.Pnet)) r.NReason = 'sign';
  else if (near(N, -s.Prad)) r.NReason = 'emitOnly';
  else if (near(N, c.f * (p.Tenv ** 4 - p.T ** 4))) r.NReason = 'celsius';
  else if (near(N, c.f * Math.sign(p.Tenv - p.T) * Math.abs(p.Tenv - p.T) ** 4)) r.NReason = 'diff4';
  else r.NReason = 'value';
  return { ...r, ok: r.ROk && r.NOk };
}

// ---------- model contract ----------
const isS = p => p.activity === 'slab';
const isR = p => p.activity === 'rad';
const matOpts = Object.entries(MATERIALS).map(([value, m]) => ({ value, label: `${m.label}, ${m.k}` }));
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'slab', options: [{ value: 'slab', label: '두 겹 판' }, { value: 'rad', label: '복사' }] },
  { id: 'm2', type: 'select', label: '뜨거운 쪽 층 2 (k, W/m·K)', value: 'pine', options: matOpts, showIf: isS },
  { id: 'L2', label: '층 2 두께', sym: '<i>L</i><sub>2</sub>', unit: 'cm', min: 0.5, max: 10, step: 0.5, value: 2, showIf: isS },
  { id: 'm1', type: 'select', label: '차가운 쪽 층 1 (k, W/m·K)', value: 'fiberglass', options: matOpts, showIf: isS },
  { id: 'L1', label: '층 1 두께', sym: '<i>L</i><sub>1</sub>', unit: 'cm', min: 0.5, max: 10, step: 0.5, value: 5, showIf: isS },
  { id: 'A', label: '판 넓이', sym: '<i>A</i>', unit: 'm²', min: 0.5, max: 10, step: 0.5, value: 4, showIf: isS },
  { id: 'TH', label: '뜨거운 쪽 온도', sym: '<i>T</i><sub>H</sub>', unit: '°C', min: 0, max: 40, step: 1, value: 22, showIf: isS },
  { id: 'TC', label: '차가운 쪽 온도', sym: '<i>T</i><sub>C</sub>', unit: '°C', min: -20, max: 20, step: 1, value: -5, showIf: isS, bounds: p => [-20, Math.min(20, p.TH - 1)] },
  { id: 'r', label: '공의 반지름', sym: '<i>r</i>', unit: 'cm', min: 2, max: 30, step: 1, value: 10, showIf: isR },
  { id: 'eps', label: '방사율 (emissivity)', sym: '<i>ε</i>', unit: '', min: 0.05, max: 1, step: 0.05, value: 0.7, showIf: isR },
  { id: 'T', label: '공의 표면 온도', sym: '<i>T</i>', unit: '°C', min: -50, max: 500, step: 5, value: 80, showIf: isR },
  { id: 'Tenv', label: '주위 온도', sym: '<i>T</i><sub>env</sub>', unit: '°C', min: -50, max: 100, step: 1, value: 20, showIf: isR },
];
export const init = () => ({ t: 0 });
export function observe(st, p) { return p.activity === 'rad' ? { activity: 'rad', ...radiation(p) } : { activity: 'slab', ...slab(p) }; }
