// 9.1–9.2 3D view. com: three balls on a light triangular frame standing in front of a grid board (x, y in m).
// explode: a cannon on a long measuring board; the shell splits at the top of its path; the center of mass (ring)
// keeps the parabola of the unsplit shell.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COM = 0x000000;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function comMark(parent, size) {
    const g = new THREE.Group(); parent.add(g);
    stage.mesh(g, new THREE.TorusGeometry(size, size * 0.18, 10, 40), stage.flat(COM), [0, 0, 0], [0, 0, 0], false);
    for (const r of [0, Math.PI / 2]) stage.mesh(g, new THREE.BoxGeometry(size * 2.6, size * 0.16, size * 0.16), stage.flat(COM), [0, 0, 0], [0, 0, r], false);
    return g;
  }

  // ---------------- com ----------------
  function buildCom(p) {
    const pts = M.corners(p.a), c = M.comOf(p), ms = [p.m1, p.m2, p.m3];
    const xr = [-0.2, p.a + 0.2], yr = niceRange(-0.2, p.a * 0.87 + 0.2, { includeZero: false, target: 5 });
    const W = 7, Hb = 6;
    const gb = graphBoard(stage, { origin: [-3.5, 0.6, -0.4], width: W, height: Hb, t: xr, tStep: 0.2, y: [-0.2, p.a * 0.87 + 0.25], yStep: 0.2, tTitle: '<i>x</i> (m)', yTitle: '<i>y</i> (m)' });
    stage.board(stage.group, -4.2, 4.2, 2.2, 0);
    stage.floorPlane(-1.45);
    const P = ([x, y]) => { const q = gb.at(x, y); return [q[0], q[1], q[2] + 0.35]; };
    const frame = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => [P(pts[i]), P(pts[j])]);
    stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(frame.flat().map(stage.v3)), new THREE.LineBasicMaterial({ color: 0x40546a })));
    ms.forEach((m, i) => {
      const r = 0.12 + 0.08 * Math.cbrt(m);
      stage.ball(P(pts[i]), r, [0xa9bccb, 0x8aa0b4, 0x6f8091][i]);
      stage.label(`<i>m</i><sub>${i + 1}</sub> = ${fmt(m)} kg`, P(pts[i]), 'tag', { dy: i === 2 ? -36 : 30, priority: 2 });
    });
    const mark = comMark(stage.group, 0.16); mark.position.set(...P([c.x, c.y])); mark.visible = false;
    const markLab = stage.label('질량중심', P([c.x, c.y]), 'tag', { dy: 26, priority: 3 }); markLab.node.dataset.off = '1';

    const box = quizBox(ctx.panel, '예측');
    box.text('세 입자의 질량중심 좌표를 구해 보자.');
    box.text(`① ${tex('x_{\\text{com}}')}`, 'pred');
    const xi = box.answer({ label: '질량중심 x', unit: 'm', placeholder: '예 0.65', onEnter: () => check() });
    box.text(`② ${tex('y_{\\text{com}}')}`, 'pred');
    const yi = box.answer({ label: '질량중심 y', unit: 'm', placeholder: '예 0.40', onEnter: () => check() });
    const check = () => {
      const r = M.checkCom(p, { xText: xi.value, yText: yi.value });
      if (r.xReason === 'unreadable' || r.yReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 0.65'); return; }
      const h = { unweighted: '세 꼭짓점의 단순 평균이다. 질량을 곱해 더하자.', noDivide: `전체 질량 ${tex('M')}으로 나누자.`, value: `${tex('x_{\\text{com}} = \\tfrac{1}{M}\\sum m_i x_i')} (9.1.5)이다.` };
      const msg = r.ok ? '맞다.' : [h[r.xReason], h[r.yReason]].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' ');
      box.feedback(r.ok, `${msg}<br>${tex(`x_{\\text{com}} = ${N(c.x)}\\ \\mathrm{m},\\ y_{\\text{com}} = ${N(c.y)}\\ \\mathrm{m}`)}`);
      ui.revealed = true; mark.visible = true; markLab.node.dataset.off = ''; ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    cur = { render() {} };
    stage.setHome({ target: [0, 3.5, 0], direction: [0, 0.12, 1], distance: 13, minDistance: 5, maxDistance: 30 });
    return { legend: [] };
  }

  // ---------------- explode ----------------
  function buildExplode(p) {
    const s = M.shell(p), right = Math.max(s.x2, s.R) + 8;
    stage.board(stage.group, -6, right, 8, 0);
    stage.floorPlane(-1.45);
    const steel = stage.lit(0x40546a, 0.6, 0.35);
    const barrel = stage.mesh(stage.group, new THREE.CylinderGeometry(0.35, 0.45, 3, 24), steel, [0, 0.9, 0], [0, 0, -(Math.PI / 2 - p.theta0 * Math.PI / 180)]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.9, 0.9, 0.5, 24), steel, [0, 0.35, 0], [Math.PI / 2, 0, 0]);
    const tick = [];
    for (let x = 0; x <= right - 2; x += 5) tick.push([x, 0.02, 3.4], [x, 0.02, 3.9]);
    stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tick.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xd8e5ee })));
    const step = right > 120 ? 20 : 10;
    for (let x = 0; x <= right - 4; x += step) stage.label(`${x} m`, [x, 0.05, 4.4], 'measure');
    const T = 2 * s.tTop;
    const path = stage.line(Array.from({ length: 121 }, (_, i) => { const t = T * i / 120; return [s.vx * t, s.vy * t - 0.5 * M.G * t * t + 0.02, 0]; }), 0x7a8795, { dashed: true, dash: 1.2, gap: 0.8 });
    path.visible = false;
    stage.mesh(stage.group, new THREE.BoxGeometry(0.15, 0.6, 6), stage.lit(0x33475b, 0.4, 0.4), [s.R, 0.3, 0]);
    stage.label(`<i>R</i> = ${fmt(s.R)} m`, [s.R, 1.4, 0], 'tag', { dy: 0, priority: 2 });
    const big = 0.9;
    const shellBall = stage.ball([0, 0, 0], big, 0x6f8091);
    const r1 = big * Math.cbrt(s.m1), r2 = big * Math.cbrt(s.m2);
    const p1 = stage.ball([0, 0, 0], r1, 0x8aa0b4), p2 = stage.ball([0, 0, 0], r2, 0xa9bccb);
    const l1 = stage.label('조각 1', [0, 0, 0], 'tag', { dy: -26, priority: 1 }), l2 = stage.label('조각 2', [0, 0, 0], 'tag', { dy: -26, priority: 1 });
    const link = stage.line([[0, 0, 0], [1, 0, 0]], 0x40546a, { dashed: true, dash: 0.5, gap: 0.3 }); link.frustumCulled = false;
    const mark = comMark(stage.group, 0.7);
    const landing = stage.mesh(stage.group, new THREE.BoxGeometry(0.15, 0.6, 6), stage.lit(0xd55e00, 0.2, 0.5), [s.x2, 0.3, 0]); landing.visible = false;

    const box = quizBox(ctx.panel, '예측');
    box.text(`쪼개지지 않으면 포탄은 ${tex(`R = ${N(s.R)}\\ \\mathrm{m}`)}에 떨어진다. 꼭대기에서 질량 ${tex(`${N(s.m1, 2)}M`)}의 조각 1이 멈춰 곧장 떨어진다. 재생하기 전에 구해 보자.`);
    box.text(`① 조각 2가 떨어지는 곳 ${tex('x_2')}`, 'pred');
    const xi = box.answer({ label: '조각 2가 떨어지는 곳', unit: 'm', placeholder: '예 60', onEnter: () => check() });
    const check = () => {
      const r = M.checkExplode(p, { xText: xi.value });
      if (r.reason === 'unreadable') { box.feedback(false, '①을 숫자로 적자. 예 60'); return; }
      const h = { range: `그 값은 질량중심이 떨어지는 곳이다. 조각 2는 더 멀리 간다.`, equalSplit: '두 조각의 질량이 같을 때의 답이다. 질량 비율을 넣자.', value: `질량중심은 ${tex('R')}에 떨어지고 조각 1은 ${tex('R/2')}에 떨어진다. ${tex('m_1(R/2) + m_2x_2 = MR')}을 풀자.` }[r.reason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : h}<br>${tex(`x_2 = \\dfrac{MR - m_1(R/2)}{m_2} = ${N(s.x2)}\\ \\mathrm{m}`)}`);
      ui.revealed = true; path.visible = true; landing.visible = true; ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);

    cur = {
      render(o) {
        const lift = 0.9;
        shellBall.visible = !o.split; p1.visible = p2.visible = o.split; link.visible = o.split;
        shellBall.position.set(o.com[0], o.com[1] + lift, 0);
        p1.position.set(o.one[0], o.one[1] + lift, 0); p2.position.set(o.two[0], o.two[1] + lift, 0);
        l1.node.dataset.off = l2.node.dataset.off = o.split ? '' : '1';
        l1.move([o.one[0], o.one[1] + lift + r1, 0]); l2.move([o.two[0], o.two[1] + lift + r2, 0]);
        const pos = link.geometry.attributes.position; pos.setXYZ(0, o.one[0], o.one[1] + lift, 0.6); pos.setXYZ(1, o.two[0], o.two[1] + lift, 0.6); pos.needsUpdate = true; link.computeLineDistances();
        mark.position.set(o.com[0], o.com[1] + lift, 1.2);
      },
    };
    const top = s.H + 4;
    stage.setHome({ target: [(right - 6) / 2, top / 2 - 1, 0], direction: [0, 0.1, 1], distance: 4 + (right + 6) * 0.78, minDistance: 10, maxDistance: 400 });
    return { legend: [{ label: '질량중심 (center of mass)', color: '#000000' }] };
  }

  return {
    build(p) { cur = null; ui.revealed = false; return p.activity === 'explode' ? buildExplode(p) : buildCom(p); },
    render(o) { if (cur) cur.render(o); },
  };
}
