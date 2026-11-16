// 1장 시뮬레이션 "길이·시간·질량의 크기". slider 한 칸이 10배이고 처음 값은 SI 단위 하나(1 m, 1 s, 1 kg)다.
// 축 위에는 물체 사진을 놓고 지금 값에 가장 가까운 물체를 크게 띄운다(사용자 선택 2026-11-16 "축 위의 점을 그림으로").
// 사진과 출처는 img/credits.json(fetch_images.py가 만든다)을 읽는다.
import katex from '../../vendor/katex/katex.mjs';
import { QUANTITIES, prefixed, nearest, log10Of, sourceOf } from './sizes.js';

const $ = id => document.getElementById(id);
const tex = s => katex.renderToString(s, { throwOnError: true });
const sup = k => `10<sup>${k < 0 ? '−' + -k : k}</sup>`;
const PIC = 30;
const credits = await (await fetch('img/credits.json')).json();
let q = QUANTITIES.length;

// slider 손잡이 지름이 18 px이라 눈금과 그림을 손잡이 중심 자리에 맞춘다.
const at = x => `calc(9px + (100% - 18px) * ${(x - q.min) / (q.max - q.min)})`;

function placePictures() {
  // 가까이 붙는 그림은 두 줄로 엇갈려 놓는다.
  const w = Math.max($('marks').clientWidth, 600);
  const items = q.items.map((r, i) => ({ r, i, x: 9 + (w - 18) * (log10Of(r) - q.min) / (q.max - q.min) })).sort((a, b) => a.x - b.x);
  const last = [-1e9, -1e9];
  for (const it of items) {
    it.row = it.x - last[0] >= PIC + 4 ? 0 : 1;
    last[it.row] = it.x;
  }
  $('marks').innerHTML = items.map(({ r, i, row }) =>
    `<img class="pic" data-i="${i}" src="img/${credits[r[0]].file}" alt="${r[0]}" title="${r[0]}" style="left:${at(log10Of(r))};bottom:${row * (PIC + 6) + 6}px">`).join('');
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

// 그림 출처: 같은 사진을 쓰는 물체는 한 줄로 묶는다.
const byFile = {};
for (const [name, c] of Object.entries(credits)) (byFile[c.file] ??= { ...c, names: [] }).names.push(name);
for (const c of Object.values(byFile)) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = c.url; a.textContent = c.commons.replace(/^File:/, '');
  li.append(`${c.names.join(', ')}  `, a, `  ${c.artist || '작가 표기 없음'} · ${c.license}`);
  $('credits').append(li);
}

for (const b of document.querySelectorAll('[role=tab]')) b.addEventListener('click', () => setQuantity(b.dataset.q));
$('n').addEventListener('input', show);
addEventListener('resize', () => { placePictures(); show(); });
setQuantity('length');
