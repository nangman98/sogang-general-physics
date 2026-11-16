// 3장 "내적" 시뮬레이션. b는 x축 방향 길이 8, a는 길이 5로 고정하고 사이각 ϕ만 바꾼다.
import { dot, rad } from './vec.js';
import { COLOR, tex, fmt, svgKit } from './sim-common.js';

const S = 40, O = [250, 220], LA = 5, LB = 8;
const svg = document.getElementById('view');
const { el, arrow, label, set } = svgKit(svg);
el('line', { x1: 20, y1: O[1], x2: 620, y2: O[1], stroke: COLOR.grid, 'stroke-width': 1.5 });
const perp = el('line', { stroke: COLOR.gray, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
const proj = el('line', { stroke: COLOR.c, 'stroke-width': 6 });
const B = arrow('b'), A = arrow('a');
const arc = el('path', { fill: 'none', stroke: COLOR.ink, 'stroke-width': 1.5 });
const la = label('a', 'a'), lb = label('b', 'b');
const lphi = el('text', { 'font-size': 18, 'font-style': 'italic', 'font-family': 'Times New Roman, serif' });
lphi.textContent = 'ϕ';
set(B, { x1: O[0], y1: O[1], x2: O[0] + LB * S, y2: O[1] }); set(lb, { x: O[0] + LB * S + 16, y: O[1] + 6 });

function draw() {
  const phi = Number(document.getElementById('phi').value), p = rad(phi);
  const a = [LA * Math.cos(p), LA * Math.sin(p), 0], b = [LB, 0, 0];
  const tip = [O[0] + a[0] * S, O[1] - a[1] * S];
  set(A, { x1: O[0], y1: O[1], x2: tip[0], y2: tip[1] });
  set(la, { x: tip[0] + (a[0] >= 0 ? -16 : 16), y: tip[1] - 6 });
  set(perp, { x1: tip[0], y1: tip[1], x2: tip[0], y2: O[1] });
  set(proj, { x1: O[0], y1: O[1] + 14, x2: tip[0], y2: O[1] + 14 });
  const r = 40, e = [O[0] + r * Math.cos(p), O[1] - r * Math.sin(p)];
  arc.setAttribute('d', `M${O[0] + r},${O[1]} A${r},${r} 0 0 0 ${e[0].toFixed(1)},${e[1].toFixed(1)}`);
  set(lphi, { x: O[0] + 56 * Math.cos(p / 2), y: O[1] - 56 * Math.sin(p / 2) + 6 });
  document.getElementById('phival').innerHTML = tex(`${phi}^\\circ`);
  const d = dot(a, b);
  document.getElementById('read').innerHTML = [
    tex(`a\\cos\\phi = (5)\\cos ${phi}^\\circ = ${fmt(LA * Math.cos(p), 2)}`),
    tex(`\\textcolor{#840025}{\\vec a\\cdot\\vec b = ab\\cos\\phi = (5)(8)\\cos ${phi}^\\circ = ${fmt(d, 1)}}`),
  ].join('<br>');
}
document.getElementById('phi').addEventListener('input', draw);
draw();
