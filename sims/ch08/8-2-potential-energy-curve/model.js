// 8.3 Reading a Potential Energy Curve — pure model (no DOM).
// A particle of mass MASS moves along x under a conservative force F(x) = −dU/dx (Eq. 8.3.2). E_mec = U + K is
// fixed (Eq. 8.3.3), so K(x) = E_mec − U(x) (Eq. 8.3.4) and the particle turns where U = E_mec.
// U(x) is a C¹ cubic Hermite curve through set points: a wall on the left, a well with its minimum at x = 2.5 m
// (stable equilibrium), a hump with its maximum at x = 5.0 m (unstable), and a flat run from 6.3 m on (neutral).
// Each piece is monotone between its ends (Fritsch–Carlson condition), so these are the only equilibria.
// Motion: x'' = F(x)/m by RK4 with 1 ms steps, stored once and read with cubic Hermite interpolation.
// Activities.
//   energy:      start at the well bottom moving +x, E_mec set by the slider. Predict whether the particle passes
//                the hump and its K at x = XM.
//   equilibrium: start at point A, B or C with a small push. Predict stable, unstable or neutral.
import { parseNumber } from '../../../core/format.js';

export const MASS = 2;         // kg
export const XM = 4;           // m, marked point for the K question
export const XMAX = 8.5;       // m, right end of the board; the run ends past it
export const RUN = 14;         // s
export const PUSH = 0.4;       // m/s, the small push in the equilibrium activity
export const POINTS = { A: 2.5, B: 5.0, C: 7.3 };
export const KIND = { A: 'stable', B: 'unstable', C: 'neutral' };
// Set points [x (m), U (J), dU/dx (J/m)].
const NODES = [[0, 12, -20], [1.2, 1, -6], [2.5, -4, 0], [5.0, 3, 0], [6.3, 1, 0], [XMAX, 1, 0]];

export function U(x) {
  if (x <= 0) return 12 - 20 * x;
  if (x >= NODES[NODES.length - 1][0]) return 1;
  let i = 1; while (x > NODES[i][0]) i++;
  const [x0, u0, m0] = NODES[i - 1], [x1, u1, m1] = NODES[i], h = x1 - x0, s = (x - x0) / h;
  return (2 * s ** 3 - 3 * s * s + 1) * u0 + (s ** 3 - 2 * s * s + s) * h * m0 + (-2 * s ** 3 + 3 * s * s) * u1 + (s ** 3 - s * s) * h * m1;
}
export function dU(x) {
  if (x <= 0) return -20;
  if (x >= NODES[NODES.length - 1][0]) return 0;
  let i = 1; while (x > NODES[i][0]) i++;
  const [x0, u0, m0] = NODES[i - 1], [x1, u1, m1] = NODES[i], h = x1 - x0, s = (x - x0) / h;
  return ((6 * s * s - 6 * s) * u0 + (3 * s * s - 4 * s + 1) * h * m0 + (-6 * s * s + 6 * s) * u1 + (3 * s * s - 2 * s) * h * m1) / h;
}
export const force = x => -dU(x);                                         // Eq. 8.3.2

// Where U = E on [a, b] (U monotone there), by bisection; null when E is outside the range.
function cross(E, a, b) {
  const fa = U(a) - E, fb = U(b) - E;
  if (fa * fb > 0) return null;
  let lo = a, hi = b;
  for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if ((U(mid) - E) * fa > 0) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
// Turning points for the energy activity (the particle starts in the well).
export function turning(E) {
  const left = cross(E, -1, 2.5), right = E < U(5.0) ? cross(E, 2.5, 5.0) : null;
  return { left, right, passes: E > U(5.0) };
}

export function start(p) {
  if (p.activity === 'equilibrium') return { x: POINTS[p.point], v: PUSH };
  return { x: POINTS.A, v: Math.sqrt(2 * (p.E - U(POINTS.A)) / MASS) };
}
export const energyOf = p => { const s = start(p); return U(s.x) + 0.5 * MASS * s.v * s.v; };

const DT = 1e-3, cache = new Map();
function table(p) {
  const s = start(p), key = [s.x, s.v].join(',');
  if (cache.has(key)) return cache.get(key);
  const n = Math.round(RUN / DT), xs = [s.x], vs = [s.v];
  const a = x => force(x) / MASS;
  let end = n;
  for (let i = 0; i < n; i++) {
    const x = xs[i], v = vs[i];
    const k1x = v, k1v = a(x), k2x = v + DT / 2 * k1v, k2v = a(x + DT / 2 * k1x);
    const k3x = v + DT / 2 * k2v, k3v = a(x + DT / 2 * k2x), k4x = v + DT * k3v, k4v = a(x + DT * k3x);
    xs.push(x + DT / 6 * (k1x + 2 * k2x + 2 * k3x + k4x)); vs.push(v + DT / 6 * (k1v + 2 * k2v + 2 * k3v + k4v));
    if (xs[i + 1] > XMAX + 0.3) { end = i + 1; break; }
  }
  const out = { xs, vs, T: end * DT };
  if (cache.size > 30) cache.clear();
  cache.set(key, out); return out;
}
export function stateAt(t, p) {
  const { xs, vs, T } = table(p), tt = Math.min(Math.max(t, 0), T), i = Math.min(xs.length - 2, Math.floor(tt / DT)), s = tt / DT - i;
  const h00 = 2 * s ** 3 - 3 * s * s + 1, h10 = s ** 3 - 2 * s * s + s, h01 = -2 * s ** 3 + 3 * s * s, h11 = s ** 3 - s * s;
  const x = h00 * xs[i] + h10 * DT * vs[i] + h01 * xs[i + 1] + h11 * DT * vs[i + 1];
  const v = h00 * vs[i] + h10 * DT * force(xs[i]) / MASS + h01 * vs[i + 1] + h11 * DT * force(xs[i + 1]) / MASS;
  return { x, v, U: U(x), K: 0.5 * MASS * v * v, F: force(x) };
}

// ---------- grading ----------
export function checkEnergy(p, { pass, KText }) {
  const E = p.E, tp = turning(E), reach = E >= U(XM), Km = reach ? E - U(XM) : 0, k = parseNumber(KText);
  const r = { passOk: pass === (tp.passes ? 'pass' : 'back'), KOk: false, passReason: null, KReason: null };
  if (!pass) r.passReason = 'empty'; else if (!r.passOk) r.passReason = 'wrong';
  if (!Number.isFinite(k)) r.KReason = 'unreadable';
  else if (Math.abs(k - Km) <= Math.max(0.02 * Math.abs(Km), 0.05)) r.KOk = true;
  else r.KReason = !reach ? 'unreachable' : Math.abs(k - U(XM)) <= 0.05 ? 'U' : Math.abs(k - E) <= 0.05 ? 'E' : Math.abs(k - (E + U(XM))) <= 0.05 ? 'sum' : 'value';
  return { ...r, ok: r.passOk && r.KOk };
}
export const checkEquilibrium = (p, kind) => ({ ok: kind === KIND[p.point], reason: kind ? (kind === KIND[p.point] ? null : kind) : 'empty' });

// ---------- model contract ----------
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'energy', options: [{ value: 'energy', label: '에너지 선 읽기' }, { value: 'equilibrium', label: '평형' }] },
  { id: 'E', label: '역학적 에너지', sym: '<i>E</i><sub>mec</sub>', unit: 'J', min: -3.5, max: 8, step: 0.5, value: 2, showIf: p => p.activity === 'energy' },
  { id: 'point', type: 'select', label: '출발점', value: 'A', showIf: p => p.activity === 'equilibrium', options: [{ value: 'A', label: '점 A' }, { value: 'B', label: '점 B' }, { value: 'C', label: '점 C' }] },
];
export const duration = p => table(p).T;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, t: st.t, E: energyOf(p), ...stateAt(st.t, p) }; }
