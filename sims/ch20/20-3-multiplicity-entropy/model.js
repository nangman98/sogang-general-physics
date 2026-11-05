// 20.4 A Statistical View of Entropy — molecules in the two halves of a box, pure model (no DOM).
// A configuration (n1, n2) of N indistinguishable molecules has multiplicity W = N!/(n1! n2!) (Eq. 20.4.1). All 2^N
// microstates are equally probable, so the configuration occurs with probability W/2^N. Entropy S = k ln W (Eq. 20.4.2)
// with k = 1.38 × 10⁻²³ J/K (Eq. 19.2.3). For large N, ln N! ≈ N ln N − N (Eq. 20.4.3) gives S_f − S_i = Nk ln 2 for
// the change from (N, 0) to (N/2, N/2) (Eq. 20.4.5).
// Activities.
//   count:  N ≤ 12 molecules. Playback shows SNAPS snapshots, RATE per second. In each snapshot every molecule is in the
//           left or right half with probability ½, from a seeded pseudo-random sequence, so every run is the same.
//           The histogram of the configurations seen so far is a prefix sum of that fixed sequence.
//   expand: N ≤ 1000 molecules start in the left half. The partition is removed at T_OPEN and the molecules fly in straight
//           lines with mirror reflections at the walls (closed form, no collisions) from seeded random starts.
//           n1(t) and S(t) = k ln W(n1(t)) follow from the positions.
import { parseNumber } from '../../../core/format.js';

export const K_B = 1.38e-23;                 // J/K (Eq. 19.2.3)
export const BOX = { L: 3.4, H: 1.8, D: 1.8 }; // drawing units; the halves are x < L/2 and x > L/2
export const RATE = 10, SNAPS = 500, T_OPEN = 0.5, RUN_EXPAND = 8;
export const NMAX_COUNT = 12, NMAX_EXPAND = 1000;
export const rm = N => (N <= NMAX_COUNT ? 0.14 : N <= 100 ? 0.08 : 0.05);   // drawn molecule radius

// ---------- counting ----------
const LNF = [0];
for (let i = 1; i <= NMAX_EXPAND; i++) LNF.push(LNF[i - 1] + Math.log(i));
export const lnFact = n => LNF[n];
export const lnW = (n1, N) => LNF[N] - LNF[n1] - LNF[N - n1];
// W = N!/(n1! n2!) as a product, exact for the small N of the count activity.
export function multiplicity(n1, N) {
  const k = Math.min(n1, N - n1);
  let w = 1;
  for (let i = 1; i <= k; i++) w = w * (N - k + i) / i;
  return w > 2 ** 52 ? w : Math.round(w);
}
export const probability = (n1, N) => multiplicity(n1, N) / 2 ** N;
export const factorial = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };

// ---------- seeded sequences ----------
export function rng(seed) {                  // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
// Snapshot k: bit i of SIDE[k] is 1 when molecule i is in the left half; SPOT holds its place inside that half.
const SIDE = new Uint16Array(SNAPS), SPOT = new Float32Array(SNAPS * NMAX_COUNT * 3);
{
  const rnd = rng(2040);
  for (let k = 0; k < SNAPS; k++) {
    let b = 0;
    for (let i = 0; i < NMAX_COUNT; i++) if (rnd() < 0.5) b |= 1 << i;
    SIDE[k] = b;
    for (let j = 0; j < NMAX_COUNT * 3; j++) SPOT[k * NMAX_COUNT * 3 + j] = rnd();
  }
}
const hists = new Map();
// Cumulative histogram: hist(N)[k][n1] = how many of snapshots 0..k had n1 molecules on the left.
export function hist(N) {
  if (hists.has(N)) return hists.get(N);
  const out = [], run = new Array(N + 1).fill(0);
  for (let k = 0; k < SNAPS; k++) { run[leftCount(SIDE[k], N)]++; out.push(run.slice()); }
  hists.set(N, out); return out;
}
function leftCount(bits, N) { let c = 0; for (let i = 0; i < N; i++) c += (bits >> i) & 1; return c; }
export const snapIndex = t => Math.min(Math.max(Math.floor(t * RATE + 1e-9), 0), SNAPS - 1);
export function snapshot(k, N) {
  const r = rm(N), half = BOX.L / 2, mol = [];
  for (let i = 0; i < N; i++) {
    const left = (SIDE[k] >> i) & 1, s = SPOT.subarray((k * NMAX_COUNT + i) * 3, (k * NMAX_COUNT + i) * 3 + 3);
    mol.push([(left ? 0 : half) + r + s[0] * (half - 2 * r), r + s[1] * (BOX.H - 2 * r), r + s[2] * (BOX.D - 2 * r)]);
  }
  return { n1: leftCount(SIDE[k], N), mol };
}

// ---------- free expansion ----------
const START = (() => {
  const rnd = rng(4021), out = [];
  for (let i = 0; i < NMAX_EXPAND; i++) {
    const c = 2 * rnd() - 1, phi = 2 * Math.PI * rnd(), s = 1.6 + 1.6 * rnd(), q = Math.sqrt(1 - c * c);
    out.push({ u: [rnd(), rnd(), rnd()], v: [s * q * Math.cos(phi), s * q * Math.sin(phi), s * c] });
  }
  return out;
})();
const mod2 = (u, L) => ((u % (2 * L)) + 2 * L) % (2 * L);
export const fold = (u, L) => { const m = mod2(u, L); return m <= L ? m : 2 * L - m; };
const goingUp = (u, L) => mod2(u, L) < L;
export function spread(t, N) {
  const r = rm(N), Li = BOX.L / 2 - 2 * r, Lf = BOX.L - 2 * r, H = BOX.H - 2 * r, D = BOX.D - 2 * r, mol = [];
  let n1 = 0;
  for (let i = 0; i < N; i++) {
    const { u, v } = START[i], u0 = u[0] * Li;
    let x;
    if (t <= T_OPEN) x = fold(u0 + v[0] * t, Li);
    else {
      const ue = u0 + v[0] * T_OPEN, xo = fold(ue, Li), dir = (goingUp(ue, Li) ? 1 : -1) * Math.sign(v[0]);
      x = fold(xo + dir * Math.abs(v[0]) * (t - T_OPEN), Lf);
    }
    x += r;
    if (x < BOX.L / 2) n1++;
    mol.push([x, fold(u[1] * H + v[1] * t, H) + r, fold(u[2] * D + v[2] * t, D) + r]);
  }
  return { n1, mol };
}
// Entropy in units of 10⁻²³ J/K, the unit of Table 20.4.1.
export const S23 = (n1, N) => K_B * lnW(n1, N) / 1e-23;

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkCount(p, { wText, pText }) {          // W, then probability in %
  const N = p.N, n1 = p.n1, W = multiplicity(n1, N), P = 100 * W / 2 ** N, w = parseNumber(wText), q = parseNumber(pText);
  const r = { wOk: false, pOk: false, wReason: null, pReason: null };
  if (!Number.isFinite(w)) r.wReason = 'unreadable';
  else if (near(w, W)) r.wOk = true;
  else r.wReason = near(w, factorial(N) / factorial(n1)) || near(w, factorial(N) / factorial(N - n1)) ? 'oneFactorial' : near(w, factorial(N)) ? 'noDivide' : near(w, 2 ** N) ? 'total' : 'value';
  if (!Number.isFinite(q)) r.pReason = 'unreadable';
  else if (near(q, P) || near(q * 100, P)) r.pOk = true;      // typed in % or as a fraction
  else r.pReason = near(q, 100 / (N + 1)) || near(q * 100, 100 / (N + 1)) ? 'equalConfig' : near(q, 100 / 2 ** N) || near(q * 100, 100 / 2 ** N) ? 'oneMicro' : 'value';
  return { ...r, ok: r.wOk && r.pOk };
}
export function checkExpand(p, { sText }) {                 // S_f − S_i in 10⁻²³ J/K
  const N = p.NB, S = S23(N / 2, N), s = parseNumber(sText);
  if (!Number.isFinite(s)) return { ok: false, reason: 'unreadable' };
  if (near(s, S)) return { ok: true, reason: null };
  const lw = lnW(N / 2, N);
  const reason = near(s, K_B * N * Math.LN2 / 1e-23) ? 'stirling' : near(s, K_B * lw / Math.LN10 / 1e-23) ? 'log10' : near(s, lw) ? 'noK' : near(s * 1e23, S) ? 'units' : 'value';
  return { ok: false, reason };
}

// ---------- model contract ----------
const isC = p => p.activity === 'count';
const isX = p => p.activity === 'expand';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'count', options: [{ value: 'count', label: '배치 수 세기' }, { value: 'expand', label: '퍼지는 분자' }] },
  { id: 'N', label: '분자 수', sym: '<i>N</i>', unit: '', min: 2, max: NMAX_COUNT, step: 1, value: 8, showIf: isC },
  { id: 'n1', label: '고른 배열의 왼쪽 분자 수', sym: '<i>n</i><sub>1</sub>', unit: '', min: 0, max: NMAX_COUNT, step: 1, value: 3, showIf: isC, bounds: p => [0, p.N] },
  { id: 'NB', label: '분자 수', sym: '<i>N</i>', unit: '', min: 10, max: NMAX_EXPAND, step: 10, value: 40, showIf: isX },
];
export const duration = p => (isX(p) ? RUN_EXPAND : SNAPS / RATE);
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  const t = st.t;
  if (isX(p)) {
    const s = spread(t, p.NB);
    return { activity: 'expand', t, N: p.NB, ...s, n2: p.NB - s.n1, S: S23(s.n1, p.NB), lnW: lnW(s.n1, p.NB), Smax: S23(p.NB / 2, p.NB), Sstir: K_B * p.NB * Math.LN2 / 1e-23 };
  }
  const k = snapIndex(t), s = snapshot(k, p.N), h = hist(p.N)[k];
  return { activity: 'count', t, N: p.N, k, seen: k + 1, ...s, n2: p.N - s.n1, hist: h, W: multiplicity(p.n1, p.N), P: probability(p.n1, p.N), freq: h[p.n1] / (k + 1) };
}
