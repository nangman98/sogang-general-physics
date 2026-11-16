// 2장 "등가속도 운동" 시뮬레이션. x0 = 0 m에서 처음 속도 v0, 일정한 가속도 a로 4 s 동안 움직인다.
// 위는 x축 위의 물체와 v(파랑)·a(분홍) 화살표, 아래는 x-t, v-t, a-t 그래프가 같은 시각까지 함께 그려진다.
// x, v 축 범위는 slider 값에 맞춰 5, 10, 20, 40, 80 중에서 고르고 눈금 숫자로 보인다. 시간은 실제 빠르기(1배).
import { position, velocity } from './kinematics.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';

const T_END = 4, A_RANGE = 5;
const $ = id => document.getElementById(id);
const svg = $('view');
const { el, arrow, label, set } = svgKit(svg);
const nice = m => [5, 10, 20, 40, 80].find(n => n >= m - 1e-9) ?? 80;
const small = { 'font-size': 13, fill: '#555555' };
const lab = { 'font-size': 15 };
const unit = (q, u) => `<tspan font-style="italic" font-family="Times New Roman, serif">${q}</tspan> (${u})`;   // 기호만 기울이고 단위는 바로

// 위: x축(트랙)
const TR = { L: 110, R: 790, Y: 110 };   // 끝에서도 화살표(60 px)와 글자가 그림 안에 들도록 양옆을 비운다
el('line', { x1: TR.L - 20, y1: TR.Y, x2: TR.R + 20, y2: TR.Y, stroke: COLOR.ink, 'stroke-width': 2 });
el('text', { x: TR.R + 28, y: TR.Y + 5, ...lab }).innerHTML = unit('x', 'm');
const trackTicks = [-1, -0.5, 0, 0.5, 1].map(f => ({ f, line: el('line', { stroke: COLOR.ink, 'stroke-width': 1.5 }), text: el('text', { 'text-anchor': 'middle', ...small }) }));
const vArrow = arrow('vel'), aArrow = arrow('acc');
const vLab = label('vel', 'v'), aLab = label('acc', 'a');
const ball = el('circle', { cy: TR.Y, r: 10, fill: COLOR.c });

// 아래: 세 그래프. 4변 프레임, 0 선, 눈금 바깥
const P = [
  { key: 'x', L: 70, color: COLOR.c, name: unit('x', 'm') },
  { key: 'v', L: 375, color: COLOR.vel, name: unit('v', 'm/s') },
  { key: 'a', L: 680, color: COLOR.acc, name: unit('a', 'm/s²') },
].map(p => ({ ...p, R: p.L + 200, T: 200, B: 410 }));
for (const p of P) {
  p.gx = t => p.L + (p.R - p.L) * t / T_END;
  p.gy = y => (p.T + p.B) / 2 - (p.B - p.T) / 2 * y / p.range;
  el('rect', { x: p.L, y: p.T, width: p.R - p.L, height: p.B - p.T, fill: 'none', stroke: COLOR.ink, 'stroke-width': 1.5 });
  el('line', { x1: p.L, y1: (p.T + p.B) / 2, x2: p.R, y2: (p.T + p.B) / 2, stroke: '#d0d0d0', 'stroke-width': 1 });
  for (let t = 0; t <= T_END; t++) {
    el('line', { x1: p.gx(t), y1: p.B, x2: p.gx(t), y2: p.B + 6, stroke: COLOR.ink });
    el('text', { x: p.gx(t), y: p.B + 22, 'text-anchor': 'middle', ...small }).textContent = String(t);
  }
  el('text', { x: p.R, y: p.B + 40, 'text-anchor': 'end', ...lab }).innerHTML = unit('t', 's');
  el('text', { x: p.L, y: p.T - 12, ...lab, fill: p.color }).innerHTML = p.name;
  p.ticks = [-1, -0.5, 0, 0.5, 1].map(f => ({ f, line: el('line', { stroke: COLOR.ink }), text: el('text', { 'text-anchor': 'end', ...small }) }));
  p.trail = el('polyline', { fill: 'none', stroke: p.color, 'stroke-width': 2.5 });
  p.dot = el('circle', { r: 5, fill: p.color });
}

let t = 0, running = false, last = 0;
const num = id => Number($(id).value);
const tickText = v => String(v).replace('-', '−');

function ranges() {
  const v0 = num('v0'), a = num('a');
  let xm = 0;
  for (let i = 0; i <= 400; i++) xm = Math.max(xm, Math.abs(position(0, v0, a, T_END * i / 400)));
  P[0].range = nice(xm); P[1].range = nice(Math.max(Math.abs(v0), Math.abs(velocity(v0, a, T_END)))); P[2].range = A_RANGE;
  for (const p of P) for (const k of p.ticks) {
    const y = p.gy(k.f * p.range);
    set(k.line, { x1: p.L - 6, y1: y, x2: p.L, y2: y }); set(k.text, { x: p.L - 10, y: y + 4 });
    k.text.textContent = tickText(k.f * p.range);
  }
  for (const k of trackTicks) {
    const X = tx(k.f * P[0].range);
    set(k.line, { x1: X, y1: TR.Y - 6, x2: X, y2: TR.Y + 6 }); set(k.text, { x: X, y: TR.Y + 26 });
    k.text.textContent = tickText(k.f * P[0].range);
  }
}
const tx = x => (TR.L + TR.R) / 2 + (TR.R - TR.L) / 2 * x / P[0].range;

function draw() {
  const v0 = num('v0'), a = num('a'), x = position(0, v0, a, t), v = velocity(v0, a, t);
  const X = tx(x), KV = 60 / P[1].range, KA = 60 / A_RANGE;   // 화살표: 축 범위 끝 값이 60 px
  set(ball, { cx: X });
  set(vArrow, { x1: X, y1: TR.Y - 30, x2: X + KV * v, y2: TR.Y - 30 }); vArrow.style.display = Math.abs(v) < 0.05 ? 'none' : '';
  set(aArrow, { x1: X, y1: TR.Y - 58, x2: X + KA * a, y2: TR.Y - 58 }); aArrow.style.display = a === 0 ? 'none' : '';
  set(vLab, { x: X + KV * v + (v >= 0 ? 14 : -14), y: TR.Y - 24 }); vLab.style.display = vArrow.style.display;
  set(aLab, { x: X + KA * a + (a >= 0 ? 14 : -14), y: TR.Y - 52 }); aLab.style.display = aArrow.style.display;
  const f = [s => position(0, v0, a, s), s => velocity(v0, a, s), () => a];
  const n = Math.max(1, Math.round(t * 50));
  P.forEach((p, i) => {
    p.trail.setAttribute('points', Array.from({ length: n + 1 }, (_, j) => { const s = t * j / n; return `${p.gx(s).toFixed(1)},${p.gy(f[i](s)).toFixed(1)}`; }).join(' '));
    set(p.dot, { cx: p.gx(t), cy: p.gy(f[i](t)) });
  });
  $('v0val').innerHTML = tex(`${fmt(v0)}\\ \\mathrm{m/s}`);
  $('aval').innerHTML = tex(`${fmt(a)}\\ \\mathrm{m/s^2}`);
  $('read').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}\\qquad \\textcolor{#840025}{x = ${fmt(x, 1)}\\ \\mathrm{m}}\\qquad v = ${fmt(v, 1)}\\ \\mathrm{m/s}`);
}

function frame(now) {
  if (!running) return;
  t = Math.min(T_END, t + (now - last) / 1000); last = now;
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
for (const id of ['v0', 'a']) $(id).addEventListener('input', () => { running = false; t = 0; $('play').textContent = '재생'; ranges(); draw(); });
ranges(); draw();
