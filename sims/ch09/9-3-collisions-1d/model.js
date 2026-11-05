// 9.6–9.7 Momentum and Kinetic Energy in Collisions, Elastic Collisions in One Dimension — pure model (no DOM).
// Two carts on a frictionless air track; cart 1 starts behind cart 2 and catches up (v1i > v2i).
// Linear momentum is conserved: m1v1i + m2v2i = m1v1f + m2v2f (Eq. 9.6.2).
// Activities.
//   elastic:   kinetic energy is also conserved (Eqs. 9.7.10, 9.7.11), which gives
//              v1f = [(m1 − m2)v1i + 2m2v2i]/(m1 + m2), v2f = [2m1v1i + (m2 − m1)v2i]/(m1 + m2) (Eqs. 9.7.14, 9.7.15).
//   inelastic: the carts stick (completely inelastic): V = (m1v1i + m2v2i)/(m1 + m2) (Eq. 9.6.4 with v2i ≠ 0).
// The center of mass moves at v_com = P/M throughout (Eq. 9.6.6). Sample Problem values are used only in tests.
import { parseNumber } from '../../../core/format.js';

export const LEN = 0.5;                  // m, length of each cart
export const X1 = -2.6, X2 = 0.6;        // m, starting centers
export const END = 6.6;                  // m, |x| at which a cart reaches the track end
export const AFTER = 2.5;                // s, run time after the collision

export function elastic({ m1, m2, v1i, v2i }) {
  const M = m1 + m2;
  return { v1f: ((m1 - m2) * v1i + 2 * m2 * v2i) / M, v2f: (2 * m1 * v1i + (m2 - m1) * v2i) / M };
}
export function inelastic({ m1, m2, v1i, v2i }) { const V = (m1 * v1i + m2 * v2i) / (m1 + m2); return { v1f: V, v2f: V, V }; }
export const solve = p => (p.activity === 'inelastic' ? inelastic(p) : elastic(p));
export const kinetic = (m, v) => 0.5 * m * v * v;

export function collisionTime(p) { return (X2 - X1 - LEN) / (p.v1i - p.v2i); }
export function stateAt(t, p) {
  const tc = collisionTime(p), s = solve(p);
  const xc1 = X1 + p.v1i * tc, xc2 = X2 + p.v2i * tc;
  const before = t <= tc;
  const x1 = before ? X1 + p.v1i * t : xc1 + s.v1f * (t - tc);
  const x2 = before ? X2 + p.v2i * t : xc2 + s.v2f * (t - tc);
  const v1 = before ? p.v1i : s.v1f, v2 = before ? p.v2i : s.v2f, M = p.m1 + p.m2;
  return { x1, x2, v1, v2, xcom: (p.m1 * x1 + p.m2 * x2) / M, vcom: (p.m1 * p.v1i + p.m2 * p.v2i) / M,
    P: p.m1 * v1 + p.m2 * v2, K: kinetic(p.m1, v1) + kinetic(p.m2, v2), collided: !before };
}
export function duration(p) {
  const tc = collisionTime(p), s = solve(p), st = stateAt(tc, p);
  let T = tc + AFTER;
  for (const [x, v] of [[st.x1, s.v1f], [st.x2, s.v2f]]) {
    if (v > 1e-9) T = Math.min(T, tc + (END - x) / v);
    if (v < -1e-9) T = Math.min(T, tc + (-END - x) / v);
  }
  return Math.max(T, tc);
}

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkElastic(p, { aText, bText }) {
  const s = elastic(p), a = parseNumber(aText), b = parseNumber(bText);
  const r = { aOk: false, bOk: false, aReason: null, bReason: null };
  const swap = { v1f: p.v2i, v2f: p.v1i };                                // equal-mass answer: velocities exchange
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, s.v1f)) r.aOk = true;
  else r.aReason = Math.abs(s.v1f) > 1e-9 && near(a, -s.v1f) ? 'sign' : near(a, swap.v1f) ? 'swap' : near(a, inelastic(p).V) ? 'stick' : 'value';
  if (!Number.isFinite(b)) r.bReason = 'unreadable';
  else if (near(b, s.v2f)) r.bOk = true;
  else r.bReason = Math.abs(s.v2f) > 1e-9 && near(b, -s.v2f) ? 'sign' : near(b, swap.v2f) ? 'swap' : near(b, inelastic(p).V) ? 'stick' : 'value';
  return { ...r, ok: r.aOk && r.bOk };
}
export function checkInelastic(p, { VText, lossText }) {
  const s = inelastic(p), V = parseNumber(VText), L = parseNumber(lossText);
  const loss = kinetic(p.m1, p.v1i) + kinetic(p.m2, p.v2i) - kinetic(p.m1 + p.m2, s.V);
  const r = { VOk: false, LOk: false, VReason: null, LReason: null };
  if (!Number.isFinite(V)) r.VReason = 'unreadable';
  else if (near(V, s.V)) r.VOk = true;
  else r.VReason = near(V, p.m1 * p.v1i / (p.m1 + p.m2)) && Math.abs(p.v2i) > 1e-9 ? 'noV2' : near(V, (p.v1i + p.v2i) / 2) && p.m1 !== p.m2 ? 'average' : 'value';
  if (!Number.isFinite(L)) r.LReason = 'unreadable';
  else if (near(L, loss)) r.LOk = true;
  else r.LReason = near(L, 0) ? 'zero' : near(L, -loss) ? 'sign' : 'value';
  return { ...r, ok: r.VOk && r.LOk, loss };
}

// ---------- model contract ----------
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'elastic', options: [{ value: 'elastic', label: '탄성 충돌' }, { value: 'inelastic', label: '완전 비탄성 충돌' }] },
  { id: 'm1', label: '수레 1 질량', sym: '<i>m</i><sub>1</sub>', unit: 'kg', min: 0.5, max: 4, step: 0.5, value: 1 },
  { id: 'm2', label: '수레 2 질량', sym: '<i>m</i><sub>2</sub>', unit: 'kg', min: 0.5, max: 4, step: 0.5, value: 2 },
  { id: 'v1i', label: '수레 1 처음 속도', sym: '<i>v</i><sub>1i</sub>', unit: 'm/s', min: 0, max: 3, step: 0.25, value: 2 },
  // Cart 2 must be caught (v2i < v1i) and the collision must happen on the track: x2 at the collision stays within
  // 6.1 m when v2i ≤ 0.67 v1i (from 0.6 + 2.7 v2i/(v1i − v2i) ≤ 6.1).
  { id: 'v2i', label: '수레 2 처음 속도', sym: '<i>v</i><sub>2i</sub>', unit: 'm/s', min: -3, max: 2, step: 0.25, value: 0,
    bounds: p => [-3, Math.min(2, p.v1i - 0.5, Math.floor(0.67 * p.v1i / 0.25) * 0.25)] },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, t: st.t, ...stateAt(st.t, p) }; }
