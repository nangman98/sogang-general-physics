// Small motorboat built from three.js primitives (no external image or model files).
// Reference point is the middle of the hull at the waterline (y = 0). The bow faces +x. core candidate.

export function boat(stage, { length = 3.6 } = {}) {
  const { THREE } = stage;
  const g = new THREE.Group();
  // Top-view outline in units of the length: square stern at −0.5, pointed bow at +0.5.
  const outline = (k = 1) => {
    const s = new THREE.Shape(), w = 0.19 * k;
    s.moveTo(-0.5 * k, -w); s.lineTo(0.18 * k, -w); s.quadraticCurveTo(0.42 * k, -w * 0.8, 0.5 * k, 0);
    s.quadraticCurveTo(0.42 * k, w * 0.8, 0.18 * k, w); s.lineTo(-0.5 * k, w); s.closePath();
    return s;
  };
  // Extrude upward: shape x → x, shape y → z, extrusion → y (rotateX(−π/2) maps y to −z, so flip back).
  const slab = (shape, depth, mat, y0, bevel = 0.012) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2 });
    geo.rotateX(-Math.PI / 2);
    return stage.mesh(g, geo, mat, [0, y0, 0]);
  };
  slab(outline(1), 0.05, stage.lit(0x2b3846, 0.3, 0.5), -0.04);              // dark waterline stripe
  slab(outline(0.985), 0.16, stage.lit(0xf2f5f8, 0.25, 0.35), 0.01);          // white hull side
  slab(outline(0.9), 0.012, stage.lit(0xb9c4ce, 0.2, 0.6), 0.17, 0.004);       // deck
  stage.mesh(g, new THREE.BoxGeometry(0.2, 0.1, 0.2), stage.lit(0xdfe5ea, 0.3, 0.4), [-0.02, 0.23, 0]);     // console
  const glass = stage.mesh(g, new THREE.BoxGeometry(0.012, 0.09, 0.22), stage.lit(0x24323f, 0.3, 0.15), [0.085, 0.31, 0]);
  glass.rotation.z = -0.5;
  stage.mesh(g, new THREE.BoxGeometry(0.12, 0.05, 0.26), stage.lit(0x40546a, 0.2, 0.6), [-0.26, 0.21, 0]);  // rear seat
  stage.mesh(g, new THREE.BoxGeometry(0.07, 0.2, 0.09), stage.lit(0x26323f, 0.5, 0.4), [-0.53, 0.12, 0]);   // outboard motor
  stage.mesh(g, new THREE.BoxGeometry(0.1, 0.07, 0.11), stage.lit(0x26323f, 0.5, 0.4), [-0.53, 0.25, 0]);
  g.scale.setScalar(length);
  return g;
}
