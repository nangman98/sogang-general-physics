// 3장 벡터 시뮬레이션 공용 부품(2026-11-19). 4변 테두리를 두른 좌표평면, 화살표 끝 손잡이, 각 ϕ 그래프 칸.
// 눈금 숫자는 테두리 바깥 아래·왼쪽에 단다. 축 바로 옆 자리는 합성 시뮬레이션의 성분 화살표가 쓴다.
// 글자·화살표·손잡이는 배율 K로 함께 키운다. 5장 law.js의 K = h/240(1–1.8)을 따르되, 좁은 화면에서 글자가 평면을 덮지 않도록
// 높이와 폭의 3/4 가운데 작은 쪽으로 정한다.
// 손잡이는 5장 F 손잡이와 같은 흰 원 + 색 테두리이고, 둘레 넉넉한 원 안을 잡으면 끌린다.
// 잡은 점과 원 중심의 차이를 기억해 두어 잡는 순간 끝이 튀지 않는다. 포커스가 있으면 방향키로도 움직인다.
import { COLOR } from '../../core/simkit.js';
import { minus } from '../../core/simshell.js';

export const SERIF = 'Times New Roman, serif';
export const scaleOf = (w, h) => Math.max(1, Math.min(1.8, Math.min(h, 0.75 * w) / 240));

// 벡터 기호(굵은 이탤릭) tspan. 그래프 이름에 쓴다.
export const vtx = s => `<tspan font-style="italic" font-weight="700" font-family="${SERIF}">${s}</tspan>`;
// 아래첨자가 붙은 이탤릭 기호. 예 sub('r', 'x')
export const sub = (s, i) => `<tspan font-style="italic" font-family="${SERIF}">${s}</tspan><tspan font-style="italic" font-family="${SERIF}" font-size="0.75em" dy="0.3em">${i}</tspan>`;
// 글자 둘레에 흰 테두리를 둘러 선 위에 놓여도 읽히게 한다.
export const halo = (t, wd = 4) => { for (const [k, v] of Object.entries({ stroke: '#ffffff', 'stroke-width': wd, 'stroke-linejoin': 'round', 'paint-order': 'stroke' })) t.setAttribute(k, v); return t; };

// 좁은 화면(폭 600 px 아래)에서는 읽기 칸이 장면 폭 대부분을 덮으므로 그 아래부터 그린다. 그 높이(px)를 돌려준다.
// 처음 그릴 때는 읽기 칸이 아직 비어 있으므로 줄 수 × 줄 높이(chapter.css의 20 px × 1.6)로 셈한다.
export const readoutGap = w => (w < 600 ? (document.querySelectorAll('.readout .read').length * 32 + 30) : 0);

// 눈금 숫자 자리를 뺀 평면 칸. 장면 크기와 K로 정한다.
export const plotBox = (x, y, w, h, K) => {
  const l = Math.round(14 + 22 * Math.sqrt(K)), b = Math.round(12 + 20 * Math.sqrt(K));
  return { x: x + l, y: y + 6, w: w - l - 6, h: h - b - 6 };
};

// box = { x, y, w, h } 안에 원점 (ox, oy), 1 단위 = S px인 격자를 그린다. 축 이름은 양의 쪽 끝에 둔다.
export function plane(k, { x, y, w, h, S, ox, oy, K = 1 }) {
  const { el } = k;
  const X0 = Math.ceil((x - ox) / S - 1e-9), X1 = Math.floor((x + w - ox) / S + 1e-9);
  const Y0 = Math.ceil((oy - y - h) / S - 1e-9), Y1 = Math.floor((oy - y) / S + 1e-9);
  el('rect', { x, y, width: w, height: h, fill: '#ffffff' });
  for (let i = X0; i <= X1; i++) if (i) el('line', { x1: ox + i * S, y1: y, x2: ox + i * S, y2: y + h, stroke: COLOR.grid });
  for (let j = Y0; j <= Y1; j++) if (j) el('line', { x1: x, y1: oy - j * S, x2: x + w, y2: oy - j * S, stroke: COLOR.grid });
  el('line', { x1: x, y1: oy, x2: x + w, y2: oy, stroke: '#6f6f6f', 'stroke-width': 1.5 });
  el('line', { x1: ox, y1: y, x2: ox, y2: y + h, stroke: '#6f6f6f', 'stroke-width': 1.5 });
  el('rect', { x, y, width: w, height: h, fill: 'none', stroke: COLOR.ink, 'stroke-width': 1.2 });
  const fs = 13 * Math.sqrt(K), tk = 5 * Math.sqrt(K), small = { 'font-size': fs, fill: '#444444' };
  const every = S < 2.1 * fs ? 2 : 1;
  for (let i = X0; i <= X1; i++) {
    const X = ox + i * S;
    el('line', { x1: X, y1: y + h, x2: X, y2: y + h + tk, stroke: COLOR.ink });
    if (i % every === 0) el('text', { x: X, y: y + h + tk + fs + 1, 'text-anchor': 'middle', ...small }).textContent = minus(i);
  }
  for (let j = Y0; j <= Y1; j++) {
    const Y = oy - j * S;
    el('line', { x1: x - tk, y1: Y, x2: x, y2: Y, stroke: COLOR.ink });
    if (j % every === 0) el('text', { x: x - tk - 3, y: Y + fs * 0.35, 'text-anchor': 'end', ...small }).textContent = minus(j);
  }
  const name = { 'font-size': 20 * Math.sqrt(K), 'font-style': 'italic', 'font-family': SERIF, fill: '#333333' };
  halo(el('text', { x: x + w - 8 * K, y: oy - 8 * K, 'text-anchor': 'end', ...name })).textContent = 'x';
  halo(el('text', { x: ox + 8 * K, y: y + 22 * Math.sqrt(K), ...name })).textContent = 'y';
  return {
    S, X0, X1, Y0, Y1,
    px: ([u, v]) => [ox + u * S, oy - v * S],
    un: (X, Y) => [(X - ox) / S, (oy - Y) / S],
  };
}

// 화살표 끝 손잡이. move(X, Y)는 끌린 점(잡은 차이를 뺀 SVG 좌표), key(dx, dy)는 방향키 한 번(→ +1, ↑ +1).
export function grip(k, color, { name, move, key, K = 1 }) {
  const { el, toSvg } = k;
  const r0 = 7.5 * K;
  const g = el('g', { tabindex: 0, role: 'button', 'aria-label': name, style: 'cursor: grab; outline: none' });
  const glow = el('circle', { r: r0 * 1.9, fill: color, 'fill-opacity': 0 }, g);
  el('circle', { r: Math.max(20, r0 * 2.3), fill: 'transparent' }, g);
  const ring = el('circle', { r: r0, fill: '#ffffff', stroke: color, 'stroke-width': 3 }, g);
  let id = null, off = [0, 0], X = 0, Y = 0, hover = false, focus = false;
  const look = () => {
    glow.setAttribute('fill-opacity', id !== null ? 0.28 : hover || focus ? 0.18 : 0);
    ring.setAttribute('r', id !== null ? r0 * 1.2 : r0);
    g.style.cursor = id !== null ? 'grabbing' : 'grab';
  };
  g.addEventListener('pointerdown', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const p = toSvg(ev); off = [p.x - X, p.y - Y];
    id = ev.pointerId; g.setPointerCapture(id); look();
  });
  g.addEventListener('pointermove', ev => {
    if (ev.pointerId !== id) return;
    const p = toSvg(ev); move(p.x - off[0], p.y - off[1]);
  });
  const end = () => { id = null; look(); };
  for (const e of ['pointerup', 'pointercancel', 'lostpointercapture']) g.addEventListener(e, end);
  g.addEventListener('pointerenter', () => { hover = true; look(); });
  g.addEventListener('pointerleave', () => { hover = false; look(); });
  g.addEventListener('focus', () => { focus = true; look(); });
  g.addEventListener('blur', () => { focus = false; look(); });
  const KEYS = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
  g.addEventListener('keydown', ev => { if (!KEYS[ev.key]) return; ev.preventDefault(); key(...KEYS[ev.key]); });
  return {
    g,
    at(x, y) { X = x; Y = y; g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`); },
  };
}

// 굵은 이탤릭 벡터 이름을 선분 PQ 가운데에서 T(셋째 꼭짓점)의 반대쪽으로 d px 비켜 놓는다. T가 없으면 왼쪽.
// 글자 높이 fs의 1/3만큼 내려 글자 가운데가 그 점에 오게 한다.
export function nameBeside(k, t, [x1, y1], [x2, y2], T, d = 18) {
  const L = Math.hypot(x2 - x1, y2 - y1), fs = Number(t.getAttribute('font-size')) || 20;
  t.style.display = L < 14 ? 'none' : '';
  if (L < 14) return;
  let nx = (y2 - y1) / L, ny = -(x2 - x1) / L;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  if (T && (T[0] - mx) * nx + (T[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
  k.set(t, { x: mx + nx * d, y: my + ny * d + fs / 3 });
}

// 가로축이 각 ϕ(°)인 그래프 칸. 4변 테두리, 0 선, 바깥 눈금, 위 왼쪽에 이름, 오른쪽 아래에 ϕ (°).
// phiTicks는 가로 눈금, yTicks는 세로 눈금(양 끝값이 세로 구간). draw(f, ϕ)는 곡선 f(ϕ)와 지금 점을 그린다.
export function phiGraph(k, { x, y, w, h, phiMax, phiTicks, yTicks, name, color = COLOR.c, K = 1 }) {
  const { el, set } = k;
  const fs = 13 * Math.sqrt(K), small = { 'font-size': fs, fill: '#444444' }, tk = 5 * Math.sqrt(K);
  const L = x + 12 + 3.2 * fs, R = x + w - 10 - 1.4 * fs, T = y + 14 + 1.6 * fs, B = y + h - 12 - 2.6 * fs;
  const lo = yTicks[0], hi = yTicks[yTicks.length - 1];
  const gx = p => L + (R - L) * p / phiMax, gy = v => B - (B - T) * (v - lo) / (hi - lo);
  el('rect', { x: L, y: T, width: R - L, height: B - T, fill: '#ffffff', stroke: COLOR.ink, 'stroke-width': 1.2 });
  for (const p of phiTicks) if (p > 0 && p < phiMax) el('line', { x1: gx(p), y1: T, x2: gx(p), y2: B, stroke: COLOR.grid });
  el('line', { x1: L, y1: gy(0), x2: R, y2: gy(0), stroke: '#b0b0b0', 'stroke-width': 1.2 });
  for (const p of phiTicks) {
    el('line', { x1: gx(p), y1: B, x2: gx(p), y2: B + tk, stroke: COLOR.ink });
    el('text', { x: gx(p), y: B + tk + fs + 1, 'text-anchor': 'middle', ...small }).textContent = `${p}°`;
  }
  for (const v of yTicks) {
    el('line', { x1: L - tk, y1: gy(v), x2: L, y2: gy(v), stroke: COLOR.ink });
    el('text', { x: L - tk - 3, y: gy(v) + fs * 0.35, 'text-anchor': 'end', ...small }).textContent = minus(v);
  }
  const big = 17 * Math.sqrt(K);
  el('text', { x: R, y: B + tk + fs + 1 + 1.3 * big, 'text-anchor': 'end', 'font-size': big }).innerHTML =
    `<tspan font-style="italic" font-family="${SERIF}" font-size="1.15em">ϕ</tspan> (°)`;
  el('text', { x: L, y: T - 0.55 * big, 'font-size': big * 1.15, fill: color }).innerHTML = name;
  const curve = el('polyline', { fill: 'none', stroke: color, 'stroke-width': 2.5 * Math.sqrt(K), 'stroke-linejoin': 'round' });
  const cursor = el('line', { y1: T, y2: B, stroke: '#8a8a8a', 'stroke-dasharray': '5 5' });
  const dot = el('circle', { r: 6 * Math.sqrt(K), fill: color, stroke: '#ffffff', 'stroke-width': 2 });
  return {
    draw(f, phi) {
      const pts = [];
      for (let i = 0; i <= 180; i++) { const p = phiMax * i / 180; pts.push(`${gx(p).toFixed(1)},${gy(f(p)).toFixed(1)}`); }
      curve.setAttribute('points', pts.join(' '));
      set(cursor, { x1: gx(phi), x2: gx(phi) });
      set(dot, { cx: gx(phi), cy: gy(f(phi)) });
    },
  };
}
