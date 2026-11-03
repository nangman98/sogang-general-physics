// 1-1 Powers of ten — 3D view. A logarithmic scale lies along x on the measuring board (1 m per factor of 10).
import { fmt } from '../../../core/format.js';
import * as M from './model.js';

export function view(stage) {
  const { THREE, v3 } = stage;
  let cur = null;

  return {
    build(p) {
      const q = M.QUANTITIES[p.quantity];
      const x0 = q.min - 1.5, x1 = q.max + 1.5, width = 8, half = width / 2;
      const root = stage.group;
      stage.board(root, x0, x1, width, 0);
      stage.floorPlane(-1.45);

      for (let n = q.min; n <= q.max; n++) {
        stage.line([[n, 0.012, -half + 0.4], [n, 0.012, half - 0.4]], 0xc2d5e2, { opacity: n % 3 === 0 ? 0.55 : 0.22 });
        stage.label(M.pow10(n), [n, 0.1, half - 0.25], 'measure');
      }
      // SI prefix names on the far edge, at every multiple of 3 of the prefix base unit.
      for (const [e, , sym] of M.PREFIXES) {
        if (e % 3 !== 0 && e !== 0) continue;
        const n = e - q.prefixShift;
        if (n < q.min || n > q.max) continue;
        stage.label(`${sym}${q.prefixBase}`, [n, 0.2, -half + 0.5], 'station');
      }
      if (q.prefixShift) stage.label(`g`, [-q.prefixShift, 0.2, -half + 0.5], 'station');

      // Reference objects as pillars. Heights alternate so neighbouring labels separate.
      q.refs.forEach((r, i) => {
        const x = Math.log10(r.value), h = [1.1, 2.0, 2.9][i % 3];
        stage.mesh(root, new THREE.CylinderGeometry(0.07, 0.09, h, 18), stage.lit(0x8c9ca9, 0.55, 0.3), [x, h / 2, 0]);
        stage.ball([x, h, 0], 0.2, 0xE69F00);
        stage.label(`${r.name}<br><span style="font-weight:500">${fmt(r.value, { sci: true })} ${q.unit}</span>`, [x, h + 0.25, 0], 'tag', { dy: -26 });
      });

      // Cursor at 10^n.
      const cursor = new THREE.Group(); root.add(cursor);
      const pane = stage.mesh(cursor, new THREE.PlaneGeometry(width * 0.9, 3.6), stage.flat(0x202e3d, { transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }), [0, 1.8, 0], [0, Math.PI / 2, 0], false);
      pane.renderOrder = 2;
      stage.mesh(cursor, new THREE.BoxGeometry(0.07, 0.03, width * 0.9), stage.flat(0x202e3d), [0, 0.02, 0], [0, 0, 0], false);
      const tag = stage.label('', [p.n, 3.7, 0], 'apex', { dy: -18 });

      cur = { cursor, tag, n: null };
      stage.setHome({ target: [p.n, 1.1, 0], direction: [-0.08, 0.5, 1], distance: 17, minDistance: 7, maxDistance: 60 });
      return { legend: [{ label: 'Reference objects', color: '#E69F00' }] };
    },

    render(o) {
      if (!cur) return;
      cur.cursor.position.x = o.n;
      cur.tag.move([o.n, 3.7, 0]);
      cur.tag.set(o.sci);
      // Travel along the scale: shift camera and target by the change in n.
      if (cur.n !== null && cur.n !== o.n) {
        const d = o.n - cur.n;
        stage.controls.target.x += d; stage.camera.position.x += d; stage.controls.update();
      }
      cur.n = o.n;
    },
  };
}
