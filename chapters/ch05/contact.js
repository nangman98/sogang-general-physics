// 5장 "뉴턴의 제3법칙" 시뮬레이션. 마찰 없는 바닥에서 맞닿은 두 상자 A, B를 왼쪽에서 힘 F로 민다.
// 짝힘 F_AB(A에 B가 주는 힘)와 F_BA(B에 A가 주는 힘)는 크기가 같고 방향이 반대다(교재 5.3.1).
// 1 m = 20 px, 힘 화살표 1 N = 4 px. 재생하면 두 상자가 함께 가속한다. 시간은 실제 빠르기(1배).
import { contact } from './newton.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';

const S = 20, X0 = 60, FLOOR = 230, L = 38, K = 4;
const $ = id => document.getElementById(id);
const svg = $('view');
const { el, arrow, label, set } = svgKit(svg);
el('line', { x1: X0 - 20, y1: FLOOR, x2: X0 + S * L + 20, y2: FLOOR, stroke: COLOR.ink, 'stroke-width': 2 });
el('text', { x: X0 + S * L, y: FLOOR + 24, 'text-anchor': 'end', 'font-size': 13, fill: '#555555' }).textContent = '마찰 없는 바닥';
const bA = el('rect', { y: FLOOR - 70, height: 70, fill: '#d0d0d0', stroke: COLOR.ink, 'stroke-width': 1.5 });
const bB = el('rect', { y: FLOOR - 56, height: 56, fill: '#d0d0d0', stroke: COLOR.ink, 'stroke-width': 1.5 });
const tA = el('text', { 'text-anchor': 'middle', 'font-size': 18 }), tB = el('text', { 'text-anchor': 'middle', 'font-size': 18 });
tA.textContent = 'A'; tB.textContent = 'B';
const fF = arrow('b'), fAB = arrow('c'), fBA = arrow('c');
const lF = label('b', 'F'), lAB = label('c', ''), lBA = label('c', '');
lAB.innerHTML = 'F<tspan dy="5" font-size="12">AB</tspan>'; lBA.innerHTML = 'F<tspan dy="5" font-size="12">BA</tspan>';

let t = 0, running = false, last = 0;
const num = id => Number($(id).value);
const width = m => 40 + 6 * m;   // 질량이 크면 상자를 넓게 그린다

function draw() {
  const { a, FBA } = contact(num('F'), num('mA'), num('mB')), x = 2 + 0.5 * a * t * t;
  const wA = width(num('mA')), wB = width(num('mB')), xa = X0 + S * x, xb = xa + wA;
  set(bA, { x: xa, width: wA }); set(bB, { x: xb, width: wB });
  set(tA, { x: xa + wA / 2, y: FLOOR - 28 }); set(tB, { x: xb + wB / 2, y: FLOOR - 22 });
  set(fF, { x1: xa - 6 - K * num('F'), y1: FLOOR - 35, x2: xa - 4, y2: FLOOR - 35 }); fF.style.display = num('F') ? '' : 'none';
  set(lF, { x: xa - 18 - K * num('F'), y: FLOOR - 40 }); lF.style.display = num('F') ? '' : 'none';
  set(fAB, { x1: xb, y1: FLOOR - 90, x2: xb - K * FBA, y2: FLOOR - 90 }); set(fBA, { x1: xb, y1: FLOOR - 110, x2: xb + K * FBA, y2: FLOOR - 110 });
  for (const e of [fAB, fBA, lAB, lBA]) e.style.display = FBA > 0.05 ? '' : 'none';
  set(lAB, { x: xb - K * FBA - 22, y: FLOOR - 84 }); set(lBA, { x: xb + K * FBA + 22, y: FLOOR - 104 });
  for (const id of ['F']) $(id + 'val').innerHTML = tex(`${fmt(num(id))}\\ \\mathrm{N}`);
  for (const id of ['mA', 'mB']) $(id + 'val').innerHTML = tex(`${fmt(num(id))}\\ \\mathrm{kg}`);
  $('read').innerHTML = tex(`a = \\frac{F}{m_A + m_B} = ${fmt(a, 2)}\\ \\mathrm{m/s^2}\\qquad \\textcolor{#840025}{F_{BA} = m_B a = ${fmt(FBA, 2)}\\ \\mathrm{N} \\qquad F_{AB} = -${fmt(FBA, 2)}\\ \\mathrm{N}}`);
  return x;
}
function frame(now) {
  if (!running) return;
  t += (now - last) / 1000; last = now;
  if (draw() > L - 12) { running = false; $('play').textContent = '재생'; return; }
  requestAnimationFrame(frame);
}
$('play').addEventListener('click', () => {
  running = !running; $('play').textContent = running ? '정지' : '재생';
  if (running) { last = performance.now(); requestAnimationFrame(frame); }
});
$('reset').addEventListener('click', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
for (const id of ['F', 'mA', 'mB']) $(id).addEventListener('input', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
draw();
