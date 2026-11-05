// 15.4 Pendulums, Circular Motion — pure model (no DOM).
// Activities.
//   pendulum: a simple pendulum (bob on a massless string of length L, Fig. 15.4.1) or a physical pendulum (uniform rod
//             of length L pivoted at one end, Fig. 15.4.3a, I = mL²/3 by Eq. 15.4.7, h = L/2). The restoring torque
//             gives −L(mg sin θ) = Iα (Eq. 15.4.2), with h in place of L for the rod (Fig. 15.4.2). Both reduce to
//             d²θ/dt² = −(g/Le) sin θ with Le = L (simple) or Le = I/(mh) = 2L/3 (rod).
//             Small angle (sin θ ≈ θ, Eq. 15.4.3): T = 2π√(L/g) (Eq. 15.4.5), T = 2π√(I/mgh) = 2π√(2L/3g) (Eqs. 15.4.6, 15.4.10).
//             Large amplitude: the same equation with sin θ kept is integrated once with RK4 from θ = θm at rest and
//             stored (as sims/ch08/8-1-mechanical-energy). Its period T = 4√(Le/g) K(sin(θm/2)) comes from the complete
//             elliptic integral by the arithmetic–geometric mean. That period is not in the textbook. It is the numerical
//             solution of the textbook equation of motion, checked against a separate RK4 run in model.test.js.
//             The small-angle model θm cos(2πt/T) runs beside it after the check.
//   circle:   reference particle P′ moves on a reference circle of radius xm with angular speed ω (Fig. 15.4.5); here the
//             circle lies on a turntable, counterclockwise seen from above (from +x toward −z). Its projection P on the
//             x axis moves as x = xm cos(ωt + ϕ) (Eq. 15.4.13), v = −ωxm sin(ωt + ϕ) (Eq. 15.4.14),
//             a = −ω²xm cos(ωt + ϕ) (Eq. 15.4.15), from v = ωr (Eq. 10.3.2) and a_r = ω²r (Eq. 10.3.7) of P′.
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const RUN = 10;          // s of pendulum motion shown, the same for every length and amplitude
const rad = d => d * Math.PI / 180;

// ---------- pendulum ----------
export const effLength = p => (p.kind === 'rod' ? 2 * p.L / 3 : p.L);
export const smallPeriod = (p, g = G) => 2 * Math.PI * Math.sqrt(effLength(p) / g);     // Eqs. 15.4.5, 15.4.10
// Complete elliptic integral of the first kind by the arithmetic–geometric mean (same as 8-1).
export function ellipticK(k) {
  let a = 1, b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
  return Math.PI / (2 * a);
}
export const exactPeriod = (p, g = G) => 4 * Math.sqrt(effLength(p) / g) * ellipticK(Math.sin(rad(p.thetaM) / 2));

const PSTEPS = 4000;
const cache = new Map();
function table(p, g = G) {
  const key = [p.kind, p.L, p.thetaM].join(',');
  if (cache.has(key)) return cache.get(key);
  const T = exactPeriod(p, g), dt = T / PSTEPS, w2 = g / effLength(p);
  const f = (th, om) => [om, -w2 * Math.sin(th)];
  const th = [rad(p.thetaM)], om = [0];
  for (let i = 0; i < PSTEPS; i++) {
    const a = th[i], b = om[i];
    const k1 = f(a, b), k2 = f(a + dt / 2 * k1[0], b + dt / 2 * k1[1]), k3 = f(a + dt / 2 * k2[0], b + dt / 2 * k2[1]), k4 = f(a + dt * k3[0], b + dt * k3[1]);
    th.push(a + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])); om.push(b + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]));
  }
  const out = { T, dt, th, om, w2 };
  if (cache.size > 40) cache.clear();
  cache.set(key, out); return out;
}
// θ and dθ/dt at time t (cubic Hermite between stored RK4 steps; θ' = dθ/dt, (dθ/dt)' = −(g/Le) sin θ).
export function pendulumAt(t, p) {
  const { T, dt, th, om, w2 } = table(p);
  const tt = ((t % T) + T) % T, i = Math.min(PSTEPS - 1, Math.floor(tt / dt)), s = tt / dt - i;
  const h00 = 2 * s ** 3 - 3 * s * s + 1, h10 = s ** 3 - 2 * s * s + s, h01 = -2 * s ** 3 + 3 * s * s, h11 = s ** 3 - s * s;
  const theta = h00 * th[i] + h10 * dt * om[i] + h01 * th[i + 1] + h11 * dt * om[i + 1];
  const a0 = -w2 * Math.sin(th[i]), a1 = -w2 * Math.sin(th[i + 1]);
  const omega = h00 * om[i] + h10 * dt * a0 + h01 * om[i + 1] + h11 * dt * a1;
  return { theta, omega };
}
// Small-angle model started the same way: θ = θm cos(ωt), ω = 2π/T (Eq. 15.1.3 in angular form).
export const smallAt = (t, p) => rad(p.thetaM) * Math.cos(2 * Math.PI * t / smallPeriod(p));

// ---------- circle ---------- (xm in cm on the slider, phi in degrees)
export function circleAt(t, p) {
  const A = p.xm / 100, ph = p.w * t + rad(p.phi), c = Math.cos(ph), s = Math.sin(ph);
  return {
    phase: ph, x: A * c, v: -p.w * A * s, a: -p.w * p.w * A * c,
    ref: [A * c, -A * s],                       // P′ on the turntable (x, z)
    refV: [-p.w * A * s, -p.w * A * c],         // its velocity, magnitude ωxm (Eq. 10.3.2)
    refA: [-p.w * p.w * A * c, p.w * p.w * A * s], // its radial acceleration toward the center, magnitude ω²xm (Eq. 10.3.7)
  };
}
export const circlePeriod = p => 2 * Math.PI / p.w;

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
// Answer for the choice: the true period exceeds the small-angle one by more than 1 % ('longer') or not ('same').
export const periodChoice = p => (exactPeriod(p) / smallPeriod(p) - 1 > 0.01 ? 'longer' : 'same');
export function pendulumMistakes(p) {
  const Le = effLength(p), T0 = smallPeriod(p);
  const m = { inverted: 2 * Math.PI * Math.sqrt(G / Le), noTwoPi: Math.sqrt(Le / G), freq: 1 / T0 };
  if (p.kind === 'rod') Object.assign(m, { simple: 2 * Math.PI * Math.sqrt(p.L / G), half: 2 * Math.PI * Math.sqrt(p.L / 2 / G) });
  return m;
}
export function checkPendulum(p, { TText, choice }) {
  const T0 = smallPeriod(p), T = parseNumber(TText), mk = pendulumMistakes(p), want = periodChoice(p);
  const r = { TOk: false, cOk: choice === want, TReason: null, cReason: null };
  if (!choice) r.cReason = 'empty'; else if (!r.cOk) r.cReason = choice;
  if (!Number.isFinite(T)) r.TReason = 'unreadable';
  else if (near(T, T0)) r.TOk = true;
  else r.TReason = Object.keys(mk).find(k => near(T, mk[k])) ?? 'value';
  return { ...r, want, ok: r.TOk && r.cOk };
}
export function circleMistakes(p) {
  const A = p.xm / 100, w = p.w, c = Math.cos(rad(p.phi)), s = Math.sin(rad(p.phi));
  return {
    v: { sign: w * A * s, cos: -w * A * c, noOmega: -A * s, speed: w * A },
    a: { sign: w * w * A * c, sin: -w * w * A * s, omega1: -w * A * c, full: w * w * A },
  };
}
export function checkCircle(p, { vText, aText }) {
  const o = circleAt(0, p), v = parseNumber(vText), a = parseNumber(aText), mk = circleMistakes(p);
  const r = { vOk: false, aOk: false, vReason: null, aReason: null };
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, o.v)) r.vOk = true;
  else r.vReason = Object.keys(mk.v).find(k => near(v, mk.v[k])) ?? 'value';
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, o.a)) r.aOk = true;
  else r.aReason = Object.keys(mk.a).find(k => near(a, mk.a[k])) ?? 'value';
  return { ...r, ok: r.vOk && r.aOk };
}

// ---------- model contract ----------
const isP = p => p.activity === 'pendulum';
const isC = p => p.activity === 'circle';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'pendulum', options: [{ value: 'pendulum', label: '진자 주기' }, { value: 'circle', label: '원운동과 SHM' }] },
  { id: 'kind', type: 'select', label: '진자 종류', value: 'simple', showIf: isP, options: [{ value: 'simple', label: '단진자 (simple pendulum)' }, { value: 'rod', label: '막대 진자 (physical pendulum)' }] },
  { id: 'L', label: '길이 (length)', sym: '<i>L</i>', unit: 'm', min: 0.5, max: 3, step: 0.1, value: 1.2, showIf: isP },
  { id: 'thetaM', label: '각진폭 (angular amplitude)', sym: '<i>θ</i><sub>m</sub>', unit: '°', min: 5, max: 80, step: 1, value: 60, showIf: isP },
  { id: 'xm', label: '기준 원 반지름 (reference circle)', sym: '<i>x</i><sub>m</sub>', unit: 'cm', min: 10, max: 30, step: 1, value: 20, showIf: isC },
  { id: 'w', label: '각속력 (angular speed)', sym: '<i>ω</i>', unit: 'rad/s', min: 1, max: 4, step: 0.1, value: 2.5, showIf: isC },
  { id: 'phi', label: '위상 상수 (phase constant)', sym: '<i>ϕ</i>', unit: '°', min: 0, max: 345, step: 15, value: 60, showIf: isC },
];
export const duration = p => (isC(p) ? 2 * circlePeriod(p) : RUN);
export const loop = p => isC(p);
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  const t = st.t;
  if (isC(p)) return { activity: 'circle', t, ...circleAt(t, p) };
  const { theta, omega } = pendulumAt(t, p);
  return { activity: 'pendulum', t, theta, omega, model: smallAt(t, p), T0: smallPeriod(p), T: exactPeriod(p) };
}
