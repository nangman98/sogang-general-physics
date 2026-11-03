// 1.1–1.3 Measuring Things, Time, Mass — pure model (no DOM).
// Three activities. scale: orders of magnitude for length, time, mass. convert: chain-link conversion of
// length, area, volume (LO 1.1.3, Eq. 1.1.6). density: rho = m/V on a balance (LO 1.3.2, Eq. 1.3.2).
// Reference values are NOT copied from the textbook tables. Sources are listed in README.md.
import { superscript, fmt } from '../../../core/format.js';

export const C = 299792458;          // m/s, exact (meter definition, Module 1.1)
export const RHO_WATER = 1000;       // kg/m^3 = 1.00 g/cm^3 (Module 1.3)

// Textbook Table 1.1.2 prefixes (10^24 ... 10^-24).
export const PREFIXES = [
  [24, 'yotta', 'Y', '요타'], [21, 'zetta', 'Z', '제타'], [18, 'exa', 'E', '엑사'], [15, 'peta', 'P', '페타'], [12, 'tera', 'T', '테라'],
  [9, 'giga', 'G', '기가'], [6, 'mega', 'M', '메가'], [3, 'kilo', 'k', '킬로'], [2, 'hecto', 'h', '헥토'], [1, 'deka', 'da', '데카'],
  [-1, 'deci', 'd', '데시'], [-2, 'centi', 'c', '센티'], [-3, 'milli', 'm', '밀리'], [-6, 'micro', 'μ', '마이크로'], [-9, 'nano', 'n', '나노'],
  [-12, 'pico', 'p', '피코'], [-15, 'femto', 'f', '펨토'], [-18, 'atto', 'a', '아토'], [-21, 'zepto', 'z', '젭토'], [-24, 'yocto', 'y', '욕토'],
];

// approx: true marks typical sizes (order of magnitude), shown with "약".
export const OBJECTS = {
  length: [
    { name: '양성자 지름', value: 1.68e-15 },
    { name: '수소 원자 지름', value: 1.06e-10 },
    { name: 'DNA 이중나선 지름', value: 2e-9, approx: true },
    { name: '독감 바이러스', value: 1e-7, approx: true },
    { name: '헬륨–네온 레이저 빛의 파장', value: 6.33e-7 },
    { name: '적혈구 지름', value: 7.5e-6, approx: true },
    { name: '머리카락 굵기', value: 7e-5, approx: true },
    { name: '100원 동전 지름', value: 2.40e-2 },
    { name: '성인 키', value: 1.7, approx: true },
    { name: '축구장 길이', value: 105 },
    { name: '에베레스트산 높이', value: 8.85e3 },
    { name: '서울–부산 직선거리', value: 3.25e5 },
    { name: '지구 지름', value: 1.27e7 },
    { name: '지구–달 거리', value: 3.84e8 },
    { name: '태양 지름', value: 1.39e9 },
    { name: '지구–태양 거리 (1 au)', value: 1.50e11 },
    { name: '해왕성 궤도 반지름', value: 4.50e12 },
    { name: '1광년', value: 9.46e15 },
    { name: '프록시마 센타우리까지', value: 4.02e16 },
    { name: '우리 은하 지름', value: 9.5e20, approx: true },
    { name: '안드로메다은하까지', value: 2.4e22 },
    { name: '관측 가능한 우주 지름', value: 8.8e26 },
  ],
  time: [
    { name: '빛이 양성자 지름을 지나는 시간', value: 5.6e-24 },
    { name: '세슘-133 시계 빛의 한 주기', value: 1 / 9192631770 },
    { name: '3 GHz 컴퓨터 클럭 한 주기', value: 1 / 3e9 },
    { name: '빛이 1 m 가는 시간', value: 1 / C },
    { name: '뮤온 평균 수명', value: 2.20e-6 },
    { name: '빛이 서울–부산 가는 시간', value: 1.08e-3 },
    { name: '심장 박동 한 번', value: 0.8, approx: true },
    { name: '1분', value: 60 },
    { name: '빛이 태양에서 지구까지', value: 499 },
    { name: '1일', value: 86400 },
    { name: '1년 (365.25일)', value: 3.15576e7 },
    { name: '사람 기대 수명 (82.7년)', value: 2.61e9 },
    { name: '피라미드의 나이', value: 1.4e11, approx: true },
    { name: '지구의 나이', value: 1.43e17 },
    { name: '우주의 나이', value: 4.35e17 },
  ],
  mass: [
    { name: '전자', value: 9.11e-31 },
    { name: '양성자', value: 1.67e-27 },
    { name: '물 분자', value: 2.99e-26 },
    { name: '대장균 한 마리', value: 1e-15, approx: true },
    { name: '모기 한 마리', value: 2.5e-6, approx: true },
    { name: '100원 동전', value: 5.42e-3 },
    { name: '물 1 L', value: 1.00 },
    { name: '성인', value: 70, approx: true },
    { name: '승용차', value: 1.5e3, approx: true },
    { name: 'A380 여객기 최대 이륙 질량', value: 5.75e5 },
    { name: '지구 대기 전체', value: 5.15e18 },
    { name: '달', value: 7.35e22 },
    { name: '지구', value: 5.97e24 },
    { name: '태양', value: 1.99e30 },
    { name: '우리 은하 (암흑 물질 포함)', value: 3.1e42, approx: true },
  ],
};

export const QUANTITIES = {
  length: { label: '길이 (length)', unit: 'm', symbol: 'L', prefixBase: 'm', shift: 0, min: -15.5, max: 27 },
  time: { label: '시간 (time)', unit: 's', symbol: 't', prefixBase: 's', shift: 0, min: -24, max: 18 },
  mass: { label: '질량 (mass)', unit: 'kg', symbol: 'm', prefixBase: 'g', shift: 3, min: -31, max: 43 },
};

export const MATERIALS = [
  { id: 'water', name: '물 (water)', rho: 1.00, color: 0x56b4e9 },
  { id: 'aluminum', name: '알루미늄 (aluminum)', rho: 2.70, color: 0xc9cfd6 },
  { id: 'iron', name: '철 (iron)', rho: 7.87, color: 0x5d6670 },
  { id: 'gold', name: '금 (gold)', rho: 19.3, color: 0xe0ad3a },
  { id: 'platinum', name: '백금 (platinum)', rho: 21.4, color: 0xe6e8ea },
];
const material = id => MATERIALS.find(m => m.id === id);

export const params = [
  { id: 'activity', type: 'tabs', label: '활동', value: 'scale', options: [
    { value: 'scale', label: '크기 비교' }, { value: 'convert', label: '단위 변환' }, { value: 'density', label: '밀도' }] },
  { id: 'quantity', type: 'select', label: '기본량 (base quantity)', value: 'length', showIf: p => p.activity === 'scale', options: [
    { value: 'length', label: '길이 (length) · meter, m' }, { value: 'time', label: '시간 (time) · second, s' }, { value: 'mass', label: '질량 (mass) · kilogram, kg' }] },
  { id: 'n', label: '10의 거듭제곱 (power of ten)', sym: '<i>n</i>', min: -31, max: 43, step: 0.05, value: 0.25,
    showIf: p => p.activity === 'scale', format: v => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)).replace('-', '−') : v.toFixed(2).replace('-', '−')),
    bounds: p => [QUANTITIES[p.quantity].min, QUANTITIES[p.quantity].max] },
  { id: 'dim', type: 'select', label: '바꿀 양', value: '3', showIf: p => p.activity === 'convert', options: [
    { value: '1', label: '길이 (length) · m' }, { value: '2', label: '넓이 (area) · m²' }, { value: '3', label: '부피 (volume) · m³' }] },
  { id: 'unit', type: 'select', label: '바꿀 단위', value: 'cm', showIf: p => p.activity === 'convert', options: [
    { value: 'cm', label: '센티미터 (centimeter), cm' }, { value: 'mm', label: '밀리미터 (millimeter), mm' }] },
  { id: 'matA', type: 'select', label: '왼쪽 물질', value: 'water', showIf: p => p.activity === 'density', options: MATERIALS.map(m => ({ value: m.id, label: `${m.name} ${m.rho.toFixed(2)} g/cm³` })) },
  { id: 'a', label: '왼쪽 한 변', sym: '<i>a</i>', unit: 'cm', min: 1, max: 10, step: 0.01, value: 5, showIf: p => p.activity === 'density' },
  { id: 'matB', type: 'select', label: '오른쪽 물질', value: 'iron', showIf: p => p.activity === 'density', options: MATERIALS.map(m => ({ value: m.id, label: `${m.name} ${m.rho.toFixed(2)} g/cm³` })) },
  { id: 'b', label: '오른쪽 한 변', sym: '<i>b</i>', unit: 'cm', min: 1, max: 10, step: 0.01, value: 3, showIf: p => p.activity === 'density' },
];

// ---------- scale ----------
// log10 of the length shown in the 3D scene for a value 10^n of the chosen quantity.
export function sceneLog(quantity, n) {
  if (quantity === 'time') return n + Math.log10(C);                 // distance light travels, L = ct
  if (quantity === 'mass') return (n - Math.log10(RHO_WATER)) / 3;   // water cube of that mass, L = (m/rho)^(1/3)
  return n;
}
export function sceneLength(quantity, value) {
  if (quantity === 'time') return C * value;
  if (quantity === 'mass') return Math.cbrt(value / RHO_WATER);
  return value;
}

// SI prefix form of a value in the base unit: largest multiple-of-3 prefix not above the exponent.
export function prefixed(value, quantity) {
  const q = QUANTITIES[quantity];
  const v = value * 10 ** q.shift;                // mass prefixes attach to the gram
  const e = Math.floor(Math.log10(v) + 1e-9);
  if (e > 26 || e < -24) return null;
  if (e >= 0 && e < 3) return { text: `${fmt(v)} ${q.prefixBase}`, name: '', ko: '' };
  const pick = PREFIXES.filter(([x]) => x % 3 === 0).find(([x]) => x <= e);
  const m = v / 10 ** pick[0];
  return { text: `${fmt(m)} ${pick[2]}${q.prefixBase}`, name: pick[1], ko: pick[3] };
}

export function nearest(quantity, n) {
  let best = null;
  for (const o of OBJECTS[quantity]) {
    const d = Math.abs(Math.log10(o.value) - n);
    if (!best || d < best.d) best = { ...o, d };
  }
  return best;
}

// ---------- convert ----------
export const unitFactor = unit => (unit === 'cm' ? 100 : 1000);
export function conversion(dim, unit) {
  const k = unitFactor(unit), d = Number(dim);
  return { dim: d, unit, perUnit: k, factor: k ** d, exp: Math.round(Math.log10(k ** d)) };
}

// Deterministic question list (no Math.random): value in m^d converted to unit^d, or back.
const QVALUES = [2.0, 3.5, 0.25, 7.2, 1.5, 4.0, 0.60, 9.1];
export function question(index, dim, unit) {
  const v = QVALUES[((index % QVALUES.length) + QVALUES.length) % QVALUES.length];
  const back = index % 2 === 1;                  // odd questions go from the small unit back to m
  const { factor } = conversion(dim, unit);
  const d = Number(dim), pow = d === 1 ? '' : superscript(d);
  if (!back) return { given: v, from: `m${pow}`, to: `${unit}${pow}`, answer: v * factor, dim: d, unit, back };
  return { given: v * factor, from: `${unit}${pow}`, to: `m${pow}`, answer: v, dim: d, unit, back };
}

// Accepts 2e6, 2.0E6, 2×10^6, 2*10^6, 2 x 10^6, 2000000, 2,000,000.
export function parseNumber(text) {
  const s = String(text).trim().replace(/,/g, '').replace(/−/g, '-').replace(/\s+/g, '');
  const m = s.match(/^([-+]?\d*\.?\d+)(?:(?:[x×*]10\^?|e|E)([-+]?\d+))?$/);
  if (!m) return NaN;
  return parseFloat(m[1]) * (m[2] !== undefined ? 10 ** parseInt(m[2], 10) : 1);
}

export function check(q, text) {
  const x = parseNumber(text);
  if (!Number.isFinite(x)) return { ok: false, reason: 'unreadable' };
  const rel = v => Math.abs(x - v) / Math.abs(v);
  if (rel(q.answer) < 1e-6) return { ok: true };
  const k = unitFactor(q.unit), F = conversion(q.dim, q.unit).factor;
  const linear = q.back ? q.given / k : q.given * k;            // used the length factor only once
  if (q.dim > 1 && rel(linear) < 1e-6) return { ok: false, reason: 'power' };
  const flipped = q.back ? q.given * F : q.given / F;            // multiplied instead of divided, or back
  if (rel(flipped) < 1e-6) return { ok: false, reason: 'direction' };
  return { ok: false, reason: 'value' };
}

// ---------- density ----------
// The balance reads level when the masses differ by less than 2 % of the larger one.
export const LEVEL_TOLERANCE = 0.02;
export function balance(p) {
  const A = material(p.matA), B = material(p.matB);
  const VA = p.a ** 3, VB = p.b ** 3;           // cm^3
  const mA = A.rho * VA, mB = B.rho * VB;       // g, Eq. (1.3.2) rho = m/V
  const rel = (mB - mA) / Math.max(mA, mB);
  const level = Math.abs(rel) < LEVEL_TOLERANCE;
  return { A, B, VA, VB, mA, mB, rel, level, tilt: Math.max(-1, Math.min(1, rel * 2.5)) * 0.21, side: level ? 'level' : rel > 0 ? 'right' : 'left' };
}

// ---------- model contract ----------
export function init(p) {
  return { t: 0, n: p.n };
}
export function step(s, dt, p) {
  return { t: s.t + dt, n: Math.min(s.n + 0.8 * dt, QUANTITIES[p.quantity].max) };
}
export const atEnd = (s, p) => p.activity !== 'scale' || s.n >= QUANTITIES[p.quantity].max - 1e-9;
export const restart = (s, p) => ({ t: 0, n: QUANTITIES[p.quantity].min });
export const syncParams = s => ({ n: s.n });

export function observe(s, p) {
  if (p.activity === 'scale') {
    const value = 10 ** s.n;
    return {
      activity: 'scale', quantity: p.quantity, n: s.n, value, nL: sceneLog(p.quantity, s.n),
      sceneLength_m: sceneLength(p.quantity, value), prefix: prefixed(value, p.quantity), nearest: nearest(p.quantity, s.n),
    };
  }
  if (p.activity === 'convert') return { activity: 'convert', ...conversion(p.dim, p.unit) };
  return { activity: 'density', ...balance(p) };
}
