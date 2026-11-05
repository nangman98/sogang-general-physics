// 9.4 3D view. A wall at the left end of the measuring board, a ball flying in and bouncing back (squashed in
// proportion to the force, exaggerated), and an F–t board in ms behind it whose area fills during the contact.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { vecArrow } from '../../../core/forces3d.js';
import { FILL_POS } from '../../../core/area3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COL = { force: 0xd55e00, vel: 0x0072b2 };
const LEGEND = [{ label: '힘 (force)', color: '#d55e00' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '충격량 넓이', color: '#e69f00' }];

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const s = M.setup(p), sh = M.pulseShape(s.shape, s.Fmax, s.dt), R = 0.45, dtMs = s.dt * 1000;
      stage.board(stage.group, -1.0, 9.6, 2.2, 0);
      stage.floorPlane(-1.45);
      for (const x of [-0.2, 8.8]) for (const z of [-0.6, 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.4, 2.2, 2.0), stage.lit(0x6f8091, 0.45, 0.45), [-0.2, 1.1, 0]);
      const ball = stage.ball([0, 0, 0], R, 0xe8edf2);
      const V = vecArrow(stage, COL.vel, { radius: 0.04 }), F = vecArrow(stage, COL.force, { radius: 0.05 });
      const fl = stage.label(tex('\\vec F'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), vl = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const yr = niceRange(0, s.Fmax * 1.12, { target: 4 });
      const gb = graphBoard(stage, { origin: [0.6, 1.2, -1.8], width: 8.2, height: 3.8, t: [0, dtMs], y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>t</i> (ms)', yTitle: '<i>F</i> (N)' });
      gb.curve(tm => sh.f(tm / 1000), { color: COL.force, samples: 160, tag: v => `<i>F</i> = ${fmt(v, { zero: 1e-9 })} N` });
      // Area under F(t) up to the current time, one mesh of up to 80 strips.
      const n = 80, pos = new Float32Array(n * 18), geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: FILL_POS, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      fill.frustumCulled = false; gb.group.add(fill);
      const plus = stage.label('+', gb.at(dtMs / 2, s.Fmax * 0.3), 'axis', { dy: 0, priority: 1 }); plus.node.dataset.off = '1';
      const avgLine = stage.line([gb.at(0, s.Favg), gb.at(dtMs, s.Favg)].map(q => [q[0], q[1], q[2] + 0.02]), 0x40546a, { dashed: true, dash: 0.16, gap: 0.1 });
      const avgLab = stage.label(`<i>F</i><sub>avg</sub> = ${fmt(s.Favg)} N`, gb.at(dtMs * 0.08, s.Favg), 'gval', { dy: -14, priority: 4 });
      avgLine.visible = false; avgLab.node.dataset.off = '1';
      const drawFill = tm => {
        const u = Math.min(Math.max(tm, 0), dtMs);
        let k = 0;
        for (let i = 0; i < n; i++) {
          const a = u * i / n, b = u * (i + 1) / n;
          if (b <= a) break;
          const A = gb.at(a, 0), B = gb.at(b, 0), C = gb.at(b, sh.f(b / 1000)), D = gb.at(a, sh.f(a / 1000));
          for (const v of [A, B, C, A, C, D]) { pos.set([v[0], v[1], v[2] + 0.006], k * 3); k++; }
        }
        geo.setDrawRange(0, k); geo.attributes.position.needsUpdate = true;
        plus.node.dataset.off = u > dtMs * 0.3 ? '' : '1';
      };

      const box = quizBox(ctx.panel, '예측');
      let check = () => {};
      if (p.activity === 'cushion') {
        box.text(`${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}의 공이 ${tex(`v = ${N(p.vin)}\\ \\mathrm{m/s}`)}로 와서 벽에 멈춘다. 접촉 시간은 ${tex(`\\Delta t = ${p.dtc}\\ \\mathrm{ms}`)}다. 재생하기 전에 구해 보자.`);
        box.text(`① 평균 힘 ${tex('F_{\\text{avg}}')}`, 'pred');
        const fi = box.answer({ label: '평균 힘', unit: 'N', placeholder: '예 150', onEnter: () => check() });
        check = () => {
          const r = M.checkCushion(p, { FText: fi.value });
          if (r.reason === 'unreadable') { box.feedback(false, '①을 숫자로 적자. 예 150'); return; }
          const h = { peak: '그 값은 최대 힘이다. 평균은 충격량을 시간으로 나눈다.', ms: `${tex('\\Delta t')}를 s로 바꾸자. ${tex(`${p.dtc}\\ \\mathrm{ms} = ${N(p.dtc / 1000)}\\ \\mathrm{s}`)}`, noTime: `그 값은 충격량 ${tex('J = mv')}다. ${tex('\\Delta t')}로 나누자.`, value: `${tex('F_{\\text{avg}} = J/\\Delta t = mv/\\Delta t')}이다.` }[r.reason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : h}<br>${tex(`J = mv = ${N(s.J)}\\ \\mathrm{N\\cdot s}`)}<br>${tex(`F_{\\text{avg}} = \\dfrac{J}{\\Delta t} = ${N(s.Favg)}\\ \\mathrm{N}`)}`);
          reveal();
        };
      } else {
        box.text(`${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}의 공이 ${tex(`${N(p.vin)}\\ \\mathrm{m/s}`)}로 벽에 와서 그래프의 힘을 받는다. 재생하기 전에 구해 보자.`);
        box.text(`① 충격량 ${tex('J')}`, 'pred');
        const ji = box.answer({ label: '충격량', unit: 'N·s', placeholder: '예 4.5', onEnter: () => check() });
        box.text(`② 나중 속도 ${tex('v_f')}<small>벽에서 멀어지면 +</small>`, 'pred');
        const vi = box.answer({ label: '나중 속도', unit: 'm/s', placeholder: '예 2.5', onEnter: () => check() });
        check = () => {
          const r = M.checkPulse(p, { JText: ji.value, vText: vi.value });
          if (r.JReason === 'unreadable' || r.vReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 -1.5'); return; }
          const hJ = { rectangle: `직사각형 ${tex('F_{\\max}\\Delta t')}로 셌다. ${s.shape === 'sine' ? '반 사인 아래 넓이는' : '삼각형 넓이는'} 그보다 작다.`, ms: `${tex('\\Delta t')}를 s로 바꾸자.`, triangle: `반 사인 넓이는 ${tex('\\tfrac{2}{\\pi}F_{\\max}\\Delta t')}다.`, value: `넓이를 구하자. ${s.shape === 'sine' ? tex('J = \\tfrac{2}{\\pi}F_{\\max}\\Delta t') : tex('J = \\tfrac{1}{2}F_{\\max}\\Delta t')}` }[r.JReason] ?? '';
          const hv = { noSign: `처음 속도는 벽 쪽이라 ${tex('-v')}다.`, sign: '방향(부호)을 보자. 충격량이 처음 운동량보다 크면 튀어 나간다.', noVi: `처음 운동량 ${tex('-mv')}를 넣자. ${tex('mv_f = -mv + J')}이다.`, value: `${tex('mv_f - m(-v) = J')}이다.` }[r.vReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [hJ, hv].filter(Boolean).join(' ')}<br>${tex(`J = ${N(s.J)}\\ \\mathrm{N\\cdot s}`)}<br>${tex(`v_f = -v + \\dfrac{J}{m} = ${N(s.vf)}\\ \\mathrm{m/s}`)}`);
          reveal();
        };
      }
      const reveal = () => { ui.revealed = true; avgLine.visible = true; avgLab.node.dataset.off = ''; ctx.refresh(); };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          const sq = o.squash;
          ball.scale.set(1 - 0.35 * sq, 1 + 0.15 * sq, 1 + 0.15 * sq);
          const cx = R * (1 - 0.35 * sq) + o.x;
          ball.position.set(cx, R + 0.02, 0);
          const vL = Math.abs(o.v) * 0.15;
          V.update([cx, 2 * R + 0.25, 0], [Math.sign(o.v) || 1, 0, 0], vL); vl.node.dataset.off = vL > 0.02 ? '' : '1'; vl.move([cx + (Math.sign(o.v) || 1) * (vL + 0.25), 2 * R + 0.35, 0]);
          const fL = 2 * o.F / s.Fmax;
          F.update([0.02, R + 0.02, 0.6], [1, 0, 0], fL); fl.node.dataset.off = fL > 0.02 ? '' : '1'; fl.move([fL + 0.3, R + 0.02, 0.6]);
          const tm = o.phase === 'approach' ? 0 : o.phase === 'contact' ? o.tPhys * 1000 : dtMs;
          gb.setTime(tm); drawFill(tm);
        },
      };
      stage.setHome({ target: [4.2, 2.2, -0.4], direction: [0, 0.18, 1], distance: 12.5, minDistance: 4, maxDistance: 30 });
      return { legend: LEGEND };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
