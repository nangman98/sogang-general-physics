// 10.5 3D view. race: two bodies spinning about vertical axles on the measuring board under the same torque.
// parallel: a rod spinning about a vertical axle placed h from its center. An ω–t board stands behind.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function body(shape, R, color) {
    const g = new THREE.Group(), mat = stage.lit(color, 0.35, 0.4);
    if (shape === 'hoop') stage.mesh(g, new THREE.TorusGeometry(R, 0.035, 12, 64), mat, [0, 0, 0], [Math.PI / 2, 0, 0]);
    else if (shape === 'disk') stage.mesh(g, new THREE.CylinderGeometry(R, R, 0.06, 48), mat);
    else if (shape === 'sphere') stage.mesh(g, new THREE.SphereGeometry(R, 40, 28), mat);
    else if (shape === 'shell') { const m = stage.mesh(g, new THREE.SphereGeometry(R, 40, 28), stage.lit(color, 0.2, 0.3)); m.material.transparent = true; m.material.opacity = 0.45; stage.mesh(g, new THREE.SphereGeometry(R, 16, 10), new THREE.MeshBasicMaterial({ color: 0x40546a, wireframe: true })); }
    else stage.mesh(g, new THREE.BoxGeometry(2 * R, 0.06, 0.06), mat);
    stage.mesh(g, new THREE.SphereGeometry(0.045, 12, 8), stage.flat(0xd55e00), [R, shape === 'disk' ? 0.04 : 0, 0], [0, 0, 0], false);   // mark to see the turn
    stage.group.add(g); return g;
  }
  function axle(x, h) {
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.035, 0.035, h, 16), stage.lit(0x6f8091, 0.6, 0.35), [x, h / 2, 0]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.22, 0.26, 0.12, 24), stage.lit(0x33475b, 0.4, 0.4), [x, 0.06, 0]);
  }
  function torqueMark(x, y, r) {
    const pts = Array.from({ length: 33 }, (_, i) => { const a = -0.6 + 1.6 * Math.PI * i / 32; return [x + r * Math.cos(a), y, -r * Math.sin(a)]; });
    stage.line(pts, 0xd55e00);
    const end = pts[32], prev = pts[30], head = stage.mesh(stage.group, new THREE.ConeGeometry(0.06, 0.16, 14), stage.flat(0xd55e00), end, [0, 0, 0], false);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(end[0] - prev[0], end[1] - prev[1], end[2] - prev[2]).normalize());
    stage.label(tex('\\tau'), [x + r + 0.2, y, 0], 'qty', { dy: 0, priority: 2 });
  }

  return {
    build(p) {
      ui.revealed = false;
      const s = M.solve(p), race = p.activity === 'race', Y = 1.2;
      stage.board(stage.group, -4.6, 4.6, 2.6, 0);
      stage.floorPlane(-1.45);
      for (const x of [-3.7, 3.7]) for (const z of [-0.7, 0.7]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
      let A, B, offset = 0;
      if (race) {
        axle(-2, Y + 0.25); axle(2, Y + 0.25);
        A = body(p.A, p.R, 0xa9bccb); A.position.set(-2, Y, 0);
        B = body(p.B, p.R, 0x8aa0b4); B.position.set(2, Y, 0);
        stage.label(`A ${M.SHAPES[p.A].label}`, [-2, Y + p.R + 0.5, 0], 'tag', { dy: 0, priority: 1 });
        stage.label(`B ${M.SHAPES[p.B].label}`, [2, Y + p.R + 0.5, 0], 'tag', { dy: 0, priority: 1 });
        torqueMark(-2, 0.35, 0.4); torqueMark(2, 0.35, 0.4);
      } else {
        offset = p.h;
        stage.mesh(stage.group, new THREE.CylinderGeometry(0.04, 0.04, Y + 0.3, 16), stage.lit(0xd55e00, 0.3, 0.4), [0, (Y + 0.3) / 2, 0]);
        stage.mesh(stage.group, new THREE.CylinderGeometry(0.22, 0.26, 0.12, 24), stage.lit(0x33475b, 0.4, 0.4), [0, 0.06, 0]);
        A = new THREE.Group(); A.position.set(0, Y, 0); stage.group.add(A);
        stage.mesh(A, new THREE.BoxGeometry(p.L, 0.07, 0.07), stage.lit(0xa9bccb, 0.35, 0.4), [-offset, 0, 0]);
        const mark = new THREE.Group(); mark.position.set(-offset, 0.09, 0); A.add(mark);
        stage.mesh(mark, new THREE.TorusGeometry(0.07, 0.014, 8, 30), stage.flat(0x000000), [0, 0, 0], [Math.PI / 2, 0, 0], false);
        stage.label(`<i>h</i> = ${fmt(p.h, { zero: 1e-9 })} m`, [0, Y + 0.45, 0], 'tag', { dy: 0, priority: 1 });
        torqueMark(0, 0.35, 0.4);
      }
      const T = M.RUN, wmax = Math.max(s.aA, s.aB ?? 0) * T, wr = niceRange(0, wmax * 1.08, { target: 4 });
      const gb = graphBoard(stage, { origin: [-4.4, 2.6, -1.4], width: 8.8, height: 3.4, t: [0, T], y: [wr.min, wr.max], yStep: wr.step, yTitle: '<i>ω</i> (rad/s)' });
      gb.curve(t => s.aA * t, { color: 0x0072b2, tag: v => (race ? `A ${fmt(v, { zero: 1e-9 })} rad/s` : `<i>ω</i> = ${fmt(v, { zero: 1e-9 })} rad/s`) });
      if (race) gb.curve(t => s.aB * t, { color: 0x0072b2, dotted: true, tag: v => `B ${fmt(v, { zero: 1e-9 })} rad/s` });

      const box = quizBox(ctx.panel, '예측');
      let check;
      if (race) {
        box.text(`두 물체 모두 ${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}, ${tex(`R = ${N(p.R)}\\ \\mathrm{m}`)}이고 같은 ${tex(`\\tau = ${N(p.tau)}\\ \\mathrm{N\\cdot m}`)}로 돌린다. 재생하기 전에 예측해 보자.`);
        const pick = box.choices('① 더 빨리 돌기 시작하는 쪽', [{ value: 'A', html: 'A' }, { value: 'B', html: 'B' }, { value: 'same', html: '같다' }]);
        box.text(`② A의 각가속도 ${tex('\\alpha_A')}`, 'pred');
        const a = box.answer({ label: 'A의 각가속도', unit: 'rad/s²', placeholder: '예 3', onEnter: () => check() });
        check = () => {
          const r = M.checkRace(p, { pick: pick(), aText: a.value });
          if (r.pickReason === 'empty') { box.feedback(null, '① 하나를 고르자.'); return; }
          if (r.aReason === 'unreadable') { box.feedback(false, '②를 숫자로 적자. 예 3.1'); return; }
          const h1 = r.pickOk ? '' : '관성모멘트가 작은 쪽이 같은 돌림힘에 더 크게 각가속된다. 질량이 축 가까이 몰린 물체가 작다.';
          const h2 = { hoopFormula: `${tex('MR^2')}는 고리의 값이다. 모양마다 계수가 다르다 (Table 10.5.1).`, multiply: `${tex('\\alpha = \\tau/I')}다. 곱하지 않는다.`, radius: `${tex('R')}로 한 번 더 나눴다.`, value: `${tex('\\alpha = \\tau/I')}, ${tex(`I_A = ${N(M.SHAPES[p.A].k, 3)}MR^2`)}이다.` }[r.aReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [h1, h2].filter(Boolean).join(' ')}<br>${tex(`I_A = ${N(s.IA)},\\ I_B = ${N(s.IB)}\\ \\mathrm{kg\\cdot m^2}`)}<br>${tex(`\\alpha_A = ${N(s.aA)},\\ \\alpha_B = ${N(s.aB)}\\ \\mathrm{rad/s^2}`)}`);
          ui.revealed = true; ctx.refresh();
        };
      } else {
        box.text(`길이 ${tex(`L = ${N(p.L)}\\ \\mathrm{m}`)}, 질량 ${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}의 막대를 중심에서 ${tex(`h = ${N(p.h, 2)}\\ \\mathrm{m}`)} 떨어진 축으로 ${tex(`\\tau = ${N(p.tau)}\\ \\mathrm{N\\cdot m}`)}의 돌림힘을 준다. 재생하기 전에 구해 보자.`);
        box.text(`① 관성모멘트 ${tex('I')}`, 'pred');
        const a = box.answer({ label: '관성모멘트', unit: 'kg·m²', placeholder: '예 0.4', onEnter: () => check() });
        box.text(`② 각가속도 ${tex('\\alpha')}`, 'pred');
        const b = box.answer({ label: '각가속도', unit: 'rad/s²', placeholder: '예 1.2', onEnter: () => check() });
        check = () => {
          const r = M.checkParallel(p, { IText: a.value, aText: b.value });
          if (r.IReason === 'unreadable' || r.aReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 0.42'); return; }
          const h1 = { noShift: `${tex('Mh^2')}를 더하자 (평행축 정리).`, onlyShift: `${tex('I_{\\text{com}} = \\tfrac{1}{12}ML^2')}도 더하자.`, end: '그 값은 막대 끝을 지나는 축의 값이다.', value: `${tex('I = \\tfrac{1}{12}ML^2 + Mh^2')}이다.` }[r.IReason] ?? '';
          const h2 = { multiply: `${tex('\\alpha = \\tau/I')}다.`, value: `${tex('\\alpha = \\tau/I')} (10.7.4)이다.` }[r.aReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [h1, h2].filter(Boolean).join(' ')}<br>${tex(`I = \\tfrac{1}{12}(${N(p.M)})(${N(p.L)})^2 + (${N(p.M)})(${N(p.h, 2)})^2 = ${N(s.IA)}\\ \\mathrm{kg\\cdot m^2}`)}<br>${tex(`\\alpha = ${N(s.aA)}\\ \\mathrm{rad/s^2}`)}`);
          ui.revealed = true; ctx.refresh();
        };
      }
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          A.rotation.y = o.thA; if (B) B.rotation.y = o.thB;
          gb.setTime(o.t);
        },
      };
      stage.setHome({ target: [0, 2.9, -0.5], direction: [0, 0.2, 1], distance: 13.2, minDistance: 4, maxDistance: 30 });
      return { legend: [{ label: '돌림힘 (torque)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
