// 3장 시뮬레이션의 벡터 계산. 교재 식 3.2.4–3.2.6 (성분 합), 3.3.1·3.3.4 (내적), 3.3.5·3.3.8 (외적).
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const mag = a => Math.hypot(...a);
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const cross = ([ax, ay, az], [bx, by, bz]) => [ay * bz - by * az, az * bx - bz * ax, ax * by - bx * ay];
export const deg = r => (r * 180) / Math.PI;
export const rad = d => (d * Math.PI) / 180;
// x축에서 잰 방향각(도), 0 이상 360 미만
export const angleDeg = ([x, y]) => (deg(Math.atan2(y, x)) + 360) % 360;
// 차 a − b = a + (−b) (교재 3.1.4, 성분은 3.2.7)
export const sub = (a, b) => a.map((v, i) => v - b[i]);
// 크기 m, x축에서 잰 방향각 d(도)인 xy 평면 벡터
export const polar = (m, d) => [m * Math.cos(rad(d)), m * Math.sin(rad(d))];
// 두 방향각 사이의 작은 각(도), 0–180
export const between = (d1, d2) => { const e = (((d2 - d1) % 360) + 360) % 360; return e > 180 ? 360 - e : e; };
// a의 방향각 d1에서 b의 방향각 d2까지 반시계 방향(+z 쪽에서 볼 때)으로 잰 각(도), 0 이상 360 미만
export const ccw = (d1, d2) => (((d2 - d1) % 360) + 360) % 360;
// step 배수로 맞추고 [lo, hi]로 자른다. 부동소수 끝자리를 지운다
export const snap = (v, step, lo = -Infinity, hi = Infinity) => Math.min(hi, Math.max(lo, +(Math.round(v / step) * step).toFixed(6)));
