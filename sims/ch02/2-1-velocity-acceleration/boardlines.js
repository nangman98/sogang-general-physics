// Lines drawn on a graph board from core/graph3d.js (plan part 2, kept in this folder, not in core).
// segment: straight line between two graph points (secant, tangent, rise and run legs), solid or dashed.
// trace: curve drawn only up to the current time (no faint future part), for a graph that builds up.
// Everything uses the board's X, Y, Z maps, so slopes on the board are the slopes of the plotted quantity.

export function boardLines(stage, board) {
  const { THREE } = stage;
  const [t0, t1] = board.range.t, [y0, y1] = board.range.y;
  const up = new THREE.Vector3(0, 1, 0);
  const W = (t, y, dz = 0.02) => new THREE.Vector3(board.X(t), board.Y(y), board.Z + dz);

  // Part of the line y = yA + m (t − tA) inside the plot box and inside [ta, tb]. null when nothing is left.
  function clip(tA, yA, m, ta, tb) {
    let a = Math.max(t0, ta), b = Math.min(t1, tb);
    if (Math.abs(m) > 1e-12) {
      const tl = tA + (y0 - yA) / m, th = tA + (y1 - yA) / m;
      a = Math.max(a, Math.min(tl, th)); b = Math.min(b, Math.max(tl, th));
    } else if (yA < y0 || yA > y1) return null;
    return b > a + 1e-9 ? [a, b] : null;
  }

  // Solid line is one cylinder. Dashed line is one InstancedMesh of short cylinders (one draw call either way).
  function segment(color, { radius = 0.035, dashed = false, dash = 0.22, gap = 0.14, dz = 0.02 } = {}) {
    const mat = stage.flat(color);
    const geo = new THREE.CylinderGeometry(1, 1, 1, 10);
    const max = 120;
    const obj = dashed ? new THREE.InstancedMesh(geo, mat, max) : new THREE.Mesh(geo, mat);
    obj.frustumCulled = false;
    board.group.add(obj);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    const item = {
      obj,
      set(tA, yA, tB, yB) {
        const A = W(tA, yA, dz), B = W(tB, yB, dz), d = B.clone().sub(A), L = d.length();
        if (L < 1e-6) { obj.visible = false; return; }
        obj.visible = true;
        q.setFromUnitVectors(up, d.clone().normalize());
        if (!dashed) {
          obj.position.copy(A).addScaledVector(d, 0.5); obj.quaternion.copy(q); obj.scale.set(radius, L, radius);
          return;
        }
        const period = dash + gap, n = Math.min(max, Math.max(1, Math.floor((L + gap) / period)));
        const u = d.clone().normalize();
        for (let k = 0; k < n; k++) {
          const c = A.clone().addScaledVector(u, k * period + dash / 2);
          M.compose(c, q, s.set(radius, dash, radius)); obj.setMatrixAt(k, M);
        }
        obj.count = n; obj.instanceMatrix.needsUpdate = true;
      },
      // Line through (tA, yA) with slope m, from ta to tb, clipped to the plot box.
      through(tA, yA, m, ta, tb) {
        const r = clip(tA, yA, m, ta, tb);
        if (!r) { obj.visible = false; return null; }
        item.set(r[0], yA + m * (r[0] - tA), r[1], yA + m * (r[1] - tA));
        return r;
      },
      hide() { obj.visible = false; },
    };
    return item;
  }

  function dot(color, radius = 0.12) {
    const m = stage.mesh(board.group, new THREE.SphereGeometry(radius, 20, 14), stage.flat(color), [0, 0, 0], [0, 0, 0], false);
    m.place = (t, y) => { m.visible = y >= y0 - 1e-9 && y <= y1 + 1e-9; m.position.copy(W(t, y, 0.03)); };
    return m;
  }

  // Curve fn(t) drawn up to the current time only. Same tube layout as core/graph3d.js curve().
  function trace(fn, color, { radius = 0.045, samples = 240 } = {}) {
    const pts = Array.from({ length: samples + 1 }, (_, i) => {
      const tv = t0 + (t1 - t0) * i / samples;
      return W(tv, Math.min(y1, Math.max(y0, fn(tv))), 0);
    });
    const path = new THREE.CurvePath();
    for (let i = 1; i < pts.length; i++) path.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
    const tubular = samples * 2, radial = 8;
    const g = new THREE.TubeGeometry(path, tubular, radius, radial, false);
    stage.mesh(board.group, g, stage.flat(color), [0, 0, 0], [0, 0, 0], false).frustumCulled = false;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const total = cum[cum.length - 1] || 1;
    const marker = dot(color, radius * 2.6);
    return {
      update(tv) {
        const u = (tv - t0) / (t1 - t0) * samples, i = Math.max(0, Math.min(samples, Math.floor(u)));
        const len = i >= samples ? total : cum[i] + (cum[i + 1] - cum[i]) * (u - i);
        g.setDrawRange(0, Math.round(len / total * tubular) * radial * 6);
        marker.place(tv, fn(tv));
      },
    };
  }

  return { segment, dot, trace, clip, W };
}
