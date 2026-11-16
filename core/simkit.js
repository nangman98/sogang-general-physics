// 장 시뮬레이션 공통 부품(3장에서 시작). SVG 요소 만들기, 화살촉 정의, KaTeX 글.
import katex from '../vendor/katex/katex.mjs';

export const NS = 'http://www.w3.org/2000/svg';
export const COLOR = { a: '#0072B2', b: '#D55E00', c: '#840025', ink: '#1a1a1a', gray: '#8a8a8a', grid: '#e6e6e6',
  vel: '#0072B2', acc: '#CC79A7', water: '#009E73' };
export const tex = s => katex.renderToString(s, { throwOnError: true });
export const fmt = (x, d = 1) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');

export function svgKit(svg) {
  const el = (name, attrs = {}, parent = svg) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.appendChild(e);
    return e;
  };
  el('defs').innerHTML = Object.entries(COLOR).map(([k, c]) =>
    `<marker id="h-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3.6" markerHeight="3.6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('');
  const arrow = (key, w = 3, dash) => el('line', { stroke: COLOR[key], 'stroke-width': w, 'marker-end': `url(#h-${key})`, ...(dash ? { 'stroke-dasharray': dash } : {}) });
  const label = (key, txt) => {
    const t = el('text', { fill: COLOR[key], 'font-size': 20, 'font-weight': 700, 'font-style': 'italic', 'font-family': 'Times New Roman, serif', 'text-anchor': 'middle' });
    t.textContent = txt;
    return t;
  };
  const set = (e, attrs) => { for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, typeof v === 'number' ? v.toFixed(1) : v); };
  // 화면 좌표 -> SVG 좌표
  const toSvg = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  return { el, arrow, label, set, toSvg };
}
