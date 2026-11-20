// 4장 "등속 원운동" 시뮬레이션(공용 틀 core/simshell.js). 위에서 본 원형 트랙을 자동차가 일정한 속력 v로 반시계 방향으로 돈다.
// 트랙 가운데 흰 점선이 반지름 r의 원이고 자동차 중심이 그 위를 지난다. t = 0에 원의 오른쪽 끝(+x 쪽)에서 출발한다.
// 자동차에는 접선 방향 속도 v(파랑)와 중심을 향한 가속도 a(분홍, 크기 v²/r)를 단다. 속도 성분을 켜면 v_x 끝에 v_y를 이어 v가 된다.
// 오른쪽은 같은 시간축의 v_x-t, v_y-t 그래프(식 4.5.3)다. 속력은 그대로인데 두 성분은 바뀐다. 두 바퀴(2T)를 돌면 멈추고 T 자리에 점선을 긋는다.
// v는 slider나 v 화살표 끝 손잡이로, r은 slider나 자동차를 중심 쪽이나 바깥쪽으로 끌어 바꾼다(0.5 단위).
// 바꿔도 자동차는 같은 각 자리에 있고 재생은 이어진다. 그래프는 바뀐 v, r로 처음부터 다시 그린다.
// 장면 축척은 r = 5 m가 들어가고 왼쪽 위 읽기 칸을 비키도록 장면 크기로 정한다.
// v 화살표 길이는 v × 0.4 s, a 화살표 길이는 a × 0.14 s²를 장면 축척으로 그린 것이다. r = 2.5 m, v = 6 m/s에서도 a 화살표가 중심에 닿지 않는다.
// a = v²/r은 v, r 범위가 넓으면 수백 배로 벌어져 한 축척에 담기지 않으므로 r은 2.5–5 m로 둔다(2026-11-19).
// 위치·속도·가속도는 식 4.5.3, 4.5.6으로 바로 계산한다(오차 없음). 자동차·화살표·글자는 장면 높이에 맞춰 함께 키운다(배율 K).
import { period, centripetal, circle } from './motion.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';
import { stage, clock, timeGraphs, bigArrow, span, qty } from '../../core/simshell.js';
import { sym, grip } from './view.js';

const R_MAX = 5, TV = 0.4, TA = 0.14;
const $ = id => document.getElementById(id);
let v = Number($('v').value), r = Number($('r').value), t = 0, S = null, G = null, GK = null;
const tEnd = () => 2 * period(v, r);
const snap = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(x * 2) / 2));

stage($('scene'), k => {
  const { el, w, h } = k;
  const K = Math.max(1, Math.min(1.8, h / 240)), TW = 13 * K;   // TW는 트랙 반폭(px)
  // 읽기 칸(왼쪽 위, 글자 20 px 두 줄, 약 200 × 100 px)의 오른쪽 아래 모서리에서 떨어지게 원을 오른쪽으로 놓는다. 좁은 화면에서는 가리는 것을 받아들인다.
  const cx = w >= 500 ? Math.min(w / 2 + 40 * K, w - h / 2) : w / 2, cy = h / 2;
  const Ro = Math.min(h / 2 - 8, cx - 8, w - cx - 8, w >= 500 ? Math.hypot(cx - 200, cy - 100) - 12 : Infinity);
  const SC = (Ro - TW - 6) / R_MAX;
  el('defs').innerHTML = `
    <pattern id="lawn4c" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="22" height="44" fill="#c3dda4"/><rect x="22" width="22" height="44" fill="#b8d695"/></pattern>
    <linearGradient id="car4c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ec5a4c"/><stop offset="1" stop-color="#b52a22"/></linearGradient>`;
  el('rect', { x: 0, y: 0, width: w, height: h, fill: 'url(#lawn4c)' });
  S = { k, el, set: k.set, K, w, h, cx, cy, SC, TW, LB: 16 * K, track: el('g'),
    rad: el('line', { stroke: '#2b2b2b', 'stroke-width': 1.6, 'stroke-dasharray': '5 4' }) };
  el('circle', { cx, cy, r: 5 * K, fill: '#2b2b2b', stroke: '#ffffff', 'stroke-width': 2 });
  S.lr = sym(k, '#2b2b2b', 'r', '', 15 * K);
  // 좌표축 표시(왼쪽 아래). 오른쪽 그래프의 v_x, v_y 부호를 읽는 기준이다.
  const ox = 18 + 8 * K, oy = h - 18 - 8 * K, L = 34 * K, hd = 6 * K;
  el('path', { d: `M${ox},${oy} h${L} M${ox},${oy} v${-L}`, stroke: COLOR.ink, 'stroke-width': 1.8, fill: 'none' });
  el('path', { d: `M${ox + L + hd},${oy} l${-hd * 1.4},${-hd * 0.6} v${hd * 1.2}Z M${ox},${oy - L - hd} l${-hd * 0.6},${hd * 1.4} h${hd * 1.2}Z`, fill: COLOR.ink });
  S.set(sym(k, COLOR.ink, 'x', '', 15 * K), { x: ox + L + hd + 10 * K, y: oy + 5 * K });
  S.set(sym(k, COLOR.ink, 'y', '', 15 * K), { x: ox, y: oy - L - hd - 6 * K });
  // 자동차(위에서 본 모습). (0, 0)이 차 중심이고 앞이 +x 쪽이다. 끌면 r이 바뀐다.
  const CL = 26 * K, CW = 14 * K;
  S.car = el('g', { style: 'cursor: grab' });
  for (const [x, y] of [[CL * 0.27, -CW / 2], [CL * 0.27, CW / 2], [-CL * 0.3, -CW / 2], [-CL * 0.3, CW / 2]])
    el('rect', { x: x - 3.6 * K, y: y - 2.2 * K, width: 7.2 * K, height: 4.4 * K, rx: 1.4 * K, fill: '#1e1e1e' }, S.car);
  el('rect', { x: -CL / 2, y: -CW / 2, width: CL, height: CW, rx: 5 * K, fill: 'url(#car4c)', stroke: '#7a1712', 'stroke-width': 1.2 }, S.car);
  el('path', { d: `M${CL * 0.13},${-CW * 0.38} L${CL * 0.3},${-CW * 0.3} L${CL * 0.3},${CW * 0.3} L${CL * 0.13},${CW * 0.38} Z`, fill: '#2d3b4a' }, S.car);
  el('rect', { x: -CL * 0.2, y: -CW * 0.36, width: CL * 0.32, height: CW * 0.72, rx: 2 * K, fill: '#e8685b' }, S.car);
  el('path', { d: `M${-CL * 0.21},${-CW * 0.34} L${-CL * 0.32},${-CW * 0.3} L${-CL * 0.32},${CW * 0.3} L${-CL * 0.21},${CW * 0.34} Z`, fill: '#2d3b4a' }, S.car);
  for (const y of [-CW * 0.3, CW * 0.3]) el('rect', { x: CL / 2 - 2.6 * K, y: y - 1.6 * K, width: 2.2 * K, height: 3.2 * K, rx: 0.8 * K, fill: '#ffe9a6' }, S.car);
  let drag = false;
  S.car.addEventListener('pointerdown', ev => { ev.preventDefault(); drag = true; S.car.setPointerCapture(ev.pointerId); S.car.style.cursor = 'grabbing'; });
  S.car.addEventListener('pointermove', ev => {
    if (!drag) return;
    const p = k.toSvg(ev), nr = snap(Math.hypot(p.x - S.cx, p.y - S.cy) / S.SC, 2.5, 5);
    if (nr !== r) retune(v, nr);
  });
  for (const e of ['pointerup', 'pointercancel']) S.car.addEventListener(e, () => { drag = false; S.car.style.cursor = 'grab'; });
  const size = f => ({ bw: 5 * K * f, hl: 13 * K * f, hw: 15 * K * f });
  S.vx = bigArrow(k, COLOR.vel, size(0.7)); S.vy = bigArrow(k, COLOR.vel, size(0.7));
  for (const c of [S.vx, S.vy]) c.g.setAttribute('fill-opacity', 0.5);
  S.a = bigArrow(k, COLOR.acc, size(1)); S.v = bigArrow(k, COLOR.vel, size(1));
  S.lvx = sym(k, COLOR.vel, 'v', 'x', S.LB * 0.9); S.lvy = sym(k, COLOR.vel, 'v', 'y', S.LB * 0.9);
  S.lv = sym(k, COLOR.vel, 'v', '', S.LB); S.la = sym(k, COLOR.acc, 'a', '', S.LB);
  // v 화살표 끝 손잡이. 차에서 손잡이까지 길이로 v를 정한다.
  S.grip = grip(k, COLOR.vel, { r: 8 * K, move(p) {
    const c = circle(v, r, t), nv = snap(Math.hypot(p.x - (S.cx + S.SC * c.x), p.y - (S.cy - S.SC * c.y)) / (TV * S.SC), 1, 6);
    if (nv !== v) retune(nv, r);
  } });
  drawTrack(); draw();
});
stage($('graphs'), k => { GK = { hold: k.el('g'), w: k.w, h: k.h }; buildGraphs(); draw(); });

// 아스팔트 띠, 양쪽 흰 선, 바깥 연석(빨강·하양), 가운데 흰 점선(반지름 r의 원).
function drawTrack() {
  if (!S) return;
  const { el, cx, cy, SC, TW, K } = S, R = r * SC, g = S.track;
  g.replaceChildren();
  el('circle', { cx, cy, r: R + TW + 2.5 * K, fill: 'none', stroke: '#ffffff', 'stroke-width': 5 * K }, g);
  el('circle', { cx, cy, r: R + TW + 2.5 * K, fill: 'none', stroke: '#d1352b', 'stroke-width': 5 * K, 'stroke-dasharray': `${9 * K} ${9 * K}` }, g);
  el('circle', { cx, cy, r: R, fill: 'none', stroke: '#6b7078', 'stroke-width': 2 * TW }, g);
  for (const d of [-1, 1]) el('circle', { cx, cy, r: R + d * (TW - 3 * K), fill: 'none', stroke: '#f2f2f2', 'stroke-width': 1.6 }, g);
  el('circle', { cx, cy, r: R, fill: 'none', stroke: '#ffffff', 'stroke-width': 2, 'stroke-dasharray': `${10 * K} ${8 * K}` }, g);
}

// 오른쪽 그래프. 시간축은 두 바퀴(2T), 세로축은 ±v를 담는 1·2·5 끝값이다. T 자리에 세로 점선을 긋는다.
function buildGraphs() {
  if (!GK) return;
  GK.hold.replaceChildren();
  const kit = svgKit($('graphs'), GK.hold), te = tEnd();
  const name = c => `<tspan font-style="italic" font-family="Times New Roman, serif" font-size="1.15em">v<tspan font-size="0.75em" dy="3">${c}</tspan></tspan><tspan dy="-3"> (m/s)</tspan>`;
  G = timeGraphs(kit, { x: 0, y: 0, w: GK.w, h: GK.h, tEnd: te, panels: [
    { key: 'vx', name: name('x'), color: COLOR.vel },
    { key: 'vy', name: name('y'), color: COLOR.vel },
  ] });
  for (const key of ['vx', 'vy']) G.range(key, ...span(-v, v, 1));
  const L = 58, R = GK.w - 24, X = L + (R - L) * period(v, r) / te;   // timeGraphs의 가로 범위(왼쪽 58 px, 오른쪽 24 px 여백)
  kit.el('line', { x1: X, y1: 24, x2: X, y2: GK.h - 40, stroke: '#9a9a9a', 'stroke-dasharray': '2 5', 'stroke-width': 1.5 });
  kit.el('text', { x: X, y: 16, 'text-anchor': 'middle', 'font-size': 16 }).innerHTML = qty('T');
}

// v, r을 바꾼다. 자동차의 각 자리는 그대로 두고 그 자리에 맞는 t로 옮긴다.
function retune(nv, nr) {
  const ph = (v * t / r) % (2 * Math.PI), rChanged = nr !== r;
  v = nv; r = nr; t = ph * r / v;
  $('v').value = v; $('r').value = r;
  if (rChanged) drawTrack();
  buildGraphs(); draw();
}

function draw() {
  if (!S) return;
  const { set, cx, cy, SC, K } = S, c = circle(v, r, t), X = cx + SC * c.x, Y = cy - SC * c.y;
  set(S.car, { transform: `translate(${X.toFixed(1)},${Y.toFixed(1)}) rotate(${(Math.atan2(-c.vy, c.vx) * 180 / Math.PI).toFixed(1)})` });
  set(S.rad, { x1: cx, y1: cy, x2: X, y2: Y });
  const mx = (cx + X) / 2, my = (cy + Y) / 2, nx = -Math.sin(c.th), ny = -Math.cos(c.th);   // 반지름에 수직(접선) 쪽으로 비킨다
  set(S.lr, { x: mx + nx * 14 * K, y: my + ny * 14 * K + 5 * K });
  const ux = TV * SC * c.vx, uy = TV * SC * c.vy, Lv = Math.hypot(ux, uy), ax = TA * SC * c.ax, ay = TA * SC * c.ay, La = Math.hypot(ax, ay);
  S.v.set(X, Y, X + ux, Y - uy);
  S.a.set(X, Y, X + ax, Y - ay);
  set(S.lv, { x: X + ux + 19 * K * ux / Lv, y: Y - uy - 19 * K * uy / Lv + 6 * K });
  // a는 반지름 위에 놓이므로 이름을 화살표 가운데에서 운동 반대쪽(접선 뒤쪽)으로 비킨다. r 이름은 운동 쪽에 있다.
  set(S.la, { x: X + ax / 2 - nx * 16 * K, y: Y - ay / 2 - ny * 16 * K + 6 * K });
  S.la.style.display = La >= 6 * K ? '' : 'none';
  const comp = $('comp').checked;
  S.vx.set(X, Y, X + ux, Y); S.vy.set(X + ux, Y, X + ux, Y - uy);
  if (!comp) { S.vx.g.style.display = 'none'; S.vy.g.style.display = 'none'; }
  set(S.lvx, { x: X + ux / 2, y: Y + (uy >= 0 ? 24 * K : -10 * K) });
  set(S.lvy, { x: X + ux + (ux >= 0 ? 16 : -16) * K, y: Y - uy / 2 + 6 * K });
  S.lvx.style.display = comp && Math.abs(ux) >= 18 * K ? '' : 'none';
  S.lvy.style.display = comp && Math.abs(uy) >= 18 * K ? '' : 'none';
  set(S.grip, { cx: X + ux, cy: Y - uy });
  if (G) {
    const n = Math.max(2, Math.ceil(t * 30)), vx = [], vy = [];
    for (let i = 0; i <= n; i++) { const u = t * i / n, q = circle(v, r, u); vx.push([u, q.vx]); vy.push([u, q.vy]); }
    G.draw({ vx, vy }, t);
  }
  $('tval').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}`);
  $('vval').innerHTML = tex(`${fmt(v)}\\ \\mathrm{m/s}`);
  $('rval').innerHTML = tex(`${fmt(r)}\\ \\mathrm{m}`);
  $('aval').innerHTML = tex(`\\textcolor{#840025}{a = ${fmt(centripetal(v, r), 2)}\\ \\mathrm{m/s^2}}`);
  $('Tval').innerHTML = tex(`T = ${fmt(period(v, r), 2)}\\ \\mathrm{s}`);
}

clock({
  step(dt) { t = Math.min(tEnd(), t + dt); draw(); return t < tEnd(); },
  reset() { t = 0; draw(); },
  ended: () => t >= tEnd() - 1e-12,
});
$('v').addEventListener('input', () => retune(Number($('v').value), r));
$('r').addEventListener('input', () => retune(v, Number($('r').value)));
$('comp').addEventListener('change', draw);
draw();
