// 3장 "벡터의 합성" 시뮬레이션(공용 틀 core/simshell.js, 좌표평면은 plane.js). 격자 위에서 a(파랑)의 머리에 b(주황)의 꼬리를 잇고
// 원점에서 b의 머리까지 합 r(진한 빨강)을 그린다(교재 3.1, 머리–꼬리 합). 두 화살표 끝 손잡이를 끌면 0.5칸 단위로 바뀐다.
// a를 끌면 b는 그대로 a의 머리를 따라가고, b의 손잡이는 r의 머리와 같은 점이다.
// "성분"을 켜면 각 끝에서 축으로 내린 점선과, x축 아래에 a_x, 그 머리에서 시작하는 b_x, r_x 화살표를 한 줄씩 쌓는다.
// 축 위에서도 머리–꼬리로 이어 붙인 길이가 r_x와 같다(r_x = a_x + b_x, 교재 3.2.4·3.2.5). y도 같다.
// "순서 바꾸기"는 b를 먼저, a를 나중에 이은 경로를 점선으로 겹쳐 같은 r에 닿는 것을 보인다(교재 3.1.2).
// a − b를 고르면 b 대신 −b를 a의 머리에 잇고 결과를 d로 부른다(교재 3.1.4, 성분은 3.2.7). 원래의 b는 원점에서 점선으로 남긴다.
// 방향키(손잡이에 포커스)는 0.5칸씩 옮긴다. 글자·화살표·손잡이는 장면 크기에 맞춰 배율 K로 함께 키운다(plane.js scaleOf).
import { add, sub, mag, snap } from './vec.js';
import { COLOR, tex, fmt } from '../../core/simkit.js';
import { stage, bigArrow } from '../../core/simshell.js';
import { plane, plotBox, scaleOf, readoutGap, grip, nameBeside, halo, sub as subscript } from './plane.js';

const $ = id => document.getElementById(id);
const STEP = 0.5, START = { a: [4, 1], b: [1, 3] };
let a = [...START.a], b = [...START.b];
const op = () => ($('op-sub').checked ? 'sub' : 'add');
const second = () => (op() === 'add' ? b : [-b[0] + 0, -b[1] + 0]);   // a의 머리에 잇는 벡터
let P = null;   // 장면. 화면 크기가 바뀌면 stage가 다시 만든다.
// 덧셈 한 줄. 뒤 항이 음수면 괄호로 묶는다.
const n = v => String(+v.toFixed(2));
const term = v => (v < 0 ? `(${n(v)})` : n(v));

stage($('scene'), k => {
  const { el, w, h } = k;
  const K = scaleOf(w, h), q = Math.sqrt(K), top = readoutGap(w), box = plotBox(0, top, w, h - top, K);
  const S = Math.max(18, Math.min(60, Math.floor(box.h / 12), Math.floor(box.w / 11)));   // 좁은 화면에서도 ±5칸은 보인다
  const pl = plane(k, { ...box, S, ox: box.x + box.w / 2, oy: box.y + box.h / 2, K });
  const XL = Math.floor(box.w / 2 / S - 0.25), YL = Math.floor(box.h / 2 / S - 0.25);
  const C = { bw: 4 * q, hl: 10 * q, hw: 11 * q }, V = { bw: 6 * K, hl: 15 * K, hw: 18 * K };
  P = { k, pl, XL, YL, K, q,
    comp: el('g'), swap: el('g'), ref: el('g'),
    CA: { ax: bigArrow(k, COLOR.a, C), bx: bigArrow(k, COLOR.b, C), rx: bigArrow(k, COLOR.c, C),
      ay: bigArrow(k, COLOR.a, C), by: bigArrow(k, COLOR.b, C), ry: bigArrow(k, COLOR.c, C) },
    drops: [0, 1, 2, 3].map(() => el('line', { stroke: '#9a9a9a', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' })),
    crx: el('text', { 'font-size': 18 * q, fill: COLOR.c, 'text-anchor': 'middle' }),
    cry: el('text', { 'font-size': 18 * q, fill: COLOR.c, 'text-anchor': 'end' }),
    fill: el('polygon', { fill: COLOR.c, 'fill-opacity': 0.06, stroke: 'none' }),
    sw1: k.arrow('b', 2 * q, '7 5'), sw2: k.arrow('a', 2 * q, '7 5'), sl1: k.label('b', 'b'), sl2: k.label('a', 'a'),
    rb: k.arrow('b', 2 * q, '7 5'), rbl: k.label('b', 'b'),
    R: bigArrow(k, COLOR.c, V), A: bigArrow(k, COLOR.a, V), B: bigArrow(k, COLOR.b, V),
    la: k.label('a', 'a'), lb: k.label('b', 'b'), lr: k.label('c', 'r') };
  for (const e of [...P.drops, ...Object.values(P.CA).map(q => q.g), P.crx, P.cry]) P.comp.appendChild(e);
  for (const e of [P.fill, P.sw1, P.sw2, P.sl1, P.sl2]) P.swap.appendChild(e);
  for (const e of [P.rb, P.rbl]) P.ref.appendChild(e);
  for (const t of [P.sl1, P.sl2, P.rbl]) { t.setAttribute('font-size', 15 * K); t.setAttribute('fill-opacity', 0.85); }
  for (const t of [P.la, P.lb, P.lr]) t.setAttribute('font-size', 19 * K);
  for (const t of [P.la, P.lb, P.lr, P.sl1, P.sl2, P.rbl, P.crx, P.cry]) halo(t);
  // 손잡이. a는 a의 머리, b는 a의 머리에 이은 b(또는 −b)의 머리에 있다.
  P.ga = grip(k, COLOR.a, {
    name: '벡터 a의 머리', K,
    move: (X, Y) => setA(pl.un(X, Y)),
    key: (dx, dy) => setA([a[0] + dx * STEP, a[1] + dy * STEP]),
  });
  P.gb = grip(k, COLOR.b, {
    name: '벡터 b의 머리', K,
    move: (X, Y) => setTip(pl.un(X, Y)),
    key: (dx, dy) => { const r = add(a, second()); setTip([r[0] + dx * STEP, r[1] + dy * STEP]); },
  });
  setTip(add(a, second())); setA(a);   // 화면이 줄어 평면 밖으로 나간 끝을 안으로 들인다
});

// a를 바꾼다. a와 a + (둘째 벡터)가 모두 평면 안에 있도록 자른다.
function setA([u, v]) {
  const s = second(), { XL, YL } = P;
  a = [snap(u, STEP, Math.max(-XL, -XL - s[0]), Math.min(XL, XL - s[0])), snap(v, STEP, Math.max(-YL, -YL - s[1]), Math.min(YL, YL - s[1]))];
  draw();
}
// 둘째 벡터의 머리(= 결과의 머리)를 옮긴다. b = 머리 − a, a − b 보기에서는 −b = 머리 − a.
function setTip([u, v]) {
  const t = [snap(u, STEP, -P.XL, P.XL), snap(v, STEP, -P.YL, P.YL)], s = sub(t, a);
  b = op() === 'add' ? s : [-s[0] + 0, -s[1] + 0];
  draw();
}

function draw() {
  if (!P) return;
  const { k, pl } = P, { set } = k;
  const s = second(), r = add(a, s), O = pl.px([0, 0]), A = pl.px(a), Rp = pl.px(r), Sp = pl.px(s);
  const isAdd = op() === 'add', rn = isAdd ? 'r' : 'd';
  // 성분은 끝에서 축으로 내린 점선과 축 옆 화살표로 보인다. x축 옆에 축에서 바깥쪽으로 a_x, a_x의 머리에서 시작하는 b_x, r_x를 한 줄씩 쌓는다.
  // y축 옆도 같다(a_y, b_y, r_y). 줄은 축에서 벡터들이 놓인 쪽의 반대편에 둔다(r_y와 a_y의 합이 양수면 x축 아래).
  const showC = $('comp').checked;
  P.comp.style.display = showC ? '' : 'none';
  if (showC) {
    const [ox, oy] = O, X = u => ox + u * pl.S, Y = v => oy - v * pl.S;
    const sy = a[1] + r[1] >= 0 ? 1 : -1, sx = a[0] + r[0] >= 0 ? -1 : 1;   // 줄을 쌓는 화면 방향
    const R1 = 10 * P.q, R2 = 24 * P.q, R3 = 38 * P.q, END = 45 * P.q;
    P.CA.ax.set(X(0), oy + sy * R1, X(a[0]), oy + sy * R1);
    P.CA.bx.set(X(a[0]), oy + sy * R2, X(r[0]), oy + sy * R2);
    P.CA.rx.set(X(0), oy + sy * R3, X(r[0]), oy + sy * R3);
    P.CA.ay.set(ox + sx * R1, Y(0), ox + sx * R1, Y(a[1]));
    P.CA.by.set(ox + sx * R2, Y(a[1]), ox + sx * R2, Y(r[1]));
    P.CA.ry.set(ox + sx * R3, Y(0), ox + sx * R3, Y(r[1]));
    // 점선은 끝에서 세 줄을 모두 지나도록 내린다.
    const down = (p, d) => set(d, { x1: p[0], y1: p[1], x2: p[0], y2: sy * (p[1] - oy) <= END / 2 ? oy + sy * END : oy });
    const side = (p, d) => set(d, { x1: p[0], y1: p[1], x2: sx * (p[0] - ox) <= END / 2 ? ox + sx * END : ox, y2: p[1] });
    down(A, P.drops[0]); side(A, P.drops[1]); down(Rp, P.drops[2]); side(Rp, P.drops[3]);
    P.crx.innerHTML = subscript(rn, 'x'); P.cry.innerHTML = subscript(rn, 'y');
    set(P.crx, { x: (X(0) + X(r[0])) / 2, y: oy + sy * (R3 + 16 * P.q) + 6 * P.q });
    set(P.cry, { x: ox + sx * (R3 + 12 * P.q), y: (Y(0) + Y(r[1])) / 2 + 6 * P.q });
    P.cry.setAttribute('text-anchor', sx < 0 ? 'end' : 'start');
    P.crx.style.display = Math.abs(r[0]) * pl.S < 16 ? 'none' : '';
    P.cry.style.display = Math.abs(r[1]) * pl.S < 16 ? 'none' : '';
  }
  // 순서를 바꾼 경로는 둘째 벡터를 원점에서, a를 그 머리에서 그린다. 같은 머리에 닿는다.
  const showS = $('swap').checked;
  P.swap.style.display = showS ? '' : 'none';
  if (showS) {
    P.fill.setAttribute('points', [O, A, Rp, Sp].map(p => p.map(v => v.toFixed(1)).join(',')).join(' '));
    set(P.sw1, { x1: O[0], y1: O[1], x2: Sp[0], y2: Sp[1] });
    set(P.sw2, { x1: Sp[0], y1: Sp[1], x2: Rp[0], y2: Rp[1] });
    const mid = [(O[0] + Rp[0]) / 2, (O[1] + Rp[1]) / 2];
    P.sl1.textContent = isAdd ? 'b' : '−b';
    nameBeside(k, P.sl1, O, Sp, mid, 13 * P.K); nameBeside(k, P.sl2, Sp, Rp, mid, 13 * P.K);
  }
  // a − b에서는 원래의 b를 원점에서 점선으로 남긴다.
  P.ref.style.display = isAdd ? 'none' : '';
  if (!isAdd) { const Bp = pl.px(b); set(P.rb, { x1: O[0], y1: O[1], x2: Bp[0], y2: Bp[1] }); nameBeside(k, P.rbl, O, Bp, A, 13 * P.K); }
  P.R.set(...O, ...Rp); P.A.set(...O, ...A); P.B.set(...A, ...Rp);
  P.lb.textContent = isAdd ? 'b' : '−b'; P.lr.textContent = rn;
  const d = 17 * P.K;
  nameBeside(k, P.la, O, A, Rp, d); nameBeside(k, P.lb, A, Rp, O, d); nameBeside(k, P.lr, O, Rp, A, d);
  P.ga.at(...A); P.gb.at(...Rp);
  P.gb.g.setAttribute('aria-label', isAdd ? '벡터 b의 머리' : '벡터 −b의 머리');

  const sgn = isAdd ? '+' : '-';
  const eq = (i, j) => `\\textcolor{#840025}{${rn}_${i} = a_${i} ${sgn} b_${i} = ${n(a[j])} ${sgn} ${term(b[j])} = ${n(r[j])}}`;
  $('rx').innerHTML = tex(eq('x', 0));
  $('ry').innerHTML = tex(eq('y', 1));
  $('rmag').innerHTML = tex(`${rn} = ${fmt(mag(r), 2)}`);
  $('aval').innerHTML = tex(`\\vec a = (${n(a[0])},\\ ${n(a[1])})`);
  $('bval').innerHTML = tex(`\\vec b = (${n(b[0])},\\ ${n(b[1])})`);
}

// 덧셈과 뺄셈을 바꾼 뒤에도 결과의 머리가 평면 안에 있도록 a를 다시 자른다.
for (const id of ['op-add', 'op-sub']) $(id).addEventListener('change', () => (P ? setA(a) : draw()));
for (const id of ['comp', 'swap']) $(id).addEventListener('change', draw);
$('reset').addEventListener('click', () => { a = [...START.a]; b = [...START.b]; $('op-add').checked = true; draw(); });
draw();
