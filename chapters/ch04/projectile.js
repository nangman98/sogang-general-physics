// 4장 "포물선 운동" 시뮬레이션. 발사점 (0, 0)에서 처음 속력 v0, 발사각 θ0로 던진다. 같은 축척(1 m = 8 px).
// 시간은 실제 빠르기(1배)로 흐른다. 속도 화살표 1 m/s = 2.4 px.
import { projectile, flightTime, range } from './motion.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';

const S = 8, O = [60, 420], K = 2.4;
const $ = id => document.getElementById(id);
const svg = $('view');
const { el, arrow, set } = svgKit(svg);
const P = (x, y) => [O[0] + S * x, O[1] - S * y];

el('line', { x1: O[0] - 10, y1: O[1], x2: O[0] + S * 100 + 10, y2: O[1], stroke: COLOR.ink, 'stroke-width': 1.5 });
el('line', { x1: O[0], y1: O[1] + 10, x2: O[0], y2: O[1] - S * 50, stroke: COLOR.ink, 'stroke-width': 1.5 });
for (let x = 0; x <= 100; x += 10) {
  el('line', { x1: O[0] + S * x, y1: O[1], x2: O[0] + S * x, y2: O[1] + 6, stroke: COLOR.ink });
  el('text', { x: O[0] + S * x, y: O[1] + 22, 'text-anchor': 'middle', 'font-size': 13, fill: '#555555' }).textContent = String(x);
}
for (let y = 10; y <= 50; y += 10) {
  el('line', { x1: O[0] - 6, y1: O[1] - S * y, x2: O[0], y2: O[1] - S * y, stroke: COLOR.ink });
  el('text', { x: O[0] - 10, y: O[1] - S * y + 4, 'text-anchor': 'end', 'font-size': 13, fill: '#555555' }).textContent = String(y);
}
el('text', { x: O[0] + S * 100, y: O[1] + 42, 'text-anchor': 'end', 'font-size': 14 }).textContent = 'x (m)';
el('text', { x: O[0] - 8, y: O[1] - S * 50 - 12, 'font-size': 14 }).textContent = 'y (m)';
const rangeMark = el('line', { stroke: COLOR.gray, 'stroke-width': 1.2, 'stroke-dasharray': '4 4' });
const trail = el('polyline', { fill: 'none', stroke: COLOR.ink, 'stroke-width': 2 });
const vxA = arrow('vel', 1.8, '5 3'), vyA = arrow('vel', 1.8, '5 3'), vA = arrow('vel', 3);
const ball = el('circle', { r: 8, fill: '#d0d0d0', stroke: COLOR.ink, 'stroke-width': 1.5 });

let t = 0, running = false, last = 0;
const v0 = () => Number($('v0').value), th = () => Number($('th').value);

function draw() {
  const T = flightTime(v0(), th()), p = projectile(v0(), th(), t);
  const [X, Y] = P(p.x, p.y);
  set(ball, { cx: X, cy: Y });
  set(vxA, { x1: X, y1: Y, x2: X + K * p.vx, y2: Y });
  set(vyA, { x1: X, y1: Y, x2: X, y2: Y - K * p.vy });
  set(vA, { x1: X, y1: Y, x2: X + K * p.vx, y2: Y - K * p.vy });
  vyA.style.display = Math.abs(p.vy) < 0.3 ? 'none' : '';
  const n = Math.max(1, Math.round(t * 30));
  trail.setAttribute('points', Array.from({ length: n + 1 }, (_, i) => { const q = projectile(v0(), th(), (t * i) / n); return P(q.x, q.y).map(v => v.toFixed(1)).join(','); }).join(' '));
  const R = range(v0(), th());
  set(rangeMark, { x1: O[0] + S * R, y1: O[1] - 14, x2: O[0] + S * R, y2: O[1] + 14 });
  $('v0val').innerHTML = tex(`${v0()}\\ \\mathrm{m/s}`);
  $('thval').innerHTML = tex(`${th()}^\\circ`);
  // 보여 줄 값만 둔다(사용자 2026-11-16 "너무 여러 개라서 지저분"). v_x는 그대로이고 v_y만 바뀐다.
  $('read').innerHTML = tex(`v_x = ${fmt(p.vx)}\\ \\mathrm{m/s}\\qquad v_y = ${fmt(p.vy)}\\ \\mathrm{m/s}\\qquad R = ${fmt(R)}\\ \\mathrm{m}`);
  return T;
}

function frame(now) {
  if (!running) return;
  const T = flightTime(v0(), th());
  t = Math.min(T, t + (now - last) / 1000); last = now; draw();
  if (t >= T) { running = false; $('play').textContent = '재생'; return; }
  requestAnimationFrame(frame);
}
$('play').addEventListener('click', () => {
  if (running) { running = false; $('play').textContent = '재생'; return; }
  if (t >= flightTime(v0(), th())) t = 0;
  running = true; $('play').textContent = '정지'; last = performance.now(); requestAnimationFrame(frame);
});
$('reset').addEventListener('click', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
for (const id of ['v0', 'th']) $(id).addEventListener('input', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
draw();
