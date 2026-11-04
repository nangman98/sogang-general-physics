// 3-1 objects built from three.js primitives (no image or model files). Core candidate for core/models3d.js.
// Quadcopter drone: reference point at the middle of the body (the particle position), rotors level.
export function drone(stage, { size = 1 } = {}) {
  const { THREE } = stage;
  const g = new THREE.Group();
  // Slate shell: a light grey drone disappears against the light glass board.
  const shell = stage.lit(0x4a5b6c, 0.45, 0.32), dark = stage.lit(0x2a3440, 0.35, 0.45), motor = stage.lit(0x56687a, 0.7, 0.3);
  const many = (geo, mat, list) => {
    const m = new THREE.InstancedMesh(geo, mat, list.length), M = new THREE.Matrix4();
    list.forEach(([pos, rot], i) => m.setMatrixAt(i, M.compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(1, 1, 1))));
    m.castShadow = true; g.add(m); return m;
  };
  // Body: a rounded shell with a dark camera under the front.
  const body = stage.mesh(g, new THREE.SphereGeometry(0.26, 32, 16), shell);
  body.scale.set(1, 0.42, 0.78);
  stage.mesh(g, new THREE.SphereGeometry(0.075, 20, 12), dark, [0.2, -0.07, 0]);
  // Two crossed arms, four motors, four rotor guards, four two-blade propellers.
  const R = 0.42, ends = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z]) => [x * R / Math.SQRT2, 0, z * R / Math.SQRT2]);
  many(new THREE.BoxGeometry(2 * R + 0.06, 0.045, 0.06), shell, [[[0, 0, 0], [0, Math.PI / 4, 0]], [[0, 0, 0], [0, -Math.PI / 4, 0]]]);
  many(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 18), motor, ends.map(p => [[p[0], 0.03, p[2]], [0, 0, 0]]));
  many(new THREE.TorusGeometry(0.2, 0.012, 8, 40), dark, ends.map(p => [[p[0], 0.07, p[2]], [Math.PI / 2, 0, 0]]));
  const blades = many(new THREE.BoxGeometry(0.36, 0.008, 0.035), dark, ends.map(p => [[p[0], 0.08, p[2]], [0, 0, 0]]));
  g.scale.setScalar(size);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  g.spin = angle => {
    ends.forEach((p, i) => blades.setMatrixAt(i, M.compose(new THREE.Vector3(p[0], 0.08, p[2]), Q.setFromAxisAngle(Y, (i % 2 ? -1 : 1) * angle + i), one)));
    blades.instanceMatrix.needsUpdate = true;
  };
  return g;
}
