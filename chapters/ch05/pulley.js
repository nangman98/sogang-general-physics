// 5장 "도르래로 연결된 두 블록" 시뮬레이션(교재 예제 5.3.1). 마찰 없는 탁자 위 블록(질량 M)이 도르래를 지나는 줄로
// 매달린 블록(질량 m)과 이어져 있다. a = m g/(M + m) (5.3.7), T = M a (5.3.4).
// 1 m = 80 px, 힘 화살표 1 N = 3 px, 가속도 화살표 1 m/s² = 12 px. 재생하면 두 블록이 1.5 m 움직이고 멈춘다. 시간은 실제 빠르기(1배).
import { pulley } from './newton.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';

const PX = 80, K = 3, KA = 12, DMAX = 1.5;
const X0 = 70, TOP = 130, EDGE = 600, R = 22, PC = { x: EDGE + R, y: TOP - R }, CORD = TOP - 2 * R, XH = EDGE + 2 * R, H0 = TOP + 10, HH = 46;
const $ = id => document.getElementById(id);
const svg = $('view');
const { el, arrow, label, set } = svgKit(svg);
const gray = { stroke: COLOR.gray, 'stroke-width': 2, fill: 'none' };
el('line', { x1: 30, y1: TOP, x2: EDGE, y2: TOP, stroke: COLOR.ink, 'stroke-width': 2 });
el('text', { x: 40, y: TOP + 24, 'font-size': 13, fill: '#555555' }).textContent = '마찰 없는 탁자';
el('line', { x1: EDGE, y1: TOP, x2: PC.x, y2: PC.y, ...gray });
const cordS = el('line', { y1: CORD, x2: PC.x, y2: CORD, ...gray });
el('path', { d: `M${PC.x},${CORD} A${R},${R} 0 0 1 ${XH},${PC.y}`, ...gray });
const cordH = el('line', { x1: XH, y1: PC.y, x2: XH, ...gray });
el('circle', { cx: PC.x, cy: PC.y, r: R, fill: '#ffffff', stroke: COLOR.ink, 'stroke-width': 2 });
el('circle', { cx: PC.x, cy: PC.y, r: 3, fill: COLOR.ink });
const bS = el('rect', { y: TOP - 64, height: 64, fill: '#d0d0d0', stroke: COLOR.ink, 'stroke-width': 1.5 });
const bH = el('rect', { height: HH, fill: '#d0d0d0', stroke: COLOR.ink, 'stroke-width': 1.5 });
const it = { 'text-anchor': 'middle', 'font-size': 20, 'font-style': 'italic', 'font-family': 'Times New Roman, serif' };
const tS = el('text', it), tH = el('text', it);
tS.textContent = 'M'; tH.textContent = 'm';
const fTS = arrow('b'), fTH = arrow('b'), fG = arrow('b'), aS = arrow('acc', 2.5), aH = arrow('acc', 2.5);
const lTS = label('b', 'T'), lTH = label('b', 'T'), lG = label('b', 'mg'), laS = label('acc', 'a'), laH = label('acc', 'a');

let t = 0, running = false, last = 0;
const num = id => Number($(id).value);

function draw() {
  const M = num('M'), m = num('m'), { a, T } = pulley(M, m), d = Math.min(0.5 * a * t * t, DMAX);
  const wS = 50 + 14 * M, wH = 34 + 8 * m, xs = X0 + PX * d, yh = H0 + PX * d;
  set(bS, { x: xs, width: wS }); set(tS, { x: xs + wS / 2, y: TOP - 26 });
  set(bH, { x: XH - wH / 2, y: yh, width: wH }); set(tH, { x: XH, y: yh + HH / 2 + 7 });
  set(cordS, { x1: xs + wS }); set(cordH, { y2: yh });
  set(fTS, { x1: xs + wS, y1: CORD, x2: xs + wS + K * T, y2: CORD }); set(lTS, { x: xs + wS + K * T - 4, y: CORD - 12 });
  set(fTH, { x1: XH, y1: yh, x2: XH, y2: yh - K * T }); set(lTH, { x: XH - 16, y: yh - K * T / 2 + 6 });
  set(fG, { x1: XH, y1: yh + HH, x2: XH, y2: yh + HH + K * m * 9.8 }); set(lG, { x: XH + 26, y: yh + HH + K * m * 9.8 - 4 });
  set(aS, { x1: xs + wS / 2 - KA * a / 2, y1: TOP - 84, x2: xs + wS / 2 + KA * a / 2, y2: TOP - 84 }); set(laS, { x: xs + wS / 2 - KA * a / 2 - 14, y: TOP - 78 });
  set(aH, { x1: XH + wH / 2 + 28, y1: yh, x2: XH + wH / 2 + 28, y2: yh + KA * a }); set(laH, { x: XH + wH / 2 + 44, y: yh + KA * a / 2 + 6 });
  for (const id of ['M', 'm']) $(id + 'val').innerHTML = tex(`${fmt(num(id))}\\ \\mathrm{kg}`);
  $('read').innerHTML = tex(`\\textcolor{#840025}{a = ${fmt(a, 2)}\\ \\mathrm{m/s^2}}\\qquad T = Ma = ${fmt(T, 1)}\\ \\mathrm{N}`);
  return d;
}
function frame(now) {
  if (!running) return;
  t += (now - last) / 1000; last = now;
  if (draw() >= DMAX) { running = false; $('play').textContent = '재생'; return; }
  requestAnimationFrame(frame);
}
$('play').addEventListener('click', () => {
  if (!running && 0.5 * pulley(num('M'), num('m')).a * t * t >= DMAX) t = 0;
  running = !running; $('play').textContent = running ? '정지' : '재생';
  if (running) { last = performance.now(); requestAnimationFrame(frame); }
});
$('reset').addEventListener('click', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
for (const id of ['M', 'm']) $(id).addEventListener('input', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
draw();
