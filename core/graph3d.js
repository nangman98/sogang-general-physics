// Graph board standing inside the 3D scene (user decision 2026-11-03: time graphs are boards in the scene).
// A light panel with grid, axes, fixed-size HTML tick labels, and curves drawn as thin tubes.
// Curve colours follow 05_디자인_기준.md (position #000000, velocity #0072B2, acceleration #CC79A7).
// Draw calls per board stay small: one grid, one axis set, one cursor, and two meshes per curve.
import { fmtFixed } from './format.js';

// Step of 1, 2 or 5 times a power of ten that splits span into about `target` parts.
export function niceStep(span, target = 5) {
  if (!(span > 0)) return 1;
  const raw = span / target, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

// Axis range on whole steps that covers [lo, hi]. includeZero keeps the origin on the axis.
export function niceRange(lo, hi, { target = 5, includeZero = true, minSpan = 1 } = {}) {
  let a = Math.min(lo, hi), b = Math.max(lo, hi);
  if (includeZero) { a = Math.min(a, 0); b = Math.max(b, 0); }
  if (b - a < minSpan) {
    const c = (a + b) / 2; a = c - minSpan / 2; b = c + minSpan / 2;
    if (includeZero) { a = Math.min(a, 0); b = Math.max(b, 0); }
  }
  const step = niceStep(b - a, target);
  return { min: Math.floor(a / step + 1e-9) * step, max: Math.ceil(b / step - 1e-9) * step, step };
}

const decimalsOf = step => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));

export function graphBoard(stage, {
  parent = stage.group, origin = [0, 0, 0], width = 12, height = 3.6,
  t = [0, 10], tStep = null, y = [-1, 1], yStep = null, tTitle = '<i>t</i> (s)', yTitle = '',
} = {}) {
  const { THREE, v3 } = stage;
  const group = new THREE.Group(); parent.add(group);
  const [ox, oy, oz] = origin, depth = 0.14;
  const L = 1.35, R = 1.05, B = 0.66, T = 0.62;              // plot margins (world units)
  const pw = width - L - R, ph = height - B - T;
  const [t0, t1] = t, [y0, y1] = y;
  const ts = tStep ?? niceStep(t1 - t0), ys = yStep ?? niceStep(y1 - y0, 4);
  const X = tv => ox + L + (tv - t0) / (t1 - t0) * pw;
  const Y = yv => oy + B + (yv - y0) / (y1 - y0) * ph;
  const Z = oz + depth + 0.03;
  const at = (tv, yv) => [X(tv), Y(Math.min(y1, Math.max(y0, yv))), Z];

  // Panel with rounded corners and a metal edge, front face toward +z.
  const r = 0.22, s = new THREE.Shape();
  s.moveTo(ox + r, oy); s.lineTo(ox + width - r, oy); s.quadraticCurveTo(ox + width, oy, ox + width, oy + r);
  s.lineTo(ox + width, oy + height - r); s.quadraticCurveTo(ox + width, oy + height, ox + width - r, oy + height);
  s.lineTo(ox + r, oy + height); s.quadraticCurveTo(ox, oy + height, ox, oy + height - r); s.lineTo(ox, oy + r);
  s.quadraticCurveTo(ox, oy, ox + r, oy);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.03, bevelThickness: 0.03 });
  const panel = stage.mesh(group, geo, [stage.flat(0xf7f9fb), stage.lit(0x8c9ca9, 0.6, 0.32)], [0, 0, oz]);
  panel.castShadow = false;

  const segments = (pairs, color) => {
    const g = new THREE.BufferGeometry().setFromPoints(pairs.flat().map(v3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color }));
    group.add(l); return l;
  };
  const tickT = [], tickY = [];
  for (let k = Math.ceil(t0 / ts - 1e-9); k * ts <= t1 + 1e-9; k++) tickT.push(k * ts);
  for (let k = Math.ceil(y0 / ys - 1e-9); k * ys <= y1 + 1e-9; k++) tickY.push(k * ys);
  // Grid and axes sit just in front of the face (the face is at Z), curves are tubes centred on Z.
  const zg = Z + 0.004;
  segments([...tickT.map(tv => [[X(tv), Y(y0), zg], [X(tv), Y(y1), zg]]), ...tickY.map(yv => [[X(t0), Y(yv), zg], [X(t1), Y(yv), zg]])], 0xdbe2e9);
  const yAxisAt = y0 <= 0 && y1 >= 0 ? 0 : y0;
  segments([[[X(t0), Y(yAxisAt), zg + 0.005], [X(t1) + 0.3, Y(yAxisAt), zg + 0.005]], [[X(t0), Y(y0), zg + 0.005], [X(t0), Y(y1) + 0.25, zg + 0.005]]], 0x40546a);
  const td = decimalsOf(ts), yd = decimalsOf(ys);
  for (const tv of tickT) stage.label(fmtFixed(tv, td), [X(tv), Y(y0) - 0.42, Z], 'gtick', { dy: 0 });
  for (const yv of tickY) stage.label(fmtFixed(yv, yd), [X(t0) - 0.7, Y(yv), Z], 'gtick', { dy: 0 });
  // Axis title right of the y axis top, kept before tick labels when they would overlap.
  stage.label(yTitle, [X(t0) + 0.8, oy + height - 0.26, Z], 'gtitle', { dy: 0, priority: 3 });
  // On a board whose time axis is the bottom edge the title goes above the axis, clear of the last time tick.
  stage.label(tTitle, [X(t1) + 0.62, Y(yAxisAt) + (yAxisAt === y0 ? 0.34 : 0), Z], 'gtitle', { dy: 0, priority: 3 });

  // Time cursor shared by every curve on this board.
  const cursor = stage.line([[X(t0), Y(y0), zg + 0.004], [X(t0), Y(y1), zg + 0.004]], 0x7d94a8, { parent: group, dashed: true, dash: 0.14, gap: 0.1 });
  cursor.frustumCulled = false;

  const curves = [];
  // fn(t) -> value. The part after the current time stays faint. dotted draws beads (second object).
  // tag(value) -> html puts the current value beside the moving dot (an HTML label, no draw call).
  function curve(fn, { color = 0x000000, radius = 0.045, samples = 200, dotted = false, dot = true, tag = null } = {}) {
    const times = Array.from({ length: samples + 1 }, (_, i) => t0 + (t1 - t0) * i / samples);
    const pts = times.map(tv => at(tv, fn(tv)));
    const solidMat = stage.flat(color), faintMat = stage.flat(color, { transparent: true, opacity: 0.22, depthWrite: false });
    let item;
    if (dotted) {
      const bead = new THREE.SphereGeometry(radius * 1.25, 10, 8), n = Math.floor(samples / 4) + 1;
      const make = mat => { const m = new THREE.InstancedMesh(bead, mat, n); group.add(m); return m; };
      const solid = make(solidMat), faint = make(faintMat), M = new THREE.Matrix4();
      for (let k = 0; k < n; k++) { M.makeTranslation(...pts[k * 4]); solid.setMatrixAt(k, M); faint.setMatrixAt(k, M); }
      item = { setDone(tv) { const k = Math.min(n, Math.floor((tv - t0) / ((t1 - t0) * 4 / samples) + 1e-6) + 1); solid.count = k; } };
    } else {
      const path = new THREE.CurvePath();
      for (let i = 1; i < pts.length; i++) path.add(new THREE.LineCurve3(v3(pts[i - 1]), v3(pts[i])));
      const tubular = samples * 2, radial = 8;
      const g = new THREE.TubeGeometry(path, tubular, radius, radial, false);
      const solid = stage.mesh(group, g, solidMat, [0, 0, 0], [0, 0, 0], false);
      stage.mesh(group, new THREE.TubeGeometry(path, tubular, radius * 0.8, radial, false), faintMat, [0, 0, 0], [0, 0, 0], false);
      // TubeGeometry places rings at equal arc length, so map time to the arc-length fraction.
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + v3(pts[i]).distanceTo(v3(pts[i - 1])));
      const total = cum[cum.length - 1] || 1;
      item = {
        setDone(tv) {
          const u = (tv - t0) / (t1 - t0) * samples, i = Math.max(0, Math.min(samples, Math.floor(u)));
          const len = i >= samples ? total : cum[i] + (cum[i + 1] - cum[i]) * (u - i);
          g.setDrawRange(0, Math.round(len / total * tubular) * radial * 6);
        },
      };
    }
    const marker = dot ? stage.mesh(group, new THREE.SphereGeometry(radius * 2.6, 20, 14), solidMat, pts[0], [0, 0, 0], false) : null;
    const label = tag ? stage.label(tag(fn(t0)), at(t0, fn(t0)), 'gval', { dy: -16, priority: 2 }) : null;
    if (label) label.node.style.color = '#' + new THREE.Color(color).getHexString();
    item.update = tv => {
      item.setDone(tv);
      const y = fn(tv), pos = at(tv, y);
      if (marker) marker.position.set(...pos);
      // Below the dot in the upper half of the board, above it in the lower half, clear of the axis titles.
      if (label) { label.move([pos[0] + 0.25, pos[1], pos[2]]); label.dy = y > (y0 + y1) / 2 ? 16 : -16; label.set(tag(y)); }
    };
    curves.push(item);
    return item;
  }

  function setTime(tv) {
    const pos = cursor.geometry.attributes.position;
    pos.setXYZ(0, X(tv), Y(y0), zg + 0.004); pos.setXYZ(1, X(tv), Y(y1), zg + 0.004); pos.needsUpdate = true;
    cursor.computeLineDistances();
    for (const c of curves) c.update(tv);
  }

  // Ring marking one point, e.g. where two x–t curves cross.
  function mark(tv, yv, color = 0x40546a) {
    return stage.mesh(group, new THREE.TorusGeometry(0.17, 0.035, 10, 40), stage.flat(color), at(tv, yv), [0, 0, 0], false);
  }

  return { group, X, Y, Z, at, curve, setTime, mark, range: { t: [t0, t1], y: [y0, y1] } };
}
