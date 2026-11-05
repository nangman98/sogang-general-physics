// 20.1 Entropy — free expansion and reversible isothermal expansion between the same two states, pure model (no DOM).
// n mol of ideal gas at temperature T goes from volume V_i to V_f = r V_i.
//   Reversible isothermal expansion (gas on a thermal reservoir at T, lead shot removed slowly):
//     ΔE_int = 0 (Eq. 19.7.9), so Q = W = nRT ln(V_f/V_i) (Eq. 19.2.10, first law Eq. 18.5.3, Table 19.9.1),
//     ΔS = Q/T = nR ln(V_f/V_i) (Eq. 20.1.2). Eq. 20.1.4 with T_f = T_i gives the same value.
//   Free expansion (insulated box, partition removed, gas rushes into vacuum): Q = W = 0 and T_f = T_i (Eq. 19.9.10).
//     It is irreversible, so ΔS is found from a reversible process between the same states (Eq. 20.1.1,
//     Sample Problem 20.1.2): ΔS = nR ln(V_f/V_i), the same as for the isothermal expansion.
// Playback is not real time. The partition is removed at T_OPEN. The isothermal expansion runs from T_OPEN to T_END with
// ln V linear in time, so Q grows linearly. The free-expansion box holds N_MOL drawn molecules that fly in straight lines
// and reflect from the walls (closed form, no collisions) from seeded random starts, so every run is the same.
import { parseNumber } from '../../../core/format.js';

export const R = 8.31;                       // J/mol·K (Eq. 19.2.2)
export const T_OPEN = 0.5, T_EQ = 3.0, T_END = 5.5, RUN = 6.0;
export const BOX = { L: 4, H: 1.2, D: 1.2 }; // drawing units of the free-expansion box at V_f (V_i fills L/r)
export const N_MOL = 60, RM = 0.07;          // drawn molecules and their radius (drawing units)

// ---------- gas ---------- (V in L, p in kPa: nRT/V with V in L gives kPa)
export function gas({ n, T, Vi, r }) {
  const Vf = Vi * r, Q = n * R * T * Math.log(r);
  return { Vf, pi: n * R * T / Vi, pf: n * R * T / Vf, Q, W: Q, dS: Q / T };
}
// Isothermal state at playback time t: fraction s of the process, volume, pressure, heat so far, entropy change so far.
export function isoAt(t, p) {
  const g = gas(p), s = Math.min(Math.max((t - T_OPEN) / (T_END - T_OPEN), 0), 1);
  const V = p.Vi * p.r ** s;
  return { s, V, p: p.n * R * p.T / V, Q: s * g.Q, dS: s * g.Q / p.T };
}

// ---------- molecules ----------
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
const START = (() => {
  const rnd = rng(2011), out = [];
  for (let i = 0; i < N_MOL; i++) {
    const c = 2 * rnd() - 1, phi = 2 * Math.PI * rnd(), s = 1.6 + 1.6 * rnd(), q = Math.sqrt(1 - c * c);
    out.push({ u: [rnd(), rnd(), rnd()], v: [s * q * Math.cos(phi), s * q * Math.sin(phi), s * c] });
  }
  return out;
})();
const mod2 = (u, L) => ((u % (2 * L)) + 2 * L) % (2 * L);
// Straight flight with mirror reflections at 0 and L, unfolded coordinate u.
export const fold = (u, L) => { const m = mod2(u, L); return m <= L ? m : 2 * L - m; };
const goingUp = (u, L) => mod2(u, L) < L;
// Molecule centers in box coordinates (x from 0 to BOX.L, y from 0 to BOX.H, z from 0 to BOX.D) at time t.
export function molecules(t, r) {
  const Li = BOX.L / r - 2 * RM, Lf = BOX.L - 2 * RM, H = BOX.H - 2 * RM, D = BOX.D - 2 * RM;
  return START.map(({ u, v }) => {
    let x;
    const u0 = u[0] * Li;
    if (t <= T_OPEN) x = fold(u0 + v[0] * t, Li);
    else {
      const ue = u0 + v[0] * T_OPEN, xo = fold(ue, Li), dir = (goingUp(ue, Li) ? 1 : -1) * Math.sign(v[0]);
      x = fold(xo + dir * Math.abs(v[0]) * (t - T_OPEN), Lf);
    }
    return [x + RM, fold(u[1] * H + v[1] * t, H) + RM, fold(u[2] * D + v[2] * t, D) + RM];
  });
}

// ---------- grading ----------
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function check(p, { QText, SText }) {           // Q in J, ΔS in J/K
  const g = gas(p), Q = parseNumber(QText), S = parseNumber(SText), lg = Math.log10(p.r);
  const r = { QOk: false, SOk: false, QReason: null, SReason: null };
  if (!Number.isFinite(Q)) r.QReason = 'unreadable';
  else if (near(Q, g.Q)) r.QOk = true;
  else r.QReason = near(Q, 0) ? 'zero' : near(Q, p.n * R * p.T * lg) ? 'log10' : near(Q, g.pi * (g.Vf - p.Vi)) ? 'isobaric' : near(Q, g.Q / p.n) ? 'noN' : 'value';
  if (!Number.isFinite(S)) r.SReason = 'unreadable';
  else if (near(S, g.dS)) r.SOk = true;
  else r.SReason = near(S, 0) ? 'zero' : near(S, g.Q) ? 'noT' : near(S, -g.dS) ? 'sign' : near(S, p.n * R * lg) ? 'log10' : 'value';
  return { ...r, ok: r.QOk && r.SOk };
}

// ---------- model contract ----------
export const params = [
  { id: 'n', label: '몰수 (number of moles)', sym: '<i>n</i>', unit: 'mol', min: 0.5, max: 3, step: 0.1, value: 2 },
  { id: 'T', label: '온도 (temperature)', sym: '<i>T</i>', unit: 'K', min: 250, max: 500, step: 10, value: 300 },
  { id: 'Vi', label: '처음 부피 (initial volume)', sym: '<i>V</i><sub>i</sub>', unit: 'L', min: 5, max: 20, step: 1, value: 10 },
  { id: 'r', label: '부피 비', sym: '<i>V</i><sub>f</sub>/<i>V</i><sub>i</sub>', unit: '', min: 1.5, max: 4, step: 0.5, value: 3 },
];
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) {
  const t = st.t, iso = isoAt(t, p), g = gas(p);
  const mol = molecules(t, p.r), xi = BOX.L / p.r;
  return { t, ...iso, Qtot: g.Q, dStot: g.dS, Vf: g.Vf, pi: g.pi, pf: g.pf, open: t > T_OPEN, eq: t >= T_EQ, mol, right: mol.filter(m => m[0] > xi).length };
}
