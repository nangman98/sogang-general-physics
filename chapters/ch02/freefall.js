// 2장 "자유 낙하" 시뮬레이션(공용 틀 core/simshell.js). 높이 y0인 건물 옥상 모서리에서 공을 처음 속도 v0(위가 +)로 던지고
// 땅(y = 0)에 닿을 때까지 본다. 공기는 무시하고 가속도는 늘 a = −g, g = 9.8 m/s² (교재 2.5).
// 왼쪽 장면은 건물, 공, 높이 자, v(파랑)·a(분홍) 화살표, 오른쪽은 같은 시간축의 y-t, v-t, a-t 그래프다.
// y0는 slider나 공을 위아래로 끌어, v0는 slider나 v 화살표 끝 손잡이를 끌어 정한다. 값을 바꾸면 t = 0으로 돌아간다.
// 위치와 속도는 (2.4.5), (2.4.1)에 a = −g를 넣은 식 그대로 계산한다(오차 없음). 0.5 s마다 공의 위치를 점으로 남긴다.
// 높이 눈금은 가장 높은 곳을 담는 5 m 단위(최소 35 m)이고 그래프의 y 축과 같다. 그래프 시간축은 땅에 닿는 시각을 올림한 정수 초까지다.
// v 화살표는 v 축 끝값(절댓값 큰 쪽)이, a 화살표는 g가 땅 아래 흙 띠에 들어가는 길이다. 손잡이나 공을 끄는 동안에는 눈금을 그대로 둔다.
import { position, velocity, landing, G as g } from './kinematics.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';
import { stage, clock, timeGraphs, bigArrow, stepOf, minus, qty } from '../../core/simshell.js';

const STROBE = 0.5;
const $ = id => document.getElementById(id);
const y0 = () => Number($('y0').value), v0 = () => Number($('v0').value);
let t = 0, drag = null, TOP = 35, VB = 30, tEnd = 4;   // TOP 높이 눈금 끝(m), VB v 축 끝값(m/s), tEnd 그래프 시간축 끝(s)
let S = null, G = null, GK = null;   // 장면, 그래프, 그래프를 다시 만들 때 쓰는 층

// 위아래 끝 값. 가장 높은 곳과 땅에 닿을 때의 속력을 10 m/s 단위로 올림한다.
function setRanges() {
  const Y0 = y0(), V0 = v0(), peak = Y0 + (V0 > 0 ? V0 * V0 / (2 * g) : 0), vl = Math.abs(velocity(V0, -g, landing(Y0, V0)));
  TOP = Math.max(35, 5 * Math.ceil(peak * 1.04 / 5));
  VB = Math.max(10, 10 * Math.ceil(Math.max(Math.abs(V0), vl) / 10 - 1e-9));
  tEnd = Math.max(1, Math.ceil(landing(Y0, V0) - 1e-9));
}
setRanges();

stage($('scene'), k => {
  const { el, set, w, h } = k;
  const K = Math.max(1, Math.min(1.8, h / 240, w / 260)), SB = Math.round(Math.max(60, h * 0.22)), GY = h - SB;
  const RX = w - 30 - 20 * Math.sqrt(K), BX1 = RX - 22 * K, BX0 = Math.max(w * 0.5, BX1 - 260), BR = 8 * K;
  const bx = BX0 - BR - 3, ax = { v: bx - BR - 14 * K, a: bx - BR - 46 * K };
  el('defs').innerHTML = `
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6e7f7"/><stop offset="1" stop-color="#f5f9fc"/></linearGradient>
    <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8956a"/><stop offset="1" stop-color="#8c6a44"/></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3d6c0"/><stop offset="1" stop-color="#c9b89c"/></linearGradient>
    <radialGradient id="ball" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#f1eee4"/><stop offset="1" stop-color="#cfcab9"/></radialGradient>`;
  el('rect', { x: 0, y: 0, width: w, height: GY, fill: 'url(#sky)' });
  const cloud = (cx, cy, s) => el('path', { d: `M${cx - 30 * s},${cy} a${14 * s},${14 * s} 0 0 1 ${22 * s},${-12 * s} a${18 * s},${18 * s} 0 0 1 ${32 * s},${-4 * s} a${12 * s},${12 * s} 0 0 1 ${20 * s},${16 * s} z`, fill: '#ffffff', opacity: 0.9 });
  cloud(w * 0.2, GY * 0.42, 0.9 * K); cloud(w * 0.42, GY * 0.18, 0.7 * K);
  const S0 = { el, set, K, SB, GY, RX, BX0, BX1, BR, bx, ax, toSvg: k.toSvg };
  S0.grid = el('g'); S0.building = el('g');
  // 땅. 풀과 흙 띠(땅에 닿을 때 아래로 향한 화살표가 들어갈 자리)
  el('rect', { x: 0, y: GY, width: w, height: SB, fill: 'url(#soil)' });
  el('rect', { x: 0, y: GY, width: w, height: 7 * K, fill: '#79ae58' });
  el('line', { x1: 0, y1: GY, x2: w, y2: GY, stroke: '#4f7d38', 'stroke-width': 2 });
  // 왼쪽 나무
  const tx0 = w * 0.16, ts = K;
  el('rect', { x: tx0 - 4 * ts, y: GY - 34 * ts, width: 8 * ts, height: 34 * ts, fill: '#8a6a45' });
  el('circle', { cx: tx0, cy: GY - 48 * ts, r: 20 * ts, fill: '#6f9e58' });
  el('circle', { cx: tx0 - 12 * ts, cy: GY - 38 * ts, r: 13 * ts, fill: '#7fae66' });
  el('circle', { cx: tx0 + 13 * ts, cy: GY - 36 * ts, r: 12 * ts, fill: '#679552' });
  S0.ruler = el('g');
  S0.marks = el('g');
  S0.AR = { v: bigArrow(k, COLOR.vel, { bw: 6 * K, hl: 15 * K, hw: 18 * K }), a: bigArrow(k, COLOR.acc, { bw: 6 * K, hl: 15 * K, hw: 18 * K }) };
  S0.LB = { v: k.label('vel', 'v'), a: k.label('acc', 'a') };
  for (const l of Object.values(S0.LB)) l.setAttribute('font-size', 20 * K);
  // 야구공. 공을 위아래로 끌면 y0가 바뀐다(1 m 단위).
  S0.ball = el('g', { style: 'cursor: ns-resize' });
  S0.ball.innerHTML = `<circle r="${BR}" fill="url(#ball)" stroke="#a9a493" stroke-width="1"/>
    <path d="M${-0.55 * BR},${-0.82 * BR} Q${-0.12 * BR},0 ${-0.55 * BR},${0.82 * BR} M${0.55 * BR},${-0.82 * BR} Q${0.12 * BR},0 ${0.55 * BR},${0.82 * BR}" fill="none" stroke="#c8102e" stroke-width="${0.13 * BR}" stroke-dasharray="${0.18 * BR} ${0.12 * BR}"/>`;
  S0.grip = el('circle', { r: 9 * K, fill: '#ffffff', stroke: COLOR.vel, 'stroke-width': 3, style: 'cursor: ns-resize' });
  S = S0;
  const hold = (node, id, value) => {
    node.addEventListener('pointerdown', ev => { ev.preventDefault(); node.setPointerCapture(ev.pointerId); drag = node; ck.stop(); t = 0; draw(); });
    node.addEventListener('pointermove', ev => {
      if (drag !== node) return;
      const s = $(id), val = Math.max(Number(s.min), Math.min(Number(s.max), Math.round(value(k.toSvg(ev).y))));
      if (val !== Number(s.value)) { s.value = val; s.dispatchEvent(new Event('input')); }
    });
    for (const e of ['pointerup', 'pointercancel']) node.addEventListener(e, () => { if (drag === node) { drag = null; reset(); } });
  };
  hold(S.ball, 'y0', Y => (S.GY - S.BR - Y) / px());
  hold(S.grip, 'v0', Y => (cy(y0()) - Y) / (S.AV / VB));
  S.AV = SB - 14 * K;
  drawScale(); draw();
});
stage($('graphs'), k => { GK = { ...k, root: k.el('g') }; buildGraphs(true); });

function px() { return (S.GY - S.BR - 22 * S.K) / TOP; }   // 1 m가 몇 px인가
function cy(y) { return S.GY - S.BR - y * px(); }            // 공 중심의 화면 높이(공 아래쪽이 높이 y)

// 그래프 시간축 끝이 바뀌면 그래프를 새로 만든다.
function buildGraphs(force) {
  if (!GK) return;
  if (force || G?.tEnd !== tEnd) {
    GK.root.replaceChildren();
    const kk = { ...svgKit($('graphs'), GK.root), w: GK.w, h: GK.h };
    G = timeGraphs(kk, { x: 0, y: 0, w: GK.w, h: GK.h, tEnd, panels: [
      { key: 'y', name: qty('y', 'm'), color: COLOR.c },
      { key: 'v', name: qty('v', 'm/s'), color: COLOR.vel },
      { key: 'a', name: qty('a', 'm/s²'), color: COLOR.acc },
    ] });
    G.tEnd = tEnd;
  }
  G.range('y', 0, TOP);
  G.range('v', -VB, v0() > 0 ? Math.max(10, 10 * Math.ceil(v0() / 10)) : 0);
  G.range('a', -10, 0);
  draw();
}

// 높이 자(오른쪽 끝)와 10 m마다 옅은 가로선, 건물(옥상이 y0).
function drawScale() {
  if (!S) return;
  const { el, K, GY, RX, BX0, BX1 } = S, P = px(), f = 13 * Math.sqrt(K);
  S.ruler.replaceChildren(); S.grid.replaceChildren(); S.building.replaceChildren();
  const yb = y => GY - y * P;
  el('rect', { x: RX - 3, y: yb(TOP) - 6, width: 6, height: GY - yb(TOP) + 6, rx: 2, fill: '#ffffff', stroke: '#8a8a8a' }, S.ruler);
  for (let y = 0; y <= TOP + 1e-9; y++) {
    const major = y % 10 === 0, mid = y % 5 === 0, Y = yb(y);
    el('line', { x1: RX - 3 - (major ? 10 : mid ? 7 : 4) * K, y1: Y, x2: RX - 3, y2: Y, stroke: COLOR.ink, 'stroke-width': major ? 1.5 : 1 }, S.ruler);
    if (major) {
      el('text', { x: RX + 8, y: Y + f * 0.35, 'font-size': f, fill: '#333333' }, S.ruler).textContent = String(y);
      if (y > 0) el('line', { x1: 0, y1: Y, x2: RX - 16 * K, y2: Y, stroke: '#c7d6e4', 'stroke-dasharray': '6 6' }, S.grid);
    }
  }
  el('text', { x: RX, y: yb(TOP) - 14, 'text-anchor': 'middle', 'font-size': 15 * Math.sqrt(K) }, S.ruler).innerHTML = qty('y', 'm');
  const Y0 = y0(), top = yb(Y0), W = BX1 - BX0;
  if (Y0 <= 0) return;
  const b = S.building;
  el('rect', { x: BX0, y: top, width: W, height: GY - top, fill: 'url(#wall)', stroke: '#8f7f66', 'stroke-width': 1.5 }, b);
  el('rect', { x: BX0 - 4, y: top - 5 * K, width: W + 8, height: 5 * K, fill: '#a99a80', stroke: '#7d6e56' }, b);
  // 3 m마다 한 층. 층마다 창문 한 줄
  const fl = 3 * P, n = Math.floor(Y0 / 3), cols = Math.max(1, Math.floor((W - 12) / (26 * Math.sqrt(K)))), cw = (W - 12) / cols;
  for (let i = 0; i < n; i++) {
    const fy = GY - (i + 1) * fl;
    for (let j = 0; j < cols; j++) el('rect', { x: BX0 + 6 + j * cw + cw * 0.2, y: fy + fl * 0.25, width: cw * 0.6, height: fl * 0.5, fill: '#8fb3cf', stroke: '#6b8aa3', 'stroke-width': 0.8 }, b);
  }
}

function draw() {
  if (!S || !G) return;
  const Y0 = y0(), V0 = v0(), y = position(Y0, V0, -g, t), v = velocity(V0, -g, t), C = cy(y), K = S.K;
  S.set(S.ball, { transform: `translate(${S.bx.toFixed(1)},${C.toFixed(1)})` });
  S.marks.replaceChildren();
  if ($('strobe').checked) for (let i = 0; i * STROBE <= t + 1e-9; i++)
    S.el('circle', { cx: S.bx, cy: cy(position(Y0, V0, -g, i * STROBE)), r: 4.5 * Math.sqrt(K), fill: '#ffffff', stroke: COLOR.c, 'stroke-width': 2 }, S.marks);
  const len = { v: S.AV * v / VB, a: -S.AV * g / 10 };   // 위가 + (화면에서는 위로)
  for (const key of ['v', 'a']) {
    const X = S.ax[key];
    S.AR[key].set(X, C, X, C - len[key]);
    S.set(S.LB[key], { x: X - 20 * K, y: C - len[key] / 2 + 7 * K });
    S.LB[key].style.display = Math.abs(len[key]) < 1 ? 'none' : '';
  }
  S.set(S.grip, { cx: S.ax.v, cy: C - len.v });
  const n = Math.max(1, Math.ceil(t * 40));
  G.draw({
    y: Array.from({ length: n + 1 }, (_, i) => { const s = t * i / n; return [s, position(Y0, V0, -g, s)]; }),
    v: [[0, V0], [t, v]],
    a: [[0, -g], [t, -g]],
  }, t);
  $('tval').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}`);
  $('y0num').innerHTML = tex(`${fmt(Y0)}\\ \\mathrm{m}`);
  $('v0num').innerHTML = tex(`${fmt(V0)}\\ \\mathrm{m/s}`);
  $('yval').innerHTML = tex(`\\textcolor{#840025}{y - y_0 = ${fmt(y - Y0, 2)}\\ \\mathrm{m}}`);
  $('vval').innerHTML = tex(`v = ${fmt(v, 2)}\\ \\mathrm{m/s}`);
}

const ended = () => t >= landing(y0(), v0()) - 1e-9;
function reset() { t = 0; setRanges(); drawScale(); buildGraphs(); }
const ck = clock({
  step(dt) {
    const T = landing(y0(), v0());
    t = Math.min(T, t + dt);
    draw();
    return t < T - 1e-9;
  },
  reset,
  ended,
});
// 땅(y0 = 0)에서는 아래로 던질 수 없으므로 v0의 아래 끝을 0으로 둔다.
const floorV = () => { $('v0').min = y0() > 0 ? -15 : 0; };
for (const id of ['y0', 'v0']) $(id).addEventListener('input', () => {
  ck.stop(); t = 0; floorV();
  if (!drag) { setRanges(); buildGraphs(); }
  drawScale(); draw();
});
$('strobe').addEventListener('change', draw);
floorV(); reset();
