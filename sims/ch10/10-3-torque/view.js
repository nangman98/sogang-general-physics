// 10.6–10.7 3D view. torque: a disk facing the camera on a fixed axle with a white bar r⃗ to the point of force,
// the force arrow, its line of action (grey dashed) and moment arm r⊥ (black dashed), all turning with the disk.
// pulley: the disk on a tall stand with a cord to a hanging block; arrows on the block.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, dashLine, block } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const rad = d => d * Math.PI / 180;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function diskOn(C, R) {
    const steel = stage.lit(0x6f8091, 0.6, 0.35);
    for (const z of [-0.35, 0.35]) stage.mesh(stage.group, new THREE.BoxGeometry(0.1, C[1], 0.1), steel, [C[0], C[1] / 2, z]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.05, 0.05, 0.9, 16), steel, C, [Math.PI / 2, 0, 0]);
    const g = new THREE.Group(); g.position.set(...C); stage.group.add(g);
    stage.mesh(g, new THREE.CylinderGeometry(R, R, 0.1, 64), stage.lit(0xb8c2cb, 0.5, 0.4), [0, 0, 0], [Math.PI / 2, 0, 0]);
    stage.mesh(g, new THREE.TorusGeometry(R, 0.03, 10, 80), stage.lit(0x56687a, 0.6, 0.35));
    return g;
  }
  function boardBase() {
    stage.board(stage.group, -4, 4, 2.4, 0);
    stage.floorPlane(-1.45);
    for (const x of [-3.1, 3.1]) for (const z of [-0.6, 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
  }

  return {
    build(p) {
      ui.revealed = false;
      const s = M.solve(p), box = quizBox(ctx.panel, '예측');
      boardBase();
      let check;
      if (p.activity === 'pulley') {
        const C = [0, 3.6, 0], g = diskOn(C, p.R);
        stage.mesh(g, new THREE.BoxGeometry(p.R, 0.04, 0.02), stage.flat(0xffffff), [p.R / 2, 0, 0.06], [0, 0, 0], false);
        const sz = 0.3 + 0.1 * Math.cbrt(p.m), xb = p.R;
        const blk = block(stage, sz, { color: 0xa9bccb }); stage.group.add(blk);
        const cord = stage.mesh(stage.group, new THREE.CylinderGeometry(0.012, 0.012, 1, 8), stage.lit(0xd9c49a, 0, 0.9), [0, 0, 0], [0, 0, 0], false);
        const y0 = C[1] - 0.4 - sz / 2;
        const T = vecArrow(stage, 0xd55e00, { radius: 0.04 }), W = vecArrow(stage, 0xd55e00, { radius: 0.04 }), A = vecArrow(stage, 0xcc79a7, { radius: 0.035 });
        const lT = stage.label(tex('\\vec T'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lW = stage.label(tex('\\vec F_g'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lA = stage.label(tex('\\vec a'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
        const S = 1.4 / (p.m * M.G);
        box.text(`질량 ${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}, 반지름 ${tex(`R = ${N(p.R)}\\ \\mathrm{m}`)}의 원판 도르래에 ${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}의 블록을 매달았다. 재생하기 전에 구해 보자.`);
        box.text(`① 블록의 가속도 ${tex('a')}`, 'pred');
        const ai = box.answer({ label: '블록 가속도', unit: 'm/s²', placeholder: '예 4.5', onEnter: () => check() });
        box.text(`② 줄의 장력 ${tex('T')}`, 'pred');
        const ti = box.answer({ label: '장력', unit: 'N', placeholder: '예 5', onEnter: () => check() });
        check = () => {
          const r = M.checkPulley(p, { aText: ai.value, TText: ti.value });
          if (r.aReason === 'unreadable' || r.TReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 4.9'); return; }
          const ha = { freefall: '도르래를 돌리는 데 장력이 필요해 블록은 g보다 느리게 내려간다.', hoopI: `원판의 관성모멘트는 ${tex('\\tfrac{1}{2}MR^2')}다.`, noBlockMass: '블록의 질량도 가속된다.', value: `블록 ${tex('mg - T = ma')}, 원판 ${tex('TR = \\tfrac{1}{2}MR^2(a/R)')}를 함께 풀자.` }[r.aReason] ?? '';
          const hT = { weight: `${tex('T = mg')}면 블록이 가속하지 않는다.`, value: `${tex('T = \\tfrac{1}{2}Ma')}다.` }[r.TReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [ha, hT].filter(Boolean).join(' ')}<br>${tex(`a = \\dfrac{mg}{m + M/2} = ${N(s.a)}\\ \\mathrm{m/s^2}`)}<br>${tex(`T = \\tfrac{1}{2}Ma = ${N(s.T)}\\ \\mathrm{N},\\ \\alpha = a/R = ${N(s.alpha)}\\ \\mathrm{rad/s^2}`)}`);
          ui.revealed = true; ctx.refresh();
        };
        box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
        cur = {
          render(o) {
            g.rotation.z = -o.th;                                     // block on the right goes down: clockwise
            const yb = y0 - o.y;
            blk.position.set(xb, yb, 0);
            const top = yb + sz / 2 + 0.04, L = C[1] - top;
            cord.scale.set(1, L, 1); cord.position.set(xb, top + L / 2, 0);
            const c = [xb, yb, 0];
            T.update([xb + 0.02, yb, 0.2], [0, 1, 0], s.T * S); lT.move([xb - 0.25, yb + s.T * S + 0.25, 0.2]);
            W.update([xb + 0.02, yb, 0.2], [0, -1, 0], p.m * M.G * S); lW.move([xb - 0.3, yb - p.m * M.G * S - 0.25, 0.2]);
            const La = ui.revealed ? s.a * 0.15 : 0;
            A.update([xb + sz / 2 + 0.25, yb, 0], [0, -1, 0], La); lA.node.dataset.off = La > 0 ? '' : '1'; lA.move([xb + sz / 2 + 0.55, yb - La / 2, 0]);
          },
        };
        stage.setHome({ target: [0, 2.2, 0], direction: [0, 0.1, 1], distance: 9.5, minDistance: 3, maxDistance: 25 });
        return { legend: [{ label: '힘 (force)', color: '#d55e00' }, { label: '가속도 (acceleration)', color: '#cc79a7' }] };
      }

      // ---- torque ----
      const C = [0, 2.0, 0], g = diskOn(C, p.R);
      const tag = stage.label('', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
      const rBar = stage.mesh(g, new THREE.BoxGeometry(p.r, 0.035, 0.02), stage.flat(0xffffff), [p.r / 2, 0, 0.06], [0, 0, 0], false);
      const F = vecArrow(stage, 0xd55e00, { radius: 0.035 });
      const lF = stage.label(tex('\\vec F'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lr = stage.label(tex('\\vec r'), [0, 0, 0], 'qty', { dy: 0, priority: 1 });
      const act = dashLine(stage, [0, 0, 0], [0, 0, 0], 0x7a8795, { dash: 0.1, gap: 0.07 });
      const arm = dashLine(stage, [0, 0, 0], [0, 0, 0], 0x000000, { dash: 0.06, gap: 0.05 });
      const lArm = stage.label(`${tex('r_\\perp')}`, [0, 0, 0], 'qty', { dy: 0, priority: 1 });
      const S = 0.18;                                                // m per N
      box.text(`원판 (${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}, ${tex(`R = ${N(p.R)}\\ \\mathrm{m}`)})의 축에서 ${tex(`r = ${N(p.r)}\\ \\mathrm{m}`)}인 점에 ${tex(`F = ${N(p.F)}\\ \\mathrm{N}`)}을 ${tex(`\\phi = ${p.phi}^\\circ`)}로 가한다. 재생하기 전에 구해 보자.`);
      box.text(`① 돌림힘 ${tex('\\tau')}`, 'pred');
      const ti = box.answer({ label: '돌림힘', unit: 'N·m', placeholder: '예 1.2', onEnter: () => check() });
      box.text(`② 각가속도 ${tex('\\alpha')}`, 'pred');
      const ai = box.answer({ label: '각가속도', unit: 'rad/s²', placeholder: '예 5', onEnter: () => check() });
      check = () => {
        const r = M.checkTorque(p, { tText: ti.value, aText: ai.value });
        if (r.tReason === 'unreadable' || r.aReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 1.4'); return; }
        const ht = { cos: `${tex('\\cos')}이 아니라 ${tex('\\sin\\phi')}다. 힘의 접선 성분이 돌린다.`, noSin: `${tex('\\sin\\phi')}를 빠뜨렸다.`, rim: `반지름 ${tex('R')}이 아니라 힘이 작용하는 거리 ${tex('r')}을 쓴다.`, value: `${tex('\\tau = rF\\sin\\phi')} (10.6.1)이다.` }[r.tReason] ?? '';
        const ha = { hoopI: `원판은 ${tex('I = \\tfrac{1}{2}MR^2')}이다.`, multiply: `${tex('\\alpha = \\tau/I')}다.`, value: `${tex('\\alpha = \\tau/I')} (10.7.4)이다.` }[r.aReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [ht, ha].filter(Boolean).join(' ')}<br>${tex(`\\tau = rF\\sin\\phi = ${N(s.tau)}\\ \\mathrm{N\\cdot m}`)}<br>${tex(`\\alpha = \\dfrac{\\tau}{\\tfrac{1}{2}MR^2} = ${N(s.alpha)}\\ \\mathrm{rad/s^2}`)}`);
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
      cur = {
        render(o) {
          g.rotation.z = o.th;
          const c = Math.cos(o.th), sn = Math.sin(o.th), P = [C[0] + p.r * c, C[1] + p.r * sn, 0.12];
          const fa = o.th + rad(p.phi), fd = [Math.cos(fa), Math.sin(fa), 0];
          const L = p.F * S;
          F.update(P, fd, L); lF.move(P.map((x, i) => x + fd[i] * (L + 0.25)));
          lr.move([C[0] + p.r / 2 * c - 0.12 * sn, C[1] + p.r / 2 * sn + 0.12 * c, 0.12]);
          act.set(P.map((x, i) => x - fd[i] * 1.5), P.map((x, i) => x + fd[i] * (L + 0.4)));
          // Foot of the perpendicular from the axis to the line of action.
          const d = (C[0] - P[0]) * fd[0] + (C[1] - P[1]) * fd[1], foot = [P[0] + fd[0] * d, P[1] + fd[1] * d, 0.12];
          arm.set([C[0], C[1], 0.12], foot); arm.visible = Math.hypot(foot[0] - C[0], foot[1] - C[1]) > 0.02;
          lArm.move([(C[0] + foot[0]) / 2, (C[1] + foot[1]) / 2, 0.12]); lArm.node.dataset.off = arm.visible ? '' : '1';
        },
      };
      stage.setHome({ target: [0, 1.7, 0], direction: [0, 0.16, 1], distance: 8.6, minDistance: 3, maxDistance: 25 });
      return { legend: [{ label: '힘 (force)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
