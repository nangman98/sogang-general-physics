// 8.2 Conservation of Mechanical Energy — pure model (no DOM).
// Isolated system, only conservative forces do work: K2 + U2 = K1 + U1 (Eq. 8.2.6), E_mec = K + U (Eq. 8.2.1),
// U(y) = mgy (Eq. 8.1.9) with y = 0 at the floor of the scene.
// Activities.
//   track:    a cart rolls without friction along a track from height h (speed v0) to the end at height y_B.
//             Two track shapes with the same ends. Speed from energy, v = √(v0² + 2g(h − y)), so the end speed
//             does not depend on the shape (Sample Problem 8.2.1). Time along the track from t = ∫ ds/v.
//   pendulum: a bob on a string of length L released from rest at θ0. U = mgL(1 − cos θ) from the lowest point.
//             Motion θ'' = −(g/L) sin θ integrated once with RK4 (no small-angle approximation) and stored.
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const LEN = 10;          // m, horizontal length of the track
const rad = d => d * Math.PI / 180;
const step = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));          // smoothstep, zero slope at both ends
const dstep = u => (u <= 0 || u >= 1 ? 0 : 6 * u * (1 - u));

// ---------- track ----------
// Height y(x) and slope dy/dx of each shape. Both start at (0, h) and end at (LEN, yB) with zero slope there.
export function profile(x, { h, yB, shape }) {
  const u = x / LEN;
  if (shape === 'hill') {
    const hump = 0.45 * h;
    if (u <= 0.35) { const w = u / 0.35; return { y: h * (1 - step(w)), dy: -h * dstep(w) / (0.35 * LEN) }; }
    if (u <= 0.7) { const w = (u - 0.35) / 0.35, s = Math.sin(Math.PI * w); return { y: hump * s * s, dy: hump * Math.sin(2 * Math.PI * w) * Math.PI / (0.35 * LEN) }; }
    const w = (u - 0.7) / 0.3; return { y: yB * step(w), dy: yB * dstep(w) / (0.3 * LEN) };
  }
  return { y: yB + (h - yB) * (1 - step(u)), dy: -(h - yB) * dstep(u) / LEN };
}
export const speedAt = (x, p, g = G) => Math.sqrt(p.v0 * p.v0 + 2 * g * (p.h - profile(x, p).y));
const GRID = 2000;
const cache = new Map();
function trackTable(p) {
  const key = ['t', p.h, p.yB, p.shape, p.v0].join(',');
  if (cache.has(key)) return cache.get(key);
  const h = LEN / GRID, ts = [0], f = x => Math.hypot(1, profile(x, p).dy) / speedAt(x, p);
  for (let i = 1; i <= GRID; i++) { const a = (i - 1) * h, b = i * h; ts.push(ts[i - 1] + h / 6 * (f(a) + 4 * f((a + b) / 2) + f(b))); }
  if (cache.size > 40) cache.clear();
  cache.set(key, ts); return ts;
}
export function trackAt(t, p) {
  const ts = trackTable(p), h = LEN / GRID;
  if (t >= ts[GRID]) return LEN;
  let lo = 0, hi = GRID;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ts[mid] <= t) lo = mid; else hi = mid; }
  return (lo + (t - ts[lo]) / (ts[hi] - ts[lo])) * h;
}
export const endSpeed = (p, g = G) => Math.sqrt(p.v0 * p.v0 + 2 * g * (p.h - p.yB));

// ---------- pendulum ----------
// Complete elliptic integral of the first kind by the arithmetic–geometric mean, for the exact period.
export function ellipticK(k) {
  let a = 1, b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
  return Math.PI / (2 * a);
}
export const period = ({ L, theta0 }, g = G) => 4 * Math.sqrt(L / g) * ellipticK(Math.sin(rad(theta0) / 2));
const PSTEPS = 4000;
function pendTable(p, g = G) {
  const key = ['p', p.L, p.theta0].join(',');
  if (cache.has(key)) return cache.get(key);
  const T = period(p, g), dt = T / PSTEPS, w2 = g / p.L;
  const f = (th, om) => [om, -w2 * Math.sin(th)];
  const th = [rad(p.theta0)], om = [0];
  for (let i = 0; i < PSTEPS; i++) {
    const a = th[i], b = om[i];
    const k1 = f(a, b), k2 = f(a + dt / 2 * k1[0], b + dt / 2 * k1[1]), k3 = f(a + dt / 2 * k2[0], b + dt / 2 * k2[1]), k4 = f(a + dt * k3[0], b + dt * k3[1]);
    th.push(a + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])); om.push(b + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]));
  }
  const out = { T, dt, th, om, w2 };
  if (cache.size > 40) cache.clear();
  cache.set(key, out); return out;
}
// θ and ω at time t (cubic Hermite between stored RK4 steps; θ' = ω, ω' = −(g/L) sin θ).
export function pendulumAt(t, p, g = G) {
  const { T, dt, th, om, w2 } = pendTable(p, g);
  const tt = ((t % T) + T) % T, i = Math.min(PSTEPS - 1, Math.floor(tt / dt)), s = tt / dt - i;
  const h00 = 2 * s ** 3 - 3 * s * s + 1, h10 = s ** 3 - 2 * s * s + s, h01 = -2 * s ** 3 + 3 * s * s, h11 = s ** 3 - s * s;
  const theta = h00 * th[i] + h10 * dt * om[i] + h01 * th[i + 1] + h11 * dt * om[i + 1];
  const a0 = -w2 * Math.sin(th[i]), a1 = -w2 * Math.sin(th[i + 1]);
  const omega = h00 * om[i] + h10 * dt * a0 + h01 * om[i + 1] + h11 * dt * a1;
  return { theta, omega };
}
export const bottomSpeed = ({ L, theta0 }, g = G) => Math.sqrt(2 * g * L * (1 - Math.cos(rad(theta0))));

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkTrack(p, { vText, shapeChoice }) {
  const V = endSpeed(p), v = parseNumber(vText);
  const r = { vOk: false, sOk: shapeChoice === 'same', vReason: null, sReason: null };
  if (!shapeChoice) r.sReason = 'empty'; else if (!r.sOk) r.sReason = 'shape';
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, V)) r.vOk = true;
  else r.vReason = near(v, Math.sqrt(2 * G * (p.h - p.yB))) && p.v0 > 0 ? 'noV0' : near(v, Math.sqrt(2 * G * p.h + p.v0 * p.v0)) && p.yB > 0 ? 'noYB' : near(v, p.v0 + Math.sqrt(2 * G * (p.h - p.yB))) ? 'addSpeeds' : near(v, Math.sqrt(G * (p.h - p.yB))) ? 'noTwo' : 'value';
  return { ...r, ok: r.vOk && r.sOk };
}
export function checkPendulum(p, { vText, angleText }) {
  const V = bottomSpeed(p), v = parseNumber(vText), a = parseNumber(angleText);
  const r = { vOk: false, aOk: false, vReason: null, aReason: null };
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(v, V)) r.vOk = true;
  else r.vReason = near(v, Math.sqrt(2 * G * p.L)) ? 'fullL' : near(v, Math.sqrt(2 * G * p.L * Math.cos(rad(p.theta0)))) ? 'cos' : near(v, Math.sqrt(2 * G * p.L * Math.sin(rad(p.theta0)))) ? 'sin' : 'value';
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (Math.abs(a - p.theta0) <= 0.5) r.aOk = true;
  else r.aReason = a < p.theta0 ? 'less' : 'more';
  return { ...r, ok: r.vOk && r.aOk };
}

// ---------- model contract ----------
const isTrack = p => p.activity === 'track';
const isPend = p => p.activity === 'pendulum';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'track', options: [{ value: 'track', label: '트랙' }, { value: 'pendulum', label: '진자' }] },
  { id: 'shape', type: 'select', label: '트랙 모양', value: 'gentle', showIf: isTrack, options: [{ value: 'gentle', label: '완만한 내리막' }, { value: 'hill', label: '골짜기와 언덕' }] },
  { id: 'h', label: '출발 높이', sym: '<i>h</i>', unit: 'm', min: 2, max: 8, step: 0.5, value: 6, showIf: isTrack },
  { id: 'yB', label: '끝 높이', sym: '<i>y</i><sub>B</sub>', unit: 'm', min: 0, max: 7.5, step: 0.5, value: 2, showIf: isTrack, bounds: p => [0, p.h - 0.5] },
  { id: 'v0', label: '처음 속력', sym: '<i>v</i><sub>0</sub>', unit: 'm/s', min: 0.5, max: 6, step: 0.5, value: 3, showIf: isTrack },
  { id: 'm', label: '질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 2 },
  { id: 'L', label: '줄 길이', sym: '<i>L</i>', unit: 'm', min: 0.5, max: 3, step: 0.1, value: 2, showIf: isPend },
  { id: 'theta0', label: '처음 각', sym: '<i>θ</i><sub>0</sub>', unit: '°', min: 5, max: 80, step: 1, value: 50, showIf: isPend },
];

export function duration(p) { return p.activity === 'pendulum' ? period(p) : trackTable(p)[GRID]; }
export const loop = p => p.activity === 'pendulum';
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  const t = st.t;
  if (p.activity === 'pendulum') {
    const { theta, omega } = pendulumAt(t, p), v = Math.abs(omega) * p.L;
    const U = p.m * G * p.L * (1 - Math.cos(theta)), K = 0.5 * p.m * v * v;
    return { activity: 'pendulum', t, theta, omega, v, U, K, E: U + K, E0: p.m * G * p.L * (1 - Math.cos(rad(p.theta0))) };
  }
  const x = trackAt(t, p), { y, dy } = profile(x, p), v = speedAt(x, p);
  const U = p.m * G * y, K = 0.5 * p.m * v * v;
  return { activity: 'track', t, x, y, dy, v, U, K, E: U + K, E0: p.m * G * p.h + 0.5 * p.m * p.v0 * p.v0 };
}
