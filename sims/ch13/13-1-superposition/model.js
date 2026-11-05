// 13.1–13.2 Newton's Law of Gravitation, Gravitation and the Principle of Superposition — pure model (no DOM).
// Particle 1 (mass m1) sits at the origin. Particles 2 and 3 sit at distance r_j and angle φ_j (counterclockwise
// from +x). The force on particle 1 from particle j has magnitude G m1 m_j / r_j² (Eq. 13.1.1) and points toward j.
// F⃗1,net = F⃗12 + F⃗13 (Eq. 13.2.1). The student predicts |F⃗1,net| and its angle from +x.
// Static screen: no run.
import { parseNumber } from '../../../core/format.js';

export const G = 6.67e-11;
const rad = d => d * Math.PI / 180;

// Slider units: masses in kg, distances in cm, angles in degrees.
export function forces({ m1, m2, r2, phi2, m3, r3, phi3 }) {
  const one = (m, r, phi) => { const F = G * m1 * m / (r / 100) ** 2; return { F, v: [F * Math.cos(rad(phi)), F * Math.sin(rad(phi))] }; };
  const a = one(m2, r2, phi2), b = one(m3, r3, phi3), net = [a.v[0] + b.v[0], a.v[1] + b.v[1]];
  const F = Math.hypot(...net), ang = Math.atan2(net[1], net[0]) * 180 / Math.PI;
  return { F12: a.F, F13: b.F, v12: a.v, v13: b.v, net, F, angle: ang };
}
const wrap = d => ((d % 360) + 540) % 360 - 180;                     // to (−180, 180]

// ---------- grading ---------- (FText in 10⁻⁶ N, aText in degrees)
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function check(p, { FText, aText }) {
  const s = forces(p), F = parseNumber(FText), A = parseNumber(aText), Fu = s.F * 1e6;
  const r = { FOk: false, aOk: false, FReason: null, aReason: null };
  if (!Number.isFinite(F)) r.FReason = 'unreadable';
  else if (near(F, Fu)) r.FOk = true;
  else {
    // Forces with 1/r instead of 1/r², added as vectors.
    const lin = Math.hypot(s.v12[0] * p.r2 / 100 + s.v13[0] * p.r3 / 100, s.v12[1] * p.r2 / 100 + s.v13[1] * p.r3 / 100) * 1e6;
    r.FReason = near(F, (s.F12 + s.F13) * 1e6) ? 'scalarSum' : near(F, lin) ? 'notSquared' : 'value';
  }
  if (!Number.isFinite(A)) r.aReason = 'unreadable';
  else if (Math.abs(wrap(A - s.angle)) <= 1) r.aOk = true;
  // A calculator's inverse tangent without the quadrant check is off by exactly 180° (Fig. 13.2.1f), the same as
  // pointing the net force the opposite way.
  else r.aReason = Math.abs(wrap(A - s.angle - 180)) <= 1 ? 'quadrant' : 'value';
  return { ...r, ok: r.FOk && r.aOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'm1', label: '입자 1 질량', sym: '<i>m</i><sub>1</sub>', unit: 'kg', min: 1, max: 10, step: 0.5, value: 4 },
  { id: 'm2', label: '입자 2 질량', sym: '<i>m</i><sub>2</sub>', unit: 'kg', min: 1, max: 10, step: 0.5, value: 5 },
  { id: 'r2', label: '입자 2까지 거리', sym: '<i>r</i><sub>2</sub>', unit: 'cm', min: 1, max: 4, step: 0.5, value: 2 },
  { id: 'phi2', label: '입자 2의 방향 (+x에서)', sym: '<i>φ</i><sub>2</sub>', unit: '°', min: 0, max: 345, step: 15, value: 60 },
  { id: 'm3', label: '입자 3 질량', sym: '<i>m</i><sub>3</sub>', unit: 'kg', min: 1, max: 10, step: 0.5, value: 8 },
  { id: 'r3', label: '입자 3까지 거리', sym: '<i>r</i><sub>3</sub>', unit: 'cm', min: 1, max: 4, step: 0.5, value: 3 },
  { id: 'phi3', label: '입자 3의 방향 (+x에서)', sym: '<i>φ</i><sub>3</sub>', unit: '°', min: 0, max: 345, step: 15, value: 210 },
];
export const init = () => ({ t: 0 });
export function observe(st, p) { return forces(p); }
