// 7.4–7.5 Work Done by a Spring Force and by a General Variable Force — pure model (no DOM).
// Activities.
//   spring: a block on a frictionless floor is tied to a spring (relaxed at x = 0). An applied force moves it
//           slowly from x_i to x_f, so K = 0 at both ends. Spring force F_x = −kx (Eq. 7.4.2). The spring does
//           W_s = ½k x_i² − ½k x_f² (Eq. 7.4.6) and the applied force W_a = −W_s (Eq. 7.4.9).
//   graph:  a force F(x) given as straight segments through nodes at x = 0, 2, 4, 6 m pushes a block that starts
//           at v_i. The work from 0 to 6 m is the area under the F–x graph (Eq. 7.5.8 as an area), and
//           K_f = K_i + W (Eq. 7.2.9). The node forces are not negative, so the block never stops.
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const NODES = [0, 2, 4, 6];     // m
export const SLOW = 3;                 // s, the applied force takes this long to move the spring block
export const kinetic = (m, v) => 0.5 * m * v * v;

// ---------- spring ----------
export const springForce = (k, x) => -k * x;                                       // Eq. 7.4.2
export const springWork = (k, xi, xf) => 0.5 * k * xi * xi - 0.5 * k * xf * xf;    // Eq. 7.4.6
// Pieces of the area from a to b (either order) split where F = 0, each with the work it adds along the motion.
export function springPieces(k, a, b) {
  const cuts = [a, ...(a * b < 0 ? [0] : []), b];
  const out = [];
  for (let i = 1; i < cuts.length; i++) {
    const u = cuts[i - 1], w = cuts[i];
    if (Math.abs(w - u) < 1e-12) continue;
    out.push({ from: u, to: w, f0: springForce(k, u), f1: springForce(k, w), work: springWork(k, u, w) });
  }
  return out;
}

// ---------- graph ----------
export const nodeForces = p => [p.F0, p.F2, p.F4, p.F6];
export function forceAt(x, p) {
  const F = nodeForces(p);
  if (x <= NODES[0]) return F[0];
  for (let i = 1; i < NODES.length; i++) if (x <= NODES[i]) return F[i - 1] + (F[i] - F[i - 1]) * (x - NODES[i - 1]) / (NODES[i] - NODES[i - 1]);
  return F[F.length - 1];
}
// Work from 0 to x: exact area of the straight segments (trapezoids).
export function workTo(x, p) {
  let W = 0;
  for (let i = 1; i < NODES.length && NODES[i - 1] < x; i++) {
    const a = NODES[i - 1], b = Math.min(NODES[i], x);
    W += 0.5 * (forceAt(a, p) + forceAt(b, p)) * (b - a);
  }
  return W;
}
export const graphWork = p => workTo(NODES[NODES.length - 1], p);
export const regions = p => NODES.slice(1).map((b, i) => {
  const a = NODES[i], f0 = forceAt(a, p), f1 = forceAt(b, p);
  return { t0: a, t1: b, f0, f1, area: 0.5 * (f0 + f1) * (b - a) };
});
export const speedAt = (x, p) => Math.sqrt(p.vi * p.vi + 2 * workTo(x, p) / p.m);
// Time to reach each x: t(x) = ∫ dx / v(x) on a fine grid (Simpson's rule per cell), then inverted by
// interpolation. v ≥ v_i > 0, so the integrand stays finite.
const GRID = 2000;
function timeTable(p) {
  const L = NODES[NODES.length - 1], h = L / GRID, ts = [0];
  for (let i = 1; i <= GRID; i++) {
    const a = (i - 1) * h, b = i * h, m = (a + b) / 2;
    ts.push(ts[i - 1] + h / 6 * (1 / speedAt(a, p) + 4 / speedAt(m, p) + 1 / speedAt(b, p)));
  }
  return { ts, h };
}
const cache = new Map();
function table(p) {
  const key = [p.m, p.vi, ...nodeForces(p)].join(',');
  if (!cache.has(key)) { if (cache.size > 50) cache.clear(); cache.set(key, timeTable(p)); }
  return cache.get(key);
}
export function graphAt(t, p) {
  const { ts, h } = table(p), T = ts[GRID];
  if (t >= T) return NODES[NODES.length - 1];
  let lo = 0, hi = GRID;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ts[mid] <= t) lo = mid; else hi = mid; }
  return (lo + (t - ts[lo]) / (ts[hi] - ts[lo])) * h;
}
export const graphDuration = p => table(p).ts[GRID];

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.001);
export function checkSpring(p, { sText, aText }) {
  const Ws = springWork(p.k, p.xi, p.xf), s = parseNumber(sText), a = parseNumber(aText);
  const r = { sOk: false, aOk: false, sReason: null, aReason: null };
  if (!Number.isFinite(s)) r.sReason = 'unreadable';
  else if (near(s, Ws)) r.sOk = true;
  else if (Math.abs(Ws) > 1e-12 && near(s, -Ws)) r.sReason = 'sign';
  else if (near(s, -0.5 * p.k * (p.xf - p.xi) ** 2) || near(s, 0.5 * p.k * (p.xf - p.xi) ** 2)) r.sReason = 'delta';
  else if (near(s, 2 * Ws)) r.sReason = 'noHalf';
  else r.sReason = 'value';
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, -Ws)) r.aOk = true;
  else r.aReason = Math.abs(Ws) > 1e-12 && near(a, Ws) ? 'same' : 'value';
  return { ...r, ok: r.sOk && r.aOk };
}
export function checkGraph(p, { WText, vText }) {
  const W = graphWork(p), vf = speedAt(NODES[NODES.length - 1], p), w = parseNumber(WText), v = parseNumber(vText);
  const r = { WOk: false, vOk: false, WReason: null, vReason: null };
  if (!Number.isFinite(w)) r.WReason = 'unreadable';
  else if (near(w, W)) r.WOk = true;
  else {
    const F = nodeForces(p), rect = F.slice(1).reduce((s, f) => s + 2 * f, 0), rectL = F.slice(0, -1).reduce((s, f) => s + 2 * f, 0);
    r.WReason = near(w, rect) || near(w, rectL) ? 'rectangles' : near(w, 6 * Math.max(...F)) ? 'peak' : 'value';
  }
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, vf)) r.vOk = true;
  else r.vReason = near(v, Math.sqrt(2 * W / p.m)) ? 'noKi' : near(v, p.vi + Math.sqrt(2 * W / p.m)) ? 'addSpeeds' : 'value';
  return { ...r, ok: r.WOk && r.vOk };
}

// ---------- model contract ----------
const isSpring = p => p.activity === 'spring';
const isGraph = p => p.activity === 'graph';
const node = (id, x, value) => ({ id, label: `<i>x</i> = ${x} m의 힘`, sym: `<i>F</i>(${x})`, unit: 'N', min: 0, max: 12, step: 0.5, value, showIf: isGraph });
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'spring', options: [{ value: 'spring', label: '용수철' }, { value: 'graph', label: '그래프 넓이' }] },
  { id: 'k', label: '용수철 상수 (spring constant)', sym: '<i>k</i>', unit: 'N/m', min: 50, max: 500, step: 10, value: 200, showIf: isSpring },
  { id: 'xi', label: '처음 위치', sym: '<i>x</i><sub>i</sub>', unit: 'm', min: -0.3, max: 0.3, step: 0.01, value: 0, showIf: isSpring },
  { id: 'xf', label: '나중 위치', sym: '<i>x</i><sub>f</sub>', unit: 'm', min: -0.3, max: 0.3, step: 0.01, value: 0.2, showIf: isSpring },
  { id: 'm', label: '블록 질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 2, showIf: isGraph },
  { id: 'vi', label: '처음 속력', sym: '<i>v</i><sub>i</sub>', unit: 'm/s', min: 0.5, max: 4, step: 0.5, value: 2, showIf: isGraph },
  node('F0', 0, 2), node('F2', 2, 8), node('F4', 4, 8), node('F6', 6, 3),
];

export function duration(p) { return p.activity === 'graph' ? graphDuration(p) : SLOW; }
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  const t = st.t;
  if (p.activity === 'graph') {
    const x = graphAt(t, p);
    return { activity: 'graph', t, x, F: forceAt(x, p), W: workTo(x, p), v: speedAt(x, p), Ki: kinetic(p.m, p.vi), K: kinetic(p.m, speedAt(x, p)) };
  }
  const x = p.xi + (p.xf - p.xi) * Math.min(1, t / SLOW);
  const Ws = springWork(p.k, p.xi, x);
  return { activity: 'spring', t, x, Fs: springForce(p.k, x), Fa: -springForce(p.k, x), Ws, Wa: -Ws };
}
