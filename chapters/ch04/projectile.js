// 4장 "포물선 운동" 시뮬레이션(공용 틀 core/simshell.js). 잔디밭에 놓인 축구공을 처음 속력 v0, 발사각 θ0로 찬다. 공기 저항은 무시한다.
// 공 중심의 출발 높이를 y = 0으로 잡고 같은 높이로 돌아올 때까지 난다. 그때의 x가 수평 도달 거리 R(식 4.4.8)이고 땅 밑에 빨간 치수선으로 단다.
// 왼쪽 장면은 x, y 축척이 같다. 빨간 점선은 빨간 식(4.4.7)으로 그린 궤적이고 공이 지나간 부분은 실선으로 채운다.
// 나는 동안 공에는 속도 v(파랑), 가속도 a(분홍, 늘 아래로 g), 성분 v_x, v_y(옅은 파랑, v_x 끝에 v_y를 이으면 v)를 단다.
// 공의 x는 땅 위 주황 점, y는 출발점 위 높이 자의 초록 점으로 옮겨 오른쪽 x-t(등속), y-t(등가속도) 그래프와 색을 맞춘다.
// v0, θ0는 slider나 출발점 v0 화살표 끝 손잡이를 끌어 바꾼다(손잡이는 출발 전과 땅에 닿은 뒤에 보인다). 바꾸면 처음으로 돌아간다.
// 0.25 s마다 공 위치를 남길 수 있다. 땅에 닿은 궤적은 옅은 회색으로 5개까지 남겨 발사각이나 처음 속력에 따른 차이를 견준다. ↺는 이것도 지운다.
// 장면 축척은 지금 궤적과 남은 궤적의 처음 속력 가운데 큰 값으로 어느 발사각이든 들어가게 사다리에서 고른다. 발사각만 바꾸면 축척이 그대로다.
// 보여 줄 값은 v_x, v_y, R만 둔다(사용자 2026-11-16 "너무 여러 개라서 지저분"). v_x는 그대로이고 v_y만 바뀐다.
// 발사각 0–90°, 처음 속력 0–30 m/s (사용자 2026-11-16, 5–85°와 5 m/s 제한은 물리적 이유가 없었다). g = 9.8 m/s²는 식 옆에 둔다.
// 위치와 속도는 식 4.4.3–4.4.5로 바로 계산한다(오차 없음). 공·화살표·글자는 장면 높이에 맞춰 함께 키운다(배율 K).
// 속도 화살표 축척은 30 m/s로 땅에 닿을 때의 화살표가 장면 아래 끝 안에 들도록 정한다.
import { projectile, flightTime, range, maxHeight, trajectoryY, G as g } from './motion.js';
import { COLOR, tex, fmt, svgKit } from '../../core/simkit.js';
import { stage, clock, timeGraphs, bigArrow, span, minus, qty } from '../../core/simshell.js';
import { snapDown, tickStep, sym, grip } from './view.js';

const V_MAX = 30, STROBE = 0.25, KEEP = 5, XC = COLOR.b, YC = COLOR.water;   // x는 주황, y는 초록
const $ = id => document.getElementById(id);
const v0 = () => Number($('v0').value), th0 = () => Number($('th').value), T = () => flightTime(v0(), th0());
let t = 0, past = [], S = null, G = null, GK = null;

stage($('scene'), k => {
  const { el, w, h } = k;
  const K = Math.max(1, Math.min(1.8, h / 240)), GY = h - 50 * K, BALL = 8 * K, Y0 = GY - BALL, X0 = 26 + 22 * K;
  el('defs').innerHTML = `
    <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe5f7"/><stop offset="1" stop-color="#f3f9fd"/></linearGradient>
    <linearGradient id="soil4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8ddc4"/><stop offset="1" stop-color="#d8c8a4"/></linearGradient>
    <radialGradient id="ball4" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfcfcf"/></radialGradient>
    <clipPath id="ballclip4"><circle r="${BALL}"/></clipPath>`;
  el('rect', { x: 0, y: 0, width: w, height: GY, fill: 'url(#sky4)' });
  el('path', { d: `M0,${GY} L0,${GY - 16 * K} Q${w * 0.18},${GY - 34 * K} ${w * 0.36},${GY - 20 * K} T${w * 0.7},${GY - 22 * K} T${w},${GY - 14 * K} L${w},${GY} Z`, fill: '#dbead0' });
  el('rect', { x: 0, y: GY, width: w, height: h - GY, fill: 'url(#soil4)' });
  el('rect', { x: 0, y: GY, width: w, height: 7 * K, fill: '#7fb24c' });
  let d = '';
  for (let x = 0; x < w; x += 6) d += `M${x},${GY + 1} l3,${(-4 * K).toFixed(1)} l3,${(4 * K).toFixed(1)}Z`;
  el('path', { d, fill: '#6aa03c' });
  // YT 위로는 읽기 칸(글자 20 px, 세 줄)이 있다. 좁은 화면에서는 칸이 장면을 가리는 것을 받아들인다.
  S = { k, el, set: k.set, K, w, h, GY, BALL, Y0, X0, s: 10, YT: w < 500 ? 24 : 134, XR: w - 30 * K, LB: 16 * K,
    KV: Math.max(1.6, (h - Y0 - 6) / V_MAX),   // 속도 화살표 px/(m/s)
    axis: el('g'), past: el('g'), dim: el('g'),
    preview: el('path', { fill: 'none', stroke: COLOR.c, 'stroke-width': 2.2, 'stroke-dasharray': '7 6', opacity: 0.8 }),
    trail: el('polyline', { fill: 'none', stroke: COLOR.c, 'stroke-width': 3, 'stroke-linejoin': 'round' }),
    marks: el('g'),
    gx: el('line', { stroke: XC, 'stroke-width': 1.3, 'stroke-dasharray': '4 4', opacity: 0.8 }),
    gy: el('line', { stroke: YC, 'stroke-width': 1.3, 'stroke-dasharray': '4 4', opacity: 0.8 }),
    arc: el('path', { fill: 'none', stroke: '#555555', 'stroke-width': 1.5 }), lth: sym(k, '#333333', 'θ', '0', 15 * K),
  };
  S.dx = el('circle', { r: 4.5 * K, fill: XC, stroke: '#ffffff', 'stroke-width': 1.5 });
  S.dy = el('circle', { r: 4.5 * K, fill: YC, stroke: '#ffffff', 'stroke-width': 1.5 });
  const arrowSize = f => ({ bw: 5 * K * f, hl: 13 * K * f, hw: 15 * K * f });
  S.launch = bigArrow(k, COLOR.vel, arrowSize(1)); S.l0 = sym(k, COLOR.vel, 'v', '0', S.LB);
  // 축구공. 가운데 검은 오각형, 꼭짓점에서 뻗는 솔기, 가장자리에 반쯤 보이는 오각형 다섯 개. (0, 0)이 공 중심이다.
  S.ball = el('g');
  const pent = (r, a0, cx = 0, cy = 0) => Array.from({ length: 5 }, (_, i) => { const a = a0 + i * 2 * Math.PI / 5; return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; });
  const pts = P => P.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ');
  el('circle', { r: BALL, fill: 'url(#ball4)' }, S.ball);
  const rim = el('g', { 'clip-path': 'url(#ballclip4)' }, S.ball);
  for (let i = 0; i < 5; i++) { const a = Math.PI / 5 + i * 2 * Math.PI / 5; el('polygon', { points: pts(pent(BALL * 0.36, a, BALL * 1.08 * Math.sin(a), -BALL * 1.08 * Math.cos(a))), fill: '#2a2a2a' }, rim); }
  const P5 = pent(BALL * 0.36, 0);
  for (const [x, y] of P5) el('line', { x1: x, y1: y, x2: x * 2.3, y2: y * 2.3, stroke: '#444444', 'stroke-width': 0.9 }, S.ball);
  el('polygon', { points: pts(P5), fill: '#2a2a2a' }, S.ball);
  el('circle', { r: BALL, fill: 'none', stroke: '#2b2b2b', 'stroke-width': 1.3 }, S.ball);
  S.vx = bigArrow(k, COLOR.vel, arrowSize(0.7)); S.vy = bigArrow(k, COLOR.vel, arrowSize(0.7));
  for (const c of [S.vx, S.vy]) c.g.setAttribute('fill-opacity', 0.5);
  S.v = bigArrow(k, COLOR.vel, arrowSize(1)); S.a = bigArrow(k, COLOR.acc, arrowSize(1));
  S.lvx = sym(k, COLOR.vel, 'v', 'x', S.LB * 0.9); S.lvy = sym(k, COLOR.vel, 'v', 'y', S.LB * 0.9);
  S.lv = sym(k, COLOR.vel, 'v', '', S.LB); S.la = sym(k, COLOR.acc, 'a', '', S.LB);
  // v0 화살표 끝 손잡이. 끌면 길이로 v0(1 m/s 단위), 방향으로 θ0(1° 단위)를 정한다.
  S.grip = grip(k, COLOR.vel, { r: 8 * K, move(p) {
    const dx = p.x - S.X0, dy = S.Y0 - p.y;
    const v = Math.min(V_MAX, Math.round(Math.hypot(dx, dy) / S.KV));
    const a = Math.max(0, Math.min(90, Math.round(Math.atan2(Math.max(dy, 0), dx) * 180 / Math.PI)));
    if (v !== v0() || a !== th0()) { $('v0').value = v; $('th').value = a; changed(); }
  } });
  refit();
});
stage($('graphs'), k => { GK = { hold: k.el('g'), w: k.w, h: k.h }; buildGraphs(); draw(); });

// 오른쪽 그래프. 시간축은 지금 궤적이 땅에 닿는 시각을 올림한 초까지, 세로축은 0과 R, 0과 최고 높이를 담는 1·2·5 끝값이다.
function buildGraphs() {
  if (!GK) return;
  GK.hold.replaceChildren();
  G = timeGraphs(svgKit($('graphs'), GK.hold), { x: 0, y: 0, w: GK.w, h: GK.h, tEnd: Math.max(1, Math.ceil(T() - 1e-9)), panels: [
    { key: 'x', name: qty('x', 'm'), color: XC },
    { key: 'y', name: qty('y', 'm'), color: YC },
  ] });
  G.range('x', ...span(0, range(v0(), th0())));
  G.range('y', ...span(0, maxHeight(v0(), th0())));
}

// 축척과 눈금, 남은 궤적, 예상 궤적(빨간 식), R 치수선을 다시 그린다. 설정을 바꿀 때만 부른다.
function refit() {
  if (!S) return;
  const { el, K, X0, Y0, GY, w } = S, vm = Math.max(1, v0(), ...past.map(p => p.v)), Rm = vm * vm / g, Hm = Rm / 2;
  const s = S.s = snapDown(Math.min((S.XR - X0) / Rm, (Y0 - S.YT) / Hm, 150));
  const fs = 13 * Math.sqrt(K), small = { 'font-size': fs, fill: '#4a3f30' };
  S.axis.replaceChildren();
  const sx = tickStep(s, 56 * K);
  for (let u = 0; X0 + s * u <= w - 64 * K; u += sx) {
    const X = X0 + s * u;
    el('line', { x1: X, y1: GY + 7 * K, x2: X, y2: GY + 12 * K, stroke: '#6e5c40', 'stroke-width': 1.5 }, S.axis);
    el('text', { x: X, y: GY + 26 * K, 'text-anchor': 'middle', ...small }, S.axis).textContent = minus(+u.toPrecision(6));
  }
  el('text', { x: w - 10, y: GY + 26 * K, 'text-anchor': 'end', 'font-size': 15 * Math.sqrt(K) }, S.axis).innerHTML = qty('x', 'm');
  // 출발점 위 높이 자. y = 0은 공 중심의 출발 높이다(0 숫자는 땅 눈금이 맡는다).
  const sy = tickStep(s, 34 * K), top = Y0 - s * Hm;
  el('line', { x1: X0, y1: Y0, x2: X0, y2: top, stroke: '#555555', 'stroke-width': 1.5 }, S.axis);
  for (let u = 0; u <= Hm + 1e-9; u += sy) {
    const Y = Y0 - s * u;
    el('line', { x1: X0 - 6 * K, y1: Y, x2: X0, y2: Y, stroke: '#555555', 'stroke-width': 1.5 }, S.axis);
    if (u > 0) el('text', { x: X0 - 8 * K, y: Y + fs * 0.35, 'text-anchor': 'end', ...small, fill: '#444444' }, S.axis).textContent = minus(+u.toPrecision(6));
  }
  const lx = 6 + 8 * K, ly = (Y0 + top) / 2;
  el('text', { x: lx, y: ly, 'text-anchor': 'middle', 'font-size': 15 * Math.sqrt(K), transform: `rotate(-90 ${lx} ${ly})` }, S.axis).innerHTML = qty('y', 'm');
  // 땅에 닿은 궤적(옅은 회색)
  S.past.replaceChildren();
  for (const p of past) el('polyline', { points: path(p.v, p.th), fill: 'none', stroke: '#8796a3', 'stroke-width': 2, opacity: 0.6 }, S.past);
  // 예상 궤적. 빨간 식 y = (tan θ0) x − g x²/(2 (v0 cos θ0)²)을 x로 따라 그린다(θ0 = 90°는 곧장 위로).
  const V = v0(), A = th0(), R = range(V, A), H = maxHeight(V, A);
  let dd = '';
  if (A >= 90) dd = H > 0 ? `M${X0},${Y0} L${X0},${(Y0 - s * H).toFixed(1)}` : '';
  else if (R > 1e-9) for (let i = 0; i <= 120; i++) { const x = R * i / 120; dd += `${i ? 'L' : 'M'}${(X0 + s * x).toFixed(1)},${(Y0 - s * trajectoryY(V, A, x)).toFixed(1)}`; }
  S.preview.setAttribute('d', dd);
  // 수평 도달 거리 R. 땅 밑 치수선(양 끝 화살촉)과 가운데 R.
  S.dim.replaceChildren();
  const XR = X0 + s * R, yd = GY + 40 * K, hd = 7 * K;
  if (XR - X0 >= 30 * K) {
    const c = { stroke: COLOR.c, 'stroke-width': 1.8 };
    el('line', { x1: X0, y1: yd - hd, x2: X0, y2: yd + hd, ...c }, S.dim);
    el('line', { x1: XR, y1: yd - hd, x2: XR, y2: yd + hd, ...c }, S.dim);
    el('line', { x1: X0, y1: yd, x2: XR, y2: yd, ...c }, S.dim);
    el('path', { d: `M${X0},${yd} l${hd * 1.6},${-hd * 0.6} v${hd * 1.2}Z M${XR},${yd} l${-hd * 1.6},${-hd * 0.6} v${hd * 1.2}Z`, fill: COLOR.c }, S.dim);
    el('rect', { x: (X0 + XR) / 2 - 12 * K, y: yd - 9 * K, width: 24 * K, height: 18 * K, fill: '#e2d5b8' }, S.dim);
    const lr = sym(S.k, COLOR.c, 'R', '', 15 * K);
    S.dim.appendChild(lr); S.set(lr, { x: (X0 + XR) / 2, y: yd + 5.5 * K, stroke: '#e2d5b8' });
  }
  buildGraphs();
  draw();
}
// 처음 속력 V, 발사각 A로 시각 tEnd까지 난 궤적의 점들(화면 좌표)
function path(V, A, tEnd = flightTime(V, A)) {
  const n = Math.max(2, Math.ceil(tEnd * 60)), out = [];
  for (let i = 0; i <= n; i++) { const q = projectile(V, A, tEnd * i / n); out.push(`${(S.X0 + S.s * q.x).toFixed(1)},${(S.Y0 - S.s * q.y).toFixed(1)}`); }
  return out.join(' ');
}

function draw() {
  if (!S) return;
  const { el, set, s, X0, Y0, GY, K, KV } = S, V = v0(), A = th0(), Tf = T(), p = projectile(V, A, t);
  const X = X0 + s * p.x, Y = Y0 - s * p.y, inAir = t > 0 && t < Tf - 1e-9;
  set(S.ball, { transform: `translate(${X.toFixed(1)},${Y.toFixed(1)})` });
  S.trail.setAttribute('points', path(V, A, t));
  S.marks.replaceChildren();
  if ($('strobe').checked) for (let i = 0; i * STROBE <= t + 1e-9; i++) {
    const q = projectile(V, A, i * STROBE), mx = X0 + s * q.x, my = Y0 - s * q.y;
    el('line', { x1: mx, y1: GY, x2: mx, y2: GY + 7 * K, stroke: XC, 'stroke-width': 2.5 }, S.marks);
    el('line', { x1: X0, y1: my, x2: X0 + 7 * K, y2: my, stroke: YC, 'stroke-width': 2.5 }, S.marks);
    if (i) el('circle', { cx: mx, cy: my, r: 4 * K, fill: '#ffffff', stroke: COLOR.ink, 'stroke-width': 1.5 }, S.marks);
  }
  set(S.gx, { x1: X, y1: Y, x2: X, y2: GY }); set(S.gy, { x1: X, y1: Y, x2: X0, y2: Y });
  set(S.dx, { cx: X, cy: GY + 3.5 * K }); set(S.dy, { cx: X0, cy: Y });
  // 출발점의 v0 화살표와 θ0, 손잡이. 나는 동안에는 숨긴다.
  const c = Math.cos(A * Math.PI / 180), sn = Math.sin(A * Math.PI / 180), L0 = KV * V, ra = 26 * K, am = A * Math.PI / 360;
  S.launch.set(X0, Y0, X0 + L0 * c, Y0 - L0 * sn);
  set(S.l0, { x: X0 + (L0 + 22 * K) * c, y: Y0 - (L0 + 22 * K) * sn + 6 * K });
  S.arc.setAttribute('d', A > 0 ? `M${X0 + ra},${Y0} A${ra},${ra} 0 0 0 ${(X0 + ra * c).toFixed(1)},${(Y0 - ra * sn).toFixed(1)}` : '');
  set(S.lth, { x: X0 + (ra + 14 * K) * Math.cos(am), y: Y0 - (ra + 14 * K) * Math.sin(am) + 5 * K });
  set(S.grip, { cx: X0 + L0 * c, cy: Y0 - L0 * sn });
  for (const e of [S.launch.g, S.l0, S.arc, S.lth, S.grip]) if (inAir) e.style.display = 'none'; else if (e !== S.launch.g) e.style.display = '';
  if (!inAir) { S.l0.style.display = L0 < 24 ? 'none' : ''; S.lth.style.display = A >= 8 ? '' : 'none'; }
  // 나는 동안과 땅에 닿은 순간의 속도, 성분, 가속도. 출발 전에는 v0 화살표가 v다.
  const ux = KV * p.vx, uy = KV * p.vy, Lv = Math.hypot(ux, uy), on = t > 0, comp = on && $('comp').checked && ux >= 3;   // 곧장 위로 차면 v_y가 v다
  S.vx.set(X, Y, X + ux, Y); S.vy.set(X + ux, Y, X + ux, Y - uy);
  if (!comp) { S.vx.g.style.display = 'none'; S.vy.g.style.display = 'none'; }
  set(S.lvx, { x: X + Math.max(ux / 2, 22 * K), y: Y + (uy >= 0 ? 26 * K : -12 * K) });
  set(S.lvy, { x: X + ux + 18 * K, y: Y - uy / 2 + 6 * K });
  S.lvx.style.display = comp && ux >= 18 * K ? '' : 'none';
  S.lvy.style.display = comp && Math.abs(uy) >= 18 * K ? '' : 'none';
  S.v.set(X, Y, X + ux, Y - uy); if (!on) S.v.g.style.display = 'none';
  // v 이름은 화살촉 앞에 둔다. 장면 아래 끝을 넘으면 화살촉 오른쪽으로 옮긴다.
  let lx = X + ux + 16 * K * ux / (Lv || 1), ly = Y - uy - 16 * K * uy / (Lv || 1) + 6 * K;
  if (ly > S.h - 6) { lx = X + ux + 18 * K; ly = S.h - 8; }
  set(S.lv, { x: lx, y: ly });
  S.lv.style.display = on && Lv >= 18 * K ? '' : 'none';
  const La = KV * g;
  S.a.set(X, Y, X, Y + La); if (!inAir) S.a.g.style.display = 'none';
  set(S.la, { x: X - 14 * K, y: Y + La - 2 * K }); S.la.style.display = inAir ? '' : 'none';
  if (G) {
    const n = Math.max(2, Math.ceil(t * 40)), xs = [], ys = [];
    for (let i = 0; i <= n; i++) { const u = t * i / n, q = projectile(V, A, u); xs.push([u, q.x]); ys.push([u, q.y]); }
    G.draw({ x: xs, y: ys }, t);
  }
  $('tval').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}`);
  $('v0val').innerHTML = tex(`${V}\\ \\mathrm{m/s}`);
  $('thval').innerHTML = tex(`${A}^\\circ`);
  $('vxval').innerHTML = tex(`v_x = ${fmt(p.vx, 2)}\\ \\mathrm{m/s}`);
  $('vyval').innerHTML = tex(`v_y = ${fmt(p.vy, 2)}\\ \\mathrm{m/s}`);
  $('Rval').innerHTML = tex(`\\textcolor{#840025}{R = ${fmt(range(V, A), 1)}\\ \\mathrm{m}}`);
}

function changed() { ck.stop(); t = 0; refit(); }
const ck = clock({
  step(dt) {
    const Tf = T();
    t = Math.min(Tf, t + dt);
    if (t >= Tf && Tf > 0) {   // 땅에 닿은 궤적을 남긴다(같은 설정은 한 번만)
      const V = v0(), A = th0();
      if (!past.some(p => p.v === V && p.th === A)) { past.push({ v: V, th: A }); if (past.length > KEEP) past.shift(); refit(); }
    }
    draw();
    return t < Tf;
  },
  reset() { t = 0; draw(); },
  ended: () => t >= T() - 1e-12,
});
$('reset').addEventListener('click', () => { past = []; refit(); });
for (const id of ['v0', 'th']) $(id).addEventListener('input', changed);
for (const id of ['strobe', 'comp']) $(id).addEventListener('change', draw);
draw();
