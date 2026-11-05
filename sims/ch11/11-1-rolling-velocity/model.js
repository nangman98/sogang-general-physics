// 11.1 Rolling as Translation and Rotation Combined — pure model (no DOM).
// A wheel of radius R rolls smoothly along +x: v_com = ωR (Eq. 11.1.2). The velocity of a point on the rim is the
// sum of the translation v_com (all points) and the rotation about the center (speed ωR along the tangent).
// Seen from the ground, the contact point is at rest and the top moves at 2v_com.
// A rim point at angle β measured from the bottom (toward the front is +β) has speed 2v_com sin(β/2).
// The run follows one rim point (the marked one) along its cycloid.
import { parseNumber } from '../../../core/format.js';

export const POINTS = { top: 180, front: 90, bottom: 0, upperFront: 135 };   // degrees from the bottom, toward the front
// Position of the rim point relative to the center, for angle β from the bottom measured toward the front (+x).
const rimOffset = (R, beta) => [R * Math.sin(beta), -R * Math.cos(beta)];
// Velocity of a rim point at angle β (rolling to +x means clockwise rotation, ω pointing −z).
export function rimVelocity(v, R, betaDeg) {
  const b = betaDeg * Math.PI / 180, w = v / R, [rx, ry] = rimOffset(R, b);
  // ω⃗ = −ω ẑ, ω⃗ × r⃗ = (−ω ẑ) × (rx, ry, 0) = (ω ry, −ω rx, 0)
  return [v + w * ry, -w * rx];
}
export const pointSpeed = (v, betaDeg) => 2 * v * Math.abs(Math.sin(betaDeg * Math.PI / 360));   // |v| = 2v sin(β/2)

// Marked rim point that starts at the bottom: cycloid.
export function stateAt(t, { v, R }) {
  // Rolling to +x turns the wheel clockwise, so the mark that starts at the bottom moves toward the back: β = −ωt.
  const w = v / R, phi = w * t, xc = v * t;
  const [ox, oy] = rimOffset(R, -phi);
  return { t, xc, phi, mark: [xc + ox, R + oy], vmark: rimVelocity(v, R, -phi * 180 / Math.PI) };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function check(p, { sText }) {
  const beta = POINTS[p.pt], S = pointSpeed(p.v, beta), s = parseNumber(sText);
  if (!Number.isFinite(s)) return { ok: false, reason: 'unreadable' };
  if (near(s, S)) return { ok: true, reason: null };
  if (near(s, p.v)) return { ok: false, reason: 'com' };
  if (near(s, 0) && p.pt !== 'bottom') return { ok: false, reason: 'zero' };
  if (p.pt === 'front' && near(s, 2 * p.v)) return { ok: false, reason: 'sumScalar' };
  return { ok: false, reason: 'value' };
}

// ---------- model contract ----------
export const params = [
  { id: 'v', label: '질량중심 속력', sym: '<i>v</i><sub>com</sub>', unit: 'm/s', min: 0.5, max: 3, step: 0.25, value: 1.5 },
  { id: 'R', label: '바퀴 반지름', sym: '<i>R</i>', unit: 'm', min: 0.3, max: 1, step: 0.05, value: 0.6 },
  { id: 'pt', type: 'select', label: '물을 점', value: 'top', options: [
    { value: 'top', label: '꼭대기' }, { value: 'front', label: '앞쪽 끝 (중심 높이)' }, { value: 'bottom', label: '바닥 (땅에 닿은 점)' }, { value: 'upperFront', label: '앞쪽 위 45°' }] },
  { id: 'split', type: 'check', label: '병진과 회전으로 나눠 보기', value: false },
];
export const RUN = 4;
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { ...stateAt(st.t, p) }; }
