// 5장 시뮬레이션 계산. 교재 식 5.1.1 (제2법칙), 5.2.1·5.2.6 (중력, 수직항력), 5.3.1–5.3.2 (제3법칙, 함께 움직이는 계).
export const G = 9.8;   // m/s², 교재 2.5
export const accel = (Fnet, m) => Fnet / m;                       // (5.1.1) a = F_net / m
export const gravity = (m, g = G) => m * g;                        // (5.2.1) F_g = mg
export const normalForce = (m, ay, g = G) => m * (g + ay);         // (5.2.6) F_N = m(g + a_y), 엘리베이터 안 저울 눈금
// 마찰 없는 바닥에서 맞닿은 두 상자 A, B를 A 쪽에서 힘 F로 민다. 두 상자를 한 계로 보면 a = F/(mA + mB) (5.3.2).
// B에 A가 주는 힘 F_BA = mB a, A에 B가 주는 힘 F_AB = −F_BA (5.3.1).
export function contact(F, mA, mB) {
  const a = F / (mA + mB);
  return { a, FBA: mB * a, FAB: -mB * a };
}
// 마찰 없는 탁자 위 블록(질량 M)과 도르래를 지나 매달린 블록(질량 m)을 질량 없는 줄로 잇는다(교재 예제 5.3.1).
// (5.3.7) a = m g/(M + m), (5.3.4) T = M a. 줄과 도르래의 질량, 도르래의 마찰은 무시한다.
export function pulley(M, m, g = G) {
  const a = m * g / (M + m);
  return { a, T: M * a };
}
