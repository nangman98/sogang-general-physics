// 5장 "뉴턴의 제1·2법칙" 시뮬레이션. 마찰 없는 바닥 위 상자에 수평 힘 F를 준다. 1 m = 20 px, 바닥 0–40 m.
// 재생 중에 F를 바꿔도 멈추지 않는다. F를 0으로 하면 속도가 그대로 유지된다(제1법칙).
// 힘 화살표 1 N = 5 px, 가속도 1 m/s² = 8 px, 속도 1 m/s = 6 px. 시간은 실제 빠르기(1배).
import { accel, gravity } from './newton.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';

const S = 20, X0 = 50, FLOOR = 250, L = 40, BW = 70, BH = 50;
const $ = id => document.getElementById(id);
const svg = $('view');
const { el, arrow, label, set } = svgKit(svg);
el('line', { x1: X0, y1: FLOOR, x2: X0 + S * L, y2: FLOOR, stroke: COLOR.ink, 'stroke-width': 2 });
for (let x = 0; x <= L; x += 5) {
  el('line', { x1: X0 + S * x, y1: FLOOR, x2: X0 + S * x, y2: FLOOR + 6, stroke: COLOR.ink });
  el('text', { x: X0 + S * x, y: FLOOR + 40, 'text-anchor': 'middle', 'font-size': 13, fill: '#555555' }).textContent = String(x);
}
el('text', { x: X0 + S * L, y: FLOOR + 60, 'text-anchor': 'end', 'font-size': 14 }).textContent = 'x (m)';
const block = el('rect', { width: BW, height: BH, y: FLOOR - BH, fill: '#d0d0d0', stroke: COLOR.ink, 'stroke-width': 1.5 });
const fA = arrow('b'), nA = arrow('b', 2), gA = arrow('b', 2), aA = arrow('acc'), vA = arrow('vel');
const lF = label('b', 'F'), lN = label('b', 'F'), lG = label('b', 'F'), lA = label('acc', 'a'), lV = label('vel', 'v');
lN.innerHTML = 'F<tspan dy="5" font-size="12">N</tspan>'; lG.innerHTML = 'F<tspan dy="5" font-size="12">g</tspan>';

let t = 0, x = 2, v = 0, running = false, last = 0;
const F = () => Number($('F').value), m = () => Number($('m').value);

function draw() {
  const a = accel(F(), m()), Xc = X0 + S * x, Yc = FLOOR - BH / 2, Fg = gravity(m());
  set(block, { x: Xc - BW / 2 });
  set(fA, { x1: Xc, y1: Yc, x2: Xc + 5 * F(), y2: Yc }); fA.style.display = F() ? '' : 'none';
  set(lF, { x: Xc + 5 * F() + (F() >= 0 ? 14 : -14), y: Yc + 6 }); lF.style.display = F() ? '' : 'none';
  const k = 60 / gravity(10);   // F_g, F_N은 길이를 줄여 그린다(m = 10 kg일 때 60 px)
  set(nA, { x1: Xc, y1: Yc, x2: Xc, y2: Yc - k * Fg - BH / 2 }); set(gA, { x1: Xc, y1: Yc, x2: Xc, y2: Yc + k * Fg + BH / 2 });
  set(lN, { x: Xc + 16, y: Yc - k * Fg - BH / 2 + 10 }); set(lG, { x: Xc + 16, y: Yc + k * Fg + BH / 2 });
  set(aA, { x1: Xc, y1: FLOOR - BH - 30, x2: Xc + 8 * a, y2: FLOOR - BH - 30 }); aA.style.display = Math.abs(a) > 0.01 ? '' : 'none';
  set(lA, { x: Xc + 8 * a + (a >= 0 ? 12 : -12), y: FLOOR - BH - 24 }); lA.style.display = Math.abs(a) > 0.01 ? '' : 'none';
  set(vA, { x1: Xc, y1: FLOOR - BH - 60, x2: Xc + 6 * v, y2: FLOOR - BH - 60 }); vA.style.display = Math.abs(v) > 0.01 ? '' : 'none';
  set(lV, { x: Xc + 6 * v + (v >= 0 ? 12 : -12), y: FLOOR - BH - 54 }); lV.style.display = Math.abs(v) > 0.01 ? '' : 'none';
  $('Fval').innerHTML = tex(`${fmt(F())}\\ \\mathrm{N}`); $('mval').innerHTML = tex(`${fmt(m())}\\ \\mathrm{kg}`);
  $('read').innerHTML = tex(`\\textcolor{#840025}{a = \\frac{F_{\\text{net}}}{m} = \\frac{${fmt(F())}}{${fmt(m())}} = ${fmt(a, 2)}\\ \\mathrm{m/s^2}}\\qquad v = ${fmt(v, 2)}\\ \\mathrm{m/s}`);
}
function frame(now) {
  if (!running) return;
  const dt = (now - last) / 1000, a = accel(F(), m()); last = now;
  v += a * dt; x += v * dt; t += dt;
  if (x < 2 || x > L - 2) { x = Math.max(2, Math.min(L - 2, x)); running = false; $('play').textContent = '재생'; }
  draw();
  if (running) requestAnimationFrame(frame);
}
$('play').addEventListener('click', () => {
  running = !running; $('play').textContent = running ? '정지' : '재생';
  if (running) { last = performance.now(); requestAnimationFrame(frame); }
});
$('reset').addEventListener('click', () => { running = false; t = 0; x = 2; v = 0; $('play').textContent = '재생'; draw(); });
for (const id of ['F', 'm']) $(id).addEventListener('input', draw);
draw();
