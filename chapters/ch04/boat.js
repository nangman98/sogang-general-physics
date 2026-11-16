// 4장 "상대 운동" 시뮬레이션. 강폭 24 m의 강을 배 P가 건넌다. A는 강가, B는 강물(기준틀).
// x는 강물이 흐르는 쪽, y는 건너는 쪽. 1 m = 10 px. 속도 화살표 1 m/s = 14 px. 시간은 실제 빠르기(1배).
import { boat } from './motion.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';

const D = 24, S = 10, X0 = 350, Y0 = 380, K = 14;
const $ = id => document.getElementById(id);
const svg = $('view');
const { el, arrow, set } = svgKit(svg);
const P = (x, y) => [X0 + S * x, Y0 - S * y];

el('rect', { x: 20, y: Y0 - S * D, width: 860, height: S * D, fill: '#56B4E9', 'fill-opacity': 0.14 });
for (const y of [0, D]) el('line', { x1: 20, y1: Y0 - S * y, x2: 880, y2: Y0 - S * y, stroke: COLOR.ink, 'stroke-width': 2 });
el('text', { x: 24, y: Y0 + 44, 'font-size': 14, fill: '#555555' }).textContent = '출발하는 강가 (A)';
el('text', { x: 24, y: Y0 - S * D - 10, 'font-size': 14, fill: '#555555' }).textContent = '건너편 강가';
for (let x = -30; x <= 50; x += 10) {
  el('line', { x1: X0 + S * x, y1: Y0, x2: X0 + S * x, y2: Y0 + 6, stroke: COLOR.ink });
  el('text', { x: X0 + S * x, y: Y0 + 22, 'text-anchor': 'middle', 'font-size': 12, fill: '#555555' }).textContent = String(x).replace('-', '−');
}
el('text', { x: X0 + S * 50 + 14, y: Y0 + 22, 'font-size': 12, fill: '#555555' }).textContent = 'x (m)';
const flow = el('text', { x: 860, y: Y0 - S * D + 22, 'text-anchor': 'end', 'font-size': 14, fill: COLOR.water });
// 강물 표시: 재생하면 강가에서 본 강물의 속력 v_BA로 흘러간다(사용자 2026-11-16 "강물 속도 고정").
const WATER = [];
for (const y of [5, 12, 19]) for (let k = 0; k < 9; k++) WATER.push({ x0: -30 + k * 10 + (y % 2) * 5, y, e: el('line', { stroke: COLOR.water, 'stroke-width': 2.5, 'stroke-opacity': 0.45, 'stroke-linecap': 'round' }) });
function drawWater(time) {
  for (const w of WATER) {
    const x = ((w.x0 + num('vBA') * time + 32) % 84 + 84) % 84 - 32, [X, Y] = P(x, w.y);
    set(w.e, { x1: X - 12, y1: Y, x2: X + 12, y2: Y });
  }
}
const trail = el('polyline', { fill: 'none', stroke: COLOR.c, 'stroke-width': 2, 'stroke-dasharray': '6 4' });
const boatShape = el('polygon', { fill: '#d0d0d0', stroke: COLOR.ink, 'stroke-width': 1.5 });
const aPB = arrow('vel'), aBA = arrow('water'), aPA = arrow('c', 3.5);
const tag = (key, txt) => { const e = el('text', { fill: COLOR[key], 'font-size': 16, 'font-style': 'italic', 'font-family': 'Times New Roman, serif' }); e.innerHTML = txt; return e; };
const lPB = tag('vel', 'v<tspan dy="5" font-size="11">PB</tspan>'), lBA = tag('water', 'v<tspan dy="5" font-size="11">BA</tspan>'), lPA = tag('c', 'v<tspan dy="5" font-size="11">PA</tspan>');

let t = 0, running = false, last = 0;
const num = id => Number($(id).value);

function draw() {
  const b = boat(num('vPB'), num('vBA'), num('th'), D);
  const tt = Math.min(t, b.time), pos = [b.PA[0] * tt, b.PA[1] * tt], [X, Y] = P(...pos);
  const ang = Math.atan2(-b.PB[1], b.PB[0]);   // 뱃머리 방향(화면 각)
  const pt = (f, s) => [X + f * Math.cos(ang) - s * Math.sin(ang), Y + f * Math.sin(ang) + s * Math.cos(ang)];
  boatShape.setAttribute('points', [pt(16, 0), pt(-12, 7), pt(-12, -7)].map(q => q.map(v => v.toFixed(1)).join(',')).join(' '));
  const end1 = [X + K * b.PB[0], Y - K * b.PB[1]], end2 = [end1[0] + K * b.BA[0], end1[1]], endA = [X + K * b.PA[0], Y - K * b.PA[1]];
  set(aPB, { x1: X, y1: Y, x2: end1[0], y2: end1[1] }); set(aBA, { x1: end1[0], y1: end1[1], x2: end2[0], y2: end2[1] });
  set(aPA, { x1: X, y1: Y, x2: endA[0], y2: endA[1] });
  aBA.style.display = num('vBA') ? '' : 'none';
  set(lPB, { x: (X + end1[0]) / 2 - 34, y: (Y + end1[1]) / 2 }); set(lBA, { x: (end1[0] + end2[0]) / 2 - 8, y: end1[1] - 10 }); set(lPA, { x: (X + endA[0]) / 2 + 12, y: (Y + endA[1]) / 2 + 16 });
  lBA.style.display = num('vBA') ? '' : 'none';
  const n = Math.max(1, Math.round(tt * 10));
  trail.setAttribute('points', Array.from({ length: n + 1 }, (_, i) => P(b.PA[0] * tt * i / n, b.PA[1] * tt * i / n).map(v => v.toFixed(1)).join(',')).join(' '));
  flow.textContent = `강물 흐름 → ${fmt(num('vBA'))} m/s`;
  drawWater(t);
  for (const id of ['vPB', 'vBA']) $(id + 'val').innerHTML = tex(`${fmt(num(id))}\\ \\mathrm{m/s}`);
  $('thval').innerHTML = tex(`${num('th')}^\\circ`);
  $('read').innerHTML = [
    tex(`\\textcolor{#840025}{\\vec v_{PA} = \\vec v_{PB} + \\vec v_{BA} = (${fmt(b.PB[0], 2)},\\ ${fmt(b.PB[1], 2)}) + (${fmt(b.BA[0], 2)},\\ 0) = (${fmt(b.PA[0], 2)},\\ ${fmt(b.PA[1], 2)})\\ \\mathrm{m/s}}`),
    `건너는 시간 ${tex(`${fmt(b.time, 2)}\\ \\mathrm{s}`)} &nbsp; 떠내려간 거리 ${tex(`${fmt(b.drift, 1)}\\ \\mathrm{m}`)}`,
  ].join('<br>');
  return b.time;
}
function frame(now) {
  if (!running) return;
  const T = boat(num('vPB'), num('vBA'), num('th'), D).time;
  t = Math.min(T, t + (now - last) / 1000); last = now; draw();
  if (t >= T) { running = false; $('play').textContent = '재생'; return; }
  requestAnimationFrame(frame);
}
$('play').addEventListener('click', () => {
  if (running) { running = false; $('play').textContent = '재생'; return; }
  if (t >= boat(num('vPB'), num('vBA'), num('th'), D).time) t = 0;
  running = true; $('play').textContent = '정지'; last = performance.now(); requestAnimationFrame(frame);
});
$('reset').addEventListener('click', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
for (const id of ['vPB', 'vBA', 'th']) $(id).addEventListener('input', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
draw();
