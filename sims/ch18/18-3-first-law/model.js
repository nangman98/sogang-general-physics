// 18.5 The First Law of Thermodynamics — pure model (no DOM).
// W = ∫ p dV (Eq. 18.5.2), ΔE_int = Q − W (Eq. 18.5.3), cyclical process ΔE_int = 0 and Q = W (Eq. 18.5.7).
// The gas goes between states on straight segments of the p–V diagram, slowly (always in equilibrium, Fig. 18.5.1).
// On a segment from (V0, p0) to (V1, p1) at fraction u: V = V0 + u(V1 − V0), p = p0 + u(p1 − p0) and
// W(u) = (V1 − V0)[p0u + (p1 − p0)u²/2], the area under the segment (Eq. 18.5.2; LO 18.5.3).
// To give every path one consistent ΔE_int the gas is a monatomic ideal gas: pV = nRT (Eq. 19.2.1) and
// E_int = (3/2)nRT (Eq. 19.7.2) give E_int = (3/2)pV. The student never needs this: the screen gives the heat on a
// reference path, and Q − W is the same for every path (Module 18.5). Q on a path is ΔE_int + W (Eq. 18.5.3).
// Units on the screen: p in kPa and V in L, so p·V comes out in J (1 kPa·L = 1 J).
// Activities.
//   path:  states i = (V_i, p_i) and f = (V_f, p_f). Reference path iaf (constant p_i, then constant V_f) with its heat
//          Q_iaf given. Predict W and Q on path ibf (constant V_i, then constant p_f) or on the straight line if.
//   cycle: the rectangle i, a = (V_f, p_i), f, b = (V_i, p_f) run as iafbi or ibfai. Predict the net W and Q.
import { parseNumber } from '../../../core/format.js';

export const RUN = { path: 3, cycle: 4 };           // s of playback (the process is slow; this is not its time)
export const E = (V, p) => 1.5 * p * V;             // J, monatomic ideal gas with p in kPa and V in L

export function corners({ pi, Vi, pf, Vf }) {
  return { i: [Vi, pi], a: [Vf, pi], f: [Vf, pf], b: [Vi, pf] };
}
// Points [V, p] of a named path.
export function pathPoints(name, p) {
  const c = corners(p);
  return name.split('').map(k => c[k]);
}
// Work, change in internal energy and heat of one segment, from its start to fraction u.
export function segment([V0, p0], [V1, p1], u = 1) {
  const V = V0 + u * (V1 - V0), pr = p0 + u * (p1 - p0);
  const W = (V1 - V0) * (p0 * u + (p1 - p0) * u * u / 2), dE = E(V, pr) - E(V0, p0);
  // dQ/du = dE/du + dW/du, for the direction of the heat arrow.
  const rate = 1.5 * ((p1 - p0) * V + pr * (V1 - V0)) + pr * (V1 - V0);
  return { V, p: pr, W, dE, Q: dE + W, rate };
}
// Totals along a whole path.
export function along(pts) {
  let W = 0, dE = 0;
  const segs = [];
  for (let k = 1; k < pts.length; k++) {
    const s = segment(pts[k - 1], pts[k]);
    segs.push(s); W += s.W; dE += s.dE;
  }
  return { W, dE, Q: dE + W, segs };
}
// State at fraction s of the whole path (each segment takes an equal share).
export function alongAt(pts, s) {
  const n = pts.length - 1, x = Math.min(Math.max(s, 0), 1) * n, k = Math.min(Math.floor(x), n - 1), u = x - k;
  let W = 0, dE = 0;
  for (let j = 0; j < k; j++) { const t = segment(pts[j], pts[j + 1]); W += t.W; dE += t.dE; }
  const t = segment(pts[k], pts[k + 1], u);
  return { V: t.V, p: t.p, W: W + t.W, dE: dE + t.dE, Q: dE + t.dE + W + t.W, rate: t.rate, seg: k, u };
}

export function problem(p) {
  const ref = along(pathPoints('iaf', p));
  if (p.activity === 'cycle') {
    const pts = pathPoints(p.dir, p), c = along(pts);
    const pos = c.segs.filter(s => s.W > 0).reduce((s, q) => s + q.W, 0), neg = c.segs.filter(s => s.W < 0).reduce((s, q) => s + q.W, 0);
    return { pts, W: c.W, Q: c.Q, dE: c.dE, pos, neg, ref };
  }
  const pts = pathPoints(p.path === 'line' ? 'if' : 'ibf', p), c = along(pts);
  return { pts, W: c.W, Q: c.Q, dE: c.dE, ref };
}

export function duration(p) { return RUN[p.activity] ?? 3; }
export function stateAt(t, p) {
  const T = duration(p), s = Math.min(Math.max(t, 0), T) / T;
  return { t: s * T, s, ...alongAt(problem(p).pts, s) };
}

// ---------- grading ---------- (J)
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkPath(p, { WText, QText }) {
  const s = problem(p), w = parseNumber(WText), q = parseNumber(QText), dV = p.Vf - p.Vi;
  const r = { WOk: false, QOk: false, WReason: null, QReason: null };
  if (!Number.isFinite(w)) r.WReason = 'unreadable';
  else if (near(w, s.W)) r.WOk = true;
  else if (s.W !== 0 && near(w, -s.W)) r.WReason = 'sign';
  else if (near(w, s.ref.W)) r.WReason = 'refW';
  else if (p.path === 'line' && (near(w, p.pi * dV) || near(w, p.pf * dV))) r.WReason = 'rect';
  else if (near(w, s.W * 1000) || near(w, s.W / 1000)) r.WReason = 'units';
  else r.WReason = 'value';
  if (!Number.isFinite(q)) r.QReason = 'unreadable';
  else if (near(q, s.Q)) r.QOk = true;
  else if (near(q, s.ref.Q)) r.QReason = 'pathIndep';
  else if (near(q, s.dE - s.W)) r.QReason = 'signW';
  else if (near(q, s.ref.Q + s.ref.W + s.W)) r.QReason = 'refSign';
  else if (near(q, s.W)) r.QReason = 'noE';
  else if (near(q, s.Q * 1000) || near(q, s.Q / 1000)) r.QReason = 'units';
  else r.QReason = 'value';
  return { ...r, ok: r.WOk && r.QOk };
}
export function checkCycle(p, { WText, QText }) {
  const s = problem(p), w = parseNumber(WText), q = parseNumber(QText);
  const r = { WOk: false, QOk: false, WReason: null, QReason: null };
  if (!Number.isFinite(w)) r.WReason = 'unreadable';
  else if (near(w, s.W)) r.WOk = true;
  else if (s.W !== 0 && near(w, -s.W)) r.WReason = 'sign';
  else if (near(w, s.pos) || near(w, s.neg)) r.WReason = 'oneSide';
  else if (near(w, s.pos - s.neg)) r.WReason = 'sumAbs';
  else r.WReason = 'value';
  if (!Number.isFinite(q)) r.QReason = 'unreadable';
  else if (near(q, s.Q)) r.QOk = true;
  else if (near(q, 0)) r.QReason = 'zero';
  else if (s.Q !== 0 && near(q, -s.Q)) r.QReason = 'sign';
  else r.QReason = 'value';
  return { ...r, ok: r.WOk && r.QOk };
}

// ---------- model contract ----------
const isP = p => p.activity === 'path';
const isC = p => p.activity === 'cycle';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'path', options: [{ value: 'path', label: '두 경로' }, { value: 'cycle', label: '순환 과정' }] },
  { id: 'pi', label: '상태 i의 압력', sym: '<i>p</i><sub>i</sub>', unit: 'kPa', min: 100, max: 400, step: 10, value: 300 },
  { id: 'Vi', label: '상태 i의 부피', sym: '<i>V</i><sub>i</sub>', unit: 'L', min: 1, max: 5, step: 0.1, value: 1 },
  { id: 'pf', label: '상태 f의 압력', sym: '<i>p</i><sub>f</sub>', unit: 'kPa', min: 100, max: 400, step: 10, value: 100 },
  { id: 'Vf', label: '상태 f의 부피', sym: '<i>V</i><sub>f</sub>', unit: 'L', min: 1, max: 5, step: 0.1, value: 4 },
  { id: 'path', type: 'select', label: '구할 경로', value: 'ibf', options: [{ value: 'ibf', label: 'ibf (등적 뒤 등압)' }, { value: 'line', label: 'if (직선)' }], showIf: isP },
  { id: 'dir', type: 'select', label: '도는 방향', value: 'iafbi', options: [{ value: 'iafbi', label: 'i → a → f → b → i' }, { value: 'ibfai', label: 'i → b → f → a → i' }], showIf: isC },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, ...stateAt(st.t, p) }; }
