// 1.1–1.3 Measuring Things, Time, Mass — pure model (no DOM).
// Textbook: Principles of Physics 12e, Table 1.1.1 (SI base units), Table 1.1.2 (SI prefixes),
// chain-link conversion (Eq. 1.1.6). Reference values are NOT taken from the textbook tables;
// each value cites its own source (see README.md in this folder).
import { superscript, MINUS } from '../../../core/format.js';

// Table 1.1.2 prefixes (10^24 ... 10^-24).
export const PREFIXES = [
  [24, 'yotta', 'Y'], [21, 'zetta', 'Z'], [18, 'exa', 'E'], [15, 'peta', 'P'], [12, 'tera', 'T'], [9, 'giga', 'G'],
  [6, 'mega', 'M'], [3, 'kilo', 'k'], [2, 'hecto', 'h'], [1, 'deka', 'da'], [-1, 'deci', 'd'], [-2, 'centi', 'c'],
  [-3, 'milli', 'm'], [-6, 'micro', 'μ'], [-9, 'nano', 'n'], [-12, 'pico', 'p'], [-15, 'femto', 'f'], [-18, 'atto', 'a'],
  [-21, 'zepto', 'z'], [-24, 'yocto', 'y'],
];

export const QUANTITIES = {
  length: {
    name: 'Length', unit: 'm', unitName: 'meter', prefixBase: 'm', prefixShift: 0, min: -16, max: 17,
    refs: [
      { name: 'Proton charge radius', value: 8.41e-16 },
      { name: 'Bohr radius', value: 5.29e-11 },
      { name: 'Helium–neon laser wavelength', value: 6.33e-7 },
      { name: 'Height of Mount Everest', value: 8.85e3 },
      { name: 'Mean radius of Earth', value: 6.37e6 },
      { name: 'Earth–Sun distance (1 au)', value: 1.50e11 },
      { name: 'Distance to Proxima Centauri', value: 4.02e16 },
    ],
  },
  time: {
    name: 'Time', unit: 's', unitName: 'second', prefixBase: 's', prefixShift: 0, min: -11, max: 18,
    refs: [
      { name: 'One period of the cesium-133 clock radiation', value: 1 / 9192631770 },
      { name: 'Light travel time over 1 m', value: 1 / 299792458 },
      { name: 'Mean lifetime of the muon', value: 2.20e-6 },
      { name: 'One minute', value: 60 },
      { name: 'One day', value: 86400 },
      { name: 'One year (365.25 days)', value: 3.15576e7 },
      { name: 'Age of the universe', value: 4.35e17 },
    ],
  },
  mass: {
    // SI prefixes attach to the gram, not the kilogram: 10^n kg = 10^(n+3) g.
    name: 'Mass', unit: 'kg', unitName: 'kilogram', prefixBase: 'g', prefixShift: 3, min: -31, max: 31,
    refs: [
      { name: 'Electron', value: 9.11e-31 },
      { name: 'Atomic mass unit (1 u)', value: 1.66e-27 },
      { name: 'Proton', value: 1.67e-27 },
      { name: 'One liter of water', value: 1.00 },
      { name: 'The Moon', value: 7.35e22 },
      { name: 'Earth', value: 5.97e24 },
      { name: 'The Sun', value: 1.99e30 },
    ],
  },
};

export const params = [
  { id: 'quantity', type: 'select', label: 'Base quantity', value: 'length', options: [
    { value: 'length', label: 'Length · meter (m)' }, { value: 'time', label: 'Time · second (s)' }, { value: 'mass', label: 'Mass · kilogram (kg)' }] },
  { id: 'n', label: 'Power of ten', sym: '<i>n</i>', min: -31, max: 31, step: 1, value: 3, format: v => '10' + superscript(v),
    bounds: p => [QUANTITIES[p.quantity].min, QUANTITIES[p.quantity].max] },
];

export const pow10 = n => '10' + superscript(n);

// Largest engineering prefix (multiple of 3) not above the exponent, so the number in front is 1, 10, or 100.
export function prefixFor(exp) {
  const eng = PREFIXES.filter(([e]) => e % 3 === 0);
  if (exp > 26 || exp < -24) return null;
  const pick = eng.find(([e]) => e <= exp) ?? [0, '', ''];
  if (exp >= 0 && exp < 3) return { exp: 0, name: '', symbol: '', mantissa: 10 ** exp };
  return { exp: pick[0], name: pick[1], symbol: pick[2], mantissa: 10 ** (exp - pick[0]) };
}

export function nearest(q, n) {
  let best = null;
  for (const r of q.refs) {
    const d = Math.abs(Math.log10(r.value) - n);
    if (!best || d < best.d) best = { ...r, d, log: Math.log10(r.value) };
  }
  return best;
}

export function init(p) {
  return { n: p.n };
}

export function observe(state, p) {
  const q = QUANTITIES[p.quantity];
  const n = p.n;
  const exp = n + q.prefixShift; // exponent of the prefix base unit (g for mass)
  const pre = prefixFor(exp);
  const sci = `${pow10(n)} ${q.unit}`;
  let prefixed = null, chain = null;
  if (pre) {
    const mant = pre.mantissa >= 1 ? String(Math.round(pre.mantissa)) : String(pre.mantissa);
    prefixed = `${mant} ${pre.symbol}${q.prefixBase}`;
    const target = `${pre.symbol}${q.prefixBase}`;
    // Chain-link conversion written as factors equal to unity (Eq. 1.1.6 style).
    const steps = [];
    if (q.prefixShift) steps.push(`(10${superscript(q.prefixShift)} g / 1 kg)`);
    if (pre.exp !== 0) steps.push(`(1 ${target} / 10${superscript(pre.exp)} ${q.prefixBase})`);
    chain = steps.length ? `${sci} × ${steps.join(' × ')} = ${prefixed}` : `${sci} = ${prefixed}`;
  }
  const near = nearest(q, n);
  return { n, quantity: p.quantity, unit: q.unit, sci, prefixed, prefixName: pre ? pre.name : null, chain, nearest: near };
}

export { MINUS };
