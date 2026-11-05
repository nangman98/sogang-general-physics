// 11.9 3D view. A pillar with the support tip O; a light horizontal shaft from O carries the wheel at distance r.
// The precessing group turns about the vertical axis through O by φ; the wheel spins about the shaft (drawn slowed
// by SPIN_VIEW). Arrows: L⃗ (#009E73) along the shaft from the wheel center, M g⃗ (#D55E00) down at the center,
// τ⃗ (#D55E00) horizontal and perpendicular to the shaft at the center after the check.
import { texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const H = 1.3;                 // m, height of the support tip O
const LLEN = 0.7, FLEN = 0.5;  // m, drawn lengths of L⃗ and of M g⃗ (τ⃗ is drawn as long as M g⃗ times r/0.3)

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const s = M.gyro(p), box = quizBox(ctx.panel, '예측');
      stage.floorPlane(0);
      const steel = stage.lit(0x6f8091, 0.6, 0.35);
      stage.mesh(stage.group, new THREE.CylinderGeometry(0.3, 0.36, 0.08, 40), stage.lit(0x273846, 0.4, 0.4), [0, 0.04, 0]);
      stage.mesh(stage.group, new THREE.CylinderGeometry(0.035, 0.045, H - 0.08, 20), steel, [0, H / 2 - 0.04, 0]);
      stage.mesh(stage.group, new THREE.ConeGeometry(0.045, 0.08, 20), steel, [0, H - 0.04, 0]);
      stage.label('O', [-0.13, H - 0.12, 0.06], 'qty', { dy: 0, priority: 1 });

      const P = new THREE.Group(); P.position.set(0, H, 0); stage.group.add(P);
      stage.mesh(P, new THREE.CylinderGeometry(0.014, 0.014, p.r + 0.12, 12), stage.lit(0xd0d6dc, 0.7, 0.3), [(p.r + 0.12) / 2 - 0.01, 0, 0], [0, 0, Math.PI / 2]);
      const W = new THREE.Group(); W.position.set(p.r, 0, 0); P.add(W);
      stage.mesh(W, new THREE.CylinderGeometry(p.Rw, p.Rw, 0.05, 64), stage.lit(0xb8c2cb, 0.5, 0.4), [0, 0, 0], [0, 0, Math.PI / 2]);
      stage.mesh(W, new THREE.TorusGeometry(p.Rw, 0.02, 10, 80), stage.lit(0x56687a, 0.6, 0.35), [0, 0, 0], [0, Math.PI / 2, 0]);
      for (const sx of [-1, 1]) stage.mesh(W, new THREE.BoxGeometry(0.006, p.Rw * 0.9, 0.03), stage.flat(0xffffff), [sx * 0.029, p.Rw * 0.45, 0], [0, 0, 0], false);

      const La = vecArrow(stage, 0x009e73, { radius: 0.03 }), Fa = vecArrow(stage, 0xd55e00, { radius: 0.022 }), Ta = vecArrow(stage, 0xd55e00, { radius: 0.022 });
      const lL = stage.label(tex('\\vec L'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lF = stage.label(tex('M\\vec g'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lT = stage.label(tex('\\vec\\tau'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const TLEN = FLEN * p.r / 0.3;
      // Circle traced by the head of L⃗ (shown after the check).
      const Rc = p.r + s.dir * LLEN;
      const circle = stage.line(Array.from({ length: 97 }, (_, i) => { const a = 2 * Math.PI * i / 96; return [Math.abs(Rc) * Math.cos(a), H, -Math.abs(Rc) * Math.sin(a)]; }), 0x009e73, { dashed: true, dash: 0.06, gap: 0.05 });

      box.text(`질량 ${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}, 반지름 ${tex(`R_w = ${N(p.Rw)}\\ \\mathrm{m}`)}인 바퀴가 ${tex(`\\omega = ${N(p.w)}\\ \\mathrm{rad/s}`)}로 자전한다. 바퀴 중심은 받침점 O에서 ${tex(`r = ${N(p.r)}\\ \\mathrm{m}`)}이다. 재생하기 전에 예측해 보자.`);
      box.text(`① 세차 각속도 ${tex('\\Omega')}`, 'pred');
      const oi = box.answer({ label: '세차 각속도', unit: 'rad/s', placeholder: '예 1.2', onEnter: () => check() });
      const pick = box.choices('② 위에서 볼 때 축이 도는 방향', [{ value: 'ccw', html: '시계 반대 방향' }, { value: 'cw', html: '시계 방향' }]);
      const check = () => {
        const r = M.check(p, { OText: oi.value, pick: pick() });
        if (r.OReason === 'unreadable') { box.feedback(false, '①을 숫자로 적자. 예 1.5'); return; }
        if (r.pickReason === 'empty') { box.feedback(false, '②에서 방향을 하나 고르자.'); return; }
        const hO = { inverse: `${tex('\\Omega = Mgr/I\\omega')}다. 분자와 분모를 바꿨다.`, hoopI: `바퀴는 원판이라 ${tex('I = \\tfrac{1}{2}MR_w^2')}이다.`, twoPi: `${tex('\\Omega')}는 rad/s다. ${tex('2\\pi')}를 곱하지 않는다.`, value: `${tex('\\tau = Mgr')}, ${tex('L = I\\omega')}로 식 (11.9.6)을 쓰자.` }[r.OReason] ?? '';
        const hp = r.pickOk ? '' : `${tex('d\\vec L')}은 ${tex('\\vec\\tau = \\vec r \\times M\\vec g')} 방향이다. ${tex('\\vec L')}의 머리가 그 방향으로 움직인다.`;
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hO, hp].filter(Boolean).join(' ')}<br>${tex(`\\Omega = \\dfrac{Mgr}{I\\omega} = \\dfrac{2gr}{R_w^2\\omega} = ${N(s.Om)}\\ \\mathrm{rad/s}`)}<br>위에서 볼 때 ${s.turn === 'ccw' ? '시계 반대 방향' : '시계 방향'}으로 돈다. 질량은 지워진다.`);
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          P.rotation.y = o.phi;
          W.rotation.x = o.psi * M.SPIN_VIEW;
          const e = o.shaft, C = [p.r * e[0], H, p.r * e[2]], d = e.map(c => s.dir * c);
          La.update(C, d, LLEN); lL.move(C.map((x, i) => x + d[i] * (LLEN + 0.12)));
          Fa.update(C, [0, -1, 0], FLEN); lF.move([C[0] + 0.12, H - FLEN - 0.1, C[2]]);
          const tdir = [e[2], 0, -e[0]];                              // r⃗ × (−ŷ) direction for r⃗ ∥ e
          Ta.update(C, tdir, ui.revealed ? TLEN : 0); lT.node.dataset.off = ui.revealed ? '' : '1';
          lT.move(C.map((x, i) => x + tdir[i] * (TLEN + 0.12)));
          circle.visible = ui.revealed;
        },
      };
      stage.setHome({ target: [0, 1.1, 0], direction: [0.35, 0.5, 1], distance: 3.8, minDistance: 1.5, maxDistance: 15 });
      return { legend: [{ label: '각운동량 (angular momentum)', color: '#009e73' }, { label: '힘과 돌림힘 (force, torque)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
