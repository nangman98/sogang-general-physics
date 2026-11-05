// 18.4 Absorption of Heat — pure model (no DOM).
// Q = cm(T_f − T_i) (Eq. 18.4.3), Q = Lm (Eq. 18.4.5), L_V = 2256 kJ/kg (Eq. 18.4.6), L_F = 333 kJ/kg (Eq. 18.4.7).
// Activities.
//   curve: ice of mass m at T_i < 0°C is heated at the steps of LO 18.4.9 (warm the ice to 0°C, melt it, warm the
//          water) to T_f, or on to 100°C and boiled away. Predict the total heat Q and the step that takes the most.
//   mix:   a hot solid (mass m_s, T_s) is dropped into water (m_w, T_w) in a cup whose heat capacity is ignored.
//          The isolated system's transfers add to zero (Eq. 18.4.11 with two bodies), so
//          T_f = (c_s m_s T_s + c_w m_w T_w)/(c_s m_s + c_w m_w) (Eq. 18.4.12 form without the beaker).
//          Predict T_f and the heat Q absorbed by the water.
// Specific heats from Table 18.4.1 (J/kg·K), heats of transformation and phase-change points from Table 18.4.2.
// The table gives the ice value at −10°C; it is used from −40°C to 0°C. Steam has no specific heat in the text, so
// the curve stops when the last water has boiled at 100°C. The playback runs along the transferred heat Q, not time.
import { parseNumber } from '../../../core/format.js';

export const C_ICE = 2220, C_WATER = 4187;          // J/kg·K, Table 18.4.1
export const LF = 333e3, LV = 2256e3;               // J/kg, Table 18.4.2
export const T_MELT = 0, T_BOIL = 100;              // °C (273 K and 373 K in Table 18.4.2)
export const SOLIDS = {
  lead: { label: '납 (Lead)', c: 128 },
  tungsten: { label: '텅스텐 (Tungsten)', c: 134 },
  silver: { label: '은 (Silver)', c: 236 },
  copper: { label: '구리 (Copper)', c: 386 },
  aluminum: { label: '알루미늄 (Aluminum)', c: 900 },
  brass: { label: '황동 (Brass)', c: 380 },
  granite: { label: '화강암 (Granite)', c: 790 },
  glass: { label: '유리 (Glass)', c: 840 },
};
export const RUN = 4;                               // s of playback

// ---------- heating curve ---------- (m in g, temperatures in °C, heats in J)
export function curve({ m, Ti, Tf, boil }, { cIce = C_ICE, cWater = C_WATER } = {}) {
  const kg = m / 1000, Tend = boil ? T_BOIL : Tf;
  const steps = [
    { id: 'ice', Q: cIce * kg * (T_MELT - Ti) },
    { id: 'melt', Q: LF * kg },
    { id: 'water', Q: cWater * kg * (Tend - T_MELT) },
  ];
  if (boil) steps.push({ id: 'boil', Q: LV * kg });
  let acc = 0;
  for (const s of steps) { s.Q0 = acc; acc += s.Q; s.Q1 = acc; }
  const most = steps.reduce((a, b) => (b.Q > a.Q ? b : a)).id;
  return { kg, Tend, steps, Q: acc, most, cIce, cWater, Ti, boil: !!boil };
}
// State after the heat Q (J) has been added: temperature and the masses of ice, water and steam (kg).
export function curveAt(Q, p, opts) {
  const c = curve(p, opts), q = Math.min(Math.max(Q, 0), c.Q), [s1, s2, s3, s4] = c.steps;
  if (q <= s1.Q1) return { Q: q, T: c.Ti + q / (c.cIce * c.kg), ice: c.kg, water: 0, steam: 0, step: 'ice' };
  if (q <= s2.Q1) { const w = (q - s2.Q0) / LF; return { Q: q, T: T_MELT, ice: c.kg - w, water: w, steam: 0, step: 'melt' }; }
  if (q <= s3.Q1) return { Q: q, T: T_MELT + (q - s3.Q0) / (c.cWater * c.kg), ice: 0, water: c.kg, steam: 0, step: 'water' };
  const v = (q - s4.Q0) / LV;
  return { Q: q, T: T_BOIL, ice: 0, water: c.kg - v, steam: v, step: 'boil' };
}

// ---------- thermal equilibrium ---------- bodies [{ C, T }] with heat capacity C = cm.
export function equilibrium(bodies) {
  const Tf = bodies.reduce((s, b) => s + b.C * b.T, 0) / bodies.reduce((s, b) => s + b.C, 0);
  return { Tf, Q: bodies.map(b => b.C * (Tf - b.T)) };            // Q > 0: absorbed (Eq. 18.4.2)
}
export function mix({ solid, ms, Ts, mw, Tw }) {
  const cs = SOLIDS[solid].c, Cs = cs * ms / 1000, Cw = C_WATER * mw / 1000;
  const e = equilibrium([{ C: Cs, T: Ts }, { C: Cw, T: Tw }]);
  return { cs, Cs, Cw, Tf: e.Tf, Qw: e.Q[1], Qs: e.Q[0] };
}
export function mixAt(Q, p) {
  const s = mix(p), q = Math.min(Math.max(Q, 0), s.Qw);
  return { Q: q, Ts: p.Ts - q / s.Cs, Tw: p.Tw + q / s.Cw };
}

export function duration() { return RUN; }
export function stateAt(t, p) {
  const u = Math.min(Math.max(t, 0), RUN) / RUN;
  if (p.activity === 'mix') return { t: u * RUN, u, ...mixAt(u * mix(p).Qw, p) };
  return { t: u * RUN, u, ...curveAt(u * curve(p).Q, p) };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkCurve(p, { QText, most }) {       // Q in kJ
  const c = curve(p), x = parseNumber(QText), kJ = c.Q / 1000, [s1, s2] = c.steps;
  const r = { QOk: false, mostOk: most === c.most, QReason: null, mostReason: most ? null : 'none' };
  if (!Number.isFinite(x)) r.QReason = 'unreadable';
  else if (near(x, kJ)) r.QOk = true;
  else if (near(x, kJ - s2.Q / 1000 - (c.boil ? LV * c.kg / 1000 : 0))) r.QReason = 'noLatent';
  else if (c.boil && near(x, kJ - LV * c.kg / 1000)) r.QReason = 'noVapor';
  else if (near(x, kJ - s1.Q / 1000)) r.QReason = 'noIce';
  else if (near(x, kJ - s1.Q / 1000 + C_WATER * c.kg * (T_MELT - p.Ti) / 1000)) r.QReason = 'oneC';
  else if (!c.boil && near(x, kJ + (LV - LF) * c.kg / 1000)) r.QReason = 'swapL';
  else if (near(x, c.Q)) r.QReason = 'units';
  else r.QReason = 'value';
  return { ...r, ok: r.QOk && r.mostOk };
}
export function checkMix(p, { TText, QText }) {        // T in °C, Q in kJ
  const s = mix(p), T = parseNumber(TText), Q = parseNumber(QText), kJ = s.Qw / 1000;
  const r = { TOk: false, QOk: false, TReason: null, QReason: null };
  if (!Number.isFinite(T)) r.TReason = 'unreadable';
  else if (near(T, s.Tf)) r.TOk = true;
  else if (near(T, (p.Ts + p.Tw) / 2)) r.TReason = 'average';
  else if (near(T, (p.ms * p.Ts + p.mw * p.Tw) / (p.ms + p.mw))) r.TReason = 'massOnly';
  else if (near(T, (s.cs * p.Ts + C_WATER * p.Tw) / (s.cs + C_WATER))) r.TReason = 'noMass';
  else if (near(T, (C_WATER * p.ms * p.Ts + s.cs * p.mw * p.Tw) / (C_WATER * p.ms + s.cs * p.mw))) r.TReason = 'swapC';
  else if (near(T, s.Tf + 273.15)) r.TReason = 'kelvin';
  else r.TReason = 'value';
  if (!Number.isFinite(Q)) r.QReason = 'unreadable';
  else if (near(Q, kJ)) r.QOk = true;
  else if (near(Q, -kJ)) r.QReason = 'sign';
  else if (near(Q, s.Cs * (p.Ts - p.Tw) / 1000)) r.QReason = 'solidAll';
  else if (near(Q, s.Qw)) r.QReason = 'units';
  else r.QReason = 'value';
  return { ...r, ok: r.TOk && r.QOk };
}

// ---------- model contract ----------
const isK = p => p.activity === 'curve';
const isM = p => p.activity === 'mix';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'curve', options: [{ value: 'curve', label: '가열 곡선' }, { value: 'mix', label: '열평형' }] },
  { id: 'm', label: '얼음 질량', sym: '<i>m</i>', unit: 'g', min: 50, max: 500, step: 10, value: 250, showIf: isK },
  { id: 'Ti', label: '얼음의 처음 온도', sym: '<i>T</i><sub>i</sub>', unit: '°C', min: -40, max: -2, step: 1, value: -20, showIf: isK },
  { id: 'boil', type: 'check', label: '100 °C에서 모두 끓인다 (vaporize)', value: false, showIf: isK },
  { id: 'Tf', label: '물의 나중 온도', sym: '<i>T</i><sub>f</sub>', unit: '°C', min: 2, max: 99, step: 1, value: 40, showIf: p => isK(p) && !p.boil },
  { id: 'solid', type: 'select', label: '고체 (Table 18.4.1)', value: 'aluminum', options: Object.entries(SOLIDS).map(([value, s]) => ({ value, label: s.label })), showIf: isM },
  { id: 'ms', label: '고체 질량', sym: '<i>m</i><sub>s</sub>', unit: 'g', min: 50, max: 300, step: 10, value: 200, showIf: isM },
  { id: 'Ts', label: '고체의 처음 온도', sym: '<i>T</i><sub>s</sub>', unit: '°C', min: 50, max: 250, step: 5, value: 150, showIf: isM },
  { id: 'mw', label: '물 질량', sym: '<i>m</i><sub>w</sub>', unit: 'g', min: 200, max: 600, step: 10, value: 300, showIf: isM },
  { id: 'Tw', label: '물의 처음 온도', sym: '<i>T</i><sub>w</sub>', unit: '°C', min: 5, max: 40, step: 1, value: 20, showIf: isM },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, ...stateAt(st.t, p) }; }
