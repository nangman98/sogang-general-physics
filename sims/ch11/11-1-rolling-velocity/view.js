// 11.1 3D view. A wheel rolls along the measuring board (x–y plane, facing the camera). Blue arrows show the
// instantaneous velocity of the rim points that are now at the top, front, bottom and back. The asked point has a
// ring; with "split" on, its translation and rotation parts are drawn faint. An orange mark on the rim traces a
// cycloid, drawn dashed after the check.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const R = p.R, travel = p.v * M.RUN, x0 = -travel / 2, Z = 0.2;
      stage.board(stage.group, x0 - 2, x0 + travel + 2, 2.2, 0);
      stage.floorPlane(-1.45);
      for (const x of [x0 - 1.2, x0 + travel + 1.2]) for (const z of [-0.6, 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
      const wheel = new THREE.Group(); stage.group.add(wheel);
      stage.mesh(wheel, new THREE.CylinderGeometry(R, R, 0.12, 64), stage.lit(0xb8c2cb, 0.5, 0.4), [0, 0, 0], [Math.PI / 2, 0, 0]);
      stage.mesh(wheel, new THREE.TorusGeometry(R, 0.04, 10, 80), stage.lit(0x33475b, 0.4, 0.6));
      const spokes = new THREE.InstancedMesh(new THREE.BoxGeometry(2 * R * 0.95, 0.03, 0.02), stage.lit(0x56687a, 0.5, 0.4), 3);
      const Mx = new THREE.Matrix4(); for (let k = 0; k < 3; k++) spokes.setMatrixAt(k, Mx.makeRotationZ(k * Math.PI / 3)); wheel.add(spokes);
      stage.mesh(wheel, new THREE.SphereGeometry(0.06, 16, 12), stage.flat(0xd55e00), [0, -R, 0.08], [0, 0, 0], false);   // mark starts at the bottom
      const cyc = stage.line(Array.from({ length: 161 }, (_, i) => { const s = M.stateAt(M.RUN * i / 160, p); return [x0 + s.mark[0], s.mark[1], 0.1]; }), 0xd55e00, { dashed: true, dash: 0.08, gap: 0.06 });
      cyc.visible = false;
      const spots = { top: 180, front: 90, bottom: 0, back: 270 };
      const arrows = Object.entries(spots).map(([k, b]) => ({ k, b, a: vecArrow(stage, 0x0072b2, { radius: 0.03 }) }));
      const ring = stage.mesh(stage.group, new THREE.TorusGeometry(0.12, 0.02, 8, 30), stage.flat(0x000000), [0, 0, 0], [0, 0, 0], false);
      const tr = vecArrow(stage, 0x0072b2, { radius: 0.022, opacity: 0.35 }), rot = vecArrow(stage, 0x0072b2, { radius: 0.022, opacity: 0.35 }), sum = vecArrow(stage, 0x0072b2, { radius: 0.035 });
      const lsum = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 3 });
      const k = 0.5, beta = M.POINTS[p.pt];

      const box = quizBox(ctx.panel, '예측');
      box.text(`바퀴가 ${tex(`v_{\\text{com}} = ${N(p.v)}\\ \\mathrm{m/s}`)}로 미끄러지지 않고 구른다. 재생하기 전에 구해 보자.`);
      box.text(`① 고리로 표시한 점의 속력 ${tex('v')}`, 'pred');
      const si = box.answer({ label: '표시한 점의 속력', unit: 'm/s', placeholder: '예 2', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { sText: si.value });
        if (r.reason === 'unreadable') { box.feedback(false, '①을 숫자로 적자. 예 2.1'); return; }
        const h = { com: '그 값은 질량중심 속력이다. 회전 속도가 더해진다.', zero: '땅에 닿은 점만 순간적으로 정지해 있다.', sumScalar: `두 속도의 방향이 다르다. 병진 ${tex('v_{\\text{com}}')}(오른쪽)과 회전 ${tex('\\omega R')}(아래)을 벡터로 더하자.`, value: `${tex('\\vec v = \\vec v_{\\text{com}} + \\vec v_{\\text{rot}}')}, ${tex('|\\vec v_{\\text{rot}}| = \\omega R = v_{\\text{com}}')}이다.` }[r.reason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : h}<br>${tex(`v = 2v_{\\text{com}}\\sin(\\beta/2) = ${N(M.pointSpeed(p.v, beta))}\\ \\mathrm{m/s}`)}<br><small>β는 바닥에서 앞쪽으로 잰 각 (${beta}°)이다.</small>`);
        ui.revealed = true; cyc.visible = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: check }]);

      cur = {
        render(o) {
          const cx = x0 + o.xc;
          wheel.position.set(cx, R, 0); wheel.rotation.z = -o.phi;
          for (const it of arrows) {
            const bb = it.b * Math.PI / 180, P = [cx + R * Math.sin(bb), R - R * Math.cos(bb), Z];
            const vv = M.rimVelocity(p.v, R, it.b), L = Math.hypot(...vv) * k;
            it.a.update(P, [vv[0], vv[1], 0], L);
          }
          const bb = beta * Math.PI / 180, P = [cx + R * Math.sin(bb), R - R * Math.cos(bb), Z + 0.02];
          ring.position.set(...P);
          const vv = M.rimVelocity(p.v, R, beta), L = Math.hypot(...vv) * k;
          sum.update(P, [vv[0], vv[1], 0], L);
          lsum.move([P[0] + vv[0] / (Math.hypot(...vv) || 1) * (L + 0.25), P[1] + vv[1] / (Math.hypot(...vv) || 1) * (L + 0.25), P[2]]); lsum.node.dataset.off = L > 0.03 ? '' : '1';
          if (p.split) {
            tr.update([P[0], P[1], P[2] + 0.03], [1, 0, 0], p.v * k);
            const rv = [vv[0] - p.v, vv[1]];
            rot.update([P[0] + p.v * k, P[1], P[2] + 0.03], [rv[0], rv[1], 0], Math.hypot(...rv) * k);
          } else { tr.visible = false; rot.visible = false; }
        },
      };
      stage.setHome({ target: [0, 1.0, 0], direction: [0, 0.15, 1], distance: 4 + (travel + 4) * 0.75, minDistance: 3, maxDistance: 30 });
      return { legend: [{ label: '속도 (velocity)', color: '#0072b2' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
