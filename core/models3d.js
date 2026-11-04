// Shared 3D models built from three.js primitives (no external image or model files).
// Each builder returns a THREE.Group with its reference point at the origin and its bottom on y = 0.
// The 1-1 reference objects (sims/ch01/1-1-measurement/objects3d.js) move here after the Codex 1-1 branch is merged.

// Car facing +x, reference point at the middle of the car (the particle position), length in world units.
export function car(stage, { length = 1.6, color = 0xdfe5ea } = {}) {
  const { THREE } = stage;
  const g = new THREE.Group();
  const body = stage.lit(color, 0.55, 0.32), glass = stage.lit(0x24323f, 0.3, 0.15);
  const tire = stage.lit(0x1e2226, 0, 0.85), hub = stage.lit(0xb8c2cb, 0.8, 0.3);
  const side = (pts, depth, mat) => {
    const s = new THREE.Shape(); s.moveTo(...pts[0]); for (const p of pts.slice(1)) s.lineTo(...p); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 });
    geo.translate(0, 0, -depth / 2);
    return stage.mesh(g, geo, mat);
  };
  // Side profile in units of the car length, x from -0.5 (rear) to 0.5 (front).
  side([[-0.5, 0.09], [0.5, 0.09], [0.5, 0.2], [0.44, 0.255], [0.2, 0.28], [0.09, 0.42], [-0.22, 0.43], [-0.37, 0.29], [-0.5, 0.27]], 0.4, body);
  side([[-0.335, 0.295], [0.165, 0.29], [0.075, 0.405], [-0.21, 0.413]], 0.414, glass);
  // Repeated parts as instances: one draw call per part type (05 기준 draw call 100 이하).
  const many = (geo, mat, spots, rot = [0, 0, 0]) => {
    const m = new THREE.InstancedMesh(geo, mat, spots.length), M = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), one = new THREE.Vector3(1, 1, 1);
    spots.forEach((pos, i) => m.setMatrixAt(i, M.compose(new THREE.Vector3(...pos), q, one)));
    m.castShadow = m.receiveShadow = true; g.add(m); return m;
  };
  const wheels = [[-0.31, 0.095, -0.185], [-0.31, 0.095, 0.185], [0.3, 0.095, -0.185], [0.3, 0.095, 0.185]];
  many(new THREE.CylinderGeometry(0.095, 0.095, 0.07, 28), tire, wheels, [Math.PI / 2, 0, 0]);
  many(new THREE.CylinderGeometry(0.05, 0.05, 0.074, 20), hub, wheels, [Math.PI / 2, 0, 0]);
  many(new THREE.BoxGeometry(0.012, 0.035, 0.07), stage.lit(0xfff3d6, 0.1, 0.3), [[0.503, 0.2, -0.13], [0.503, 0.2, 0.13]]);
  many(new THREE.BoxGeometry(0.012, 0.035, 0.07), stage.lit(0xa8323a, 0.1, 0.4), [[-0.503, 0.22, -0.13], [-0.503, 0.22, 0.13]]);
  g.scale.setScalar(length);
  return g;
}
