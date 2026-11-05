// 13.1–13.2 3D view. Top view of a board; positions at K = 1.6 scene units per cm. Model (x, y) maps to scene (x, 0, −y).
// Particle 1 at the origin with its force arrows (#D55E00, tails on particle 1, Fig. 13.2.1b–c). After the check:
// the net force and a faint copy of F⃗13 placed head-to-tail at the tip of F⃗12 (Fig. 13.2.1d).
import { texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, dashLine } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const FORCE = 0xd55e00, Y = 0.3, K = 1.6;          // K: scene units per cm

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;

  return {
    build(p) {
      ui.revealed = false;
      const s = M.forces(p), box = quizBox(ctx.panel, '예측');
      const pos = (r, phi) => [K * r * Math.cos(phi * Math.PI / 180), Y, -K * r * Math.sin(phi * Math.PI / 180)];
      stage.mesh(stage.group, new THREE.BoxGeometry(15, 0.2, 15), stage.lit(0xe9edf1, 0.05, 0.9), [0, -0.1, 0]);
      stage.line([[-7, 0.01, 0], [7, 0.01, 0]], 0x40546a); stage.line([[0, 0.01, 7], [0, 0.01, -7]], 0x40546a);
      stage.label(tex('x'), [7.3, 0, 0], 'qty', { dy: 0, priority: 0 }); stage.label(tex('y'), [0, 0, -7.3], 'qty', { dy: 0, priority: 0 });
      const ballR = m => 0.22 + 0.1 * Math.cbrt(m);
      const parts = [[p.m1, [0, Y, 0], '1'], [p.m2, pos(p.r2, p.phi2), '2'], [p.m3, pos(p.r3, p.phi3), '3']];
      for (const [m, P, n] of parts) {
        stage.mesh(stage.group, new THREE.SphereGeometry(ballR(m), 28, 18), stage.lit(0x6f8091, 0.4, 0.4), P);
        stage.label(`${tex(`m_${n}`)}`, [P[0] - 0.45, P[1], P[2] + 0.45], 'qty', { dy: 0, priority: 1 });
      }
      for (const [r, phi] of [[p.r2, p.phi2], [p.r3, p.phi3]]) {
        dashLine(stage, [0, Y, 0], pos(r, phi), 0x7a8795, { dash: 0.15, gap: 0.1 });     // distances are in the question text
      }
      // The longest force arrow is 0.7 of the nearer particle distance, so arrows never reach a particle.
      const S = 0.7 * K * Math.min(p.r2, p.r3) / Math.max(s.F12, s.F13, s.F);
      const dir = v => { const n = Math.hypot(...v); return [v[0] / n, 0, -v[1] / n]; };
      const A12 = vecArrow(stage, FORCE, { radius: 0.06 }), A13 = vecArrow(stage, FORCE, { radius: 0.06 });
      A12.update([0, Y + 0.05, 0], dir(s.v12), s.F12 * S); A13.update([0, Y + 0.05, 0], dir(s.v13), s.F13 * S);
      const tip = (v, L) => dir(v).map((c, i) => c * L + [0, Y + 0.05, 0][i]);
      stage.label(tex('\\vec F_{12}'), tip(s.v12, s.F12 * S + 0.45), 'qty', { dy: 0, priority: 2 });
      stage.label(tex('\\vec F_{13}'), tip(s.v13, s.F13 * S + 0.45), 'qty', { dy: 0, priority: 2 });
      const Anet = vecArrow(stage, FORCE, { radius: 0.085 }), Acopy = vecArrow(stage, FORCE, { radius: 0.05, opacity: 0.35 });
      const lnet = stage.label(tex('\\vec F_{1,\\text{net}}'), tip(s.net, s.F * S + 0.55), 'qty', { dy: 0, priority: 3 });
      lnet.node.dataset.off = '1';

      box.text(`입자 1 (${tex(`m_1 = ${N(p.m1)}\\ \\mathrm{kg}`)})에 입자 2 (${tex(`${N(p.m2)}\\ \\mathrm{kg}`)}, ${tex(`${N(p.r2)}\\ \\mathrm{cm}`)}, ${tex(`${p.phi2}^\\circ`)})와 입자 3 (${tex(`${N(p.m3)}\\ \\mathrm{kg}`)}, ${tex(`${N(p.r3)}\\ \\mathrm{cm}`)}, ${tex(`${p.phi3}^\\circ`)})이 중력을 작용한다. 확인하기 전에 구해 보자.`);
      box.text(`① 입자 1에 작용하는 알짜힘의 크기 (${tex('10^{-6}\\ \\mathrm{N}')} 단위)`, 'pred');
      const Fi = box.answer({ label: '알짜힘 크기', unit: '× 10⁻⁶ N', placeholder: '예 3.5', onEnter: () => check() });
      box.text(`② 알짜힘의 방향 ${tex('\\theta')} (+${tex('x')}축에서 시계 반대 방향)`, 'pred');
      const ai = box.answer({ label: '알짜힘 방향', unit: '°', placeholder: '예 120', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { FText: Fi.value, aText: ai.value });
        if (r.FReason === 'unreadable' || r.aReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 2.5'); return; }
        const hF = { scalarSum: '힘의 크기를 그냥 더했다. 방향이 다르면 벡터로 더한다.', notSquared: `거리를 제곱하지 않았다. ${tex('F = Gm_1m_2/r^2')}다.`, value: '각 힘을 성분으로 나누어 더하자. 거리는 m로 바꾼다.' }[r.FReason] ?? '';
        const ha = { quadrant: `반대 방향이다. 계산기의 역탄젠트는 ${tex('-90^\\circ')}와 ${tex('90^\\circ')} 사이만 주므로 성분의 부호로 사분면을 확인하자.`, value: `${tex('\\tan\\theta = F_y/F_x')}에서 사분면을 확인하자.` }[r.aReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hF, ha].filter(Boolean).join(' ')}<br>${tex(`F_{1,\\text{net},x} = ${N(s.net[0] * 1e6)},\\ F_{1,\\text{net},y} = ${N(s.net[1] * 1e6)}\\ (10^{-6}\\ \\mathrm{N})`)}<br>${tex(`F_{1,\\text{net}} = ${N(s.F * 1e6)} \\times 10^{-6}\\ \\mathrm{N},\\ \\theta = ${N(s.angle)}^\\circ`)}`);
        Anet.update([0, Y + 0.08, 0], dir(s.net), s.F * S); lnet.node.dataset.off = '';
        Acopy.update(tip(s.v12, s.F12 * S), dir(s.v13), s.F13 * S);
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
      Anet.visible = false; Acopy.visible = false;
      stage.setHome({ target: [0, 0, 0.3], direction: [0, 2.4, 1], distance: 16, minDistance: 4, maxDistance: 40 });
      return { legend: [{ label: '힘 (force)', color: '#d55e00' }] };
    },
    render() {},
  };
}
