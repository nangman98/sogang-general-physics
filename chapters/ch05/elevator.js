// 5장 "여러 가지 힘" 시뮬레이션. 엘리베이터 바닥의 저울 위 물체(질량 m). 엘리베이터 가속도 a_y(위가 +)를 바꾼다.
// 저울 눈금은 수직항력 F_N = m(g + a_y) (교재 5.2.6)이고 이것이 겉보기 무게다. 힘은 엘리베이터 오른쪽의 자유물체도(점 하나)에
// 1 N = 0.12 px로 그리고, 엘리베이터 가속도 화살표는 왼쪽에 1 m/s² = 8 px로 그린다.
import { gravity, normalForce } from './newton.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';

const K = 0.12, C = [300, 260];
const $ = id => document.getElementById(id);
const svg = $('view');
const { el, arrow, label, set } = svgKit(svg);
el('rect', { x: 120, y: 40, width: 260, height: 400, fill: 'none', stroke: COLOR.ink, 'stroke-width': 2.5 });
el('rect', { x: 190, y: 410, width: 120, height: 14, fill: '#8a8a8a', stroke: COLOR.ink, 'stroke-width': 1.5 });
el('text', { x: 250, y: 458, 'text-anchor': 'middle', 'font-size': 13, fill: '#555555' }).textContent = '저울';
el('rect', { x: 220, y: 350, width: 60, height: 60, fill: '#d0d0d0', stroke: COLOR.ink, 'stroke-width': 1.5 });
el('text', { x: 500, y: 470, 'text-anchor': 'middle', 'font-size': 13, fill: '#555555' }).textContent = '물체의 자유물체도';
const dot = el('circle', { cx: 500, cy: 240, r: 6, fill: COLOR.ink });
const nA = arrow('b'), gA = arrow('b'), aA = arrow('acc');
const lN = label('b', ''), lG = label('b', ''), lA = label('acc', '');
lN.innerHTML = 'F<tspan dy="5" font-size="12">N</tspan>'; lG.innerHTML = 'F<tspan dy="5" font-size="12">g</tspan>'; lA.innerHTML = 'a<tspan dy="5" font-size="12">y</tspan>';

const ay = () => Number($('ay').value), m = () => Number($('m').value);
function draw() {
  const N = normalForce(m(), ay()), Fg = gravity(m()), X = 500, Y = 240;
  set(nA, { x1: X, y1: Y, x2: X, y2: Y - K * N }); nA.style.display = N > 0.5 ? '' : 'none';
  set(gA, { x1: X, y1: Y, x2: X, y2: Y + K * Fg });
  set(lN, { x: X + 22, y: Y - K * N + 10 }); lN.style.display = N > 0.5 ? '' : 'none';
  set(lG, { x: X + 22, y: Y + K * Fg });
  set(aA, { x1: 80, y1: 240, x2: 80, y2: 240 - 8 * ay() }); aA.style.display = Math.abs(ay()) > 0.05 ? '' : 'none';
  set(lA, { x: 60, y: 240 - 8 * ay() + 6 }); lA.style.display = Math.abs(ay()) > 0.05 ? '' : 'none';
  $('ayval').innerHTML = tex(`${fmt(ay())}\\ \\mathrm{m/s^2}`); $('mval').innerHTML = tex(`${fmt(m(), 0)}\\ \\mathrm{kg}`);
  $('read').innerHTML = tex(`\\textcolor{#840025}{F_N = m(g + a_y) = (${fmt(m(), 0)})(9.8 + (${fmt(ay())})) = ${fmt(N, 0)}\\ \\mathrm{N}}\\qquad F_g = mg = ${fmt(Fg, 0)}\\ \\mathrm{N}`);
}
for (const id of ['ay', 'm']) $(id).addEventListener('input', draw);
draw();
