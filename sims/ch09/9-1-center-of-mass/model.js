// 9.1–9.2 Center of Mass, Newton's Second Law for a System of Particles — pure model (no DOM).
// Activities.
//   com:     three particles at the corners of an equilateral triangle of edge a (particle 1 at the origin,
//            particle 2 at (a, 0), particle 3 at (a/2, a√3/2)), the arrangement of Sample Problem 9.1.1.
//            x_com = Σ m_i x_i / M, y_com = Σ m_i y_i / M (Eq. 9.1.5).
//   explode: a shell fired at speed v0 and angle θ0 splits at the top of its path into two pieces. Piece 1 (mass m1)
//            is left at rest and falls straight down. Momentum along x is conserved in the split, so piece 2 moves
//            on with v_x = (M/m2) v0 cos θ0. The only external force is gravity, so the center of mass keeps the
//            original parabola (F_net = M a_com, Eq. 9.2.1) until the pieces land together.
// Closed-form motion. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
const rad = d => d * Math.PI / 180;

// ---------- com ----------
export function corners(a) { return [[0, 0], [a, 0], [a / 2, a * Math.sqrt(3) / 2]]; }
export function centerOfMass(masses, points) {
  const M = masses.reduce((s, m) => s + m, 0);
  return { M, x: masses.reduce((s, m, i) => s + m * points[i][0], 0) / M, y: masses.reduce((s, m, i) => s + m * points[i][1], 0) / M };
}
export const comOf = p => centerOfMass([p.m1, p.m2, p.m3], corners(p.a));

// ---------- explode ----------
export function shell({ v0, theta0, f1 }, g = G) {
  const vx = v0 * Math.cos(rad(theta0)), vy = v0 * Math.sin(rad(theta0));
  const tTop = vy / g, H = vy * vy / (2 * g), xTop = vx * tTop, R = 2 * xTop;
  const m1 = f1, m2 = 1 - f1;                                              // masses as fractions of M
  return { vx, vy, tTop, H, xTop, R, x1: xTop, x2: xTop + (vx / m2) * tTop, m1, m2 };
}
// Positions at time t: com, and the two pieces (identical to the shell before the split).
export function shellAt(t, p, g = G) {
  const s = shell(p, g), tt = Math.min(t, 2 * s.tTop);
  const com = [s.vx * tt, s.vy * tt - 0.5 * g * tt * tt];
  if (tt <= s.tTop) return { com, one: com, two: com, split: false };
  const u = tt - s.tTop, yDown = s.H - 0.5 * g * u * u;
  return { com, one: [s.xTop, yDown], two: [s.xTop + s.vx / s.m2 * u, yDown], split: true };
}

// ---------- grading ----------
const near = (x, y, abs = 0.01) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), abs);
export function checkCom(p, { xText, yText }) {
  const c = comOf(p), x = parseNumber(xText), y = parseNumber(yText);
  const r = { xOk: false, yOk: false, xReason: null, yReason: null };
  const plain = centerOfMass([1, 1, 1], corners(p.a));
  if (!Number.isFinite(x)) r.xReason = 'unreadable';
  else if (near(x, c.x)) r.xOk = true;
  else r.xReason = near(x, plain.x) && Math.abs(plain.x - c.x) > 0.01 ? 'unweighted' : near(x, c.x * c.M) ? 'noDivide' : 'value';
  if (!Number.isFinite(y)) r.yReason = 'unreadable';
  else if (near(y, c.y)) r.yOk = true;
  else r.yReason = near(y, plain.y) && Math.abs(plain.y - c.y) > 0.01 ? 'unweighted' : near(y, c.y * c.M) ? 'noDivide' : 'value';
  return { ...r, ok: r.xOk && r.yOk };
}
export function checkExplode(p, { xText }) {
  const s = shell(p), x = parseNumber(xText);
  if (!Number.isFinite(x)) return { ok: false, reason: 'unreadable' };
  if (near(x, s.x2, 0.05)) return { ok: true, reason: null };
  if (near(x, s.R, 0.05)) return { ok: false, reason: 'range' };
  if (Math.abs(p.f1 - 0.5) > 1e-9 && near(x, 1.5 * s.R, 0.05)) return { ok: false, reason: 'equalSplit' };     // the equal-mass answer
  return { ok: false, reason: 'value' };
}

// ---------- model contract ----------
const isCom = p => p.activity === 'com';
const isExp = p => p.activity === 'explode';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'com', options: [{ value: 'com', label: '질량중심 찾기' }, { value: 'explode', label: '쪼개지는 포탄' }] },
  { id: 'm1', label: '입자 1 질량', sym: '<i>m</i><sub>1</sub>', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 1, showIf: isCom },
  { id: 'm2', label: '입자 2 질량', sym: '<i>m</i><sub>2</sub>', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 2, showIf: isCom },
  { id: 'm3', label: '입자 3 질량', sym: '<i>m</i><sub>3</sub>', unit: 'kg', min: 0.5, max: 5, step: 0.5, value: 3, showIf: isCom },
  { id: 'a', label: '삼각형 한 변', sym: '<i>a</i>', unit: 'm', min: 0.5, max: 2, step: 0.1, value: 1.2, showIf: isCom },
  { id: 'v0', label: '발사 속력', sym: '<i>v</i><sub>0</sub>', unit: 'm/s', min: 10, max: 25, step: 1, value: 18, showIf: isExp },
  { id: 'theta0', label: '발사 각', sym: '<i>θ</i><sub>0</sub>', unit: '°', min: 20, max: 70, step: 1, value: 50, showIf: isExp },
  { id: 'f1', label: '조각 1의 질량 비율', sym: '<i>m</i><sub>1</sub>/<i>M</i>', min: 0.1, max: 0.7, step: 0.05, value: 0.5, showIf: isExp, format: v => v.toFixed(2) },
];

export function duration(p) { return p.activity === 'explode' ? 2 * shell(p).tTop : 2; }
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  if (p.activity === 'explode') return { activity: 'explode', t: st.t, ...shellAt(st.t, p), s: shell(p) };
  return { activity: 'com', t: st.t, c: comOf(p) };
}
