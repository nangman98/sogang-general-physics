// 4.4 Projectile Motion — 3D view. Scene layout ported from the approved Codex preview.
// Changes: board top face at y = 0 (the launch height), so the dashed height line equals y;
// ball and marker trim use slate instead of the velocity colour; Korean labels with textbook English terms.
import { fmt } from '../../../core/format.js';
import * as M from './model.js';

export function view(stage) {
  const { THREE, v3 } = stage;
  let cur = null;

  return {
    build(p) {
      const T = M.duration(p), R = M.range(p), H = M.maxHeight(p);
      const phi = p.phi * Math.PI / 180;
      const root = stage.group;
      const rig = new THREE.Group(); rig.rotation.y = phi; root.add(rig);
      const width = Math.max(9, R * 0.28), half = width / 2;
      const toWorld = a => v3(a).applyEuler(rig.rotation).toArray();

      stage.board(rig, -4, R + 4, width, 0);
      stage.floorPlane(-1.45);
      for (const x of [1, R - 1]) for (const z of [-half + 1, half - 1]) stage.mesh(rig, new THREE.CylinderGeometry(0.45, 0.55, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);

      for (let s = 0; s <= R + 1; s += 2) stage.line([[s, 0.012, -half + 0.4], [s, 0.012, half - 0.4]], 0xc2d5e2, { parent: rig, opacity: s % 10 === 0 ? 0.55 : 0.2 });
      for (const z of [-width * 0.25, 0, width * 0.25]) stage.line([[-2, 0.012, z], [R + 2, 0.012, z]], 0xc2d5e2, { parent: rig, opacity: 0.2 });
      for (let s = 0; s <= R; s += 5) {
        stage.line([[s, 0.014, half - 0.6], [s, 0.014, half - 1]], 0xd8e5ee, { parent: rig });
        stage.label(`${s} m`, toWorld([s, 0.1, half - 0.2]), 'measure');
      }
      stage.line([[0, 0.016, 0], [R, 0.016, 0]], 0x9aa9b5, { parent: rig, dashed: true, opacity: 0.6 });

      for (const x of [0, R]) {
        stage.mesh(rig, new THREE.CylinderGeometry(1.25, 1.25, 0.06, 80), stage.lit(0xf8fafc, 0.3, 0.35), [x, 0.0, 0]);
        stage.ring(rig, [x, 0.035, 0], 1.08, 0x8e9fab, 0.022);
        stage.ring(rig, [x, 0.035, 0], 0.72, 0x8e9fab, 0.02);
      }
      // Launcher cup aligned with the launch direction, below and behind the ball.
      const dir = v3([Math.cos(p.theta0 * Math.PI / 180), Math.sin(p.theta0 * Math.PI / 180), 0]);
      const cup = stage.mesh(rig, new THREE.CylinderGeometry(0.56, 0.64, 0.36, 64), stage.lit(0x455768, 0.55, 0.3), [0, 0, 0]);
      cup.quaternion.setFromUnitVectors(v3([0, 1, 0]), dir);
      cup.position.copy(dir.clone().multiplyScalar(-0.42));
      for (const z of [-0.85, 0.85]) {
        stage.mesh(rig, new THREE.BoxGeometry(0.22, 0.7, 0.2), stage.lit(0x536779, 0.55, 0.32), [-0.3, 0.35, z]);
        stage.mesh(rig, new THREE.CylinderGeometry(0.11, 0.11, 0.1, 24), stage.lit(0x8c9ca9, 0.5, 0.3), [-0.3, 0.5, z], [Math.PI / 2, 0, 0]);
      }
      stage.label('발사점 (launch point)', toWorld([0, 0.2, -half + 0.6]), 'station');
      stage.label('도달점', toWorld([R, 0.2, -half + 0.6]), 'station');

      const pts = Array.from({ length: 181 }, (_, i) => M.at(T * i / 180, p).position_m);
      const path = stage.mesh(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v3)), 180, 0.08, 10, false), stage.lit(0x6c8194, 0.12, 0.5));
      path.castShadow = false;

      const moving = new THREE.Group(); root.add(moving);
      stage.ball([0, 0, 0], 0.5, 0xf4f8fc, moving);
      for (const r of [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]]) stage.ring(moving, [0, 0, 0], 0.505, 0x40546a, 0.016, r);
      const drop = stage.line([[0, 0, 0], [0, 0.02, 0]], 0x7d94a8, { dashed: true, dash: 0.4, gap: 0.28 });
      drop.frustumCulled = false;
      const marker = stage.ring(root, [0, 0.03, 0], 0.4, 0x40546a, 0.03);

      const apex = M.at(T / 2, p).position_m;
      stage.ring(root, apex, 0.16, 0x7c8e9e, 0.03, [0, 0, 0]);
      stage.label(`최고 높이 (maximum height) ${fmt(H)} m`, apex, 'apex');


      cur = { moving, drop, marker };
      const span = Math.max(R + 10, H * 2.1, 23);
      const target = [R * 0.46 * Math.cos(phi), H * 0.37, -R * 0.46 * Math.sin(phi)];
      const direction = v3([-0.23, 0.68, 1.15]).applyAxisAngle(v3([0, 1, 0]), phi).toArray();
      stage.setHome({ target, direction, distance: span * 0.98, minDistance: span * 0.55, maxDistance: span * 3 });
      return { legend: [{ label: '궤적 (trajectory)', color: '#6c8194' }] };
    },

    render(o) {
      if (!cur) return;
      const r = o.position_m;
      cur.moving.position.set(...r);
      cur.moving.rotation.set(o.t * 0.4, o.t * 0.7, o.t * 0.2);
      const pos = cur.drop.geometry.attributes.position;
      pos.setXYZ(0, ...r); pos.setXYZ(1, r[0], 0.02, r[2]); pos.needsUpdate = true;
      cur.drop.computeLineDistances();
      cur.drop.visible = r[1] > 0.6;
      cur.marker.position.set(r[0], 0.03, r[2]);
    },
  };
}
