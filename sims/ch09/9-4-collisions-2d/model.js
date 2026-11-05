// 9.8 Collisions in Two Dimensions — pure model (no DOM).
// Top view of an air table (x right, y up on the screen). Momentum is conserved in each direction:
// P1i + P2i = P1f + P2f (Eq. 9.8.1); for a target at rest, along x m1v1i = m1v1f cos θ1 + m2v2f cos θ2 (Eq. 9.8.3)
// and along y 0 = −m1v1f sin θ1 + m2v2f sin θ2 (Eq. 9.8.4).
// Activities.
//   glancing: puck 1 (moving +x) strikes puck 2 at rest off center by b. Smooth pucks: the push acts along the line
//             of centers n at contact, so puck 2 leaves along n, at θ2 = asin(b/2r) from the x axis. Elastic
//             (Eq. 9.8.5): v2f = 2m1/(m1+m2)(v1i·n)n, v1f = v1i − 2m2/(m1+m2)(v1i·n)n.
//   stick:    A moving +x and B moving +y meet at the origin and stick (Sample Problem 9.8.1 arrangement):
//             V = (mA vA, mB vB)/(mA + mB), tan θ = mB vB/(mA vA) (Eqs. 9.8.6, 9.8.7).
import { parseNumber } from '../../../core/format.js';

export const R = 0.25;          // m, puck radius
export const BEFORE = 1.2, AFTER = 1.2;
const deg = r => r * 180 / Math.PI;

export function glancing({ m1, m2, v1i, b }) {
  const D = 2 * R, s = Math.sqrt(D * D - b * b), n = [s / D, b / D];
  const vn = v1i * n[0], k2 = 2 * m1 / (m1 + m2), k1 = 2 * m2 / (m1 + m2);
  const v2 = [k2 * vn * n[0], k2 * vn * n[1]], v1 = [v1i - k1 * vn * n[0], -k1 * vn * n[1]];
  return { n, v1, v2, theta2: deg(Math.atan2(v2[1], v2[0])), theta1: deg(Math.atan2(v1[1], v1[0])),
    v1f: Math.hypot(...v1), v2f: Math.hypot(...v2), start1: [-(BEFORE * v1i + s), 0], start2: [0, b] };
}
export function stick({ mA, mB, vA, vB }) {
  const M = mA + mB, V = [mA * vA / M, mB * vB / M];
  return { V, speed: Math.hypot(...V), theta: deg(Math.atan2(V[1], V[0])) };
}

export function stateAt(t, p) {
  if (p.activity === 'stick') {
    const s = stick(p);
    if (t <= BEFORE) return { a: [-p.vA * (BEFORE - t), 0], b: [0, -p.vB * (BEFORE - t)], va: [p.vA, 0], vb: [0, p.vB], after: false };
    const u = t - BEFORE, c = [s.V[0] * u, s.V[1] * u];
    return { a: c, b: c, va: s.V, vb: s.V, after: true };
  }
  const g = glancing(p);
  if (t <= BEFORE) return { a: [g.start1[0] + p.v1i * t, 0], b: g.start2, va: [p.v1i, 0], vb: [0, 0], after: false };
  const u = t - BEFORE, c1 = [g.start1[0] + p.v1i * BEFORE, 0];
  return { a: [c1[0] + g.v1[0] * u, g.v1[1] * u], b: [g.start2[0] + g.v2[0] * u, g.start2[1] + g.v2[1] * u], va: g.v1, vb: g.v2, after: true };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
const nearAngle = (x, y) => Math.abs(x - y) <= 1;
export function checkGlancing(p, { thText, vText }) {
  const g = glancing(p), th = parseNumber(thText), v = parseNumber(vText);
  const r = { thOk: false, vOk: false, thReason: null, vReason: null };
  if (!Number.isFinite(th)) r.thReason = 'unreadable';
  else if (nearAngle(th, g.theta2)) r.thOk = true;
  else r.thReason = nearAngle(th, deg(Math.asin(p.b / R) || 0)) && p.b <= R ? 'radius' : nearAngle(th, 90 - g.theta2) ? 'complement' : 'value';
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, g.v2f)) r.vOk = true;
  else r.vReason = near(v, p.v1i) ? 'full' : near(v, 2 * p.m1 / (p.m1 + p.m2) * p.v1i) && p.b > 0 ? 'headOn' : 'value';
  return { ...r, ok: r.thOk && r.vOk };
}
export function checkStick(p, { thText, VText }) {
  const s = stick(p), th = parseNumber(thText), V = parseNumber(VText);
  const r = { thOk: false, VOk: false, thReason: null, VReason: null };
  if (!Number.isFinite(th)) r.thReason = 'unreadable';
  else if (nearAngle(th, s.theta)) r.thOk = true;
  else r.thReason = nearAngle(th, deg(Math.atan2(p.vB, p.vA))) && p.mA !== p.mB ? 'noMass' : nearAngle(th, 90 - s.theta) ? 'complement' : 'value';
  if (!Number.isFinite(V)) r.VReason = 'unreadable';
  else if (near(V, s.speed)) r.VOk = true;
  else r.VReason = near(V, (p.mA * p.vA + p.mB * p.vB) / (p.mA + p.mB)) ? 'scalar' : 'value';
  return { ...r, ok: r.thOk && r.VOk };
}

// ---------- model contract ----------
const isG = p => p.activity === 'glancing';
const isS = p => p.activity === 'stick';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'glancing', options: [{ value: 'glancing', label: '비켜 맞는 탄성 충돌' }, { value: 'stick', label: '붙는 충돌' }] },
  { id: 'm1', label: '퍽 1 질량', sym: '<i>m</i><sub>1</sub>', unit: 'kg', min: 0.5, max: 3, step: 0.5, value: 1, showIf: isG },
  { id: 'm2', label: '퍽 2 질량', sym: '<i>m</i><sub>2</sub>', unit: 'kg', min: 0.5, max: 3, step: 0.5, value: 1, showIf: isG },
  { id: 'v1i', label: '퍽 1 속력', sym: '<i>v</i><sub>1i</sub>', unit: 'm/s', min: 0.5, max: 2.5, step: 0.25, value: 1.5, showIf: isG },
  { id: 'b', label: '비켜 맞는 거리', sym: '<i>b</i>', unit: 'm', min: 0, max: 0.45, step: 0.05, value: 0.25, showIf: isG },
  { id: 'mA', label: '물체 A 질량', sym: '<i>m</i><sub>A</sub>', unit: 'kg', min: 0.5, max: 3, step: 0.5, value: 1.5, showIf: isS },
  { id: 'mB', label: '물체 B 질량', sym: '<i>m</i><sub>B</sub>', unit: 'kg', min: 0.5, max: 3, step: 0.5, value: 1, showIf: isS },
  { id: 'vA', label: 'A 속력 (+x)', sym: '<i>v</i><sub>A</sub>', unit: 'm/s', min: 0.5, max: 2.5, step: 0.25, value: 1.5, showIf: isS },
  { id: 'vB', label: 'B 속력 (+y)', sym: '<i>v</i><sub>B</sub>', unit: 'm/s', min: 0.5, max: 2.5, step: 0.25, value: 2, showIf: isS },
];
export const duration = () => BEFORE + AFTER;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, t: st.t, ...stateAt(st.t, p) }; }
