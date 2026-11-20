// 4장 시뮬레이션 장면 도우미(2026-11-19). 장면 축척 사다리, 눈금 간격, 아래 첨자 기호 글, 끌기 손잡이.
// 계산 함수(snapDown, tickStep, place)는 DOM 없이 돌아가 motion.test.js에서 시험한다.

// 축척 사다리(px/m). 설정을 조금 바꿀 때마다 장면이 커졌다 작아지지 않도록 1·1.2·1.5·2·2.5·3·4·5·6·8 × 10^k 단계만 쓴다.
const STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
// s 이하인 사다리 값 가운데 가장 큰 값.
export function snapDown(s) {
  const e = 10 ** Math.floor(Math.log10(s) + 1e-9);
  return STEPS.filter(d => d * e <= s * (1 + 1e-9)).pop() * e;
}
// 눈금 간격(m). 1·2·5 × 10^k 가운데 화면 간격이 minPx px 이상인 가장 작은 값.
export function tickStep(s, minPx = 60) {
  for (let e = 1e-3; ; e *= 10) for (const d of [1, 2, 5]) if (d * e * s >= minPx - 1e-9) return d * e;
}
// 점들을 화면 칸에 넣는 축척과 원점. points = [{ x, lo, hi }]는 세계 좌표 x(m)가 화면 [lo, hi] px 안에 와야 한다는 뜻이다.
// sMax 이하의 사다리 값 가운데 들어가는 가장 큰 축척 s를 고르고, 원점 X0(세계 x = 0의 화면 위치)는 남는 칸의 가운데에 둔다.
export function place(points, sMax) {
  for (let s = snapDown(sMax); s > 1e-6; s = snapDown(s * 0.999)) {
    const a = Math.max(...points.map(p => p.lo - s * p.x)), b = Math.min(...points.map(p => p.hi - s * p.x));
    if (a <= b + 1e-9) return { s, X0: (a + b) / 2 };
  }
  return { s: 1e-6, X0: points[0].lo };
}

// 아래 첨자 붙은 기울인 기호(예 v_x, v_PA). 장면 위 화살표 이름에 쓴다.
export function sym(k, color, base, sub = '', size = 20) {
  const t = k.el('text', { fill: color, 'font-size': size, 'font-weight': 700, 'font-style': 'italic', 'font-family': 'Times New Roman, serif',
    'text-anchor': 'middle', stroke: '#ffffff', 'stroke-width': 3, 'paint-order': 'stroke' });
  t.innerHTML = base + (sub ? `<tspan font-size="${Math.round(size * 0.68)}" dy="${Math.round(size * 0.28)}">${sub}</tspan>` : '');
  return t;
}

// 끌기 손잡이(흰 원). 누르면 pointer를 붙잡고, 끄는 동안 move(SVG 좌표 p)를, 놓으면 end()를 부른다.
export function grip(k, color, { move, end = () => {}, cursor = 'grab', r = 9 }) {
  const g = k.el('circle', { r, fill: '#ffffff', 'fill-opacity': 0.35, stroke: color, 'stroke-width': 3, style: `cursor: ${cursor}` });   // 속이 비쳐 화살촉이 보인다
  let on = false;
  g.addEventListener('pointerdown', ev => { ev.preventDefault(); on = true; g.setPointerCapture(ev.pointerId); g.style.cursor = 'grabbing'; });
  g.addEventListener('pointermove', ev => { if (on) move(k.toSvg(ev)); });
  for (const e of ['pointerup', 'pointercancel']) g.addEventListener(e, () => { if (!on) return; on = false; g.style.cursor = cursor; end(); });
  return g;
}
