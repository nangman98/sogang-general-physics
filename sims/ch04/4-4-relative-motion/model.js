// 4.6–4.7 Relative Motion — pure model (no DOM). Textbook: Principles of Physics 12e, Eqs. (4.6.1)–(4.6.2), (4.7.1)–(4.7.2).
// A boat P crosses a river. Frame A is attached to the bank (ground), frame B to the water, which moves
// at the constant velocity v_BA along +x (downstream). Textbook letters: v_PA = v_PB + v_BA.
// Scene axes: x downstream, y up, z toward the near bank. The start dock is the origin O of frame A,
// the far bank is at z = −D. The heading θ is measured from straight across (−z) toward upstream (−x).
// Activities. add: watch the velocity sum from either frame. land: predict the crossing time and the
// landing point before playing (graded). aim: choose the heading that lands directly opposite (graded).
import { parseNumber } from '../../../core/format.js';

export const D = 24;                 // m, river width (screen value)
export const THETA = [-45, 60];      // degrees, heading range

export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'add', options: [
    { value: 'add', label: '속도 더하기' }, { value: 'land', label: '도착 예측' }, { value: 'aim', label: '방향 맞추기' }] },
  { id: 'u', label: '강물에 대한 배의 속력', sym: '<i>v</i><sub>PB</sub>', unit: 'm/s', min: 2, max: 6, step: 0.1, value: 3, showIf: p => p.activity === 'add' },
  { id: 'w', label: '강가에 대한 강물의 속력', sym: '<i>v</i><sub>BA</sub>', unit: 'm/s', min: 0, max: 3, step: 0.1, value: 1.5, showIf: p => p.activity === 'add' },
  { id: 'theta', label: '뱃머리 각 (상류 쪽 +)', sym: '<i>θ</i>', unit: '°', min: THETA[0], max: THETA[1], step: 0.1, value: 0, showIf: p => p.activity === 'add' },
  { id: 'frame', type: 'select', label: '보는 기준 (reference frame)', value: 'A', options: [
    { value: 'A', label: '강가에서 (frame A)' }, { value: 'B', label: '강물에서 (frame B)' }], showIf: p => p.activity === 'add' },
  { id: 'arrows', type: 'check', label: '속도 화살표', value: true },
];

const rad = d => d * Math.PI / 180;
export const add = (a, b) => a.map((v, i) => v + b[i]);
// Eq. (4.6.2) or (4.7.2) solved for the velocity relative to B: v_PB = v_PA − v_BA.
export const relative = (vPA, vBA) => vPA.map((v, i) => v - vBA[i]);

// Eq. (4.7.2): v_PA = v_PB + v_BA.
export function velocities({ u, w, theta }) {
  const th = rad(theta);
  const vPB = [-u * Math.sin(th), 0, -u * Math.cos(th)], vBA = [w, 0, 0];
  return { vPB, vBA, vPA: add(vPB, vBA) };
}
// The across component comes from the boat alone, so the current does not change the crossing time.
export const crossingTime = p => D / (p.u * Math.cos(rad(p.theta)));
export const landingX = p => velocities(p).vPA[0] * crossingTime(p);

// Eq. (4.7.1) at time t (clamped to the crossing): r_PA = r_PB + r_BA, both origins at O when t = 0.
export function positions(p, t) {
  const tc = Math.min(Math.max(t, 0), crossingTime(p)), { vPB, vBA, vPA } = velocities(p);
  return { t: tc, rPB: vPB.map(v => v * tc), rBA: vBA.map(v => v * tc), rPA: vPA.map(v => v * tc) };
}

// Heading that cancels the current's component across the wanted direction (method of Sample Problem 4.7.1):
// u sin θ = w_perp. Returns null when the boat is too slow. speedAlong = u cos θ + w_par.
export function aimAngle(u, wPerp, wPar = 0) {
  if (Math.abs(wPerp) > u) return null;
  const th = Math.asin(wPerp / u);
  return { theta: th * 180 / Math.PI, speedAlong: u * Math.cos(th) + wPar };
}

// ---------- landing prediction ----------
// Values are chosen for the screen, not taken from the textbook problems.
const LAND = [
  { u: 3, w: 1.5, theta: 0 }, { u: 4, w: 2, theta: 30 }, { u: 2.5, w: 1.2, theta: -20 },
  { u: 5, w: 2.5, theta: 45 }, { u: 2, w: 2, theta: 0 }, { u: 3.5, w: 1, theta: 20 },
];
export const LCOUNT = LAND.length;
export function landQuestion(index) {
  const i = ((index % LCOUNT) + LCOUNT) % LCOUNT, q = LAND[i];
  return { index: i, ...q, t: crossingTime(q), x: landingX(q) };
}
const near = (a, b, rel, abs = 0) => Math.abs(a - b) <= Math.max(abs, rel * Math.abs(b));
// Time within 2 %, landing point within 3 % or 0.5 m. Typical slips are named.
export function checkLanding(q, tText, xText) {
  const t = parseNumber(tText), x = parseNumber(xText);
  if (!Number.isFinite(t) || !Number.isFinite(x)) return { ok: false, reason: 'unreadable' };
  const { vPA } = velocities(q), tOk = near(t, q.t, 0.02), xOk = near(x, q.x, 0.03, 0.5);
  let tWhy = null, xWhy = null;
  if (!tOk) tWhy = near(t, D / Math.hypot(vPA[0], vPA[2]), 0.02) ? 'resultant' : near(t, D / q.u, 0.02) ? 'nocos' : 'value';
  if (!xOk) {
    if (near(x, -q.x, 0.03, 0.5)) xWhy = 'sign';
    else if (near(x, q.w * q.t, 0.03, 0.5)) xWhy = 'noheading';
    else if (near(x, -q.u * Math.sin(rad(q.theta)) * q.t, 0.03, 0.5)) xWhy = 'nocurrent';
    else xWhy = 'value';
  }
  return { ok: tOk && xOk, tOk, xOk, tWhy, xWhy };
}

// ---------- aiming ----------
const AIM = [{ u: 4, w: 2 }, { u: 5, w: 3 }, { u: 3, w: 1.2 }, { u: 2, w: 2.5 }, { u: 6, w: 1.5 }];
export const ACOUNT = AIM.length;
export function aimQuestion(index) {
  const i = ((index % ACOUNT) + ACOUNT) % ACOUNT, q = AIM[i], a = aimAngle(q.u, q.w);
  return { index: i, ...q, possible: a !== null, theta: a ? a.theta : null, t: a ? D / a.speedAlong : null };
}
// Heading within 1°. Using tan instead of sin, or turning downstream, is named.
export function checkAim(q, text, impossible) {
  if (impossible) return { ok: !q.possible, reason: q.possible ? 'possible' : null };
  const th = parseNumber(text);
  if (!Number.isFinite(th)) return { ok: false, reason: 'unreadable' };
  if (!q.possible) return { ok: false, reason: 'impossible' };
  if (Math.abs(th - q.theta) <= 1) return { ok: true, reason: null };
  if (Math.abs(th + q.theta) <= 1) return { ok: false, reason: 'downstream' };
  if (Math.abs(th - Math.atan(q.w / q.u) * 180 / Math.PI) <= 1) return { ok: false, reason: 'tan' };
  return { ok: false, reason: 'value' };
}

// ---------- model contract ----------
export const duration = p => crossingTime(p);
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(s, p) {
  const v = velocities(p), r = positions(p, s.t);
  return { ...v, ...r, tc: crossingTime(p), xLand: landingX(p), speedPA: Math.hypot(...v.vPA), frame: p.frame };
}
