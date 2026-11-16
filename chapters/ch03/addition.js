// 3장 "벡터의 합성" 시뮬레이션. 원점에서 그린 a, b의 끝(동그라미)을 끌어 바꾼다.
// 보기 단추로 합성 규칙을 본다. a + b와 b + a는 같은 r에 닿고(교환 법칙, 교재 3.1.2),
// a − b는 a에 −b를 더한 것이다(교재 3.1.4, 성분은 3.2.7).
import { add, mag, angleDeg } from './vec.js';
import { COLOR, tex, fmt, svgKit } from './sim-common.js';

const S = 34, C = 300, N = 8;                       // 1칸 34 px, 원점 (300, 300), 축 −8…8
const svg = document.getElementById('view');
const { el, arrow, label, set, toSvg } = svgKit(svg);
const px = ([x, y]) => [C + x * S, C - y * S];

for (let k = -N; k <= N; k++) {
  el('line', { x1: C + k * S, y1: C - N * S, x2: C + k * S, y2: C + N * S, stroke: k ? COLOR.grid : COLOR.gray, 'stroke-width': k ? 1 : 1.5 });
  el('line', { x1: C - N * S, y1: C - k * S, x2: C + N * S, y2: C - k * S, stroke: k ? COLOR.grid : COLOR.gray, 'stroke-width': k ? 1 : 1.5 });
}
el('text', { x: C + N * S - 4, y: C - 8, 'text-anchor': 'end', 'font-size': 16, 'font-style': 'italic', 'font-family': 'Times New Roman, serif' }).textContent = 'x';
el('text', { x: C + 10, y: C - N * S + 18, 'font-size': 16, 'font-style': 'italic', 'font-family': 'Times New Roman, serif' }).textContent = 'y';

// 원점에서 그린 a, b (얇은 선)와 합성 경로 두 화살표, 결과 화살표
const baseA = arrow('a', 1.5, '5 4'), baseB = arrow('b', 1.5, '5 4');
const first = arrow('a'), second = arrow('b'), R = arrow('c', 3.5);
const l1 = label('a', 'a'), l2 = label('b', 'b'), lr = label('c', 'r');
const ha = el('circle', { r: 10, fill: COLOR.a, 'fill-opacity': 0.25, stroke: COLOR.a, 'stroke-width': 2, style: 'cursor:grab' });
const hb = el('circle', { r: 10, fill: COLOR.b, 'fill-opacity': 0.25, stroke: COLOR.b, 'stroke-width': 2, style: 'cursor:grab' });

const START = { a: [3, 2], b: [1, 4] };
let a = [...START.a], b = [...START.b], mode = 'a+b';

function line(e, p, q, key) {
  const [x1, y1] = px(p), [x2, y2] = px(q);
  set(e, { x1, y1, x2, y2 });
  if (key) { e.setAttribute('stroke', COLOR[key]); e.setAttribute('marker-end', `url(#h-${key})`); }
}
function place(t, p, q, side, key, txt) {   // 화살표 가운데에서 옆으로 비켜 놓는다
  const [x1, y1] = px(p), [x2, y2] = px(q), L = Math.hypot(x2 - x1, y2 - y1) || 1;
  set(t, { x: (x1 + x2) / 2 - side * 18 * (y2 - y1) / L, y: (y1 + y2) / 2 + side * 18 * (x2 - x1) / L + 6 });
  if (key) t.setAttribute('fill', COLOR[key]);
  if (txt) t.textContent = txt;
}

function draw() {
  const O = [0, 0], nb = [-b[0], -b[1]];
  line(baseA, O, a); line(baseB, O, b);
  let r, rows;
  if (mode === 'a+b') {
    r = add(a, b);
    line(first, O, a, 'a'); line(second, a, r, 'b');
    place(l1, O, a, -1, 'a', 'a'); place(l2, a, r, -1, 'b', 'b'); place(lr, O, r, 1, 'c', 'r');
    rows = [`\\textcolor{#840025}{r_x = a_x + b_x = ${fmt(a[0])} + ${fmt(b[0])} = ${fmt(r[0])} \\qquad r_y = a_y + b_y = ${fmt(a[1])} + ${fmt(b[1])} = ${fmt(r[1])}}`];
  } else if (mode === 'b+a') {
    r = add(b, a);
    line(first, O, b, 'b'); line(second, b, r, 'a');
    place(l1, O, b, 1, 'b', 'b'); place(l2, b, r, 1, 'a', 'a'); place(lr, O, r, -1, 'c', 'r');
    rows = [`\\textcolor{#840025}{r_x = b_x + a_x = ${fmt(b[0])} + ${fmt(a[0])} = ${fmt(r[0])} \\qquad r_y = b_y + a_y = ${fmt(b[1])} + ${fmt(a[1])} = ${fmt(r[1])}}`,
      `\\vec b + \\vec a = \\vec a + \\vec b \\quad (3.1.2)`];
  } else {
    r = add(a, nb);
    line(first, O, a, 'a'); line(second, a, r, 'b');
    place(l1, O, a, -1, 'a', 'a'); place(l2, a, r, -1, 'b', '−b'); place(lr, O, r, 1, 'c', 'd');
    rows = [`\\textcolor{#840025}{d_x = a_x - b_x = ${fmt(a[0])} - (${fmt(b[0])}) = ${fmt(r[0])} \\qquad d_y = a_y - b_y = ${fmt(a[1])} - (${fmt(b[1])}) = ${fmt(r[1])}}`,
      `\\vec d = \\vec a - \\vec b = \\vec a + (-\\vec b) \\quad (3.1.4)`];
  }
  line(R, O, r);
  const [ax, ay] = px(a), [bx, by] = px(b);
  set(ha, { cx: ax, cy: ay }); set(hb, { cx: bx, cy: by });
  const name = mode === 'a-b' ? 'd' : 'r';
  document.getElementById('read').innerHTML = [
    tex(`\\vec a = (${fmt(a[0])},\\ ${fmt(a[1])}) \\qquad \\vec b = (${fmt(b[0])},\\ ${fmt(b[1])})`),
    ...rows.map(tex),
    tex(`${name} = ${fmt(mag(r), 2)} \\qquad \\theta = ${fmt(angleDeg(r), 1)}^\\circ`),
  ].join('<br>');
  for (const btn of document.querySelectorAll('[data-mode]')) btn.classList.toggle('main', btn.dataset.mode === mode);
}

let drag = null;
const snap = v => Math.max(-N, Math.min(N, Math.round(v * 2) / 2));
for (const [h, key] of [[ha, 'a'], [hb, 'b']]) h.addEventListener('pointerdown', ev => { drag = key; h.setPointerCapture(ev.pointerId); });
svg.addEventListener('pointermove', ev => {
  if (!drag) return;
  const p = toSvg(ev), v = [snap((p.x - C) / S), snap((C - p.y) / S)];
  if (drag === 'a') a = v; else b = v;
  draw();
});
svg.addEventListener('pointerup', () => { drag = null; });
for (const btn of document.querySelectorAll('[data-mode]')) btn.addEventListener('click', () => { mode = btn.dataset.mode; draw(); });
document.getElementById('reset').addEventListener('click', () => { a = [...START.a]; b = [...START.b]; mode = 'a+b'; draw(); });
draw();
