// Force arrows, a block model and a free-body diagram shared by force screens from Chapter 6 on.
// Copied from sims/ch05/5-2-connected-bodies/forces3d.js (the Chapter 5 screens keep their own copies).
// Built from three.js primitives only. Arrows use unlit colour (06_3D_무대_기준.md) and are drawn over the
// bodies like the textbook sketches (Fig. 5.2.3a), so a force that passes through a body stays visible.

// Arrow with cylinder shaft and cone head along +y, scaled by update(origin, vec, length).
// overlay: drawn on top of the scene. dashed: shaft as short beads (used for components and moved copies).
export function vecArrow(stage, color, { radius = 0.05, overlay = true, opacity = 1, parent = stage.group, order = 20 } = {}) {
  const { THREE } = stage;
  const mat = new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: overlay || opacity < 1, opacity, depthTest: !overlay, depthWrite: !overlay });
  const item = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 18), mat);
  for (const m of [shaft, head]) { m.renderOrder = order; m.frustumCulled = false; item.add(m); }
  item.mat = mat;
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
  item.update = (origin, vec, length) => {
    dir.set(...vec);
    if (!(length > 1e-6) || dir.length() < 1e-12) { item.visible = false; return; }
    item.visible = true;
    const h = Math.min(length * 0.45, Math.max(radius * 5, 0.16)), s = Math.max(length - h, 1e-6);
    shaft.scale.set(radius, s, radius); shaft.position.set(0, s / 2, 0);
    head.scale.set(radius * 2.7, h, radius * 2.7); head.position.set(0, s + h / 2, 0);
    item.quaternion.setFromUnitVectors(up, dir.normalize());
    item.position.set(...origin);
  };
  parent.add(item);
  return item;
}

// Dashed segment (components, guide lines). Points are world coordinates.
export function dashLine(stage, a, b, color, { parent = stage.group, dash = 0.12, gap = 0.08, overlay = true } = {}) {
  const l = stage.line([a, b], color, { parent, dashed: true, dash, gap });
  if (overlay) { l.material.depthTest = false; l.material.transparent = true; l.renderOrder = 19; }
  l.frustumCulled = false;
  l.set = (p, q) => {
    const pos = l.geometry.attributes.position;
    pos.setXYZ(0, ...p); pos.setXYZ(1, ...q); pos.needsUpdate = true; l.computeLineDistances();
  };
  return l;
}

// Block with bevelled edges and an eye on the face where the cord is tied. Centred on the origin,
// side `size`; `eye` is the outward direction of that face in the block's own frame.
export function block(stage, size, { color = 0x9fb3c4, eye = [0, 1, 0] } = {}) {
  const { THREE } = stage;
  const g = new THREE.Group();
  stage.mesh(g, new THREE.BoxGeometry(size, size, size), stage.lit(color, 0.35, 0.45));
  // Darker edge bars as one instanced mesh.
  const t = size * 0.08, h = size / 2, spots = [];
  for (const y of [-1, 1]) for (const z of [-1, 1]) spots.push([[0, y * h, z * h], [size + 0.002, t, t]]);
  for (const x of [-1, 1]) for (const z of [-1, 1]) spots.push([[x * h, 0, z * h], [t, size + 0.002, t]]);
  for (const x of [-1, 1]) for (const y of [-1, 1]) spots.push([[x * h, y * h, 0], [t, t, size + 0.002]]);
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), stage.lit(0x56687a, 0.5, 0.4), spots.length);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3();
  spots.forEach(([p, s], i) => bars.setMatrixAt(i, M.compose(P.set(...p), q, S.set(...s))));
  bars.castShadow = bars.receiveShadow = true;
  g.add(bars);
  // The torus lies in the x–y plane, which holds both the top eye and the side eye.
  stage.mesh(g, new THREE.TorusGeometry(size * 0.12, size * 0.03, 8, 24), stage.lit(0x40546a, 0.6, 0.3), eye.map(c => c * (h + size * 0.1)));
  return g;
}

export const GREY = 0x8a98a6;           // arrow of a force the student is asked for, before the check
export const UNKNOWN_LENGTH = 1.0;     // m, its drawn length before the check

// Free-body diagram: the body as a dot, coordinate axes through it, force arrows with tails on the dot.
// axes: [{ name, dir, side }]. Each axis reaches 0.7 past the longest force component along it, so the axis
// name sits beyond the force labels; side shifts the name off the axis line.
// forces: [{ v, html, value, unknown }] drawn at once. Returns { force, reveal } to add arrows later or show the asked ones.
export function freeBody(stage, origin, { axes, forces = [], title, titleAt, color = 0xd55e00, scale = 0.1, tex }) {
  const { THREE } = stage;
  const o = origin;
  stage.mesh(stage.group, new THREE.SphereGeometry(0.11, 24, 16), stage.flat(0x1a1a1a), o, [0, 0, 0], false);
  const pts = [];
  for (const a of axes) {
    const reach = Math.max(0, ...forces.map(f => f.v.reduce((s, c, i) => s + c * a.dir[i], 0) * scale));
    const back = Math.max(0, ...forces.map(f => -f.v.reduce((s, c, i) => s + c * a.dir[i], 0) * scale));
    const L = Math.max(1.2, reach + 0.7), Lb = Math.max(0.6, back + 0.35);
    pts.push(o.map((c, i) => c - a.dir[i] * Lb), o.map((c, i) => c + a.dir[i] * L));
    const side = a.side ?? [0, 0, 0];
    stage.label(`<i>${a.name}</i>`, o.map((c, i) => c + a.dir[i] * (L + 0.2) + side[i]), 'axis', { dy: 0 });
  }
  stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0x7a8795 })));
  if (title) stage.label(title, titleAt ?? o, 'station', { dy: 0 });
  const items = [];
  const api = {
    origin: o,
    // value: text after the name, e.g. "49.0 N" (as in the department's earlier labs).
    // unknown: an asked-for force is grey, of fixed length and named "= ?" until reveal() (no answer before the check).
    force(vec, html, { radius = 0.045, priority = 2, value = null, unknown = false } = {}) {
      const arrow = vecArrow(stage, unknown ? GREY : color, { radius });
      const lab = stage.label('', o, 'qty', { dy: 0, priority });
      const name = q => `${tex(html)} <span class="val">${q ? '= ?' : value ?? ''}</span>`;
      let hidden = unknown, last = vec;
      const it = {
        arrow, lab,
        set(v, { at = o, labelGap = 0.3, minR = 0.8 } = {}) {
          last = v;
          const n = Math.hypot(...v), L = n < 1e-9 ? 0 : hidden ? UNKNOWN_LENGTH : n * scale;
          arrow.update(at, v, L);
          lab.node.dataset.off = L > 0.02 ? '' : '1';
          if (n > 1e-9) lab.move(at.map((c, i) => c + v[i] / n * Math.max(L + labelGap, minR)));
        },
        reveal() { hidden = false; arrow.mat.color.setHex(color); lab.set(name(false)); it.set(last); },
      };
      lab.set(name(unknown));
      it.set(vec);
      items.push(it);
      return it;
    },
    items,
    reveal() { for (const it of items) it.reveal(); },
  };
  for (const f of forces) api.force(f.v, f.html, { value: f.value, unknown: f.unknown });
  return api;
}
