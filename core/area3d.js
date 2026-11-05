// Area between a graph-board curve and its horizontal axis, shared from Chapter 7 on (F–x work, p–V work).
// Copied from sims/ch02/2-4-graphical-integration/area.js (screen 2-4 keeps its own copy).
// Fill colours are the fill-only colours of 05_디자인_기준.md §색 (#E69F00 above the axis, #56B4E9 below) with a
// 1 px black outline, and every piece also carries a + or − glyph so the sign never depends on colour alone.
// regions: pieces of one sign from model.regions(), each { t0, t1, f0, f1, area } with a straight top edge.
// The fill grows with time: update(t) draws the part of every piece left of t (one mesh and one line set in total).
import { fmt } from './format.js';

export const FILL_POS = 0xe69f00, FILL_NEG = 0x56b4e9;

export function areaFill(stage, board, regions, { unit = '', opacity = 0.6 } = {}) {
  const { THREE } = stage;
  const [y0, y1] = board.range.y;
  const cy = y => Math.min(y1, Math.max(y0, y));
  const zf = board.Z + 0.006;                    // the board face is at Z (core/graph3d.js), so draw just in front of it
  const P = (t, y) => [board.X(t), board.Y(cy(y)), zf];
  const rs = regions.filter(r => Math.abs(r.area) > 1e-9);

  const pos = new Float32Array(Math.max(1, rs.length) * 18), col = new Float32Array(pos.length);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  mesh.frustumCulled = false; board.group.add(mesh);
  const lpos = new Float32Array(Math.max(1, rs.length) * 24);
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const outline = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: 0x000000 }));
  outline.frustumCulled = false; board.group.add(outline);
  const cPos = new THREE.Color(FILL_POS), cNeg = new THREE.Color(FILL_NEG);

  // Sign glyph in each piece, and a value tag that appears on request.
  const mid = r => [(r.t0 + r.t1) / 2, (r.f0 + r.f1) / 4];
  const signs = rs.map(r => stage.label(r.area > 0 ? '+' : '−', board.at(...mid(r)), 'axis', { dy: 0, priority: 1 }));
  // A piece narrower than 1 s moves its tag away from the time axis, so it does not cover the tag of the piece beside it.
  const values = rs.map(r => stage.label(`${r.area > 0 ? '+' : ''}${fmt(r.area)} ${unit}`, board.at(...mid(r)), 'tag', { dy: r.t1 - r.t0 < 1 ? (r.area > 0 ? -18 : 18) : 0, priority: 2 }));
  let showValues = false;

  function update(t) {
    let nt = 0, nl = 0;
    rs.forEach((r, i) => {
      const on = t > r.t0 + 1e-9;
      signs[i].node.dataset.off = on && !showValues ? '' : '1';
      values[i].node.dataset.off = on && showValues ? '' : '1';
      if (!on) return;
      const b = Math.min(t, r.t1), fb = r.f0 + (r.f1 - r.f0) * (b - r.t0) / (r.t1 - r.t0);
      const A = P(r.t0, 0), B = P(b, 0), C = P(b, fb), D = P(r.t0, r.f0);
      for (const v of [A, B, C, A, C, D]) { pos.set(v, nt * 3); nt++; }
      const c = r.area > 0 ? cPos : cNeg;
      for (let k = nt - 6; k < nt; k++) col.set([c.r, c.g, c.b], k * 3);
      for (const v of [A, B, B, C, C, D, D, A]) { lpos.set(v, nl * 3); nl++; }
    });
    geo.setDrawRange(0, nt); geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    lgeo.setDrawRange(0, nl); lgeo.attributes.position.needsUpdate = true;
  }
  return {
    update,
    values(on) { showValues = on; },
  };
}

// Step curve drawn through exact corner points, so the jumps at step boundaries are vertical.
export function stepCurve(stage, board, pts, color, radius = 0.045) {
  const { THREE } = stage;
  const [y0, y1] = board.range.y;
  const path = new THREE.CurvePath();
  const W = ([t, y]) => new THREE.Vector3(board.X(t), board.Y(Math.min(y1, Math.max(y0, y))), board.Z);
  for (let i = 1; i < pts.length; i++) if (pts[i][0] !== pts[i - 1][0] || pts[i][1] !== pts[i - 1][1]) path.add(new THREE.LineCurve3(W(pts[i - 1]), W(pts[i])));
  const m = stage.mesh(board.group, new THREE.TubeGeometry(path, 24 * pts.length, radius, 8, false), stage.flat(color), [0, 0, 0], [0, 0, 0], false);
  m.frustumCulled = false;
  return m;
}
