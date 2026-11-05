// Energy bar board standing in the 3D scene (energy bar charts from Chapter 8 on).
// Bars are filled areas, so they use the fill-only colours of 05_디자인_기준.md §색 with a 1 px black outline and a
// text name under each bar (never colour alone). A bar with fill: null is drawn as an outline only (a total).
// set(values) moves every bar; values outside the range are clipped to the panel and marked with a value tag.
import { fmt } from './format.js';

export const BAR = { K: 0x56b4e9, U: 0xe69f00, Eth: 0xf0e442 };

export function barBoard(stage, { parent = stage.group, origin = [0, 0, 0], width = 4, height = 3.6, bars = [], range = [0, 1], unit = 'J', title = '' } = {}) {
  const { THREE } = stage;
  const group = new THREE.Group(); parent.add(group);
  const [ox, oy, oz] = origin, depth = 0.14;
  const r = 0.22, s = new THREE.Shape();
  s.moveTo(ox + r, oy); s.lineTo(ox + width - r, oy); s.quadraticCurveTo(ox + width, oy, ox + width, oy + r);
  s.lineTo(ox + width, oy + height - r); s.quadraticCurveTo(ox + width, oy + height, ox + width - r, oy + height);
  s.lineTo(ox + r, oy + height); s.quadraticCurveTo(ox, oy + height, ox, oy + height - r); s.lineTo(ox, oy + r);
  s.quadraticCurveTo(ox, oy, ox + r, oy);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.03, bevelThickness: 0.03 });
  const panel = stage.mesh(group, geo, [stage.flat(0xf7f9fb), stage.lit(0x8c9ca9, 0.6, 0.32)], [0, 0, oz]);
  panel.castShadow = false;
  const Z = oz + depth + 0.03;
  const B = 0.7, T = 0.62, pad = 0.35;                        // bottom margin for names, top margin for the title
  const [v0, v1] = range, ph = height - B - T;
  const Y = v => oy + B + (Math.min(v1, Math.max(v0, v)) - v0) / (v1 - v0) * ph;
  const n = Math.max(bars.length, 1), slot = (width - 2 * pad) / n, bw = slot * 0.56;
  // Zero line (or the bottom when the range starts above 0).
  const y0 = Y(Math.max(v0, Math.min(v1, 0)));
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(ox + pad * 0.6, y0, Z + 0.004), new THREE.Vector3(ox + width - pad * 0.6, y0, Z + 0.004)]), new THREE.LineBasicMaterial({ color: 0x40546a })));
  if (title) stage.label(title, [ox + width / 2, oy + height - 0.28, Z], 'gtitle', { dy: 0, priority: 3 });
  const unitBox = new THREE.BoxGeometry(1, 1, 0.04), edges = new THREE.EdgesGeometry(unitBox);
  const items = bars.map((b, i) => {
    const cx = ox + pad + slot * (i + 0.5);
    const fillMesh = b.fill === null ? null : stage.mesh(group, unitBox, stage.flat(b.fill ?? 0xcccccc, { transparent: true, opacity: 0.85 }), [cx, y0, Z + 0.02], [0, 0, 0], false);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
    group.add(line);
    stage.label(b.label, [cx, oy + B * 0.45, Z], 'gtick', { dy: 0, priority: 2 });
    const tag = stage.label('', [cx, y0, Z], 'gtick', { dy: -12, priority: 3 });
    return { cx, fillMesh, line, tag, unit: b.unit ?? unit };
  });
  function set(values) {
    values.forEach((v, i) => {
      const it = items[i]; if (!it) return;
      const top = Y(v), h = Math.max(Math.abs(top - y0), 1e-4), cy = (top + y0) / 2;
      for (const m of [it.fillMesh, it.line]) if (m) { m.scale.set(bw, h, 1); m.position.set(it.cx, cy, Z + 0.02); }
      if (it.fillMesh) it.fillMesh.visible = Math.abs(top - y0) > 1e-4;
      it.tag.set(`${fmt(v, { zero: 1e-9 })} ${it.unit}`);
      it.tag.move([it.cx, v >= 0 ? top : top, Z]); it.tag.dy = v >= 0 ? -12 : 12;
    });
  }
  return { group, set, Y, Z };
}
