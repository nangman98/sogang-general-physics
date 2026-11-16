// 1장 시뮬레이션 "길이·시간·질량의 크기". slider 한 칸이 10배이고 처음 값은 SI 단위 하나(1 m, 1 s, 1 kg)다.
// 축 위에는 물체 사진을 놓고 지금 값에 가장 가까운 물체를 크게 띄운다(사용자 선택 2026-11-16 "축 위의 점을 그림으로").
// 사진 파일 이름은 img/credits.json(fetch_images.py가 만든다)에서 읽는다. 사진은 모두 퍼블릭 도메인·CC0다.
import katex from '../../vendor/katex/katex.mjs';
import { QUANTITIES, prefixed, nearest, log10Of, sourceOf } from './sizes.js';

const $ = id => document.getElementById(id);
const tex = s => katex.renderToString(s, { throwOnError: true });
const sup = k => `10<sup>${k < 0 ? '−' + -k : k}</sup>`;
const credits = await (await fetch('img/credits.json')).json();
let q = QUANTITIES.length;

// slider 손잡이 지름이 18 px이라 눈금과 그림을 손잡이 중심 자리에 맞춘다.
const at = x => `calc(9px + (100% - 18px) * ${(x - q.min) / (q.max - q.min)})`;

function placePictures() {
  // 그림 크기는 축 폭에 맞추고(26–52 px), 가까이 붙는 그림은 최대 세 줄로 엇갈려 놓는다.
  const w = $('marks').clientWidth;
  const size = Math.round(Math.max(26, Math.min(52, w / 17))), big = Math.min(135, Math.round(size * 2.6));
  const items = q.items.map((r, i) => ({ r, i, x: 9 + (w - 18) * (log10Of(r) - q.min) / (q.max - q.min) })).sort((a, b) => a.x - b.x);
  const last = [-1e9, -1e9, -1e9];
  for (const it of items) {
    let row = last.findIndex(l => it.x - l >= size + 4);
    if (row < 0) row = last.indexOf(Math.min(...last));
    it.row = row; last[row] = it.x;
  }
  const rows = 1 + Math.max(...items.map(it => it.row));
  const m = $('marks');
  m.style.height = `${Math.max(rows * (size + 6) + 6, big + 12)}px`;
  m.style.setProperty('--pic', `${size}px`); m.style.setProperty('--big', `${big}px`);
  m.innerHTML = items.map(({ r, i, row }) =>
    `<img class="pic" data-i="${i}" src="img/${credits[r[0]].file}" alt="${r[0]}" title="${r[0]}" style="left:${at(log10Of(r))};bottom:${row * (size + 6) + 6}px">`).join('');
}

function setQuantity(key) {
  q = QUANTITIES[key];
  for (const b of document.querySelectorAll('[role=tab]')) b.setAttribute('aria-selected', String(b.dataset.q === key));
  const n = $('n');
  n.min = q.min; n.max = q.max; n.value = 0;
  placePictures();
  const ticks = [];
  for (let k = Math.ceil(q.min / q.ticks) * q.ticks; k <= q.max; k += q.ticks) ticks.push(`<span style="left:${at(k)}">${sup(k)}</span>`);
  $('ticks').innerHTML = ticks.join('');
  show();
}

function show() {
  const n = Number($('n').value);
  const p = prefixed(q, n);
  const unitTex = sym => `\\mathrm{${sym.replace('μ', '\\text{μ}')}}`;
  $('value').innerHTML = tex(`10^{${n}}\\ ${unitTex(q.unit)}` + (p ? ` = ${p.coef}\\ ${unitTex(p.symbol)}` : '')) + (p ? ` <small>(${p.reading})</small>` : '');
  const r = nearest(q, n);
  const val = r[2] === 0 ? `${r[1]}` : `${r[1]}\\times10^{${r[2]}}`;
  $('near').innerHTML = `${r[0]} ${tex(`${val}\\ \\mathrm{${q.unit}}`)} <span class="src">(${sourceOf(q, r)})</span>`;
  const i = q.items.indexOf(r);
  for (const d of document.querySelectorAll('.pic')) d.classList.toggle('on', Number(d.dataset.i) === i);
}

for (const b of document.querySelectorAll('[role=tab]')) b.addEventListener('click', () => setQuantity(b.dataset.q));
$('n').addEventListener('input', show);
addEventListener('resize', () => { placePictures(); show(); });
setQuantity('length');
