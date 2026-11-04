// Vector scene parts for Chapter 3 (same file in 3-1 and 3-2, core candidate). Built on core/stage3d.js, no core change.
// Coordinate frame of the textbook (Fig. 3.2.1): x right, y up, z out of the page. The xy plane is a glass panel
// standing on the approved measuring board, so a vector with az = 0 lies on the "page" and az lifts it toward the viewer.
// Colours (05_디자인_기준.md §색, Okabe–Ito): general vectors a, b, sum s or r, and unit vectors use different colours,
// and every arrow also carries a KaTeX label, so colour is never the only cue.
import { tex } from '../../../core/math.js';
import { fmtFixed } from '../../../core/format.js';

export const HEX = { a: 0x0072b2, b: 0xd55e00, s: 0x009e73, c: 0x009e73, unit: 0x000000, axis: 0x56687a, guide: 0x6f7f8f, cand: 0x8d9aa7, angle: 0x33475b };
export const CSS = { a: '#0072b2', b: '#d55e00', s: '#009e73', c: '#009e73', unit: '#000000', cand: '#8d9aa7' };
export const UNIT = { x: '\\hat{\\mathrm{i}}', y: '\\hat{\\mathrm{j}}', z: '\\hat{\\mathrm{k}}' };

export function vectorKit(stage) {
  const { THREE, v3 } = stage;
  const UP = new THREE.Vector3(0, 1, 0);
  const g = () => stage.group;

  // KaTeX label at a world point. kind 'vlab' is styled in the screen's index.html (16 px, #1a1a1a, white halo).
  const label = (src, pos, { kind = 'vlab', priority = 4, dy = 0, raw = false } = {}) =>
    stage.label(raw ? src : tex(src), pos, kind, { dy, priority });

  // ---------- frame: measuring board, xy glass panel, axes, unit vectors ----------
  // L is the half size of the panel. Grid lines and tick numbers sit on whole numbers inside it.
  // The unit vectors stand on the front-left corner of the board, away from the origin, so they never hide a component.
  function frame(L, { unit = 'm', labelEvery = 1, units = true, unitVectors = true } = {}) {
    const top = -L - 0.3, depth = Math.max(3.6, 1.15 * L), half = depth / 2;
    stage.board(g(), -L - 0.9, L + 0.9, depth, top);
    stage.floorPlane(top - 1.45);
    const legs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.36, 0.46, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), 4), M = new THREE.Matrix4();
    [[-L, -half + 0.7], [-L, half - 0.7], [L, -half + 0.7], [L, half - 0.7]].forEach(([x, z], i) => legs.setMatrixAt(i, M.makeTranslation(x, top - 1.12, z)));
    g().add(legs);

    // Glass panel for the xy plane with a thin metal rim and two feet on the board.
    const panel = stage.mesh(g(), new THREE.PlaneGeometry(2 * L, 2 * L), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.34, roughness: 0.18, metalness: 0, depthWrite: false, side: THREE.DoubleSide }), [0, 0, 0], [0, 0, 0], false);
    panel.renderOrder = 1;
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), stage.lit(0x8c9ca9, 0.6, 0.32), 6);
    const S = new THREE.Vector3(), P = new THREE.Vector3(), Q = new THREE.Quaternion();
    [[0, L, 2 * L + 0.08, 0.08], [0, -L, 2 * L + 0.08, 0.08], [-L, 0, 0.08, 2 * L], [L, 0, 0.08, 2 * L]].forEach(([x, y, w, h], i) => bars.setMatrixAt(i, M.compose(P.set(x, y, 0), Q, S.set(w, h, 0.08))));
    // Feet from the board top (y = top) up to the panel's lower rim (y = −L).
    [-L + 0.6, L - 0.6].forEach((x, i) => bars.setMatrixAt(4 + i, M.compose(P.set(x, (top - L) / 2, 0), Q, S.set(0.5, -L - top + 0.02, 0.5))));
    g().add(bars);

    // Grid on the panel, one square per unit.
    const pts = [], k0 = Math.ceil(-L - 1e-9), k1 = Math.floor(L + 1e-9);
    for (let k = k0; k <= k1; k++) pts.push([k, -L, 0.004], [k, L, 0.004], [-L, k, 0.004], [L, k, 0.004]);
    g().add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(v3)), new THREE.LineBasicMaterial({ color: 0xbac6d1 })));

    // Axes through the origin with tick numbers. Axis titles follow textbook Fig. 3.1.8, x (m), y (m).
    // The y title sits beside the axis tip, so it stays below the scene heading.
    const ax = (d, name, at) => {
      stage.arrow(HEX.axis, { radius: 0.026 }).update(d.map(c => -c * (L + 0.2)), d, 2 * L + 1.0);
      stage.label(`<i>${name}</i>${units ? ` (${unit})` : ''}`, at, 'axis', { dy: 0, priority: 2 });
    };
    ax([1, 0, 0], 'x', [L + 1.35, 0, 0]); ax([0, 1, 0], 'y', [0.8, L - 0.35, 0]); ax([0, 0, 1], 'z', [0, 0, L + 1.35]);
    for (let k = Math.ceil(k0 / labelEvery) * labelEvery; k <= k1; k += labelEvery) {
      if (k === 0) continue;
      const t = fmtFixed(k, 0);
      stage.label(t, [k, -0.34, 0], 'gtick', { dy: 0 });
      stage.label(t, [-0.36, k, 0], 'gtick', { dy: 0 });
      stage.label(t, [0.3, -0.3, k], 'gtick', { dy: 0 });
    }
    stage.label('<i>O</i>', [-0.3, -0.3, 0], 'gtick', { dy: 0 });

    // Unit vectors i, j, k: magnitude 1, along +x, +y, +z (Fig. 3.2.1), standing on the board corner.
    if (unitVectors) {
      const o = [-L - 0.35, top + 0.06, half - 0.55];
      for (const [d, n, off] of [[[1, 0, 0], 'x', [1.4, 0.05, 0]], [[0, 1, 0], 'y', [0, 1.4, 0]], [[0, 0, 1], 'z', [0, 0.05, 1.35]]]) {
        stage.arrow(HEX.unit, { radius: 0.045, headRatio: 0.3 }).update(o, d, 1);
        label(UNIT[n], o.map((c, i) => c + off[i]), { priority: 3 });
      }
    }
    return { L, top, depth };
  }

  // ---------- arrows ----------
  // Solid arrow (vector). set(origin, v) draws v from origin; length 0 hides it.
  function arrow(color, { radius = 0.07, opacity = 1 } = {}) {
    const a = stage.arrow(color, { radius });
    if (opacity < 1) a.traverse(o => { if (o.material) Object.assign(o.material, { transparent: true, opacity, depthWrite: false }); });
    return { obj: a, set(origin, v) { a.update(origin, v, Math.hypot(...v)); }, hide() { a.visible = false; } };
  }
  // Dashed arrow (vector component, 05 기준 "성분 화살표는 같은 색 점선"): short cylinders and a cone head, one draw call each.
  function dashed(color, { radius = 0.04, dash = 0.2, gap = 0.13, max = 120, opacity = 1 } = {}) {
    const group = new THREE.Group(); g().add(group);
    const mat = stage.flat(color, opacity < 1 ? { transparent: true, opacity, depthWrite: false } : {});
    const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(radius, radius, 1, 10), mat, max);
    inst.frustumCulled = false; group.add(inst);
    const head = new THREE.Mesh(new THREE.ConeGeometry(radius * 2.7, 1, 16), mat); group.add(head);
    const M = new THREE.Matrix4(), P = new THREE.Vector3(), S = new THREE.Vector3(), q = new THREE.Quaternion();
    return {
      obj: group,
      set(origin, v) {
        const d = v3(v), n = d.length();
        if (n < 1e-6) { group.visible = false; return; }
        group.visible = true;
        const u = d.normalize(), o = v3(origin), h = Math.min(n * 0.4, radius * 8), body = n - h;
        q.setFromUnitVectors(UP, u);
        let k = 0;
        for (let s = 0; s < body - 1e-6 && k < max; s += dash + gap) {
          const len = Math.min(dash, body - s);
          inst.setMatrixAt(k++, M.compose(P.copy(o).addScaledVector(u, s + len / 2), q, S.set(1, len, 1)));
        }
        inst.count = k; inst.instanceMatrix.needsUpdate = true;
        head.scale.set(1, h, 1); head.quaternion.copy(q); head.position.copy(o).addScaledVector(u, body + h / 2);
      },
      hide() { group.visible = false; },
    };
  }
  // Thin dashed guide lines (perpendiculars dropped onto the axes). pairs: [[p, q], ...].
  function guides(pairs, color = HEX.guide, { dash = 0.16, gap = 0.12, opacity = 0.9 } = {}) {
    const geo = new THREE.BufferGeometry().setFromPoints(pairs.flat().map(v3));
    const l = new THREE.LineSegments(geo, new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap, transparent: opacity < 1, opacity }));
    l.computeLineDistances(); g().add(l); return l;
  }
  // Box whose diagonal is v from the origin: the 9 edges that are not on the axes.
  function boxEdges(v) {
    const [x, y, z] = v, P = [x, y, 0], Qxz = [x, 0, z], Qyz = [0, y, z];
    const e = [[P, v], [Qxz, v], [Qyz, v], [[x, 0, 0], P], [[0, y, 0], P], [[x, 0, 0], Qxz], [[0, 0, z], Qxz], [[0, y, 0], Qyz], [[0, 0, z], Qyz]];
    return e.filter(([p, q]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > 1e-6);
  }

  // Arc of angle `angle` (rad) about center from unit u toward unit w (u ⟂ w), as a thin tube, optional head at the end.
  function arc(center, u, w, angle, r, color = HEX.angle, { radius = 0.022, head = false, opacity = 1 } = {}) {
    if (!(Math.abs(angle) > 1e-4)) return null;
    const c = v3(center), U = v3(u), W = v3(w), n = Math.max(8, Math.ceil(Math.abs(angle) / 0.06));
    const at = t => c.clone().addScaledVector(U, r * Math.cos(t)).addScaledVector(W, r * Math.sin(t));
    const path = new THREE.CatmullRomCurve3(Array.from({ length: n + 1 }, (_, i) => at(angle * i / n)));
    const mat = stage.flat(color, opacity < 1 ? { transparent: true, opacity, depthWrite: false } : {});
    const m = stage.mesh(g(), new THREE.TubeGeometry(path, n * 2, radius, 6, false), mat, [0, 0, 0], [0, 0, 0], false);
    if (head) {
      const end = at(angle), tan = U.clone().multiplyScalar(-Math.sin(angle)).addScaledVector(W, Math.cos(angle)).multiplyScalar(Math.sign(angle));
      const cone = stage.mesh(g(), new THREE.ConeGeometry(radius * 4, radius * 11, 14), mat, [0, 0, 0], [0, 0, 0], false);
      cone.quaternion.setFromUnitVectors(UP, tan.normalize()); cone.position.copy(end);
    }
    return { mesh: m, mid: at(angle / 2), at };
  }
  // Right-angle mark at point p between unit directions u and w.
  function rightAngle(p, u, w, size = 0.28, color = HEX.guide) {
    const P = v3(p), U = v3(u).multiplyScalar(size), W = v3(w).multiplyScalar(size);
    return stage.line([P.clone().add(U).toArray(), P.clone().add(U).add(W).toArray(), P.clone().add(W).toArray()], color);
  }

  return { label, frame, arrow, dashed, guides, boxEdges, arc, rightAngle };
}

// Unit-vector notation as in the textbook, (4.2 m)î − (1.5 m)ĵ. Zero components are left out. num formats a number for TeX.
export function unitVectorTex(v, num, unit = '') {
  const u = unit ? `\\ \\mathrm{${unit}}` : '';
  const terms = [];
  ['x', 'y', 'z'].forEach((k, i) => {
    const x = v[i];
    if (Math.abs(x) < 1e-9) return;
    const first = terms.length === 0;
    const mag = first ? x : Math.abs(x);
    const body = unit ? `(${num(mag)}${u})${UNIT[k]}` : `${num(mag)}${UNIT[k]}`;
    terms.push(first ? body : `${x < 0 ? '-' : '+'} ${body}`);
  });
  return terms.length ? terms.join(' ') : `0${u}`;
}
