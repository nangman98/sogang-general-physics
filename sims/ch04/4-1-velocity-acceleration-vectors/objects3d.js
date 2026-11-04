// Quadcopter drone built from three.js primitives (no external image or model files).
// Reference point is the middle of the body (the particle position). Front faces +x.
// Repeated parts are InstancedMesh so the drone costs few draw calls. core candidate (core/models3d.js).

export function drone(stage, { size = 2.4 } = {}) {
  const { THREE } = stage;
  const g = new THREE.Group();
  const shell = stage.lit(0xe8edf2, 0.35, 0.32), dark = stage.lit(0x26323f, 0.4, 0.45);
  const metal = stage.lit(0x8c9ca9, 0.7, 0.3), prop = stage.lit(0x3a4654, 0.1, 0.6);
  const many = (geo, mat, spots, rots = null) => {
    const m = new THREE.InstancedMesh(geo, mat, spots.length), M = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1);
    spots.forEach((pos, i) => m.setMatrixAt(i, M.compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rots ? rots[i] : [0, 0, 0]))), one)));
    m.castShadow = true; g.add(m); return m;
  };
  // Body: flattened capsule-like shell, dark belly, camera ball at the front.
  const body = stage.mesh(g, new THREE.SphereGeometry(0.2, 28, 16), shell, [0, 0, 0]);
  body.scale.set(1.25, 0.42, 0.8);
  stage.mesh(g, new THREE.BoxGeometry(0.28, 0.05, 0.18), dark, [0, -0.06, 0]);
  stage.mesh(g, new THREE.SphereGeometry(0.055, 16, 12), dark, [0.2, -0.07, 0]);
  // Two crossing arms, four motors, four two-blade propellers.
  const ends = [[0.3, 0.03, 0.3], [0.3, 0.03, -0.3], [-0.3, 0.03, 0.3], [-0.3, 0.03, -0.3]];
  many(new THREE.BoxGeometry(0.86, 0.035, 0.045), dark, [[0, 0.03, 0], [0, 0.03, 0]], [[0, Math.PI / 4, 0], [0, -Math.PI / 4, 0]]);
  many(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 18), metal, ends);
  const props = many(new THREE.BoxGeometry(0.34, 0.008, 0.035), prop, ends.map(([x, , z]) => [x, 0.08, z]));
  // Landing skids.
  many(new THREE.BoxGeometry(0.34, 0.018, 0.018), dark, [[0, -0.13, 0.1], [0, -0.13, -0.1]]);
  many(new THREE.BoxGeometry(0.018, 0.08, 0.018), dark, [[0.1, -0.09, 0.1], [-0.1, -0.09, 0.1], [0.1, -0.09, -0.1], [-0.1, -0.09, -0.1]]);
  g.scale.setScalar(size / 0.86);

  const M = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  // Propellers turn with time; neighbours turn the opposite way as on a real quadcopter.
  g.spin = angle => {
    ends.forEach(([x, , z], i) => {
      q.setFromAxisAngle(up, (i === 0 || i === 3 ? 1 : -1) * angle + i);
      props.setMatrixAt(i, M.compose(new THREE.Vector3(x, 0.08, z), q, one));
    });
    props.instanceMatrix.needsUpdate = true;
  };
  return g;
}
