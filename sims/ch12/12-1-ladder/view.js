// 12.2 3D view. A wall on the left (x ≤ 0), the pavement at y = 0 and the ladder from its lower end O = (a, 0) to the
// top (0, h). Forces (#D55E00): F⃗w at the top, F⃗px and F⃗py at O, M g⃗ at the person, m g⃗ at the ladder center.
// forces: the asked forces are grey "= ?" until the check; lines of action (grey dashed) and moment arms from O
// (black dashed). climb: the person climbs; a graph board on the right shows the needed and the maximum friction.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, dashLine, GREY, UNKNOWN_LENGTH } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const rad = d => d * Math.PI / 180;
const FORCE = 0xd55e00;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // Force arrow with label; unknown ones are grey with "= ?" until reveal().
  function force(html, { unknown = false, gap = 0.35 } = {}) {
    const arrow = vecArrow(stage, unknown ? GREY : FORCE, { radius: 0.05 });
    const lab = stage.label(unknown ? `${tex(html)} <span class="val">= ?</span>` : tex(html), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    let hidden = unknown;
    return {
      reveal() { hidden = false; arrow.mat.color.setHex(FORCE); lab.set(tex(html)); },
      set(at, dir, L) {
        const Ld = hidden ? (L > 1e-9 ? UNKNOWN_LENGTH : 0) : L;
        arrow.update(at, dir, Ld); lab.node.dataset.off = Ld > 0.02 ? '' : '1';
        lab.move(at.map((x, i) => x + dir[i] * (Ld + gap)));
      },
    };
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const climb = p.activity === 'climb', box = quizBox(ctx.panel, '예측');
      const th = rad(p.theta), h = p.L * Math.sin(th), a = p.L * Math.cos(th), O = [a, 0, 0];
      const along = d => [a - d * Math.cos(th), d * Math.sin(th), 0];
      stage.floorPlane(0);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.4, h + 1.2, 2.4), stage.lit(0xc9d1d8, 0.1, 0.8), [-0.2, (h + 1.2) / 2, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(a + 2.6, 0.06, 2.4), stage.lit(0x8e99a3, 0.1, 0.9), [(a + 2.6) / 2 - 0.4, 0.03, 0]);
      // Ladder: two rails and rungs in a group whose +y runs from O to the top.
      const lad = new THREE.Group(); lad.position.set(a, 0.06, 0); lad.rotation.z = Math.PI / 2 - th; stage.group.add(lad);
      const wood = stage.lit(0xb08a5a, 0.05, 0.7);
      for (const zz of [-0.25, 0.25]) stage.mesh(lad, new THREE.BoxGeometry(0.07, p.L, 0.07), wood, [0, p.L / 2, zz]);
      // Rungs as one instanced mesh (one draw call).
      const ys = []; for (let y = 0.3; y < p.L - 0.1; y += 0.3) ys.push(y);
      const rungs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 10), wood, ys.length), mtx = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
      ys.forEach((y, i) => rungs.setMatrixAt(i, mtx.compose(new THREE.Vector3(0, y, 0), q, new THREE.Vector3(1, 1, 1))));
      rungs.castShadow = true; lad.add(rungs);
      stage.label('O', [a + 0.18, -0.12, 0.4], 'qty', { dy: 0, priority: 1 });
      // Person: body and head standing on the ladder.
      const person = new THREE.Group(); stage.group.add(person);
      const skin = stage.lit(0x6f8091, 0.3, 0.5);
      stage.mesh(person, new THREE.CylinderGeometry(0.17, 0.2, 1.0, 20), skin, [0, 0.6, 0]);
      stage.mesh(person, new THREE.SphereGeometry(0.15, 20, 14), skin, [0, 1.3, 0]);

      const S = 0.42 * p.L / ((p.M + p.m) * M.G);                  // m per N
      const Fw = force('\\vec F_w', { unknown: !climb }), Fpx = force('\\vec F_{px}', { unknown: !climb }), Fpy = force('\\vec F_{py}', { unknown: !climb });
      const Wp = force('M\\vec g', { gap: 0.3 }), Wl = force('m\\vec g', { gap: 0.3 });
      const lines = [], arms = [];
      let check;

      if (!climb) {
        const s = M.forces(p), P = along(p.d), C = along(p.L / 2);
        // Lines of action (grey) and moment arms from O (black).
        lines.push(dashLine(stage, [-0.05, h, 0.3], [a + 0.6, h, 0.3], 0x7a8795, { dash: 0.12, gap: 0.08 }));
        lines.push(dashLine(stage, [P[0], 0, 0.3], [P[0], P[1] + 1.2, 0.3], 0x7a8795, { dash: 0.12, gap: 0.08 }));
        lines.push(dashLine(stage, [C[0], 0, 0.3], [C[0], C[1], 0.3], 0x7a8795, { dash: 0.12, gap: 0.08 }));
        arms.push(dashLine(stage, [a, 0.02, 0.3], [a, h, 0.3], 0x000000, { dash: 0.08, gap: 0.06 }));
        arms.push(dashLine(stage, [a, 0.55, 0.3], [P[0], 0.55, 0.3], 0x000000, { dash: 0.08, gap: 0.06 }));
        arms.push(dashLine(stage, [a, 0.15, 0.3], [C[0], 0.15, 0.3], 0x000000, { dash: 0.08, gap: 0.06 }));
        stage.label(tex('h'), [a + 0.25, h / 2, 0.3], 'qty', { dy: 0, priority: 1 });
        stage.label(tex('d\\cos\\theta'), [Math.min(P[0], C[0]) - 0.55, 0.55, 0.3], 'qty', { dy: 0, priority: 1 });
        stage.label(tex('\\tfrac{L}{2}\\cos\\theta'), [Math.min(P[0], C[0]) - 0.55, 0.12, 0.3], 'qty', { dy: 0, priority: 1 });

        box.text(`길이 ${tex(`L = ${N(p.L)}\\ \\mathrm{m}`)}, 질량 ${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}인 고른 사다리가 ${tex(`\\theta = ${p.theta}^\\circ`)}로 마찰 없는 벽에 기대 있다. 질량 ${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}인 사람이 사다리를 따라 ${tex(`d = ${N(p.d)}\\ \\mathrm{m}`)}에 서 있다. 확인하기 전에 구해 보자.`);
        box.text(`① 벽의 힘 ${tex('F_w')}`, 'pred');
        const wi = box.answer({ label: '벽의 힘', unit: 'N', placeholder: '예 300', onEnter: () => check() });
        box.text(`② 바닥의 수직항력 ${tex('F_{py}')}`, 'pred');
        const yi = box.answer({ label: '바닥의 수직항력', unit: 'N', placeholder: '예 800', onEnter: () => check() });
        check = () => {
          const r = M.checkForces(p, { wText: wi.value, yText: yi.value });
          if (r.wReason === 'unreadable' || r.yReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 250'); return; }
          const hw = { swap: `무게의 돌림힘 팔은 수평 거리(${tex('\\cos\\theta')} 쪽), ${tex('F_w')}의 팔은 높이 ${tex('h')}다. 둘을 바꿨다.`, noLadder: '사다리 자신의 무게도 돌림힘을 낸다.', value: `O에 대한 돌림힘 평형 ${tex('-hF_w + (d\\cos\\theta)Mg + (\\tfrac{L}{2}\\cos\\theta)mg = 0')}을 풀자.` }[r.wReason] ?? '';
          const hy = { personOnly: '사다리의 무게도 바닥이 받친다.', ladderOnly: '사람의 무게도 바닥이 받친다.', value: `연직 방향 평형 ${tex('F_{py} - Mg - mg = 0')}이다.` }[r.yReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [hw, hy].filter(Boolean).join(' ')}<br>${tex(`F_w = \\dfrac{g\\cos\\theta\\,(Md + mL/2)}{h} = ${N(s.Fw)}\\ \\mathrm{N} = F_{px}`)}<br>${tex(`F_{py} = (M + m)g = ${N(s.Fpy)}\\ \\mathrm{N}`)}`);
          for (const f of [Fw, Fpx, Fpy]) f.reveal();
          ui.revealed = true; ctx.refresh();
        };
        box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
        const W = Math.max(a + 1.5, 4), Hh = h + 1;
        stage.setHome({ target: [W / 2 - 0.6, Hh / 2, 0], direction: [0.12, 0.12, 1], distance: 2.0 * Math.max(W, Hh) + 1.5, minDistance: 3, maxDistance: 40 });
      } else {
        const r = M.reach(p), fmax = p.mu * (p.M + p.m) * M.G, fTop = M.forces({ ...p, d: p.L }).Fw;
        const yr = niceRange(0, 1.1 * Math.max(fTop, fmax), { target: 4 });
        const gx = a + 1.2, gb = graphBoard(stage, { origin: [gx, 0.3, -0.6], width: 5.4, height: 3.4, t: [0, p.L], y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>d</i> (m)', yTitle: '마찰력 (N)' });
        let shown = false;
        const mark = stage.label('', [0, 0, 0], 'tag', { dy: 0, priority: 3 });
        box.text(`길이 ${tex(`L = ${N(p.L)}\\ \\mathrm{m}`)}, 질량 ${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}인 고른 사다리가 ${tex(`\\theta = ${p.theta}^\\circ`)}로 마찰 없는 벽에 기대 있고 바닥의 정지 마찰 계수는 ${tex(`\\mu_s = ${N(p.mu, 2)}`)}다. 질량 ${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}인 사람이 아래에서 오른다. 재생하기 전에 구해 보자.`);
        box.text(`① 미끄러지기 전까지 사다리를 따라 오를 수 있는 거리 ${tex('d')} <small>끝까지 오르면 ${tex('L')}, 처음부터 미끄러지면 0을 적는다</small>`, 'pred');
        const di = box.answer({ label: '오를 수 있는 거리', unit: 'm', placeholder: '예 2.5', onEnter: () => check() });
        check = () => {
          const res = M.checkClimb(p, { dText: di.value });
          if (res.reason === 'unreadable') { box.feedback(false, '①을 숫자로 적자. 예 2.5'); return; }
          const hint = { noLadder: '사다리 자신의 무게가 내는 돌림힘도 넣자.', personN: `수직항력은 사람과 사다리의 무게를 함께 받친다. ${tex('F_{py} = (M + m)g')}`, value: `${tex('F_{px} = F_w')}가 ${tex('\\mu_s(M + m)g')}에 닿는 ${tex('d')}를 돌림힘 평형에서 구하자.` }[res.reason] ?? '';
          box.feedback(res.ok, `${res.ok ? '맞다.' : hint}<br>${tex(`F_w(d) = \\dfrac{g\\cos\\theta\\,(Md + mL/2)}{L\\sin\\theta} = \\mu_s(M + m)g = ${N(fmax)}\\ \\mathrm{N}`)}<br>${r.top ? `끝 ${tex(`d = L = ${N(p.L)}\\ \\mathrm{m}`)}까지 올라도 미끄러지지 않는다.` : r.start ? '사람이 오르기 전부터 미끄러진다.' : tex(`d = ${N(r.d)}\\ \\mathrm{m}`)}`);
          if (!shown) {
            gb.curve(d => M.forces({ ...p, d }).Fw, { color: FORCE, tag: v => `${tex('F_{px}')} ${fmt(v)} N` });
            gb.curve(() => fmax, { color: FORCE, dotted: true, dot: false, tag: v => `${tex('\\mu_s F_{py}')} ${fmt(v)} N` });
            shown = true;
          }
          ui.revealed = true; ctx.refresh();
        };
        box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
        cur = { graph: gb, mark, r };
        const W = gx + 5.6, Hh = Math.max(h, 3.7) + 0.8;
        stage.setHome({ target: [W / 2 - 0.4, Hh / 2, 0], direction: [0.05, 0.12, 1], distance: 1.75 * Math.max(W / 1.6, Hh) + 2.5, minDistance: 3, maxDistance: 50 });
      }

      const render = o => {
        const P = along(o.d), C = along(p.L / 2);
        person.position.set(P[0], P[1] + 0.06, 0.55);
        Wp.set([P[0], P[1] + 0.66, 0.55], [0, -1, 0], p.M * M.G * S);
        Wl.set([C[0], C[1], 0.3], [0, -1, 0], p.m * M.G * S);
        Fw.set([0.02, h, 0], [1, 0, 0], o.Fw * S);
        Fpx.set([a, 0.06, 0], [-1, 0, 0], o.Fpx * S);
        Fpy.set([a, 0.06, 0], [0, 1, 0], o.Fpy * S);
        if (climb) {
          cur.graph.setTime(o.d);
          const show = o.slip && ui.revealed;
          cur.mark.node.dataset.off = show ? '' : '1';
          if (show) { cur.mark.set('여기서 미끄러지기 시작'); cur.mark.move([P[0] - 0.9, P[1] + 1.7, 0.55]); }
        }
      };
      cur = { ...(cur ?? {}), render };
      return { legend: [{ label: '힘 (force)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
