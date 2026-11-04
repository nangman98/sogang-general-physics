// 2.6 Graphical Integration in Motion Analysis — pure model (no DOM).
// The student sets a(t) as four 2 s steps. With v0 = 0 and x0 = 0:
//   v1 − v0 = ∫ a dt = area between the a–t curve and the time axis (Eqs. 2.6.1, 2.6.2),
//   x1 − x0 = ∫ v dt = area between the v–t curve and the time axis (Eqs. 2.6.3, 2.6.4).
// Activities. dv: predict v at 8 s from the a–t area. dx: predict the displacement from the v–t area, with the total
// distance and the average speed (Eq. 2.1.3). stop: set the steps so the car stops at a given line at 8 s.
// Areas are exact for piecewise-linear curves (split where the curve crosses zero). Sample Problem values are used only in model.test.js.
import { fmt, parseNumber } from '../../../core/format.js';

export const TAU = 2;                      // s, length of one step
export const N = 4;                        // number of steps
export const T = TAU * N;                  // s, time span of the boards
export const STEP_IDS = ['a1', 'a2', 'a3', 'a4'];
export const TARGETS = [12, 20, -8, 6];     // m, stop-line positions of activity "stop"; each is reachable (tested)
export const STOP_TOL = 0.25;               // m

const stopOnly = p => p.activity === 'stop';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'dv', options: [
    { value: 'dv', label: '속도 변화' }, { value: 'dx', label: '변위' }, { value: 'stop', label: '정지선' }] },
  ...STEP_IDS.map((id, k) => ({ id, label: `구간 ${k + 1} (${k * TAU}–${(k + 1) * TAU} s)`, sym: `<i>a</i><sub>${k + 1}</sub>`, unit: 'm/s²', min: -5, max: 5, step: 0.5, value: [2, 0, -3, 0.5][k] })),
  { id: 'goal', type: 'select', label: '정지선 위치', value: '0', options: TARGETS.map((X, i) => ({ value: String(i), label: `x = ${fmt(X)} m` })), showIf: stopOnly },
  { id: 'arrows', type: 'check', label: '속도·가속도 화살표', value: false },
];

// ---------- piecewise-linear functions: segments { t0, t1, f0, f1 } ----------
export const steps = p => STEP_IDS.map((id, k) => ({ t0: k * TAU, t1: (k + 1) * TAU, f0: p[id], f1: p[id] }));

// Value at t. At a step boundary the later segment wins (a(t) is right-continuous).
export function valueAt(segs, t) {
  let s = segs[0];
  for (const g of segs) if (t >= g.t0 - 1e-12) s = g;
  const u = Math.min(1, Math.max(0, (t - s.t0) / (s.t1 - s.t0)));
  return s.f0 + (s.f1 - s.f0) * u;
}
// Exact ∫ from the first segment start to t (trapezoid rule is exact for a straight piece).
export function integralTo(segs, t) {
  let sum = 0;
  for (const g of segs) {
    if (t <= g.t0) break;
    const b = Math.min(t, g.t1), fb = g.f0 + (g.f1 - g.f0) * (b - g.t0) / (g.t1 - g.t0);
    sum += 0.5 * (g.f0 + fb) * (b - g.t0);
  }
  return sum;
}
// Pieces of one sign, cut where a straight piece crosses zero. Optional end time tEnd clips the last piece.
export function regions(segs, tEnd = Infinity) {
  const out = [];
  for (const g of segs) {
    if (g.t0 >= tEnd) break;
    const t1 = Math.min(g.t1, tEnd), f = t => g.f0 + (g.f1 - g.f0) * (t - g.t0) / (g.t1 - g.t0);
    const cuts = [g.t0];
    if (g.f0 * g.f1 < 0) { const r = g.t0 - g.f0 * (g.t1 - g.t0) / (g.f1 - g.f0); if (r < t1) cuts.push(r); }
    cuts.push(t1);
    for (let i = 1; i < cuts.length; i++) {
      const a = cuts[i - 1], b = cuts[i];
      if (b - a < 1e-12) continue;
      const fa = f(a), fb = f(b), area = 0.5 * (fa + fb) * (b - a);
      out.push({ t0: a, t1: b, f0: fa, f1: fb, area });
    }
  }
  return out;
}
export const totalArea = rs => rs.reduce((s, r) => s + r.area, 0);
export const absArea = rs => rs.reduce((s, r) => s + Math.abs(r.area), 0);

// Velocity as straight pieces from constant-acceleration steps, v0 = 0 (Eq. 2.6.1).
export function velocitySegs(p, v0 = 0) {
  let v = v0;
  return steps(p).map(g => { const s = { t0: g.t0, t1: g.t1, f0: v, f1: v + g.f0 * (g.t1 - g.t0) }; v = s.f1; return s; });
}
export function kin(p, t) {
  const a = steps(p), vs = velocitySegs(p);
  return { a: valueAt(a, Math.min(t, T - 1e-12)), v: integralTo(a, t), x: integralTo(vs, t) };
}
export const distance = (p, t) => absArea(regions(velocitySegs(p), t));        // total distance up to t
export const sAvg = (dist, dt) => dist / dt;                                    // (2.1.3)

// ---------- activity "dv": v at T from the a–t area ----------
export function checkDv(p, text) {
  const a = steps(p), target = totalArea(regions(a)), x = parseNumber(text);
  const tol = Math.max(0.05, 0.01 * Math.abs(target));
  const near = y => Math.abs(x - y) <= tol;
  if (!Number.isFinite(x)) return { ok: false, reason: 'unreadable', target };
  if (near(target)) return { ok: true, reason: null, target };
  const abs = absArea(regions(a)), heights = a.reduce((s, g) => s + g.f0, 0);
  if (Math.abs(abs - target) > tol && near(abs)) return { ok: false, reason: 'abs', target };          // areas below the axis added as positive
  if (Math.abs(heights - target) > tol && near(heights)) return { ok: false, reason: 'heights', target }; // a values added without × Δt
  if (Math.abs(target) > tol && near(-target)) return { ok: false, reason: 'sign', target };
  return { ok: false, reason: 'value', target };
}

// ---------- activity "dx": displacement at T from the v–t area ----------
export function checkDx(p, text) {
  const rs = regions(velocitySegs(p)), target = totalArea(rs), dist = absArea(rs), x = parseNumber(text);
  const tol = Math.max(0.1, 0.01 * Math.abs(target));
  const near = y => Math.abs(x - y) <= tol;
  if (!Number.isFinite(x)) return { ok: false, reason: 'unreadable', target, dist };
  if (near(target)) return { ok: true, reason: null, target, dist };
  if (Math.abs(dist - target) > tol && near(dist)) return { ok: false, reason: 'distance', target, dist };
  const vEnd = integralTo(steps(p), T);
  if (Math.abs(vEnd * T - target) > tol && near(vEnd * T)) return { ok: false, reason: 'final-v', target, dist };   // v(T)·T, as if v were constant
  if (Math.abs(target) > tol && near(-target)) return { ok: false, reason: 'sign', target, dist };
  return { ok: false, reason: 'value', target, dist };
}

// ---------- activity "stop": v = 0 at the stop line at T ----------
export const goalX = p => TARGETS[Number(p.goal) || 0];
export function checkStop(p, X) {
  const end = kin(p, T), vOk = Math.abs(end.v) < 1e-9, xOk = Math.abs(end.x - X) <= STOP_TOL;
  return { ok: vOk && xOk, vOk, xOk, v: end.v, x: end.x };
}

// ---------- model contract ----------
export const duration = () => T;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(s, p) {
  const k = kin(p, s.t), dist = distance(p, s.t);
  return { activity: p.activity, t: s.t, ...k, dv: k.v, dx: k.x, dist, sAvg: s.t > 1e-9 ? sAvg(dist, s.t) : NaN, vAvg: s.t > 1e-9 ? k.x / s.t : NaN };
}
