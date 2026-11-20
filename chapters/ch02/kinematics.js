// 2장 등가속도 운동 계산. 교재 (2.4.1) v = v0 + at, (2.4.5) x − x0 = v0 t + ½ a t².
export const velocity = (v0, a, t) => v0 + a * t;
export const position = (x0, v0, a, t) => x0 + v0 * t + 0.5 * a * t * t;
// 자유 낙하 가속도의 크기 (교재 2.5), m/s²
export const G = 9.8;
// 0부터 T까지 위치가 지나는 구간 [최소, 최대]. 양 끝과 속도가 0이 되는 시각 t = −v0/a만 보면 된다.
export function extent(x0, v0, a, T) {
  const xs = [position(x0, v0, a, 0), position(x0, v0, a, T)];
  if (a !== 0) { const tt = -v0 / a; if (tt > 0 && tt < T) xs.push(position(x0, v0, a, tt)); }
  return [Math.min(...xs), Math.max(...xs)];
}
// 높이 y0 ≥ 0에서 처음 속도 v0(위가 +)로 던진 물체가 가속도 −g로 움직여 y = 0에 닿는 시각.
// y0 + v0 t − ½ g t² = 0의 양의 근이다. y0 = 0이고 v0 ≤ 0이면 0이다.
export const landing = (y0, v0, g = G) => (v0 + Math.sqrt(v0 * v0 + 2 * g * y0)) / g;
