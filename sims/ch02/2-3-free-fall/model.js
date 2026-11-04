// 2.5 Free-Fall Acceleration — pure model (no DOM).
// A ball leaves the hand at the roof edge with velocity v0 (+y up) and falls freely to the ground at y = −h.
// Textbook convention: the release point is y = 0, +y is up, a = −g with g = 9.8 m/s² taken as exact (Module 2.5).
// The equations are Table 2.4.1 in y notation with a = −g (no separate equation numbers in the textbook).
// Activities. throw: equal-interval images show the spacing shrink on the way up and grow on the way down.
// top: predict v and a at the highest point. sym: compare ascent and descent times and the speeds at one height.
// Sample Problem values are used only in model.test.js.

export const G = 9.8;                      // m/s², magnitude of the free-fall acceleration

const upOnly = p => p.activity !== 'throw';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'throw', options: [
    { value: 'throw', label: '던지고 보기' }, { value: 'top', label: '최고점 예측' }, { value: 'sym', label: '대칭' }] },
  { id: 'v0', label: '처음 속도 (initial velocity)', sym: '<i>v</i><sub>0</sub>', unit: 'm/s', min: -10, max: 25, step: 0.5, value: 10,
    bounds: p => (upOnly(p) ? [2, 25] : [-10, 25]) },
  { id: 'h', label: '던진 점의 높이 (height)', sym: '<i>h</i>', unit: 'm', min: 5, max: 50, step: 1, value: 12 },
  { id: 'yp', label: '비교할 높이', sym: '<i>y</i>', unit: 'm', min: 0, max: 10, step: 0.5, value: 3, showIf: p => p.activity === 'sym',
    bounds: p => [0, Math.max(0.5, Math.floor(maxHeight(p.v0) * 2 - 1e-9) / 2)] },
  { id: 'arrows', type: 'check', label: '속도·가속도 화살표', value: false },
];

// Table 2.4.1 in y notation with y0 = 0 and a = −g: Eqs. (2.4.5), (2.4.1), (2.4.6).
export function stateAt(v0, t) {
  return { y: v0 * t - 0.5 * G * t * t, v: v0 - G * t, a: -G };
}
export const timeToTop = v0 => (v0 > 0 ? v0 / G : 0);                    // v = 0
export const maxHeight = v0 => (v0 > 0 ? v0 * v0 / (2 * G) : 0);          // v² = v0² − 2g(y − y0) with v = 0
export const returnTime = v0 => (v0 > 0 ? 2 * v0 / G : 0);                // y = 0 again
// Time to reach y = −h (positive root of −½g t² + v0 t + h = 0).
export const groundTime = (v0, h) => (v0 + Math.sqrt(v0 * v0 + 2 * G * h)) / G;
// Velocity just before the ground, from (2.4.6), negative because it points down.
export const groundVelocity = (v0, h) => -Math.sqrt(v0 * v0 + 2 * G * h);

// Times when the ball is at height y (two passes for 0 ≤ y < y_max, one at y_max, none above).
export function timesAt(v0, y) {
  const d = v0 * v0 - 2 * G * y;
  if (d < -1e-12) return [];
  const r = Math.sqrt(Math.max(0, d));
  return r < 1e-9 ? [v0 / G] : [(v0 - r) / G, (v0 + r) / G].filter(t => t >= -1e-12);
}

// Interval between the equal-interval images. With an ascent it divides the rise time into n equal parts,
// so the images on the way down land at the same heights as the ones on the way up.
export function ghostStep(v0) {
  if (v0 <= 0) return 0.25;
  const tt = timeToTop(v0), n = Math.min(8, Math.max(3, Math.round(tt / 0.2)));
  return tt / n;
}
export function ghostTimes(v0, h, cap = 60) {
  const dt = ghostStep(v0), T = groundTime(v0, h), out = [];
  for (let k = 0; k * dt <= T + 1e-9 && out.length < cap; k++) out.push(k * dt);
  return out;
}

// ---------- activity "top" ----------
// v choice: '+', '0', '-'. a choice: '0', '-g', '+g'.
export function checkTop(vChoice, aChoice) {
  const vOk = vChoice === '0', aOk = aChoice === '-g';
  const reason = !vChoice || !aChoice ? 'incomplete' : aChoice === '0' ? 'a-zero' : aChoice === '+g' ? 'a-up' : !vOk ? 'v' : null;
  return { ok: vOk && aOk, vOk, aOk, reason };
}

// ---------- activity "sym" ----------
// times: 'up' (ascent longer), 'equal', 'down' (descent longer). speed at the release height: 'more', 'equal', 'less' than v0.
export function checkSym(times, speed) {
  if (!times || !speed) return { ok: false, reason: 'incomplete' };
  const tOk = times === 'equal', sOk = speed === 'equal';
  return { ok: tOk && sOk, tOk, sOk, reason: tOk && sOk ? null : 'value' };
}
export function symmetry(v0, y) {
  const up = timeToTop(v0), back = returnTime(v0);
  const ts = timesAt(v0, y);
  const passes = ts.map(t => ({ t, ...stateAt(v0, t) }));
  return { ascent: up, descent: back - up, passes, returnSpeed: Math.abs(stateAt(v0, back).v) };
}

// ---------- model contract ----------
export const duration = p => groundTime(p.v0, p.h);
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(s, p) {
  const k = stateAt(p.v0, s.t);
  return { activity: p.activity, t: s.t, ...k, speed: Math.abs(k.v), yMax: maxHeight(p.v0), tTop: timeToTop(p.v0), tGround: groundTime(p.v0, p.h) };
}
