// 5장 시뮬레이션 장면 공용 그림(제3법칙, 수직항력, 장력 쪽). 나무 상자, 아래 첨자 붙은 기호, 시간 그래프 칸의 세로 좌표.
// 그림은 모두 직접 그린 SVG다. 층(layer)을 다시 그릴 때마다 defs도 새로 만들어 id가 겹치지 않는다.

// 나무색, 하늘색, 쇠색 그러데이션. el은 stage가 넘겨 준 요소 만들기 함수다.
export function paints(el) {
  el('defs').innerHTML = `
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eef9"/><stop offset="1" stop-color="#f7fafd"/></linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2b47c"/><stop offset="1" stop-color="#b98048"/></linearGradient>
    <linearGradient id="wood2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c99a64"/><stop offset="1" stop-color="#94663a"/></linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa4ae"/><stop offset="0.5" stop-color="#d9dee3"/><stop offset="1" stop-color="#8d97a1"/></linearGradient>
    <linearGradient id="steelv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd5db"/><stop offset="1" stop-color="#8f99a3"/></linearGradient>`;
}

// 나무 상자. 판자 테두리와 X자 버팀목, 가운데 이름. (0, 0)이 상자 왼쪽 위, 한 변 s(px). fill은 그러데이션 id.
// italic이 참이면 이름을 식의 기호처럼 기울여 쓴다(M, m).
export function crate(e, g, s, name, { fill = 'wood', italic = false, ty = 0.5, size = italic ? 21 : 16 } = {}) {
  g.replaceChildren();
  const k = Math.max(3, s * 0.09);
  e('rect', { x: 0, y: 0, width: s, height: s, rx: 2, fill: `url(#${fill})`, stroke: '#6e4520', 'stroke-width': 2 }, g);
  e('rect', { x: k, y: k, width: s - 2 * k, height: s - 2 * k, fill: 'none', stroke: '#8a5a2b', 'stroke-width': 1.5 }, g);
  e('path', { d: `M${k},${k} L${s - k},${s - k} M${s - k},${k} L${k},${s - k}`, stroke: '#8a5a2b', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g);
  const t = e('text', { x: s / 2, y: s * ty + size * 0.36, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 700, fill: '#3b2410',
    stroke: '#f3dfc2', 'stroke-width': 4, 'paint-order': 'stroke', ...(italic ? { 'font-style': 'italic', 'font-family': 'Times New Roman, serif' } : {}) }, g);
  t.textContent = name;
  return t;
}

// 기호 글자에 아래 첨자를 단다(SVG text 안쪽 내용). 예 sub('F', 'AB')
export const sub = (base, s) => `${base}<tspan dy="5" font-size="0.68em">${s}</tspan>`;
// 그래프 칸 이름에 쓰는 아래 첨자. 뒤에 단위가 이어지므로 dy 대신 baseline-shift를 쓴다.
export const gsub = (base, s) => `${base}<tspan baseline-shift="sub" font-size="0.72em">${s}</tspan>`;

// 글자 뒤에 흰 테두리를 둘러 상자나 줄 위에서도 읽히게 한다.
export const halo = t => { t.setAttribute('stroke', '#ffffff'); t.setAttribute('stroke-width', 4); t.setAttribute('paint-order', 'stroke'); return t; };

// timeGraphs(core/simshell.js)와 같은 칸 배치에서 i번째 칸(n칸 중)의 값 v의 세로 좌표. 기준선을 그릴 때 쓴다.
export function panelY({ y = 0, h, n, i, lo, hi, gap = 30 }, v) {
  const top = y + 24, bottom = y + h - 40, ph = (bottom - top - gap * (n - 1)) / n;
  const T = top + i * (ph + gap), B = T + ph, pad = 0.08 * (hi - lo);
  return B - (B - T) * (v - lo + pad) / (hi - lo + 2 * pad);
}
