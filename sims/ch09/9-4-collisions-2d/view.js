// 9.8 3D view seen from above. An air table (the measuring board laid flat and wide), two pucks, dashed paths,
// velocity arrows, and a momentum diagram at the corner: before (one arrow or two head to tail) and after.
// Plane coordinates (x, y) map to the world as (x, top, −y), so +y points away from the viewer (up on the screen).
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COL = { vel: 0x0072b2, mom: 0x009e73 };
const LEGEND = [{ label: '속도 (velocity)', color: '#0072b2' }, { label: '운동량 (momentum)', color: '#009e73' }];
const TOP = 0.02;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;
  const W = ([x, y], h = TOP) => [x, h, -y];

  function puck(color, m) {
    const g = new THREE.Group(), h = 0.06 + 0.03 * Math.cbrt(m);
    stage.mesh(g, new THREE.CylinderGeometry(M.R, M.R, h, 40), stage.lit(color, 0.3, 0.4), [0, h / 2, 0]);
    stage.mesh(g, new THREE.CylinderGeometry(M.R * 0.35, M.R * 0.35, h + 0.02, 24), stage.lit(0x33475b, 0.3, 0.5), [0, h / 2, 0]);
    stage.group.add(g); return g;
  }
  function arrowIn(color, html) {
    const a = vecArrow(stage, color, { radius: 0.03 });
    const l = stage.label(tex(html), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    return { set(from, v, k) { const L = Math.hypot(...v) * k; a.update(W(from, 0.3), [v[0], 0, -v[1]], L); l.node.dataset.off = L > 0.03 ? '' : '1'; const n = Math.hypot(...v) || 1; l.move(W([from[0] + v[0] / n * (L + 0.25), from[1] + v[1] / n * (L + 0.25)], 0.3)); }, hide() { a.visible = false; l.node.dataset.off = '1'; } };
  }

  return {
    build(p) {
      ui.revealed = false;
      const stickMode = p.activity === 'stick';
      stage.board(stage.group, -4.4, 6.2, 8.4, 0, { rails: false });
      stage.floorPlane(-1.45);
      const grid = [];
      for (let x = -4; x <= 6; x++) grid.push([x, 0.012, -4], [x, 0.012, 4]);
      for (let z = -4; z <= 4; z++) grid.push([-4.2, 0.012, z], [6, 0.012, z]);
      stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(grid.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xc2d5e2, transparent: true, opacity: 0.25 })));
      stage.label('+<i>x</i>', [6.3, 0.05, 0], 'axis', { dy: 0 }); stage.label('+<i>y</i>', [0, 0.05, -4.4], 'axis', { dy: 0 });
      const T = M.duration(p);
      const pathPts = (key) => Array.from({ length: 61 }, (_, i) => W(M.stateAt(T * i / 60, p)[key], 0.03));
      const pa = stage.line(pathPts('a'), 0xd8e5ee, { dashed: true, dash: 0.15, gap: 0.1 }), pb = stage.line(pathPts('b'), 0xd8e5ee, { dashed: true, dash: 0.15, gap: 0.1 });
      pa.visible = pb.visible = false;
      const A = puck(0xa9bccb, stickMode ? p.mA : p.m1), B = puck(0x8aa0b4, stickMode ? p.mB : p.m2);
      const ta = stage.label(stickMode ? 'A' : '퍽 1', [0, 0, 0], 'tag', { dy: -22, priority: -1 }), tb = stage.label(stickMode ? 'B' : '퍽 2', [0, 0, 0], 'tag', { dy: -22, priority: -1 });
      const va = arrowIn(COL.vel, '\\vec v_1'), vb = arrowIn(COL.vel, '\\vec v_2');

      // Momentum diagram at the corner (static): before and after, head to tail.
      const o = [2.6, 1.9], k = 1.0;
      let pBefore, pAfter, names;
      if (stickMode) { const s = M.stick(p); pBefore = [[p.mA * p.vA, 0], [0, p.mB * p.vB]]; pAfter = [[(p.mA + p.mB) * s.V[0], (p.mA + p.mB) * s.V[1]]]; names = [['\\vec p_A', '\\vec p_B'], ['\\vec P_f']]; }
      else { const g = M.glancing(p); pBefore = [[p.m1 * p.v1i, 0]]; pAfter = [[p.m1 * g.v1[0], p.m1 * g.v1[1]], [p.m2 * g.v2[0], p.m2 * g.v2[1]]]; names = [['\\vec p_{1i}'], ['\\vec p_{1f}', '\\vec p_{2f}']]; }
      const chain = (list, labels, start) => { let at = start.slice(); list.forEach((v, i) => { const a = arrowIn(COL.mom, labels[i]); a.set(at, v, k); at = [at[0] + v[0] * k, at[1] + v[1] * k]; }); };
      chain(pBefore, names[0], o);
      const afterArrows = [];
      { let at = [o[0], o[1] - 0.25]; pAfter.forEach((v, i) => { const a = arrowIn(COL.mom, names[1][i]); afterArrows.push({ a, at: at.slice(), v }); at = [at[0] + v[0] * k, at[1] + v[1] * k]; a.hide(); }); }
      stage.label('운동량 그림', W([o[0] + 0.8, o[1] + 1.9]), 'station', { dy: 0, priority: 1 });

      const box = quizBox(ctx.panel, '예측');
      let check;
      if (stickMode) {
        const s = M.stick(p);
        box.text(`A(${tex(`${N(p.mA)}\\ \\mathrm{kg}`)})가 ${tex(`${N(p.vA)}\\ \\mathrm{m/s}`)}로 +x, B(${tex(`${N(p.mB)}\\ \\mathrm{kg}`)})가 ${tex(`${N(p.vB)}\\ \\mathrm{m/s}`)}로 +y 방향으로 와서 붙는다. 재생하기 전에 구해 보자.`);
        box.text(`① 붙은 뒤 방향 ${tex('\\theta')} (+x축에서)`, 'pred');
        const a = box.answer({ label: '붙은 뒤 방향', unit: '°', placeholder: '예 45', onEnter: () => check() });
        box.text(`② 붙은 뒤 속력 ${tex('V')}`, 'pred');
        const b = box.answer({ label: '붙은 뒤 속력', unit: 'm/s', placeholder: '예 1.2', onEnter: () => check() });
        check = () => {
          const r = M.checkStick(p, { thText: a.value, VText: b.value });
          if (r.thReason === 'unreadable' || r.VReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 40'); return; }
          const h1 = { noMass: '속도가 아니라 운동량의 비로 방향이 정해진다.', complement: '+x축에서 잰 각이다. 여각을 적었다.', value: `${tex('\\tan\\theta = m_Bv_B/(m_Av_A)')}이다.` }[r.thReason] ?? '';
          const h2 = { scalar: '운동량은 벡터다. 두 성분을 직각으로 더하자.', value: `${tex('V = \\sqrt{(m_Av_A)^2 + (m_Bv_B)^2}/(m_A + m_B)')}이다.` }[r.VReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [h1, h2].filter(Boolean).join(' ')}<br>${tex(`\\theta = ${N(s.theta)}^\\circ,\\ V = ${N(s.speed)}\\ \\mathrm{m/s}`)}`);
          reveal();
        };
      } else {
        const g = M.glancing(p);
        box.text(`퍽 1이 ${tex(`${N(p.v1i)}\\ \\mathrm{m/s}`)}로 와서 정지한 퍽 2의 중심에서 ${tex(`b = ${N(p.b, 2)}\\ \\mathrm{m}`)} 비켜 맞는다. 퍽 반지름은 ${tex(`r = ${M.R}\\ \\mathrm{m}`)}다. 재생하기 전에 구해 보자.`);
        box.text(`① 퍽 2가 나가는 방향 ${tex('\\theta_2')}`, 'pred');
        const a = box.answer({ label: '퍽 2 방향', unit: '°', placeholder: '예 25', onEnter: () => check() });
        box.text(`② 퍽 2의 속력 ${tex('v_{2f}')}`, 'pred');
        const b = box.answer({ label: '퍽 2 속력', unit: 'm/s', placeholder: '예 1.2', onEnter: () => check() });
        check = () => {
          const r = M.checkGlancing(p, { thText: a.value, vText: b.value });
          if (r.thReason === 'unreadable' || r.vReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 25'); return; }
          const h1 = { radius: `맞닿을 때 두 중심 거리는 ${tex('2r')}다. ${tex('\\sin\\theta_2 = b/(2r)')}이다.`, complement: '+x축에서 잰 각이다.', value: `퍽 2는 맞닿은 두 중심을 잇는 방향으로 밀린다. ${tex('\\sin\\theta_2 = b/(2r)')}.` }[r.thReason] ?? '';
          const h2 = { full: '퍽 1의 속력이 모두 넘어가는 것은 정면으로 같은 질량이 부딪힐 때뿐이다.', headOn: '정면 충돌의 값이다. 중심선 방향 성분만 넘어간다.', value: `${tex('v_{2f} = \\dfrac{2m_1}{m_1 + m_2}v_{1i}\\cos\\theta_2')}이다.` }[r.vReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [h1, h2].filter(Boolean).join(' ')}<br>${tex(`\\theta_2 = ${N(g.theta2)}^\\circ,\\ v_{2f} = ${N(g.v2f)}\\ \\mathrm{m/s}`)}<br>${tex(`\\theta_1 = ${N(g.theta1)}^\\circ,\\ v_{1f} = ${N(g.v1f)}\\ \\mathrm{m/s}`)}`);
          reveal();
        };
      }
      const reveal = () => { ui.revealed = true; pa.visible = pb.visible = true; for (const it of afterArrows) it.a.set(it.at, it.v, k); ctx.refresh(); };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(s) {
          A.position.set(...W(s.a)); B.position.set(...W(s.b));
          ta.move(W(s.a, 0.15)); tb.move(W(s.b, 0.15));
          if (stickMode && s.after) { tb.node.dataset.off = '1'; va.set(s.a, s.va, 0.5); vb.hide(); }
          else { tb.node.dataset.off = ''; va.set(s.a, s.va, 0.5); vb.set(s.b, s.vb, 0.5); }
        },
      };
      stage.setHome({ target: [0.8, 0, -1.1], direction: [0, 1, 0.42], distance: 12.2, minDistance: 5, maxDistance: 30 });
      return { legend: LEGEND };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
