// 20.2–20.3 Carnot engine and Carnot refrigerator — pure model (no DOM).
// Working substance: n mol of monatomic ideal gas, C_V = (3/2)R (Eq. 19.7.7), C_p = C_V + R (Eq. 19.7.13), γ = C_p/C_V = 5/3.
// Engine cycle, clockwise on the p–V plot (Fig. 20.2.2): ab isothermal expansion at T_H from V_a to V_b = rV_a,
// bc adiabatic expansion to T_L (TV^(γ−1) constant, Eq. 19.9.4), cd isothermal compression at T_L, da adiabatic compression.
//   |Q_H| = nRT_H ln(V_b/V_a), |Q_L| = nRT_L ln(V_c/V_d) (Eq. 19.2.10), and V_c/V_d = V_b/V_a from Eq. 19.9.4.
//   W = |Q_H| − |Q_L| (Eq. 20.2.1). ΔS = |Q_H|/T_H − |Q_L|/T_L = 0 per cycle (Eqs. 20.2.2, 20.2.3).
//   ε = W/|Q_H| = 1 − T_L/T_H (Eqs. 20.2.4–20.2.6).
// Refrigerator: the same cycle run backward (a → d → c → b → a). Work |W| = |Q_H| − |Q_L| is done on the gas and
//   K = |Q_L|/|W| = T_L/(T_H − T_L) (Eqs. 20.3.1–20.3.3).
// Entropy of the gas from state a: S = nR ln(V/V_a) + nC_V ln(T/T_H) (Eq. 20.1.4).
// Playback is not real time: each isothermal stroke takes T_ISO, each adiabatic stroke T_ADI, and moving the cylinder
// between a reservoir and the insulating slab T_MOVE. Within a stroke ln V is linear in time.
import { parseNumber } from '../../../core/format.js';

export const R = 8.31, GAMMA = 5 / 3, CV = 1.5 * R;   // J/mol·K (Eqs. 19.2.2, 19.7.7)
export const VA = 10;                                   // L, volume at state a
export const T_ISO = 2, T_ADI = 1.5, T_MOVE = 0.4;      // s of playback
export const STATION = { hot: -1, slab: 0, cold: 1 };

const isEngine = p => p.activity !== 'fridge';
export const temps = p => (isEngine(p) ? { TH: p.TH, TL: p.TL } : { TH: p.THr, TL: p.TLr });

// States a, b, c, d (V in L, p in kPa since nRT/V with V in L gives kPa), heats per cycle and the derived numbers.
export function cycle(p) {
  const { TH, TL } = temps(p), n = p.n, k = (TH / TL) ** (1 / (GAMMA - 1));
  const V = { a: VA, b: p.r * VA, c: p.r * VA * k, d: VA * k }, T = { a: TH, b: TH, c: TL, d: TL };
  const P = {};
  for (const s of 'abcd') P[s] = n * R * T[s] / V[s];
  const QH = n * R * TH * Math.log(V.b / V.a), QL = n * R * TL * Math.log(V.c / V.d), W = QH - QL;
  return { TH, TL, V, T, P, QH, QL, W, eps: W / QH, K: QL / W, dSH: QH / TH, dSL: -QL / TL };
}

// Strokes in running order: [from, to, kind, station].
export function strokes(p) {
  return isEngine(p)
    ? [['a', 'b', 'iso', 'hot'], ['b', 'c', 'adi', 'slab'], ['c', 'd', 'iso', 'cold'], ['d', 'a', 'adi', 'slab']]
    : [['a', 'd', 'adi', 'slab'], ['d', 'c', 'iso', 'cold'], ['c', 'b', 'adi', 'slab'], ['b', 'a', 'iso', 'hot']];
}
const strokeTime = kind => (kind === 'iso' ? T_ISO : T_ADI);
export const duration = () => 2 * T_ISO + 2 * T_ADI + 4 * T_MOVE;
export const loop = () => true;

// Gas state a fraction f of the way through one stroke, with the heat into the gas and the work by the gas so far.
function along(c, [from, to, kind], f, n) {
  const V0 = c.V[from], T0 = c.T[from], V = V0 * (c.V[to] / V0) ** f;
  const T = kind === 'iso' ? T0 : T0 * (V0 / V) ** (GAMMA - 1);
  const Q = kind === 'iso' ? n * R * T0 * Math.log(V / V0) : 0;
  const W = kind === 'iso' ? Q : n * CV * (T0 - T);      // first law with ΔE_int = nC_V ΔT (Eq. 19.7.9)
  return { V, T, Q, W };
}

export function stateAt(t, p) {
  const c = cycle(p), list = strokes(p), D = duration();
  let u = Math.min(Math.max(t, 0), D), Qhot = 0, Qcold = 0, Wby = 0;
  for (let i = 0; i < 4; i++) {
    const s = list[i], dur = strokeTime(s[2]), next = list[(i + 1) % 4];
    const f = Math.min(u / dur, 1), g = along(c, s, f, p.n);
    const Qh = s[3] === 'hot' ? g.Q : 0, Qc = s[3] === 'cold' ? g.Q : 0;
    const base = { V: g.V, T: g.T, p: p.n * R * g.T / g.V, S: p.n * R * Math.log(g.V / VA) + p.n * CV * Math.log(g.T / c.TH) };
    if (u < dur) return { ...base, stroke: i, from: s[0], to: s[1], kind: s[2], moving: false, x: STATION[s[3]], heatAt: s[2] === 'iso' ? s[3] : null, Qhot: Qhot + Qh, Qcold: Qcold + Qc, Wby: Wby + g.W, f };
    Qhot += Qh; Qcold += Qc; Wby += g.W; u -= dur;
    if (u < T_MOVE || i === 3) {
      const m = Math.min(u / T_MOVE, 1), x = STATION[s[3]] + (STATION[next[3]] - STATION[s[3]]) * m * m * (3 - 2 * m);
      return { ...base, stroke: i, from: s[0], to: s[1], kind: 'move', moving: true, x, heatAt: null, Qhot, Qcold, Wby, f: 1 };
    }
    u -= T_MOVE;
  }
}

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
const nearAny = (v, y) => near(v, y) || near(v / 100, y);      // an efficiency may be typed as a fraction or in %
export function checkEngine(p, { eText, qText }) {
  const c = cycle(p), e = parseNumber(eText), q = parseNumber(qText);
  const r = { eOk: false, qOk: false, eReason: null, qReason: null };
  if (!Number.isFinite(e)) r.eReason = 'unreadable';
  else if (nearAny(e, c.eps)) r.eOk = true;
  else r.eReason = nearAny(e, c.TL / c.TH) ? 'ratio' : nearAny(e, (c.TH - c.TL) / c.TL) ? 'overL' : nearAny(e, 1 - c.TH / c.TL) ? 'flip' : 'value';
  if (!Number.isFinite(q)) r.qReason = 'unreadable';
  else if (near(q, c.QL)) r.qOk = true;
  else r.qReason = near(q, 0) ? 'zero' : near(q, c.QH) ? 'same' : near(q, c.QH * c.TH / c.TL) ? 'inverse' : near(q, c.W) ? 'work' : 'value';
  return { ...r, ok: r.eOk && r.qOk };
}
export function checkFridge(p, { kText, wText }) {
  const c = cycle(p), k = parseNumber(kText), w = parseNumber(wText);
  const r = { kOk: false, wOk: false, kReason: null, wReason: null };
  if (!Number.isFinite(k)) r.kReason = 'unreadable';
  else if (near(k, c.K)) r.kOk = true;
  else r.kReason = near(k, c.TH / (c.TH - c.TL)) ? 'hot' : near(k, c.TL / c.TH) ? 'ratio' : near(k, 1 - c.TL / c.TH) ? 'engine' : near(k, (c.TH - c.TL) / c.TL) ? 'inverse' : 'value';
  if (!Number.isFinite(w)) r.wReason = 'unreadable';
  else if (near(w, c.W)) r.wOk = true;
  else r.wReason = near(w, 0) ? 'zero' : near(w, c.QL * c.K) ? 'times' : near(w, c.QL) ? 'same' : near(w, c.QH) ? 'hot' : 'value';
  return { ...r, ok: r.kOk && r.wOk };
}

// ---------- model contract ----------
const isE = p => p.activity === 'engine';
const isF = p => p.activity === 'fridge';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'engine', options: [{ value: 'engine', label: '카르노 기관' }, { value: 'fridge', label: '카르노 냉동기' }] },
  { id: 'TH', label: '고온 저장고 온도', sym: '<i>T</i><sub>H</sub>', unit: 'K', min: 400, max: 800, step: 10, value: 500, showIf: isE },
  { id: 'TL', label: '저온 저장고 온도', sym: '<i>T</i><sub>L</sub>', unit: 'K', min: 250, max: 380, step: 10, value: 300, showIf: isE },
  { id: 'THr', label: '방 (고온 저장고) 온도', sym: '<i>T</i><sub>H</sub>', unit: 'K', min: 280, max: 320, step: 1, value: 300, showIf: isF },
  { id: 'TLr', label: '냉동실 (저온 저장고) 온도', sym: '<i>T</i><sub>L</sub>', unit: 'K', min: 240, max: 275, step: 1, value: 250, showIf: isF },
  { id: 'n', label: '몰수 (number of moles)', sym: '<i>n</i>', unit: 'mol', min: 0.5, max: 2, step: 0.1, value: 1 },
  { id: 'r', label: '등온 팽창의 부피 비', sym: '<i>V</i><sub>b</sub>/<i>V</i><sub>a</sub>', unit: '', min: 1.5, max: 3, step: 0.1, value: 2 },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { t: st.t, activity: p.activity, c: cycle(p), ...stateAt(st.t, p) }; }
