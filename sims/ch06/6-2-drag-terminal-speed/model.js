// 6.2 The Drag Force and Terminal Speed — pure model (no DOM).
// A blunt ball falls from rest through air. Drag D = ½CρAv² (Eq. 6.2.1) points up, the gravitational force
// Fg = mg down. With +y up, D − Fg = ma (Eq. 6.2.2). The speed approaches the terminal speed
// vt = √(2Fg/(CρA)) (Eq. 6.2.3). Exact solution from rest: v = vt tanh(gt/vt), distance fallen
// s = (vt²/g) ln cosh(gt/vt), a = −g sech²(gt/vt).
// Activities.
//   fall:    one ball. Predict vt and the acceleration once vt is reached.
//   compare: a second ball with k_m times the mass and k_A times the area (same C). Predict vt2/vt1
//            (Sample Problem 6.2.1 is k_m = 1, k_A = 2).
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;          // m/s²
export const RHO = 1.21;       // kg/m³, air at 20 °C and 1 atm (textbook Table 14.1.1)
export const RUN = 3;          // a run lasts 3 vt/g of the faster ball (v reaches tanh 3 = 99.5 % of vt)

export const area = rcm => Math.PI * (rcm / 100) ** 2;          // m², circle of radius r (cm)
export const terminal = ({ m, C, A }, g = G, rho = RHO) => Math.sqrt(2 * m * g / (C * rho * A));
export const drag = ({ C, A }, v, rho = RHO) => 0.5 * C * rho * A * v * v;
// ln cosh x without overflow.
const lncosh = x => { const a = Math.abs(x); return a + Math.log1p(Math.exp(-2 * a)) - Math.LN2; };

// Bodies of the two activities.
export function bodies(p) {
  const one = { m: p.m, C: p.C, A: area(p.r) };
  if (p.activity !== 'compare') return [one];
  return [one, { m: p.m * p.km, C: p.C, A: one.A * p.kA }];
}

// State of a body at time t after release from rest.
export function fallAt(t, b, g = G) {
  const V = terminal(b, g), x = g * t / V, th = Math.tanh(x), sech2 = 1 - th * th;
  return { v: V * th, s: V * V / g * lncosh(x), D: b.m * g * th * th, ay: -g * sech2, vt: V, Fg: b.m * g };
}

// ---------- grading ----------
export const near = (x, y, rel = 0.02) => Math.abs(x - y) <= Math.max(rel * Math.abs(y), 0.01);

// fall: vt and the acceleration at terminal speed ('zero' | 'g' | 'half').
export function checkFall(p, { vText, accel }) {
  const b = bodies(p)[0], V = terminal(b), x = parseNumber(vText);
  const r = { vOk: false, aOk: accel === 'zero', vReason: null, aReason: null };
  if (!accel) r.aReason = 'empty';
  else if (!r.aOk) r.aReason = accel;
  if (!Number.isFinite(x)) r.vReason = 'unreadable';
  else if (near(x, V)) r.vOk = true;
  else if (near(x, V / Math.SQRT2)) r.vReason = 'noHalf';                // √(mg/(CρA)): the ½ left out
  else if (near(x, V * V)) r.vReason = 'noRoot';
  else if (near(x, V / 100) || near(x, V * 100)) r.vReason = 'cm';        // radius kept in cm
  else if (near(x, V * Math.sqrt(Math.PI)) || near(x, V / Math.sqrt(Math.PI))) r.vReason = 'area';
  else r.vReason = 'value';
  return { ...r, ok: r.vOk && r.aOk };
}

// compare: the ratio vt2/vt1 = √(k_m / k_A).
export const ratio = p => Math.sqrt(p.km / p.kA);
export function checkCompare(p, { rText }) {
  const R = ratio(p), x = parseNumber(rText);
  if (!Number.isFinite(x)) return { ok: false, reason: 'unreadable' };
  if (near(x, R)) return { ok: true, reason: null };
  if (near(x, p.km / p.kA)) return { ok: false, reason: 'linear' };
  if (near(x, 1 / R)) return { ok: false, reason: 'inverse' };
  if (p.km !== 1 && near(x, 1 / Math.sqrt(p.kA))) return { ok: false, reason: 'areaOnly' };
  if (p.kA !== 1 && near(x, Math.sqrt(p.km))) return { ok: false, reason: 'massOnly' };
  return { ok: false, reason: 'value' };
}

// ---------- model contract ----------
const isCompare = p => p.activity === 'compare';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'fall', options: [
    { value: 'fall', label: '낙하' }, { value: 'compare', label: '두 물체 비교' }] },
  { id: 'm', label: '질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 0.01, max: 0.5, step: 0.01, value: 0.15 },
  { id: 'r', label: '공의 반지름', sym: '<i>r</i>', unit: 'cm', min: 3, max: 15, step: 0.5, value: 4 },
  { id: 'C', label: '항력 계수 (drag coefficient)', sym: '<i>C</i>', min: 0.4, max: 1, step: 0.05, value: 0.5 },
  { id: 'km', label: '물체 2의 질량 배율', sym: '<i>m</i><sub>2</sub>/<i>m</i><sub>1</sub>', min: 0.5, max: 2, step: 0.25, value: 1, showIf: isCompare,
    format: v => `${v.toFixed(2)}배` },
  { id: 'kA', label: '물체 2의 넓이 배율', sym: '<i>A</i><sub>2</sub>/<i>A</i><sub>1</sub>', min: 0.5, max: 2, step: 0.25, value: 2, showIf: isCompare,
    format: v => `${v.toFixed(2)}배` },
];

export function duration(p) {
  return RUN * Math.max(...bodies(p).map(b => terminal(b))) / G;
}
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  const t = st.t;
  return { activity: p.activity, t, list: bodies(p).map(b => ({ ...fallAt(t, b), A: b.A, m: b.m })) };
}
