// 9.4 Collision and Impulse — pure model (no DOM).
// A ball of mass m moves toward a wall at the left (velocity −v_in, +x away from the wall) and is pushed back by a
// force pulse F(t) lasting Δt. The impulse is the area under F(t): J = ∫F dt (Eq. 9.4.3), Δp = J (Eq. 9.4.4),
// and J = F_avg Δt (Eq. 9.4.8). So v_f = −v_in + J/m.
// Pulse shapes: triangle (J = ½F_max Δt) and half sine (J = (2/π)F_max Δt).
// Activities.
//   pulse:   set the pulse; predict J and v_f.
//   cushion: the ball is stopped (J = m v_in); predict F_avg for the chosen Δt (a soft or a hard stop).
// Display time: the contact of a few ms is stretched over CONTACT_SHOW seconds of screen time, between an approach
// and a departure of APPROACH seconds each shown at real time. The model keeps the physical time separately.
import { parseNumber } from '../../../core/format.js';

export const APPROACH = 0.4, CONTACT_SHOW = 2.4;       // s of screen time (approach at most 20 m/s × 0.4 s = 8 m)
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);

export function pulseShape(shape, Fmax, dt) {
  const tri = t => (t <= 0 || t >= dt ? 0 : Fmax * (1 - Math.abs(2 * t / dt - 1)));
  const sine = t => (t <= 0 || t >= dt ? 0 : Fmax * Math.sin(Math.PI * t / dt));
  const f = shape === 'sine' ? sine : tri;
  // Impulse up to time t (closed form).
  const J = t => {
    const u = Math.min(Math.max(t, 0), dt);
    if (shape === 'sine') return Fmax * dt / Math.PI * (1 - Math.cos(Math.PI * u / dt));
    return u <= dt / 2 ? Fmax * u * u / dt : Fmax * dt / 2 - Fmax * (dt - u) ** 2 / dt;
  };
  return { f, J, total: J(dt) };
}

// Parameters of the run in SI (Δt is given in ms on the slider).
export function setup(p) {
  if (p.activity === 'cushion') {
    const dt = p.dtc / 1000, Jt = p.m * p.vin;
    const Fmax = Jt / (dt / 2);                       // triangle with area m v_in
    return { shape: 'triangle', Fmax, dt, J: Jt, Favg: Jt / dt, vf: 0 };
  }
  const dt = p.dt / 1000, s = pulseShape(p.shape, p.Fmax, dt);
  return { shape: p.shape, Fmax: p.Fmax, dt, J: s.total, Favg: s.total / dt, vf: -p.vin + s.total / p.m };
}

// Screen time τ -> physical state. x is the ball's distance from the wall face (ball radius not included).
export function stateAt(tau, p) {
  const s = setup(p), sh = pulseShape(s.shape, s.Fmax, s.dt);
  if (tau <= APPROACH) return { phase: 'approach', tPhys: tau - APPROACH, x: p.vin * (APPROACH - tau), v: -p.vin, F: 0, J: 0, squash: 0 };
  if (tau <= APPROACH + CONTACT_SHOW) {
    const u = (tau - APPROACH) / CONTACT_SHOW * s.dt, Jt = sh.J(u);
    return { phase: 'contact', tPhys: u, x: 0, v: -p.vin + Jt / p.m, F: sh.f(u), J: Jt, squash: sh.f(u) / s.Fmax };
  }
  const w = tau - APPROACH - CONTACT_SHOW;
  return { phase: 'after', tPhys: s.dt + w, x: Math.max(0, s.vf * w), v: s.vf, F: 0, J: s.J, squash: 0 };
}

// ---------- grading ----------
export function checkPulse(p, { JText, vText }) {
  const s = setup(p), J = parseNumber(JText), v = parseNumber(vText);
  const r = { JOk: false, vOk: false, JReason: null, vReason: null };
  if (!Number.isFinite(J)) r.JReason = 'unreadable';
  else if (near(J, s.J)) r.JOk = true;
  else r.JReason = near(J, s.Fmax * s.dt) ? 'rectangle' : near(J, s.J * 1000) ? 'ms' : (p.shape === 'sine' && near(J, 0.5 * s.Fmax * s.dt)) ? 'triangle' : 'value';
  // v_f is graded by sign and size; the sign tells the direction.
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, s.vf)) r.vOk = true;
  else r.vReason = near(v, p.vin + s.J / p.m) ? 'noSign' : near(Math.abs(v), Math.abs(s.vf)) ? 'sign' : near(v, s.J / p.m) ? 'noVi' : 'value';
  return { ...r, ok: r.JOk && r.vOk };
}
export function checkCushion(p, { FText }) {
  const s = setup(p), F = parseNumber(FText);
  if (!Number.isFinite(F)) return { ok: false, reason: 'unreadable' };
  if (near(F, s.Favg)) return { ok: true, reason: null };
  if (near(F, s.Fmax)) return { ok: false, reason: 'peak' };
  if (near(F, p.m * p.vin / p.dtc)) return { ok: false, reason: 'ms' };
  if (near(F, p.m * p.vin)) return { ok: false, reason: 'noTime' };
  return { ok: false, reason: 'value' };
}

// ---------- model contract ----------
const isPulse = p => p.activity === 'pulse';
const isCushion = p => p.activity === 'cushion';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'pulse', options: [{ value: 'pulse', label: '힘 펄스' }, { value: 'cushion', label: '부드럽게 멈추기' }] },
  { id: 'm', label: '공 질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 0.1, max: 1, step: 0.05, value: 0.4 },
  { id: 'vin', label: '다가오는 속력', sym: '<i>v</i>', unit: 'm/s', min: 2, max: 20, step: 1, value: 10 },
  { id: 'shape', type: 'select', label: '펄스 모양', value: 'triangle', showIf: isPulse, options: [{ value: 'triangle', label: '삼각형' }, { value: 'sine', label: '반 사인' }] },
  { id: 'Fmax', label: '최대 힘', sym: '<i>F</i><sub>max</sub>', unit: 'N', min: 200, max: 2000, step: 50, value: 1000, showIf: isPulse },
  { id: 'dt', label: '접촉 시간', sym: 'Δ<i>t</i>', unit: 'ms', min: 2, max: 20, step: 1, value: 10, showIf: isPulse },
  { id: 'dtc', label: '멈추는 데 걸린 시간', sym: 'Δ<i>t</i>', unit: 'ms', min: 2, max: 100, step: 1, value: 20, showIf: isCushion },
];
export function duration(p) { return APPROACH + CONTACT_SHOW + (p.activity === 'cushion' ? 0.6 : APPROACH); }
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, t: st.t, ...stateAt(st.t, p), s: setup(p) }; }
