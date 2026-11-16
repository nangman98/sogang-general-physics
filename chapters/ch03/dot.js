// 3장 "내적" 시뮬레이션. b는 x축 방향, a는 b에서 ϕ만큼 돌린 방향이다. 크기 a, b와 사이각 ϕ는 모두 slider로 정한다.
// 파란 막대는 b 방향으로의 a의 성분 a cos ϕ이고, 내적은 그 값에 b를 곱한 것이다(교재 3.3.2).
import { dot, rad } from './vec.js';
import { COLOR, tex, fmt, svgKit } from './sim-common.js';

const S = 30, O = [270, 270];   // 1 단위 30 px, 크기는 1–8
const svg = document.getElementById('view');
const { el, arrow, label, set } = svgKit(svg);
el('line', { x1: 20, y1: O[1], x2: 620, y2: O[1], stroke: COLOR.grid, 'stroke-width': 1.5 });
const perp = el('line', { stroke: COLOR.gray, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
const proj = el('line', { stroke: COLOR.a, 'stroke-width': 6, 'stroke-opacity': 0.55 });   // b 방향으로의 a의 성분 a cos ϕ (교재 3.3.2)
const lproj = el('text', { fill: COLOR.a, 'font-size': 17, 'font-style': 'italic', 'font-family': 'Times New Roman, serif', 'text-anchor': 'middle' });
lproj.textContent = 'a cos ϕ';
const B = arrow('b'), A = arrow('a');
const arc = el('path', { fill: 'none', stroke: COLOR.ink, 'stroke-width': 1.5 });
const la = label('a', 'a'), lb = label('b', 'b');
const lphi = el('text', { 'font-size': 18, 'font-style': 'italic', 'font-family': 'Times New Roman, serif' });
lphi.textContent = 'ϕ';

function draw() {
  const phi = Number(document.getElementById('phi').value), p = rad(phi);
  const LA = Number(document.getElementById('a').value), LB = Number(document.getElementById('b').value);
  const a = [LA * Math.cos(p), LA * Math.sin(p), 0], b = [LB, 0, 0];
  set(B, { x1: O[0], y1: O[1], x2: O[0] + LB * S, y2: O[1] }); set(lb, { x: O[0] + LB * S + 16, y: O[1] + 6 });
  document.getElementById('aval').innerHTML = tex(`${fmt(LA)}`); document.getElementById('bval').innerHTML = tex(`${fmt(LB)}`);
  const tip = [O[0] + a[0] * S, O[1] - a[1] * S];
  set(A, { x1: O[0], y1: O[1], x2: tip[0], y2: tip[1] });
  set(la, { x: tip[0] + (a[0] >= 0 ? -16 : 16), y: tip[1] - 6 });
  set(perp, { x1: tip[0], y1: tip[1], x2: tip[0], y2: O[1] });
  set(proj, { x1: O[0], y1: O[1] + 14, x2: tip[0], y2: O[1] + 14 });
  set(lproj, { x: (O[0] + tip[0]) / 2, y: O[1] + 40 });
  lproj.style.display = Math.abs(tip[0] - O[0]) < 2 ? 'none' : '';
  const r = 40, e = [O[0] + r * Math.cos(p), O[1] - r * Math.sin(p)];
  arc.setAttribute('d', `M${O[0] + r},${O[1]} A${r},${r} 0 0 0 ${e[0].toFixed(1)},${e[1].toFixed(1)}`);
  set(lphi, { x: O[0] + 56 * Math.cos(p / 2), y: O[1] - 56 * Math.sin(p / 2) + 6 });
  document.getElementById('phival').innerHTML = tex(`${phi}^\\circ`);
  const d = dot(a, b);
  document.getElementById('read').innerHTML = [
    tex(`a\\cos\\phi = (${fmt(LA)})\\cos ${phi}^\\circ = ${fmt(LA * Math.cos(p), 2)}`),
    tex(`\\textcolor{#840025}{\\vec a\\cdot\\vec b = ab\\cos\\phi = (a\\cos\\phi)(b) = (${fmt(LA)})(${fmt(LB)})\\cos ${phi}^\\circ = ${fmt(d, 2)}}`),
  ].join('<br>');
}
for (const id of ['phi', 'a', 'b']) document.getElementById(id).addEventListener('input', draw);
draw();
