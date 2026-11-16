// 1장 시뮬레이션 "길이·시간·질량의 크기". slider 한 칸이 10배이고 처음 값은 SI 단위 하나(1 m, 1 s, 1 kg)다.
import katex from '../../vendor/katex/katex.mjs';
import { QUANTITIES, prefixed, nearest, log10Of } from './sizes.js';

const $ = id => document.getElementById(id);
const tex = s => katex.renderToString(s, { throwOnError: true });
const sup = k => `10<sup>${k < 0 ? '−' + -k : k}</sup>`;
let q = QUANTITIES.length;

// slider 손잡이 지름이 18 px이라 눈금과 점을 손잡이 중심 자리에 맞춘다.
const at = x => `calc(9px + (100% - 18px) * ${(x - q.min) / (q.max - q.min)})`;

function setQuantity(key) {
  q = QUANTITIES[key];
  for (const b of document.querySelectorAll('[role=tab]')) b.setAttribute('aria-selected', String(b.dataset.q === key));
  const n = $('n');
  n.min = q.min; n.max = q.max; n.value = 0;
  $('marks').innerHTML = q.items.map((r, i) => `<span class="dot" data-i="${i}" style="left:${at(log10Of(r))}" title="${r[0]}"></span>`).join('');
  const ticks = [];
  for (let k = Math.ceil(q.min / q.ticks) * q.ticks; k <= q.max; k += q.ticks) ticks.push(`<span style="left:${at(k)}">${sup(k)}</span>`);
  $('ticks').innerHTML = ticks.join('');
  $('src').textContent = `물체와 값은 교재 표 ${q.table}의 대략값이다.`;
  show();
}

function show() {
  const n = Number($('n').value);
  const p = prefixed(q, n);
  const unitTex = sym => `\\mathrm{${sym.replace('μ', '\\text{μ}')}}`;
  $('value').innerHTML = tex(`10^{${n}}\\ ${unitTex(q.unit)}` + (p ? ` = ${p.coef}\\ ${unitTex(p.symbol)}` : '')) + (p ? ` <small>(${p.reading})</small>` : '');
  const r = nearest(q, n);
  $('near').innerHTML = `${r[0]} ${tex(`${r[1]}\\times10^{${r[2]}}\\ \\mathrm{${q.unit}}`)}`;
  const i = q.items.indexOf(r);
  for (const d of document.querySelectorAll('.dot')) d.classList.toggle('on', Number(d.dataset.i) === i);
}

for (const b of document.querySelectorAll('[role=tab]')) b.addEventListener('click', () => setQuantity(b.dataset.q));
$('n').addEventListener('input', show);
setQuantity('length');
