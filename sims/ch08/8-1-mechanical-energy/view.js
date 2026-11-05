// 8.2 3D view. track: a rail track standing on the measuring board with a cart, a height pole on the left, and an
// energy bar board on the right. pendulum: a stand with a bob on a string, the swing arc, and the same bar board.
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { car } from '../../../core/models3d.js';
import { barBoard, BAR } from '../../../core/bars3d.js';
import * as M from './model.js';

const rad = d => d * Math.PI / 180;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;
  const basis = new THREE.Matrix4();
  const orient = (obj, f, u) => { const F = new THREE.Vector3(...f).normalize(), U = new THREE.Vector3(...u).normalize(); basis.makeBasis(F, U, F.clone().cross(U)); obj.quaternion.setFromRotationMatrix(basis); };

  function legs(x0, x1, width) {
    stage.floorPlane(-1.45);
    for (const x of [x0 + 0.9, x1 - 0.9]) for (const z of [-width / 2 + 0.6, width / 2 - 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
  }
  function predict(intro, fields, grade) {
    const box = quizBox(ctx.panel, '예측');
    box.text(intro);
    const getters = fields.map(f => {
      if (f.choices) return { choice: box.choices(f.title, f.choices) };
      box.text(f.title, 'pred');
      return { input: box.answer({ label: f.label, unit: f.unit, placeholder: f.placeholder, onEnter: () => check() }) };
    });
    const check = () => {
      const r = grade(getters.map(g => (g.choice ? g.choice() : g.input.value)));
      box.feedback(r.ok, r.message);
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
  }
  function bars(origin, E0, height = 4.4) {
    const top = Math.max(E0, 1e-6) * 1.35;                 // headroom so the E_mec value tag clears the title
    return barBoard(stage, { origin, width: 3.6, height, range: [0, top], title: '에너지 (J)',
      bars: [{ label: '<i>K</i>', fill: BAR.K }, { label: '<i>U</i>', fill: BAR.U }, { label: '<i>E</i><sub>mec</sub>', fill: null }] });
  }

  // ---------------- track ----------------
  function buildTrack(p) {
    const xs = Array.from({ length: 201 }, (_, i) => i / 200 * M.LEN);
    stage.board(stage.group, -1.6, M.LEN + 5.6, 2.4, 0);
    legs(-1.6, M.LEN + 5.6, 2.4);
    const steel = stage.lit(0x8c9ca9, 0.6, 0.3);
    for (const z of [-0.28, 0.28]) {
      const path = new THREE.CatmullRomCurve3(xs.map(x => new THREE.Vector3(x, M.profile(x, p).y + 0.05, z)));
      stage.mesh(stage.group, new THREE.TubeGeometry(path, 400, 0.04, 8, false), steel, [0, 0, 0], [0, 0, 0], false);
    }
    // Posts every 1 m from the rails down to the board, as one instanced mesh.
    const posts = [];
    for (let x = 0.5; x < M.LEN; x += 1) { const y = M.profile(x, p).y; if (y > 0.15) posts.push([x, y]); }
    if (posts.length) {
      const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 10), stage.lit(0x6f8091, 0.5, 0.4), posts.length * 2);
      const Mx = new THREE.Matrix4(); let k = 0;
      for (const [x, y] of posts) for (const z of [-0.28, 0.28]) inst.setMatrixAt(k++, Mx.compose(new THREE.Vector3(x, y / 2, z), new THREE.Quaternion(), new THREE.Vector3(1, y, 1)));
      inst.castShadow = true; stage.group.add(inst);
    }
    // Height pole with 1 m ticks.
    const poleX = -1.0, H = 8.5;
    stage.mesh(stage.group, new THREE.BoxGeometry(0.16, H, 0.16), stage.lit(0x304756, 0.2, 0.5), [poleX, H / 2, -0.6]);
    for (let y = 0; y <= 8; y++) { stage.mesh(stage.group, new THREE.BoxGeometry(0.3, 0.03, 0.05), stage.lit(0xd8e5ee, 0.2, 0.5), [poleX + 0.05, y, -0.5]); if (y % 2 === 0) stage.label(`${y} m`, [poleX - 0.45, y, -0.5], 'measure'); }
    stage.line([[poleX, p.h, -0.3], [M.LEN, p.h, -0.3]], 0x40546a, { dashed: true, dash: 0.25, gap: 0.18 });
    stage.label(`출발 높이 <i>h</i> = ${fmtFixed(p.h, 1)} m`, [1.6, p.h + 0.45, -0.3], 'tag', { dy: 0, priority: 1 });
    stage.label(`끝 B (<i>y</i><sub>B</sub> = ${fmtFixed(p.yB, 1)} m)`, [M.LEN - 0.6, p.yB + 1.0, 0.3], 'tag', { dy: 0, priority: 1 });
    const cart = car(stage, { length: 1.2, color: 0xdfe5ea }); stage.group.add(cart);
    const E0 = p.m * M.G * p.h + 0.5 * p.m * p.v0 * p.v0;
    const bb = bars([M.LEN + 1.6, 0.4, -0.4], E0);
    const V = M.endSpeed(p);
    predict(`수레가 높이 ${tex(`h = ${N(p.h)}\\ \\mathrm{m}`)}에서 ${tex(`v_0 = ${N(p.v0)}\\ \\mathrm{m/s}`)}로 출발한다. 재생하기 전에 예측해 보자.`,
      [{ title: `① 끝 B의 속력 ${tex('v_B')}`, label: '끝 B의 속력', unit: 'm/s', placeholder: '예 8.5' },
       { title: '② 트랙 모양을 바꾸면 끝 B의 속력은', choices: [{ value: 'same', html: '같다' }, { value: 'differ', html: '달라진다' }] }],
      ([vText, shapeChoice]) => {
        const r = M.checkTrack(p, { vText, shapeChoice });
        if (r.sReason === 'empty') return { ok: null, message: '② 하나를 고르자.' };
        if (r.vReason === 'unreadable') return { ok: false, message: '①을 숫자로 적자. 예 8.5' };
        const hv = { noV0: `처음 운동에너지 ${tex('\\tfrac{1}{2}mv_0^2')}도 넣자.`, noYB: `끝 높이 ${tex('y_B')}의 퍼텐셜 에너지를 빼자.`, addSpeeds: '속력이 아니라 에너지를 더한다.', noTwo: `${tex('\\tfrac{1}{2}mv^2 = mg\\Delta y')}에서 ${tex('v^2 = 2g\\Delta y')}다.`, value: `${tex('\\tfrac{1}{2}mv_B^2 + mgy_B = \\tfrac{1}{2}mv_0^2 + mgh')}을 풀자.` }[r.vReason] ?? '';
        const hs = r.sOk ? '' : '높이만 같으면 퍼텐셜 에너지 차가 같아서 마찰 없는 트랙의 모양은 끝 속력을 바꾸지 않는다. 걸리는 시간만 다르다.';
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hv, hs].filter(Boolean).join(' ')}<br>${tex(`v_B = \\sqrt{v_0^2 + 2g(h - y_B)} = ${N(V)}\\ \\mathrm{m/s}`)}` };
      });
    cur = {
      render(o) {
        cart.position.set(o.x, o.y + 0.07, 0);
        orient(cart, [1, o.dy, 0], [-o.dy, 1, 0]);
        bb.set([o.K, o.U, o.E]);
      },
    };
    stage.setHome({ target: [(M.LEN + 4) / 2, 3.6, 0], direction: [0, 0.14, 1], distance: 21, minDistance: 6, maxDistance: 45 });
    return { legend: [] };
  }

  // ---------------- pendulum ----------------
  function buildPendulum(p) {
    const L = p.L, H = L + 0.9, pivot = [0, H, 0], br = 0.1 + 0.05 * Math.cbrt(p.m), th0 = rad(p.theta0);
    const half = Math.max(L * Math.sin(th0) + 1, 1.6);
    stage.board(stage.group, -half - 0.6, half + 5.2, 2.2, 0);
    legs(-half - 0.6, half + 5.2, 2.2);
    const steel = stage.lit(0x6f8091, 0.6, 0.35);
    for (const z of [-0.6, 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.05, 0.05, H + 0.1, 16), steel, [0, (H + 0.1) / 2, z]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.05, 0.05, 1.3, 16), steel, pivot, [Math.PI / 2, 0, 0]);
    const arc = Array.from({ length: 81 }, (_, i) => { const a = -th0 + 2 * th0 * i / 80; return [L * Math.sin(a), H - L * Math.cos(a), 0]; });
    stage.line(arc, 0x40546a, { dashed: true, dash: 0.12, gap: 0.08 });
    stage.line([[-half, H - L, 0.02], [half, H - L, 0.02]], 0x7a8795, { dashed: true, dash: 0.1, gap: 0.08 });
    stage.label('<i>U</i> = 0', [half - 0.2, H - L + 0.18, 0.02], 'gtick', { dy: 0, priority: 1 });
    const string = stage.mesh(stage.group, new THREE.CylinderGeometry(0.008, 0.008, 1, 6), stage.lit(0x40546a, 0, 0.8), [0, 0, 0], [0, 0, 0], false);
    const bob = stage.ball([0, 0, 0], br, 0xc8a978);
    const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
    const E0 = p.m * M.G * L * (1 - Math.cos(th0));
    const bb = bars([half + 1.0, 0.3, -0.3], E0, Math.max(3.4, H + 0.3));
    const V = M.bottomSpeed(p);
    predict(`추를 ${tex(`\\theta_0 = ${p.theta0}^\\circ`)}에서 가만히 놓는다. 재생하기 전에 예측해 보자.`,
      [{ title: `① 가장 낮은 곳의 속력 ${tex('v')}`, label: '가장 낮은 곳의 속력', unit: 'm/s', placeholder: '예 3' },
       { title: '② 반대쪽에서 올라가는 가장 큰 각', label: '반대쪽 가장 큰 각', unit: '°', placeholder: '예 40' }],
      ([vText, angleText]) => {
        const r = M.checkPendulum(p, { vText, angleText });
        if (r.vReason === 'unreadable' || r.aReason === 'unreadable') return { ok: false, message: '①과 ②를 숫자로 적자. 예 3.2' };
        const hv = { fullL: `떨어지는 높이는 ${tex('L')}이 아니라 ${tex('L(1 - \\cos\\theta_0)')}이다.`, cos: `높이 차는 ${tex('L\\cos\\theta_0')}이 아니라 ${tex('L - L\\cos\\theta_0')}이다.`, sin: `높이 차는 ${tex('L(1 - \\cos\\theta_0)')}이다.`, value: `${tex('\\tfrac{1}{2}mv^2 = mgL(1 - \\cos\\theta_0)')}을 풀자.` }[r.vReason] ?? '';
        const ha = { less: '역학적 에너지가 보존되므로 처음과 같은 높이, 곧 같은 각까지 올라간다.', more: '처음보다 높이 올라가면 역학적 에너지가 늘어야 한다.' }[r.aReason] ?? '';
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hv, ha].filter(Boolean).join(' ')}<br>${tex(`v = \\sqrt{2gL(1 - \\cos\\theta_0)} = ${N(V)}\\ \\mathrm{m/s}`)}<br>${tex(`\\theta_{\\max} = ${p.theta0}^\\circ`)}` };
      });
    cur = {
      render(o) {
        const b = [L * Math.sin(o.theta), H - L * Math.cos(o.theta), 0];
        bob.position.set(...b);
        d.set(b[0] - pivot[0], b[1] - pivot[1], 0);
        string.scale.set(1, d.length(), 1); string.position.set((b[0] + pivot[0]) / 2, (b[1] + pivot[1]) / 2, 0);
        string.quaternion.setFromUnitVectors(up, d.normalize());
        bb.set([o.K, o.U, o.E]);
      },
    };
    stage.setHome({ target: [2.1, Math.max(H, 3.7) / 2 + 0.1, 0], direction: [0, 0.12, 1], distance: 2.5 + 0.95 * (2 * half + 4.8), minDistance: 3, maxDistance: 30 });
    return { legend: [] };
  }

  return {
    build(p) { cur = null; return p.activity === 'pendulum' ? buildPendulum(p) : buildTrack(p); },
    render(o) { if (cur) cur.render(o); },
  };
}
