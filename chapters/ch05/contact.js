// 5장 "뉴턴의 제3법칙" 시뮬레이션(공용 틀 core/simshell.js). 마찰 없는 바닥에 맞닿아 정지해 있던 나무 상자 A(왼쪽), B(오른쪽)를 수평 힘 F로 6 s 동안 민다.
// F > 0이면 A를 왼쪽에서, F < 0이면 B를 오른쪽에서 민다. 두 상자는 a = F/(m_A + m_B)로 함께 가속한다(5.3.2).
// 맞닿은 면에서 B가 A에 주는 힘 F_AB와 A가 B에 주는 힘 F_BA는 짝힘이다. 늘 크기가 같고 방향이 반대다(5.3.1).
// 왼쪽 장면은 바닥 위 두 상자와 F(주황), F_AB·F_BA(진한 빨강), a(분홍), v(파랑) 화살표, 오른쪽은 같은 시간축의 F_BA-t, F_AB-t 그래프다.
// 짝힘 화살표는 맞닿은 면 위쪽에서 시작해 그 힘을 받는 상자 쪽으로 뻗고, 미는 힘 화살표는 미는 상자의 바깥 면 아래쪽에 닿는다.
// 화면은 상자를 따라간다. 맞닿은 면이 늘 장면 가운데에 있고 바닥 눈금(x, m)이 흘러간다.
// F는 slider나 장면의 F 화살표 꼬리 손잡이를 끌어 바꾼다. 손잡이를 A 왼쪽으로 끌면 F > 0, B 오른쪽으로 끌면 F < 0이다.
// 재생 중에 바꿔도 멈추지 않는다. 질량을 바꾸면 처음으로 돌아간다.
// 상자 한 변은 질량의 세제곱근에 비례한다(같은 재질이면 부피가 질량에 비례). x는 두 상자가 맞닿은 면의 위치다.
// 상자·화살표·글자는 장면 높이에 맞춰 함께 키운다(배율 K, 1.8배까지). 힘 화살표는 20 N이 ARROW(px)다.
// 한 프레임 안에서는 a가 일정하므로 x += v dt + a dt²/2, v += a dt로 적분한다(오차 없음).
// 축 구간은 지금의 F가 끝까지 유지될 때 지나는 값을 0과 함께 담는 1·2·5 끝값으로 고르고, 재생 중에는 넓어지기만 한다.
import { contact, advance } from './newton.js';
import { COLOR, tex, fmt } from '../../core/simkit.js';
import { stage, clock, timeGraphs, bigArrow, span, nice, stepOf, minus, qty } from '../../core/simshell.js';
import { paints, crate, sub, gsub, halo } from './scenery.js';

const T_END = 6, F_MAX = 20;
const $ = id => document.getElementById(id);
const F = () => Number($('F').value), mA = () => Number($('mA').value), mB = () => Number($('mB').value);
let t = 0, x = 0, v = 0, hist = [];
const R = { x: [-5, 5], v: [-5, 5], a: [-5, 5], f: [-10, 10] };
let S = null, G = null;   // 장면과 그래프. 화면 크기가 바뀌면 stage가 다시 만든다.

stage($('scene'), k => {
  const { el, set, w, h } = k;
  const K = Math.max(1, Math.min(1.8, h / 240)), GY = h - 44 * K, S10 = 66 * K;
  const ARROW = Math.max(40, Math.min(80 * K, w / 2 - S10 - 34 * K));
  paints(el);
  el('rect', { x: 0, y: 0, width: w, height: GY, fill: 'url(#sky)' });
  el('rect', { x: 0, y: GY, width: w, height: h - GY, fill: '#ece4d6' });
  el('line', { x1: 0, y1: GY, x2: w, y2: GY, stroke: '#7d6a4f', 'stroke-width': 2.5 });
  el('text', { x: 14, y: h - 8, 'font-size': 12 * Math.sqrt(K), fill: '#6b5d47' }).textContent = '마찰 없는 바닥';
  el('text', { x: w - 14, y: h - 8, 'text-anchor': 'end', 'font-size': 15 * Math.sqrt(K) }).innerHTML = qty('x', 'm');
  const arr = c => bigArrow(k, c, { bw: 7 * K, hl: 15 * K, hw: 17 * K });
  S = { el, set, toSvg: k.toSvg, K, GY, X: w / 2, w, ARROW, side: m => S10 * Math.cbrt(m / 10), ticks: el('g'), A: el('g'), B: el('g'),
    AR: { F: arr(COLOR.b), AB: arr(COLOR.c), BA: arr(COLOR.c), a: bigArrow(k, COLOR.acc, { bw: 6 * K, hl: 15 * K, hw: 18 * K }), v: bigArrow(k, COLOR.vel, { bw: 6 * K, hl: 15 * K, hw: 18 * K }) },
    LB: { F: halo(k.label('b', 'F')), AB: halo(k.label('c', '')), BA: halo(k.label('c', '')), a: k.label('acc', 'a'), v: k.label('vel', 'v') } };
  for (const l of Object.values(S.LB)) l.setAttribute('font-size', 20 * K);
  S.LB.AB.innerHTML = sub('F', 'AB'); S.LB.AB.setAttribute('text-anchor', 'end');
  S.LB.BA.innerHTML = sub('F', 'BA'); S.LB.BA.setAttribute('text-anchor', 'start');
  // F 화살표 꼬리 손잡이. 누르면 장면 svg가 포인터를 잡아, 끄는 동안 장면을 다시 그려도 끌기가 이어진다.
  S.grip = el('circle', { r: 9 * K, fill: '#ffffff', stroke: COLOR.b, 'stroke-width': 3, style: 'cursor: ew-resize' });
  S.grip.addEventListener('pointerdown', ev => { ev.preventDefault(); drag = true; $('scene').setPointerCapture(ev.pointerId); });
  drawCrates(); draw();
});
// 끄는 동안 F는 손잡이 위치로 정한다(1 N 단위). A 왼쪽이면 F > 0, B 오른쪽이면 F < 0, 그 사이는 0이다.
let drag = false;
$('scene').addEventListener('pointermove', ev => {
  if (!drag || !S) return;
  const p = S.toSvg(ev).x, k1 = S.ARROW / F_MAX, l = S.X - S.side(mA()) - 3, r = S.X + S.side(mB()) + 3;
  const f = Math.max(-F_MAX, Math.min(F_MAX, Math.round(p < l ? (l - p) / k1 : p > r ? -(p - r) / k1 : 0)));
  if (f !== F()) { $('F').value = f; $('F').dispatchEvent(new Event('input')); }
});
for (const e of ['pointerup', 'pointercancel']) $('scene').addEventListener(e, () => { drag = false; });
stage($('graphs'), k => {
  G = timeGraphs(k, { x: 0, y: 0, w: k.w, h: k.h, tEnd: T_END, panels: [
    { key: 'BA', name: qty(gsub('F', 'BA'), 'N'), color: COLOR.c },
    { key: 'AB', name: qty(gsub('F', 'AB'), 'N'), color: COLOR.c },
  ] });
  G.range('BA', ...R.f); G.range('AB', ...R.f);
  draw();
});

// 바닥 눈금. 맞닿은 면(x)이 장면 가운데에 오도록 흘려 그린다. 1 m의 길이는 x 축 구간이 장면 폭의 80%가 되게 정한다.
function floorTicks() {
  S.ticks.replaceChildren();
  const [lo, hi] = R.x, st = stepOf(lo, hi), pxm = 0.8 * S.w / (hi - lo), half = S.w / 2 / pxm, K = S.K;
  for (let u = Math.ceil((x - half) / st) * st; u <= x + half + 1e-9; u += st) {
    const X = S.X + (u - x) * pxm;
    S.el('line', { x1: X, y1: S.GY, x2: X, y2: S.GY + 7 * K, stroke: '#7d6a4f', 'stroke-width': 1.5 }, S.ticks);
    if (X > 18 * K && X < S.w - 18 * K) S.el('text', { x: X, y: S.GY + 22 * K, 'text-anchor': 'middle', 'font-size': 13 * Math.sqrt(K), fill: '#4a3f30' }, S.ticks).textContent = minus(+u.toPrecision(10));
  }
}
function drawCrates() {
  if (!S) return;
  for (const [g, m, n] of [[S.A, mA(), 'A'], [S.B, mB(), 'B']]) crate(S.el, g, S.side(m), n, { ty: 0.8, size: 16 * Math.sqrt(S.K) });
}

// 지금의 F가 끝까지 유지될 때 남은 시간 동안 x, v가 지나는 구간으로 축을 정한다. fresh가 아니면 좁히지 않는다.
function setRanges(fresh) {
  const { a, FBA } = contact(F(), mA(), mB()), rest = T_END - t;
  const xs = [x], vs = [v];
  for (let i = 1; i <= 100; i++) { const [p, q] = advance(x, v, a, rest * i / 100); xs.push(p); vs.push(q); }
  const L = Math.min(F_MAX, nice(FBA, 5));
  const want = { x: span(Math.min(...xs), Math.max(...xs)), v: span(Math.min(...vs), Math.max(...vs)), a: span(Math.min(a, 0), Math.max(a, 0)), f: [-L, L] };
  for (const key in R) {
    const r = fresh ? want[key] : [Math.min(R[key][0], want[key][0]), Math.max(R[key][1], want[key][1])];
    if (r[0] !== R[key][0] || r[1] !== R[key][1]) { R[key] = r; if (key === 'f') { G?.range('BA', ...r); G?.range('AB', ...r); } }
  }
}

function draw() {
  if (!S || !G) return;
  const { a, FBA: N } = contact(F(), mA(), mB()), f = F(), X = S.X, k1 = S.ARROW / F_MAX, K = S.K;
  const sA = S.side(mA()), sB = S.side(mB()), GY = S.GY, show = (e, on) => { e.style.display = on ? '' : 'none'; };
  floorTicks();
  S.set(S.A, { transform: `translate(${(X - sA).toFixed(1)},${(GY - sA).toFixed(1)})` });
  S.set(S.B, { transform: `translate(${X.toFixed(1)},${(GY - sB).toFixed(1)})` });
  // 미는 힘. 화살촉이 미는 상자의 바깥 면 아래쪽에 닿는다.
  const yF = GY - 0.24 * (f >= 0 ? sA : sB), head = f >= 0 ? X - sA - 3 : X + sB + 3, tail = head - k1 * f;
  S.AR.F.set(tail, yF, head, yF);
  S.set(S.LB.F, { x: tail + (f >= 0 ? -22 : 22) * K, y: yF + 7 * K }); show(S.LB.F, Math.abs(f) >= 1);
  S.set(S.grip, { cx: tail, cy: yF });
  // 짝힘. 맞닿은 면 위쪽에서 시작해 F_AB는 A 쪽(−x), F_BA는 B 쪽(+x)으로 뻗는다. 이름은 화살촉 바깥에 단다.
  const yP = GY - 0.8 * Math.min(sA, sB);
  S.AR.AB.set(X, yP, X - k1 * N, yP); S.AR.BA.set(X, yP, X + k1 * N, yP);
  S.set(S.LB.AB, { x: X - k1 * N - 5, y: yP + 7 * K }); S.set(S.LB.BA, { x: X + k1 * N + 5, y: yP + 7 * K });
  show(S.LB.AB, N > 0.05); show(S.LB.BA, N > 0.05);
  // 두 상자가 함께 갖는 가속도와 속도. 축 구간 끝값(절댓값 큰 쪽)이 ARROW(px)다.
  const big = r => Math.max(-r[0], r[1]), top = GY - Math.max(sA, sB);
  const len = { a: S.ARROW * a / big(R.a), v: S.ARROW * v / big(R.v) }, row = { a: top - 26 * K, v: top - 56 * K };
  for (const key of ['a', 'v']) {
    S.AR[key].set(X, row[key], X + len[key], row[key]);
    S.set(S.LB[key], { x: X + len[key] + (len[key] >= 0 ? 20 : -20) * K, y: row[key] + 7 * K });
    show(S.LB[key], Math.abs(len[key]) >= 1);
  }
  // 힘은 프레임마다 일정했으므로 계단으로 잇는다. 시작 전에는 지금 F로 정해진 값 한 점이다.
  const steps = s => (hist.length > 1 ? hist.slice(1).flatMap((p, i) => [[hist[i].t, s * p.N], [p.t, s * p.N]]) : [[0, s * N]]);
  G.draw({ BA: steps(1), AB: steps(-1) }, t);
  $('tval').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}`);
  $('Fval').innerHTML = tex(`${fmt(f)}\\ \\mathrm{N}`);
  $('mAval').innerHTML = tex(`${fmt(mA())}\\ \\mathrm{kg}`);
  $('mBval').innerHTML = tex(`${fmt(mB())}\\ \\mathrm{kg}`);
  $('BAval').innerHTML = tex(`\\textcolor{#840025}{F_{BA} = ${fmt(N, 2)}\\ \\mathrm{N}}`);
  $('ABval').innerHTML = tex(`\\textcolor{#840025}{F_{AB} = ${fmt(-N, 2)}\\ \\mathrm{N}}`);
  $('aval').innerHTML = tex(`a = ${fmt(a, 2)}\\ \\mathrm{m/s^2}`);
}

function reset() {
  t = 0; x = 0; v = 0; hist = [{ t: 0, x: 0, v: 0, N: 0 }];
  setRanges(true); draw();
}
const ck = clock({
  step(dt) {
    dt = Math.min(dt, T_END - t);
    const { a, FBA } = contact(F(), mA(), mB());
    [x, v] = advance(x, v, a, dt); t += dt;
    if (T_END - t < 1e-9) t = T_END;
    hist.push({ t, x, v, N: FBA });
    draw();
    return t < T_END;
  },
  reset,
  ended: () => t >= T_END,
});
$('F').addEventListener('input', () => {
  if (t >= T_END) return reset();
  setRanges(t === 0 && !ck.running); draw();
});
for (const id of ['mA', 'mB']) $(id).addEventListener('input', () => { ck.stop(); drawCrates(); reset(); });
reset();
