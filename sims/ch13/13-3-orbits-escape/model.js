// 13.5–13.7 Escape speed, Kepler's laws, satellite orbits and energy — pure model (no DOM).
// Activities.
//   orbit:  a satellite (mass m) in a circular Earth orbit at altitude h fires a thruster at P (t = 0) so that its speed
//           becomes f times the circular speed. Energy E = ½mv² − GMm/r (Eq. 13.5.1) = −GMm/2a (Eq. 13.7.6) gives the
//           new semimajor axis a; the law of periods T² = 4π²a³/GM (Eq. 13.6.5 with a) gives T. P is the perigee when
//           f > 1 and the apogee when f < 1; the other end is at 2a − r (r_a + r_p = 2a).
//           Position in time from Kepler's equation M = E − e sin E (closed form, solved by Newton's method).
//   escape: a projectile leaves the surface of a body in Table 13.5.1 straight up at f times the escape speed
//           v = √(2GM/R) (Eq. 13.5.8). It rises to r_max = R/(1 − f²) (energy conservation, Eq. 13.5.9) and falls back.
//           Radial motion, closed form: r = r_max(1 − cos η)/2, t = √(r_max³/8GM)(η − sin η).
//           A reference projectile at exactly the escape speed follows r^{3/2} = R^{3/2} + (3/2)√(2GM) t.
import { parseNumber } from '../../../core/format.js';

export const G = 6.67e-11;
export const EARTH = { M: 5.98e24, R: 6.37e6 };
export const MSAT = 1000;      // kg, satellite mass for the energy readouts
// Table 13.5.1 (mass in kg, radius in m, escape speed in km/s as printed).
export const BODIES = {
  ceres: { label: '세레스 (Ceres)', M: 1.17e21, R: 3.8e5, vTable: 0.64 },
  moon: { label: '달 (Earth’s moon)', M: 7.36e22, R: 1.74e6, vTable: 2.38 },
  earth: { label: '지구 (Earth)', M: 5.98e24, R: 6.37e6, vTable: 11.2 },
  jupiter: { label: '목성 (Jupiter)', M: 1.90e27, R: 7.15e7, vTable: 59.5 },
};

// ---------- orbit ----------
export function orbit({ h, f }) {
  const GM = G * EARTH.M, r0 = EARTH.R + h * 1e3, vc = Math.sqrt(GM / r0), v = f * vc;
  const eps = 0.5 * v * v - GM / r0, a = -GM / (2 * eps), l = r0 * v;
  const e = Math.sqrt(Math.max(0, 1 + 2 * eps * l * l / (GM * GM)));
  const T = 2 * Math.PI * Math.sqrt(a ** 3 / GM), T0 = 2 * Math.PI * Math.sqrt(r0 ** 3 / GM);
  const other = 2 * a - r0, peri = f >= 1;
  return { GM, r0, vc, v, a, e, T, T0, other, rp: Math.min(r0, other), ra: Math.max(r0, other), peri, w: peri ? 0 : Math.PI,
    E: MSAT * eps, E0: -GM * MSAT / (2 * r0) };
}
function keplerE(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 30; i++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-14) break; }
  return E;
}
// Position at time t after firing: polar angle φ from P's direction (+x), counterclockwise.
export function orbitAt(t, p) {
  const o = orbit(p), n = 2 * Math.PI / o.T, M = (o.peri ? 0 : Math.PI) + n * t;
  const E = keplerE(((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), o.e);
  const r = o.a * (1 - o.e * Math.cos(E));
  const nu = 2 * Math.atan2(Math.sqrt(1 + o.e) * Math.sin(E / 2), Math.sqrt(1 - o.e) * Math.cos(E / 2));
  const phi = nu + o.w, v = Math.sqrt(o.GM * (2 / r - 1 / o.a));
  return { t, r, phi, x: r * Math.cos(phi), y: r * Math.sin(phi), v, K: 0.5 * MSAT * v * v, U: -o.GM * MSAT / r, E: o.E };
}
// Polar angle reached a time dt after the perigee (from = 0) or the apogee (from = π), for the equal-area sectors.
export function sectorAngles(p, from, dt, steps = 48) {
  const o = orbit(p), n = 2 * Math.PI / o.T, out = [];
  for (let i = 0; i <= steps; i++) {
    const M = from + n * dt * i / steps, E = keplerE(M, o.e);
    const nu = 2 * Math.atan2(Math.sqrt(1 + o.e) * Math.sin(E / 2), Math.sqrt(1 - o.e) * Math.cos(E / 2));
    out.push({ phi: nu + o.w, r: o.a * (1 - o.e * Math.cos(E)) });
  }
  return out;
}

// ---------- escape ----------
export function escape({ body, f }) {
  const b = BODIES[body], GM = G * b.M, vesc = Math.sqrt(2 * GM / b.R), v = f * vesc;
  const rmax = b.R / (1 - f * f), k = Math.sqrt(rmax ** 3 / (8 * GM));
  const eta0 = Math.acos(1 - 2 * b.R / rmax), tUp = k * (Math.PI - eta0 + Math.sin(eta0));
  return { ...b, GM, vesc, v, rmax, hmax: rmax - b.R, k, eta0, tUp, tFlight: 2 * tUp };
}
export function escapeAt(t, p) {
  const s = escape(p), u = Math.min(Math.max(t, 0), s.tFlight);
  // Solve η − sin η = τ for η in [η0, 2π − η0].
  const tau = u / s.k + (s.eta0 - Math.sin(s.eta0));
  let eta = Math.min(Math.max(s.eta0 + u / s.tFlight * (2 * Math.PI - 2 * s.eta0), s.eta0), 2 * Math.PI - s.eta0);
  for (let i = 0; i < 40; i++) { const d = (eta - Math.sin(eta) - tau) / Math.max(1 - Math.cos(eta), 1e-12); eta -= d; if (Math.abs(d) < 1e-13) break; }
  const r = s.rmax * (1 - Math.cos(eta)) / 2;
  const vr = Math.sign(Math.PI - eta) * Math.sqrt(Math.max(0, 2 * s.GM * (1 / r - 1 / s.rmax)));
  const rEsc = (s.R ** 1.5 + 1.5 * Math.sqrt(2 * s.GM) * u) ** (2 / 3);
  return { t: u, r, vr, rEsc };
}

// ---------- shared contract ----------
export function duration(p) { return p.activity === 'escape' ? escape(p).tFlight : orbit(p).T; }
export function stateAt(t, p) {
  if (p.activity === 'escape') return { activity: 'escape', ...escapeAt(t, p) };
  return { activity: 'orbit', ...orbitAt(Math.min(Math.max(t, 0), orbit(p).T), p) };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
// TText in min, hText in km.
export function checkOrbit(p, { TText, hText }) {
  const o = orbit(p), T = parseNumber(TText), H = parseNumber(hText), Tm = o.T / 60, Hk = (o.other - EARTH.R) / 1e3;
  const r = { TOk: false, hOk: false, TReason: null, hReason: null };
  if (!Number.isFinite(T)) r.TReason = 'unreadable';
  else if (near(T, Tm)) r.TOk = true;
  else r.TReason = near(T, o.T0 / 60) ? 'oldT' : near(T, o.T) ? 'seconds' : near(T, 2 * Math.PI * Math.sqrt(o.other ** 3 / o.GM) / 60) ? 'otherR' : 'value';
  if (!Number.isFinite(H)) r.hReason = 'unreadable';
  else if (near(H, Hk)) r.hOk = true;
  else r.hReason = near(H, o.other / 1e3) ? 'radius' : near(H, (o.a - EARTH.R) / 1e3) ? 'semimajor' : 'value';
  return { ...r, ok: r.TOk && r.hOk };
}
// vText in km/s, hText in units of R.
export function checkEscape(p, { vText, hText }) {
  const s = escape(p), V = parseNumber(vText), H = parseNumber(hText), hR = s.hmax / s.R;
  const r = { vOk: false, hOk: false, vReason: null, hReason: null };
  if (!Number.isFinite(V)) r.vReason = 'unreadable';
  else if (near(V, s.vesc / 1e3)) r.vOk = true;
  else r.vReason = near(V, Math.sqrt(s.GM / s.R) / 1e3) ? 'noTwo' : near(V, s.vesc) ? 'units' : 'value';
  if (!Number.isFinite(H)) r.hReason = 'unreadable';
  else if (near(H, hR)) r.hOk = true;
  else r.hReason = near(H, p.f * p.f) ? 'uniformG' : near(H, s.rmax / s.R) ? 'fromCenter' : 'value';
  return { ...r, ok: r.vOk && r.hOk };
}

// ---------- model contract ----------
const isO = p => p.activity === 'orbit';
const isE = p => p.activity === 'escape';
const fMin = h => Math.ceil(Math.sqrt(2 * (EARTH.R + 1e5) / (EARTH.R + h * 1e3 + EARTH.R + 1e5)) * 100) / 100;
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'orbit', options: [{ value: 'orbit', label: '궤도 바꾸기' }, { value: 'escape', label: '탈출 속력' }] },
  { id: 'h', label: '처음 원 궤도의 높이', sym: '<i>h</i>', unit: 'km', min: 300, max: 3000, step: 50, value: 1000, showIf: isO },
  { id: 'f', label: '점화 뒤 속력 ÷ 원 궤도 속력', sym: '<i>f</i>', unit: '', min: 0.9, max: 1.25, step: 0.01, value: 1.1, showIf: isO, bounds: p => [fMin(p.h), 1.25] },
  { id: 'body', type: 'select', label: '천체', value: 'earth', options: Object.entries(BODIES).map(([value, b]) => ({ value, label: b.label })), showIf: isE },
  { id: 'fe', label: '쏘는 속력 ÷ 탈출 속력', sym: '<i>f</i>', unit: '', min: 0.3, max: 0.9, step: 0.01, value: 0.7, showIf: isE },
];
// The escape activity reads its speed ratio from its own slider 'fe' (a different range from the orbit's f).
export const derive = p => (p.activity === 'escape' ? { ...p, f: p.fe } : p);
export const init = () => ({ t: 0 });
export const at = (t, p) => ({ t });
export function observe(st, p) { return stateAt(st.t, p); }
