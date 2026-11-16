// 4장 "등속 원운동" 시뮬레이션. 반지름 r의 원을 일정한 속력 v로 반시계 방향으로 돈다. 1 m = 40 px.
// 속도 화살표 1 m/s = 14 px, 가속도 화살표 1 m/s² = 4 px. 시간은 실제 빠르기(1배)로 흐른다.
import { centripetal, period } from './motion.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';

const S = 40, C = [260, 250], KV = 14, KA = 4;
const $ = id => document.getElementById(id);
const svg = $('view');
const { el, arrow, label, set } = svgKit(svg);
const circle = el('circle', { cx: C[0], cy: C[1], fill: 'none', stroke: COLOR.ink, 'stroke-width': 1.5 });
el('circle', { cx: C[0], cy: C[1], r: 3, fill: COLOR.ink });
const radius = el('line', { stroke: COLOR.gray, 'stroke-width': 1.2, 'stroke-dasharray': '4 4' });
const vA = arrow('vel'), aA = arrow('acc');
const lv = label('vel', 'v'), la = label('acc', 'a');
const ball = el('circle', { r: 9, fill: '#d0d0d0', stroke: COLOR.ink, 'stroke-width': 1.5 });

let t = 0, running = false, last = 0;
const v = () => Number($('v').value), r = () => Number($('r').value);

function draw() {
  const th = (v() / r()) * t, R = r() * S;
  const X = C[0] + R * Math.cos(th), Y = C[1] - R * Math.sin(th);
  set(circle, { r: R });
  set(radius, { x1: C[0], y1: C[1], x2: X, y2: Y });
  set(ball, { cx: X, cy: Y });
  const tx = -Math.sin(th), ty = -Math.cos(th), a = centripetal(v(), r());
  set(vA, { x1: X, y1: Y, x2: X + KV * v() * tx, y2: Y + KV * v() * ty });
  set(aA, { x1: X, y1: Y, x2: X - KA * a * Math.cos(th), y2: Y + KA * a * Math.sin(th) });
  set(lv, { x: X + KV * v() * tx + 12 * tx, y: Y + KV * v() * ty + 12 * ty + 6 });
  set(la, { x: X - (KA * a + 14) * Math.cos(th), y: Y + (KA * a + 14) * Math.sin(th) + 6 });
  $('vval').innerHTML = tex(`${fmt(v())}\\ \\mathrm{m/s}`);
  $('rval').innerHTML = tex(`${fmt(r())}\\ \\mathrm{m}`);
  $('read').innerHTML = [
    tex(`\\textcolor{#840025}{a = \\frac{v^2}{r} = \\frac{(${fmt(v())})^2}{${fmt(r())}} = ${fmt(a, 2)}\\ \\mathrm{m/s^2}}`),
    tex(`T = \\frac{2\\pi r}{v} = \\frac{2\\pi (${fmt(r())})}{${fmt(v())}} = ${fmt(period(v(), r()), 2)}\\ \\mathrm{s}\\qquad t = ${fmt(t, 2)}\\ \\mathrm{s}`),
  ].join('<br>');
}
function frame(now) {
  if (!running) return;
  t += (now - last) / 1000; last = now; draw(); requestAnimationFrame(frame);
}
$('play').addEventListener('click', () => {
  running = !running; $('play').textContent = running ? '정지' : '재생';
  if (running) { last = performance.now(); requestAnimationFrame(frame); }
});
$('reset').addEventListener('click', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
for (const id of ['v', 'r']) $(id).addEventListener('input', draw);
draw();
