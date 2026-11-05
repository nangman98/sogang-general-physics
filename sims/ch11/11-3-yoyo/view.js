// 11.3 3D view. A stand with a horizontal arm; the string hangs from the arm and unwinds from the left edge of the
// axle, so the yo-yo turns clockwise as it falls. The yo-yo (two disks and an axle) is drawn 8 times its size;
// the drop is to scale. Arrows: T⃗ at the string side of the axle, F⃗g at the center, a⃗ after the check.
import { texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const MAG = 8;
const TOP = 2.9;               // m, the arm the string hangs from

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const s = M.yoyo(p), box = quizBox(ctx.panel, '예측');
      const R = p.R * MAG, R0 = p.R0 * MAG, xs = 0;               // string line x
      stage.floorPlane(0);
      const steel = stage.lit(0x6f8091, 0.6, 0.35);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.9, 0.06, 0.6), stage.lit(0x273846, 0.4, 0.4), [-0.75, 0.03, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.06, TOP + 0.05, 0.06), steel, [-0.75, (TOP + 0.05) / 2, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.85, 0.06, 0.06), steel, [-0.35, TOP + 0.02, 0]);

      const g = new THREE.Group(); stage.group.add(g);
      const face = stage.lit(0xe69f00, 0.1, 0.45), gap = Math.max(0.03, 0.4 * R0);
      for (const zz of [-1, 1]) {
        stage.mesh(g, new THREE.CylinderGeometry(R, R, 0.06, 64), face, [0, 0, zz * (gap / 2 + 0.03)], [Math.PI / 2, 0, 0]);
        stage.mesh(g, new THREE.TorusGeometry(R, 0.012, 8, 80), stage.lit(0x5b3f00, 0.2, 0.5), [0, 0, zz * (gap / 2 + 0.06)]);
      }
      stage.mesh(g, new THREE.CylinderGeometry(R0, R0, gap, 32), stage.lit(0xd9c49a, 0, 0.9), [0, 0, 0], [Math.PI / 2, 0, 0]);
      // A white stripe on the front disk shows the turning.
      stage.mesh(g, new THREE.BoxGeometry(R * 0.9, 0.025, 0.01), stage.flat(0xffffff), [R * 0.5, 0, gap / 2 + 0.065], [0, 0, 0], false);
      const xc = xs + R0, y0 = TOP - 0.2 - R;
      const cord = stage.mesh(stage.group, new THREE.CylinderGeometry(0.008, 0.008, 1, 8), stage.lit(0xd9c49a, 0, 0.9), [0, 0, 0], [0, 0, 0], false);

      const T = vecArrow(stage, 0xd55e00, { radius: 0.025 }), W = vecArrow(stage, 0xd55e00, { radius: 0.025 }), A = vecArrow(stage, 0xcc79a7, { radius: 0.022 });
      const lT = stage.label(tex('\\vec T'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lW = stage.label(tex('\\vec F_g'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lA = stage.label(tex('\\vec a_{\\text{com}}'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const S = 0.4 / (p.M * M.G);                                   // m per N, Mg is 0.4 m
      const cm = v => `${N(+(v * 100).toFixed(2))}\\ \\mathrm{cm}`;

      box.text(`질량 ${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}, 바깥 반지름 ${tex(`R = ${cm(p.R)}`)}, 축 반지름 ${tex(`R_0 = ${cm(p.R0)}`)}인 요요를 정지 상태에서 놓는다. 재생하기 전에 구해 보자.`);
      box.text(`① 가속도의 크기 ${tex('|a_{\\text{com}}|')}`, 'pred');
      const ai = box.answer({ label: '가속도 크기', unit: 'm/s²', placeholder: '예 0.7', onEnter: () => check() });
      box.text(`② 줄의 장력 ${tex('T')}`, 'pred');
      const ti = box.answer({ label: '장력', unit: 'N', placeholder: '예 1.1', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { aText: ai.value, TText: ti.value });
        if (r.aReason === 'unreadable' || r.TReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 0.75'); return; }
        const ha = { freefall: '줄이 위로 당기며 요요를 돌리므로 자유 낙하보다 느리다.', outerRadius: `요요는 바깥 반지름 ${tex('R')}이 아니라 축 반지름 ${tex('R_0')}로 구른다.`, value: `식 (11.3.1)에 ${tex('I_{\\text{com}} = \\tfrac{1}{2}MR^2')}을 넣자.` }[r.aReason] ?? '';
        const hT = { weight: `${tex('T = Mg')}면 요요가 가속하지 않는다.`, value: `${tex('T = M(g - |a_{\\text{com}}|)')}다.` }[r.TReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [ha, hT].filter(Boolean).join(' ')}<br>${tex(`|a_{\\text{com}}| = \\dfrac{g}{1 + R^2/2R_0^2} = ${N(s.a)}\\ \\mathrm{m/s^2}`)}<br>${tex(`T = M(g - |a_{\\text{com}}|) = ${N(s.T)}\\ \\mathrm{N}`)}`);
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          const yc = y0 - o.y;
          g.position.set(xc, yc, 0); g.rotation.z = -o.th;            // string on the left: clockwise
          const L = TOP - yc; cord.scale.set(1, L, 1); cord.position.set(xs, yc + L / 2, 0);
          const zf = gap / 2 + 0.12;
          T.update([xs, yc, zf], [0, 1, 0], s.T * S); lT.move([xs - 0.2, yc + s.T * S * 0.6, zf]);
          W.update([xc, yc, zf], [0, -1, 0], p.M * M.G * S); lW.move([xc + 0.2, yc - p.M * M.G * S - 0.1, zf]);
          const La = ui.revealed ? Math.max(s.a * 0.25, 0.08) : 0;
          A.update([xc + R + 0.15, yc, 0], [0, -1, 0], La); lA.node.dataset.off = La > 0 ? '' : '1'; lA.move([xc + R + 0.45, yc - La / 2, 0]);
        },
      };
      stage.setHome({ target: [0, 1.55, 0], direction: [0.15, 0.08, 1], distance: 6.2, minDistance: 1.5, maxDistance: 15 });
      return { legend: [{ label: '힘 (force)', color: '#d55e00' }, { label: '가속도 (acceleration)', color: '#cc79a7' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
