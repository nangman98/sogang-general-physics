// 15.5 Damped Simple Harmonic Motion — pure model (no DOM).
// A block of mass m on a spring of constant k with a vane in a liquid (Fig. 15.5.1). Damping force Fd = −bv (Eq. 15.5.1),
// −bv − kx = ma (Eq. 15.5.2), m d²x/dt² + b dx/dt + kx = 0 (Eq. 15.5.3), with the solution
// x(t) = xm e^(−bt/2m) cos(ω′t + ϕ) (Eq. 15.5.4), ω′ = √(k/m − b²/4m²) (Eq. 15.5.5). Here ϕ = 0, so the block starts at
// x = xm as in Fig. 15.5.2 (with the small velocity −bxm/2m that Eq. 15.5.4 gives at t = 0). x is measured up from the
// equilibrium position and the gravitational force on the block is neglected, as in the textbook.
// Energy: E(t) ≈ ½kxm² e^(−bt/m) for small b (Eq. 15.5.6). The bars use the exact K + U from x and v; the mechanical energy
// lost, E(0) − (K + U), is the work done by the damping force, which becomes thermal energy of the liquid and vane.
// Asked times (from Eqs. 15.5.4 and 15.5.6): amplitude halves at t = 2m ln 2 / b, energy halves at t = m ln 2 / b.
// The run lasts RUN seconds for every setting, so the time axis does not give the asked times away.
// Sample Problem values are used only in model.test.js.
import { parseNumber } from '../../../core/format.js';

export const RUN = 12;          // s of motion shown

// Constants. xm is in cm on the slider, everything here is SI.
export function oscillator({ m, k, b, xm }) {
  const A = xm / 100, g = b / (2 * m), w = Math.sqrt(k / m), wd = Math.sqrt(k / m - g * g);
  return { A, g, w, wd, T: 2 * Math.PI / wd, tAmp: 2 * m * Math.LN2 / b, tE: m * Math.LN2 / b, E0: 0.5 * k * A * A };
}
export function stateAt(t, p) {
  const s = oscillator(p), e = Math.exp(-s.g * t), c = Math.cos(s.wd * t), sn = Math.sin(s.wd * t);
  const x = s.A * e * c, v = s.A * e * (-s.g * c - s.wd * sn), a = (-p.b * v - p.k * x) / p.m;   // Eq. 15.5.2 for a
  const K = 0.5 * p.m * v * v, U = 0.5 * p.k * x * x, Estart = 0.5 * p.k * s.A ** 2 + 0.5 * p.m * (s.g * s.A) ** 2;
  return { t, x, v, a, Fd: -p.b * v, amp: s.A * e, K, U, E: K + U, Eth: Estart - (K + U), Eapprox: s.E0 * Math.exp(-p.b * t / p.m) };
}

// ---------- grading ---------- (times in s)
export const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function mistakes(p) {
  const s = oscillator(p), L10 = Math.log10(2);
  return {
    amp: { energy: s.tE, log10: 2 * p.m * L10 / p.b, noLn: 2 * p.m / p.b },
    E: { amplitude: s.tAmp, log10: p.m * L10 / p.b, noLn: p.m / p.b },
  };
}
export function check(p, { ampText, EText }) {
  const s = oscillator(p), ta = parseNumber(ampText), te = parseNumber(EText), mk = mistakes(p);
  const r = { aOk: false, eOk: false, aReason: null, eReason: null };
  if (!Number.isFinite(ta)) r.aReason = 'unreadable';
  else if (near(ta, s.tAmp)) r.aOk = true;
  else r.aReason = Object.keys(mk.amp).find(k => near(ta, mk.amp[k])) ?? 'value';
  if (!Number.isFinite(te)) r.eReason = 'unreadable';
  else if (near(te, s.tE)) r.eOk = true;
  else r.eReason = Object.keys(mk.E).find(k => near(te, mk.E[k])) ?? 'value';
  return { ...r, ok: r.aOk && r.eOk };
}

// ---------- model contract ----------
// b has a lower bound of 0.25 m (kg/s) so the amplitude halves within 2 ln 2 / 0.25 = 5.5 s, inside the run.
export const params = [
  { id: 'm', label: '질량 (mass)', sym: '<i>m</i>', unit: 'kg', min: 0.2, max: 1, step: 0.05, value: 0.4 },
  { id: 'k', label: '용수철 상수 (spring constant)', sym: '<i>k</i>', unit: 'N/m', min: 10, max: 40, step: 1, value: 25 },
  { id: 'b', label: '감쇠 상수 (damping constant)', sym: '<i>b</i>', unit: 'kg/s', min: 0.05, max: 0.5, step: 0.01, value: 0.12,
    bounds: p => [Math.max(0.05, Math.ceil(25 * p.m - 1e-9) / 100), 0.5] },
  { id: 'xm', label: '처음 진폭 (amplitude)', sym: '<i>x</i><sub>m</sub>', unit: 'cm', min: 5, max: 15, step: 1, value: 10 },
];
export const duration = () => RUN;
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { ...stateAt(st.t, p), wd: oscillator(p).wd }; }
