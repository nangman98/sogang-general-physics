// 18.3 Thermal Expansion — pure model (no DOM).
// ΔL = LαΔT (Eq. 18.3.1), ΔV = VβΔT (Eq. 18.3.2), β = 3α (Eq. 18.3.3).
// A flat face of area A = ab: both sides grow by Eq. 18.3.1, so A + ΔA = ab(1 + αΔT)² and, dropping the (αΔT)² term,
// ΔA = A(2α)ΔT (LO 18.3.2). Every linear dimension grows by the same factor (Fig. 18.3.3), so a hole cut in a plate
// grows like the plate.
// Activities.
//   rod:  a rod of length L and a square plate with a circular hole (same material) on a heating plate, heated or
//         cooled from T_i to T_f. Predict ΔL and whether the hole diameter grows, stays or shrinks.
//   cube: a cube of side a. Predict the change of one face area ΔA and of the volume ΔV.
// α from Table 18.3.1 (room temperature values, taken as constant over the slider range as the text allows).
// Ice is left out because its value holds at 0°C only.
// The playback changes the temperature evenly from T_i to T_f; its time is not a physical time.
import { parseNumber } from '../../../core/format.js';

export const MATERIALS = {
  lead: { label: '납 (Lead)', alpha: 29e-6 },
  aluminum: { label: '알루미늄 (Aluminum)', alpha: 23e-6 },
  brass: { label: '황동 (Brass)', alpha: 19e-6 },
  copper: { label: '구리 (Copper)', alpha: 17e-6 },
  concrete: { label: '콘크리트 (Concrete)', alpha: 12e-6 },
  steel: { label: '강철 (Steel)', alpha: 11e-6 },
  glass: { label: '보통 유리 (Glass, ordinary)', alpha: 9e-6 },
  pyrex: { label: '파이렉스 유리 (Glass, Pyrex)', alpha: 3.2e-6 },
  diamond: { label: '다이아몬드 (Diamond)', alpha: 1.2e-6 },
  invar: { label: '인바 (Invar)', alpha: 0.7e-6 },
  quartz: { label: '용융 석영 (Fused quartz)', alpha: 0.5e-6 },
};
export const MAG = 50;        // the scene draws the strain αΔT 50 times larger
export const HOLE = 0.25;     // m, hole diameter in the plate at T_i
export const RUN = 2.5;       // s of playback

// ---------- rod ---------- (L in m, temperatures in °C; a change of 1 C° is a change of 1 K)
export function rod({ mat, L, Ti, Tf }) {
  const alpha = MATERIALS[mat].alpha, dT = Tf - Ti, dL = L * alpha * dT;
  return { alpha, dT, dL, dLmm: dL * 1000, dD: HOLE * alpha * dT, hole: dT > 0 ? 'grow' : dT < 0 ? 'shrink' : 'same' };
}
// ---------- cube ---------- (side a in cm)
export function cube({ mat, side, Ti, Tf }) {
  const alpha = MATERIALS[mat].alpha, beta = 3 * alpha, dT = Tf - Ti, A = side * side, V = side ** 3;
  return { alpha, beta, dT, A, V, dL: side * alpha * dT, dA: A * 2 * alpha * dT * 100, dV: V * beta * dT };   // dL cm, dA mm², dV cm³
}
// Exact growth of a length, a face and a volume (every dimension times 1 + αΔT), used by the tests.
export const exact = (alpha, dT) => ({ L: alpha * dT, A: (1 + alpha * dT) ** 2 - 1, V: (1 + alpha * dT) ** 3 - 1 });
// Volume change of a liquid or solid with a given β (Eq. 18.3.2), used by the tests.
export const volumeChange = (V, beta, dT) => V * beta * dT;

export function duration() { return RUN; }
export function stateAt(t, p) {
  const u = Math.min(Math.max(t, 0), RUN) / RUN, T = p.Ti + (p.Tf - p.Ti) * u, dT = T - p.Ti, alpha = MATERIALS[p.mat].alpha;
  if (p.activity === 'cube') {
    const s = cube({ ...p, Tf: T });
    return { t: Math.min(Math.max(t, 0), RUN), T, dT, alpha, strain: alpha * dT, dA: s.dA, dV: s.dV, dL: s.dL };
  }
  const s = rod({ ...p, Tf: T });
  return { t: Math.min(Math.max(t, 0), RUN), T, dT, alpha, strain: alpha * dT, dLmm: s.dLmm, dDmm: s.dD * 1000 };
}

// ---------- grading ----------
const near = (x, y) => Math.abs(x - y) <= Math.max(0.02 * Math.abs(y), 0.01);
export function checkRod(p, { dLText, hole }) {          // ΔL in mm
  const s = rod(p), x = parseNumber(dLText);
  const r = { dLOk: false, holeOk: hole === s.hole, dLReason: null, holeReason: hole ? null : 'none' };
  if (!Number.isFinite(x)) r.dLReason = 'unreadable';
  else if (near(x, s.dLmm)) r.dLOk = true;
  else if (s.dLmm !== 0 && near(x, -s.dLmm)) r.dLReason = 'sign';
  else if (near(x, 3 * s.dLmm)) r.dLReason = 'beta';
  else if (p.Ti !== 0 && near(x, p.L * s.alpha * p.Tf * 1000)) r.dLReason = 'final';
  else if (near(x, s.dLmm / 10) || near(x, s.dLmm * 10) || near(x, s.dLmm / 1000)) r.dLReason = 'units';
  else r.dLReason = 'value';
  return { ...r, ok: r.dLOk && r.holeOk };
}
export function checkCube(p, { AText, VText }) {          // ΔA in mm², ΔV in cm³
  const s = cube(p), a = parseNumber(AText), v = parseNumber(VText);
  const r = { AOk: false, VOk: false, AReason: null, VReason: null };
  if (!Number.isFinite(a)) r.AReason = 'unreadable';
  else if (near(a, s.dA)) r.AOk = true;
  else if (s.dA !== 0 && near(a, -s.dA)) r.AReason = 'sign';
  else if (near(a, s.dA / 2)) r.AReason = 'alpha';
  else if (near(a, s.dA * 1.5)) r.AReason = 'beta';
  else if (near(a, s.dA / 100)) r.AReason = 'units';
  else r.AReason = 'value';
  if (!Number.isFinite(v)) r.VReason = 'unreadable';
  else if (near(v, s.dV)) r.VOk = true;
  else if (s.dV !== 0 && near(v, -s.dV)) r.VReason = 'sign';
  else if (near(v, s.dV / 3)) r.VReason = 'alpha';
  else if (near(v, s.dV * 2 / 3)) r.VReason = 'area';
  else if (near(v, s.dV * 1000)) r.VReason = 'units';
  else r.VReason = 'value';
  return { ...r, ok: r.AOk && r.VOk };
}

// ---------- model contract ----------
const isR = p => p.activity === 'rod';
const isC = p => p.activity === 'cube';
export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'rod', options: [{ value: 'rod', label: '막대와 구멍' }, { value: 'cube', label: '정육면체' }] },
  { id: 'mat', type: 'select', label: '재료 (Table 18.3.1)', value: 'steel', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
  { id: 'L', label: '막대 길이', sym: '<i>L</i>', unit: 'm', min: 0.5, max: 3, step: 0.1, value: 1.5, showIf: isR },
  { id: 'side', label: '한 변', sym: '<i>a</i>', unit: 'cm', min: 2, max: 20, step: 1, value: 8, showIf: isC },
  { id: 'Ti', label: '처음 온도', sym: '<i>T</i><sub>i</sub>', unit: '°C', min: -20, max: 40, step: 1, value: 20 },
  { id: 'Tf', label: '나중 온도', sym: '<i>T</i><sub>f</sub>', unit: '°C', min: -40, max: 200, step: 5, value: 150 },
];
export const init = () => ({ t: 0 });
export const at = t => ({ t });
export function observe(st, p) { return { activity: p.activity, ...stateAt(st.t, p) }; }
