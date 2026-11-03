// Procedural 3D models for the 1-1 reference objects (no external images or model files).
// Each builder returns a THREE.Group whose characteristic length (the value listed in model.js) is 1 world unit.
// Convention: the model sits on y >= 0, starts at x = 0, and is centred on z = 0. `depth` is its z extent.

function noise2(seed) {                       // small value-noise generator for canvas textures
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const G = 64, g = Array.from({ length: G * G }, rnd);
  const at = (x, y) => g[((y % G + G) % G) * G + ((x % G + G) % G)];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function canvasTexture(THREE, w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function fbmTexture(THREE, seed, colorAt) {
  return canvasTexture(THREE, 512, 256, (ctx, w, h) => {
    const n = noise2(seed), img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 0, amp = 0.5, f = 1 / 32;
      for (let o = 0; o < 5; o++) { v += amp * n(x * f, y * f); amp *= 0.5; f *= 2; }
      const [r, g, b] = colorAt(v, y / h, x / w);
      const i = (y * w + x) * 4; img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
}

export function createModels(stage) {
  const { THREE } = stage;
  const lit = stage.lit, flat = stage.flat;
  const add = (g, geo, mat, pos = [0, 0, 0], rot = [0, 0, 0]) => stage.mesh(g, geo, mat, pos, rot);
  const tube = (pts, r, mat, g, seg = 64) => add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, 10, false), mat);
  const points = (g, n, place, color, size) => {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
    for (let i = 0; i < n; i++) { const [x, y, z, k] = place(i); pos.set([x, y, z], i * 3); c.set(color(k)); col.set([c.r, c.g, c.b], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Points(geo, new THREE.PointsMaterial({ size, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false }));
    g.add(m); return m;
  };
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  const earthTex = fbmTexture(THREE, 11, (v, ty) => {
    const polar = Math.abs(ty - 0.5) > 0.42;
    if (polar) return [236, 242, 247];
    if (v > 0.56) return v > 0.66 ? [150, 128, 92] : [78, 130, 70];      // land
    const d = 40 + v * 60; return [22 + d * 0.2, 70 + d * 0.6, 140 + d];   // ocean
  });
  const cloudTex = fbmTexture(THREE, 23, v => (v > 0.58 ? [255, 255, 255] : [0, 0, 0]));
  const moonTex = fbmTexture(THREE, 31, v => { const k = 120 + v * 110; return [k, k, k * 0.98]; });
  const sunTex = fbmTexture(THREE, 41, v => [255, 150 + v * 90, 40 + v * 60]);

  const sphere = (g, r, mat, pos) => add(g, new THREE.SphereGeometry(r, 48, 32), mat, pos);
  const earth = (g, r, pos) => {
    sphere(g, r, new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.7 }), pos);
    sphere(g, r * 1.012, new THREE.MeshStandardMaterial({ alphaMap: cloudTex, color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false }), pos);
  };
  const moon = (g, r, pos) => sphere(g, r, new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.95 }), pos);
  const sun = (g, r, pos) => {
    sphere(g, r, new THREE.MeshBasicMaterial({ map: sunTex, toneMapped: false }), pos);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTexture(THREE, 128, 128, (ctx) => {
      const gr = ctx.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,80,0.9)'); gr.addColorStop(1, 'rgba(255,160,40,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, toneMapped: false }));
    glow.scale.setScalar(Math.max(r * 4, 0.02)); glow.position.set(...pos); g.add(glow);
  };
  const dot = (g, r, color, pos) => sphere(g, r, flat(color), pos);
  const dashed = (g, a, b, color = 0x7a8795) => stage.line([a, b], color, { parent: g, dashed: true, dash: 0.03, gap: 0.02 });
  const ring = (g, R, color = 0x9aa9b5, opacity = 0.8, c = [0, 0, 0]) => {
    const pts = Array.from({ length: 129 }, (_, i) => { const a = i / 128 * Math.PI * 2; return [c[0] + R * Math.cos(a), c[1], c[2] + R * Math.sin(a)]; });
    return stage.line(pts, color, { parent: g, opacity });
  };
  const galaxyDisk = (g, D, c, n = 3500, tilt = 0) => {
    const sub = new THREE.Group(); sub.position.set(...c); sub.rotation.x = tilt; g.add(sub);
    points(sub, n, i => {
      const arm = i % 2, t = rnd(), r = (0.05 + 0.95 * t) * D / 2, a = arm * Math.PI + t * 7 + (rnd() - 0.5) * 0.6;
      const core = i < n * 0.18, rr = core ? rnd() * D * 0.08 : r;
      return [rr * Math.cos(a), (rnd() - 0.5) * D * (core ? 0.04 : 0.012), rr * Math.sin(a), core ? 1 : t];
    }, k => (k === 1 ? '#ffe7b0' : k < 0.5 ? '#dfe8ff' : '#a9c4ff'), D * 0.006);
  };
  const person = (g, H = 1, color = 0x8ea3b5) => {
    const m = lit(color, 0.05, 0.6), u = H / 1.0;
    for (const z of [-0.05, 0.05]) add(g, new THREE.CapsuleGeometry(0.035 * u, 0.4 * u, 6, 12), m, [0.1 * u, 0.24 * u, z * u]);
    add(g, new THREE.CapsuleGeometry(0.085 * u, 0.24 * u, 8, 16), m, [0.1 * u, 0.62 * u, 0]);
    for (const z of [-0.12, 0.12]) add(g, new THREE.CapsuleGeometry(0.028 * u, 0.3 * u, 6, 12), m, [0.1 * u, 0.6 * u, z * u], [z > 0 ? 0.12 : -0.12, 0, 0]);
    sphere(g, 0.07 * u, m, [0.1 * u, 0.92 * u, 0]);
  };

  const builders = {
    proton(g) {
      sphere(g, 0.5, new THREE.MeshStandardMaterial({ color: 0xf2b8a0, transparent: true, opacity: 0.28, depthWrite: false }), [0.5, 0.5, 0]);
      [[0xd55e00, 0], [0x009e73, 2.1], [0x0072b2, 4.2]].forEach(([c, a]) => sphere(g, 0.12, lit(c, 0.1, 0.4), [0.5 + 0.2 * Math.cos(a), 0.5 + 0.2 * Math.sin(a), 0.05]));
      return 1;
    },
    hydrogen(g) {
      dot(g, 0.012, 0xd55e00, [0.5, 0.5, 0]);
      for (const [r, o] of [[0.5, 0.1], [0.36, 0.14], [0.22, 0.2]]) sphere(g, r, new THREE.MeshStandardMaterial({ color: 0x6fa8dc, transparent: true, opacity: o, depthWrite: false }), [0.5, 0.5, 0]);
      return 1;
    },
    dna(g) {
      const L = 5, pitch = 1.7, n = 240, A = [], B = [];
      for (let i = 0; i <= n; i++) { const x = L * i / n, a = x / pitch * Math.PI * 2; A.push([x, 0.5 + 0.45 * Math.cos(a), 0.45 * Math.sin(a)]); B.push([x, 0.5 + 0.45 * Math.cos(a + 2.2), 0.45 * Math.sin(a + 2.2)]); }
      tube(A, 0.06, lit(0x4f6d8a, 0.2, 0.4), g, 200); tube(B, 0.06, lit(0x4f6d8a, 0.2, 0.4), g, 200);
      const rung = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), lit(0xe69f00, 0.1, 0.5), 30), m = new THREE.Matrix4(), q = new THREE.Quaternion();
      for (let i = 0; i < 30; i++) {
        const x = (i + 0.5) / 30 * L, a = x / pitch * Math.PI * 2;
        const p1 = new THREE.Vector3(x, 0.5 + 0.45 * Math.cos(a), 0.45 * Math.sin(a)), p2 = new THREE.Vector3(x, 0.5 + 0.45 * Math.cos(a + 2.2), 0.45 * Math.sin(a + 2.2));
        const d = p2.clone().sub(p1); q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
        m.compose(p1.clone().add(d.clone().multiplyScalar(0.5)), q, new THREE.Vector3(1, d.length(), 1)); rung.setMatrixAt(i, m);
      }
      g.add(rung); return 1;
    },
    virus(g) {
      sphere(g, 0.42, lit(0x9c7bb5, 0.1, 0.6), [0.5, 0.5, 0]);
      const spike = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.03, 0.12, 6), lit(0xe0c060, 0.1, 0.5), 90), m = new THREE.Matrix4(), q = new THREE.Quaternion();
      for (let i = 0; i < 90; i++) {
        const y = 1 - 2 * (i + 0.5) / 90, r = Math.sqrt(1 - y * y), a = i * 2.39996, d = new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a));
        q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); m.compose(new THREE.Vector3(0.5, 0.5, 0).add(d.clone().multiplyScalar(0.47)), q, new THREE.Vector3(1, 1, 1)); spike.setMatrixAt(i, m);
      }
      g.add(spike); return 1;
    },
    wave(g) {
      const pts = Array.from({ length: 241 }, (_, i) => { const x = 3 * i / 240; return [x, 0.4 + 0.25 * Math.sin(x * Math.PI * 2), 0]; });
      tube(pts, 0.025, flat(0xe8222b), g, 240);
      stage.line([[0.25, 0.75, 0], [1.25, 0.75, 0]], 0x202a36, { parent: g });
      for (const x of [0.25, 1.25]) stage.line([[x, 0.7, 0], [x, 0.8, 0]], 0x202a36, { parent: g });
      return 1;
    },
    rbc(g) {
      const prof = [];                                         // biconcave disc profile (diameter 1)
      for (let i = 0; i <= 24; i++) { const r = 0.5 * i / 24, t = 0.16 * (0.25 + 1.6 * (r / 0.5) ** 2 - 1.1 * (r / 0.5) ** 4) * Math.sqrt(Math.max(0, 1 - (r / 0.5) ** 2)) + 0.002; prof.push(new THREE.Vector2(r, t)); }
      const pts = [...prof, ...prof.slice().reverse().map(v => new THREE.Vector2(v.x, -v.y))];
      add(g, new THREE.LatheGeometry(pts, 64), lit(0xb3262e, 0.05, 0.45), [0.5, 0.55, 0], [1.05, 0, 0.25]);
      return 1;
    },
    hair(g) {
      const pts = Array.from({ length: 41 }, (_, i) => [i * 0.75, 0.5 + 0.6 * Math.sin(i / 40 * 2.4), 0.8 * Math.sin(i / 40 * 1.3)]);
      tube(pts, 0.5, lit(0x3b2a20, 0.15, 0.5), g, 120);
      return 1;
    },
    coin(g) {
      const face = canvasTexture(THREE, 256, 256, (ctx) => {
        ctx.fillStyle = '#c9ced3'; ctx.fillRect(0, 0, 256, 256); ctx.strokeStyle = '#8f979f'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(128, 128, 112, 0, 7); ctx.stroke();
        ctx.fillStyle = '#7f878f'; ctx.font = 'bold 84px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('100', 128, 132);
      });
      const side = lit(0xb9bfc5, 0.85, 0.3), top = new THREE.MeshStandardMaterial({ map: face, metalness: 0.7, roughness: 0.35 });
      add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.064, 64), [side, top, top], [0.5, 0.032, 0]);
      return 1;
    },
    person(g) { person(g, 1); return 1; },
    field(g) {
      const W = 68 / 105;
      add(g, new THREE.BoxGeometry(1, 0.004, W), lit(0x3f8f4f, 0, 0.9), [0.5, 0.002, 0]);
      const y = 0.005, line = pts => stage.line(pts, 0xffffff, { parent: g });
      line([[0, y, -W / 2], [1, y, -W / 2], [1, y, W / 2], [0, y, W / 2], [0, y, -W / 2]]); line([[0.5, y, -W / 2], [0.5, y, W / 2]]);
      ring(g, 9.15 / 105, 0xffffff, 1, [0.5, y, 0]);
      for (const x0 of [0, 1]) { const s = x0 ? -1 : 1, d = 16.5 / 105, w = 40.3 / 105 / 2; line([[x0, y, -w], [x0 + s * d, y, -w], [x0 + s * d, y, w], [x0, y, w]]); }
      return 1;
    },
    everest(g) {
      const geo = new THREE.ConeGeometry(1.6, 1, 48, 12, false); geo.translate(0, 0.5, 0);
      const pos = geo.attributes.position, n = noise2(5), col = [];
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = 1 + 0.25 * (n(x * 4 + 20, z * 4 + 20) - 0.5) * (1 - y);
        pos.setXYZ(i, x * k, y, z * k);
        const c = y > 0.75 ? [0.92, 0.94, 0.96] : y > 0.4 ? [0.27, 0.26, 0.25] : [0.2, 0.22, 0.19]; col.push(...c);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
      add(g, geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), [1.6, 0, 0]);
      return 3.2;
    },
    cities(g) {
      for (const [x, c] of [[0, 0x0072b2], [1, 0xd55e00]]) { add(g, new THREE.CylinderGeometry(0.006, 0.006, 0.08, 8), lit(0x40546a), [x, 0.04, 0]); sphere(g, 0.018, lit(c, 0.1, 0.4), [x, 0.09, 0]); }
      dashed(g, [0, 0.01, 0], [1, 0.01, 0]);
      return 0.05;
    },
    earth(g) { earth(g, 0.5, [0.5, 0.5, 0]); return 1; },
    earthMoon(g) { earth(g, 0.0166, [0, 0.0166, 0]); moon(g, 0.0045, [1, 0.0166, 0]); dashed(g, [0, 0.0166, 0], [1, 0.0166, 0]); ring(g, 1, 0x9aa9b5, 0.5, [0, 0.0166, 0]); return 0.04; },
    sun(g) { sun(g, 0.5, [0.5, 0.5, 0]); return 1; },
    au(g) { sun(g, 0.0047, [0, 0.01, 0]); earth(g, 0.004, [1, 0.01, 0]); ring(g, 1, 0x9aa9b5, 0.7, [0, 0.01, 0]); return 0.03; },
    planets(g) {
      sun(g, 0.004, [0, 0.01, 0]);
      for (const a of [0.39, 0.72, 1, 1.52, 5.2, 9.58, 19.2, 30.07]) { ring(g, a / 30.07, 0x9aa9b5, 0.6, [0, 0.01, 0]); dot(g, 0.004, 0x40546a, [a / 30.07, 0.01, 0]); }
      return 0.03;
    },
    lightyear(g) {
      tube([[0, 0.01, 0], [1, 0.01, 0]], 0.004, flat(0xffd23f), g, 2);
      sphere(g, 0.012, flat(0xfff3b0), [1, 0.01, 0]);
      return 0.03;
    },
    proxima(g) { sun(g, 0.004, [0, 0.01, 0]); dot(g, 0.004, 0xd55e00, [1, 0.01, 0]); dashed(g, [0, 0.01, 0], [1, 0.01, 0]); return 0.03; },
    galaxy(g) { galaxyDisk(g, 1, [0.5, 0.05, 0]); return 1; },
    localGroup(g) { galaxyDisk(g, 0.04, [0, 0.02, 0], 1500); galaxyDisk(g, 0.09, [1, 0.04, 0], 2200, 1.1); dashed(g, [0, 0.02, 0], [1, 0.04, 0]); return 0.1; },
    universe(g) {
      points(g, 5000, () => { let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1); return [0.5 + x * 0.5, 0.5 + y * 0.5, z * 0.5, rnd()]; }, k => (k > 0.5 ? '#ffe9c4' : '#c8d8ff'), 0.008);
      sphere(g, 0.5, new THREE.MeshBasicMaterial({ color: 0x9fb6d6, transparent: true, opacity: 0.08, depthWrite: false }), [0.5, 0.5, 0]);
      return 1;
    },
    // ---- mass objects (characteristic length = size noted in model.js sizeFor) ----
    electron(g) { dot(g, 0.5, 0x0072b2, [0.5, 0.5, 0]); return 1; },
    water(g) {
      sphere(g, 0.3, lit(0xd03b2c, 0.05, 0.4), [0.5, 0.5, 0]);
      for (const a of [0.91, -0.91]) { const x = 0.5 + 0.32 * Math.sin(a), y = 0.5 - 0.32 * Math.cos(a) * 0.6; sphere(g, 0.18, lit(0xf2f4f6, 0.05, 0.4), [x, y, 0]); }
      return 1;
    },
    ecoli(g) { add(g, new THREE.CapsuleGeometry(0.22, 0.56, 8, 24), lit(0x6aaa64, 0.05, 0.5), [0.5, 0.22, 0], [0, 0, Math.PI / 2]); return 0.5; },
    mosquito(g) {
      const m = lit(0x2f3337, 0.1, 0.6);
      add(g, new THREE.CapsuleGeometry(0.06, 0.45, 6, 12), m, [0.55, 0.3, 0], [0, 0, Math.PI / 2 - 0.15]);
      sphere(g, 0.07, m, [0.2, 0.34, 0]);
      for (const z of [-1, 1]) add(g, new THREE.PlaneGeometry(0.42, 0.12), new THREE.MeshStandardMaterial({ color: 0xdfe7ee, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }), [0.45, 0.4, z * 0.2], [Math.PI / 2, 0, z * 0.3]);
      for (let i = 0; i < 6; i++) { const x = 0.35 + (i % 3) * 0.08, z = (i < 3 ? -1 : 1) * 0.04; stage.line([[x, 0.28, z], [x + 0.05, 0.12, z * 5], [x + 0.1, 0, z * 8]], 0x2f3337, { parent: g }); }
      add(g, new THREE.CylinderGeometry(0.005, 0.005, 0.25, 6), m, [0.05, 0.3, 0], [0, 0, Math.PI / 2 + 0.3]);
      return 0.5;
    },
    bottle(g) {
      const prof = [[0, 0], [0.16, 0], [0.17, 0.02], [0.17, 0.72], [0.12, 0.82], [0.06, 0.88], [0.06, 1], [0, 1]].map(([x, y]) => new THREE.Vector2(x, y));
      add(g, new THREE.LatheGeometry(prof, 48), new THREE.MeshStandardMaterial({ color: 0x9fd3f0, transparent: true, opacity: 0.55, roughness: 0.1 }), [0.17, 0, 0]);
      return 0.35;
    },
    car(g) {
      const body = lit(0x9aa9b5, 0.6, 0.35), glass = lit(0x2b3a48, 0.3, 0.2), tire = lit(0x202326, 0, 0.8);
      add(g, new THREE.BoxGeometry(1, 0.2, 0.4), body, [0.5, 0.16, 0]);
      add(g, new THREE.BoxGeometry(0.52, 0.14, 0.36), glass, [0.47, 0.32, 0]);
      for (const x of [0.2, 0.8]) for (const z of [-0.19, 0.19]) add(g, new THREE.CylinderGeometry(0.075, 0.075, 0.06, 20), tire, [x, 0.075, z], [Math.PI / 2, 0, 0]);
      return 0.42;
    },
    plane(g) {
      const m = lit(0xe9edf1, 0.4, 0.4);
      add(g, new THREE.CapsuleGeometry(0.045, 0.9, 8, 20), m, [0.5, 0.12, 0], [0, 0, Math.PI / 2]);
      add(g, new THREE.BoxGeometry(0.22, 0.012, 1.1), m, [0.52, 0.11, 0], [0, -0.45, 0]);
      add(g, new THREE.BoxGeometry(0.1, 0.01, 0.3), m, [0.06, 0.14, 0]);
      add(g, new THREE.BoxGeometry(0.1, 0.16, 0.01), m, [0.06, 0.22, 0]);
      return 1.1;
    },
    atmosphere(g) { earth(g, 0.49, [0.5, 0.5, 0]); sphere(g, 0.5, new THREE.MeshStandardMaterial({ color: 0x7fb8ff, transparent: true, opacity: 0.25, depthWrite: false }), [0.5, 0.5, 0]); return 1; },
    moon(g) { moon(g, 0.5, [0.5, 0.5, 0]); return 1; },
    // ---- time icons (drawn at a size proportional to the light bar, not to scale) ----
    clock(g) {
      add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.08, 48), lit(0xf4f6f8, 0.1, 0.5), [0.5, 0.5, 0], [Math.PI / 2, 0, 0]);
      add(g, new THREE.TorusGeometry(0.5, 0.04, 8, 48), lit(0x40546a, 0.5, 0.4), [0.5, 0.5, 0]);
      add(g, new THREE.BoxGeometry(0.04, 0.32, 0.02), lit(0x202a36), [0.5, 0.64, 0.05]);
      add(g, new THREE.BoxGeometry(0.24, 0.04, 0.02), lit(0x202a36), [0.6, 0.5, 0.05]);
      return 0.1;
    },
    heart(g) {
      const s = new THREE.Shape(); s.moveTo(0, -0.35); s.bezierCurveTo(-0.6, 0.05, -0.3, 0.5, 0, 0.22); s.bezierCurveTo(0.3, 0.5, 0.6, 0.05, 0, -0.35);
      add(g, new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 }), lit(0xc8323c, 0.1, 0.4), [0.5, 0.5, -0.1]);
      return 0.3;
    },
    chip(g) {
      add(g, new THREE.BoxGeometry(0.8, 0.08, 0.8), lit(0x2b3138, 0.3, 0.4), [0.5, 0.04, 0]);
      add(g, new THREE.BoxGeometry(0.4, 0.02, 0.4), lit(0xb9bfc5, 0.9, 0.25), [0.5, 0.09, 0]);
      return 0.8;
    },
    pyramid(g) { add(g, new THREE.ConeGeometry(0.7, 0.64, 4, 1), new THREE.MeshStandardMaterial({ color: 0xd8b98a, roughness: 0.9, flatShading: true }), [0.5, 0.32, 0], [0, Math.PI / 4, 0]); return 1.4; },
    lifespan(g) { person(g, 1, 0xa6b6c4); return 0.3; },
    atom(g) { builders.hydrogen(g); return 1; },
    particle(g) { dot(g, 0.25, 0xcc79a7, [0.5, 0.5, 0]); return 0.5; },
  };

  // build(name) -> { group, depth } or null when the model is unknown.
  return function build(name) {
    const b = builders[name]; if (!b) return null;
    const group = new THREE.Group();
    const depth = b(group) ?? 1;
    group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
    return { group, depth };
  };
}
