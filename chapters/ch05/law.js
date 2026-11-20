// 5장 "뉴턴의 제1·2법칙" 시뮬레이션(공용 틀 core/simshell.js). 마찰 없는 바닥에서 x = 0에 정지해 있던 나무 상자에 수평 힘 F를 6 s 동안 준다.
// 위 장면은 바닥 위 상자와 F(주황)·a(분홍)·v(파랑) 화살표, 아래는 같은 시간축의 x-t, v-t, a-t 그래프다.
// F는 slider나 장면의 F 화살표 끝 손잡이를 끌어 바꾼다. 재생 중에 바꿔도 멈추지 않는다.
// F를 0으로 하면 그 순간부터 a = 0, v 일정, x는 직선이 된다(제1법칙). 0.5 s마다 상자 위치를 바닥에 점으로 남긴다.
// 상자 한 변은 질량의 세제곱근에 비례한다(같은 재질이면 부피가 질량에 비례). 상자·화살표·글자는 장면 높이에 맞춰 함께 키운다(배율 K).
// 한 프레임 안에서는 a가 일정하므로 x += v dt + a dt²/2, v += a dt로 적분한다(오차 없음).
// 축 구간은 지금의 F가 끝까지 유지될 때 지나는 값을 0과 함께 담는 1·2·5 끝값(최소 5)으로 고르고, 재생 중에는 넓어지기만 한다.
// 질량을 바꾸면 처음으로 돌아간다.
import { accel } from './newton.js';
import { COLOR, tex, fmt } from '../../core/simkit.js';
import { stage, clock, timeGraphs, bigArrow, span, stepOf, minus, qty } from '../../core/simshell.js';

const T_END = 6, F_MAX = 20, ARROW = 100, STROBE = 0.5;   // 화살표: F는 20 N, a·v는 축 구간 끝값(절댓값 큰 쪽)이 100 px
const $ = id => document.getElementById(id);
const F = () => Number($('F').value), m = () => Number($('m').value);
const side = () => (36 + 12 * Math.cbrt(m())) * (S?.K ?? 1);   // 상자 한 변(px): 배율 1에서 1 kg 48 px, 10 kg 62 px
let t = 0, x = 0, v = 0, hist = [{ t: 0, x: 0, v: 0, a: 0 }], marks = [];
const R = { x: [-5, 5], v: [-5, 5], a: [-5, 5] };
let S = null, G = null;   // 장면과 그래프. 화면 크기가 바뀌면 stage가 다시 만든다.

stage($('scene'), k => {
  const { el, set, w, h } = k;
  const K = Math.max(1, Math.min(1.8, h / 240)), GY = h - 44 * K, L = 50 + 40 * K, Rt = w - 50 - 40 * K;
  el('defs').innerHTML = `
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eef9"/><stop offset="1" stop-color="#f7fafd"/></linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2b47c"/><stop offset="1" stop-color="#b98048"/></linearGradient>`;
  el('rect', { x: 0, y: 0, width: w, height: GY, fill: 'url(#sky)' });
  el('rect', { x: 0, y: GY, width: w, height: h - GY, fill: '#ece4d6' });
  const sz = 12 * Math.sqrt(K);
  el('line', { x1: 0, y1: GY, x2: w, y2: GY, stroke: '#7d6a4f', 'stroke-width': 2.5 });
  el('text', { x: 14, y: h - 8, 'font-size': sz, fill: '#6b5d47' }).textContent = '마찰 없는 바닥';
  el('text', { x: Rt + 30 * K, y: GY + 22 * K, 'font-size': 15 * Math.sqrt(K) }).innerHTML = qty('x', 'm');
  S = { el, set, toSvg: k.toSvg, K, sz, GY, L, R: Rt, ticks: el('g'), crate: el('g'), ghosts: el('g'),
    AR: { v: bigArrow(k, COLOR.vel, { bw: 6 * K, hl: 15 * K, hw: 18 * K }), a: bigArrow(k, COLOR.acc, { bw: 6 * K, hl: 15 * K, hw: 18 * K }), F: bigArrow(k, COLOR.b, { bw: 8 * K, hl: 18 * K, hw: 22 * K }) },
    LB: { v: k.label('vel', 'v'), a: k.label('acc', 'a'), F: k.label('b', 'F') } };
  for (const l of Object.values(S.LB)) l.setAttribute('font-size', 20 * K);
  // F 화살표 끝 손잡이. 끌면 F가 바뀐다(1 N 단위).
  S.grip = el('circle', { r: 9 * K, fill: '#ffffff', stroke: COLOR.b, 'stroke-width': 3, style: 'cursor: ew-resize' });
  let drag = false;
  S.grip.addEventListener('pointerdown', ev => { ev.preventDefault(); drag = true; S.grip.setPointerCapture(ev.pointerId); });
  S.grip.addEventListener('pointermove', ev => {
    if (!drag) return;
    const f = Math.max(-F_MAX, Math.min(F_MAX, Math.round((S.toSvg(ev).x - tx(x)) * F_MAX / (ARROW * S.K))));
    if (f !== F()) { $('F').value = f; $('F').dispatchEvent(new Event('input')); }
  });
  for (const e of ['pointerup', 'pointercancel']) S.grip.addEventListener(e, () => { drag = false; });
  drawCrate(); trackTicks(); draw();
});
stage($('graphs'), k => {
  G = timeGraphs(k, { x: 0, y: 0, w: k.w, h: k.h, tEnd: T_END, panels: [
    { key: 'x', name: qty('x', 'm'), color: COLOR.c },
    { key: 'v', name: qty('v', 'm/s'), color: COLOR.vel },
    { key: 'a', name: qty('a', 'm/s²'), color: COLOR.acc },
  ] });
  for (const key in R) G.range(key, ...R[key]);
  draw();
});

function tx(u) { const [lo, hi] = R.x; return S.L + (S.R - S.L) * (u - lo) / (hi - lo); }
function trackTicks() {
  if (!S) return;
  S.ticks.replaceChildren();
  const [lo, hi] = R.x, st = stepOf(lo, hi);
  for (let u = Math.ceil(lo / st - 1e-9) * st; u <= hi + 1e-9; u += st) {
    const X = tx(u);
    S.el('line', { x1: X, y1: S.GY, x2: X, y2: S.GY + 7 * S.K, stroke: '#7d6a4f', 'stroke-width': 1.5 }, S.ticks);
    S.el('text', { x: X, y: S.GY + 22 * S.K, 'text-anchor': 'middle', 'font-size': 13 * Math.sqrt(S.K), fill: '#4a3f30' }, S.ticks).textContent = minus(u);
  }
}
// 나무 상자: 판자 테두리와 X자 버팀목, 가운데 질량 표시. (0, 0)이 상자 왼쪽 위다.
function drawCrate() {
  if (!S) return;
  const s = side(), e = S.el, g = S.crate;
  g.replaceChildren();
  e('rect', { x: 0, y: 0, width: s, height: s, rx: 2, fill: 'url(#wood)', stroke: '#6e4520', 'stroke-width': 2 }, g);
  const b = 5 * S.K;
  e('rect', { x: b, y: b, width: s - 2 * b, height: s - 2 * b, fill: 'none', stroke: '#8a5a2b', 'stroke-width': 1.5 }, g);
  e('path', { d: `M${b},${b} L${s - b},${s - b} M${s - b},${b} L${b},${s - b}`, stroke: '#8a5a2b', 'stroke-width': 2.5 * S.K, 'stroke-linecap': 'round' }, g);
  const lab = e('text', { x: s / 2, y: s / 2 + 5 * S.K, 'text-anchor': 'middle', 'font-size': 13 * S.K, 'font-weight': 700, fill: '#3b2410',
    stroke: '#f3dfc2', 'stroke-width': 4, 'paint-order': 'stroke' }, g);
  lab.textContent = `${fmt(m())} kg`;
}

// 지금의 F가 끝까지 유지될 때 남은 시간 동안 x, v, a가 지나는 구간으로 축을 정한다. fresh가 아니면 좁히지 않는다.
function setRanges(fresh) {
  const a = accel(F(), m()), rest = T_END - t;
  const xs = [x], vs = [v];
  for (let i = 1; i <= 100; i++) { const s = rest * i / 100; xs.push(x + v * s + a * s * s / 2); vs.push(v + a * s); }
  const want = { x: span(Math.min(...xs), Math.max(...xs)), v: span(Math.min(...vs), Math.max(...vs)), a: span(Math.min(a, 0), Math.max(a, 0)) };
  for (const key in R) {
    const r = fresh ? want[key] : [Math.min(R[key][0], want[key][0]), Math.max(R[key][1], want[key][1])];
    if (r[0] !== R[key][0] || r[1] !== R[key][1]) { R[key] = r; G?.range(key, ...r); }
  }
  trackTicks();
}

function draw() {
  if (!S || !G) return;
  const a = accel(F(), m()), X = tx(x), s = side(), top = S.GY - s;
  S.set(S.crate, { transform: `translate(${(X - s / 2).toFixed(1)},${top.toFixed(1)})` });
  S.ghosts.replaceChildren();
  if ($('strobe').checked) for (const u of marks) S.el('circle', { cx: tx(u), cy: S.GY, r: 5 * Math.sqrt(S.K), fill: '#ffffff', stroke: COLOR.c, 'stroke-width': 2 }, S.ghosts);
  const big = r => Math.max(-r[0], r[1]);
  const A = ARROW * S.K, len = { F: A * F() / F_MAX, a: A * a / big(R.a), v: A * v / big(R.v) };
  const row = { F: top - 20 * S.K, a: top - 48 * S.K, v: top - 76 * S.K };
  for (const key of ['F', 'a', 'v']) {
    S.AR[key].set(X, row[key], X + len[key], row[key]);
    S.set(S.LB[key], { x: X + len[key] + (len[key] >= 0 ? 22 : -22) * S.K, y: row[key] + 7 * S.K });
    S.LB[key].style.display = Math.abs(len[key]) < 1 ? 'none' : '';
  }
  S.set(S.grip, { cx: X + len.F, cy: row.F });
  // x, v는 기록한 점을 잇고, a는 프레임마다 일정했던 값을 계단으로 잇는다. 시작 전에는 지금 F로 정해진 a 한 점이다.
  G.draw({
    x: hist.map(p => [p.t, p.x]),
    v: hist.map(p => [p.t, p.v]),
    a: hist.length > 1 ? hist.slice(1).flatMap((p, i) => [[hist[i].t, p.a], [p.t, p.a]]) : [[0, a]],
  }, t);
  $('tval').innerHTML = tex(`t = ${fmt(t, 2)}\\ \\mathrm{s}`);
  $('Fval').innerHTML = tex(`${fmt(F())}\\ \\mathrm{N}`);
  $('mval').innerHTML = tex(`${fmt(m())}\\ \\mathrm{kg}`);
  $('aval').innerHTML = tex(`\\textcolor{#840025}{a = ${fmt(a, 2)}\\ \\mathrm{m/s^2}}`);
  $('vval').innerHTML = tex(`v = ${fmt(v, 2)}\\ \\mathrm{m/s}`);
}

function reset() {
  t = 0; x = 0; v = 0; hist = [{ t: 0, x: 0, v: 0, a: 0 }]; marks = [0];
  setRanges(true); draw();
}
const ck = clock({
  step(dt) {
    dt = Math.min(dt, T_END - t);
    const a = accel(F(), m()), x0 = x, v0 = v, t0 = t;
    x += v * dt + a * dt * dt / 2; v += a * dt; t += dt;
    if (T_END - t < 1e-9) t = T_END;
    for (let tm = (Math.floor(t0 / STROBE + 1e-9) + 1) * STROBE; tm <= t + 1e-9; tm += STROBE) {
      const u = tm - t0; marks.push(x0 + v0 * u + a * u * u / 2);
    }
    hist.push({ t, x, v, a });
    draw();
    return t < T_END;
  },
  reset,
  ended: () => t >= T_END,
});
$('F').addEventListener('input', () => {
  if (t >= T_END) return reset();
  setRanges(t === 0 && !ck.running); draw();
});
$('m').addEventListener('input', () => { ck.stop(); drawCrate(); reset(); });
$('strobe').addEventListener('change', draw);
reset();
