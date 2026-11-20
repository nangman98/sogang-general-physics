// 4장 "상대 운동" 시뮬레이션(공용 틀 core/simshell.js). 강폭 24 m의 강을 모터보트 P가 건넌다. A는 강가, B는 강물(기준틀). 위에서 본 모습이다.
// x는 강물이 흐르는 쪽(오른쪽), y는 건너는 쪽(위). 보트는 아래 강가의 선착장에서 떠나고, 건너편 깃발은 똑바로 건넌 자리(x = 0)다.
// 보트에는 강물에서 본 속도 v_PB(파랑), 그 끝에 강가에서 본 강물의 속도 v_BA(초록), 둘을 더한 강가에서 본 보트의 속도 v_PA(빨강, 빨간 식 4.7.2)를 단다.
// 뱃머리는 v_PB 쪽을 향한다. 뱃머리 각은 똑바로 건너는 방향에서 상류 쪽(−x)으로 잰 각이고 −60°에서 60°까지다.
// v_PB와 뱃머리 각은 slider나 v_PB 화살표 끝 손잡이를 끌어 바꾼다. 바꾸면 처음으로 돌아간다.
// 기준틀을 강물 B로 바꾸면 강물과 함께 움직이며 본다. 물결은 멈춰 있고 강가가 −v_BA로 밀려가며, 보트는 v_PB 쪽으로 곧게 간다.
// 강물 표시는 강가 A에서 볼 때 재생하면 강물의 속력 v_BA로 흘러간다(사용자 2026-11-16 "강물 속도 고정").
// 보여 줄 값은 빨간 식의 v_PA, 건너는 시간, 떠내려간 거리다(사용자 2026-11-16). 떠내려간 거리가 음수면 상류 쪽에 닿은 것이다.
// 장면 축척은 두 기준틀의 출발점과 도착점이 모두 들어가고 왼쪽 위 읽기 칸을 비키는 값을 사다리에서 고른다(설정을 바꿀 때만, 끄는 동안에는 그대로).
// 위치는 일정한 속도라 x = v t로 바로 계산한다(오차 없음). 보트·화살표·글자는 장면 높이에 맞춰 함께 키운다(배율 K).
import { boat } from './motion.js';
import { COLOR, tex, fmt } from '../../core/simkit.js';
import { stage, clock, bigArrow, minus, qty } from '../../core/simshell.js';
import { place, tickStep, sym, grip } from './view.js';

const D = 24;
const $ = id => document.getElementById(id);
const num = id => Number($(id).value), B = () => boat(num('vPB'), num('vBA'), num('th'), D), frameB = () => $('frame').value === 'B';
let t = 0, S = null, dragging = false;

stage($('scene'), k => {
  const { el, w, h } = k, K = Math.max(1, Math.min(1.8, h / 240));
  const TB = w >= 700 ? 118 : 30 * K, BB = 44 * K, riverMax = h - TB - BB;   // TB는 위쪽 강가 띠(읽기 칸이 들어간다), BB는 아래쪽 강가 띠
  el('defs').innerHTML = `
    <linearGradient id="water4r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0ea"/><stop offset="0.5" stop-color="#b9def1"/><stop offset="1" stop-color="#9fd0ea"/></linearGradient>
    <linearGradient id="grass4r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7d796"/><stop offset="1" stop-color="#a6cc80"/></linearGradient>`;
  el('rect', { x: 0, y: 0, width: w, height: h, fill: 'url(#grass4r)' });
  S = { k, el, set: k.set, K, w, h, TB, BB, riverMax, KV: Math.min(9 * K, riverMax / 22), LB: 16 * K,
    land: el('g'), water: el('g'), decor: el('g'), tags: el('g'),
    preview: el('line', { 'stroke-width': 2, 'stroke-dasharray': '6 7', opacity: 0.55 }),
    trail: el('line', { 'stroke-width': 3, 'stroke-dasharray': '9 6' }) };
  // 모터보트(위에서 본 모습). (0, 0)이 보트 중심이고 뱃머리가 +x 쪽이다. 뒤에 흰 물살.
  const L = 34 * K, W = 13 * K;
  S.boat = el('g');
  el('path', { d: `M${-L / 2},${-W * 0.3} l${-20 * K},${-W * 0.55} M${-L / 2},${W * 0.3} l${-20 * K},${W * 0.55}`, stroke: '#ffffff', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.85 }, S.boat);
  el('rect', { x: -L / 2 - 6 * K, y: -3 * K, width: 6 * K, height: 6 * K, rx: 1.5 * K, fill: '#333333' }, S.boat);
  el('path', { d: `M${L / 2},0 Q${L * 0.22},${-W / 2} ${-L * 0.3},${-W / 2} L${-L / 2},${-W * 0.42} L${-L / 2},${W * 0.42} L${-L * 0.3},${W / 2} Q${L * 0.22},${W / 2} ${L / 2},0 Z`, fill: '#fbfbfb', stroke: '#3a3a3a', 'stroke-width': 1.5 }, S.boat);
  el('path', { d: `M${L * 0.36},0 Q${L * 0.16},${-W * 0.36} ${-L * 0.26},${-W * 0.36} L${-L * 0.42},${-W * 0.3} L${-L * 0.42},${W * 0.3} L${-L * 0.26},${W * 0.36} Q${L * 0.16},${W * 0.36} ${L * 0.36},0 Z`, fill: '#d9a066' }, S.boat);
  for (const x of [-L * 0.25, L * 0.02]) el('rect', { x, y: -W * 0.36, width: 3.5 * K, height: W * 0.72, fill: '#8a5a2b' }, S.boat);
  el('path', { d: `M${L * 0.2},${-W * 0.3} L${L * 0.1},${-W * 0.36} L${L * 0.1},${W * 0.36} L${L * 0.2},${W * 0.3} Z`, fill: '#5b7d99' }, S.boat);
  const size = { bw: 5 * K, hl: 13 * K, hw: 15 * K };
  S.PA = bigArrow(k, COLOR.c, size); S.PB = bigArrow(k, COLOR.vel, size); S.BA = bigArrow(k, COLOR.water, size);
  S.lPA = sym(k, COLOR.c, 'v', 'PA', S.LB); S.lPB = sym(k, COLOR.vel, 'v', 'PB', S.LB); S.lBA = sym(k, COLOR.water, 'v', 'BA', S.LB);
  // v_PB 화살표 끝 손잡이. 보트에서 손잡이까지 길이로 v_PB(0.5 m/s 단위), 방향으로 뱃머리 각(1° 단위)을 정한다.
  S.grip = grip(k, COLOR.vel, { r: 8 * K,
    move(p) {
      const dx = (p.x - S.bx) / S.KV, dy = (S.by - p.y) / S.KV;   // 지금 보트 자리에서 잰다
      const nv = Math.max(2, Math.min(6, Math.round(Math.hypot(dx, dy) * 2) / 2));
      const nth = Math.max(-60, Math.min(60, Math.round(Math.atan2(-dx, Math.max(dy, 0.01)) * 180 / Math.PI)));
      if (nv !== num('vPB') || nth !== num('th')) { dragging = true; $('vPB').value = nv; $('th').value = nth; changed(); }
    },
    end() { dragging = false; refit(); },
  });
  refit();
});

// 축척과 강의 자리, 강가 꾸밈(나무·선착장·깃발·눈금), 물결을 다시 만든다. 설정을 바꿀 때만 부른다.
function refit() {
  if (!S) return;
  const { el, K, w, h, TB, BB, KV } = S, b = B(), xB = b.PB[0] * b.time;
  const cardR = 250;   // 읽기 칸 오른쪽 끝(px)
  const lo0 = 30 + KV * 5.5, hi = w - 30 - KV * 9, loTop = w >= 700 ? cardR + KV * 5.5 : lo0;
  const pl = place([{ x: 0, lo: lo0, hi }, { x: b.drift, lo: loTop, hi }, { x: xB, lo: loTop, hi }], S.riverMax / D);
  const s = S.s = pl.s; S.X0 = pl.X0;
  const Yt = S.Yt = TB + (S.riverMax - D * s) / 2, Yb = S.Yb = Yt + D * s, sand = 6 * K;
  S.land.replaceChildren();
  el('rect', { x: 0, y: Yt - sand, width: w, height: sand, fill: '#e6d7a8' }, S.land);
  el('rect', { x: 0, y: Yb, width: w, height: sand, fill: '#e6d7a8' }, S.land);
  el('rect', { x: 0, y: Yt, width: w, height: Yb - Yt, fill: 'url(#water4r)' }, S.land);
  for (const y of [Yt, Yb]) el('line', { x1: 0, y1: y, x2: w, y2: y, stroke: '#6f8f6a', 'stroke-width': 1.5 }, S.land);
  // 물결. 강물(B)에 붙어 있어 강가에서 보면 v_BA로 흘러간다.
  S.water.replaceChildren(); S.waves = [];
  const rows = Math.max(2, Math.round((Yb - Yt) / (34 * K))), gap = 120 * K;
  for (let i = 0; i < rows; i++) for (let x = -gap; x < w + gap; x += gap) {
    const e = el('path', { d: `M0,0 q${5 * K},${-3.5 * K} ${10 * K},0 t${10 * K},0`, fill: 'none', stroke: '#ffffff', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.75 }, S.water);
    S.waves.push({ e, x: x + (i % 2) * gap / 2 + 17 * ((i * 7) % 5), y: Yt + (i + 0.5) * (Yb - Yt) / rows });
  }
  // 강가에 붙은 것들. 기준틀 B에서는 이 묶음이 통째로 −v_BA로 밀려간다.
  S.decor.replaceChildren();
  const X = u => S.X0 + s * u, uL = (-S.X0 - 60) / s, uR = (w - S.X0 + 60 + s * 3 * b.time) / s;
  const treeGap = 130 * K / s;
  for (let u = Math.floor(uL / treeGap) * treeGap; u <= uR; u += treeGap) {
    const j = Math.abs(Math.sin(u * 12.9898)) , tx = X(u) + 40 * K * j, ty = Yt - sand - 20 * K - 14 * K * j;
    if (ty - 16 * K < 0) continue;
    el('circle', { cx: tx + 2, cy: ty + 3, r: 15 * K, fill: '#5c8a45', opacity: 0.35 }, S.decor);
    el('circle', { cx: tx, cy: ty, r: 15 * K, fill: '#4f8a3c' }, S.decor);
    el('circle', { cx: tx - 4 * K, cy: ty - 4 * K, r: 7 * K, fill: '#6aa552' }, S.decor);
  }
  // 건너편 깃발(x = 0, 똑바로 건넌 자리)과 아래 선착장(출발점)
  const fx = X(0), fy = Yt - sand;
  el('line', { x1: fx, y1: fy, x2: fx, y2: fy - 34 * K, stroke: '#4a4a4a', 'stroke-width': 2.2 }, S.decor);
  el('path', { d: `M${fx},${fy - 34 * K} l${18 * K},${6 * K} l${-18 * K},${6 * K} Z`, fill: '#E69F00' }, S.decor);
  el('rect', { x: fx - 11 * K, y: Yb - 5 * K, width: 22 * K, height: sand + 20 * K, fill: '#b98048', stroke: '#6e4520', 'stroke-width': 1.5 }, S.decor);
  for (let i = 1; i < 4; i++) el('line', { x1: fx - 11 * K, y1: Yb - 5 * K + i * (sand + 20 * K) / 4, x2: fx + 11 * K, y2: Yb - 5 * K + i * (sand + 20 * K) / 4, stroke: '#6e4520', 'stroke-width': 1 }, S.decor);
  const fs = 13 * Math.sqrt(K), st = tickStep(s, 64 * K), yt = h - 22 * K;
  for (let u = Math.ceil(uL / st) * st; u <= uR; u += st) {
    el('line', { x1: X(u), y1: yt - 7 * K, x2: X(u), y2: yt, stroke: '#4a5a3a', 'stroke-width': 1.5 }, S.decor);
    el('text', { x: X(u), y: yt + 15 * K, 'text-anchor': 'middle', 'font-size': fs, fill: '#33402a' }, S.decor).textContent = minus(+u.toPrecision(6));
  }
  // 이름표(고정)
  S.tags.replaceChildren();
  const tag = (x, y, txt) => { el('text', { x, y, 'font-size': 14 * Math.sqrt(K), fill: '#2f3d2a', stroke: '#ffffff', 'stroke-width': 3, 'paint-order': 'stroke' }, S.tags).textContent = txt; };
  tag(12, Yb + sand + 18 * K, '강가 A');
  tag(12, Yt + 20 * K, '강물 B');
  el('text', { x: w - 10, y: yt - 12 * K, 'text-anchor': 'end', 'font-size': 15 * Math.sqrt(K), stroke: '#a6cc80', 'stroke-width': 4, 'paint-order': 'stroke' }, S.tags).innerHTML = qty('x', 'm');
  draw();
}

// 화살표 이름을 화살표 가운데에서 왼쪽(side = 1) 또는 오른쪽(side = −1)으로 비켜 단다.
function nameAt(lab, x1, y1, x2, y2, side, off) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = (y2 - y1) / L, ny = -(x2 - x1) / L;
  S.set(lab, { x: (x1 + x2) / 2 + side * nx * off, y: (y1 + y2) / 2 + side * ny * off + 6 * S.K });
  lab.style.display = L >= 10 ? '' : 'none';
}

function draw() {
  if (!S) return;
  const { set, K, KV, s, X0, Yb } = S, b = B(), inB = frameB(), tc = Math.min(t, b.time);
  const vel = inB ? b.PB : b.PA, X = S.bx = X0 + s * vel[0] * tc, Y = S.by = Yb - s * vel[1] * tc;
  // 물결은 강물에, 꾸밈은 강가에 붙어 있다. 기준틀 B에서는 강가가 −v_BA로 밀린다.
  const flow = inB ? 0 : s * b.BA[0] * tc, span = S.w + 240 * K;
  for (const q of S.waves) set(q.e, { transform: `translate(${(((q.x + flow + 120 * K) % span + span) % span - 120 * K).toFixed(1)},${q.y.toFixed(1)})` });
  set(S.decor, { transform: `translate(${(inB ? -s * b.BA[0] * tc : 0).toFixed(1)},0)` });
  const col = inB ? COLOR.vel : COLOR.c, endX = X0 + s * vel[0] * b.time, endY = Yb - s * vel[1] * b.time;
  set(S.preview, { x1: X0, y1: Yb, x2: endX, y2: endY, stroke: col });
  set(S.trail, { x1: X0, y1: Yb, x2: X, y2: Y, stroke: col });
  S.trail.style.display = tc > 0 ? '' : 'none';
  set(S.boat, { transform: `translate(${X.toFixed(1)},${Y.toFixed(1)}) rotate(${(Math.atan2(-b.PB[1], b.PB[0]) * 180 / Math.PI).toFixed(1)})` });
  const P1 = [X + KV * b.PB[0], Y - KV * b.PB[1]], P2 = [P1[0] + KV * b.BA[0], P1[1]], PA = [X + KV * b.PA[0], Y - KV * b.PA[1]];
  S.PB.set(X, Y, ...P1);
  S.BA.set(...P1, ...P2); S.PA.set(X, Y, ...PA);
  nameAt(S.lPB, X, Y, ...P1, 1, 18 * K);
  set(S.lBA, { x: (P1[0] + P2[0]) / 2, y: P1[1] - 12 * K }); S.lBA.style.display = KV * b.BA[0] >= 10 ? '' : 'none';
  nameAt(S.lPA, X, Y, ...PA, -1, 20 * K);
  if (inB) for (const e of [S.BA.g, S.PA.g, S.lBA, S.lPA]) e.style.display = 'none';
  set(S.grip, { cx: P1[0], cy: P1[1] });
  $('tval').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}`);
  for (const id of ['vPB', 'vBA']) $(id + 'val').innerHTML = tex(`${fmt(num(id))}\\ \\mathrm{m/s}`);
  const th = num('th');
  $('thval').innerHTML = (th > 0 ? '상류 쪽 ' : th < 0 ? '하류 쪽 ' : '') + tex(`${Math.abs(th)}^\\circ`);
  $('PAval').innerHTML = tex(`\\textcolor{#840025}{\\vec v_{PA} = (${fmt(b.PA[0], 2)},\\ ${fmt(b.PA[1], 2)})\\ \\mathrm{m/s}}`);
  $('timeval').innerHTML = `건너는 시간 ${tex(`${fmt(b.time, 2)}\\ \\mathrm{s}`)}`;
  $('driftval').innerHTML = `떠내려간 거리 ${tex(`${fmt(b.drift, 1)}\\ \\mathrm{m}`)}`;
}

function changed() { ck.stop(); t = 0; if (dragging) draw(); else refit(); }
const ck = clock({
  step(dt) { const tc = B().time; t = Math.min(tc, t + dt); draw(); return t < tc; },
  reset() { t = 0; draw(); },
  ended: () => t >= B().time - 1e-12,
});
for (const id of ['vPB', 'vBA', 'th']) $(id).addEventListener('input', changed);
$('frame').addEventListener('change', draw);
draw();
