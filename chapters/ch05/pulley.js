// 5장 "장력" 시뮬레이션(공용 틀 core/simshell.js). 마찰 없는 탁자 위 나무 상자(질량 M)가 탁자 끝에 물린 도르래를 지나는 줄로
// 매달린 상자(질량 m)와 이어져 있다. 줄과 도르래의 질량, 도르래의 마찰은 무시한다(교재 예제 5.3.1의 배치).
// 질량 없는 줄은 두 상자를 같은 크기 T로 당긴다. T = M a (5.3.4), T − mg = −m a (5.3.6)에서 a = m g/(M + m) (5.3.7), T = M m g/(M + m) (5.3.9).
// 장면은 탁자·도르래·줄과 두 상자, 줄 양 끝의 T와 매달린 상자의 mg(주황), 두 상자의 a(분홍) 화살표다. 시간 그래프는 없다.
// 매달린 상자는 T 화살표와 이름이 도르래에 닿지 않는 높이에서 출발한다. 재생하면 정지 상태에서 출발해, 매달린 상자의 화살표가 바닥에 닿기 전이나
// 탁자 위 상자의 T 화살표가 도르래에 닿기 전에 멈춘다. 줄이 늘어나지 않으므로 두 상자는 늘 같은 거리만큼 움직이고 도르래 바퀴살도 그만큼 돈다.
// 멈춰 있을 때 어느 상자든 줄을 따라 끌면 두 상자가 함께 움직여 출발 위치가 바뀐다. 끄는 동안은 손이 상자를 잡고 있으므로 힘과 가속도 화살표를 숨긴다.
// 물체·화살표·글자는 장면 높이에 맞춰 함께 키운다(배율 K, 1.5배까지). 가속도 화살표는 1 m/s²가 9K px, 1 m는 장면 높이의 22%다.
// 힘 화살표는 1 N이 3K px이다. 무거운 상자로 T와 mg 화살표가 장면 높이에 다 들어가지 않으면(내려갈 거리를 남기고) 배율을 줄인다.
// 배율이 바뀌어도 한 장면의 T 두 개와 mg는 늘 같은 배율이다.
// 가속도가 일정하므로 x += v dt + a dt²/2, v += a dt로 적분하고, 끝 위치에 닿는 시각은 따로 풀어 그 위치에서 정확히 멈춘다.
import { pulley, gravity, advance, hitTime } from './newton.js';
import { COLOR, tex, fmt } from '../../core/simkit.js';
import { stage, clock, bigArrow } from '../../core/simshell.js';
import { paints, crate, halo } from './scenery.js';

const $ = id => document.getElementById(id);
const M = () => Number($('M').value), m = () => Number($('m').value);
let t = 0, d = 0, v = 0, held = null;   // d는 출발점에서 움직인 거리(m), held는 끌고 있는 상자
let S = null;   // 장면. 화면 크기가 바뀌면 stage가 다시 만든다.

stage($('scene'), k => {
  const { el, set, w, h } = k;
  const K = Math.max(1, Math.min(1.5, h / 300)), GY = h - 16 * K;
  const sideM = q => (30 + 14 * Math.cbrt(q)) * K, sideH = q => (22 + 10 * Math.cbrt(q)) * K;
  const TY = sideM(5) + 26 * K + 6, TX0 = 0.23 * w, TX1 = 0.69 * w, R = 18 * K;
  const PCX = TX1 + R + 8 * K, PCY = TY - 0.5 * sideM(0.5) + R;
  paints(el);
  el('rect', { x: 0, y: 0, width: w, height: GY, fill: 'url(#sky)' });
  el('rect', { x: 0, y: GY, width: w, height: h - GY, fill: '#ece4d6' });
  el('line', { x1: 0, y1: GY, x2: w, y2: GY, stroke: '#7d6a4f', 'stroke-width': 2.5 });
  // 탁자. 상판, 다리 둘, 아래 가로대.
  const top = 14 * K, legW = 14 * K, legs = [TX0 + 18 * K, TX1 - 32 * K];
  for (const x of legs) el('rect', { x, y: TY + top, width: legW, height: GY - TY - top, fill: 'url(#wood2)', stroke: '#6e4520', 'stroke-width': 1.2 });
  el('rect', { x: legs[0] + legW, y: GY - 46 * K, width: legs[1] - legs[0] - legW, height: 8 * K, fill: 'url(#wood2)', stroke: '#6e4520', 'stroke-width': 1 });
  el('rect', { x: TX0, y: TY, width: TX1 - TX0, height: top, rx: 2, fill: 'url(#wood)', stroke: '#6e4520', 'stroke-width': 1.5 });
  el('text', { x: TX0 + 40 * K, y: TY + top + 18 * Math.sqrt(K), 'font-size': 12 * Math.sqrt(K), fill: '#6b5d47' }).textContent = '마찰 없는 탁자';
  // 도르래 집게. 탁자 끝을 위아래로 무는 쇠 집게와 굴대까지 뻗은 팔.
  el('path', { d: `M${TX1 - 16 * K},${TY - 5 * K} H${TX1 + 6 * K} V${TY + top + 16 * K} H${TX1 - 16 * K} V${TY + top + 9 * K} H${TX1} V${TY - K} H${TX1 - 16 * K} Z`,
    fill: 'url(#steelv)', stroke: '#4c565f', 'stroke-width': 1.2 });
  el('line', { x1: TX1 - 8 * K, y1: TY + top + 16 * K, x2: TX1 - 8 * K, y2: TY + top + 30 * K, stroke: '#4c565f', 'stroke-width': 3 * K, 'stroke-linecap': 'round' });
  el('line', { x1: TX1 + 3 * K, y1: TY + 4 * K, x2: PCX, y2: PCY, stroke: '#7b8691', 'stroke-width': 6 * K, 'stroke-linecap': 'round' });
  // 도르래 바퀴. 바퀴살(spokes)은 줄이 움직인 거리만큼 돈다.
  el('circle', { cx: PCX, cy: PCY, r: R, fill: 'url(#steelv)', stroke: '#4c565f', 'stroke-width': 1.5 });
  el('circle', { cx: PCX, cy: PCY, r: 0.66 * R, fill: '#e9edf0', stroke: '#8d97a1', 'stroke-width': 1 });
  const spokes = el('g');
  for (const th of [0, 60, 120]) el('line', { x1: -0.62 * R, y1: 0, x2: 0.62 * R, y2: 0, stroke: '#8d97a1', 'stroke-width': 2 * K, transform: `rotate(${th})` }, spokes);
  // 줄. 탁자 위 상자에서 바퀴 위쪽까지 수평, 바퀴를 4분의 1 감고, 매달린 상자까지 수직.
  const rope = { stroke: '#6b5a45', 'stroke-width': 2.4 * K, fill: 'none', 'stroke-linecap': 'round' };
  const ropeS = el('line', { y1: PCY - R, x2: PCX, y2: PCY - R, ...rope });
  el('path', { d: `M${PCX},${PCY - R} A${R},${R} 0 0 1 ${PCX + R},${PCY}`, ...rope });
  const ropeH = el('line', { x1: PCX + R, y1: PCY, x2: PCX + R, ...rope });
  el('circle', { cx: PCX, cy: PCY, r: 3.5 * K, fill: '#3a424b' });
  const gM = el('g', { style: 'cursor: grab' }), gH = el('g', { style: 'cursor: grab' });
  const eyeM = el('circle', { r: 3 * K, fill: 'none', stroke: '#4c565f', 'stroke-width': 1.5 * K });
  const hook = el('circle', { r: 3.5 * K, fill: 'none', stroke: '#4c565f', 'stroke-width': 1.5 * K });
  const arr = c => bigArrow(k, c, { bw: 7 * K, hl: 15 * K, hw: 17 * K }), thin = c => bigArrow(k, c, { bw: 6 * K, hl: 14 * K, hw: 16 * K });
  S = { el, set, toSvg: k.toSvg, K, w, h, GY, TY, TX0, TX1, R, PCX, PCY, sideM, sideH, spokes, ropeS, ropeH, gM, gH, eyeM, hook,
    XS0: w >= 700 ? Math.max(TX0 + 24 * K, 290) : TX0 + 12 * K, KA: 9 * K, PX: 0.22 * h,
    AR: { TM: arr(COLOR.b), TH: arr(COLOR.b), g: arr(COLOR.b), aM: thin(COLOR.acc), aH: thin(COLOR.acc) },
    LB: { TM: k.label('b', 'T'), TH: k.label('b', 'T'), g: k.label('b', 'mg'), aM: k.label('acc', 'a'), aH: k.label('acc', 'a') } };
  for (const l of Object.values(S.LB)) { l.setAttribute('font-size', 20 * K); halo(l); }
  S.LB.TH.setAttribute('text-anchor', 'end'); S.LB.g.setAttribute('text-anchor', 'end');
  S.LB.aM.setAttribute('text-anchor', 'start'); S.LB.aH.setAttribute('text-anchor', 'start');
  // 상자를 누르면 재생을 멈추고 장면 svg가 포인터를 잡는다. 끄는 동안 장면을 다시 그려도 끌기가 이어진다.
  for (const [g, which] of [[gM, 'M'], [gH, 'H']]) g.addEventListener('pointerdown', ev => {
    ev.preventDefault(); ck.stop();
    held = { which, p: S.toSvg(ev), d0: d }; $('scene').setPointerCapture(ev.pointerId);
    for (const e of [gM, gH]) e.style.cursor = 'grabbing';
    draw();
  });
  drawCrates(); draw();
});
// 끄는 동안 탁자 위 상자는 오른쪽으로, 매달린 상자는 아래로 끈 만큼 두 상자가 함께 움직인다(0부터 끝 위치까지).
$('scene').addEventListener('pointermove', ev => {
  if (!held || !S) return;
  const p = S.toSvg(ev), dd = held.which === 'M' ? p.x - held.p.x : p.y - held.p.y;
  d = Math.max(0, Math.min(geo().D, held.d0 + dd / S.PX)); v = 0; t = 0;
  draw();
});
for (const e of ['pointerup', 'pointercancel']) $('scene').addEventListener(e, () => {
  if (!held) return;
  held = null;
  if (S) for (const g of [S.gM, S.gH]) g.style.cursor = 'grab';
  draw();
});

// 지금 질량으로 정해지는 크기, 힘 배율 KF(px/N), 출발 높이, 움직일 수 있는 거리 D(m).
// 매달린 상자는 T 화살표 끝이 도르래 아래에 오도록 출발하고, 아래쪽 화살표(mg 또는 a)가 바닥 위 8 px에 닿으면 끝이다.
// 탁자 위 상자는 T 화살표와 이름이 도르래 바퀴 앞에 머무는 곳이 끝이다. KF는 3K에서 시작해, 내려갈 거리가 세로 여유의 30%보다 짧아지면 줄인다.
function geo() {
  const { a, T } = pulley(M(), m()), mg = gravity(m()), K = S.K;
  const sM = S.sideM(M()), sH = S.sideH(m()), room = S.GY - 8 - (S.PCY + S.R + 12 * K);
  const KF = Math.min(3 * K, (0.7 * room - sH) / (T + mg)), YH0 = S.PCY + S.R + 12 * K + KF * T;
  const below = Math.max(sH + KF * mg, S.KA * a + 18 * K);
  const Dv = S.GY - 8 - YH0 - below, Dh = S.PCX - S.R - 8 * K - (S.XS0 + sM) - KF * T - 12 * K;
  return { a, T, mg, sM, sH, KF, YH0, D: Math.max(0, Math.min(Dv, Dh)) / S.PX };
}
function drawCrates() {
  if (!S) return;
  const sz = 22 * Math.sqrt(S.K);
  crate(S.el, S.gM, S.sideM(M()), 'M', { italic: true, size: sz });
  crate(S.el, S.gH, S.sideH(m()), 'm', { italic: true, size: sz, fill: 'wood2', ty: 0.42 });
}

function draw() {
  if (!S) return;
  const { a, T, mg, sM, sH, KF, YH0 } = geo(), { K, KA, PX, PCX, PCY, R, TY } = S, show = (e, on) => { e.style.display = on ? '' : 'none'; };
  const XM = S.XS0 + d * PX, YH = YH0 + d * PX, cordY = PCY - R, cordX = PCX + R;
  S.set(S.gM, { transform: `translate(${XM.toFixed(1)},${(TY - sM).toFixed(1)})` });
  S.set(S.gH, { transform: `translate(${(cordX - sH / 2).toFixed(1)},${YH.toFixed(1)})` });
  S.set(S.ropeS, { x1: XM + sM + 3 * K }); S.set(S.ropeH, { y2: YH - 6 * K });
  S.set(S.eyeM, { cx: XM + sM + 1.5 * K, cy: cordY }); S.set(S.hook, { cx: cordX, cy: YH - 3 * K });
  S.spokes.setAttribute('transform', `translate(${PCX.toFixed(1)},${PCY.toFixed(1)}) rotate(${(d * PX / R * 180 / Math.PI).toFixed(1)})`);
  // 줄이 당기는 힘 T(양 끝 같은 크기), 매달린 상자의 중력 mg, 두 상자의 가속도 a.
  const on = !held;
  S.AR.TM.set(XM + sM, cordY, XM + sM + KF * T, cordY);
  S.set(S.LB.TM, { x: XM + sM + KF * T - 4 * K, y: cordY - 13 * K });
  S.AR.TH.set(cordX, YH, cordX, YH - KF * T);
  S.set(S.LB.TH, { x: cordX - 13 * K, y: YH - KF * T / 2 + 7 * K });
  S.AR.g.set(cordX, YH + sH, cordX, YH + sH + KF * mg);
  S.set(S.LB.g, { x: cordX - 13 * K, y: YH + sH + KF * mg - 2 * K });
  const rowM = TY - sM - 16 * K, xaH = cordX + sH / 2 + 22 * K, yaH = YH;
  S.AR.aM.set(XM + sM / 2, rowM, XM + sM / 2 + KA * a, rowM);
  S.set(S.LB.aM, { x: XM + sM / 2 + KA * a + 8 * K, y: rowM + 7 * K });
  S.AR.aH.set(xaH, yaH, xaH, yaH + KA * a);
  S.set(S.LB.aH, { x: xaH + 10 * K, y: yaH + KA * a / 2 + 7 * K });
  for (const key in S.AR) S.AR[key].g.style.visibility = on ? '' : 'hidden';
  for (const key in S.LB) show(S.LB[key], on);
  $('tval').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}`);
  $('Mval').innerHTML = tex(`${fmt(M())}\\ \\mathrm{kg}`);
  $('mval').innerHTML = tex(`${fmt(m())}\\ \\mathrm{kg}`);
  $('Tval').innerHTML = tex(`\\textcolor{#840025}{T = ${fmt(T, 2)}\\ \\mathrm{N}}`);
  $('gval').innerHTML = tex(`mg = ${fmt(mg, 2)}\\ \\mathrm{N}`);
  $('aval').innerHTML = tex(`a = ${fmt(a, 2)}\\ \\mathrm{m/s^2}`);
}

function reset() { t = 0; d = 0; v = 0; draw(); }
const ck = clock({
  step(dt) {
    if (!S) return false;
    const { a, D } = geo(), hit = hitTime(d, v, a, D);
    if (hit <= dt) { [, v] = advance(d, v, a, hit); d = D; t += hit; draw(); return false; }
    [d, v] = advance(d, v, a, dt); t += dt;
    draw();
    return true;
  },
  reset,
  ended: () => !S || d >= geo().D - 1e-9,
});
for (const id of ['M', 'm']) $(id).addEventListener('input', () => { ck.stop(); drawCrates(); reset(); });
reset();
