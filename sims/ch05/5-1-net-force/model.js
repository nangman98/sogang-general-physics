// 5.1–5.2 Newton's First and Second Laws, Some Particular Forces — pure model (no DOM).
// Activities.
//   sum: two or three horizontal forces on a crate on a frictionless surface. Net force by vector addition
//        (Eq. 5.1.6), acceleration from F_net = m a (Eq. 5.1.1, components Eq. 5.1.2). The crate starts at rest.
//   fbd: a crate sliding to +x on a floor, pulled by a cord at angle θ above the horizontal, with a frictional
//        force of given magnitude f opposite the sliding. y: F_N + T sin θ − F_g = 0, x: T cos θ − f = m a_x.
// World axes: x to the right, y up, z toward the viewer (06_3D_무대_기준.md). The floor is the x–z plane.
// Exact solution at every time, no integrator. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;                         // m/s², exact value used in the textbook (Sample Problem 5.3.4)
export const V0 = 1.0;                         // m/s, fbd activity: the crate is already sliding to +x
// The run goes on until it is paused, as in the department's earlier Newton's-second-law lab: the floor grid and the
// ruler scroll under the crate (view.js). RUN is the span of the time slider.
export const RUN = 60;                         // s

// ---------- sum activity: fixed force sets in the horizontal x–z plane, components [Fx, Fz] in N ----------
// Each set is chosen so that one misconception gives a different answer: largest force, scalar sum, or F_net = 0.
// Masses stay at or below 1.25 kg so that F_g and F_N fit the free-body diagram at the same arrow scale.
export const PROBLEMS = [
  { m: 0.80, forces: [[6, 0], [0, -8]] },
  { m: 1.25, forces: [[9, 0], [-3, 0], [0, 8]] },
  { m: 0.50, forces: [[12, 0], [-8, -6], [-6, 8]] },
  { m: 1.00, forces: [[8, 0], [-4, 6], [-4, -6]] },
  { m: 0.50, forces: [[4, 0], [0, -8], [-10, 0]] },
];

// Direction in the floor plane as an angle from +x, counterclockwise seen from above (+x toward −z).
export const heading = ([fx, fz]) => Math.atan2(-fz, fx) * 180 / Math.PI;
export const fromHeading = (deg, len = 1) => [len * Math.cos(deg * Math.PI / 180), -len * Math.sin(deg * Math.PI / 180)];
const norm = v => Math.hypot(...v);
const angleGap = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);

// Vector sum of forces given as component arrays (any dimension), Eq. (5.1.6).
export function netForce(forces) {
  return forces.reduce((s, f) => s.map((c, i) => c + f[i]), forces[0].map(() => 0));
}
// a = F_net / m, Eq. (5.1.1).
export const acceleration = (Fnet, m) => Fnet.map(c => c / m);

export function problem(index) {
  const n = PROBLEMS.length, k = ((index % n) + n) % n, P = PROBLEMS[k];
  const Fnet = netForce(P.forces), a = acceleration(Fnet, P.m);
  const largest = P.forces.reduce((b, f) => (norm(f) > norm(b) ? f : b));
  return {
    index: k, m: P.m, forces: P.forces, Fnet, a, aMag: norm(a), FnetMag: norm(Fnet),
    zero: norm(Fnet) < 1e-9, heading: norm(Fnet) < 1e-9 ? null : heading(Fnet),
    largestHeading: heading(largest), scalarSum: P.forces.reduce((s, f) => s + norm(f), 0),
  };
}
export const problemOf = p => problem(Number(p.problem ?? 1) - 1);

// Close within 2% (students round to 3 significant figures), or 0.01 near zero.
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);

// Prediction: heading in degrees (or zero = "F_net = 0") and acceleration magnitude text.
export function checkSum(q, { heading: h, zero, aText }) {
  const x = parseNumber(aText);
  const r = { dirOk: false, aOk: false, dirReason: null, aReason: null };
  if (q.zero) {
    r.dirOk = !!zero; if (!zero) r.dirReason = 'zeroMissed';
  } else if (zero) {
    r.dirReason = 'notZero';
  } else {
    r.dirOk = angleGap(h, q.heading) <= 10;
    if (!r.dirOk) r.dirReason = angleGap(h, q.largestHeading) <= 10 ? 'largest' : 'direction';
  }
  if (!Number.isFinite(x)) { r.aReason = 'unreadable'; return { ...r, ok: false }; }
  r.aOk = near(x, q.aMag);
  if (!r.aOk) r.aReason = near(x, q.scalarSum / q.m) ? 'scalar' : (!q.zero && near(x, q.FnetMag)) ? 'noMass' : 'value';
  return { ...r, ok: r.dirOk && r.aOk };
}

// ---------- fbd activity ----------
const rad = d => d * Math.PI / 180;
// Largest tension that keeps the crate on the floor (F_N >= 0), on the 1 N slider grid.
export const T_TOP = 200;                      // N, top of the tension slider
export const maxTension = p => (p.theta > 0 ? Math.min(T_TOP, Math.floor(p.m * G / Math.sin(rad(p.theta)) + 1e-9)) : T_TOP);

// y: F_N + T sin θ − F_g = m a_y. With a_y = 0 and T = 0 this is Eq. (5.2.7); with T = 0 it is Eq. (5.2.6).
export const normalForce = ({ m, T = 0, theta = 0, ay = 0 }) => m * (G + ay) - T * Math.sin(rad(theta));

export function pulled(p) {
  const Tx = p.T * Math.cos(rad(p.theta)), Ty = p.T * Math.sin(rad(p.theta));
  const Fg = p.m * G, FN = normalForce(p);
  const Fx = Tx - p.f, ax = Fx / p.m;                    // x: T cos θ − f = m a_x
  return { Fg, FN, Tx, Ty, Fx, ax };
}

// Arrow scales of the fbd activity (m per N, m per m/s²): the largest force is 1.6 m long and the acceleration at
// most 1.4 m, so every slider setting fits beside the crate. The screen states the scale below the scene.
export function fbdScales(p) {
  const s = pulled(p), big = Math.max(s.Fg, p.T, p.f, 1e-9);
  return { F: 1.6 / big, a: Math.min(1 / 8, 1.4 / Math.max(Math.abs(s.ax), 1e-9)) };
}

export function checkFbd(p, { FNText, aText }) {
  const s = pulled(p), FN = parseNumber(FNText), a = parseNumber(aText);
  const r = { FNOk: false, aOk: false, FNReason: null, aReason: null };
  if (!Number.isFinite(FN)) r.FNReason = 'unreadable';
  else {
    r.FNOk = near(FN, s.FN);
    if (!r.FNOk) r.FNReason = s.Ty > 0.05 && near(FN, s.Fg) ? 'mg' : s.Ty > 0.05 && near(FN, s.Fg + s.Ty) ? 'plus' : 'value';
  }
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else {
    r.aOk = near(a, s.ax);
    if (!r.aOk) {
      const fullT = (p.T - p.f) / p.m, noF = s.Tx / p.m;
      r.aReason = Math.abs(s.ax) > 0.01 && near(a, -s.ax) ? 'sign'
        : p.theta > 0 && near(a, fullT) ? 'fullT'
          : p.f > 0 && near(a, noF) ? 'noFriction' : 'value';
    }
  }
  return { ...r, ok: r.FNOk && r.aOk };
}

// ---------- model contract ----------
const sum = p => p.activity === 'sum';
const fbd = p => p.activity === 'fbd';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'sum', options: [
    { value: 'sum', label: '알짜힘' }, { value: 'fbd', label: '자유물체도' }] },
  { id: 'problem', type: 'select', label: '힘의 조합', value: '1', showIf: sum,
    options: PROBLEMS.map((_, i) => ({ value: String(i + 1), label: `문제 ${i + 1} / ${PROBLEMS.length}` })) },
  { id: 'm', label: '질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 1, max: 20, step: 0.5, value: 5, showIf: fbd },
  { id: 'T', label: '장력 (tension)', sym: '<i>T</i>', unit: 'N', min: 0, max: T_TOP, step: 1, value: 30, showIf: fbd, bounds: p => [0, maxTension(p)] },
  { id: 'theta', label: '줄의 각', sym: '<i>θ</i>', unit: '°', min: 0, max: 90, step: 1, value: 30, showIf: fbd },
  { id: 'f', label: '마찰력 (frictional force)', sym: '<i>f</i>', unit: 'N', min: 0, max: 100, step: 1, value: 10, showIf: fbd },
];

// Acceleration vector [ax, ay, az] and initial velocity for the active activity.
function motion(p) {
  if (sum(p)) { const q = problemOf(p); return { a: [q.a[0], 0, q.a[1]], v0: [0, 0, 0] }; }
  return { a: [pulled(p).ax, 0, 0], v0: [V0, 0, 0] };
}

// Time at which a sliding crate comes to rest (fbd with a_x < 0), else Infinity. Kinetic friction acts only while
// it slides; afterwards the crate stays at rest (the pull T cos θ is smaller than f).
export function stopTime(p) {
  const { a, v0 } = motion(p);
  return v0[0] > 1e-9 && a[0] < -1e-9 ? v0[0] / -a[0] : Infinity;
}
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(s, p) {
  const { a: a0, v0 } = motion(p), tStop = stopTime(p), stopped = s.t >= tStop, t = Math.min(s.t, tStop);
  const a = stopped ? [0, 0, 0] : a0;
  const r = a0.map((c, i) => v0[i] * t + 0.5 * c * t * t);
  const v = stopped ? [0, 0, 0] : a0.map((c, i) => v0[i] + c * t);
  return { activity: p.activity, t: s.t, r, v, a, speed: norm(v), dist: norm(r), stopped };
}
