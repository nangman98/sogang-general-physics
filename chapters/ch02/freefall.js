// 2장 "자유 낙하" 시뮬레이션. 땅(y = 0)에서 처음 속도 v0로 위로 던진 공이 다시 땅에 닿을 때까지.
// 왼쪽은 높이와 속도·가속도 화살표, 오른쪽은 v-t 그래프. 시간은 실제 빠르기(1배)로 흐른다. g = 9.8 m/s² (교재 2.5).
import katex from '../../vendor/katex/katex.mjs';

const g = 9.8, Y_MAX = 35, T_MAX = 2 * 25 / 9.8, V_MAX = 26;
const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const tex = s => katex.renderToString(s, { throwOnError: true });
const fmt = (x, d = 1) => (Math.abs(x) < 5 * 10 ** -(d + 1) ? 0 : x).toFixed(d).replace('-', '−');

const py = y => 330 - y * 8.5;                       // y = 0…35 m -> 330…32.5
const G = { L: 340, T: 30, R: 610, B: 300 };
const gx = t => G.L + (G.R - G.L) * t / T_MAX;
const gy = v => G.B - (G.B - G.T) * (v + V_MAX) / (2 * V_MAX);

const svg = $('view');
const el = (name, attrs, text) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  svg.appendChild(e);
  return e;
};
el('defs', {}).innerHTML = ['vel:#0072B2', 'acc:#CC79A7'].map(s => s.split(':')).map(([k, c]) =>
  `<marker id="f-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('');

// 높이 축과 땅
el('line', { x1: 70, y1: py(0), x2: 70, y2: py(Y_MAX) - 6, stroke: '#1a1a1a', 'stroke-width': 2 });
for (let y = 0; y <= 30; y += 10) {
  el('line', { x1: 64, y1: py(y), x2: 70, y2: py(y), stroke: '#1a1a1a' });
  el('text', { x: 58, y: py(y) + 4, 'text-anchor': 'end', 'font-size': 13, fill: '#555555' }, String(y));
}
el('text', { x: 70, y: py(Y_MAX) - 14, 'text-anchor': 'middle', 'font-size': 14 }, 'y (m)');
el('line', { x1: 70, y1: py(0), x2: 290, y2: py(0), stroke: '#1a1a1a', 'stroke-width': 2 });
const peak = el('line', { x1: 70, x2: 290, stroke: '#8a8a8a', 'stroke-width': 1, 'stroke-dasharray': '4 4' });
const acc = el('line', { x1: 140, x2: 140, stroke: '#CC79A7', 'stroke-width': 3, 'marker-end': 'url(#f-acc)' });
const accLabel = el('text', { x: 132, 'text-anchor': 'end', 'font-size': 14, fill: '#CC79A7', 'font-weight': 600 }, 'a = −g');
const ball = el('circle', { cx: 180, r: 10, fill: '#d0d0d0', stroke: '#1a1a1a', 'stroke-width': 1.5 });
const vel = el('line', { x1: 220, x2: 220, stroke: '#0072B2', 'stroke-width': 3, 'marker-end': 'url(#f-vel)' });
const velLabel = el('text', { x: 230, 'font-size': 14, fill: '#0072B2', 'font-weight': 600 }, 'v');

// v-t 그래프
el('rect', { x: G.L, y: G.T, width: G.R - G.L, height: G.B - G.T, fill: 'none', stroke: '#1a1a1a', 'stroke-width': 1.5 });
el('line', { x1: G.L, y1: gy(0), x2: G.R, y2: gy(0), stroke: '#d0d0d0' });
for (let t = 0; t <= 5; t++) {
  el('line', { x1: gx(t), y1: G.B, x2: gx(t), y2: G.B + 6, stroke: '#1a1a1a' });
  el('text', { x: gx(t), y: G.B + 22, 'text-anchor': 'middle', 'font-size': 13, fill: '#555555' }, String(t));
}
for (const v of [-20, -10, 0, 10, 20]) {
  el('line', { x1: G.L - 6, y1: gy(v), x2: G.L, y2: gy(v), stroke: '#1a1a1a' });
  el('text', { x: G.L - 10, y: gy(v) + 4, 'text-anchor': 'end', 'font-size': 13, fill: '#555555' }, String(v).replace('-', '−'));
}
el('text', { x: G.R, y: G.B + 40, 'text-anchor': 'end', 'font-size': 14 }, 't (s)');
el('text', { x: G.L - 34, y: G.T - 10, 'font-size': 14 }, 'v (m/s)');
const trail = el('polyline', { fill: 'none', stroke: '#0072B2', 'stroke-width': 2.5 });

let t = 0, running = false, last = 0;
const v0 = () => Number($('v0').value);
const tEnd = () => 2 * v0() / g;

function draw() {
  const y = v0() * t - 0.5 * g * t * t, v = v0() - g * t;
  ball.setAttribute('cy', py(y) - 10);
  vel.setAttribute('y1', py(y) - 10); vel.setAttribute('y2', py(y) - 10 - v * 2.6);
  vel.style.display = Math.abs(v) < 0.3 ? 'none' : '';
  velLabel.setAttribute('y', py(y) - 6 - v * 1.3);
  acc.setAttribute('y1', py(y) - 24); acc.setAttribute('y2', py(y) - 24 + g * 2.6);
  accLabel.setAttribute('y', py(y) - 4);
  const top = v0() * v0() / (2 * g);
  peak.setAttribute('y1', py(top) - 10); peak.setAttribute('y2', py(top) - 10);
  peak.style.display = v0() ? '' : 'none';
  const n = Math.max(1, Math.round(t * 20));
  trail.setAttribute('points', Array.from({ length: n + 1 }, (_, i) => `${gx(t * i / n).toFixed(1)},${gy(v0() - g * t * i / n).toFixed(1)}`).join(' '));
  $('v0val').innerHTML = tex(`${v0()}\\ \\mathrm{m/s}`);
  $('read').innerHTML = tex(`y_0 = 0\\ \\mathrm{m}\\qquad t = ${fmt(t, 2)}\\ \\mathrm{s}\\qquad y = ${fmt(y)}\\ \\mathrm{m}\\qquad v = ${fmt(v)}\\ \\mathrm{m/s}\\qquad a = -9.8\\ \\mathrm{m/s^2}`);
}

function frame(now) {
  if (!running) return;
  t = Math.min(tEnd(), t + (now - last) / 1000);
  last = now;
  draw();
  if (t >= tEnd()) { running = false; $('play').textContent = '재생'; return; }
  requestAnimationFrame(frame);
}

$('play').addEventListener('click', () => {
  if (running) { running = false; $('play').textContent = '재생'; return; }
  if (t >= tEnd()) t = 0;
  running = true; $('play').textContent = '정지'; last = performance.now();
  requestAnimationFrame(frame);
});
$('reset').addEventListener('click', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
$('v0').addEventListener('input', () => { running = false; t = 0; $('play').textContent = '재생'; draw(); });
draw();
