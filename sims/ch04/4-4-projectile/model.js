// 4.4 Projectile Motion — pure model (no DOM). Textbook: Principles of Physics 12e, Eqs. (4.4.3)–(4.4.8).
// The textbook launch plane is the x–y plane. The 3D view can rotate that plane about the vertical y axis
// by the angle phi (phi = 0 reproduces the textbook axes exactly).

export const G = 9.8; // m/s^2, value used in Sample Problems 4.4.1 and 4.4.2

export const params = [
  { id: 'v0', label: 'Launch speed', sym: '<i>v</i><sub>0</sub>', unit: 'm/s', min: 10, max: 30, step: 1, value: 20 },
  { id: 'theta0', label: 'Launch angle', sym: '<i>θ</i><sub>0</sub>', unit: '°', min: 10, max: 80, step: 1, value: 45 },
  { id: 'phi', label: 'Turn launch plane', sym: '<i>φ</i>', unit: '°', min: -60, max: 60, step: 5, value: 0 },
];

const rad = d => d * Math.PI / 180;

export function components(p) {
  const v0x = p.v0 * Math.cos(rad(p.theta0)); // horizontal component in the launch plane, Eq. (4.4.2)
  const v0y = p.v0 * Math.sin(rad(p.theta0));
  return { v0x, v0y };
}

export function duration(p) {
  return 2 * components(p).v0y / G; // flight time back to the launch height
}

export function range(p) {
  return (p.v0 * p.v0 / G) * Math.sin(2 * rad(p.theta0)); // Eq. (4.4.8)
}

export function maxHeight(p) {
  const { v0y } = components(p);
  return v0y * v0y / (2 * G);
}

// Exact state at time t (clamped to the flight).
export function at(t, p) {
  const T = duration(p);
  const tc = Math.min(Math.max(t, 0), T);
  const { v0x, v0y } = components(p);
  const s = v0x * tc;                          // x − x0 in the launch plane, Eq. (4.4.3)
  const y = v0y * tc - 0.5 * G * tc * tc;       // y − y0, Eq. (4.4.4)
  const vy = v0y - G * tc;                      // Eq. (4.4.5)
  const c = Math.cos(rad(p.phi)), sn = Math.sin(rad(p.phi));
  return {
    t: tc,
    position_m: [s * c, y, -s * sn],
    velocity_m_s: [v0x * c, vy, -v0x * sn],
    acceleration_m_s2: [0, -G, 0],
    inPlane: { x_m: s, y_m: y, vx_m_s: v0x, vy_m_s: vy },
  };
}

export function init(p) {
  return at(0, p);
}

export function observe(state, p) {
  return { ...state, range_m: range(p), maxHeight_m: maxHeight(p), flightTime_s: duration(p) };
}
