// 6.1 Friction — pure model (no DOM).
// Activities.
//   ramp:    a horizontal pull F = RATE·t on a block resting on a level floor. Static friction matches F
//            (property 1) until F reaches f_s,max = μs F_N (Eq. 6.1.1). Then the block breaks away and the
//            kinetic friction f_k = μk F_N (Eq. 6.1.2) acts while it slides (textbook Fig. 6.1.1).
//   angled:  a force F at angle θ below the horizontal (push) or above it (pull) on a block on a level floor.
//            F_N = mg + F sin θ for a push (Eq. 6.1.5), mg − F sin θ for a pull. The block slides only when
//            F cos θ exceeds f_s,max (Sample Problem 6.1.1).
//   incline: a block at rest on a plane inclined at θ. Static friction holds it while mg sin θ ≤ μs mg cos θ,
//            that is up to the angle θc with tan θc = μs. Beyond it the block slides down with
//            a = g(sin θ − μk cos θ) (second law along the slope, LO 6.1.3).
// Closed-form motion at every time, no integrator. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;          // m/s², the value used in the textbook
export const RATE = 10;        // N/s, growth of the horizontal pull in the ramp activity
export const TRAVEL = 2.5;     // m, a run stops when the block has slid this far
export const T_REST = 4;       // s, run length when the block stays at rest
const rad = d => d * Math.PI / 180;
const deg = r => r * 180 / Math.PI;

// ---------- ramp ----------
export function rampLimits({ m, mus, muk }, g = G) {
  const FN = m * g, fsMax = mus * FN, fk = muk * FN;
  return { FN, fsMax, fk, tb: fsMax / RATE };
}
// Applied force F, friction magnitude f, and the motion at time t (x along the pull).
export function rampAt(t, p, g = G) {
  const { FN, fsMax, fk, tb } = rampLimits(p, g), F = RATE * t;
  if (t <= tb) return { F, f: F, kind: 'static', FN, a: 0, v: 0, x: 0 };
  const tau = t - tb, a0 = (fsMax - fk) / p.m, j = RATE / p.m;
  return { F, f: fk, kind: 'kinetic', FN, a: a0 + j * tau, v: a0 * tau + j * tau * tau / 2, x: a0 * tau * tau / 2 + j * tau ** 3 / 6 };
}
// Time after breakaway at which the block has slid TRAVEL (bisection on the increasing x(τ)).
function rampSlideTime(p, g = G) {
  const { fsMax, fk } = rampLimits(p, g), a0 = (fsMax - fk) / p.m, j = RATE / p.m;
  const x = tau => a0 * tau * tau / 2 + j * tau ** 3 / 6;
  let lo = 0, hi = 1;
  while (x(hi) < TRAVEL) hi *= 2;
  for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (x(mid) < TRAVEL) lo = mid; else hi = mid; }
  return hi;
}

// ---------- angled force ----------
// dir 'push': F points θ below the horizontal (as in Sample Problem 6.1.1). 'pull': θ above it.
export function angled({ m, F, theta, dir, mus, muk }, g = G) {
  const s = Math.sin(rad(theta)), c = Math.cos(rad(theta));
  const Fx = F * c, Fy = dir === 'pull' ? F * s : -F * s;       // y up
  const FN = m * g - Fy;                                        // F_N + F_y − mg = 0
  const fsMax = mus * FN;
  const slides = Fx > fsMax * (1 + 1e-12);
  const f = slides ? muk * FN : Fx;
  return { Fx, Fy, FN, fsMax, slides, f, a: slides ? (Fx - muk * FN) / m : 0 };
}
// Largest pull that keeps the block on the floor (F sin θ < mg), rounded down to the slider step.
export const pullLimit = (m, theta, g = G) => (theta > 0 ? Math.floor(0.95 * m * g / Math.sin(rad(theta))) : Infinity);

// ---------- incline ----------
export function incline({ m, incl, mus, muk }, g = G) {
  const s = Math.sin(rad(incl)), c = Math.cos(rad(incl));
  const along = m * g * s, FN = m * g * c, fsMax = mus * FN;
  const slides = along > fsMax * (1 + 1e-12);                  // tan θ > μs
  return { along, FN, fsMax, slides, f: slides ? muk * FN : along, a: slides ? g * (s - muk * c) : 0, thetaC: deg(Math.atan(mus)) };
}

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
const nearAngle = (x, y) => Math.abs(x - y) <= 0.5;

// ramp: the applied force at breakaway and the friction magnitude right after it.
export function checkRamp(p, { breakText, afterText }) {
  const { FN, fsMax, fk } = rampLimits(p);
  const b = parseNumber(breakText), k = parseNumber(afterText);
  const r = { breakOk: false, afterOk: false, breakReason: null, afterReason: null };
  if (!Number.isFinite(b)) r.breakReason = 'unreadable';
  else if (near(b, fsMax)) r.breakOk = true;
  else r.breakReason = near(b, fk) ? 'kinetic' : near(b, FN) ? 'weight' : 'value';
  if (!Number.isFinite(k)) r.afterReason = 'unreadable';
  else if (near(k, fk)) r.afterOk = true;
  else r.afterReason = near(k, fsMax) ? 'static' : 'value';
  return { ...r, ok: r.breakOk && r.afterOk };
}

// angled: slides or not, and the friction magnitude.
export function checkAngled(p, { move, fText }) {
  const s = angled(p), fx = parseNumber(fText);
  const r = { moveOk: move === (s.slides ? 'slide' : 'rest'), fOk: false, moveReason: null, fReason: null };
  if (!move) r.moveReason = 'empty';
  else if (!r.moveOk) {
    // The decision a student gets with F_N = mg (vertical part of F left out).
    const noFy = s.Fx > p.mus * p.m * G;
    r.moveReason = noFy === (move === 'slide') ? 'noFy' : 'wrong';
  }
  if (!Number.isFinite(fx)) r.fReason = 'unreadable';
  else if (near(fx, s.f)) r.fOk = true;
  else if (!s.slides && near(fx, s.fsMax)) r.fReason = 'fsmax';
  else if (!s.slides && near(fx, p.muk * s.FN)) r.fReason = 'kineticAtRest';
  else if (Math.abs(s.Fy) > 1e-9 && (near(fx, p.mus * p.m * G) || near(fx, p.muk * p.m * G))) r.fReason = 'noFy';
  else if (s.slides && near(fx, s.fsMax)) r.fReason = 'staticWhileSliding';
  else r.fReason = 'value';
  return { ...r, ok: r.moveOk && r.fOk };
}

// incline: critical angle θc and the acceleration magnitude at the chosen θ (0 when the block stays).
export function checkIncline(p, { cText, aText }) {
  const s = incline(p), c = parseNumber(cText), a = parseNumber(aText);
  const r = { cOk: false, aOk: false, cReason: null, aReason: null };
  if (!Number.isFinite(c)) r.cReason = 'unreadable';
  else if (nearAngle(c, s.thetaC)) r.cOk = true;
  else if (p.mus < 1 && nearAngle(c, deg(Math.asin(p.mus)))) r.cReason = 'sin';
  else if (p.mus < 1 && nearAngle(c, deg(Math.acos(p.mus)))) r.cReason = 'cos';
  else r.cReason = 'value';
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(Math.abs(a), s.a)) r.aOk = true;
  else {
    const sn = Math.sin(rad(p.incl)), cs = Math.cos(rad(p.incl));
    if (!s.slides) r.aReason = 'rest';
    else if (near(Math.abs(a), G * sn)) r.aReason = 'noFriction';
    else if (near(Math.abs(a), Math.abs(G * (sn - p.mus * cs)))) r.aReason = 'static';
    else r.aReason = 'value';
  }
  return { ...r, ok: r.cOk && r.aOk };
}

// ---------- model contract ----------
const isAngled = p => p.activity === 'angled';
const isIncline = p => p.activity === 'incline';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'ramp', options: [
    { value: 'ramp', label: '힘 늘리기' }, { value: 'angled', label: '비스듬한 힘' }, { value: 'incline', label: '빗면' }] },
  { id: 'm', label: '블록 질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 0.5, max: 10, step: 0.5, value: 4 },
  { id: 'mus', label: '정지 마찰 계수', sym: '<i>μ</i><sub>s</sub>', min: 0.05, max: 1, step: 0.05, value: 0.6 },
  { id: 'muk', label: '운동 마찰 계수', sym: '<i>μ</i><sub>k</sub>', min: 0.05, max: 1, step: 0.05, value: 0.4, bounds: p => [0.05, p.mus] },
  { id: 'dir', type: 'select', label: '힘의 방향', value: 'push', showIf: isAngled, options: [
    { value: 'push', label: '수평 아래쪽으로 비스듬히 민다' }, { value: 'pull', label: '수평 위쪽으로 비스듬히 당긴다' }] },
  { id: 'F', label: '가한 힘 (applied force)', sym: '<i>F</i>', unit: 'N', min: 0, max: 60, step: 1, value: 20, showIf: isAngled,
    bounds: p => [0, p.dir === 'pull' ? Math.min(60, pullLimit(p.m, p.theta)) : 60] },
  { id: 'theta', label: '힘의 각', sym: '<i>θ</i>', unit: '°', min: 0, max: 60, step: 1, value: 30, showIf: isAngled },
  { id: 'incl', label: '빗면 각', sym: '<i>θ</i>', unit: '°', min: 0, max: 60, step: 1, value: 25, showIf: isIncline },
];

export function duration(p) {
  if (p.activity === 'ramp') return rampLimits(p).tb + rampSlideTime(p);
  const a = p.activity === 'incline' ? incline(p).a : angled(p).a;
  return a > 1e-9 ? Math.min(T_REST * 2, Math.sqrt(2 * TRAVEL / a)) : T_REST;
}
export const init = () => ({ t: 0 });
export const at = t => ({ t });

// x: distance slid along the motion (floor: along the pull, incline: down the slope).
export function observe(st, p) {
  const t = st.t;
  if (p.activity === 'ramp') return { activity: 'ramp', t, ...rampAt(t, p) };
  const s = p.activity === 'incline' ? incline(p) : angled(p);
  return { activity: p.activity, t, ...s, kind: s.slides ? 'kinetic' : 'static', v: s.a * t, x: 0.5 * s.a * t * t };
}

// Arrow scale (m per N): the largest force in the run is 1.6 m long.
export function forceScale(p) {
  let big;
  if (p.activity === 'ramp') { const T = duration(p); big = Math.max(RATE * T, p.m * G); }
  else if (p.activity === 'angled') { const s = angled(p); big = Math.max(p.F, s.FN, p.m * G); }
  else big = p.m * G;
  return 1.6 / Math.max(big, 1e-9);
}
