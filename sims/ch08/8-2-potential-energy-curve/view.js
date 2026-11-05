// 8.3 3D view. A particle (ball) moves along the measuring board. Behind it stands a graph board whose x axis is
// placed on the same positions and scale as the board, so the ball sits right under its point on U(x).
// The E_mec line is dashed; after the check the allowed region K = E_mec − U is filled and turning points marked.
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard } from '../../../core/graph3d.js';
import { vecArrow } from '../../../core/forces3d.js';
import { BAR } from '../../../core/bars3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COL = { force: 0xd55e00, vel: 0x0072b2, U: 0x000000, E: 0x0072b2 };
// Plain text only: core/app.js draws each legend swatch as an <i> element.
const LEGEND = [{ label: '퍼텐셜 에너지', color: '#000000' }, { label: '역학적 에너지', color: '#0072b2' }, { label: '힘 (force)', color: '#d55e00' }];

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const E = M.energyOf(p);
      stage.board(stage.group, -1.0, M.XMAX + 0.8, 2.0, 0);
      stage.floorPlane(-1.45);
      for (const x of [-0.2, M.XMAX]) for (const z of [-0.5, 0.5]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.3, 0.4, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
      const tick = [];
      for (let k = 0; k <= M.XMAX * 2; k++) tick.push([k / 2, 0.012, 0.55], [k / 2, 0.012, 0.75]);
      stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tick.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xd8e5ee })));
      for (let k = 0; k <= 8; k++) stage.label(`${k} m`, [k, 0.05, 0.95], 'measure');
      // Graph board aligned with the board: X(0) = 0 and X(8.5) = 8.5 (margins of core/graph3d.js are 1.35 and 1.05).
      const gb = graphBoard(stage, { origin: [-1.35, 0.8, -1.4], width: M.XMAX + 2.4, height: 4.8, t: [0, M.XMAX], tStep: 1, y: [-5, 15], yStep: 5, tTitle: '<i>x</i> (m)', yTitle: '<i>U</i> (J)' });
      gb.curve(M.U, { color: COL.U, samples: 340, dot: false });
      const Eline = stage.line([gb.at(0, E), gb.at(M.XMAX, E)].map(q => [q[0], q[1], q[2] + 0.03]), COL.E, { dashed: true, dash: 0.18, gap: 0.12 });
      Eline.frustumCulled = false;
      stage.label(`<i>E</i><sub>mec</sub> = ${fmt(E)} J`, [gb.at(M.XMAX, E)[0] - 0.9, gb.at(0, E)[1] + 0.25, gb.Z], 'gval', { dy: 0, priority: 4 });
      // Allowed region E > U filled with the K colour after the check.
      const pts = [];
      const n = 340;
      for (let i = 0; i < n; i++) {
        const a = M.XMAX * i / n, b = M.XMAX * (i + 1) / n, ua = M.U(a), ub = M.U(b);
        if (E <= ua && E <= ub) continue;
        const A = gb.at(a, Math.min(ua, E)), B = gb.at(b, Math.min(ub, E)), C = gb.at(b, E), D = gb.at(a, E);
        pts.push(A, B, C, A, C, D);
      }
      const kMesh = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(pts.map(q => new THREE.Vector3(q[0], q[1], q[2] + 0.01))), new THREE.MeshBasicMaterial({ color: BAR.K, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      kMesh.visible = false; stage.group.add(kMesh);
      const kLab = stage.label('<i>K</i> &gt; 0', gb.at(2.5, (E + M.U(2.5)) / 2), 'axis', { dy: 0, priority: 1 });
      kLab.node.dataset.off = '1';
      const marks = [];
      if (p.activity === 'energy') {
        const tp = M.turning(E);
        for (const x of [tp.left, tp.right]) {
          if (x === null || x < 0) continue;
          const l = stage.line([[x, 0.02, 0.4], [x, 0.02, -0.4]], 0x40546a);
          const g = stage.line([gb.at(x, -5), gb.at(x, E)].map(q => [q[0], q[1], q[2] + 0.02]), 0x40546a, { dashed: true, dash: 0.1, gap: 0.08 });
          const t = stage.label(`반환점 ${fmtFixed(x, 2)} m`, [x, 0.75, -0.6], 'tag', { dy: 0, priority: 2 });
          l.visible = g.visible = false; t.node.dataset.off = '1';
          marks.push({ show() { l.visible = g.visible = true; t.node.dataset.off = ''; } });
        }
        // The marked point for the K question.
        const um = M.U(M.XM);
        stage.mesh(gb.group, new THREE.SphereGeometry(0.09, 16, 12), stage.flat(0x000000), gb.at(M.XM, um), [0, 0, 0], false);
        stage.line([gb.at(M.XM, -5), gb.at(M.XM, 15)].map(q => [q[0], q[1], q[2] + 0.02]), 0x7a8795, { dashed: true, dash: 0.1, gap: 0.08 });
        stage.label(`<i>U</i>(${M.XM} m) = ${fmt(um)} J`, gb.at(M.XM, um), 'gval', { dy: 18, priority: 4 });
      } else {
        for (const [name, x] of Object.entries(M.POINTS)) stage.label(`점 ${name}`, gb.at(x, M.U(x)), 'tag', { dy: -22, priority: 3 });
        for (const [name, x] of Object.entries(M.POINTS)) stage.label(name, [x, 0.05, 0.4], 'tag', { dy: 0, priority: 1 });
      }

      // Particle, force and velocity arrows, and its point on the curve.
      const ball = stage.ball([0, 0.18, 0], 0.18, 0xe8edf2);
      const F = vecArrow(stage, COL.force, { radius: 0.04 }), V = vecArrow(stage, COL.vel, { radius: 0.035 });
      const fl = stage.label(tex('\\vec F'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const dot = stage.mesh(gb.group, new THREE.SphereGeometry(0.12, 18, 12), stage.flat(COL.force), gb.at(0, 0), [0, 0, 0], false);
      const drop = stage.line([[0, 0, 0], [0, 1, 0]], 0x7a8795, { dashed: true, dash: 0.08, gap: 0.06 });
      drop.frustumCulled = false;

      const box = quizBox(ctx.panel, '예측');
      if (p.activity === 'energy') {
        box.text(`입자가 우물 바닥에서 ${tex(`E_{\\text{mec}} = ${N(E)}\\ \\mathrm{J}`)}로 출발한다. 그래프를 읽고 재생 전에 예측해 보자.`);
        const pass = box.choices(`① ${tex('x = 5\\ \\mathrm{m}')}의 언덕을`, [{ value: 'pass', html: '넘어간다' }, { value: 'back', html: '넘지 못하고 되돌아온다' }]);
        box.text(`② ${tex(`x = ${M.XM}\\ \\mathrm{m}`)}에서 운동에너지 ${tex('K')}<small>그곳에 가지 못하면 0</small>`, 'pred');
        const kIn = box.answer({ label: '4 m에서 운동에너지', unit: 'J', placeholder: '예 1.5', onEnter: () => check() });
        const check = () => {
          const r = M.checkEnergy(p, { pass: pass(), KText: kIn.value });
          if (r.passReason === 'empty') { box.feedback(null, '① 하나를 고르자.'); return; }
          if (r.KReason === 'unreadable') { box.feedback(false, '②를 숫자로 적자. 예 1.5'); return; }
          const hp = r.passOk ? '' : `${tex('E_{\\text{mec}}')}과 언덕 꼭대기의 ${tex('U = 3\\ \\mathrm{J}')}을 비교하자. ${tex('E_{\\text{mec}}')}이 더 크면 넘는다.`;
          const hk = { unreachable: `${tex('E_{\\text{mec}} < U(4\\ \\mathrm{m})')}이라 입자가 그곳까지 가지 못한다.`, U: `그 값은 ${tex('U')}다. ${tex('K = E_{\\text{mec}} - U')}이다.`, E: `그 값은 ${tex('E_{\\text{mec}}')}이다. ${tex('U')}를 빼자.`, sum: `${tex('K = E_{\\text{mec}} - U')}다. 더하지 않는다.`, value: `${tex('K = E_{\\text{mec}} - U(x)')} (8.3.4)를 쓰자.` }[r.KReason] ?? '';
          const reach = E >= M.U(M.XM);
          const sol = tex(reach ? `K = ${N(E)} - (${N(M.U(M.XM))}) = ${N(E - M.U(M.XM))}\\ \\mathrm{J}` : 'K = 0');
          box.feedback(r.ok, `${r.ok ? '맞다.' : [hp, hk].filter(Boolean).join(' ')}<br>${sol}<br><small>${M.turning(E).passes ? '언덕 꼭대기보다 에너지가 커서 넘어간 뒤 평평한 곳을 계속 간다.' : '두 반환점 사이를 오간다.'}</small>`);
          ui.revealed = true; kMesh.visible = true; kLab.node.dataset.off = ''; for (const m of marks) m.show();
        };
        box.buttons([{ label: '확인', primary: true, onClick: check }]);
      } else {
        box.text(`점 ${p.point}에 입자를 놓고 +x 방향으로 살짝 민다. 재생하기 전에 어떤 평형인지 골라 보자.`);
        const kind = box.choices(`점 ${p.point}는`, [{ value: 'stable', html: '안정 평형 (stable equilibrium)' }, { value: 'unstable', html: '불안정 평형 (unstable equilibrium)' }, { value: 'neutral', html: '중립 평형 (neutral equilibrium)' }]);
        const check = () => {
          const r = M.checkEquilibrium(p, kind());
          if (r.reason === 'empty') { box.feedback(null, '하나를 고르자.'); return; }
          const why = { stable: '곡선의 바닥이라 벗어나면 힘이 다시 그 점 쪽을 향한다. 그 근처에서 오간다.', unstable: '곡선의 꼭대기라 벗어나면 힘이 더 멀어지는 쪽을 향한다.', neutral: '곡선이 평평해 힘이 0이다. 밀어 준 속력 그대로 간다.' }[M.KIND[p.point]];
          box.feedback(r.ok, `${r.ok ? '맞다.' : '다르다.'} ${why}`);
          ui.revealed = true;
        };
        box.buttons([{ label: '확인', primary: true, onClick: check }]);
      }

      cur = {
        render(o) {
          const x = Math.min(o.x, M.XMAX + 0.6);
          ball.position.set(x, 0.18, 0);
          const L = Math.min(Math.abs(o.F) * 0.08, 2);
          F.update([x, 0.18, 0], [Math.sign(o.F) || 1, 0, 0], L); fl.node.dataset.off = L > 0.05 ? '' : '1'; fl.move([x + (Math.sign(o.F) || 1) * (L + 0.25), 0.3, 0]);
          V.update([x, 0.55, 0], [Math.sign(o.v) || 1, 0, 0], Math.min(Math.abs(o.v) * 0.3, 2));
          const q = gb.at(Math.min(Math.max(x, 0), M.XMAX), o.U);
          dot.position.set(...q); dot.visible = x <= M.XMAX;
          const pos = drop.geometry.attributes.position; pos.setXYZ(0, x, 0.4, 0); pos.setXYZ(1, q[0], q[1], q[2]); pos.needsUpdate = true; drop.computeLineDistances();
        },
      };
      stage.setHome({ target: [4.25, 2.6, -0.6], direction: [0, 0.18, 1], distance: 14.5, minDistance: 5, maxDistance: 35 });
      return { legend: LEGEND };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
