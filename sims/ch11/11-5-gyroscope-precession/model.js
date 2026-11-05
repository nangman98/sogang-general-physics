// 11.9 Precession of a Gyroscope — pure model (no DOM).
// A wheel (uniform disk, mass M, radius R_w, I = ½MR_w² about the shaft) spins at ω on a light shaft. One end of the
// shaft rests on a support tip O; the wheel's center is at distance r from O and the shaft is horizontal.
// Spin angular momentum L = Iω (Eq. 11.9.3) along the shaft. Gravity gives τ = Mgr (Eq. 11.9.2) perpendicular to L,
// so L turns about the vertical axis at Ω = Mgr/(Iω) (Eq. 11.9.6), independent of M because I ∝ M.
// Scene axes are y up. The shaft points along (cos φ, 0, −sin φ) from O; φ grows counterclockwise seen from above.
// sense 'out': L points from O toward the wheel → precession counterclockwise seen from above. 'in': clockwise.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const RUN = 8;          // s
export const SPIN_VIEW = 1 / 30; // the drawn spin turns 30 times slower than ω

export function gyro({ M, Rw, r, w, sense }, g = G) {
  const I = 0.5 * M * Rw * Rw, L = I * w, tau = M * g * r, Om = tau / L;
  const dir = sense === 'in' ? -1 : 1;
  return { I, L, tau, Om, T: 2 * Math.PI / Om, dir, turn: dir > 0 ? 'ccw' : 'cw' };
}
export function stateAt(t, p) {
  const s = gyro(p), u = Math.min(Math.max(t, 0), RUN), phi = s.dir * s.Om * u;
  const e = [Math.cos(phi), 0, -Math.sin(phi)];                      // shaft direction from O
  return { t: u, phi, psi: s.dir * p.w * u, shaft: e, Lvec: e.map(c => s.dir * s.L * c) };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function check(p, { OText, pick }) {
  const s = gyro(p), O = parseNumber(OText);
  const r = { OOk: false, pickOk: pick === s.turn, OReason: null, pickReason: null };
  if (!pick) r.pickReason = 'empty'; else if (!r.pickOk) r.pickReason = 'wrong';
  if (!Number.isFinite(O)) r.OReason = 'unreadable';
  else if (near(Math.abs(O), s.Om)) r.OOk = true;
  else r.OReason = near(Math.abs(O), s.L / s.tau) ? 'inverse' : near(Math.abs(O), s.Om / 2) ? 'hoopI' : near(Math.abs(O), s.Om * 2 * Math.PI) ? 'twoPi' : 'value';
  return { ...r, ok: r.OOk && r.pickOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'sense', type: 'select', label: '자전 방향', value: 'out', options: [
    { value: 'out', label: 'L이 O에서 바퀴 쪽을 향한다' }, { value: 'in', label: 'L이 바퀴에서 O 쪽을 향한다' }] },
  { id: 'M', label: '바퀴 질량', sym: '<i>M</i>', unit: 'kg', min: 0.5, max: 3, step: 0.1, value: 1.2 },
  { id: 'Rw', label: '바퀴 반지름', sym: '<i>R</i><sub>w</sub>', unit: 'm', min: 0.15, max: 0.3, step: 0.01, value: 0.2 },
  { id: 'r', label: '받침점에서 바퀴 중심까지', sym: '<i>r</i>', unit: 'm', min: 0.15, max: 0.5, step: 0.01, value: 0.3 },
  { id: 'w', label: '자전 각속도', sym: '<i>ω</i>', unit: 'rad/s', min: 80, max: 400, step: 10, value: 150 },
];
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { ...stateAt(st.t, p), ...gyro(p) }; }
