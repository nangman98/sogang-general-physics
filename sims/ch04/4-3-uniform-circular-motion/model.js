// 4.5 Uniform Circular Motion — pure model (no DOM). Textbook: Principles of Physics 12e, Eqs. (4.5.1)–(4.5.6).
// A car goes around a horizontal circular track. The textbook xy plane of Fig. 4.5.2 is the horizontal
// plane here: textbook x is the scene x and textbook y is the scene −z, so counterclockwise seen from above
// (+y) is the textbook counterclockwise. Exact state at every time, no integrator.
// Activities. watch: v tangent, a toward the centre, always perpendicular, a = v²/r and T = 2πr/v.
// direction: pick the direction of v and of a at a marked point (graded).
// size: predict a value or a ratio from Eqs. (4.5.1) and (4.5.2), then see it (graded).
import { parseNumber } from '../../../core/format.js';

export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'watch', options: [
    { value: 'watch', label: '벡터 보기' }, { value: 'direction', label: '방향 예측' }, { value: 'size', label: '크기 예측' }] },
  { id: 'r', label: '반지름 (radius)', sym: '<i>r</i>', unit: 'm', min: 10, max: 40, step: 1, value: 20, showIf: p => p.activity === 'watch' },
  { id: 'v', label: '속력 (speed)', sym: '<i>v</i>', unit: 'm/s', min: 4, max: 14, step: 0.5, value: 10, showIf: p => p.activity === 'watch' },
  { id: 'arrows', type: 'check', label: '속도·가속도 화살표', value: true, showIf: p => p.activity !== 'direction' },
];

// Eq. (4.5.1) and (4.5.2).
export const centripetal = (v, r) => v * v / r;
export const period = (r, v) => 2 * Math.PI * r / v;
export const speedFromPeriod = (r, T) => 2 * Math.PI * r / T;
export const speedForAcceleration = (a, r) => Math.sqrt(a * r);   // Eq. (4.5.1) solved for v

const norm = a => Math.hypot(...a);
export function angleBetween(a, b) {
  const c = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (norm(a) * norm(b));
  return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
}

// Car at angle phi (rad, from +x toward −z), turning counterclockwise (dir = +1) or clockwise (−1).
// Textbook Eq. (4.5.3) v = (−v sin θ)i + (v cos θ)j and Eq. (4.5.6) a = (−v²/r cos θ)i + (−v²/r sin θ)j,
// written with j → −z.
export function circular(r, v, phi, dir = 1) {
  const c = Math.cos(phi), s = Math.sin(phi), a = centripetal(v, r);
  return {
    position: [r * c, 0, -r * s],
    velocity: [-dir * v * s, 0, -dir * v * c],
    acceleration: [-a * c, 0, a * s],
    a,
  };
}

// ---------- direction prediction ----------
// Four arrows in the track plane: forward along the motion, backward, toward the centre, away from it.
export const DIR_R = 20, DIR_V = 10;          // m, m/s used for the drawn arrows
// Points on the near half of the track (seen from the default camera), both turning senses.
const DIR_LIST = [
  { phi: 300, dir: 1 }, { phi: 215, dir: -1 }, { phi: 250, dir: 1 },
  { phi: 335, dir: -1 }, { phi: 190, dir: 1 }, { phi: 275, dir: -1 },
];
export const DCOUNT = DIR_LIST.length;
const ORDERS = [[1, 0, 3, 2], [2, 3, 0, 1], [0, 2, 1, 3], [3, 1, 2, 0], [1, 3, 0, 2], [2, 0, 3, 1]];
const KEYS = ['forward', 'backward', 'inward', 'outward'];

export function dirQuestion(index) {
  const i = ((index % DCOUNT) + DCOUNT) % DCOUNT, d = DIR_LIST[i];
  const phi = d.phi * Math.PI / 180, s = circular(DIR_R, DIR_V, phi, d.dir);
  const u = x => x.map(c => c / norm(x));
  const fwd = u(s.velocity), inw = u(s.acceleration);
  const dirs = { forward: fwd, backward: fwd.map(c => -c), inward: inw, outward: inw.map(c => -c) };
  const arrange = order => order.map(k => KEYS[k]).map((key, n) => ({ key, dir: dirs[key], no: String(n + 1) }));
  // Velocity and acceleration use different orders so the two answers are not the same number.
  return { index: i, ...d, phi, state: s, choices: { v: arrange(ORDERS[i % 6]), a: arrange(ORDERS[(i + 4) % 6]) } };
}

export function checkDirection(q, kind, no) {
  const list = q.choices[kind], want = kind === 'v' ? 'forward' : 'inward';
  const answer = list.find(c => c.key === want).no, pick = list.find(c => c.no === no);
  if (!pick) return { ok: false, reason: 'none', answer };
  return { ok: pick.no === answer, reason: pick.no === answer ? null : pick.key, answer };
}

// ---------- size prediction ----------
// value: a number from Eq. (4.5.1) or (4.5.2). ratio: how many times a becomes after one change.
// Values are chosen for the screen, not taken from the textbook problems.
const SIZE_LIST = [
  { type: 'value', ask: 'a', r: 20, v: 10 },
  { type: 'ratio', r: 20, v: 8, after: { r: 20, v: 16 } },
  { type: 'value', ask: 'T', r: 12, v: 6 },
  { type: 'ratio', r: 10, v: 10, after: { r: 20, v: 10 } },
  { type: 'value', ask: 'a', r: 30, T: 20 },
  { type: 'ratio', r: 15, T: 12, after: { r: 30, T: 12 } },
];
export const SCOUNT = SIZE_LIST.length;
export const RATIOS = [0.25, 0.5, 1, 2, 4];

// Fill in v from T where the question gives the period, so every state has r and v.
const full = s => (s.v === undefined ? { ...s, v: speedFromPeriod(s.r, s.T) } : { ...s, T: s.T ?? period(s.r, s.v) });
export function sizeQuestion(index) {
  const i = ((index % SCOUNT) + SCOUNT) % SCOUNT, q = SIZE_LIST[i];
  const before = full({ r: q.r, v: q.v, T: q.T });
  const out = { index: i, type: q.type, ask: q.ask ?? 'a', givenT: q.T !== undefined, before };
  out.before.a = centripetal(before.v, before.r);
  if (q.type === 'ratio') {
    const after = full({ ...q.after });
    after.a = centripetal(after.v, after.r);
    out.after = after;
    out.answer = after.a / out.before.a;
  } else {
    out.answer = out.ask === 'a' ? out.before.a : out.before.T;
  }
  return out;
}

// Value answers within 2 %. A common slip for a = v²/r is to forget the square (a = v/r); that is named.
export function checkSize(q, input) {
  if (q.type === 'ratio') {
    const x = Number(input);
    if (!RATIOS.includes(x)) return { ok: false, reason: 'none' };
    if (Math.abs(x - q.answer) < 1e-9) return { ok: true, reason: null };
    if (Math.abs(x - Math.sqrt(q.answer)) < 1e-9 && q.answer > 1) return { ok: false, reason: 'linear' };
    if (Math.abs(x * q.answer - 1) < 1e-9) return { ok: false, reason: 'inverse' };
    return { ok: false, reason: 'value' };
  }
  const x = parseNumber(input);
  if (!Number.isFinite(x)) return { ok: false, reason: 'unreadable' };
  if (Math.abs(x - q.answer) <= 0.02 * Math.abs(q.answer)) return { ok: true, reason: null };
  const b = q.before;
  if (q.ask === 'a' && Math.abs(x - b.v / b.r) <= 0.02 * (b.v / b.r)) return { ok: false, reason: 'nosquare' };
  return { ok: false, reason: 'value' };
}

// ---------- model contract ----------
export const duration = p => (p.activity === 'watch' ? 2 * period(p.r, p.v) : p.activity === 'size' ? 60 : 0);
// Two laps are one cycle of the time slider. Playback repeats them until paused (user 2026-11-04).
export const loop = p => p.activity === 'watch';
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(s, p) {
  const st = circular(p.r, p.v, p.v / p.r * s.t, 1);
  return {
    t: s.t, ...st, r: p.r, v: p.v, T: period(p.r, p.v),
    angle: angleBetween(st.velocity, st.acceleration),
    phiDeg: ((p.v / p.r * s.t) * 180 / Math.PI) % 360,
  };
}
