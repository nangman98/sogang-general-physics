// 10.2–10.3 Rotation with Constant Angular Acceleration, Relating the Linear and Angular Variables — pure model.
// A wheel turns about a fixed axis with constant angular acceleration α. Counterclockwise is positive (textbook).
// ω = ω0 + αt (Eq. 10.2.1), θ − θ0 = ω0t + ½αt² (Eq. 10.2.2).
// A point at radius r: v = ωr (Eq. 10.3.2), a_t = αr (Eq. 10.3.6), a_r = ω²r (Eq. 10.3.7), all in radian measure.
// Activities.
//   angular: predict ω and the turn θ − θ0 (in revolutions) at t = t1.
//   linear:  predict v and a_r of the marked point at t = t1.
// The run stops at t1. Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const WHEEL = 1.2;       // m, drawn wheel radius (the marked point sits at r ≤ WHEEL)

export function stateAt(t, { w0, alpha, r }) {
  const w = w0 + alpha * t, th = w0 * t + 0.5 * alpha * t * t;
  return { t, w, th, v: w * r, at: alpha * r, ar: w * w * r, a: Math.hypot(alpha * r, w * w * r) };
}
export const rev = rad => rad / (2 * Math.PI);

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkAngular(p, { wText, nText }) {
  const s = stateAt(p.t1, p), w = parseNumber(wText), n = parseNumber(nText);
  const r = { wOk: false, nOk: false, wReason: null, nReason: null };
  if (!Number.isFinite(w)) r.wReason = 'unreadable';
  else if (near(w, s.w)) r.wOk = true;
  else r.wReason = Math.abs(s.w) > 1e-9 && near(w, -s.w) ? 'sign' : near(w, p.alpha * p.t1) && Math.abs(p.w0) > 0 ? 'noW0' : 'value';
  if (!Number.isFinite(n)) r.nReason = 'unreadable';
  else if (near(n, rev(s.th))) r.nOk = true;
  else r.nReason = near(n, s.th) ? 'radians' : near(n, rev(p.w0 * p.t1 + p.alpha * p.t1 * p.t1)) ? 'noHalf' : near(n, rev(s.w * p.t1)) ? 'finalOnly' : 'value';
  return { ...r, ok: r.wOk && r.nOk };
}
export function checkLinear(p, { vText, aText }) {
  const s = stateAt(p.t1, p), v = parseNumber(vText), a = parseNumber(aText);
  const r = { vOk: false, aOk: false, vReason: null, aReason: null };
  if (!Number.isFinite(v)) r.vReason = 'unreadable';
  else if (near(Math.abs(v), Math.abs(s.v))) r.vOk = true;
  else r.vReason = near(Math.abs(v), Math.abs(s.w) / p.r) ? 'divide' : near(Math.abs(v), Math.abs(s.w) * p.r * 2 * Math.PI) ? 'twoPi' : 'value';
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(a, s.ar)) r.aOk = true;
  else r.aReason = near(Math.abs(a), Math.abs(s.at)) ? 'tangential' : near(a, s.a) ? 'total' : near(Math.abs(a), Math.abs(s.w) * p.r) ? 'noSquare' : 'value';
  return { ...r, ok: r.vOk && r.aOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'angular', options: [{ value: 'angular', label: '각속도와 회전각' }, { value: 'linear', label: '선속도와 가속도' }] },
  { id: 'w0', label: '처음 각속도', sym: '<i>ω</i><sub>0</sub>', unit: 'rad/s', min: -3, max: 3, step: 0.25, value: -1 },
  { id: 'alpha', label: '각가속도', sym: '<i>α</i>', unit: 'rad/s²', min: -1, max: 1, step: 0.05, value: 0.5 },
  { id: 't1', label: '묻는 시각', sym: '<i>t</i><sub>1</sub>', unit: 's', min: 1, max: 8, step: 0.5, value: 5 },
  { id: 'r', label: '표시점 반지름', sym: '<i>r</i>', unit: 'm', min: 0.2, max: 1.2, step: 0.05, value: 0.8, showIf: p => p.activity === 'linear' },
];
export const duration = p => p.t1;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, ...stateAt(st.t, { ...p, r: p.activity === 'linear' ? p.r : 0.8 }) }; }
