// 2장 "등가속도 운동" 시뮬레이션(공용 틀 core/simshell.js). x0 = 0에서 처음 속도 v0로 출발한 자동차가 일정한 가속도 a로 4 s 동안 달린다.
// 왼쪽 장면은 거리 표지가 선 길 위의 자동차와 v(파랑)·a(분홍) 화살표, 오른쪽은 같은 시간축의 x-t, v-t, a-t 그래프다.
// v0, a는 slider나 장면의 화살표 끝 손잡이를 끌어 정한다. 값을 바꾸면 t = 0으로 돌아간다.
// 위치와 속도는 교재 (2.4.5), (2.4.1) 식 그대로 계산한다(오차 없음). 0.5 s마다 자동차 위치를 길 위에 점으로 남긴다.
// 길과 그래프의 축 구간은 4 s 동안 지나는 값을 0과 함께 담는 1·2·5 끝값(최소 5)이다. 손잡이를 끄는 동안에는 축을 그대로 둔다.
// v 화살표는 v 축 구간 끝값(절댓값 큰 쪽)이, a 화살표는 slider 끝값 5 m/s²가 가장 긴 화살표 AV다. 자동차·화살표·글자는 장면 크기에 맞춰 키운다.
import { position, velocity, extent } from './kinematics.js';
import { COLOR, tex, fmt } from '../../core/simkit.js';
import { stage, clock, timeGraphs, bigArrow, span, stepOf, minus, qty } from '../../core/simshell.js';

const T_END = 4, STROBE = 0.5, A_MAX = 5;
const $ = id => document.getElementById(id);
const v0 = () => Number($('v0').value), acc = () => Number($('a').value);
let t = 0, drag = null;
const R = { x: [0, 10], v: [-10, 10], a: [-5, 0] };
let S = null, G = null;   // 장면과 그래프. 화면 크기가 바뀌면 stage가 다시 만든다.

// 옆에서 본 승용차. (0, 0)이 차 가운데 바닥이고 바퀴 반지름은 10이다.
const wheel = cx => `<g transform="translate(${cx},-10)"><circle r="10" fill="#1d1d1d"/><circle r="6.2" fill="#c9ced4" stroke="#8d939b"/>
  <g class="spokes">${[0, 72, 144, 216, 288].map(d => `<line x2="${(5.6 * Math.cos(d * Math.PI / 180)).toFixed(2)}" y2="${(5.6 * Math.sin(d * Math.PI / 180)).toFixed(2)}" stroke="#6d737b" stroke-width="1.6"/>`).join('')}<circle r="1.8" fill="#55595f"/></g></g>`;
const CAR = `
  <ellipse cx="0" cy="0" rx="50" ry="3.5" fill="#000000" opacity="0.18"/>
  <path d="M-50,-14 Q-50,-26 -40,-27 L-24,-29 L-12,-42 Q-8,-46 -1,-46 L20,-46 Q27,-46 31,-41 L40,-29 L46,-27 Q50,-25 50,-18 L50,-12 Q50,-8 46,-8 L-46,-8 Q-50,-8 -50,-12 Z" fill="url(#carbody)" stroke="#5a0019" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M-20,-29 L-10,-41 Q-7,-43 -2,-43 L5,-43 L5,-29 Z" fill="url(#glass)" stroke="#5a0019" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M9,-43 L19,-43 Q24,-43 27,-39 L35,-29 L9,-29 Z" fill="url(#glass)" stroke="#5a0019" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M-46,-21 L46,-21" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2"/>
  <line x1="7" y1="-29" x2="7" y2="-10" stroke="#5a0019" stroke-opacity="0.6"/>
  <rect x="11" y="-26" width="7" height="2.4" rx="1.2" fill="#3a0010"/>
  <ellipse cx="47" cy="-22" rx="3" ry="2.6" fill="#ffe27a" stroke="#a88a1c" stroke-width="0.8"/>
  <rect x="-50" y="-26" width="4" height="6" rx="1" fill="#ff4b3a"/>
  <rect x="43" y="-13" width="9" height="4.5" rx="2" fill="#2b2b2b"/><rect x="-52" y="-13" width="9" height="4.5" rx="2" fill="#2b2b2b"/>
  <path d="M-42.5,-8 A12.5,12.5 0 0 1 -17.5,-8 Z M17.5,-8 A12.5,12.5 0 0 1 42.5,-8 Z" fill="#2a0611"/>
  ${wheel(-30)}${wheel(30)}`;

stage($('scene'), k => {
  const { el, set, w, h } = k;
  // K는 장면 높이에 맞춘 배율(글자·화살표·손잡이), CS는 자동차 배율이다. AV는 가장 긴 화살표(px)이고
  // 길 양옆을 AV만큼 비워 길 끝에서 바깥을 향한 화살표도 장면 안에 든다.
  const K = Math.max(1, Math.min(1.8, h / 240)), CS = Math.max(0.8, Math.min(K, w / 450));
  const AV = Math.max(60, Math.min(140, w * 0.17)), M = AV + 9 * K + 8, GY = h - 44 * K, RT = 12 * K;
  el('defs').innerHTML = `
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6e7f7"/><stop offset="1" stop-color="#f5f9fc"/></linearGradient>
    <linearGradient id="carbody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8325a"/><stop offset="1" stop-color="#7d0022"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef7fd"/><stop offset="1" stop-color="#a6cbe5"/></linearGradient>`;
  el('rect', { x: 0, y: 0, width: w, height: GY, fill: 'url(#sky)' });
  const cloud = (cx, cy, s) => el('path', { d: `M${cx - 30 * s},${cy} a${14 * s},${14 * s} 0 0 1 ${22 * s},${-12 * s} a${18 * s},${18 * s} 0 0 1 ${32 * s},${-4 * s} a${12 * s},${12 * s} 0 0 1 ${20 * s},${16 * s} z`, fill: '#ffffff', opacity: 0.9 });
  cloud(w * 0.62, GY * 0.22, K); cloud(w * 0.86, GY * 0.4, 0.8 * K); cloud(w * 0.4, GY * 0.5, 0.7 * K);
  const hill = (amp, fill) => el('path', { fill, d: `M0,${GY} L0,${GY - amp * 0.6} Q${w * 0.12},${GY - amp * 1.3} ${w * 0.25},${GY - amp * 0.7} T${w * 0.5},${GY - amp * 0.8} T${w * 0.75},${GY - amp * 0.5} T${w},${GY - amp * 0.9} L${w},${GY} Z` });
  hill(34 * K, '#dbe8d2'); hill(18 * K, '#c9dcbb');
  // 길 뒤의 나무
  for (const f of [0.06, 0.3, 0.55, 0.78, 0.95]) {
    const X = w * f, s = K * (0.8 + 0.25 * Math.sin(f * 40));
    el('rect', { x: X - 2.5 * s, y: GY - 16 * s, width: 5 * s, height: 16 * s, fill: '#8a6a45' });
    el('circle', { cx: X, cy: GY - 24 * s, r: 11 * s, fill: '#6f9e58' });
    el('circle', { cx: X - 6 * s, cy: GY - 18 * s, r: 7 * s, fill: '#7fae66' });
  }
  el('rect', { x: 0, y: GY, width: w, height: RT, fill: '#4d5257' });
  el('line', { x1: 0, y1: GY, x2: w, y2: GY, stroke: '#2f3337', 'stroke-width': 2 });
  el('line', { x1: 0, y1: GY + RT / 2, x2: w, y2: GY + RT / 2, stroke: '#f2f2f2', 'stroke-width': 1.5, 'stroke-dasharray': `${14 * K} ${12 * K}`, opacity: 0.8 });
  el('rect', { x: 0, y: GY + RT, width: w, height: h - GY - RT, fill: '#ece4d6' });
  el('text', { x: w - 12, y: GY + RT + 20 * Math.sqrt(K), 'text-anchor': 'end', 'font-size': 15 * Math.sqrt(K) }).innerHTML = qty('x', 'm');
  const ticks = el('g'), marks = el('g'), car = el('g');
  car.innerHTML = CAR;
  const top = GY - 46 * CS, row = { v: top - 22 * K, a: top - 56 * K };
  S = { el, set, GY, RT, K, CS, AV, L: M, R: w - M, row, ticks, marks, car,
    spokes: [...car.querySelectorAll('.spokes')],
    AR: { v: bigArrow(k, COLOR.vel, { bw: 6 * K, hl: 15 * K, hw: 18 * K }), a: bigArrow(k, COLOR.acc, { bw: 6 * K, hl: 15 * K, hw: 18 * K }) },
    LB: { v: k.label('vel', 'v'), a: k.label('acc', 'a') } };
  for (const l of Object.values(S.LB)) l.setAttribute('font-size', 20 * K);
  // 화살표 끝 손잡이. 끌면 t = 0으로 돌아가 v0(1 m/s 단위)나 a(0.5 m/s² 단위)가 바뀐다.
  const grip = (color, id, step) => {
    const c = el('circle', { r: 9 * K, fill: '#ffffff', stroke: color, 'stroke-width': 3, style: 'cursor: ew-resize' });
    c.addEventListener('pointerdown', ev => { ev.preventDefault(); c.setPointerCapture(ev.pointerId); drag = c; ck.stop(); t = 0; draw(); });
    c.addEventListener('pointermove', ev => {
      if (drag !== c) return;
      const s = $(id), u = Math.round((k.toSvg(ev).x - tx(0)) / scale()[id] / step) * step;
      const val = Math.max(Number(s.min), Math.min(Number(s.max), u));
      if (val !== Number(s.value)) { s.value = val; s.dispatchEvent(new Event('input')); }
    });
    for (const e of ['pointerup', 'pointercancel']) c.addEventListener(e, () => { if (drag === c) { drag = null; reset(); } });
    return c;
  };
  S.H = { v: grip(COLOR.vel, 'v0', 1), a: grip(COLOR.acc, 'a', 0.5) };
  trackTicks(); draw();
});
stage($('graphs'), k => {
  G = timeGraphs(k, { x: 0, y: 0, w: k.w, h: k.h, tEnd: T_END, panels: [
    { key: 'x', name: qty('x', 'm'), color: COLOR.c },
    { key: 'v', name: qty('v', 'm/s'), color: COLOR.vel },
    { key: 'a', name: qty('a', 'm/s²'), color: COLOR.acc },
  ] });
  for (const key in R) G.range(key, ...R[key]);
  draw();
});

function tx(u) { const [lo, hi] = R.x; return S.L + (S.R - S.L) * (u - lo) / (hi - lo); }
// 화살표 비율(px per m/s, px per m/s²). slider id로 찾는다.
function scale() { return { v0: S.AV / Math.max(-R.v[0], R.v[1]), a: S.AV / A_MAX }; }
// 길가 거리 표지. 눈금마다 흰 기둥을 세우고 길 아래에 숫자를 단다. x0 = 0 기둥은 빨갛다.
function trackTicks() {
  if (!S) return;
  S.ticks.replaceChildren();
  const [lo, hi] = R.x, st = stepOf(lo, hi), e = S.el, K = S.K, B = S.GY + S.RT;
  for (let u = Math.ceil(lo / st - 1e-9) * st; u <= hi + 1e-9; u += st) {
    const X = tx(u), zero = Math.abs(u) < 1e-9;
    e('rect', { x: X - 2.5 * K, y: S.GY - 18 * K, width: 5 * K, height: 18 * K, rx: 1, fill: '#ffffff', stroke: '#7a7f86' }, S.ticks);
    e('rect', { x: X - 2.5 * K, y: S.GY - 18 * K, width: 5 * K, height: 5 * K, rx: 1, fill: zero ? COLOR.c : '#e25b45' }, S.ticks);
    e('line', { x1: X, y1: B, x2: X, y2: B + 5 * K, stroke: '#7d6a4f', 'stroke-width': 1.5 }, S.ticks);
    e('text', { x: X, y: B + 20 * Math.sqrt(K), 'text-anchor': 'middle', 'font-size': 13 * Math.sqrt(K), fill: zero ? COLOR.c : '#4a3f30', 'font-weight': zero ? 700 : 400 }, S.ticks).textContent = minus(u);
  }
}

// 4 s 동안 x, v가 지나는 구간과 a로 축을 정한다.
function setRanges() {
  const V0 = v0(), A = acc(), V1 = velocity(V0, A, T_END);
  const want = { x: span(...extent(0, V0, A, T_END)), v: span(Math.min(V0, V1), Math.max(V0, V1)), a: span(Math.min(A, 0), Math.max(A, 0)) };
  for (const key in R) { R[key] = want[key]; G?.range(key, ...want[key]); }
  trackTicks();
}

function draw() {
  if (!S || !G) return;
  const V0 = v0(), A = acc(), x = position(0, V0, A, t), v = velocity(V0, A, t), X = tx(x);
  S.set(S.car, { transform: `translate(${X.toFixed(1)},${S.GY}) scale(${S.CS.toFixed(3)})` });
  const turn = (X - tx(0)) / (10 * S.CS) * 180 / Math.PI;   // 미끄러지지 않고 구르는 바퀴의 회전각(도)
  for (const g of S.spokes) g.setAttribute('transform', `rotate(${turn.toFixed(1)})`);
  S.marks.replaceChildren();
  if ($('strobe').checked) for (let i = 0; i * STROBE <= t + 1e-9; i++)
    S.el('circle', { cx: tx(position(0, V0, A, i * STROBE)), cy: S.GY + S.RT / 2, r: 4.5 * Math.sqrt(S.K), fill: '#ffffff', stroke: COLOR.c, 'stroke-width': 2 }, S.marks);
  const k = scale(), len = { v: k.v0 * v, a: k.a * A };
  for (const key of ['v', 'a']) {
    const y = S.row[key], tip = X + len[key];
    S.AR[key].set(X, y, tip, y);
    S.set(S.LB[key], { x: X - Math.sign(len[key]) * 18 * S.K, y: y + 7 * S.K });   // 글자는 화살표 꼬리 쪽에 둔다
    S.LB[key].style.display = Math.abs(len[key]) < 1 ? 'none' : '';
    S.set(S.H[key], { cx: tip, cy: y });
  }
  const n = Math.max(1, Math.ceil(t * 40));
  G.draw({
    x: Array.from({ length: n + 1 }, (_, i) => { const s = t * i / n; return [s, position(0, V0, A, s)]; }),
    v: [[0, V0], [t, v]],
    a: [[0, A], [t, A]],
  }, t);
  $('tval').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}`);
  $('v0num').innerHTML = tex(`${fmt(V0)}\\ \\mathrm{m/s}`);
  $('anum').innerHTML = tex(`${fmt(A)}\\ \\mathrm{m/s^2}`);
  $('xval').innerHTML = tex(`\\textcolor{#840025}{x - x_0 = ${fmt(x, 2)}\\ \\mathrm{m}}`);
  $('vval').innerHTML = tex(`v = ${fmt(v, 2)}\\ \\mathrm{m/s}`);
}

function reset() { t = 0; setRanges(); draw(); }
const ck = clock({
  step(dt) {
    t = Math.min(T_END, t + dt);
    if (T_END - t < 1e-9) t = T_END;
    draw();
    return t < T_END;
  },
  reset,
  ended: () => t >= T_END,
});
for (const id of ['v0', 'a']) $(id).addEventListener('input', () => { ck.stop(); t = 0; if (!drag) setRanges(); draw(); });
$('strobe').addEventListener('change', draw);
reset();
