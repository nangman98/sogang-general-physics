// 3-2 objects built from three.js primitives (no image or model files). Core candidate for core/models3d.js.
// Right hand for the right-hand rule (textbook Fig. 3.3.2). Local frame: +X points along a (the fingers start there),
// the fingers curl toward −Z, which is the direction of b's part perpendicular to a, and the thumb points along +Y.
// orient(e1, e3) puts +X on e1 (unit a) and +Y on e3 (unit c = a × b). pose(curl) bends the fingers, 0 open, 1 closed
// around the line through the origin along the thumb.
export function rightHand(stage, { size = 1 } = {}) {
  const { THREE } = stage;
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const skin = stage.lit(0xf1c6a0, 0, 0.62), sleeve = stage.lit(0x56687a, 0.2, 0.55);
  const R = 0.21;                                   // radius of the curl around the thumb line
  const r = 0.066;                                  // finger radius
  // Palm: rounded slab behind the knuckles (−X side), lying in the plane z = R.
  const s = new THREE.Shape(), w = 0.66, h = 0.74, c = 0.12;
  s.moveTo(-w + c, -h / 2); s.lineTo(-c, -h / 2); s.quadraticCurveTo(0, -h / 2, 0, -h / 2 + c); s.lineTo(0, h / 2 - c);
  s.quadraticCurveTo(0, h / 2, -c, h / 2); s.lineTo(-w + c, h / 2); s.quadraticCurveTo(-w, h / 2, -w, h / 2 - c); s.lineTo(-w, -h / 2 + c);
  s.quadraticCurveTo(-w, -h / 2, -w + c, -h / 2);
  const palmGeo = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 });
  palmGeo.translate(0.02, -0.05, R - 0.08);
  stage.mesh(inner, palmGeo, skin);
  // Wrist and cuff.
  stage.mesh(inner, new THREE.CylinderGeometry(0.2, 0.22, 0.34, 28), skin, [-0.82, -0.06, R], [0, 0, Math.PI / 2]);
  stage.mesh(inner, new THREE.CylinderGeometry(0.25, 0.25, 0.3, 28), sleeve, [-1.12, -0.06, R], [0, 0, Math.PI / 2]);

  // Fingers: 4 × 3 phalanges and 2 thumb phalanges as instanced cylinders, joints as instanced spheres (two draw calls).
  const fingers = [
    { y: 0.17, l: [0.27, 0.18, 0.15] }, { y: 0.01, l: [0.29, 0.2, 0.16] },
    { y: -0.15, l: [0.27, 0.18, 0.15] }, { y: -0.3, l: [0.21, 0.15, 0.13] },
  ];
  const bones = new THREE.InstancedMesh(new THREE.CylinderGeometry(r, r, 1, 14), skin, 14);
  const joints = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 14, 10), skin, 19);
  bones.castShadow = joints.castShadow = true;
  bones.frustumCulled = joints.frustumCulled = false;
  inner.add(bones, joints);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), Y = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  let nb = 0, nj = 0;
  const bone = (a, b) => {
    const d = new THREE.Vector3().subVectors(b, a), len = d.length();
    Q.setFromUnitVectors(UP, d.normalize());
    bones.setMatrixAt(nb++, M.compose(P.addVectors(a, b).multiplyScalar(0.5), Q, S.set(1, len, 1)));
  };
  const joint = (a, k = 1) => joints.setMatrixAt(nj++, M.compose(a, Q.identity(), S.set(k, k, k)));
  // Thumb along +Y from the top of the palm, close to the curl line.
  // The thumb runs beside the curl line (toward the palm), so the arrow of c along that line stays visible.
  const thumb = [new THREE.Vector3(-0.22, 0.2, R + 0.02), new THREE.Vector3(-0.12, 0.52, 0.24), new THREE.Vector3(-0.08, 0.9, 0.2)];
  function pose(curl) {
    nb = 0; nj = 0;
    for (const f of fingers) {
      // At curl = 1 the joints lie on a circle of radius R about the thumb line (chord angles θ = 2 asin(l / 2R)).
      const th = f.l.map(l => 2 * Math.asin(Math.min(1, l / (2 * R))));
      let p = new THREE.Vector3(0, f.y, R), d = new THREE.Vector3(1, 0, 0).applyAxisAngle(Y, curl * th[0] / 2);
      joint(p, 1.12);
      for (let j = 0; j < 3; j++) {
        const q = p.clone().addScaledVector(d, f.l[j]);
        bone(p, q); joint(q, j === 2 ? 0.96 : 1.04);
        if (j < 2) d.applyAxisAngle(Y, curl * (th[j] + th[j + 1]) / 2);
        p = q;
      }
    }
    bone(thumb[0], thumb[1]); bone(thumb[1], thumb[2]);
    joint(thumb[0], 1.3); joint(thumb[1], 1.12); joint(thumb[2], 1.08);
    bones.instanceMatrix.needsUpdate = true; joints.instanceMatrix.needsUpdate = true;
  }
  // Basis: local X → e1, local Y → e3, local Z → e1 × e3 (right-handed).
  function orient(e1, e3) {
    const x = new THREE.Vector3(...e1).normalize(), y = new THREE.Vector3(...e3).normalize(), z = new THREE.Vector3().crossVectors(x, y);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  }
  g.scale.setScalar(size);
  pose(1);
  return Object.assign(g, { pose, orient });
}
