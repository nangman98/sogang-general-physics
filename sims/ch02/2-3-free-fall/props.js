// Scene props for 2.5, built from three.js primitives (no external image or model files).
// person: adapted from the 1-1 person model (sims/ch01/1-1-measurement/objects3d.js), one arm raised toward +x.
// building: block with a parapet and one InstancedMesh of windows on the front face.
// equalImages: equal-time-interval images of the ball (plan part 7, kept in this folder, not in core).

// Standing person of height H with feet at y = 0, facing +x, right hand raised to about 0.84 H at x ≈ 0.42 H.
export function person(stage, H = 1.75, color = 0x8ea3b5) {
  const { THREE } = stage;
  const g = new THREE.Group(), m = stage.lit(color, 0.05, 0.6), u = H;
  const add = (geo, pos, rot = [0, 0, 0]) => stage.mesh(g, geo, m, pos, rot);
  for (const z of [-0.05, 0.05]) add(new THREE.CapsuleGeometry(0.035 * u, 0.4 * u, 6, 12), [0, 0.24 * u, z * u]);
  add(new THREE.CapsuleGeometry(0.085 * u, 0.24 * u, 8, 16), [0, 0.62 * u, 0]);
  add(new THREE.CapsuleGeometry(0.028 * u, 0.3 * u, 6, 12), [0, 0.6 * u, -0.12 * u], [-0.12, 0, 0]);            // left arm down
  add(new THREE.CapsuleGeometry(0.028 * u, 0.3 * u, 6, 12), [0.16 * u, 0.78 * u, 0.1 * u], [0, 0, -0.95]);       // right arm forward and up
  stage.mesh(g, new THREE.SphereGeometry(0.07 * u, 32, 20), m, [0, 0.92 * u, 0]);
  return g;
}

// Building occupying x in [x0, x1], z in [−d/2, d/2], from y = yb (ground) to y = yr (roof).
export function building(stage, { x0, x1, d, yb, yr }) {
  const { THREE } = stage;
  const g = new THREE.Group(), H = yr - yb, w = x1 - x0;
  stage.mesh(g, new THREE.BoxGeometry(w, H, d), stage.lit(0xc9d1d9, 0.05, 0.8), [(x0 + x1) / 2, yb + H / 2, 0]);
  // Parapet around the roof.
  const rim = stage.lit(0xaeb8c2, 0.1, 0.7);
  stage.mesh(g, new THREE.BoxGeometry(w, 0.5, 0.25), rim, [(x0 + x1) / 2, yr + 0.25, d / 2 - 0.125]);
  stage.mesh(g, new THREE.BoxGeometry(w, 0.5, 0.25), rim, [(x0 + x1) / 2, yr + 0.25, -d / 2 + 0.125]);
  stage.mesh(g, new THREE.BoxGeometry(0.25, 0.5, d), rim, [x0 + 0.125, yr + 0.25, 0]);
  // Windows: one row per 3 m storey, one column per 2 m, on the front face (+z).
  const spots = [];
  for (let y = yb + 1.4; y < yr - 1; y += 3) for (let x = x0 + 1.2; x < x1 - 0.8; x += 2) spots.push([x, y, d / 2 + 0.02]);
  const win = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 1.5, 0.04), stage.lit(0x3b4c5e, 0.4, 0.25), Math.max(1, spots.length));
  const M = new THREE.Matrix4();
  spots.forEach((p, i) => win.setMatrixAt(i, M.makeTranslation(...p)));
  win.count = spots.length; g.add(win);
  return g;
}

// Images left at equal time intervals. Ascent images are faint balls, descent images are rings (shape, not colour, tells them apart).
export function equalImages(stage, parent, radius, items) {
  const { THREE } = stage;
  const up = items.filter(it => it.up), down = items.filter(it => !it.up);
  const ballMat = stage.lit(0x8696a6, 0.2, 0.35);
  Object.assign(ballMat, { transparent: true, opacity: 0.42, depthWrite: false });
  const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 24, 16), ballMat, Math.max(1, up.length));
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(radius * 1.08, radius * 0.11, 10, 40), stage.lit(0x40546a, 0.3, 0.4), Math.max(1, down.length));
  const M = new THREE.Matrix4();
  up.forEach((it, i) => balls.setMatrixAt(i, M.makeTranslation(...it.pos)));
  down.forEach((it, i) => rings.setMatrixAt(i, M.makeTranslation(...it.pos)));
  for (const m of [balls, rings]) { m.castShadow = false; m.frustumCulled = false; parent.add(m); }
  return {
    update(t) {
      balls.count = up.filter(it => it.t <= t + 1e-9).length;
      rings.count = down.filter(it => it.t <= t + 1e-9).length;
    },
  };
}
