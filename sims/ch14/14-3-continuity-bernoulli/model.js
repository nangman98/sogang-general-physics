// 14.6–14.7 The Equation of Continuity, Bernoulli's Equation — pure model (no DOM).
// Water (ideal fluid, ρ = 998 kg/m³, Table 14.1.1) flows steadily through a pipe: a wide section (area A1, height 0)
// for 0 ≤ x ≤ X1, a taper that also rises by Δy for X1 ≤ x ≤ X2 (radius and height change linearly), and a narrow
// section (area A2, height Δy) for X2 ≤ x ≤ L.
// Continuity R_V = A1v1 = A2v2 (Eq. 14.6.3); Bernoulli p + ½ρv² + ρgy = constant (Eq. 14.7.2).
// Tracer particles move along the axis at the local speed R_V/A(x); their time to reach x is tabulated by
// integration and inverted by interpolation. One run is one passage through the pipe and the run loops.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8, RHO = 998;
export const X1 = 3, X2 = 5, L = 8;      // m
const GRID = 800;

// Slider units: A in cm², v1 in m/s, dy in m, p1 in kPa (gauge).
export function flow({ A1, A2, v1, dy, p1 }) {
  const R = A1 * 1e-4 * v1, v2 = R / (A2 * 1e-4);
  const p2 = p1 * 1e3 + 0.5 * RHO * (v1 * v1 - v2 * v2) - RHO * G * dy;
  return { R, v2, p2, dp: p1 * 1e3 - p2 };
}
export function shape(x, p) {               // centre height y, area A (m²) at x
  const r1 = Math.sqrt(p.A1 * 1e-4 / Math.PI), r2 = Math.sqrt(p.A2 * 1e-4 / Math.PI);
  const u = Math.min(Math.max((x - X1) / (X2 - X1), 0), 1), r = r1 + (r2 - r1) * u;
  return { y: p.dy * u, r, A: Math.PI * r * r, slope: x > X1 && x < X2 ? p.dy / (X2 - X1) : 0 };
}
// Pressure and speed at x from continuity and Bernoulli.
export function at_x(x, p) {
  const s = flow(p), sh = shape(x, p), v = s.R / sh.A;
  return { ...sh, v, p: p.p1 * 1e3 + 0.5 * RHO * (p.v1 ** 2 - v * v) - RHO * G * sh.y };
}
// Time to travel from x = 0 to x along the axis (path length includes the rise).
function table(p) {
  const s = flow(p), xs = [0], ts = [0];
  for (let i = 1; i <= GRID; i++) {
    const a = (i - 1) / GRID * L, b = i / GRID * L, m = (a + b) / 2, sh = shape(m, p);
    ts.push(ts[i - 1] + (b - a) * Math.hypot(1, sh.slope) * sh.A / s.R); xs.push(b);
  }
  return { xs, ts };
}
export function travelTime(p) { const t = table(p); return t.ts[GRID]; }
export function xAt(tau, p, tb = table(p)) {
  const { xs, ts } = tb, T = ts[GRID], u = ((tau % T) + T) % T;
  let lo = 0, hi = GRID;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ts[mid] <= u) lo = mid; else hi = mid; }
  return xs[lo] + (xs[hi] - xs[lo]) * (u - ts[lo]) / (ts[hi] - ts[lo]);
}
export const NP = 36;                      // tracer particles
export function particles(t, p, tb = table(p)) {
  const T = tb.ts[GRID];
  return Array.from({ length: NP }, (_, k) => xAt(t + k * T / NP, p, tb));
}

// ---------- grading ---------- (v2 in m/s, p2 in kPa gauge)
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function check(p, { vText, pText }) {
  const s = flow(p), v = parseNumber(vText), P = parseNumber(pText), pk = s.p2 / 1e3;
  const r = { vOk: false, pOk: false, vReason: null, pReason: null };
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, s.v2)) r.vOk = true;
  else r.vReason = near(v, p.v1 * p.A2 / p.A1) ? 'inverse' : near(v, p.v1) ? 'same' : 'value';
  if (!Number.isFinite(P)) r.pReason = 'unreadable';
  else if (near(P, pk)) r.pOk = true;
  else {
    const noY = (p.p1 * 1e3 + 0.5 * RHO * (p.v1 ** 2 - s.v2 ** 2)) / 1e3, sign = (p.p1 * 1e3 + s.dp) / 1e3;
    r.pReason = p.dy > 0 && near(P, noY) ? 'noHeight' : near(P, sign) ? 'sign' : near(P, p.p1) ? 'same' : 'value';
  }
  return { ...r, ok: r.vOk && r.pOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'A1', label: '넓은 관 넓이', sym: '<i>A</i><sub>1</sub>', unit: 'cm²', min: 20, max: 100, step: 5, value: 60 },
  { id: 'A2', label: '좁은 관 넓이', sym: '<i>A</i><sub>2</sub>', unit: 'cm²', min: 5, max: 100, step: 5, value: 20, bounds: p => [Math.ceil(p.A1 / 4 / 5) * 5, p.A1] },
  { id: 'v1', label: '넓은 관의 속력', sym: '<i>v</i><sub>1</sub>', unit: 'm/s', min: 0.5, max: 2.5, step: 0.1, value: 1 },
  { id: 'dy', label: '좁은 관이 올라간 높이', sym: 'Δ<i>y</i>', unit: 'm', min: 0, max: 2, step: 0.1, value: 0.5 },
  { id: 'p1', label: '넓은 관의 계기 압력', sym: '<i>p</i><sub>1</sub>', unit: 'kPa', min: 20, max: 100, step: 5, value: 50 },
];
export const duration = p => travelTime(p);
export const loop = () => true;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { t: st.t, ...flow(p), x: particles(st.t, p) }; }
