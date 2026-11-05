// 7.4–7.5 3D view. spring: a block tied to a wall by a spring on the measuring board, an applied force moving it
// slowly, and an F–x board behind whose signed area between x_i and the block grows as it moves.
// graph: a block pushed along the board by a force that follows a broken-line F–x graph; the area under the graph
// fills as the block passes (core/area3d.js).
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { areaFill, FILL_POS, FILL_NEG } from '../../../core/area3d.js';
import { vecArrow, block } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui, springScale } from './spec.js';

const COL = { force: 0xd55e00 };
const LEGEND = [{ label: '힘 (force)', color: '#d55e00' }, { label: '양의 일 넓이', color: '#e69f00' }, { label: '음의 일 넓이', color: '#56b4e9' }];

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;
  const add = (a, b) => a.map((c, i) => c + b[i]);

  function legs(x0, x1, width) {
    stage.floorPlane(-1.45);
    for (const x of [x0 + 0.8, x1 - 0.8]) for (const z of [-width / 2 + 0.5, width / 2 - 0.5]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.3, 0.4, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
  }
  function ruler(x0, x1, step, labelEvery, z, unitLabel = v => `${v} m`) {
    const pts = [];
    for (let k = Math.ceil(x0 / step - 1e-9); k * step <= x1 + 1e-9; k++) pts.push([k * step, 0.012, z - 0.12], [k * step, 0.012, z + 0.12]);
    stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xd8e5ee })));
    for (let k = Math.ceil(x0 / labelEvery - 1e-9); k * labelEvery <= x1 + 1e-9; k++) {
      const v = +(k * labelEvery).toFixed(6);
      stage.label(unitLabel(v), [v, 0.05, z + 0.32], 'measure');
    }
  }
  function onBody(color, html) {
    const arrow = vecArrow(stage, color, { radius: 0.04 });
    const lab = stage.label(tex(html), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    return {
      set(at, dir, L) {
        arrow.update(at, dir, L);
        lab.node.dataset.off = L > 0.03 ? '' : '1';
        lab.move(add(at, dir.map(c => c * (L + 0.28))));
      },
    };
  }
  function predict(intro, fields, grade) {
    const box = quizBox(ctx.panel, '예측');
    box.text(intro);
    const inputs = fields.map(f => { box.text(f.title, 'pred'); return box.answer({ label: f.label, unit: f.unit, placeholder: f.placeholder, onEnter: () => check() }); });
    let onReveal = () => {};
    const check = () => {
      const r = grade(inputs.map(i => i.value));
      box.feedback(r.ok, r.message);
      if (r.reveal) { ui.revealed = true; onReveal(); ctx.refresh(); }
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    return { set onReveal(f) { onReveal = f; } };
  }
  // Signed fill of up to two trapezoids between the F–x line and the x axis (direction-aware spring work).
  function pieceFill(board) {
    const zf = board.Z + 0.006, [y0, y1] = board.range.y;
    const P = (x, y) => [board.X(x), board.Y(Math.min(y1, Math.max(y0, y))), zf];
    const pos = new Float32Array(2 * 18), col = new Float32Array(pos.length);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    const lpos = new Float32Array(2 * 24), lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
    const outline = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: 0x000000 }));
    mesh.frustumCulled = outline.frustumCulled = false; board.group.add(mesh, outline);
    const signs = [0, 1].map(() => stage.label('', [0, 0, 0], 'axis', { dy: 0, priority: 1 }));
    const cP = new THREE.Color(FILL_POS), cN = new THREE.Color(FILL_NEG);
    return pieces => {
      let nt = 0, nl = 0;
      pieces.forEach((q, i) => {
        const A = P(q.from, 0), B = P(q.to, 0), C = P(q.to, q.f1), D = P(q.from, q.f0), c = q.work >= 0 ? cP : cN;
        for (const v of [A, B, C, A, C, D]) { pos.set(v, nt * 3); col.set([c.r, c.g, c.b], nt * 3); nt++; }
        for (const v of [A, B, B, C, C, D, D, A]) { lpos.set(v, nl * 3); nl++; }
        const big = Math.abs(q.to - q.from) > 0.03;
        signs[i].node.dataset.off = big ? '' : '1';
        signs[i].set(q.work >= 0 ? '+' : '−');
        signs[i].move(board.at((q.from + q.to) / 2, (q.f0 + q.f1) / 4));
      });
      for (let i = pieces.length; i < 2; i++) signs[i].node.dataset.off = '1';
      geo.setDrawRange(0, nt); geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      lgeo.setDrawRange(0, nl); lgeo.attributes.position.needsUpdate = true;
    };
  }

  // ---------------- spring ----------------
  function buildSpring(p) {
    const S = springScale(p), size = 0.5, wallX = -2.3;
    stage.board(stage.group, -2.9, 1.3, 2.2, 0);
    legs(-2.9, 1.3, 2.2);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.2, 1.3, 1.6), stage.lit(0x6f8091, 0.45, 0.45), [wallX - 0.1, 0.65, 0]);
    ruler(-0.3, 0.3, 0.05, 0.3, 0.75, v => `${fmtFixed(v, 1)} m`);
    // Helix of unit length along +x, stretched to the current length.
    const pts = Array.from({ length: 241 }, (_, i) => { const u = i / 240, a = u * 12 * 2 * Math.PI; return new THREE.Vector3(u, 0.13 * Math.sin(a), 0.13 * Math.cos(a)); });
    const spring = stage.mesh(stage.group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 480, 0.016, 6, false), stage.lit(0x8c9ca9, 0.7, 0.3), [wallX, size / 2, 0], [0, 0, 0], false);
    const b = block(stage, size, { color: 0xa9bccb, eye: [-1, 0, 0] }); stage.group.add(b);
    const Fs = onBody(COL.force, '\\vec F_s'), Fa = onBody(COL.force, '\\vec F_a');
    const Fmax = p.k * 0.3, yr = niceRange(-Fmax, Fmax, { target: 4 });
    const gb = graphBoard(stage, { origin: [-3.1, 1.0, -2.0], width: 4.6, height: 3.4, t: [-0.3, 0.3], tStep: 0.1, y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>x</i> (m)', yTitle: '<i>F</i><sub><i>x</i></sub> (N)' });
    gb.curve(x => -p.k * x, { color: COL.force, samples: 60, dot: false });
    const dot = stage.mesh(gb.group, new THREE.SphereGeometry(0.1, 20, 14), stage.flat(COL.force), gb.at(0, 0), [0, 0, 0], false);
    const fill = pieceFill(gb);
    const Ws = M.springWork(p.k, p.xi, p.xf);

    const pr = predict(`블록을 ${tex(`x_i = ${N(p.xi)}\\ \\mathrm{m}`)}에서 ${tex(`x_f = ${N(p.xf)}\\ \\mathrm{m}`)}까지 천천히 옮긴다. 재생하기 전에 두 일을 구해 보자.`,
      [{ title: `① 용수철 힘이 한 일 ${tex('W_s')}`, label: '용수철 힘이 한 일', unit: 'J', placeholder: '예 -1.5' },
       { title: `② 가한 힘이 한 일 ${tex('W_a')}`, label: '가한 힘이 한 일', unit: 'J', placeholder: '예 1.5' }],
      ([sText, aText]) => {
        const r = M.checkSpring(p, { sText, aText });
        if (r.sReason === 'unreadable' || r.aReason === 'unreadable') return { ok: false, message: '①과 ②를 숫자로 적자. 예 -0.75' };
        const hs = { sign: '부호를 보자. 용수철이 늘어나는 쪽으로 옮기면 용수철 힘은 움직임과 반대라 음의 일을 한다.', delta: `${tex('\\tfrac{1}{2}k(x_f - x_i)^2')}가 아니라 ${tex('\\tfrac{1}{2}kx_i^2 - \\tfrac{1}{2}kx_f^2')}이다.`, noHalf: `${tex('\\tfrac{1}{2}')}을 빠뜨렸다. 삼각형 넓이다.`, value: `식 (7.4.6)에 ${tex('x_i')}, ${tex('x_f')}를 넣자.` }[r.sReason] ?? '';
        const ha = { same: `블록이 처음과 끝에 정지해 있으므로 ${tex('W_a + W_s = \\Delta K = 0')}, 곧 ${tex('W_a = -W_s')}다.`, value: `${tex('W_a = -W_s')} (7.4.9)이다.` }[r.aReason] ?? '';
        const sol = [`W_s = \\tfrac{1}{2}kx_i^2 - \\tfrac{1}{2}kx_f^2 = ${N(Ws)}\\ \\mathrm{J}`, `W_a = -W_s = ${N(-Ws)}\\ \\mathrm{J}`].map(t => tex(t)).join('<br>');
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hs, ha].filter(Boolean).join(' ')}<br>${sol}`, reveal: true };
      });
    pr.onReveal = () => {};

    cur = {
      render(o) {
        const c = [o.x, size / 2, 0];
        b.position.set(...c);
        spring.scale.set(Math.max(0.05, o.x - size / 2 - wallX), 1, 1);
        const dir = o.Fs >= 0 ? [1, 0, 0] : [-1, 0, 0];
        Fs.set(add(c, [0, 0.12, 0]), dir, Math.abs(o.Fs) * S);
        Fa.set(add(c, [0, -0.08, 0.3]), dir.map(v => -v), Math.abs(o.Fa) * S);
        gb.setTime(o.x); dot.position.set(...gb.at(o.x, o.Fs));
        fill(M.springPieces(p.k, p.xi, o.x));
      },
    };
    stage.setHome({ target: [-0.9, 1.9, -0.7], direction: [0, 0.22, 1], distance: 11.5, minDistance: 4, maxDistance: 25 });
    return { legend: LEGEND };
  }

  // ---------------- graph ----------------
  function buildGraph(p) {
    const W = M.graphWork(p), vf = M.speedAt(6, p), size = 0.5;
    stage.board(stage.group, -1.4, 7.4, 2.2, 0);
    legs(-1.4, 7.4, 2.2);
    ruler(0, 6, 0.5, 1, 0.75);
    const b = block(stage, size, { color: 0xa9bccb }); stage.group.add(b);
    const F = onBody(COL.force, '\\vec F');
    const Fmax = Math.max(...M.nodeForces(p), 1), yr = niceRange(0, Fmax * 1.1, { target: 4 });
    const gb = graphBoard(stage, { origin: [-1.6, 1.0, -2.0], width: 9.2, height: 3.6, t: [0, 6], tStep: 1, y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>x</i> (m)', yTitle: '<i>F</i> (N)' });
    gb.curve(x => M.forceAt(x, p), { color: COL.force, samples: 240, tag: v => `<i>F</i> = ${fmt(v, { zero: 1e-9 })} N` });
    const fill = areaFill(stage, gb, M.regions(p), { unit: 'J' });

    const pr = predict(`블록이 ${tex(`v_i = ${N(p.vi)}\\ \\mathrm{m/s}`)}로 ${tex('x = 0')}을 지난다. 그래프의 힘이 ${tex('x = 6\\ \\mathrm{m}')}까지 민다. 재생하기 전에 두 값을 구해 보자.`,
      [{ title: `① 0에서 6 m까지 힘이 한 일 ${tex('W')}`, label: '힘이 한 일', unit: 'J', placeholder: '예 30' },
       { title: `② ${tex('x = 6\\ \\mathrm{m}')}에서 속력 ${tex('v_f')}`, label: '나중 속력', unit: 'm/s', placeholder: '예 5.5' }],
      ([WText, vText]) => {
        const r = M.checkGraph(p, { WText, vText });
        if (r.WReason === 'unreadable' || r.vReason === 'unreadable') return { ok: false, message: '①과 ②를 숫자로 적자. 예 28.5' };
        const hW = { rectangles: '구간마다 직사각형으로 셌다. 기운 선 아래는 사다리꼴이다.', peak: '가장 큰 힘에 거리를 곱했다. 힘이 변하므로 넓이를 구간별로 더하자.', value: '구간마다 사다리꼴 넓이 ½(두 높이의 합)(폭)을 더하자.' }[r.WReason] ?? '';
        const hv = { noKi: `처음 운동에너지 ${tex('\\tfrac{1}{2}mv_i^2')}를 더하자.`, addSpeeds: '속력이 아니라 운동에너지를 더한다.', value: `${tex('\\tfrac{1}{2}mv_f^2 = \\tfrac{1}{2}mv_i^2 + W')}에서 ${tex('v_f')}를 풀자.` }[r.vReason] ?? '';
        const sol = [`W = ${M.regions(p).map(q => N(q.area)).join(' + ')} = ${N(W)}\\ \\mathrm{J}`, `v_f = \\sqrt{v_i^2 + 2W/m} = ${N(vf)}\\ \\mathrm{m/s}`].map(t => tex(t)).join('<br>');
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hW, hv].filter(Boolean).join(' ')}<br>${sol}`, reveal: true };
      });
    pr.onReveal = () => { fill.values(true); ctx.refresh(); };

    cur = {
      render(o) {
        const c = [o.x, size / 2, 0];
        b.position.set(...c);
        F.set(add(c, [0, 0.05, 0]), [1, 0, 0], o.F * 1.2 / 12);
        gb.setTime(o.x);
        fill.update(o.x + 1e-9);
      },
    };
    stage.setHome({ target: [3, 1.6, -0.7], direction: [0, 0.22, 1], distance: 13, minDistance: 5, maxDistance: 30 });
    return { legend: [{ label: '힘 (force)', color: '#d55e00' }, { label: '넓이 (area)', color: '#e69f00' }] };
  }

  return {
    build(p) { cur = null; ui.revealed = false; return p.activity === 'graph' ? buildGraph(p) : buildSpring(p); },
    render(o) { if (cur) cur.render(o); },
  };
}
