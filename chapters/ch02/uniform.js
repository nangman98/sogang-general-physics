// 2장 "등속도 운동" 시뮬레이션. x0 = 0 m에서 일정한 속도 v로 5 s 동안 움직이고, 그동안 x-t 그래프를 그린다.
// 시간은 실제 빠르기(1배)로 흐른다.
import katex from '../../vendor/katex/katex.mjs';

const T_END = 5, X_MAX = 20;
const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const tex = s => katex.renderToString(s, { throwOnError: true });
const fmt = (x, d = 1) => (Math.abs(x) < 1e-9 ? 0 : x).toFixed(d).replace('-', '−');

// 위쪽 x축(트랙)과 아래쪽 x-t 그래프의 픽셀 변환
const tx = x => 40 + (x + X_MAX) * 14;               // x = −20…20 m -> 40…600
const G = { L: 70, T: 140, R: 600, B: 330 };
const gx = t => G.L + (G.R - G.L) * t / T_END;
const gy = x => G.B - (G.B - G.T) * (x + X_MAX) / (2 * X_MAX);

const svg = $('view');
const el = (name, attrs, text) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  svg.appendChild(e);
  return e;
};
el('defs', {}).innerHTML = '<marker id="u-vel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#0072B2"/></marker>';

// 트랙
el('line', { x1: 30, y1: 60, x2: 612, y2: 60, stroke: '#1a1a1a', 'stroke-width': 2 });
for (let x = -X_MAX; x <= X_MAX; x += 5) {
  el('line', { x1: tx(x), y1: 54, x2: tx(x), y2: 66, stroke: '#1a1a1a', 'stroke-width': 1.5 });
  el('text', { x: tx(x), y: 86, 'text-anchor': 'middle', 'font-size': 14, fill: '#555555' }, String(x).replace('-', '−'));
}
el('text', { x: 616, y: 65, 'font-size': 15 }, 'x (m)');
const arrow = el('line', { y1: 32, y2: 32, stroke: '#0072B2', 'stroke-width': 3, 'marker-end': 'url(#u-vel)' });
const ball = el('circle', { cy: 60, r: 10, fill: '#840025' });

// x-t 그래프: 4변 프레임, 눈금 바깥
el('rect', { x: G.L, y: G.T, width: G.R - G.L, height: G.B - G.T, fill: 'none', stroke: '#1a1a1a', 'stroke-width': 1.5 });
el('line', { x1: G.L, y1: gy(0), x2: G.R, y2: gy(0), stroke: '#d0d0d0', 'stroke-width': 1 });
for (let t = 0; t <= T_END; t++) {
  el('line', { x1: gx(t), y1: G.B, x2: gx(t), y2: G.B + 6, stroke: '#1a1a1a' });
  el('text', { x: gx(t), y: G.B + 22, 'text-anchor': 'middle', 'font-size': 13, fill: '#555555' }, String(t));
}
for (const x of [-20, -10, 0, 10, 20]) {
  el('line', { x1: G.L - 6, y1: gy(x), x2: G.L, y2: gy(x), stroke: '#1a1a1a' });
  el('text', { x: G.L - 10, y: gy(x) + 4, 'text-anchor': 'end', 'font-size': 13, fill: '#555555' }, String(x).replace('-', '−'));
}
el('text', { x: G.R, y: G.B + 22 + 16, 'text-anchor': 'end', 'font-size': 14 }, 't (s)');
el('text', { x: G.L, y: G.T - 10, 'font-size': 14 }, 'x (m)');
const trail = el('polyline', { fill: 'none', stroke: '#840025', 'stroke-width': 2.5 });

let t = 0, running = false, last = 0;
const v = () => Number($('v').value);

function draw() {
  const x = v() * t;
  ball.setAttribute('cx', tx(x));
  arrow.setAttribute('x1', tx(x));
  arrow.setAttribute('x2', tx(x) + v() * 14);
  arrow.style.display = v() === 0 ? 'none' : '';
  const n = Math.max(1, Math.round(t * 20));
  trail.setAttribute('points', Array.from({ length: n + 1 }, (_, i) => `${gx(t * i / n).toFixed(1)},${gy(v() * t * i / n).toFixed(1)}`).join(' '));
  $('vval').innerHTML = tex(`${fmt(v())}\\ \\mathrm{m/s}`);
  $('read').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}\\qquad x = x_0 + vt = 0 + (${fmt(v())})(${fmt(t, 2)}) = ${fmt(x)}\\ \\mathrm{m}`);
}

function frame(now) {
  if (!running) return;
  t = Math.min(T_END, t + (now - last) / 1000);
  last = now;
  draw();
  if (t >= T_END) { running = false; $('play').textContent = '재생'; return; }
  requestAnimationFrame(frame);
}

$('play').addEventListener('click', () => {
  if (running) { running = false; $('play').textContent = '재생'; return; }
  if (t >= T_END) t = 0;
  running = true; $('play').textContent = '정지'; last = performance.now();
  requestAnimationFrame(frame);
});
$('reset').addEventListener('click', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
$('v').addEventListener('input', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
draw();
