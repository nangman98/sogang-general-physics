// 3장 시뮬레이션의 벡터 계산. 교재 식 3.2.4–3.2.6 (성분 합), 3.3.1·3.3.4 (내적), 3.3.5·3.3.8 (외적).
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const mag = a => Math.hypot(...a);
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const cross = ([ax, ay, az], [bx, by, bz]) => [ay * bz - by * az, az * bx - bz * ax, ax * by - bx * ay];
export const deg = r => (r * 180) / Math.PI;
export const rad = d => (d * Math.PI) / 180;
// x축에서 잰 방향각(도), 0 이상 360 미만
export const angleDeg = ([x, y]) => (deg(Math.atan2(y, x)) + 360) % 360;
