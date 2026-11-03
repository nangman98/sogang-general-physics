// Number formatting shared by every screen.
// Rules (02_계획/05_디자인_기준.md): 3 significant figures by default,
// U+2212 minus sign, no digit grouping, scientific notation when |x| >= 10^sig (1000 for 3 figures) or 0 < |x| < 1e-2.

export const MINUS = '−';
const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

export function superscript(n) {
  return String(n).split('').map(ch => SUP[ch] ?? ch).join('');
}

function minus(s) {
  return s.replace(/^-/, MINUS);
}

// fmt(x, {sig, zero}) -> string. zero: values with |x| < zero print as 0 (default 0, so 1e-15 m stays visible).
// sci: true forces scientific notation (used where the notation itself is the lesson, e.g. 1-1).
export function fmt(x, { sig = 3, zero = 0, sci = false } = {}) {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  if (!Number.isFinite(x)) return x > 0 ? '∞' : MINUS + '∞';
  if (x === 0 || Math.abs(x) < zero) return '0';
  const a = Math.abs(x);
  // From 10^sig up, trailing zeros would hide the number of significant figures (5330 vs 5.33 × 10³).
  if (sci || a >= 10 ** sig || a < 1e-2) {
    let e = Math.floor(Math.log10(a));
    let m = x / 10 ** e;
    let ms = m.toPrecision(sig);
    if (Math.abs(parseFloat(ms)) >= 10) { e += 1; ms = (x / 10 ** e).toPrecision(sig); }
    return minus(ms) + ' × 10' + superscript(e);
  }
  let s = x.toPrecision(sig);
  if (s.includes('e')) s = String(parseFloat(s));
  return minus(s);
}

// fmtFixed keeps a fixed number of decimals (axis ticks, slider values).
export function fmtFixed(x, decimals) {
  const s = (Math.abs(x) < 0.5 * 10 ** -decimals ? 0 : x).toFixed(decimals);
  return minus(s);
}

export function withUnit(x, unit, opts) {
  return unit ? `${fmt(x, opts)} ${unit}` : fmt(x, opts);
}

export function tuple(values, opts) {
  return '(' + values.map(v => fmt(v, opts)).join(', ') + ')';
}
