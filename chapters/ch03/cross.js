// 3장 "외적" 시뮬레이션. a는 x축 방향, b는 xy 평면에서 x축과 ϕ를 이룬다. 크기 a, b와 ϕ는 slider로 정한다. c = a × b 또는 b × a는 z축 방향이다.
// 3D는 회전한 점을 직접 화면에 투영해 SVG로 그린다. 화면을 끌면 돈다.
import { cross, mag, rad } from './vec.js';
import { COLOR, tex, fmt, svgKit } from './sim-common.js';

const U = 40, CX = 300, CY = 290;   // 1 단위 40 px, 크기는 0.5–2.5
const svg = document.getElementById('view');
const { el, arrow, label, set } = svgKit(svg);
let yaw = -35, pitch = 30, order = 'ab';

function project([x, y, z]) {
  const w = rad(yaw), p = rad(pitch);
  const x1 = x * Math.cos(w) - y * Math.sin(w), y1 = x * Math.sin(w) + y * Math.cos(w);
  return [CX + U * x1, CY - U * (z * Math.cos(p) + y1 * Math.sin(p))];
}
const axes = ['x', 'y', 'z'].map(n => ({ line: el('line', { stroke: COLOR.grid, 'stroke-width': 1.5 }), text: el('text', { 'font-size': 15, fill: COLOR.gray, 'font-style': 'italic', 'font-family': 'Times New Roman, serif', 'text-anchor': 'middle' }), n }));
axes.forEach(o => { o.text.textContent = o.n; });
const area = el('polygon', { fill: '#56B4E9', 'fill-opacity': 0.3, stroke: 'none' });   // a, b가 놓인 평면 표시

// 오른쪽 그래프: c = ab sin ϕ (ϕ 0–180°). 세로축은 a, b 최대(2.5)일 때의 6.25까지 고정해 크기에 비례하는 것이 보이게 한다.
const G = { L: 660, T: 70, R: 960, B: 330 }, C_MAX = 6.5;
const gx = d => G.L + (G.R - G.L) * d / 180, gy = c => G.B - (G.B - G.T) * c / C_MAX;
el('rect', { x: G.L, y: G.T, width: G.R - G.L, height: G.B - G.T, fill: 'none', stroke: COLOR.ink, 'stroke-width': 1.5 });
for (const d of [0, 45, 90, 135, 180]) {
  el('line', { x1: gx(d), y1: G.B, x2: gx(d), y2: G.B + 6, stroke: COLOR.ink });
  el('text', { x: gx(d), y: G.B + 24, 'text-anchor': 'middle', 'font-size': 14, fill: '#555555' }).textContent = `${d}°`;
}
for (const c of [0, 2, 4, 6]) {
  el('line', { x1: G.L - 6, y1: gy(c), x2: G.L, y2: gy(c), stroke: COLOR.ink });
  el('text', { x: G.L - 10, y: gy(c) + 5, 'text-anchor': 'end', 'font-size': 14, fill: '#555555' }).textContent = String(c);
}
el('text', { x: G.R, y: G.B + 48, 'text-anchor': 'end', 'font-size': 16, 'font-style': 'italic', 'font-family': 'Times New Roman, serif' }).textContent = 'ϕ';
el('text', { x: G.L, y: G.T - 14, 'font-size': 16, 'font-style': 'italic', 'font-family': 'Times New Roman, serif' }).textContent = 'c';
const curve = el('polyline', { fill: 'none', stroke: COLOR.c, 'stroke-width': 2.5 });
const cursor = el('line', { stroke: COLOR.gray, 'stroke-width': 1, 'stroke-dasharray': '4 4' });
const point = el('circle', { r: 6, fill: COLOR.c });
const A = arrow('a'), B = arrow('b'), Cc = arrow('c', 3.5);
const la = label('a', 'a'), lb = label('b', 'b'), lc = label('c', 'c');

function seg(e, p, q) { const [x1, y1] = project(p), [x2, y2] = project(q); set(e, { x1, y1, x2, y2 }); }
function tag(t, p, dx = 0, dy = 0) { const [x, y] = project(p); set(t, { x: x + dx, y: y + dy }); }

function draw() {
  const phi = Number(document.getElementById('phi').value), p = rad(phi);
  const LA = Number(document.getElementById('a').value), LB = Number(document.getElementById('b').value);
  const a = [LA, 0, 0], b = [LB * Math.cos(p), LB * Math.sin(p), 0];
  document.getElementById('aval').innerHTML = tex(`${fmt(LA)}`); document.getElementById('bval').innerHTML = tex(`${fmt(LB)}`);
  const c = order === 'ab' ? cross(a, b) : cross(b, a), O = [0, 0, 0];
  axes.forEach((o, i) => { const e = [0, 0, 0]; e[i] = 3; seg(o.line, [0, 0, 0].map((v, j) => (j === i ? -3 : 0)), e); tag(o.text, e.map(v => v * 1.08), 0, 5); });
  area.setAttribute('points', [O, a, [a[0] + b[0], b[1], 0], b].map(q => project(q).map(v => v.toFixed(1)).join(',')).join(' '));
  seg(A, O, a); seg(B, O, b); seg(Cc, O, c);
  tag(la, a, 14, 18); tag(lb, b, 14, 18); tag(lc, c, 18, c[2] >= 0 ? 4 : 20);
  Cc.style.display = mag(c) < 0.05 ? 'none' : '';
  curve.setAttribute('points', Array.from({ length: 181 }, (_, d) => `${gx(d).toFixed(1)},${gy(LA * LB * Math.sin(rad(d))).toFixed(1)}`).join(' '));
  set(cursor, { x1: gx(phi), y1: G.T, x2: gx(phi), y2: G.B });
  set(point, { cx: gx(phi), cy: gy(mag(c)) });
  document.getElementById('phival').innerHTML = tex(`${phi}^\\circ`);
  document.getElementById('order').textContent = order === 'ab' ? '순서 바꾸기 (b × a)' : '순서 바꾸기 (a × b)';
  const name = order === 'ab' ? '\\vec a\\times\\vec b' : '\\vec b\\times\\vec a';
  document.getElementById('read').innerHTML = [
    tex(`\\vec c = ${name}`),
    tex(`\\textcolor{#840025}{c = ab\\sin\\phi = (${fmt(LA)})(${fmt(LB)})\\sin ${phi}^\\circ = ${fmt(mag(c), 2)}}`),
    `방향 ${tex(c[2] > 0.005 ? '+z' : c[2] < -0.005 ? '-z' : '\\text{없음}')}`,
  ].join('<br>');
}

let dragging = null;
svg.addEventListener('pointerdown', ev => {   // 왼쪽 3D 그림에서만 돌린다
  const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
  if (p.matrixTransform(svg.getScreenCTM().inverse()).x > 620) return;
  dragging = [ev.clientX, ev.clientY]; svg.setPointerCapture(ev.pointerId);
});
svg.addEventListener('pointermove', ev => {
  if (!dragging) return;
  yaw += (ev.clientX - dragging[0]) * 0.5;
  pitch = Math.max(-10, Math.min(80, pitch + (ev.clientY - dragging[1]) * 0.3));
  dragging = [ev.clientX, ev.clientY];
  draw();
});
svg.addEventListener('pointerup', () => { dragging = null; });
for (const id of ['phi', 'a', 'b']) document.getElementById(id).addEventListener('input', draw);
document.getElementById('order').addEventListener('click', () => { order = order === 'ab' ? 'ba' : 'ab'; draw(); });
draw();
