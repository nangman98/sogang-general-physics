// 2.1–2.3 Average velocity, instantaneous velocity, acceleration — pure model (no DOM).
// Activities. secant: a secant over [t1, t1 + Δt] on the x–t board gives v_avg (Eq. 2.1.2), on the v–t board a_avg (Eq. 2.3.1).
//   As Δt shrinks the secant slope tends to the tangent slope v = dx/dt (Eq. 2.2.1) or a = dv/dt (Eq. 2.3.2).
// slope: the tangent slope of x–t at time t is the point on v–t, the tangent slope of v–t is a.
// speed: signs of v and a decide whether the speed |v| grows (textbook 2.3 "Signs").
// Five preset motions with analytic derivatives. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const T = 8;                        // s, time span of the boards
const W = Math.PI / 4;                     // rad/s, swing motion with period 8 s

// x in m, t in s. marks: three times whose velocity sign is predicted in activity "slope".
export const MOTIONS = {
  restgo: {
    label: '정지 뒤 출발',
    x: t => (t <= 2 ? -8 : -8 + (t - 2) ** 3 / 12),
    v: t => (t <= 2 ? 0 : (t - 2) ** 2 / 4),
    a: t => (t <= 2 ? 0 : (t - 2) / 2),
    xTex: 'x = \\begin{cases} -8 & (t \\le 2) \\\\ -8 + \\tfrac{1}{12}(t-2)^3 & (t > 2) \\end{cases}',
    vTex: '\\tfrac{1}{4}(t-2)^2', aTex: '\\tfrac{1}{2}(t-2)', piecewise: true,
    marks: [1, 4, 7],
  },
  uniform: {
    label: '등속',
    x: t => 6 - 1.5 * t, v: () => -1.5, a: () => 0,
    xTex: 'x = 6 - 1.5t', vTex: '-1.5', aTex: '0',
    marks: [1, 4, 7],
  },
  speedup: {
    label: '가속',
    x: t => -9 + 0.5 * t + 0.25 * t * t, v: t => 0.5 + 0.5 * t, a: () => 0.5,
    xTex: 'x = -9 + 0.5t + 0.25t^2', vTex: '0.5 + 0.5t', aTex: '0.5',
    marks: [1, 4, 7],
  },
  turn: {
    label: '감속해 되돌아옴',
    x: t => -8 + 6 * t - 0.75 * t * t, v: t => 6 - 1.5 * t, a: () => -1.5,
    xTex: 'x = -8 + 6t - 0.75t^2', vTex: '6 - 1.5t', aTex: '-1.5',
    marks: [2, 4, 6],
  },
  swing: {
    label: '앞뒤 왕복',
    x: t => 8 * Math.sin(W * t), v: t => 8 * W * Math.cos(W * t), a: t => -8 * W * W * Math.sin(W * t),
    xTex: 'x = 8\\sin\\!\\left(\\tfrac{\\pi}{4}t\\right)', vTex: '2\\pi\\cos\\!\\left(\\tfrac{\\pi}{4}t\\right)', aTex: '-\\tfrac{\\pi^2}{2}\\sin\\!\\left(\\tfrac{\\pi}{4}t\\right)',
    marks: [1, 4, 6],
  },
};
export const MOTION_IDS = Object.keys(MOTIONS);
export const SPEED_MOTION = 'swing';
export const SPEED_TIMES = [1, 3, 5, 7];  // s, one time in each sign quadrant of (v, a) for the swing

const notSpeed = p => p.activity !== 'speed';
const secantOnly = p => p.activity === 'secant';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'secant', options: [
    { value: 'secant', label: '평균과 순간' }, { value: 'slope', label: '기울기 읽기' }, { value: 'speed', label: '속력 변화' }] },
  { id: 'motion', type: 'select', label: '운동 (motion)', value: 'turn', options: MOTION_IDS.map(k => ({ value: k, label: MOTIONS[k].label })), showIf: notSpeed },
  { id: 'board', type: 'tabs', label: '할선을 그릴 판', value: 'x', options: [
    { value: 'x', label: '<i>x</i>–<i>t</i> 판' }, { value: 'v', label: '<i>v</i>–<i>t</i> 판' }], showIf: secantOnly },
  { id: 't1', label: '시작 시각', sym: '<i>t</i><sub>1</sub>', unit: 's', min: 0, max: 6, step: 0.1, value: 2, showIf: secantOnly },
  { id: 'dt', label: '시간 간격 (time interval)', sym: 'Δ<i>t</i>', unit: 's', min: 0.01, max: 2, step: 0.01, value: 2, showIf: secantOnly },
  { id: 'arrows', type: 'check', label: '속도·가속도 화살표', value: false },
];

export const motionOf = p => MOTIONS[p.activity === 'speed' ? SPEED_MOTION : p.motion] ?? MOTIONS.turn;
export const kin = (m, t) => ({ x: m.x(t), v: m.v(t), a: m.a(t) });

// Eqs. (2.1.1)–(2.1.3) and (2.3.1).
export const displacement = (x1, x2) => x2 - x1;
export const vAvg = (x1, x2, t1, t2) => (x2 - x1) / (t2 - t1);
export const sAvg = (totalDistance, dt) => totalDistance / dt;
export const aAvg = (v1, v2, t1, t2) => (v2 - v1) / (t2 - t1);

// Secant over [t1, t1 + dt] on the x–t board (q = 'x') or the v–t board (q = 'v').
// slope is v_avg or a_avg, tangent is the limit v or a at t1.
export function secant(m, t1, dt, q = 'x') {
  const f = q === 'v' ? m.v : m.x, df = q === 'v' ? m.a : m.v;
  const t2 = t1 + dt, y1 = f(t1), y2 = f(t2);
  return { q, t1, t2, dt, y1, y2, dy: y2 - y1, slope: q === 'v' ? aAvg(y1, y2, t1, t2) : vAvg(y1, y2, t1, t2), tangent: df(t1) };
}

// Range of a quantity over [0, T] by dense sampling (the presets are smooth, 801 samples are enough).
export function range(fn, tMax = T, n = 800) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= n; i++) { const y = fn(tMax * i / n); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  return [lo, hi];
}

// ---------- activity "secant": estimate v (or a) at t1 from the shrinking secant ----------
export function checkEstimate(m, t1, dt, q, text) {
  const s = secant(m, t1, dt, q), target = s.tangent, x = parseNumber(text);
  if (!Number.isFinite(x)) return { ok: false, reason: 'unreadable', target, s };
  const tol = Math.max(0.05, 0.02 * Math.abs(target));
  if (Math.abs(x - target) <= tol) return { ok: true, reason: null, target, s };
  if (Math.abs(target) > tol && Math.abs(x + target) <= tol) return { ok: false, reason: 'sign', target, s };
  // The current secant slope while Δt is still large: the average, not the instantaneous value.
  if (Math.abs(s.slope - target) > tol && Math.abs(x - s.slope) <= Math.max(0.02, 0.01 * Math.abs(s.slope))) return { ok: false, reason: 'secant', target, s };
  // Height read instead of slope: x(t1)/t1 on x–t (or v(t1)/t1 on v–t).
  if (t1 > 0) { const ratio = s.y1 / t1; if (Math.abs(ratio - target) > tol && Math.abs(x - ratio) <= Math.max(0.02, 0.02 * Math.abs(ratio))) return { ok: false, reason: 'ratio', target, s }; }
  // Value of the plotted quantity itself instead of its slope.
  if (Math.abs(s.y1 - target) > tol && Math.abs(x - s.y1) <= Math.max(0.02, 0.01 * Math.abs(s.y1))) return { ok: false, reason: 'height', target, s };
  return { ok: false, reason: 'value', target, s };
}

// ---------- activity "slope": sign of v at three marked times ----------
export const sign = (y, tol = 1e-9) => (y > tol ? '+' : y < -tol ? '-' : '0');
export function checkSigns(m, choices) {
  const items = m.marks.map((t, i) => ({ t, v: m.v(t), sign: sign(m.v(t)), chosen: choices[i] ?? '' }));
  for (const it of items) it.ok = it.chosen === it.sign;
  return { ok: items.every(it => it.ok), complete: items.every(it => it.chosen), items };
}

// ---------- activity "speed": does the speed grow? ----------
// 'up' when v and a have the same sign, 'down' when opposite, 'none' when either is zero (textbook 2.3 Signs).
export function speedChange(v, a, tol = 1e-9) {
  const sv = sign(v, tol), sa = sign(a, tol);
  if (sv === '0' || sa === '0') return 'none';
  return sv === sa ? 'up' : 'down';
}
export function checkSpeed(choices, m = MOTIONS[SPEED_MOTION], times = SPEED_TIMES) {
  const items = times.map((t, i) => {
    const v = m.v(t), a = m.a(t), answer = speedChange(v, a);
    return { t, v, a, answer, chosen: choices[i] ?? '', ok: (choices[i] ?? '') === answer };
  });
  const complete = items.every(it => it.chosen);
  const ok = items.every(it => it.ok);
  // Two typical patterns: judging from the sign of a alone, or from the sign of v alone.
  let pattern = null;
  if (complete && !ok) {
    if (items.every(it => it.chosen === (it.a > 0 ? 'up' : 'down'))) pattern = 'a-sign';
    else if (items.every(it => it.chosen === (it.v > 0 ? 'up' : 'down'))) pattern = 'v-sign';
  }
  return { ok, complete, items, pattern };
}

// ---------- model contract ----------
export const duration = () => T;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(s, p) {
  const m = motionOf(p), k = kin(m, s.t);
  const o = { activity: p.activity, t: s.t, ...k, speed: Math.abs(k.v), change: speedChange(k.v, k.a) };
  if (p.activity === 'secant') o.sec = secant(m, p.t1, p.dt, p.board);
  return o;
}
