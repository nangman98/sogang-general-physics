// 시뮬레이션 쪽 공용 틀(2026-11-19). 사용자가 준 참고 화면(twinace98 web_phys_sim)처럼 한 화면 안에
// 위 장면(svg.scene), 가운데 조작 막대(.bar), 아래 시간 그래프(svg.graphs)를 둔다.
// stage는 SVG의 viewBox를 화면의 실제 픽셀 크기로 잡고(1 단위 = 1 px) 크기가 바뀌면 다시 그린다.
import { NS, svgKit, COLOR } from './simkit.js';

// 1, 2, 5 × 10^k 가운데 m 이상인 가장 작은 값. 축 범위에 쓴다(min부터 올라간다).
export function nice(m, min = 1) {
  let n = min;
  while (n < m - 1e-9) {
    const e = 10 ** Math.floor(Math.log10(n) + 1e-9), d = n / e;
    n = (d < 2 - 1e-9 ? 2 : d < 5 - 1e-9 ? 5 : 10) * e;
  }
  return n;
}
export const minus = v => String(+v.toPrecision(6)).replace('-', '−');
// [lo, hi]를 4칸 이하로 나누는 1·2·2.5·5 간격. 양 끝값이 눈금에 걸리는 간격을 먼저 고른다.
export function stepOf(lo, hi) {
  const s = hi - lo, c = [], whole = u => Math.abs(u - Math.round(u)) < 1e-6;
  for (let e = 10 ** Math.floor(Math.log10(s / 4)); c.length < 8; e *= 10) for (const d of [1, 2, 2.5, 5]) if (d * e >= s / 4 - 1e-9) c.push(d * e);
  return c.find(u => whole(lo / u) && whole(hi / u)) ?? c[0];
}
// 값 구간 [lo, hi]를 0을 포함하는 1·2·5 끝값으로 넓힌다. 둘 다 0이면 [−min, min].
export function span(lo, hi, min = 5) {
  const a = lo < -1e-9 ? -nice(-lo, min) : 0, b = hi > 1e-9 ? nice(hi, min) : 0;
  return a === b ? [-min, min] : [a, b];
}
// 그래프 이름. 기호만 기울이고 단위는 바로 쓴다.
export const qty = (q, u) => `<tspan font-style="italic" font-family="Times New Roman, serif" font-size="1.15em">${q}</tspan>${u ? ` (${u})` : ''}`;

// build({ el, arrow, label, set, w, h })를 화면 크기가 바뀔 때마다 새 층에 다시 부른다.
export function stage(svg, build) {
  svgKit(svg);
  const layer = document.createElementNS(NS, 'g');
  svg.appendChild(layer);
  let w = 0, h = 0;
  const go = () => {
    const W = Math.round(svg.clientWidth), H = Math.round(svg.clientHeight);
    if (!W || !H || (W === w && H === h)) return;
    w = W; h = H;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    layer.replaceChildren();
    build({ ...svgKit(svg, layer), w, h });
  };
  new ResizeObserver(go).observe(svg);
  go();
}

// 재생 막대. #play(▶/❚❚), #reset(↺), #speed(배속)를 다룬다. 스페이스 키도 재생/멈춤이다.
// step(dt)는 화면 시간 dt × 배속만큼 진행하고, false를 돌려주면 멈춘다. ended()가 참일 때 재생을 누르면 처음부터 한다.
export function clock({ step, reset, ended = () => false }) {
  const play = document.getElementById('play'), speed = document.getElementById('speed');
  let running = false, last = 0;
  const show = () => { play.textContent = running ? '❚❚' : '▶'; play.setAttribute('aria-label', running ? '멈춤' : '재생'); };
  const frame = now => {
    if (!running) return;
    const dt = Math.min(0.1, (now - last) / 1000) * Number(speed?.value ?? 1); last = now;   // 탭을 떠났다 오면 0.1 s만 진행
    if (step(dt) === false) { running = false; show(); return; }
    requestAnimationFrame(frame);
  };
  const api = {
    get running() { return running; },
    start() { if (ended()) reset(); running = true; show(); last = performance.now(); requestAnimationFrame(frame); },
    stop() { running = false; show(); },
  };
  play.addEventListener('click', () => (running ? api.stop() : api.start()));
  document.getElementById('reset').addEventListener('click', () => { api.stop(); reset(); });
  addEventListener('keydown', ev => {
    if (ev.key !== ' ' || ev.target.closest?.('input, select, textarea, button')) return;
    ev.preventDefault(); play.click();
  });
  show();
  return api;
}

// 굵은 화살표(다각형). 몸통 폭 bw, 머리 길이 hl, 머리 폭 hw, 흰 테두리. set(x1, y1, x2, y2)로 옮기고, 길이가 1 px 아래면 숨긴다.
export function bigArrow(k, color, { bw = 8, hl = 18, hw = 22 } = {}) {
  const g = k.el('polygon', { fill: color, stroke: '#ffffff', 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
  return {
    g,
    set(x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      g.style.display = L < 1 ? 'none' : '';
      if (L < 1) return;
      const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, h = Math.min(hl, L * 0.6), b = bw / 2, w = hw / 2;
      const P = [[x1 + nx * b, y1 + ny * b], [x2 - ux * h + nx * b, y2 - uy * h + ny * b], [x2 - ux * h + nx * w, y2 - uy * h + ny * w], [x2, y2],
        [x2 - ux * h - nx * w, y2 - uy * h - ny * w], [x2 - ux * h - nx * b, y2 - uy * h - ny * b], [x1 - nx * b, y1 - ny * b]];
      g.setAttribute('points', P.map(([a, c]) => `${a.toFixed(1)},${c.toFixed(1)}`).join(' '));
    },
  };
}

// 시간 그래프 여러 칸을 위아래로 쌓는다. 칸마다 4변 테두리, 0 선, 바깥 눈금, 칸 위 왼쪽에 이름. t 숫자는 맨 아래 칸에만 단다.
// panels = [{ key, name, color }]. 세로축은 range(key, lo, hi)로 정하고 위아래에 구간의 8%씩 여백을 둔다.
// 지금 시각 t에 모든 칸을 지나는 세로선과 점을 찍는다.
export function timeGraphs(k, { x, y, w, h, tEnd, panels, gap = 30 }) {
  const { el, set } = k;
  const L = x + 58, R = x + w - 24, top = y + 24, bottom = y + h - 40;
  const ph = (bottom - top - gap * (panels.length - 1)) / panels.length;
  const gx = t => L + (R - L) * t / tEnd;
  const dt = tEnd <= 10 ? 1 : tEnd <= 20 ? 2 : 5;
  const small = { 'font-size': 13, fill: '#555555' };
  const P = panels.map((p, i) => {
    const T = top + i * (ph + gap), B = T + ph;
    const q = { ...p, T, B, lo: -1, hi: 1, ticks: el('g') };
    q.gy = v => { const pad = 0.08 * (q.hi - q.lo); return B - (B - T) * (v - q.lo + pad) / (q.hi - q.lo + 2 * pad); };
    el('rect', { x: L, y: T, width: R - L, height: B - T, fill: 'none', stroke: COLOR.ink, 'stroke-width': 1.2 });
    for (let t = 0; t <= tEnd + 1e-9; t += dt) el('line', { x1: gx(t), y1: B, x2: gx(t), y2: B + 5, stroke: COLOR.ink });
    if (i === panels.length - 1) {
      for (let t = 0; t <= tEnd + 1e-9; t += dt) el('text', { x: gx(t), y: B + 19, 'text-anchor': 'middle', ...small }).textContent = String(t);
      el('text', { x: R, y: B + 36, 'text-anchor': 'end', 'font-size': 16 }).innerHTML = qty('t', 's');
    }
    el('text', { x: L, y: T - 8, 'font-size': 16, fill: p.color }).innerHTML = p.name;
    q.zero = el('line', { x1: L, x2: R, stroke: '#d0d0d0' });
    q.trail = el('polyline', { fill: 'none', stroke: p.color, 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    q.dot = el('circle', { r: 4.5, fill: p.color });
    return q;
  });
  const cursor = el('line', { y1: top, y2: bottom, stroke: '#8a8a8a', 'stroke-dasharray': '4 4' });
  const api = {
    // 세로축 구간을 바꾸고 눈금 숫자를 다시 단다.
    range(key, lo, hi) {
      const q = P.find(p => p.key === key); q.lo = lo; q.hi = hi; q.ticks.replaceChildren();
      const st = stepOf(lo, hi);
      for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) {
        const Y = q.gy(v);
        el('line', { x1: L - 5, y1: Y, x2: L, y2: Y, stroke: COLOR.ink }, q.ticks);
        el('text', { x: L - 9, y: Y + 4, 'text-anchor': 'end', ...small }, q.ticks).textContent = minus(v);
      }
      set(q.zero, { y1: q.gy(0), y2: q.gy(0) }); q.zero.style.display = lo < 0 && hi > 0 ? '' : 'none';
    },
    // series[key] = [[t, 값], …]. 마지막 점에 동그라미를 찍는다.
    draw(series, t) {
      for (const q of P) {
        const s = series[q.key];
        q.trail.setAttribute('points', s.map(([u, v]) => `${gx(u).toFixed(1)},${q.gy(v).toFixed(1)}`).join(' '));
        const [u, v] = s[s.length - 1];
        set(q.dot, { cx: gx(u), cy: q.gy(v) });
      }
      set(cursor, { x1: gx(t), x2: gx(t) });
    },
  };
  for (const q of P) api.range(q.key, -1, 1);
  return api;
}

