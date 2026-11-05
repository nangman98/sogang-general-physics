// 6.3 Uniform Circular Motion — centripetal force, pure model (no DOM).
// A body in uniform circular motion needs a net force m v²/R toward the centre (Eqs. 6.3.1, 6.3.2).
// Activities.
//   flat:   a car on a level circular road. Static friction from the road is the centripetal force (textbook
//           6.3, example 1). It can be at most μs mg, so v_max = √(μs g R). Faster than that, even the
//           largest friction only turns the car on a circle of radius v²/(μs g) > R and the car leaves the road
//           (drawn as that wider circle, tangent to the road at the start).
//   banked: a car on a frictionless road banked at θ. F_N cos θ = mg and F_N sin θ = m v²/R, so the speed
//           that needs no friction is v = √(g R tan θ) and F_N = mg / cos θ.
//   loop:   a car inside a vertical loop of radius R near its top, treated as uniform circular motion at
//           speed v (as in Sample Problem 6.3.1). At angle φ from the top the track pushes toward the centre with
//           F_N = m v²/R − mg cos φ (Eq. 6.3.3 at φ = 0). Contact needs F_N ≥ 0, so at the top v ≥ √(gR).
//           Slower, the car leaves the track where F_N reaches 0 and then moves as a projectile.
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;          // m/s²
export const MASS = 1000;      // kg, car on the flat and banked roads
export const ROAD = 2.2;       // m, half width of the road
export const PHI0 = 55;        // °, the loop run starts this far before the top
const rad = d => d * Math.PI / 180;
const deg = r => r * 180 / Math.PI;

// Centripetal acceleration (Eq. 6.3.1) and force (Eq. 6.3.2) for mass m, speed v, radius R.
export const centripetal = (m, v, R) => ({ a: v * v / R, F: m * v * v / R });

// ---------- flat curve ----------
export function flat({ v, R, mus }, g = G) {
  const vmax = Math.sqrt(mus * g * R), need = centripetal(MASS, v, R).F, fmax = mus * MASS * g;
  const onRoad = v <= vmax * (1 + 1e-12);
  return { vmax, need, fmax, onRoad, f: onRoad ? need : fmax, rPath: onRoad ? R : v * v / (mus * g) };
}
// Position on the board (x, z) and heading angle at time t. The car starts at (R, 0) moving toward −z and turns
// left (counterclockwise seen from above). The path circle is tangent to the road there.
export function flatAt(t, p) {
  const s = flat(p), c = s.rPath, ang = p.v * t / c, cx = p.R - c;
  return { x: cx + c * Math.cos(ang), z: -c * Math.sin(ang), heading: ang, ...s };
}
// Off the road: the run ends when the car is 3 m past the outer edge (the edge of the board).
function flatOffTime(p) {
  const s = flat(p), lim = p.R + ROAD + 3;
  const dist = t => { const o = flatAt(t, p); return Math.hypot(o.x, o.z); };
  let lo = 0, hi = Math.PI * s.rPath / p.v;
  for (let k = 0; k < 70; k++) { const mid = (lo + hi) / 2; if (dist(mid) < lim) lo = mid; else hi = mid; }
  return hi;
}

// ---------- banked curve ----------
export function banked({ R, theta }, g = G) {
  const th = rad(theta);
  const v = Math.sqrt(g * R * Math.tan(th)), FN = MASS * g / Math.cos(th);
  return { v, FN, net: MASS * v * v / R, a: v * v / R };
}

// ---------- loop ----------
export function loopTop({ R, v, m }, g = G) {
  const vmin = Math.sqrt(g * R), FN = m * v * v / R - m * g;
  return { vmin, FN: Math.max(FN, 0), contact: v >= vmin * (1 - 1e-12), a: v * v / R };
}
// Angle from the top where contact ends (−90°…0°), or null when the car keeps contact through the top.
export function loopRelease({ R, v }, g = G) {
  const c = v * v / (g * R);
  return c >= 1 ? null : -deg(Math.acos(c));
}
// Car centre relative to the loop centre (x right, y up), velocity, contact and F_N at time t.
// On the track: φ = −PHI0 + v t / R (deg), moving right over the top.
export function loopAt(t, p, g = G) {
  const { R, v, m } = p, rel = loopRelease(p, g);
  const start = rel === null ? Infinity : Math.max(0, (rel + PHI0) * rad(1) * R / v);
  const onTrack = (tt) => {
    const phi = rad(-PHI0) + v * tt / R;
    return { x: R * Math.sin(phi), y: R * Math.cos(phi), vx: v * Math.cos(phi), vy: -v * Math.sin(phi), phi: deg(phi),
      contact: true, FN: m * v * v / R - m * g * Math.cos(phi) };
  };
  if (t <= start) return onTrack(t);
  const s = onTrack(start), tau = t - start;            // projectile after contact is lost
  return { x: s.x + s.vx * tau, y: s.y + s.vy * tau - 0.5 * g * tau * tau, vx: s.vx, vy: s.vy - g * tau, phi: s.phi, contact: false, FN: 0 };
}
export function loopDuration(p, g = G) {
  const rel = loopRelease(p, g), sweep = 2 * PHI0;
  if (rel === null || rel > PHI0) return rad(sweep) * p.R / p.v;
  // Free flight until the car has dropped to the loop centre height.
  const start = Math.max(0, (rel + PHI0) * rad(1) * p.R / p.v), s = loopAt(start, p, g);
  const tau = (s.vy + Math.sqrt(s.vy * s.vy + 2 * g * s.y)) / g;
  return start + tau;
}

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);

export function checkFlat(p, { vText, fText }) {
  const s = flat(p), vx = parseNumber(vText), fx = parseNumber(fText);
  const r = { vOk: false, fOk: false, vReason: null, fReason: null };
  if (!Number.isFinite(vx)) r.vReason = 'unreadable';
  else if (near(vx, s.vmax)) r.vOk = true;
  else r.vReason = near(vx, s.vmax * s.vmax) ? 'noRoot' : near(vx, Math.sqrt(p.mus * p.R)) ? 'noG' : near(vx, Math.sqrt(G * p.R)) ? 'noMu' : 'value';
  if (!Number.isFinite(fx)) r.fReason = 'unreadable';
  else if (near(fx, s.need)) r.fOk = true;
  else r.fReason = near(fx, s.fmax) ? 'fmax' : near(fx, MASS * p.v / p.R) ? 'noSquare' : near(fx, MASS * G) ? 'weight' : 'value';
  return { ...r, ok: r.vOk && r.fOk };
}

export function checkBanked(p, { vText, cmp }) {
  const s = banked(p), vx = parseNumber(vText);
  const r = { vOk: false, cmpOk: cmp === 'more', vReason: null, cmpReason: null };
  if (!cmp) r.cmpReason = 'empty';
  else if (!r.cmpOk) r.cmpReason = cmp;
  if (!Number.isFinite(vx)) r.vReason = 'unreadable';
  else if (near(vx, s.v)) r.vOk = true;
  else {
    const th = rad(p.theta);
    r.vReason = near(vx, Math.sqrt(G * p.R * Math.sin(th))) ? 'sin' : near(vx, Math.sqrt(G * p.R / Math.tan(th))) ? 'cot' : near(vx, Math.sqrt(G * p.R)) ? 'noAngle' : 'value';
  }
  return { ...r, ok: r.vOk && r.cmpOk };
}

export function checkLoop(p, { vText, nText }) {
  const s = loopTop(p), vx = parseNumber(vText), nx = parseNumber(nText);
  const r = { vOk: false, nOk: false, vReason: null, nReason: null };
  if (!Number.isFinite(vx)) r.vReason = 'unreadable';
  else if (near(vx, s.vmin)) r.vOk = true;
  else r.vReason = near(vx, G * p.R) ? 'noRoot' : near(vx, Math.sqrt(2 * G * p.R)) ? 'two' : 'value';
  if (!Number.isFinite(nx)) r.nReason = 'unreadable';
  else if (near(nx, s.FN)) r.nOk = true;
  else if (!s.contact) r.nReason = 'noContact';
  else r.nReason = near(nx, p.m * p.v * p.v / p.R + p.m * G) ? 'plus' : near(nx, p.m * p.v * p.v / p.R) ? 'noWeight' : near(nx, p.m * G) ? 'weight' : 'value';
  return { ...r, ok: r.vOk && r.nOk };
}

// ---------- model contract ----------
const is = a => p => p.activity === a;
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'flat', options: [
    { value: 'flat', label: '평평한 커브' }, { value: 'banked', label: '경사진 커브' }, { value: 'loop', label: '연직 원' }] },
  { id: 'v', label: '속력 (speed)', sym: '<i>v</i>', unit: 'm/s', min: 4, max: 25, step: 0.5, value: 8, showIf: is('flat') },
  { id: 'R', label: '커브 반지름 (radius)', sym: '<i>R</i>', unit: 'm', min: 10, max: 40, step: 1, value: 20, showIf: p => p.activity !== 'loop' },
  { id: 'mus', label: '정지 마찰 계수', sym: '<i>μ</i><sub>s</sub>', min: 0.1, max: 1, step: 0.05, value: 0.5, showIf: is('flat') },
  { id: 'theta', label: '경사각', sym: '<i>θ</i>', unit: '°', min: 5, max: 40, step: 1, value: 20, showIf: is('banked') },
  { id: 'Rl', label: '고리 반지름 (radius)', sym: '<i>R</i>', unit: 'm', min: 2, max: 10, step: 0.5, value: 4, showIf: is('loop') },
  { id: 'vl', label: '꼭대기 속력', sym: '<i>v</i>', unit: 'm/s', min: 2, max: 15, step: 0.5, value: 8, showIf: is('loop') },
  { id: 'm', label: '질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 50, max: 300, step: 10, value: 120, showIf: is('loop') },
];
// Loop parameters under the names the loop functions use.
export const lp = p => ({ R: p.Rl, v: p.vl, m: p.m });

export function duration(p) {
  if (p.activity === 'flat') return flat(p).onRoad ? 2 * Math.PI * p.R / p.v : flatOffTime(p);
  if (p.activity === 'banked') return 2 * Math.PI * p.R / banked(p).v;
  return loopDuration(lp(p));
}
// The flat-road lap (on the road) and the banked lap repeat.
export const loop = p => (p.activity === 'flat' ? flat(p).onRoad : p.activity === 'banked');
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  const t = st.t;
  if (p.activity === 'flat') return { activity: 'flat', t, ...flatAt(t, p) };
  if (p.activity === 'banked') { const s = banked(p), ang = s.v * t / p.R; return { activity: 'banked', t, ...s, heading: ang }; }
  return { activity: 'loop', t, ...loopAt(t, lp(p)), top: loopTop(lp(p)) };
}
