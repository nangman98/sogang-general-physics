// 4.2–4.3 Average and instantaneous velocity and acceleration on a 3D curved path — pure model (no DOM).
// Textbook: Principles of Physics 12e, Eqs. (4.1.2), (4.2.1), (4.2.3)–(4.2.5), (4.3.1)–(4.3.4).
// Activities. vel: displacement Δr over Δt gives v_avg, which turns into the tangent v as Δt → 0.
// acc: Δv = v2 − v1 over Δt gives a_avg, which turns into a = dv/dt as Δt → 0.
// predict: pick the direction of v and a at a marked point before they are drawn (graded).
// Positions are [x, y, z] in metres with y up (06_3D_무대_기준.md). Every path is analytic, no integrator.

export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'vel', options: [
    { value: 'vel', label: '평균 속도' }, { value: 'acc', label: '평균 가속도' }, { value: 'predict', label: '방향 예측' }] },
  { id: 'path', type: 'select', label: '비행 경로 (path)', value: 'helix', options: [
    { value: 'helix', label: '나선 비행 (속력 일정)' }, { value: 'eight', label: '8자 비행' }, { value: 'const', label: '등가속도 비행 (constant acceleration)' }],
    showIf: p => p.activity !== 'predict' },
  { id: 'dt', label: '시간 간격 (time interval)', sym: 'Δ<i>t</i>', unit: 's', min: 0.05, max: 3, step: 0.05, value: 2, showIf: p => p.activity !== 'predict' },
  { id: 'arrows', type: 'check', label: '속도·가속도 화살표', value: true, showIf: p => p.activity !== 'predict' },
];

// ---------- vectors ----------
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const sub = (a, b) => a.map((v, i) => v - b[i]);
export const scale = (a, s) => a.map(v => v * s);
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const norm = a => Math.sqrt(dot(a, a));
export const unit = a => { const n = norm(a); return n > 0 ? scale(a, 1 / n) : [0, 0, 0]; };
// Angle between two vectors in degrees, 0–180.
export function angleBetween(a, b) {
  const na = norm(a), nb = norm(b);
  if (!(na > 0 && nb > 0)) return NaN;
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (na * nb)))) * 180 / Math.PI;
}
// Direction of a 2D vector from the +x axis in degrees, (−180, 180]. Quadrant from the signs (textbook "Check").
export const angle2D = (x, y) => Math.atan2(y, x) * 180 / Math.PI;

// ---------- paths ----------
// Constant-acceleration path r = r0 + v0 t + ½ a t² (vector form of Eqs. 2.4.1 and 2.4.5 per axis, LO 4.3.5).
export function quadratic(r0, v0, a) {
  return {
    pos: t => r0.map((r, i) => r + v0[i] * t + 0.5 * a[i] * t * t),
    vel: t => v0.map((v, i) => v + a[i] * t),
    acc: () => a.slice(),
  };
}

function helix({ R, period, climb, y0 }) {
  const w = 2 * Math.PI / period;
  return {
    pos: t => [R * Math.sin(w * t), y0 + climb * t, R * Math.cos(w * t)],
    vel: t => [R * w * Math.cos(w * t), climb, -R * w * Math.sin(w * t)],
    acc: t => [-R * w * w * Math.sin(w * t), 0, -R * w * w * Math.cos(w * t)],
  };
}

function eight({ A, B, h, H, period }) {
  const w = 2 * Math.PI / period;
  return {
    pos: t => [A * Math.sin(w * t), h + H * Math.cos(w * t), B * Math.sin(2 * w * t)],
    vel: t => [A * w * Math.cos(w * t), -H * w * Math.sin(w * t), 2 * B * w * Math.cos(2 * w * t)],
    acc: t => [-A * w * w * Math.sin(w * t), -H * w * w * Math.cos(w * t), -4 * B * w * w * Math.sin(2 * w * t)],
  };
}

// T is the flight time drawn on the stage. Values are chosen to fit the 20 m × 14 m board, not from the textbook.
export const PATHS = {
  helix: { T: 12, ...helix({ R: 5, period: 12, climb: 0.4, y0: 1.2 }) },
  eight: { T: 16, ...eight({ A: 7, B: 3.5, h: 3.2, H: 1.4, period: 16 }) },
  const: { T: 8, ...quadratic([-8, 1, 1.6], [2, 3, -1.6], [0, -0.75, 0.4]) },
};
export const DT_MAX = 3;           // s, largest Δt (slider maximum)

export const pathOf = p => PATHS[p.path] ?? PATHS.helix;

// Eq. (4.1.2) and (4.2.1): v_avg = Δr/Δt with Δr = r2 − r1.
export function averageVelocity(P, t1, dt) {
  const dr = sub(P.pos(t1 + dt), P.pos(t1));
  return { dr, vavg: scale(dr, 1 / dt) };
}
// Eq. (4.3.1): a_avg = (v2 − v1)/Δt = Δv/Δt.
export function averageAcceleration(P, t1, dt) {
  const dv = sub(P.vel(t1 + dt), P.vel(t1));
  return { dv, aavg: scale(dv, 1 / dt) };
}

// Rows for the Δt → 0 table: how far v_avg (or a_avg) is from v (or a), in angle and magnitude.
export const SHRINK = [2, 1, 0.5, 0.1, 0.01];
export function shrinkTable(P, t1, kind = 'vel') {
  const exact = kind === 'vel' ? P.vel(t1) : P.acc(t1);
  return SHRINK.map(dt => {
    const avg = kind === 'vel' ? averageVelocity(P, t1, dt).vavg : averageAcceleration(P, t1, dt).aavg;
    return { dt, avg, size: norm(avg), angle: angleBetween(avg, exact), exact: norm(exact) };
  });
}

// ---------- prediction (graded) ----------
// Marked points. The student picks the direction of v, then of a, among four arrows.
const QLIST = [
  { path: 'helix', t: 2 },
  { path: 'const', t: 1.5 },
  { path: 'eight', t: 3 },
  { path: 'helix', t: 8.5 },
  { path: 'eight', t: 10 },
  { path: 'const', t: 6 },
];
export const QCOUNT = QLIST.length;
export const MIN_SEPARATION = 35;  // degrees between any two choice arrows
const CHORD_DT = 3;                // s, the "point a few seconds later" distractor

// Four fixed orders so the right arrow is not always the same number.
const ORDERS = [[1, 0, 3, 2], [2, 3, 0, 1], [0, 2, 1, 3], [3, 1, 2, 0], [1, 3, 0, 2], [2, 0, 3, 1]];

function pickChoices(correct, pool) {
  const picked = [correct];
  for (const c of pool) {
    if (picked.length === 4) break;
    if (norm(c.dir) === 0) continue;
    if (picked.every(q => angleBetween(q.dir, c.dir) >= MIN_SEPARATION)) picked.push(c);
  }
  return picked;
}

export function question(index) {
  const i = ((index % QCOUNT) + QCOUNT) % QCOUNT;
  const q = QLIST[i], P = PATHS[q.path];
  const r = P.pos(q.t), v = P.vel(q.t), a = P.acc(q.t);
  const vh = unit(v), ah = unit(a), rh = unit(r);
  const chord = unit(sub(P.pos(q.t + CHORD_DT), r));
  const vel = pickChoices({ key: 'tangent', dir: vh }, [
    { key: 'backward', dir: scale(vh, -1) }, { key: 'chord', dir: chord },
    { key: 'position', dir: rh }, { key: 'accel', dir: ah }, { key: 'up', dir: [0, 1, 0] }]);
  const acc = pickChoices({ key: 'accel', dir: ah }, [
    { key: 'alongV', dir: vh }, { key: 'outward', dir: scale(ah, -1) }, { key: 'down', dir: [0, -1, 0] },
    { key: 'backward', dir: scale(vh, -1) }, { key: 'toOrigin', dir: scale(rh, -1) }]);
  // The acceleration list uses another order so its answer number differs from the velocity one.
  const arrange = (list, order) => order.map(k => list[k]).map((c, n) => ({ ...c, no: String(n + 1) }));
  const choices = { v: arrange(vel, ORDERS[i % ORDERS.length]), a: arrange(acc, ORDERS[(i + 2) % ORDERS.length]) };
  return { index: i, path: q.path, t: q.t, r, v, a, choices };
}

// kind 'v' or 'a', no = chosen arrow number '1'–'4'.
export function checkDirection(q, kind, no) {
  const list = q.choices[kind], pick = list.find(c => c.no === no);
  const answer = list.find(c => c.key === (kind === 'v' ? 'tangent' : 'accel')).no;
  if (!pick) return { ok: false, reason: 'none', answer };
  return { ok: pick.no === answer, reason: pick.no === answer ? null : pick.key, answer };
}

// ---------- model contract ----------
export const duration = p => (p.activity === 'predict' ? 0 : pathOf(p).T - p.dt);
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(s, p) {
  const P = pathOf(p), t1 = s.t, t2 = t1 + p.dt;
  const r1 = P.pos(t1), r2 = P.pos(t2), v1 = P.vel(t1), v2 = P.vel(t2), a1 = P.acc(t1);
  const { dr, vavg } = averageVelocity(P, t1, p.dt);
  const { dv, aavg } = averageAcceleration(P, t1, p.dt);
  return {
    t: t1, t2, r1, r2, v1, v2, a1, dr, vavg, dv, aavg,
    speed: norm(v1), angleV: angleBetween(vavg, v1), angleA: angleBetween(aavg, a1),
  };
}
