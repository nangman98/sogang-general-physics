// 1-1 — 3D view for the three activities.
// scale: nested cubes of edge 10^k m around a fixed "current size" cube; objects drawn at true relative size.
// convert: 1 m line, 1 m² plate, or 1 m³ cube subdivided, with a magnified cell and a practice question.
// density: an equal-arm balance with two cubes, m = rho a^3.
import { fmt, superscript } from '../../../core/format.js';
import * as M from './model.js';
import { texNum } from './spec.js';

const S0 = 3;                     // world size of the current-size cube (edge = 10^n of the shown quantity)
const BAR = /(거리|까지|길이|파장|반지름|1광년)/;   // length objects drawn as horizontal bars
const TALL = /(키|높이)/;                         // heights drawn as vertical bars; the rest as balls

export function view(stage, ctx) {
  const { THREE, v3 } = stage;
  let cur = null;
  let qIndex = 0;

  const segments = (positions, color, opacity = 1, parent = stage.group) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
    parent.add(m); return m;
  };
  const cubeEdges = (color, opacity = 1, parent = stage.group) => {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)); g.translate(0.5, 0.5, -0.5);
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    parent.add(m); return m;
  };

  // ---------------- scale ----------------
  function buildScale(p) {
    const q = M.QUANTITIES[p.quantity];
    stage.board(stage.group, -3, 11, 14, 0);
    stage.floorPlane(-1.45);
    const kMin = Math.floor(M.sceneLog(p.quantity, q.min)) - 2, kMax = Math.ceil(M.sceneLog(p.quantity, q.max)) + 2;
    const cubes = [];
    for (let k = kMin; k <= kMax; k++) {
      const box = cubeEdges(0xd8e5ee, 0.8);
      const tag = stage.label(`10${superscript(k)} m`, [0, 0, 0], 'station', { dy: -10 });
      cubes.push({ k, box, tag });
    }
    const here = stage.mesh(stage.group, new THREE.BoxGeometry(S0, S0, S0), stage.flat(0x0072b2, { transparent: true, opacity: 0.1, depthWrite: false }), [S0 / 2, S0 / 2, -S0 / 2], [0, 0, 0], false);
    here.renderOrder = 3;
    const hereEdges = cubeEdges(0x0072b2, 0.9); hereEdges.scale.setScalar(S0);
    const hereTag = stage.label('', [S0 / 2, S0 + 0.1, -S0 / 2], 'apex', { dy: -16 });

    const objs = M.OBJECTS[p.quantity].map((o, i) => {
      const L = M.sceneLength(p.quantity, o.value);
      const kind = p.quantity === 'mass' ? 'cube' : p.quantity === 'time' || BAR.test(o.name) ? 'bar' : TALL.test(o.name) ? 'tall' : 'ball';
      const g = new THREE.Group(); stage.group.add(g);
      if (kind === 'ball') stage.mesh(g, new THREE.SphereGeometry(0.5, 32, 20), stage.lit(0xe69f00, 0.2, 0.45), [0.5, 0.5, 0.5]);
      else if (kind === 'cube') stage.mesh(g, new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x56b4e9, transparent: true, opacity: 0.55, roughness: 0.2 }), [0.5, 0.5, 0.5]);
      else if (kind === 'tall') stage.mesh(g, new THREE.BoxGeometry(0.06, 1, 0.06), stage.lit(0xe69f00, 0.2, 0.45), [0.03, 0.5, 0.03]);
      else stage.mesh(g, new THREE.BoxGeometry(1, 0.025, 0.025), p.quantity === 'time' ? stage.flat(0xd8a400) : stage.lit(0xe69f00, 0.2, 0.45), [0.5, 0.0125, 0.0125]);
      const value = p.quantity === 'time' ? `${M.QUANTITIES.time.symbol} = ${o.approx ? '약 ' : ''}${fmt(o.value)} s` : `${o.approx ? '약 ' : ''}${fmt(o.value)} ${q.unit}`;
      const tag = stage.label(`${o.name}<br><span style="font-weight:500">${value}</span>`, [0, 0, 0], 'tag', { dy: -14 });
      return { o, L, kind, g, tag, z: 0.15 + (i % 3) * 0.05 };
    });

    stage.setHome({ target: [1.6, 1.3, -1.2], direction: [-0.45, 0.5, 1], distance: 11.5, minDistance: 5, maxDistance: 30 });
    cur = {
      render(o) {
        const nL = o.nL;
        hereTag.move([S0 / 2, S0 + 0.1, -S0 / 2]);
        hereTag.set(`${o.prefix ? o.prefix.text : fmt(o.value, { sci: true }) + ' ' + q.unit}`);
        for (const c of cubes) {
          const s = 10 ** (c.k - nL) * S0;
          const show = s > 0.05 && s < 80;
          c.box.visible = show;
          if (show) { c.box.scale.setScalar(s); c.box.material.opacity = s > 12 ? Math.max(0, 0.8 * (1 - (s - 12) / 68)) : 0.8; }
          c.tag.node.dataset.off = show && s > 0.6 && s < 16 ? '0' : '1';
          c.tag.move([s, s, 0]);
        }
        for (const it of objs) {
          const s = it.L * 10 ** (-nL) * S0;
          const show = s > 0.02 && s < 60;
          it.g.visible = show;
          if (show) {
            if (it.kind === 'bar') it.g.scale.set(s, Math.max(s, 0.6), Math.max(s, 0.6));
            else if (it.kind === 'tall') it.g.scale.set(Math.max(s, 0.6), s, Math.max(s, 0.6));
            else it.g.scale.setScalar(s);
            it.g.position.set(it.kind === 'bar' ? 0 : it.kind === 'tall' ? 0.3 : 0.05, 0, it.kind === 'bar' ? it.z * 4 : it.kind === 'tall' ? 0.5 : 0.1);
          }
          it.tag.node.dataset.off = show && s > 0.15 && s < 20 ? '0' : '1';
          const top = it.kind === 'bar' ? 0.08 : s;
          if (it.kind === 'tall') { it.tag.move([0.3, s, 0.5]); continue; }
          it.tag.move([it.kind === 'bar' ? Math.min(s, 6) / 2 : s / 2 + 0.05, top, it.kind === 'bar' ? it.z * 4 : 0.1 + s / 2]);
        }
      },
    };
    return { legend: [{ label: '지금 크기', color: '#0072b2' }, { label: p.quantity === 'time' ? '빛이 가는 거리' : p.quantity === 'mass' ? '같은 질량의 물' : '물체', color: p.quantity === 'mass' ? '#56b4e9' : '#e69f00' }] };
  }

  // ---------------- convert ----------------
  function buildConvert(p) {
    const d = Number(p.dim), unit = p.unit, W = 4;            // 1 m drawn as 4 world units
    stage.board(stage.group, -1.5, 9.5, 8, 0);
    stage.floorPlane(-1.45);
    const y0 = 0.02, fine = unit === 'cm' ? 10 : 1;          // inset cell edge in cm (10 cm or 1 cm)
    const pos = [];
    const grid = (n, size, ox, oz, axes) => {                 // n divisions along each axis of a size-world object
      const st = size / n;
      if (axes === 1) for (let i = 0; i <= n; i++) pos.push(ox + i * st, y0 + 0.12, oz, ox + i * st, y0 + 0.12 + (i % 10 === 0 ? 0.18 : 0.08), oz);
      if (axes === 2) for (let i = 0; i <= n; i++) pos.push(ox + i * st, y0 + 0.031, oz, ox + i * st, y0 + 0.031, oz - size, ox, y0 + 0.031, oz - i * st, ox + size, y0 + 0.031, oz - i * st);
      if (axes === 3) for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
        pos.push(ox + i * st, y0 + j * st, oz, ox + i * st, y0 + j * st, oz - size);
        pos.push(ox, y0 + i * st, oz - j * st, ox + size, y0 + i * st, oz - j * st);
        pos.push(ox + i * st, y0, oz - j * st, ox + i * st, y0 + size, oz - j * st);
      }
    };
    // Main 1 m object, divided into 10 cm parts.
    if (d === 1) { stage.mesh(stage.group, new THREE.BoxGeometry(W, 0.12, 0.12), stage.lit(0xe9edf1, 0.1, 0.5), [W / 2, y0 + 0.06, -0.06]); grid(unit === 'cm' ? 100 : 100, W, 0, 0, 1); }
    if (d === 2) { stage.mesh(stage.group, new THREE.BoxGeometry(W, 0.03, W), stage.lit(0xe9edf1, 0.1, 0.5), [W / 2, y0 + 0.015, -W / 2]); grid(10, W, 0, 0, 2); }
    if (d === 3) { stage.mesh(stage.group, new THREE.BoxGeometry(W, W, W), new THREE.MeshStandardMaterial({ color: 0xe9edf1, transparent: true, opacity: 0.35, roughness: 0.5 }), [W / 2, y0 + W / 2, -W / 2]); grid(10, W, 0, 0, 3); }
    segments(pos.splice(0), 0x40546a, d === 3 ? 0.35 : 0.7);
    stage.label(d === 1 ? '1 m' : d === 2 ? '1 m²' : '1 m³', [W / 2, y0 + (d === 3 ? W : 0.3), 0.1], 'apex', { dy: -16 });

    // Magnified inset: one cell of edge `fine` cm, divided into 10 per edge.
    const Wi = 2.4, ox = W + 1.6;
    const cellW = W * fine / 100;                              // that cell inside the main object
    stage.mesh(stage.group, new THREE.BoxGeometry(cellW + 0.02, d === 3 ? cellW + 0.02 : 0.05, d === 1 ? 0.16 : cellW + 0.02), stage.flat(0x0072b2, { transparent: true, opacity: 0.55 }), [cellW / 2, y0 + (d === 3 ? cellW / 2 : 0.03), d === 1 ? -0.06 : -cellW / 2], [0, 0, 0], false);
    if (d === 1) { stage.mesh(stage.group, new THREE.BoxGeometry(Wi, 0.12, 0.12), stage.lit(0xe9edf1, 0.1, 0.5), [ox + Wi / 2, y0 + 0.06, -0.06]); grid(10, Wi, ox, 0, 1); }
    if (d === 2) { stage.mesh(stage.group, new THREE.BoxGeometry(Wi, 0.03, Wi), stage.lit(0xe9edf1, 0.1, 0.5), [ox + Wi / 2, y0 + 0.015, -Wi / 2]); grid(10, Wi, ox, 0, 2); }
    if (d === 3) {
      const n = 10, st = Wi / n, gap = st * 0.12;
      const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(st - gap, st - gap, st - gap), stage.lit(0xdfe6ee, 0.1, 0.45), n * n * n);
      const mtx = new THREE.Matrix4(); let c = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { mtx.makeTranslation(ox + (i + 0.5) * st, y0 + (j + 0.5) * st, -(k + 0.5) * st); inst.setMatrixAt(c++, mtx); }
      inst.castShadow = true; stage.group.add(inst);
    }
    segments(pos, 0x40546a, 0.8);
    const fineUnit = unit === 'cm' ? 'cm' : 'mm', cell = fine === 10 ? '10 cm' : '1 cm', cellLabel = d > 1 ? `(${cell})${POWS[d]}` : cell;
    stage.label(`${cellLabel} 확대 = 10${superscript(d)} ${fineUnit}${POWS[d]}`, [ox + Wi / 2, y0 + (d === 3 ? Wi : 0.3), 0.1], 'tag', { dy: -16 });
    stage.line([[cellW, y0 + (d === 3 ? cellW : 0.1), -0.05], [ox, y0 + (d === 3 ? Wi : 0.1), -0.05]], 0x0072b2, { dashed: true, opacity: 0.8, dash: 0.15, gap: 0.1 });

    buildQuiz(p);
    stage.setHome({ target: [3.9, 1.6, -2], direction: [-0.3, 0.6, 1], distance: 14, minDistance: 5, maxDistance: 30 });
    cur = { render() {} };
    return { legend: [{ label: '확대한 칸', color: '#0072b2' }] };
  }
  const POWS = ['', '', '²', '³'];

  function buildQuiz(p) {
    const box = document.createElement('div');
    box.innerHTML = `<h3>확인 문제</h3><div class="question"></div><div class="answer"><input type="text" inputmode="decimal" aria-label="답" placeholder="예 2e6 또는 2×10^6"><button type="button">확인</button></div><div class="row"><button type="button" class="next">새 문제</button></div><div class="feedback" hidden></div>`;
    ctx.panel.append(box);
    const qEl = box.querySelector('.question'), input = box.querySelector('input'), fb = box.querySelector('.feedback');
    let q;
    const show = () => {
      q = M.question(qIndex, p.dim, p.unit);
      qEl.innerHTML = ctx.tex(`${texNum(q.given)}\\ \\mathrm{${q.from.replace('²', '^2').replace('³', '^3')}} = \\ ?\\ \\mathrm{${q.to.replace('²', '^2').replace('³', '^3')}}`);
      input.value = ''; fb.hidden = true;
    };
    const solution = () => {
      const k = M.unitFactor(q.unit), d = q.dim, pw = d > 1 ? `^{${d}}` : '';
      const fac = q.back ? `\\left(\\dfrac{1\\ \\mathrm{m}}{${k}\\ \\mathrm{${q.unit}}}\\right)${pw}` : `\\left(\\dfrac{${k}\\ \\mathrm{${q.unit}}}{1\\ \\mathrm{m}}\\right)${pw}`;
      return ctx.tex(`${texNum(q.given)}\\ \\mathrm{${q.from.replace('²', '^2').replace('³', '^3')}}\\times${fac} = ${texNum(q.answer)}\\ \\mathrm{${q.to.replace('²', '^2').replace('³', '^3')}}`);
    };
    const msg = { power: '넓이·부피에서는 길이 인자를 제곱·세제곱해야 한다.', direction: '인자를 뒤집었다. 없애려는 단위가 분모에 오도록 인자를 쓴다.', value: '다시 계산해 보자.', unreadable: '숫자로 적자. 예 2e6 또는 2×10^6' };
    box.querySelector('.answer button').addEventListener('click', () => {
      const r = M.check(q, input.value);
      fb.hidden = false; fb.className = 'feedback ' + (r.ok ? 'ok' : 'no');
      fb.innerHTML = r.ok ? `맞다.<br>${solution()}` : r.reason === 'unreadable' ? msg.unreadable : `${msg[r.reason]}<br>${solution()}`;
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') box.querySelector('.answer button').click(); });
    box.querySelector('.next').addEventListener('click', () => { qIndex += 1; show(); });
    show();
  }

  // ---------------- density ----------------
  function buildDensity(p) {
    const U = 0.2;                                    // world units per cm
    stage.board(stage.group, -5, 5, 5.5, 0);
    stage.floorPlane(-1.45);
    const pivotY = 3.4, arm = 3.0, hang = 1.7;
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.5, 0.65, 0.2, 48), stage.lit(0x455768, 0.55, 0.3), [0, 0.1, 0]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.09, 0.11, pivotY, 24), stage.lit(0x8c9ca9, 0.6, 0.3), [0, pivotY / 2, 0]);
    const beam = new THREE.Group(); beam.position.set(0, pivotY, 0); stage.group.add(beam);
    stage.mesh(beam, new THREE.BoxGeometry(arm * 2 + 0.4, 0.12, 0.16), stage.lit(0x536779, 0.55, 0.32), [0, 0, 0]);
    stage.mesh(beam, new THREE.ConeGeometry(0.12, 0.4, 3), stage.lit(0x202e3d, 0.4, 0.4), [0, 0.28, 0], [0, 0, Math.PI]);
    const pans = [-1, 1].map(sign => {
      const g = new THREE.Group(); stage.group.add(g);
      stage.mesh(g, new THREE.CylinderGeometry(1.1, 1.0, 0.08, 48), stage.lit(0xc7d0d8, 0.6, 0.3), [0, 0, 0]);
      const strings = [0, 1, 2].map(() => stage.line([[0, 0, 0], [0, 1, 0]], 0x56687a));
      return { sign, g, strings };
    });
    const o = M.balance(p);
    const mk = (mat, edge, pan) => {
      const s = edge * U, m = new THREE.MeshStandardMaterial({ color: mat.color, metalness: mat.id === 'water' ? 0 : 0.6, roughness: mat.id === 'water' ? 0.15 : 0.3, transparent: mat.id === 'water', opacity: mat.id === 'water' ? 0.6 : 1 });
      return stage.mesh(pan.g, new THREE.BoxGeometry(s, s, s), m, [0, 0.04 + s / 2, 0]);
    };
    const cubeA = mk(o.A, p.a, pans[0]), cubeB = mk(o.B, p.b, pans[1]);
    const tags = [stage.label('', [0, 0, 0], 'tag', { dy: -14 }), stage.label('', [0, 0, 0], 'tag', { dy: -14 })];
    const badge = document.createElement('div'); badge.className = 'badge'; ctx.panel.append(badge);

    stage.setHome({ target: [0, 2.0, 0], direction: [0.12, 0.35, 1], distance: 10, minDistance: 5, maxDistance: 22 });
    cur = {
      render(ob) {
        beam.rotation.z = -ob.tilt;
        pans.forEach((pan, i) => {
          const end = v3([pan.sign * arm, 0, 0]).applyEuler(beam.rotation).add(v3([0, pivotY, 0]));
          pan.g.position.set(end.x, end.y - hang, end.z);
          pan.strings.forEach((l, j) => {
            const a = j * 2 * Math.PI / 3, off = [Math.cos(a) * 0.95, 0.04, Math.sin(a) * 0.95];
            const at = l.geometry.attributes.position;
            at.setXYZ(0, end.x, end.y, end.z); at.setXYZ(1, pan.g.position.x + off[0], pan.g.position.y + off[1], pan.g.position.z + off[2]); at.needsUpdate = true;
          });
        });
        const top = (pan, edge) => [pan.g.position.x, pan.g.position.y + edge * U + 0.25, pan.g.position.z];
        tags[0].move(top(pans[0], p.a)); tags[1].move(top(pans[1], p.b));
        tags[0].set(`${ob.A.name}<br><span style="font-weight:500">m = ${fmt(ob.mA)} g</span>`);
        tags[1].set(`${ob.B.name}<br><span style="font-weight:500">m = ${fmt(ob.mB)} g</span>`);
        badge.className = 'badge' + (ob.level ? ' level' : '');
        badge.textContent = ob.level ? '수평 (balanced)' : ob.side === 'right' ? '오른쪽이 무겁다' : '왼쪽이 무겁다';
        cubeA.visible = cubeB.visible = true;
      },
    };
    return { legend: [] };
  }

  return {
    build(p) {
      cur = null;
      if (p.activity === 'convert') return buildConvert(p);
      if (p.activity === 'density') return buildDensity(p);
      return buildScale(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
