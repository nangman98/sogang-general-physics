// 2장 등가속도 운동 계산. 교재 (2.4.1) v = v0 + at, (2.4.5) x − x0 = v0 t + ½ a t².
export const velocity = (v0, a, t) => v0 + a * t;
export const position = (x0, v0, a, t) => x0 + v0 * t + 0.5 * a * t * t;
