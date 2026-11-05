// 11.8 3D view. A horizontal disk on a pedestal, seen obliquely from above. A dark groove along one radius carries
// the moving body; a white stripe on the opposite radius shows the turning. The system angular momentum L⃗ stands on
// the axle (#009E73) with a fixed length. A graph board behind gets ω(t) after the check.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, block } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const TOPY = 0.75;             // m, top face of the disk
const CX = -1.7;               // m, disk axis x (the graph board stands to the right)

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const s = M.system(p), box = quizBox(ctx.panel, '예측');
      stage.floorPlane(0);
      const steel = stage.lit(0x6f8091, 0.6, 0.35);
      stage.mesh(stage.group, new THREE.CylinderGeometry(0.45, 0.55, 0.12, 40), stage.lit(0x273846, 0.4, 0.4), [CX, 0.06, 0]);
      stage.mesh(stage.group, new THREE.CylinderGeometry(0.06, 0.06, TOPY + 0.12, 20), steel, [CX, (TOPY + 0.12) / 2, 0]);
      const g = new THREE.Group(); g.position.set(CX, TOPY - 0.04, 0); stage.group.add(g);
      stage.mesh(g, new THREE.CylinderGeometry(p.R, p.R, 0.08, 72), stage.lit(0xb8c2cb, 0.5, 0.4));
      stage.mesh(g, new THREE.TorusGeometry(p.R, 0.025, 10, 90), stage.lit(0x56687a, 0.6, 0.35), [0, 0, 0], [Math.PI / 2, 0, 0]);
      stage.mesh(g, new THREE.BoxGeometry(p.R, 0.012, 0.07), stage.flat(0x3a4a5a), [p.R / 2, 0.041, 0], [0, 0, 0], false);
      stage.mesh(g, new THREE.BoxGeometry(p.R * 0.95, 0.012, 0.04), stage.flat(0xffffff), [-p.R * 0.475, 0.041, 0], [0, 0, 0], false);
      const sz = 0.12 + 0.05 * Math.cbrt(p.m);
      const body = block(stage, sz, { color: 0xe69f00 }); g.add(body);
      const lm = stage.label(tex('m'), [0, 0, 0], 'qty', { dy: 0, priority: 1 });

      const La = vecArrow(stage, 0x009e73, { radius: 0.045 }), Lh = 1.3;
      La.update([CX, TOPY + 0.02, 0], [0, 1, 0], Lh);
      stage.label(tex('\\vec L'), [CX + 0.25, TOPY + Lh + 0.1, 0], 'qty', { dy: 0, priority: 2 });
      // Counterclockwise sense mark seen from above.
      const arc = Array.from({ length: 41 }, (_, i) => { const a = -0.5 - 1.3 * i / 40; return [CX + (p.R + 0.25) * Math.cos(a), TOPY, -(p.R + 0.25) * Math.sin(a)]; });
      stage.line(arc, 0x7a8795);

      const wr = niceRange(0, 1.15 * Math.max(s.wi, s.wf), { target: 4 });
      const gb = graphBoard(stage, { origin: [0.2, 0.2, -0.9], width: 4.4, height: 3.0, t: [0, M.RUN], y: [wr.min, wr.max], yStep: wr.step, yTitle: '<i>ω</i> (rad/s)' });
      let curve = null;

      box.text(`원판 (${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}, ${tex(`R = ${N(p.R)}\\ \\mathrm{m}`)})이 ${tex(`\\omega_i = ${N(p.w0)}\\ \\mathrm{rad/s}`)}로 돈다. 질량 ${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}인 물체가 ${tex(`r_i = ${N(p.ri)}\\ \\mathrm{m}`)}에서 ${tex(`r_f = ${N(p.rf)}\\ \\mathrm{m}`)}로 기어간다. 재생하기 전에 구해 보자.`);
      box.text(`① 나중 각속도 ${tex('\\omega_f')}`, 'pred');
      const wi = box.answer({ label: '나중 각속도', unit: 'rad/s', placeholder: '예 1.8', onEnter: () => check() });
      box.text(`② 회전 운동에너지의 비 ${tex('K_f/K_i')}`, 'pred');
      const ki = box.answer({ label: '운동에너지 비', unit: '', placeholder: '예 1.2', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { wText: wi.value, kText: ki.value });
        if (r.wReason === 'unreadable' || r.kReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 1.25'); return; }
        const hw = { inverse: `${tex('I_i\\omega_i = I_f\\omega_f')}이므로 ${tex('\\omega_f = \\omega_i I_i/I_f')}다. 비를 거꾸로 썼다.`, same: '관성모멘트가 바뀌면 각속도도 바뀐다. 그대로인 것은 각운동량이다.', bodyOnly: '원판의 관성모멘트도 넣자. 물체만 보면 너무 크게 바뀐다.', hoopI: `원판은 ${tex('I = \\tfrac{1}{2}MR^2')}이다.`, value: `${tex('I = \\tfrac{1}{2}MR^2 + mr^2')}를 처음과 나중에 구해 식 (11.8.3)에 넣자.` }[r.wReason] ?? '';
        const hk = { conserved: '보존되는 것은 각운동량이다. 물체가 기어가며 일을 하므로 운동에너지는 바뀐다.', inverse: `${tex('K = L^2/2I')}이고 ${tex('L')}이 같으므로 ${tex('K_f/K_i = I_i/I_f')}다.`, square: `${tex('K = L^2/2I')}라 비는 제곱하지 않는다.`, value: `${tex('K = \\tfrac{1}{2}I\\omega^2 = L^2/2I')}다.` }[r.kReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hw, hk].filter(Boolean).join(' ')}<br>${tex(`I_i = ${N(s.Ii)},\\ I_f = ${N(s.If)}\\ \\mathrm{kg\\cdot m^2}`)}<br>${tex(`\\omega_f = \\omega_i\\dfrac{I_i}{I_f} = ${N(s.wf)}\\ \\mathrm{rad/s},\\ \\dfrac{K_f}{K_i} = \\dfrac{I_i}{I_f} = ${N(s.Ii / s.If)}`)}`);
        if (!curve) curve = gb.curve(t => M.stateAt(t, p).w, { color: 0x0072b2, tag: v => `<i>ω</i> = ${fmt(v)} rad/s` });
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          g.rotation.y = o.th;
          body.position.set(o.r, 0.04 + sz / 2, 0);
          const c = Math.cos(o.th), sn = Math.sin(o.th), x = o.r;
          lm.move([CX + x * c, TOPY + sz + 0.2, -x * sn]);
          gb.setTime(o.t);
        },
      };
      stage.setHome({ target: [0.9, 1.3, -0.3], direction: [0, 0.4, 1], distance: 8.4, minDistance: 3, maxDistance: 25 });
      return { legend: [{ label: '각운동량 (angular momentum)', color: '#009e73' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
