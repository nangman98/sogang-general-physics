// 11.2 Forces and Kinetic Energy of Rolling — pure model (no DOM).
// A body of mass M and radius R rolls smoothly from rest down a ramp at angle θ. With k = I_com/(MR²):
//   a_com = g sin θ/(1 + k) down the ramp (Eq. 11.2.8 in magnitude), f_s = k M a_com up the ramp (Eq. 11.2.7),
//   speed after a drop h: v = √(2gh/(1 + k)) (from K_f + U_f = K_i + U_i, Eqs. 11.2.9, 11.2.10).
// A frictionless sliding block (k = 0) runs alongside for comparison.
// Activities.
//   race:   bodies A and B start together. Predict which reaches the bottom first and v of A.
//   single: one body. Predict a_com and the static friction it needs.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const LEN = 4;          // m along the ramp
const rad = d => d * Math.PI / 180;
export const SHAPES = {
  hoop: { k: 1, label: '고리 (hoop)' },
  disk: { k: 1 / 2, label: '원판 (disk)' },
  sphere: { k: 2 / 5, label: '속이 찬 공 (solid sphere)' },
  shell: { k: 2 / 3, label: '얇은 구 껍질 (spherical shell)' },
  block: { k: 0, label: '마찰 없이 미끄러지는 상자' },
};
export function roll(shape, theta, M = 1, g = G) {
  const k = SHAPES[shape].k, s = Math.sin(rad(theta));
  const a = g * s / (1 + k), h = LEN * s;
  return { k, a, v: Math.sqrt(2 * g * h / (1 + k)), fs: k * M * a, t: Math.sqrt(2 * LEN / a), h };
}
export function bodies(p) { return p.activity === 'single' ? [p.A] : [p.A, p.B]; }
export function duration(p) { return Math.max(...bodies(p).map(s => roll(s, p.theta).t)); }
export function stateAt(t, p) {
  return bodies(p).map(shape => {
    const r = roll(shape, p.theta, p.M), u = Math.min(t, r.t);
    return { shape, s: 0.5 * r.a * u * u, v: r.a * u, done: t >= r.t, t: r.t };
  });
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function winner(p) {
  const ta = roll(p.A, p.theta).t, tb = roll(p.B, p.theta).t;
  return Math.abs(ta - tb) < 1e-12 ? 'same' : ta < tb ? 'A' : 'B';
}
export function checkRace(p, { pick, vText }) {
  const r = roll(p.A, p.theta), v = parseNumber(vText);
  const out = { pickOk: pick === winner(p), vOk: false, pickReason: null, vReason: null };
  if (!pick) out.pickReason = 'empty'; else if (!out.pickOk) out.pickReason = 'wrong';
  if (!Number.isFinite(v)) out.vReason = 'unreadable';
  else if (near(v, r.v)) out.vOk = true;
  else out.vReason = r.k > 0 && near(v, Math.sqrt(2 * G * r.h)) ? 'noRotation' : near(v, Math.sqrt(G * r.h)) ? 'half' : 'value';
  return { ...out, ok: out.pickOk && out.vOk };
}
export function checkSingle(p, { aText, fText }) {
  const r = roll(p.A, p.theta, p.M), a = parseNumber(aText), f = parseNumber(fText);
  const out = { aOk: false, fOk: false, aReason: null, fReason: null };
  if (!Number.isFinite(a)) out.aReason = 'unreadable';
  else if (near(Math.abs(a), r.a)) out.aOk = true;
  else out.aReason = r.k > 0 && near(Math.abs(a), G * Math.sin(rad(p.theta))) ? 'noRotation' : 'value';
  if (!Number.isFinite(f)) out.fReason = 'unreadable';
  else if (near(Math.abs(f), r.fs)) out.fOk = true;
  else out.fReason = near(Math.abs(f), p.M * G * Math.sin(rad(p.theta))) ? 'gravityComponent' : r.k > 0 && near(f, 0) ? 'zero' : 'value';
  return { ...out, ok: out.aOk && out.fOk };
}

// ---------- model contract ----------
const opts = Object.entries(SHAPES).map(([value, s]) => ({ value, label: s.label }));
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'race', options: [{ value: 'race', label: '굴림 경주' }, { value: 'single', label: '가속도와 마찰력' }] },
  { id: 'A', type: 'select', label: '물체 A', value: 'hoop', options: opts },
  { id: 'B', type: 'select', label: '물체 B', value: 'sphere', options: opts, showIf: p => p.activity === 'race' },
  { id: 'theta', label: '빗면 각', sym: '<i>θ</i>', unit: '°', min: 5, max: 45, step: 1, value: 20 },
  { id: 'M', label: '질량 (mass)', sym: '<i>M</i>', unit: 'kg', min: 0.5, max: 8, step: 0.5, value: 2, showIf: p => p.activity === 'single' },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { t: st.t, list: stateAt(st.t, p) }; }
