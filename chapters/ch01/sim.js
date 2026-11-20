// 1장 시뮬레이션 "길이·시간·질량의 크기"(공용 틀 core/simshell.js). 아래쪽 나무 자는 한 눈금이 10배인 자이고
// 그 위에 교재 표 1.1.3(길이), 1.2.1(시간), 1.3.1(질량)의 물체를 직접 그린 그림(icons.js)으로 제자리(값의 log10)에 세운다.
// 빨간 바늘(크기 slider와 같은 값 10^n)을 끌거나 자를 누르거나 그림을 누르면 값이 바뀌고, 가장 가까운 물체를 위에 크게 띄운다.
// 자 아래 줄은 교재 표 1.1.2의 접두어가 붙는 자리다(질량은 그램에 붙인다). 처음 값은 SI 단위 하나(1 m, 1 s, 1 kg)다.
// 읽기 칸의 빨간 값은 빛이 진공에서 c로 그 길이를 가는 시간(길이) 또는 그 시간 동안 가는 거리(시간)다. 질량에는 없다.
// 가까운 그림끼리는 최대 세 줄(좁은 화면 네 줄)로 엇갈려 놓고, 그림 아래 선과 점이 자 위의 정확한 자리를 가리킨다.
import { QUANTITIES, PREFIXES, prefixed, nearest, log10Of, sourceOf, C_LIGHT, sci } from './sizes.js';
import { ICON_DEFS, iconOf } from './icons.js';
import { COLOR, tex } from '../../core/simkit.js';
import { stage, minus } from '../../core/simshell.js';

const $ = id => document.getElementById(id);
const n = () => Number($('n').value);
const NAME = { length: '길이', time: '시간', mass: '질량' };
let key = 'length', q = QUANTITIES.length, KIT = null, S = null;

const unitTex = sym => `\\mathrm{${sym.replace('μ', '\\text{μ}')}}`;
const sciTex = ([m, e]) => (e === 0 ? m.toFixed(1) : `${m.toFixed(1)}\\times 10^{${e}}`);
// SVG 글에서 위 첨자. 뒤 글은 원래 높이로 돌린다.
const pow = (mant, e, unit) => (e === 0 ? `${mant} ${unit}` : `${mant} × 10<tspan dy="-0.5em" font-size="0.72em">${minus(e)}</tspan><tspan dy="0.36em"> ${unit}</tspan>`);

function setRange() { const s = $('n'); s.min = q.min; s.max = q.max; s.value = 0; }
setRange();
stage($('scene'), k => { KIT = { ...k, root: k.el('g') }; build(); });

// 지금 기본량(q)으로 장면을 새로 그린다. 화면 크기나 기본량이 바뀔 때 부른다.
function build() {
  if (!KIT) return;
  const { w, h, root } = KIT, E = (name, attrs = {}, parent = root) => KIT.el(name, attrs, parent);
  root.replaceChildren();
  const K = Math.max(1, Math.min(1.6, h / 320)), sq = Math.sqrt(K), narrow = w < 640;
  const L = narrow ? 22 : 48, R = w - (narrow ? 22 : 112), RH = 26 + 8 * K, RY = h - RH - (narrow ? 44 : 30 * sq + 6);
  const X = v => L + (R - L) * (v - q.min) / (q.max - q.min), dec = (R - L) / (q.max - q.min);
  const s = Math.round(Math.max(30, Math.min(66, w / 21, h / 8.5)));
  E('defs').innerHTML = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f1f9"/><stop offset="1" stop-color="#fbfcfe"/></linearGradient>
    <linearGradient id="ruler" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf2d9"/><stop offset="1" stop-color="#e9d39c"/></linearGradient>` + ICON_DEFS;
  E('rect', { x: 0, y: 0, width: w, height: h, fill: 'url(#bg)' });

  // 그림 자리. 바로 옆 그림과 겹치면 위 줄로 올린다.
  const items = q.items.map(r => ({ r, x: X(log10Of(r)) })).sort((a, b) => a.x - b.x);
  const last = Array(narrow ? 4 : 3).fill(-1e9);
  for (const it of items) {
    let row = last.findIndex(l => it.x - l >= s + 6);
    if (row < 0) row = last.indexOf(Math.min(...last));
    it.row = row; last[row] = it.x;
  }
  const gap = s + 14 * sq, rows = 1 + Math.max(...items.map(it => it.row));
  for (const it of items) { it.bottom = RY - 12 - it.row * gap; it.top = it.bottom - s; }
  const iconTop = RY - 12 - (rows - 1) * gap - s;

  // 숫자를 단 눈금마다 옅은 세로선
  let step = q.ticks;
  while (step * dec < 46 * sq) step *= 2;
  const grid = E('g', { stroke: '#d9e2ec', 'stroke-width': 1 });
  for (let k = Math.ceil(q.min / step) * step; k <= q.max; k += step) E('line', { x1: X(k), y1: iconTop - 8, x2: X(k), y2: RY }, grid);

  // 나무 자. 10배마다 짧은 눈금, step마다 긴 눈금과 10^k
  E('rect', { x: L - 16, y: RY, width: R - L + 32, height: RH, rx: 6, fill: 'url(#ruler)', stroke: '#b9975b', 'stroke-width': 1.5 });
  for (let k = q.min; k <= q.max; k++) {
    const major = k % step === 0;
    E('line', { x1: X(k), y1: RY, x2: X(k), y2: RY + (major ? 9 : 5) * K, stroke: '#5c4524', 'stroke-width': major ? 1.6 : 1 });
    if (major) E('text', { x: X(k), y: RY + RH - 6, 'text-anchor': 'middle', 'font-size': 13 * sq, fill: '#3b2a12' }).innerHTML =
      `10<tspan dy="-0.55em" font-size="0.72em">${minus(k)}</tspan>`;
  }
  const unitLabel = `${NAME[key]} (${q.unit})`;
  if (narrow) E('text', { x: R + 16, y: h - 6, 'text-anchor': 'end', 'font-size': 13, fill: '#333333' }).textContent = unitLabel;
  else E('text', { x: R + 30, y: RY + RH / 2 + 5 * sq, 'font-size': 15 * sq, fill: '#1a1a1a' }).textContent = unitLabel;

  // 교재 표 1.1.2 접두어 자리(센티는 빼고 10³마다). 좁으면 건너뛴다.
  let every = 3;
  while (every * dec < 26 * sq) every *= 2;
  const pre = [];
  for (const [e, sym] of PREFIXES) {
    const k = e - q.shift;
    if (sym === 'c' || e % every !== 0 || k < q.min || k > q.max) continue;
    E('line', { x1: X(k), y1: RY + RH, x2: X(k), y2: RY + RH + 4, stroke: '#7b8794' });
    const t = E('text', { x: X(k), y: RY + RH + 17 * sq, 'text-anchor': 'middle', 'font-size': 12 * sq, fill: '#5b6b7b' });
    t.textContent = sym + q.base;
    pre.push({ k, t });
  }

  // 그림, 그림에서 자로 내려가는 선과 점. 그림을 누르면 그 물체의 10^n으로 간다.
  const leaders = E('g', { stroke: '#8b97a4', 'stroke-width': 1.2 });
  for (const it of items) {
    E('line', { x1: it.x, y1: it.bottom, x2: it.x, y2: RY }, leaders);
    E('circle', { cx: it.x, cy: RY, r: 3, fill: '#4a5562' });
  }
  for (const it of items) {
    it.g = E('g', { transform: `translate(${(it.x - s / 2).toFixed(1)},${it.top.toFixed(1)}) scale(${(s / 100).toFixed(3)})`, style: 'cursor: pointer' });
    it.g.innerHTML = iconOf(it.r[0]);
    KIT.el('title', {}, it.g).textContent = it.r[0];
    it.g.addEventListener('pointerdown', ev => { ev.preventDefault(); setN(Math.round(log10Of(it.r))); });
  }
  const hi = E('rect', { width: s + 8, height: s + 8, rx: 16 * s / 100 + 4, fill: 'none', stroke: COLOR.c, 'stroke-width': 3 });
  const focus = E('g');

  // 빨간 바늘. 바늘이나 자를 끌면 크기가 바뀐다(10배 단위).
  const needle = E('line', { y1: iconTop - 8, y2: RY + RH, stroke: COLOR.c, 'stroke-width': 2, 'stroke-dasharray': '6 4' });
  const hit = E('rect', { x: L - 16, y: RY - 16, width: R - L + 32, height: RH + 16, fill: 'transparent', style: 'cursor: ew-resize' });
  const knob = E('circle', { cy: RY, r: 10 * sq, fill: COLOR.c, stroke: '#ffffff', 'stroke-width': 3, style: 'cursor: ew-resize' });
  const toN = ev => setN(Math.round(q.min + (KIT.toSvg(ev).x - L) / dec));
  let drag = null;
  for (const node of [hit, knob]) {
    node.addEventListener('pointerdown', ev => { ev.preventDefault(); drag = node; node.setPointerCapture(ev.pointerId); toN(ev); });
    node.addEventListener('pointermove', ev => { if (drag === node) toN(ev); });
    for (const e of ['pointerup', 'pointercancel']) node.addEventListener(e, () => { drag = null; });
  }
  S = { E, w, h, K, sq, narrow, L, R, RY, X, s, items, iconTop, hi, focus, needle, knob, pre };
  update();
}

function setN(v) {
  const val = Math.max(q.min, Math.min(q.max, v));
  if (val !== n()) { $('n').value = val; update(); }
}

function update() {
  if (!S) return;
  const N = n(), p = prefixed(q, N), r = nearest(q, N);
  $('nval').innerHTML = tex(`10^{${N}}\\ ${unitTex(q.unit)}`);
  $('val').innerHTML = tex(`10^{${N}}\\ ${unitTex(q.unit)}` + (p ? ` = ${p.coef}\\ ${unitTex(p.symbol)}` : '')) + (p ? ` <span class="lbl">${p.reading}</span>` : '');
  const light = $('light');
  light.style.display = key === 'mass' ? 'none' : '';
  if (key === 'length') light.innerHTML = '<span class="lbl">빛이 가는 시간</span>' + tex(`\\textcolor{#840025}{10^{${N}}\\ \\mathrm{m}\\,/\\,c = ${sciTex(sci(10 ** N / C_LIGHT))}\\ \\mathrm{s}}`);
  if (key === 'time') light.innerHTML = '<span class="lbl">빛이 가는 거리</span>' + tex(`\\textcolor{#840025}{c \\times 10^{${N}}\\ \\mathrm{s} = ${sciTex(sci(C_LIGHT * 10 ** N))}\\ \\mathrm{m}}`);

  const X = S.X(N).toFixed(1);
  S.needle.setAttribute('x1', X); S.needle.setAttribute('x2', X); S.knob.setAttribute('cx', X);
  for (const { k, t } of S.pre) { const on = k === N; t.setAttribute('fill', on ? COLOR.c : '#5b6b7b'); t.setAttribute('font-weight', on ? 700 : 400); }
  const it = S.items.find(i => i.r === r);
  S.hi.setAttribute('x', (it.x - S.s / 2 - 4).toFixed(1)); S.hi.setAttribute('y', (it.top - 4).toFixed(1));

  // 가장 가까운 물체를 크게. 넓은 화면은 그림 옆에, 좁은 화면은 그림 아래에 이름·값·출처를 쓴다.
  const { E, sq } = S, f = S.focus;
  f.replaceChildren();
  const ro = $('val').parentElement, roR = ro.offsetLeft + ro.offsetWidth, roB = ro.offsetTop + ro.offsetHeight;
  const top = S.narrow ? roB + 10 : 14, textH = S.narrow ? 66 * sq : 0;
  const B = Math.max(56, Math.min(260, S.h * 0.36, S.iconTop - 26 - top - textH));
  let cx = Math.max(S.L + B / 2, Math.min(S.R - B / 2, it.x));
  if (!S.narrow) cx = Math.max(cx, roR + 18 + B / 2);
  E('line', { x1: cx, y1: top + B + textH, x2: it.x, y2: it.top - 6, stroke: '#8b97a4', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }, f);
  const big = E('g', { transform: `translate(${(cx - B / 2).toFixed(1)},${top}) scale(${(B / 100).toFixed(3)})` }, f);
  big.innerHTML = iconOf(r[0]);
  const lines = [
    E('text', { 'font-size': 18 * sq, 'font-weight': 700, fill: '#1a1a1a' }, f),
    E('text', { 'font-size': 17 * sq, fill: COLOR.ink }, f),
    E('text', { 'font-size': 13 * sq, fill: '#555555' }, f),
  ];
  lines[0].textContent = r[0];
  lines[1].innerHTML = pow(r[1], r[2], q.unit);
  lines[2].textContent = sourceOf(q, r);
  const tw = Math.max(...lines.map(l => l.getComputedTextLength()));
  if (S.narrow) {
    lines.forEach((l, i) => { l.setAttribute('x', cx.toFixed(1)); l.setAttribute('y', (top + B + (20 + i * 21) * sq).toFixed(1)); l.setAttribute('text-anchor', 'middle'); });
  } else {
    const right = cx + B / 2 + 16 + tw <= S.w - 12, x0 = right ? cx + B / 2 + 16 : cx - B / 2 - 16;
    lines.forEach((l, i) => { l.setAttribute('x', x0.toFixed(1)); l.setAttribute('y', (top + B / 2 + (i - 1) * 26 * sq + 6).toFixed(1)); l.setAttribute('text-anchor', right ? 'start' : 'end'); });
  }
}

for (const b of document.querySelectorAll('.seg button')) b.addEventListener('click', () => {
  key = b.dataset.q; q = QUANTITIES[key];
  for (const c of document.querySelectorAll('.seg button')) c.setAttribute('aria-pressed', String(c === b));
  setRange(); build();
});
$('n').addEventListener('input', update);
