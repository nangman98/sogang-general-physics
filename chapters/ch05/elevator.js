// 5장 "수직항력" 시뮬레이션(공용 틀 core/simshell.js). 건물 안 엘리베이터 바닥의 저울 위에 질량 m인 사람이 서 있다.
// 처음에 정지해 있던 엘리베이터가 가속도 a_y(위가 +)로 6 s 동안 움직인다. 사람도 엘리베이터와 같은 a_y로 움직인다.
// 저울은 사람을 떠받치는 수직항력 F_N = m(g + a_y)를 잰다(5.2.6). 가속하지 않으면 F_N = mg다(5.2.7). 가속하는 엘리베이터 안에서 잰 눈금이 겉보기 무게다.
// 왼쪽 장면은 건물 단면 속 엘리베이터와 저울 위 사람, v_y(파랑)·a_y(분홍) 화살표, 사람의 자유물체도(점)에 그린 F_N과 F_g(주황), mg 높이의 점선 눈금이다.
// 오른쪽은 같은 시간축의 v_y-t, F_N-t 그래프이고 F_N 칸에도 mg 높이의 점선을 긋는다.
// 화면은 엘리베이터를 따라간다. 엘리베이터는 제자리에 있고 건물의 층(3 m마다)과 승강장 문이 지나간다.
// a_y는 slider나 장면의 a_y 화살표 끝 손잡이를 위아래로 끌어 바꾼다(0.2 m/s² 단위). 재생 중에 바꿔도 멈추지 않는다. 질량을 바꾸면 처음으로 돌아간다.
// 힘 화살표의 배율은 가장 큰 F_N(100 kg, a_y = 9.8 m/s²)과 가장 큰 F_g가 장면 안에 들어가게 정한다.
// a_y 화살표는 9.8 m/s²가, v_y 화살표는 축 구간 끝값(절댓값 큰 쪽)이 ARR(px)이다. ARR은 위쪽 끝이 읽기 카드 아래, 아래쪽 끝이 장면 안에 머물게 정한다.
// 물체·글자는 장면 크기에 맞춰 함께 키운다(배율 K).
// 한 프레임 안에서는 a_y가 일정하므로 y += v dt + a dt²/2, v += a dt로 적분한다(오차 없음).
import { gravity, normalForce, advance } from './newton.js';
import { COLOR, tex, fmt } from '../../core/simkit.js';
import { stage, clock, timeGraphs, bigArrow, span, qty } from '../../core/simshell.js';
import { paints, sub, gsub, halo, panelY } from './scenery.js';

const T_END = 6, A_MAX = 9.8, N_MAX = normalForce(100, A_MAX), G_MAX = gravity(100), FLOOR = 3, CAB_M = 2.8;   // 층 높이 3 m, 엘리베이터 안 높이 2.8 m
const $ = id => document.getElementById(id);
const ay = () => Number($('ay').value), m = () => Number($('m').value);
let t = 0, y = 0, v = 0, hist = [{ t: 0, v: 0, N: 0 }];
const R = { v: [-5, 5], N: [0, 1000] };
let S = null, G = null;   // 장면과 그래프. 화면 크기가 바뀌면 stage가 다시 만든다.

stage($('scene'), k => {
  const { el, set, w, h } = k;
  const U = Math.min(h, 0.75 * w), K = Math.max(1, Math.min(1.8, U / 240));
  const cabH = 0.6 * U, cabW = 0.62 * cabH, cx = 0.52 * w, bot = h - 0.07 * h, cy = bot - cabH / 2, top = bot - cabH;
  const wall = 6 * K, inH = cabH - 2 * wall, floorY = bot - wall - 8 * K, PXM = inH / CAB_M, shaft = cabW / 2 + 10 * K, halfB = shaft + 16 * K;
  paints(el);
  el('defs').innerHTML = `
    <linearGradient id="cabin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6eee0"/><stop offset="1" stop-color="#e2d3bb"/></linearGradient>
    <linearGradient id="shaft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3e4750"/><stop offset="0.5" stop-color="#56616c"/><stop offset="1" stop-color="#3e4750"/></linearGradient>`;
  el('rect', { x: 0, y: 0, width: w, height: h, fill: 'url(#sky)' });
  // 건물 단면. 벽(콘크리트)과 승강로(어두운 색), 승강로 안 레일. 층 바닥판과 승강장 문은 floors 층에 흘려 그린다.
  el('rect', { x: cx - halfB, y: 0, width: 2 * halfB, height: h, fill: '#ddd6ca' });
  el('rect', { x: cx - shaft, y: 0, width: 2 * shaft, height: h, fill: 'url(#shaft)' });
  const floors = el('g');
  for (const s of [-1, 1]) el('line', { x1: cx + s * (cabW / 2 + 4 * K), y1: 0, x2: cx + s * (cabW / 2 + 4 * K), y2: h, stroke: '#262c32', 'stroke-width': 2.5 * K });
  // 줄과 엘리베이터 칸. 칸 위 들보에 줄 세 가닥이 매여 있다.
  for (const dx of [-0.12, 0, 0.12]) el('line', { x1: cx + dx * cabW, y1: 0, x2: cx + dx * cabW, y2: top - 6 * K, stroke: '#5b6670', 'stroke-width': 1.8 * K });
  el('rect', { x: cx - 0.36 * cabW, y: top - 8 * K, width: 0.72 * cabW, height: 9 * K, rx: 2, fill: 'url(#steelv)', stroke: '#4c565f', 'stroke-width': 1.2 });
  el('rect', { x: cx - cabW / 2, y: top, width: cabW, height: cabH, rx: 3 * K, fill: '#8d98a3', stroke: '#4c565f', 'stroke-width': 1.5 });
  el('rect', { x: cx - cabW / 2 + wall, y: top + wall, width: cabW - 2 * wall, height: inH, fill: 'url(#cabin)' });
  el('rect', { x: cx - cabW / 2 + wall, y: top + wall, width: cabW - 2 * wall, height: 5 * K, fill: '#fffbe8' });
  el('line', { x1: cx - cabW / 2 + wall, y1: floorY - 0.5 * inH, x2: cx + cabW / 2 - wall, y2: floorY - 0.5 * inH, stroke: '#a7afb6', 'stroke-width': 3 * K, 'stroke-linecap': 'round' });
  el('rect', { x: cx - cabW / 2 + wall, y: floorY, width: cabW - 2 * wall, height: bot - wall - floorY, fill: '#6b5f55' });
  // 저울(바늘이 수직항력에 비례해 돈다)과 사람.
  const sw = 0.5 * cabW, sh = 0.075 * cabH, sTop = floorY - sh;
  el('rect', { x: cx - sw / 2, y: sTop, width: sw, height: sh, rx: sh * 0.35, fill: '#eef1f3', stroke: '#6f7a84', 'stroke-width': 1.5 });
  el('rect', { x: cx - sw / 2 + 2, y: sTop, width: sw - 4, height: sh * 0.28, rx: 2, fill: '#c9d0d6' });
  const dial = { x: cx + sw * 0.28, y: sTop + sh * 0.6, r: sh * 0.32 };
  el('circle', { cx: dial.x, cy: dial.y, r: dial.r, fill: '#ffffff', stroke: '#6f7a84', 'stroke-width': 1 });
  const needle = el('line', { x1: dial.x, y1: dial.y, stroke: COLOR.c, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
  const person = el('g');
  // 오른쪽 자유물체도. 점의 높이는 위아래로 가장 긴 화살표가 똑같이 들어가는 곳이다.
  const fx = 0.85 * w, fy = (2 * h - 46) / 3, KN = (fy - 14) / N_MAX;
  const mgTick = el('line', { stroke: '#8a8a8a', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
  const mgLab = el('text', { 'text-anchor': 'end', 'font-size': 16 * Math.sqrt(K), 'font-style': 'italic', 'font-family': 'Times New Roman, serif', fill: '#6b6b6b' });
  mgLab.textContent = 'mg'; halo(mgLab);
  const arr = c => bigArrow(k, c, { bw: 7 * K, hl: 15 * K, hw: 17 * K }), thin = c => bigArrow(k, c, { bw: 6 * K, hl: 14 * K, hw: 16 * K });
  S = { el, set, toSvg: k.toSvg, K, h, cx, cy, cabW, inH, floorY, sTop, PXM, shaft, halfB, floors, needle, dial, person, fx, fy, KN, mgTick, mgLab,
    xa: 0.25 * w, xv: 0.13 * w, ARR: Math.max(40, Math.min(0.32 * h, cy - 140, h - cy - 12 * K)),
    AR: { N: arr(COLOR.b), g: arr(COLOR.b), a: thin(COLOR.acc), v: thin(COLOR.vel) },
    LB: { N: k.label('b', ''), g: k.label('b', ''), a: k.label('acc', ''), v: k.label('vel', '') } };
  el('circle', { cx: fx, cy: fy, r: 5 * K, fill: COLOR.ink });
  S.LB.N.innerHTML = sub('F', 'N'); S.LB.g.innerHTML = sub('F', 'g'); S.LB.a.innerHTML = sub('a', 'y'); S.LB.v.innerHTML = sub('v', 'y');
  for (const l of Object.values(S.LB)) { l.setAttribute('font-size', 20 * K); l.setAttribute('text-anchor', 'start'); halo(l); }
  for (const key of ['a', 'v']) S.LB[key].setAttribute('text-anchor', 'end');
  // a_y 화살표 끝 손잡이. 누르면 장면 svg가 포인터를 잡아, 끄는 동안 장면을 다시 그려도 끌기가 이어진다.
  S.grip = el('circle', { r: 9 * K, fill: '#ffffff', 'fill-opacity': 0.35, stroke: COLOR.acc, 'stroke-width': 3, style: 'cursor: ns-resize' });
  S.grip.addEventListener('pointerdown', ev => { ev.preventDefault(); drag = true; $('scene').setPointerCapture(ev.pointerId); });
  drawPerson(); draw();
});
// 끄는 동안 a_y는 손잡이 높이로 정한다(0.2 m/s² 단위, 위가 +).
let drag = false;
$('scene').addEventListener('pointermove', ev => {
  if (!drag || !S) return;
  const a = Math.round((S.cy - S.toSvg(ev).y) * A_MAX / S.ARR / 0.2) * 0.2, f = +Math.max(-A_MAX, Math.min(A_MAX, a)).toFixed(1);
  if (f !== ay()) { $('ay').value = f; $('ay').dispatchEvent(new Event('input')); }
});
for (const e of ['pointerup', 'pointercancel']) $('scene').addEventListener(e, () => { drag = false; });

stage($('graphs'), k => {
  G = timeGraphs(k, { x: 0, y: 0, w: k.w, h: k.h, tEnd: T_END, panels: [
    { key: 'v', name: qty(gsub('v', 'y'), 'm/s'), color: COLOR.vel },
    { key: 'N', name: qty(gsub('F', 'N'), 'N'), color: COLOR.c },
  ] });
  G.w = k.w; G.h = k.h;
  G.mg = k.el('line', { x1: 58, x2: k.w - 24, stroke: '#8a8a8a', 'stroke-width': 1.5, 'stroke-dasharray': '6 5' });
  G.mgLab = k.el('text', { x: k.w - 30, 'text-anchor': 'end', 'font-size': 17, 'font-style': 'italic', 'font-family': 'Times New Roman, serif', fill: '#6b6b6b' });
  G.mgLab.textContent = 'mg';
  for (const key in R) G.range(key, ...R[key]);
  draw();
});

// 서 있는 사람. 발바닥 가운데가 (0, 0), 키 P(px). 질량이 클수록 몸통·팔다리를 넓게 그린다.
function drawPerson() {
  if (!S) return;
  const g = S.person, e = S.el, P = 0.62 * S.inH, wf = 0.85 + 0.35 * (m() - 30) / 70;
  g.replaceChildren();
  S.set(g, { transform: `translate(${S.cx.toFixed(1)},${S.sTop.toFixed(1)})` });
  const skin = '#f0c6a0', line = { stroke: '#5a4636', 'stroke-width': 1.2 };
  for (const s of [-1, 1]) {
    e('rect', { x: s * 0.062 * P * wf - 0.045 * P * wf, y: -0.47 * P, width: 0.09 * P * wf, height: 0.45 * P, rx: 0.03 * P, fill: '#3d4554', ...line }, g);
    e('ellipse', { cx: s * 0.075 * P * wf, cy: -0.02 * P, rx: 0.06 * P, ry: 0.025 * P, fill: '#2b2522' }, g);
    e('rect', { x: s * (0.165 * P * wf) - 0.035 * P, y: -0.79 * P, width: 0.07 * P, height: 0.31 * P, rx: 0.035 * P, fill: '#2f6f9f', ...line }, g);
    e('circle', { cx: s * 0.165 * P * wf, cy: -0.47 * P, r: 0.035 * P, fill: skin, ...line }, g);
  }
  e('rect', { x: -0.15 * P * wf, y: -0.81 * P, width: 0.3 * P * wf, height: 0.38 * P, rx: 0.05 * P, fill: '#3b82b8', ...line }, g);
  e('rect', { x: -0.03 * P, y: -0.86 * P, width: 0.06 * P, height: 0.06 * P, fill: skin }, g);
  e('circle', { cx: 0, cy: -0.92 * P, r: 0.075 * P, fill: skin, ...line }, g);
  e('path', { d: `M${-0.078 * P},${-0.93 * P} A${0.078 * P},${0.078 * P} 0 0 1 ${0.078 * P},${-0.93 * P} Q0,${-0.96 * P} ${-0.078 * P},${-0.93 * P} Z`, fill: '#3a2a20' }, g);
}

// 층 바닥판과 승강장 문. 층 n의 바닥 높이는 n × 3 m이고 칸 바닥(y)보다 높을수록 위에 그린다.
function drawFloors() {
  const { el, floors, floorY, PXM, cx, cabW, shaft, halfB, h, K } = S;
  floors.replaceChildren();
  const slab = 9 * K, doorH = 2.1 * PXM, doorW = 0.56 * cabW;
  const n0 = Math.floor((y - (h + 40 - floorY) / PXM) / FLOOR), n1 = Math.ceil((y + (floorY + 40 + doorH) / PXM) / FLOOR);
  for (let n = n0; n <= n1; n++) {
    const Y = floorY + (y - n * FLOOR) * PXM;
    el('rect', { x: cx - doorW / 2, y: Y - doorH, width: doorW, height: doorH, fill: '#77828d', stroke: '#2f363d', 'stroke-width': 1.5 }, floors);
    el('line', { x1: cx, y1: Y - doorH, x2: cx, y2: Y, stroke: '#2f363d', 'stroke-width': 1.2 }, floors);
    for (const s of [-1, 1]) el('rect', { x: s < 0 ? cx - halfB : cx + shaft, y: Y, width: halfB - shaft, height: slab, fill: '#b3aa9b', stroke: '#8d8475', 'stroke-width': 1 }, floors);
  }
}

// 지금의 a_y가 끝까지 유지될 때 남은 시간 동안 v가 지나는 구간과, F_N·mg를 담는 구간으로 축을 정한다. fresh가 아니면 좁히지 않는다.
function setRanges(fresh) {
  const a = ay(), rest = T_END - t, vs = [v, v + a * rest];
  const want = { v: span(Math.min(...vs), Math.max(...vs)), N: span(0, Math.max(gravity(m()), normalForce(m(), a))) };
  for (const key in R) {
    const r = fresh ? want[key] : [Math.min(R[key][0], want[key][0]), Math.max(R[key][1], want[key][1])];
    if (r[0] !== R[key][0] || r[1] !== R[key][1]) { R[key] = r; G?.range(key, ...r); }
  }
}

function draw() {
  if (!S || !G) return;
  const a = ay(), N = normalForce(m(), a), Fg = gravity(m()), K = S.K, show = (e, on) => { e.style.display = on ? '' : 'none'; };
  drawFloors();
  // 저울 바늘. 0 N에서 왼쪽 아래, 가장 큰 F_N에서 오른쪽 아래(270°).
  const th = (-225 + 270 * N / N_MAX) * Math.PI / 180, r = S.dial.r * 0.85;
  S.set(S.needle, { x2: S.dial.x + r * Math.cos(th), y2: S.dial.y + r * Math.sin(th) });
  // 자유물체도. F_N은 위, F_g는 아래. 점선은 F_N이 mg일 때 화살표 끝이 오는 높이다.
  const { fx, fy, KN } = S, up = fy - KN * N, dn = fy + KN * Fg, ym = fy - KN * Fg;
  S.AR.N.set(fx, fy, fx, up); S.AR.g.set(fx, fy, fx, dn);
  S.set(S.LB.N, { x: fx + 14 * K, y: up + 14 * K }); show(S.LB.N, N > 1);
  S.set(S.LB.g, { x: fx + 14 * K, y: dn });
  S.set(S.mgTick, { x1: fx - 26 * K, y1: ym, x2: fx + 26 * K, y2: ym });
  S.set(S.mgLab, { x: fx - 30 * K, y: ym + 5 * K });
  // 엘리베이터(와 사람)의 가속도와 속도. 칸 가운데 높이에서 위아래로 그리고, 이름은 시작점 왼쪽에 단다.
  const big = q => Math.max(-q[0], q[1]), len = { a: S.ARR * a / A_MAX, v: S.ARR * v / big(R.v) }, xs = { a: S.xa, v: S.xv };
  for (const key of ['a', 'v']) {
    S.AR[key].set(xs[key], S.cy, xs[key], S.cy - len[key]);
    S.set(S.LB[key], { x: xs[key] - 12 * K, y: S.cy + 7 * K });
  }
  S.set(S.grip, { cx: S.xa, cy: S.cy - len.a });
  // F_N은 프레임마다 일정했으므로 계단으로 잇는다. 시작 전에는 지금 a_y로 정해진 값 한 점이다.
  G.draw({
    v: hist.map(p => [p.t, p.v]),
    N: hist.length > 1 ? hist.slice(1).flatMap((p, i) => [[hist[i].t, p.N], [p.t, p.N]]) : [[0, N]],
  }, t);
  const gy = panelY({ h: G.h, n: 2, i: 1, lo: R.N[0], hi: R.N[1] }, Fg);
  S.set(G.mg, { y1: gy, y2: gy }); S.set(G.mgLab, { y: gy - 6 });
  $('tval').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}`);
  $('ayval').innerHTML = tex(`${fmt(a)}\\ \\mathrm{m/s^2}`);
  $('mval').innerHTML = tex(`${fmt(m(), 0)}\\ \\mathrm{kg}`);
  $('Nval').innerHTML = tex(`\\textcolor{#840025}{F_N = ${fmt(N, 1)}\\ \\mathrm{N}}`);
  $('gval').innerHTML = tex(`F_g = mg = ${fmt(Fg, 1)}\\ \\mathrm{N}`);
  $('vval').innerHTML = tex(`v_y = ${fmt(v, 2)}\\ \\mathrm{m/s}`);
}

function reset() {
  t = 0; y = 0; v = 0; hist = [{ t: 0, v: 0, N: 0 }];
  setRanges(true); draw();
}
const ck = clock({
  step(dt) {
    dt = Math.min(dt, T_END - t);
    const a = ay();
    [y, v] = advance(y, v, a, dt); t += dt;
    if (T_END - t < 1e-9) t = T_END;
    hist.push({ t, v, N: normalForce(m(), a) });
    draw();
    return t < T_END;
  },
  reset,
  ended: () => t >= T_END,
});
$('ay').addEventListener('input', () => {
  if (t >= T_END) return reset();
  setRanges(t === 0 && !ck.running); draw();
});
$('m').addEventListener('input', () => { ck.stop(); drawPerson(); reset(); });
reset();
