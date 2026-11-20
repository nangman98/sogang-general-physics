// 4장 시뮬레이션 계산. 교재 식 4.4.3–4.4.8 (포물선), 4.5.1–4.5.2 (등속 원운동), 4.7.2 (상대 속도).
export const G = 9.8;   // m/s², 교재 2.5
const rad = d => (d * Math.PI) / 180;

// 발사점 (0, 0), 처음 속력 v0, 발사각 th0(도)
export function projectile(v0, th0, t, g = G) {
  const vx = v0 * Math.cos(rad(th0)), vy0 = v0 * Math.sin(rad(th0));
  return { x: vx * t, y: vy0 * t - (g * t * t) / 2, vx, vy: vy0 - g * t };
}
export const flightTime = (v0, th0, g = G) => (2 * v0 * Math.sin(rad(th0))) / g;
export const range = (v0, th0, g = G) => ((v0 * v0) / g) * Math.sin(2 * rad(th0));                 // (4.4.8)
export const maxHeight = (v0, th0, g = G) => (v0 * Math.sin(rad(th0))) ** 2 / (2 * g);
export const trajectoryY = (v0, th0, x, g = G) => Math.tan(rad(th0)) * x - (g * x * x) / (2 * (v0 * Math.cos(rad(th0))) ** 2);   // (4.4.7)

export const centripetal = (v, r) => (v * v) / r;          // (4.5.1)
export const period = (v, r) => (2 * Math.PI * r) / v;     // (4.5.2)
// 중심이 원점인 반지름 r의 원을 속력 v로 반시계 방향으로 돈다. t = 0에 (r, 0)에서 출발하고 θ = vt/r.
// 속도 v_x = −v sin θ, v_y = v cos θ (4.5.3), 가속도 a_x = −(v²/r) cos θ, a_y = −(v²/r) sin θ (4.5.6).
export function circle(v, r, t) {
  const th = (v * t) / r, c = Math.cos(th), s = Math.sin(th), a = centripetal(v, r);
  return { th, x: r * c, y: r * s, vx: -v * s, vy: v * c, ax: -a * c, ay: -a * s };
}

// 강을 건너는 배. P 배, A 강가, B 강물. x는 강물이 흐르는 쪽, y는 건너는 쪽.
// 뱃머리 각 th는 똑바로 건너는 방향에서 상류 쪽(−x)으로 잰 각(도).
export function boat(vPB, vBA, th, width) {
  const PB = [-vPB * Math.sin(rad(th)), vPB * Math.cos(rad(th))], BA = [vBA, 0];
  const PA = [PB[0] + BA[0], PB[1] + BA[1]];                // (4.7.2)
  const time = width / PB[1];
  return { PB, BA, PA, time, drift: PA[0] * time };
}
