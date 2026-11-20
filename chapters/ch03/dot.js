// 3장 "내적" 시뮬레이션(공용 틀 core/simshell.js, 좌표평면과 그래프 칸은 plane.js). 원점에서 그린 a(파랑)와 b(주황)의 끝 손잡이를 끌거나
// slider로 크기 a, b와 사이각 ϕ를 바꾼다. 끌면 크기는 0.5, 방향은 5° 단위로 맞춘다. slider ϕ는 a를 b에서 지금 쪽으로 ϕ만큼 돌린다.
// a의 머리에서 b의 방향선(점선)으로 수직선을 내리고, 원점에서 그 발까지를 옅은 파랑 막대로 그린다. 이 막대가 b 방향으로의 a의 성분 a cos ϕ다
// (교재 3.3.1·3.3.2). ϕ가 90°보다 크면 막대는 b의 반대쪽으로 뻗고 값은 음수다.
// 오른쪽 칸(svg.graphs, 좁은 화면에서는 아래) 그래프는 지금의 a, b로 a·b = ab cos ϕ를 ϕ = 0–180°에 그리고 지금 값에 점을 찍는다.
// 세로축은 a, b가 최대(5)일 때의 ±25가 들어가는 ±30으로 고정해 곡선의 높이가 ab에 비례하는 것이 보이게 한다.
// 글자·화살표·손잡이는 장면 크기에 맞춰 배율 K로 함께 키운다(plane.js scaleOf).
// 방향키(손잡이에 포커스)는 ←·→로 5°씩 돌리고 ↑·↓로 크기를 0.5씩 바꾼다.
import { dot, rad, polar, between, snap } from './vec.js';
import { COLOR, tex, fmt } from '../../core/simkit.js';
import { stage, bigArrow } from '../../core/simshell.js';
import { plane, plotBox, scaleOf, readoutGap, grip, halo, phiGraph, vtx, SERIF } from './plane.js';

const $ = id => document.getElementById(id);
const MAX = 5, START = { A: 3, al: 50, B: 4, be: 0 };
let { A, al, B, be } = START, side = 1;   // 크기와 x축에서 잰 방향각(도). side는 a가 b에서 반시계 쪽(+1)인지 시계 쪽(−1)인지
let P = null, G = null;   // 장면과 그래프. 화면 크기가 바뀌면 stage가 다시 만든다.
const phi = () => between(be, al);

stage($('scene'), k => {
  const { el, w, h } = k;
  const K = scaleOf(w, h), q = Math.sqrt(K), top = readoutGap(w), box = plotBox(0, top, w, h - top, K);
  const S = Math.max(16, Math.min(60, Math.floor(Math.min(box.w, box.h) / (2 * MAX + 1.5))));
  const pl = plane(k, { ...box, S, ox: box.x + box.w / 2, oy: box.y + box.h / 2, K });
  const lim = Math.min(MAX, Math.floor(Math.min(box.w, box.h) / 2 / S - 0.25));
  const clip = el('clipPath', { id: 'pclip' }); el('rect', { x: box.x, y: box.y, width: box.w, height: box.h }, clip);   // b의 방향선을 평면 안에서 자른다
  const inPlane = el('g', { 'clip-path': 'url(#pclip)' });
  const V = { bw: 6 * K, hl: 15 * K, hw: 18 * K };
  P = { k, pl, lim, K, q,
    bline: el('line', { stroke: '#b5b5b5', 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, inPlane),
    proj: el('line', { stroke: COLOR.a, 'stroke-width': 6 * K, 'stroke-opacity': 0.5 }),
    lproj: halo(el('text', { 'font-size': 18 * q, fill: COLOR.a, 'text-anchor': 'middle' })),
    perp: el('line', { stroke: '#8a8a8a', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
    corner: el('path', { fill: 'none', stroke: '#8a8a8a', 'stroke-width': 1.2 }),
    arc: el('path', { fill: 'none', stroke: COLOR.ink, 'stroke-width': 1.5 * q }),
    lphi: halo(el('text', { 'font-size': 19 * K, 'font-style': 'italic', 'font-family': SERIF, 'text-anchor': 'middle' })),
    Bv: bigArrow(k, COLOR.b, V), Av: bigArrow(k, COLOR.a, V),
    la: halo(k.label('a', 'a')), lb: halo(k.label('b', 'b')) };
  P.lproj.innerHTML = `<tspan font-style="italic" font-family="${SERIF}">a</tspan> cos <tspan font-style="italic" font-family="${SERIF}">ϕ</tspan>`;
  P.lphi.textContent = 'ϕ';
  for (const t of [P.la, P.lb]) t.setAttribute('font-size', 19 * K);
  const dragTo = which => (X, Y) => {
    const [u, v] = pl.un(X, Y), m = snap(Math.hypot(u, v), 0.5, 0.5, lim), d = (snap(Math.atan2(v, u) * 180 / Math.PI, 5) + 360) % 360;
    if (which === 'a') { A = m; al = d; } else { B = m; be = d; }
    sync();
  };
  const keyTo = which => (dx, dy) => {
    if (which === 'a') { al = (al - 5 * dx + 360) % 360; A = snap(A + 0.5 * dy, 0.5, 0.5, lim); }
    else { be = (be - 5 * dx + 360) % 360; B = snap(B + 0.5 * dy, 0.5, 0.5, lim); }
    sync();
  };
  P.gb = grip(k, COLOR.b, { name: '벡터 b의 머리', move: dragTo('b'), key: keyTo('b'), K });
  P.ga = grip(k, COLOR.a, { name: '벡터 a의 머리', move: dragTo('a'), key: keyTo('a'), K });
  A = Math.min(A, lim); B = Math.min(B, lim);
  sync();
});
stage($('graphs'), k => {
  G = phiGraph(k, { x: 0, y: 0, w: k.w, h: k.h, K: scaleOf(k.w, k.h), phiMax: 180, phiTicks: [0, 45, 90, 135, 180],
    yTicks: [-30, -20, -10, 0, 10, 20, 30], name: `${vtx('a')} · ${vtx('b')}` });
  draw();
});

// 끈 뒤 slider와 side를 맞추고 다시 그린다.
function sync() {
  const s = Math.sin(rad(al - be));
  if (Math.abs(s) > 1e-9) side = s > 0 ? 1 : -1;
  $('a').value = A; $('b').value = B; $('phi').value = Math.round(phi());
  draw();
}

// 벡터 이름은 머리 바로 너머, 다른 벡터의 반대쪽에 둔다(가운데 옆자리는 a cos ϕ 막대와 사이각 호가 쓴다).
function nameAtTip(t, O, P2, T) {
  const L = Math.hypot(P2[0] - O[0], P2[1] - O[1]), K = P.K;
  if (L < 1) { t.style.display = 'none'; return; }
  t.style.display = '';
  const ux = (P2[0] - O[0]) / L, uy = (P2[1] - O[1]) / L;
  let nx = -uy, ny = ux;
  if ((T[0] - O[0]) * nx + (T[1] - O[1]) * ny > 0) { nx = -nx; ny = -ny; }
  P.k.set(t, { x: P2[0] + ux * 8 * K + nx * 20 * K, y: P2[1] + uy * 8 * K + ny * 20 * K + 6 * K });
}

function draw() {
  if (!P || !G) return;
  const { k, pl, K, q } = P, { set } = k;
  const p = phi(), a = polar(A, al), b = polar(B, be), u = polar(1, be);
  const O = pl.px([0, 0]), Ap = pl.px(a), Bp = pl.px(b);
  const comp = A * Math.cos(rad(p)), F = [comp * u[0], comp * u[1]], Fp = pl.px(F);
  // b의 방향선, 수직선, 직각 표시
  const far = 40;
  set(P.bline, { x1: O[0] - far * pl.S * u[0], y1: O[1] + far * pl.S * u[1], x2: O[0] + far * pl.S * u[0], y2: O[1] - far * pl.S * u[1] });
  set(P.perp, { x1: Ap[0], y1: Ap[1], x2: Fp[0], y2: Fp[1] });
  const hgt = Math.hypot(Ap[0] - Fp[0], Ap[1] - Fp[1]);
  P.perp.style.display = hgt < 2 ? 'none' : '';
  // 화면 좌표에서 b 방향 단위 e, F에서 a 머리 쪽 단위 n
  const e = [u[0], -u[1]], nn = hgt > 1e-6 ? [(Ap[0] - Fp[0]) / hgt, (Ap[1] - Fp[1]) / hgt] : [-e[1], e[0]];
  const cq = 9 * q, bk = comp >= 0 ? -1 : 1;   // 직각 표시는 원점 쪽으로 꺾는다
  P.corner.setAttribute('d', `M${Fp[0] + bk * cq * e[0]},${Fp[1] + bk * cq * e[1]} l${cq * nn[0]},${cq * nn[1]} l${-bk * cq * e[0]},${-bk * cq * e[1]}`);
  P.corner.style.display = hgt < 14 || Math.abs(comp) * pl.S < 14 ? 'none' : '';
  // a cos ϕ 막대는 b의 방향선에서 a 반대쪽으로 비켜 그린다
  const off = 9 * K;
  set(P.proj, { x1: O[0] - nn[0] * off, y1: O[1] - nn[1] * off, x2: Fp[0] - nn[0] * off, y2: Fp[1] - nn[1] * off });
  P.proj.style.display = Math.abs(comp) * pl.S < 1 ? 'none' : '';
  set(P.lproj, { x: (O[0] + Fp[0]) / 2 - nn[0] * (off + 16 * q), y: (O[1] + Fp[1]) / 2 - nn[1] * (off + 16 * q) + 6 * q });
  P.lproj.style.display = Math.abs(comp) * pl.S < 24 ? 'none' : '';
  // 사이각 ϕ는 b와 a 사이의 작은 각을 따라 그린 호다
  const r = 30 * K, from = side > 0 ? be : al, mid = rad(from + p / 2);
  const pt = d => [O[0] + r * Math.cos(rad(d)), O[1] - r * Math.sin(rad(d))];
  const [x0, y0] = pt(from), [x1, y1] = pt(from + p);
  P.arc.setAttribute('d', `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 0 ${x1.toFixed(1)},${y1.toFixed(1)}`);
  set(P.lphi, { x: O[0] + (r + 13 * K) * Math.cos(mid), y: O[1] - (r + 13 * K) * Math.sin(mid) + 6 * K });
  P.arc.style.display = P.lphi.style.display = p < 1 ? 'none' : '';
  P.Bv.set(...O, ...Bp); P.Av.set(...O, ...Ap);
  nameAtTip(P.la, O, Ap, Bp); nameAtTip(P.lb, O, Bp, Ap);
  P.ga.at(...Ap); P.gb.at(...Bp);
  G.draw(t => A * B * Math.cos(rad(t)), p);

  const d = dot(a, b);
  $('aval').innerHTML = tex(fmt(A));
  $('bval').innerHTML = tex(fmt(B));
  $('phival').innerHTML = tex(`${fmt(p, 0)}^\\circ`);
  $('compval').innerHTML = tex(`a\\cos\\phi = ${fmt(comp, 2)}`);
  $('dotval').innerHTML = tex(`\\textcolor{#840025}{\\vec a\\cdot\\vec b = ab\\cos\\phi = ${fmt(d, 2)}}`);
}

$('a').addEventListener('input', () => { A = Math.min(Number($('a').value), P?.lim ?? MAX); draw(); });
$('b').addEventListener('input', () => { B = Math.min(Number($('b').value), P?.lim ?? MAX); draw(); });
$('phi').addEventListener('input', () => { al = (be + side * Number($('phi').value) + 360) % 360; draw(); });
$('reset').addEventListener('click', () => { ({ A, al, B, be } = START); side = 1; sync(); });
sync();
