// 5장 시뮬레이션 계산. 교재 식 5.1.1 (제2법칙), 5.2.1·5.2.6 (중력, 수직항력), 5.3.1–5.3.2 (제3법칙, 함께 움직이는 계).
export const G = 9.8;   // m/s², 교재 2.5
export const accel = (Fnet, m) => Fnet / m;                       // (5.1.1) a = F_net / m
export const gravity = (m, g = G) => m * g;                        // (5.2.1) F_g = mg
export const normalForce = (m, ay, g = G) => m * (g + ay);         // (5.2.6) F_N = m(g + a_y), 엘리베이터 안 저울 눈금
// 마찰 없는 바닥에서 맞닿은 두 상자 A(왼쪽), B(오른쪽)를 수평 힘 F로 민다. F > 0이면 A를 왼쪽에서, F < 0이면 B를 오른쪽에서 민다.
// 두 상자를 한 계로 보면 a = F/(mA + mB) (5.3.2). 맞닿은 면에서 A는 B를 늘 +x 쪽으로 민다.
// F > 0이면 B만 보아 F_BA = mB a, F < 0이면 A만 보아 F_AB = mA a. 짝힘이라 F_AB = −F_BA (5.3.1).
export function contact(F, mA, mB) {
  const a = F / (mA + mB), FBA = F >= 0 ? mB * a : -mA * a;
  return { a, FBA, FAB: -FBA };
}
// 마찰 없는 탁자 위 블록(질량 M)과 도르래를 지나 매달린 블록(질량 m)을 질량 없는 줄로 잇는다(교재 예제 5.3.1).
// (5.3.7) a = m g/(M + m), (5.3.4) T = M a. 줄과 도르래의 질량, 도르래의 마찰은 무시한다.
export function pulley(M, m, g = G) {
  const a = m * g / (M + m);
  return { a, T: M * a };
}
// 가속도 a가 일정한 동안 dt만큼 진행한 위치와 속도(교재 2.4). 시뮬레이션의 한 프레임 적분이라 오차가 없다.
export const advance = (x, v, a, dt) => [x + v * dt + a * dt * dt / 2, v + a * dt];
// 가속도 a가 일정할 때 x에서 출발해 X에 처음 닿기까지 걸리는 시간. 닿지 않으면 Infinity.
export function hitTime(x, v, a, X) {
  const d = X - x;
  if (Math.abs(a) < 1e-12) return v !== 0 && d / v >= 0 ? d / v : Infinity;
  const D = v * v + 2 * a * d;
  if (D < 0) return Infinity;
  const r = [(-v - Math.sqrt(D)) / a, (-v + Math.sqrt(D)) / a].filter(u => u >= -1e-12).sort((p, q) => p - q);
  return r.length ? Math.max(0, r[0]) : Infinity;
}
