// 3장 "외적" 시뮬레이션(공용 틀 core/simshell.js, 그래프 칸은 plane.js). xy 평면(바닥 격자) 위에 a(파랑)와 b(주황)를 원점에서 그리고,
// c = a × b(진한 빨강)를 z축 방향으로 세운다. ϕ는 a에서 b로 반시계 방향(+z 쪽에서 볼 때)으로 잰 각(0–360°)이고 c_z = ab sin ϕ다
// (ϕ를 0–360°로 넓힌 것은 사용자 결정 2026-11-16). ϕ가 180°보다 크면 c_z가 음수라 c는 바닥 아래(−z)로 내려가고, 바닥이 그 부분을 가린다.
// a, b는 바닥 위 머리 손잡이를 끌거나(크기 0.1, 방향 5° 단위) slider로 바꾼다. slider ϕ는 a는 두고 b를 a에서 ϕ만큼 돌린다.
// 오른손 규칙 표시는 a에서 b로 두 벡터 사이의 작은 각을 따라 그린 진한 빨강 호 화살표다(교재 3.3, 그림 3.3.2). 검은 호와 ϕ는 반시계로 잰 각이다.
// "b × a"를 고르면 c = b × a = −(a × b)다(교재 3.3.6). 오른손 호도 b에서 a로 바뀐다.
// 3D는 회전한 점을 화면에 직접 투영(평행 투영)해 SVG로 그린다. 손잡이가 아닌 곳을 끌면 시점이 돈다(위아래 기울기 20–70°).
// 크기는 0.5–1.5다. c_z가 최대 2.25라 바닥 위 a, b가 c에 비해 너무 작아지지 않는다.
// 오른쪽 칸(svg.graphs) 그래프는 지금의 a, b와 곱 순서로 c_z를 ϕ = 0–360°에 그린다. 세로축은 a, b 최대(1.5)일 때의 ±2.25가 들어가는 ±2.5로 고정한다.
// 글자·화살표·손잡이는 장면 크기에 맞춰 배율 K로 함께 키운다(plane.js scaleOf).
import { cross, rad, polar, ccw, snap } from './vec.js';
import { COLOR, tex, fmt } from '../../core/simkit.js';
import { stage, bigArrow } from '../../core/simshell.js';
import { scaleOf, readoutGap, grip, halo, phiGraph, sub as subscript, SERIF } from './plane.js';

const $ = id => document.getElementById(id);
const MAX = 1.5, FLOOR = 2, START = { A: 1.5, al: 0, B: 1.2, be: 70, yaw: 240, pitch: 26 };
let { A, al, B, be, yaw, pitch } = START;   // 크기와 x축에서 잰 방향각(도), 시점
let P = null, G = null;   // 장면과 그래프. 화면 크기가 바뀌면 stage가 다시 만든다.
const order = () => ($('ba').checked ? 'ba' : 'ab');
const phi = () => ccw(al, be);

// 3D 점 → 화면. z축이 위, 시점은 z축 둘레 yaw와 바닥 기울기 pitch.
function project([x, y, z]) {
  const w = rad(yaw), p = rad(pitch);
  const x1 = x * Math.cos(w) - y * Math.sin(w), y1 = x * Math.sin(w) + y * Math.cos(w);
  return [P.CX + P.U * x1, P.CY - P.U * (z * Math.cos(p) + y1 * Math.sin(p))];
}
// 화면 점 → 바닥(z = 0) 위의 점
function unproject(X, Y) {
  const w = rad(yaw), p = rad(pitch), x1 = (X - P.CX) / P.U, y1 = -(Y - P.CY) / (P.U * Math.sin(p));
  return [x1 * Math.cos(w) + y1 * Math.sin(w), -x1 * Math.sin(w) + y1 * Math.cos(w)];
}

stage($('scene'), k => {
  const { el, w, h } = k;
  const K = scaleOf(w, h), q = Math.sqrt(K), top = readoutGap(w);
  // c는 위아래로 최대 MAX² 단위(기울기 20°일 때 가장 길다). 원점은 가운데보다 오른쪽에 두어 왼쪽 위 읽기 칸과 c가 겹치지 않게 한다.
  const U = Math.max(30, Math.min((h - top - 44 * q) / (2 * MAX * MAX * Math.cos(rad(20))), w / 7));
  const V = { bw: 6 * K, hl: 15 * K, hw: 18 * K };
  const line = (attrs, parent) => el('line', attrs, parent);
  P = { k, K, q, U, CX: Math.round(w * (top ? 0.5 : 0.58)), CY: Math.round(top + (h - top) / 2),
    under: el('g'), floor: el('g'), over: el('g') };
  const gridAttrs = { stroke: '#d5dde6', 'stroke-width': 1 };
  P.plate = el('polygon', { fill: '#eef3f8', 'fill-opacity': 0.82, stroke: '#9fb0c2', 'stroke-width': 1.2 }, P.floor);
  P.grid = [];
  for (let i = -FLOOR; i <= FLOOR + 1e-9; i += 0.5) if (Math.abs(i) > 1e-9 && Math.abs(Math.abs(i) - FLOOR) > 1e-9) P.grid.push([i, line(gridAttrs, P.floor), line(gridAttrs, P.floor)]);
  const axis = { stroke: '#6f6f6f', 'stroke-width': 1.5 };
  P.ax = { x: line(axis, P.floor), y: line(axis, P.floor), zlo: line({ ...axis, 'stroke-dasharray': '5 4' }, P.under), zhi: line(axis, P.over) };
  const nameA = { 'font-size': 20 * q, 'font-style': 'italic', 'font-family': SERIF, fill: '#333333', 'text-anchor': 'middle' };
  P.an = { x: halo(el('text', nameA, P.over)), y: halo(el('text', nameA, P.over)), z: halo(el('text', nameA, P.over)) };
  for (const n of ['x', 'y', 'z']) P.an[n].textContent = n;
  P.phiArc = el('polyline', { fill: 'none', stroke: COLOR.ink, 'stroke-width': 1.5 * q }, P.over);
  P.lphi = halo(el('text', { 'font-size': 19 * K, 'font-style': 'italic', 'font-family': SERIF, 'text-anchor': 'middle' }, P.over));
  P.lphi.textContent = 'ϕ';
  P.sweep = el('polyline', { fill: 'none', stroke: COLOR.c, 'stroke-width': 2.5 * q, 'marker-end': 'url(#h-c)' }, P.over);
  P.Av = bigArrow(k, COLOR.a, V); P.Bv = bigArrow(k, COLOR.b, V); P.Cv = bigArrow(k, COLOR.c, V);
  for (const g of [P.Av.g, P.Bv.g]) P.over.appendChild(g);
  P.la = halo(k.label('a', 'a')); P.lb = halo(k.label('b', 'b')); P.lc = halo(k.label('c', 'c'));
  for (const t of [P.la, P.lb, P.lc]) { t.setAttribute('font-size', 19 * K); P.over.appendChild(t); }
  const dragTo = which => (X, Y) => {
    const [u, v] = unproject(X, Y), m = snap(Math.hypot(u, v), 0.1, 0.5, MAX), d = (snap(Math.atan2(v, u) * 180 / Math.PI, 5) + 360) % 360;
    if (which === 'a') { A = m; al = d; } else { B = m; be = d; }
    sync();
  };
  // 방향키 ←·→는 5°씩 돌리고(←가 반시계), ↑·↓는 크기를 0.1씩 바꾼다.
  const keyTo = which => (dx, dy) => {
    if (which === 'a') { al = (al - 5 * dx + 360) % 360; A = snap(A + 0.1 * dy, 0.1, 0.5, MAX); }
    else { be = (be - 5 * dx + 360) % 360; B = snap(B + 0.1 * dy, 0.1, 0.5, MAX); }
    sync();
  };
  P.gb = grip(k, COLOR.b, { name: '벡터 b의 머리', move: dragTo('b'), key: keyTo('b'), K });
  P.ga = grip(k, COLOR.a, { name: '벡터 a의 머리', move: dragTo('a'), key: keyTo('a'), K });
  sync();
});
stage($('graphs'), k => {
  G = phiGraph(k, { x: 0, y: 0, w: k.w, h: k.h, K: scaleOf(k.w, k.h), phiMax: 360, phiTicks: [0, 90, 180, 270, 360],
    yTicks: [-2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5], name: subscript('c', 'z') });
  draw();
});

// 손잡이가 아닌 곳을 끌면 시점이 돈다.
let turn = null;
const svg = $('scene');
svg.style.cursor = 'move'; svg.style.userSelect = 'none';
svg.addEventListener('pointerdown', ev => { ev.preventDefault(); turn = [ev.clientX, ev.clientY, ev.pointerId]; svg.setPointerCapture(ev.pointerId); });
svg.addEventListener('pointermove', ev => {
  if (!turn || ev.pointerId !== turn[2]) return;
  yaw = (yaw - (ev.clientX - turn[0]) * 0.4 + 360) % 360;
  pitch = Math.max(20, Math.min(70, pitch + (ev.clientY - turn[1]) * 0.3));
  turn = [ev.clientX, ev.clientY, turn[2]];
  draw();
});
for (const e of ['pointerup', 'pointercancel']) svg.addEventListener(e, () => { turn = null; });

// 끈 뒤 slider를 맞추고 다시 그린다.
function sync() {
  $('a').value = A; $('b').value = B; $('phi').value = Math.round(phi());
  draw();
}

// 바닥 위 반지름 r의 호(방향각 d0에서 d1까지, d1 > d0이면 반시계)
function arcPts(r, d0, d1) {
  return Array.from({ length: 41 }, (_, i) => project([...polar(r, d0 + (d1 - d0) * i / 40), 0]).map(v => v.toFixed(1)).join(',')).join(' ');
}
// 이름은 머리 옆, 화면에서 다른 벡터의 반대쪽에 둔다(머리 너머는 축 이름 자리다).
function tipName(t, O, P2, T) {
  const L = Math.hypot(P2[0] - O[0], P2[1] - O[1]), K = P.K;
  t.style.display = L < 1 ? 'none' : '';
  if (L < 1) return;
  const ux = (P2[0] - O[0]) / L, uy = (P2[1] - O[1]) / L;
  let nx = -uy, ny = ux;
  if ((T[0] - O[0]) * nx + (T[1] - O[1]) * ny > 0) { nx = -nx; ny = -ny; }
  P.k.set(t, { x: P2[0] + ux * 4 * K + nx * 22 * K, y: P2[1] + uy * 4 * K + ny * 22 * K + 6 * K });
}

function draw() {
  if (!P || !G) return;
  const { k, K, q } = P, { set } = k;
  const p = phi(), sg = order() === 'ab' ? 1 : -1;
  const a = [...polar(A, al), 0], b = [...polar(B, be), 0], c = order() === 'ab' ? cross(a, b) : cross(b, a);
  const O = project([0, 0, 0]);
  // 바닥, 격자, 축
  const F = FLOOR;
  P.plate.setAttribute('points', [[-F, -F], [F, -F], [F, F], [-F, F]].map(([x, y]) => project([x, y, 0]).map(v => v.toFixed(1)).join(',')).join(' '));
  for (const [i, l1, l2] of P.grid) {
    const [x1, y1] = project([i, -F, 0]), [x2, y2] = project([i, F, 0]); set(l1, { x1, y1, x2, y2 });
    const [x3, y3] = project([-F, i, 0]), [x4, y4] = project([F, i, 0]); set(l2, { x1: x3, y1: y3, x2: x4, y2: y4 });
  }
  const seg = (e, p1, p2) => { const [x1, y1] = project(p1), [x2, y2] = project(p2); set(e, { x1, y1, x2, y2 }); };
  const Z = MAX * MAX + 0.25;
  seg(P.ax.x, [-F, 0, 0], [F + 0.5, 0, 0]); seg(P.ax.y, [0, -F, 0], [0, F + 0.5, 0]);
  seg(P.ax.zlo, [0, 0, -Z], [0, 0, 0]); seg(P.ax.zhi, [0, 0, 0], [0, 0, Z]);
  const nm = (t, pt) => { const [x, y] = project(pt); set(t, { x, y: y + 7 * q }); };
  nm(P.an.x, [F + 0.85, 0, 0]); nm(P.an.y, [0, F + 0.85, 0]);
  const [zx, zy] = project([0, 0, Z]); set(P.an.z, { x: zx + 14 * q, y: zy + 8 * q });   // z는 축 끝 오른쪽
  // ϕ 호(반시계)와 오른손 규칙 호(작은 각, 곱의 앞 벡터에서 뒤 벡터로)
  P.phiArc.setAttribute('points', arcPts(0.95, al, al + p));
  const [lx, ly] = project([...polar(1.2, al + p / 2), 0]);
  set(P.lphi, { x: lx, y: ly + 7 * K });
  P.phiArc.style.display = P.lphi.style.display = p < 1 ? 'none' : '';
  const small = p <= 180 ? p : p - 360;   // a에서 b로 작은 각(부호는 방향)
  const [s0, s1] = sg > 0 ? [al, al + small] : [be, be - small];
  P.sweep.setAttribute('points', arcPts(0.6, s0, s1));
  P.sweep.style.display = Math.abs(Math.sin(rad(p))) < 0.02 ? 'none' : '';
  // 벡터. c가 아래(−z)면 바닥보다 먼저 그려 바닥이 가리게 한다.
  const Ap = project(a), Bp = project(b), Cp = project(c);
  P.Av.set(...O, ...Ap); P.Bv.set(...O, ...Bp); P.Cv.set(...O, ...Cp);
  (c[2] < 0 ? P.under : P.over).appendChild(P.Cv.g);
  tipName(P.la, O, Ap, Bp); tipName(P.lb, O, Bp, Ap);
  P.lc.style.display = Math.abs(c[2]) < 0.05 ? 'none' : '';
  set(P.lc, { x: Cp[0] + 22 * K, y: Cp[1] + (c[2] >= 0 ? 12 : 4) * K });
  (c[2] < 0 ? P.under : P.over).appendChild(P.lc);
  P.ga.at(...Ap); P.gb.at(...Bp);
  G.draw(t => sg * A * B * Math.sin(rad(t)), p);

  $('aval').innerHTML = tex(fmt(A));
  $('bval').innerHTML = tex(fmt(B));
  $('phival').innerHTML = tex(`${fmt(p, 0)}^\\circ`);
  $('cname').innerHTML = tex(sg > 0 ? '\\vec c = \\vec a\\times\\vec b' : '\\vec c = \\vec b\\times\\vec a');
  $('czval').innerHTML = tex(`\\textcolor{#840025}{c_z = ${sg > 0 ? '' : '-'}ab\\sin\\phi = ${fmt(c[2], 2)}}`);
}

$('a').addEventListener('input', () => { A = Number($('a').value); draw(); });
$('b').addEventListener('input', () => { B = Number($('b').value); draw(); });
$('phi').addEventListener('input', () => { be = (al + Number($('phi').value)) % 360; draw(); });
for (const id of ['ab', 'ba']) $(id).addEventListener('change', draw);
$('reset').addEventListener('click', () => { ({ A, al, B, be, yaw, pitch } = START); $('ab').checked = true; sync(); });
sync();
