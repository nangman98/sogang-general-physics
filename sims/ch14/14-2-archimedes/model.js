// 14.5 Archimedes' Principle — pure model (no DOM).
// F_b = m_f g (Eq. 14.5.1); floating F_b = F_g (Eq. 14.5.2); apparent weight = weight − F_b (Eq. 14.5.4).
// Activities.
//   float: a cube of side H and density ρ (ρ_f/2 ≤ ρ < ρ_f) in a wide tank. Floating depth h = (ρ/ρ_f)H
//          (Sample Problem 14.5.2 form). The block is held with its top at the surface and released: just after release
//          a = (ρ_f/ρ − 1)g up. While partly submerged, ρHa = ρ_f s g − ρHg is linear in the submerged depth s, so the
//          block bobs about s = h between s = H and s = 2h − H ≥ 0 (no water drag, no added mass, level unchanged).
//   weigh: a block of volume V hangs from a spring scale and is lowered until fully submerged. The scale reads
//          weight − F_b with F_b = ρ_f V_sub g.
// Densities: fluids and iron from Table 14.1.1, aluminum, glass and concrete from Table 12.3.1.
import { parseNumber } from '../../../core/format.js';

export const G = 9.8;
export const FLUIDS = {
  water: { label: '물 (20°C, 1 atm)', rho: 998 },
  seawater: { label: '바닷물 (20°C, 1 atm)', rho: 1024 },
  mercury: { label: '수은 (mercury)', rho: 13600 },
};
export const SOLIDS = {
  iron: { label: '철 (iron)', rho: 7900 },
  aluminum: { label: '알루미늄 (aluminum)', rho: 2710 },
  glass: { label: '유리 (glass)', rho: 2190 },
  concrete: { label: '콘크리트 (concrete)', rho: 2320 },
};
export const RUN_FLOAT = 1.8, RUN_WEIGH = 0.8;   // s of physical time (the screen plays 4 times slower)

// ---------- float ---------- (H in cm on the slider)
export function floatBlock({ fluid, rho, H }) {
  const rf = FLUIDS[fluid].rho, Hm = H / 100, h = rho / rf * Hm, w = Math.sqrt(rf * G / (rho * Hm));
  return { rf, Hm, h, a0: (rf / rho - 1) * G, w, T: 2 * Math.PI / w, amp: Hm - h };
}
// Submerged depth s(t): s = h + (H − h) cos ωt, starting fully submerged at rest.
export function floatAt(t, p) {
  const s = floatBlock(p), u = Math.min(Math.max(t, 0), RUN_FLOAT);
  const sub = s.h + s.amp * Math.cos(s.w * u), v = s.amp * s.w * Math.sin(s.w * u);   // v: upward speed of the block
  const Fb = s.rf * sub * (s.Hm * s.Hm) * G, Fg = p.rho * s.Hm ** 3 * G;
  return { t: u, sub, v, a: (Fb - Fg) / (p.rho * s.Hm ** 3), Fb, Fg };
}

// ---------- weigh ---------- (V in cm³ on the slider)
export function weigh({ solid, fluid, V }) {
  const rs = SOLIDS[solid].rho, rf = FLUIDS[fluid].rho, Vm = V * 1e-6;
  const W = rs * Vm * G, Fb = rf * Vm * G;
  return { rs, rf, Vm, W, Fb, app: W - Fb, side: Math.cbrt(Vm) };
}
export function weighAt(t, p) {
  const s = weigh(p), u = Math.min(Math.max(t, 0), RUN_WEIGH), f = u / RUN_WEIGH;
  const frac = Math.min(Math.max((f - 0.25) / 0.6, 0), 1);          // submerged fraction: in air first, then going in
  return { t: u, f, frac, Fb: s.Fb * frac, reading: s.W - s.Fb * frac, W: s.W };
}

export function duration(p) { return p.activity === 'weigh' ? RUN_WEIGH : RUN_FLOAT; }
export function stateAt(t, p) { return p.activity === 'weigh' ? { activity: 'weigh', ...weighAt(t, p) } : { activity: 'float', ...floatAt(t, p) }; }

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkFloat(p, { hText, aText }) {          // h in cm, a in m/s²
  const s = floatBlock(p), hh = parseNumber(hText), a = parseNumber(aText), hc = s.h * 100;
  const r = { hOk: false, aOk: false, hReason: null, aReason: null };
  if (!Number.isFinite(hh)) r.hReason = 'unreadable';
  else if (near(hh, hc)) r.hOk = true;
  else r.hReason = near(hh, p.H - hc) ? 'above' : near(hh, s.rf / p.rho * p.H) ? 'inverse' : 'value';
  if (!Number.isFinite(a)) r.aReason = 'unreadable';
  else if (near(Math.abs(a), s.a0)) r.aOk = true;
  else r.aReason = near(Math.abs(a), G) ? 'g' : near(Math.abs(a), s.rf / p.rho * G) ? 'noWeight' : 'value';
  return { ...r, ok: r.hOk && r.aOk };
}
export function checkWeigh(p, { bText, wText }) {         // forces in N
  const s = weigh(p), b = parseNumber(bText), w = parseNumber(wText);
  const r = { bOk: false, wOk: false, bReason: null, wReason: null };
  if (!Number.isFinite(b)) r.bReason = 'unreadable';
  else if (near(b, s.Fb)) r.bOk = true;
  else r.bReason = near(b, s.W) ? 'blockRho' : near(b, s.Fb * 1e6) || near(b, s.Fb * 1e3) ? 'units' : 'value';
  if (!Number.isFinite(w)) r.wReason = 'unreadable';
  else if (near(w, s.app)) r.wOk = true;
  else r.wReason = near(w, s.W) ? 'weight' : near(w, s.W + s.Fb) ? 'sum' : 'value';
  return { ...r, ok: r.bOk && r.wOk };
}

// ---------- model contract ----------
const isF = p => p.activity === 'float';
const isW = p => p.activity === 'weigh';
const fluidOpts = keys => keys.map(k => ({ value: k, label: FLUIDS[k].label }));
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'float', options: [{ value: 'float', label: '뜨는 블록' }, { value: 'weigh', label: '겉보기 무게' }] },
  { id: 'fluid', type: 'select', label: '액체', value: 'water', options: fluidOpts(['water', 'seawater', 'mercury']) },
  { id: 'rho', label: '블록 밀도', sym: '<i>ρ</i>', unit: 'kg/m³', min: 400, max: 13000, step: 10, value: 800, showIf: isF,
    bounds: p => [Math.ceil(FLUIDS[p.fluid].rho * 0.5 / 10) * 10, Math.floor(FLUIDS[p.fluid].rho * 0.95 / 10) * 10] },
  { id: 'H', label: '블록 한 변', sym: '<i>H</i>', unit: 'cm', min: 4, max: 20, step: 1, value: 10, showIf: isF },
  { id: 'solid', type: 'select', label: '매단 물체', value: 'aluminum', options: Object.entries(SOLIDS).map(([value, m]) => ({ value, label: m.label })), showIf: isW },
  { id: 'V', label: '물체 부피', sym: '<i>V</i>', unit: 'cm³', min: 100, max: 2000, step: 50, value: 500, showIf: isW },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return stateAt(st.t, p); }
