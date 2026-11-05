// 10.2–10.3 3D view. A wheel standing on the measuring board, facing the camera (rotation about z, counterclockwise
// positive), with a white reference line, a marked point at radius r, and an ω–t graph board beside it.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COL = { vel: 0x0072b2, acc: 0xcc79a7 };

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const lin = p.activity === 'linear', C = [-2.4, 2.1, 0], Rw = M.WHEEL, r = lin ? p.r : 0.8;
      stage.board(stage.group, -5.4, 6.6, 2.4, 0);
      stage.floorPlane(-1.45);
      for (const x of [-4.5, 5.7]) for (const z of [-0.6, 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
      const steel = stage.lit(0x6f8091, 0.6, 0.35);
      for (const z of [-0.35, 0.35]) stage.mesh(stage.group, new THREE.BoxGeometry(0.12, C[1], 0.12), steel, [C[0], C[1] / 2, z]);
      stage.mesh(stage.group, new THREE.CylinderGeometry(0.06, 0.06, 0.9, 16), steel, C, [Math.PI / 2, 0, 0]);
      const wheel = new THREE.Group(); wheel.position.set(...C); stage.group.add(wheel);
      stage.mesh(wheel, new THREE.CylinderGeometry(Rw, Rw, 0.12, 64), stage.lit(0xb8c2cb, 0.5, 0.4), [0, 0, 0], [Math.PI / 2, 0, 0]);
      stage.mesh(wheel, new THREE.TorusGeometry(Rw, 0.05, 10, 80), stage.lit(0x56687a, 0.6, 0.35));
      const ref = stage.mesh(wheel, new THREE.BoxGeometry(Rw, 0.05, 0.02), stage.flat(0xffffff), [Rw / 2, 0, 0.075], [0, 0, 0], false);
      const dot = stage.mesh(wheel, new THREE.SphereGeometry(0.09, 20, 14), stage.flat(0x000000), [r, 0, 0.09], [0, 0, 0], false);
      dot.visible = lin;
      const refTag = stage.label('기준선', [C[0] + Rw + 0.55, C[1], 0.1], 'tag', { dy: 0, priority: -1 });
      // Counterclockwise sense mark.
      const arc = Array.from({ length: 41 }, (_, i) => { const a = 0.2 + 1.2 * i / 40; return [C[0] + (Rw + 0.35) * Math.cos(a), C[1] + (Rw + 0.35) * Math.sin(a), 0]; });
      stage.line(arc, 0x7a8795);
      stage.label('+ (시계 반대)', [C[0] + (Rw + 0.6) * Math.cos(1.5), C[1] + (Rw + 0.6) * Math.sin(1.5), 0], 'gtick', { dy: 0, priority: 1 });
      const V = vecArrow(stage, COL.vel, { radius: 0.035 }), At = vecArrow(stage, COL.acc, { radius: 0.03 }), Ar = vecArrow(stage, COL.acc, { radius: 0.03 });
      const lv = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lt = stage.label(tex('\\vec a_t'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lr = stage.label(tex('\\vec a_r'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });

      const T = p.t1, ws = [p.w0, p.w0 + p.alpha * T], wr = niceRange(Math.min(...ws, 0) - 0.2, Math.max(...ws, 0) + 0.2, { target: 4 });
      const gb = graphBoard(stage, { origin: [0.2, 0.7, -0.6], width: 6.2, height: 3.6, t: [0, T], y: [wr.min, wr.max], yStep: wr.step, yTitle: '<i>ω</i> (rad/s)' });
      gb.curve(t => p.w0 + p.alpha * t, { color: 0x0072b2, tag: v => `<i>ω</i> = ${fmt(v, { zero: 1e-9 })} rad/s` });

      const s1 = M.stateAt(T, { ...p, r });
      const box = quizBox(ctx.panel, '예측');
      box.text(`${tex(`\\omega_0 = ${N(p.w0)}\\ \\mathrm{rad/s}`)}, ${tex(`\\alpha = ${N(p.alpha, 2)}\\ \\mathrm{rad/s^2}`)}이다. ${tex(`t_1 = ${N(T)}\\ \\mathrm{s}`)}일 때를 재생하기 전에 구해 보자.`);
      let check;
      if (lin) {
        box.text(`① 표시점(${tex(`r = ${N(r)}\\ \\mathrm{m}`)})의 속력 ${tex('v')}`, 'pred');
        const a = box.answer({ label: '표시점 속력', unit: 'm/s', placeholder: '예 1.2', onEnter: () => check() });
        box.text(`② 지름 방향 가속도 ${tex('a_r')}`, 'pred');
        const b = box.answer({ label: '지름 방향 가속도', unit: 'm/s²', placeholder: '예 1.8', onEnter: () => check() });
        check = () => {
          const res = M.checkLinear(p, { vText: a.value, aText: b.value });
          if (res.vReason === 'unreadable' || res.aReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 1.2'); return; }
          const hv = { divide: `${tex('v = \\omega r')}다. 나누지 않는다.`, twoPi: `${tex('\\omega')}는 이미 rad/s라 ${tex('2\\pi')}를 곱하지 않는다.`, value: `${tex('v = \\omega r')} (10.3.2), ${tex('\\omega = \\omega_0 + \\alpha t_1')}이다.` }[res.vReason] ?? '';
          const ha = { tangential: `그 값은 접선 가속도 ${tex('a_t = \\alpha r')}다. 지름 가속도는 ${tex('\\omega^2 r')}다.`, total: '그 값은 전체 가속도 크기다.', noSquare: `${tex('\\omega')}를 제곱하자.`, value: `${tex('a_r = \\omega^2 r')} (10.3.7)이다.` }[res.aReason] ?? '';
          box.feedback(res.ok, `${res.ok ? '맞다.' : [hv, ha].filter(Boolean).join(' ')}<br>${tex(`\\omega = ${N(s1.w)}\\ \\mathrm{rad/s},\\ v = |\\omega| r = ${N(Math.abs(s1.v))}\\ \\mathrm{m/s}`)}<br>${tex(`a_r = \\omega^2 r = ${N(s1.ar)}\\ \\mathrm{m/s^2},\\ a_t = \\alpha r = ${N(s1.at)}\\ \\mathrm{m/s^2}`)}`);
          ui.revealed = true; ctx.refresh();
        };
      } else {
        box.text(`① 각속도 ${tex('\\omega')}`, 'pred');
        const a = box.answer({ label: '각속도', unit: 'rad/s', placeholder: '예 1.5', onEnter: () => check() });
        box.text(`② 회전각 ${tex('\\theta - \\theta_0')} (바퀴 수)`, 'pred');
        const b = box.answer({ label: '회전한 바퀴 수', unit: 'rev', placeholder: '예 0.5', onEnter: () => check() });
        check = () => {
          const res = M.checkAngular(p, { wText: a.value, nText: b.value });
          if (res.wReason === 'unreadable' || res.nReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 -0.25'); return; }
          const hw = { sign: '부호를 보자. 시계 반대 방향이 +다.', noW0: `처음 각속도 ${tex('\\omega_0')}를 더하자.`, value: `${tex('\\omega = \\omega_0 + \\alpha t')} (10.2.1)이다.` }[res.wReason] ?? '';
          const hn = { radians: `rad을 rev로 바꾸자. ${tex('1\\ \\mathrm{rev} = 2\\pi\\ \\mathrm{rad}')}`, noHalf: `${tex('\\tfrac{1}{2}')}을 빠뜨렸다.`, finalOnly: '나중 각속도에 시간을 곱했다. 각속도가 변하므로 식 (10.2.2)를 쓴다.', value: `${tex('\\theta - \\theta_0 = \\omega_0 t + \\tfrac{1}{2}\\alpha t^2')} (10.2.2)이다.` }[res.nReason] ?? '';
          box.feedback(res.ok, `${res.ok ? '맞다.' : [hw, hn].filter(Boolean).join(' ')}<br>${tex(`\\omega = ${N(s1.w)}\\ \\mathrm{rad/s}`)}<br>${tex(`\\theta - \\theta_0 = ${N(s1.th)}\\ \\mathrm{rad} = ${N(M.rev(s1.th))}\\ \\mathrm{rev}`)}`);
          ui.revealed = true; ctx.refresh();
        };
      }
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          wheel.rotation.z = o.th;
          refTag.move([C[0] + (Rw + 0.55) * Math.cos(o.th), C[1] + (Rw + 0.55) * Math.sin(o.th), 0.1]);
          if (lin) {
            const c = Math.cos(o.th), s = Math.sin(o.th), P = [C[0] + r * c, C[1] + r * s, 0.12];
            const tdir = [-s, c, 0], inward = [-c, -s, 0];
            const sv = Math.sign(o.w) || 1, sa = Math.sign(p.alpha) || 1;
            const Lv = Math.abs(o.v) * 0.8, Lt = Math.abs(o.at) * 0.5, Lr = o.ar * 0.5;
            V.update(P, tdir.map(x => x * sv), Lv); At.update(P, tdir.map(x => x * sa), Lt); Ar.update(P, inward, Lr);
            lv.node.dataset.off = Lv > 0.03 ? '' : '1'; lt.node.dataset.off = Lt > 0.03 ? '' : '1'; lr.node.dataset.off = Lr > 0.03 ? '' : '1';
            lv.move(P.map((x, i) => x + tdir[i] * sv * (Lv + 0.25))); lt.move(P.map((x, i) => x + tdir[i] * sa * (Lt + 0.25) + inward[i] * 0.2)); lr.move(P.map((x, i) => x + inward[i] * (Lr + 0.25)));
          } else { V.visible = At.visible = Ar.visible = false; lv.node.dataset.off = lt.node.dataset.off = lr.node.dataset.off = '1'; }
          gb.setTime(o.t);
        },
      };
      stage.setHome({ target: [0.6, 2.2, -0.2], direction: [0, 0.1, 1], distance: 13, minDistance: 5, maxDistance: 30 });
      return { legend: lin ? [{ label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' }] : [] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
