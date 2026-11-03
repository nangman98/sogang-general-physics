// Shared 3D stage. Scene look (lighting, studio reflections, rounded measuring board, fixed-size HTML labels,
// compass, camera limits, arrow-key orbit) is ported from the Codex preview 93_Codex/3D_시안/3d_quality.html.
// World units: 1 three.js unit = 1 m, right-handed, y up (06_3D_무대_기준.md).
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

export { THREE };

export function createStage(root, { background = 0xeef1f5, fov = 36 } = {}) {
  const canvas = root.querySelector('canvas.scene');
  const labelLayer = root.querySelector('.world-labels');
  const compassCanvas = root.querySelector('canvas.compass');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(background);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 2000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minPolarAngle = 0.16;
  controls.maxPolarAngle = Math.PI / 2 - 0.09;

  scene.add(new THREE.HemisphereLight(0xe5eeff, 0xa9a498, 1.15));
  const lamp = new THREE.DirectionalLight(0xfff5e9, 2.7);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(2048, 2048);
  lamp.shadow.bias = -0.00015;
  lamp.shadow.normalBias = 0.02;
  scene.add(lamp, lamp.target);
  const fill = new THREE.DirectionalLight(0xd7e7ff, 0.85);
  scene.add(fill);

  // Soft studio reflections (four white panels rendered into a PMREM environment).
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0xa7b3c2);
  for (const [x, y, z, w, h, rx, ry] of [[0, 9, 0, 16, 12, Math.PI / 2, 0], [-9, 3, 0, 18, 9, 0, Math.PI / 2], [8, 4, -7, 13, 9, 0, -Math.PI / 4], [0, 4, 10, 14, 7, 0, Math.PI]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    panel.position.set(x, y, z); panel.rotation.set(rx, ry, 0); studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio, 0.07).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  let group = new THREE.Group();
  scene.add(group);
  let labels = [];
  let span = 20;
  let home = null;
  const frameCallbacks = [];

  const v3 = a => new THREE.Vector3(...a);

  // ---------- builders ----------
  const lit = (color, metalness = 0, roughness = 0.55) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
  // Quantity arrows and field lines keep their exact colour: unlit and not tone mapped.
  const flat = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...opts });

  function mesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], shadow = true) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(...position); m.rotation.set(...rotation);
    m.castShadow = shadow; m.receiveShadow = shadow;
    parent.add(m); return m;
  }
  function line(points, color, { dashed = false, opacity = 1, parent = group, dash = 0.5, gap = 0.32 } = {}) {
    const mat = dashed
      ? new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap, transparent: opacity < 1, opacity })
      : new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(v3)), mat);
    if (dashed) l.computeLineDistances();
    parent.add(l); return l;
  }
  // Arrow with cylinder shaft and cone head. Unit +y geometry scaled by update().
  function arrow(color, { radius = 0.06, headRatio = 0.25, headWidth = 2.6, parent = group, lit: useLit = false } = {}) {
    const item = new THREE.Group();
    const mat = useLit ? lit(color, 0.12, 0.35) : flat(color);
    const shaft = mesh(item, new THREE.CylinderGeometry(1, 1, 1, 14), mat, [0, 0.5, 0], [0, 0, 0], false);
    const head = mesh(item, new THREE.ConeGeometry(1, 1, 18), mat, [0, 0, 0], [0, 0, 0], false);
    const up = new THREE.Vector3(0, 1, 0);
    item.update = (origin, vec, length) => {
      const dir = v3(vec); const n = dir.length();
      if (!(length > 1e-9) || n < 1e-12) { item.visible = false; return; }
      item.visible = true;
      const h = Math.min(length * headRatio, Math.max(radius * 5, length * 0.18));
      const s = Math.max(length - h, 1e-6);
      shaft.scale.set(radius, s, radius); shaft.position.set(0, s / 2, 0);
      head.scale.set(radius * headWidth, h, radius * headWidth); head.position.set(0, s + h / 2, 0);
      item.quaternion.setFromUnitVectors(up, dir.normalize());
      item.position.set(...origin);
    };
    parent.add(item); return item;
  }
  function ball(position, radius, color, parent = group) {
    return mesh(parent, new THREE.SphereGeometry(radius, 48, 32), lit(color, 0.32, 0.22), position);
  }
  function ring(parent, position, radius, color, tube = 0.035, rotation = [Math.PI / 2, 0, 0]) {
    return mesh(parent, new THREE.TorusGeometry(radius, tube, 10, 80), lit(color, 0.4, 0.3), position, rotation);
  }
  // Rounded measuring board whose top face is at y = top. Covers x in [x0, x1], z in [-width/2, width/2].
  function board(parent, x0, x1, width, top = 0, { thickness = 0.65, rails = true } = {}) {
    const a = x0, b = x1, w = width / 2, r = Math.min(0.7, w * 0.3), shape = new THREE.Shape();
    shape.moveTo(a + r, -w); shape.lineTo(b - r, -w); shape.quadraticCurveTo(b, -w, b, -w + r); shape.lineTo(b, w - r);
    shape.quadraticCurveTo(b, w, b - r, w); shape.lineTo(a + r, w); shape.quadraticCurveTo(a, w, a, w - r); shape.lineTo(a, -w + r);
    shape.quadraticCurveTo(a, -w, a + r, -w);
    const bevel = Math.min(0.1, thickness * 0.15);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: bevel, bevelThickness: bevel });
    // Rotate so the extrusion runs along -y; top face then sits at y = top.
    const m = mesh(parent, geo, [lit(0x304756, 0.2, 0.52), lit(0x1b2e3d, 0.45, 0.4)], [0, top - bevel, 0], [Math.PI / 2, 0, 0]);
    m.castShadow = false;
    if (rails) for (const z of [-w + 0.2, w - 0.2]) mesh(parent, new THREE.BoxGeometry(b - a + 0.2, 0.08, 0.07), lit(0x8c9ca9, 0.65, 0.3), [(a + b) / 2, top + 0.04, z]);
    return m;
  }
  function floorPlane(y, color = 0xeef1f5) {
    const m = mesh(group, new THREE.PlaneGeometry(2000, 2000), lit(color, 0, 1), [0, y, 0], [-Math.PI / 2, 0, 0]);
    m.castShadow = false; return m;
  }

  // ---------- fixed-size HTML labels ----------
  function label(html, position, kind = 'tag', { dy = null, priority = 0 } = {}) {
    const node = document.createElement('span');
    node.className = 'world-label ' + kind;
    node.innerHTML = html;
    labelLayer.append(node);
    const item = { node, position: v3(position), kind, dy, priority };
    labels.push(item);
    item.set = (h) => { node.innerHTML = h; };
    item.move = (p) => { item.position.set(...p); };
    return item;
  }
  function updateLabels() {
    camera.updateMatrixWorld();
    const w = root.clientWidth, h = root.clientHeight, measures = [];
    for (const item of labels) {
      const p = item.position.clone().project(camera);
      const x = (p.x * 0.5 + 0.5) * w, y = (-p.y * 0.5 + 0.5) * h;
      const visible = item.node.dataset.off !== '1' && p.z > -1 && p.z < 1 && x > 18 && x < w - 18 && y > 60 && y < h - 44;
      item.node.hidden = !visible;
      if (!visible) continue;
      const dy = item.dy ?? (item.kind === 'apex' ? -35 : item.kind === 'measure' ? 8 : -8);
      item.node.style.left = x + 'px'; item.node.style.top = (y + dy) + 'px';
      if (item.kind === 'measure') measures.push({ item, x });
    }
    // Skip tick labels closer than 49 px instead of shrinking them (Codex 05 기준).
    measures.sort((a, b) => a.x - b.x);
    let prev = -1e9;
    for (const { item, x } of measures) { if (x - prev < 49) item.node.hidden = true; else prev = x; }
    // Other labels never overlap: keep the higher-priority one (apex > tag > station/axis), hide the rest.
    const rank = { apex: 3, tag: 2, station: 1, axis: 1 };
    const kept = [];
    const shown = labels.filter(it => !it.node.hidden && it.kind !== 'measure')
      .sort((a, b) => (b.priority + (rank[b.kind] ?? 0)) - (a.priority + (rank[a.kind] ?? 0)));
    for (const it of shown) {
      const r = it.node.getBoundingClientRect();
      if (kept.some(k => r.left < k.right + 2 && r.right > k.left - 2 && r.top < k.bottom + 2 && r.bottom > k.top - 2)) it.node.hidden = true;
      else kept.push(r);
    }
  }

  // ---------- camera ----------
  function setHome({ target, direction, distance, minDistance, maxDistance }) {
    home = { target: v3(target), direction: v3(direction).normalize(), distance, minDistance, maxDistance };
    span = distance;
    resetCamera();
  }
  function resetCamera() {
    if (!home) return;
    const aspect = root.clientWidth / Math.max(root.clientHeight, 1);
    const d = home.distance * (aspect < 1 ? 1.65 : 1);
    controls.target.copy(home.target);
    camera.position.copy(home.target).addScaledVector(home.direction, d);
    camera.up.set(0, 1, 0); camera.lookAt(home.target);
    controls.minDistance = home.minDistance ?? d * 0.5;
    controls.maxDistance = home.maxDistance ?? d * 3;
    controls.update();
    const s = home.distance;
    lamp.position.copy(home.target).add(v3([-s * 0.35, s * 0.85, s * 0.4]));
    lamp.target.position.copy(home.target);
    fill.position.copy(home.target).add(v3([s * 0.7, s * 0.35, -s * 0.7]));
    Object.assign(lamp.shadow.camera, { left: -s * 0.7, right: s * 0.7, top: s * 0.7, bottom: -s * 0.7, near: 0.1, far: s * 4 });
    lamp.shadow.camera.updateProjectionMatrix();
    updateLabels();
  }
  function orbitBy(dTheta, dPhi) {
    const offset = camera.position.clone().sub(controls.target);
    const s = new THREE.Spherical().setFromVector3(offset);
    s.theta += dTheta;
    s.phi = THREE.MathUtils.clamp(s.phi + dPhi, controls.minPolarAngle, controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));
    controls.update();
  }
  function zoomBy(f) {
    const offset = camera.position.clone().sub(controls.target);
    const len = THREE.MathUtils.clamp(offset.length() * f, controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset.setLength(len));
    controls.update();
  }
  canvas.addEventListener('keydown', e => {
    const dirs = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
    if (dirs[e.key]) { e.preventDefault(); orbitBy(...dirs[e.key]); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(0.9); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(1 / 0.9); }
    else if (e.key === 'Home') { e.preventDefault(); resetCamera(); }
  });

  // ---------- compass ----------
  const compass = compassCanvas.getContext('2d');
  function drawCompass() {
    compass.clearRect(0, 0, 152, 152);
    compass.font = 'italic 600 22px "Times New Roman", serif'; compass.textAlign = 'center'; compass.textBaseline = 'middle';
    const inv = camera.quaternion.clone().invert();
    const axes = [['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]].map(([n, d]) => ({ n, v: v3(d).applyQuaternion(inv) })).sort((a, b) => a.v.z - b.v.z);
    for (const { n, v } of axes) {
      const x = 76 + v.x * 42, y = 76 - v.y * 42;
      compass.strokeStyle = '#7a8795'; compass.lineWidth = 2; compass.beginPath(); compass.moveTo(76, 76); compass.lineTo(x, y); compass.stroke();
      compass.fillStyle = '#ffffff'; compass.beginPath(); compass.arc(x, y, 15, 0, Math.PI * 2); compass.fill();
      compass.strokeStyle = '#c6d0db'; compass.stroke(); compass.fillStyle = '#33475b'; compass.fillText(n, x, y + 1);
    }
  }

  // ---------- lifecycle ----------
  function resize() {
    const r = root.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(r.height, 1);
    camera.updateProjectionMatrix();
  }
  let narrow = null;
  new ResizeObserver(() => {
    resize();
    const now = root.clientWidth < 500;
    if (narrow !== null && narrow !== now) resetCamera();
    narrow = now; updateLabels();
  }).observe(root);
  controls.addEventListener('change', updateLabels);

  function clear() {
    const geos = new Set(), mats = new Set(), maps = new Set();
    group.traverse(o => {
      if (o.geometry) geos.add(o.geometry);
      if (o.material) for (const m of [].concat(o.material)) { mats.add(m); if (m.map) maps.add(m.map); }
    });
    geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); maps.forEach(t => t.dispose());
    scene.remove(group); group = new THREE.Group(); scene.add(group);
    labels = []; labelLayer.replaceChildren();
  }

  let last = 0;
  renderer.setAnimationLoop(now => {
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    for (const cb of frameCallbacks) cb(dt);
    controls.update();
    renderer.render(scene, camera);
    drawCompass();
    updateLabels();
  });
  resize();

  return {
    THREE, renderer, scene, camera, controls,
    get group() { return group; },
    v3, lit, flat, mesh, line, arrow, ball, ring, board, floorPlane, label,
    setHome, resetCamera, orbitBy, zoomBy, clear, resize,
    onFrame: cb => frameCallbacks.push(cb),
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
  };
}
