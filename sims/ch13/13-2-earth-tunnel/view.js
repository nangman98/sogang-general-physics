// 13.4 3D view. Scene unit = 1000 km. A translucent Earth with a pole-to-pole tunnel along y; the capsule moves on
// it. A translucent orange sphere of radius r shows the inside mass (Fig. 13.4.1). Arrows: gravity (#D55E00) toward
// the center, velocity (#0072B2). A graph board on the right gets F(r) for 0 ≤ r ≤ 2R after the check.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const U = 1e6, R = M.EARTH.R / U;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const s = M.tunnel(), box = quizBox(ctx.panel, '예측');
      const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), new THREE.MeshStandardMaterial({ color: 0x5b8db8, transparent: true, opacity: 0.22, roughness: 0.8, depthWrite: false }));
      stage.group.add(earth);
      stage.mesh(stage.group, new THREE.CylinderGeometry(0.12, 0.12, 2 * R, 16), stage.lit(0x40546a, 0.2, 0.7), [0, 0, 0]);
      stage.label('북극', [0.9, R + 0.4, 0], 'tag', { dy: 0, priority: 1 });
      stage.label('남극', [0.9, -R - 0.4, 0], 'tag', { dy: 0, priority: 1 });
      const inside = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: 0xe69f00, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }));
      stage.group.add(inside);
      const cap = stage.mesh(stage.group, new THREE.BoxGeometry(0.5, 0.7, 0.5), stage.lit(0xd0d6dc, 0.6, 0.35));
      const Fa = vecArrow(stage, 0xd55e00, { radius: 0.09 }), Va = vecArrow(stage, 0x0072b2, { radius: 0.09 });
      const lF = stage.label(tex('\\vec F'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lV = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const Fmax = p.m * s.gs, FS = 3.2 / Fmax, VS = 3.2 / s.vc;
      const yr = niceRange(0, Fmax * 1.1, { target: 4 });
      const gb = graphBoard(stage, { origin: [R + 2.2, -4.3, -1], width: 12, height: 8.6, t: [0, 2], y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>r</i>/<i>R</i>', yTitle: '<i>F</i> (N)' });
      let curve = null;

      box.text(`질량 ${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}인 캡슐이 남극에서 터널로 떨어진다. 재생하기 전에 구해 보자.`);
      box.text(`① 중심에서 ${tex(`r = ${N(p.q, 2)}R`)}일 때 캡슐에 작용하는 중력의 크기 ${tex('F')}`, 'pred');
      const Fi = box.answer({ label: '중력의 크기', unit: 'N', placeholder: '예 800', onEnter: () => check() });
      box.text(`② 지구 중심을 지날 때 캡슐의 속력 ${tex('v')}`, 'pred');
      const vi = box.answer({ label: '중심에서 속력', unit: 'km/s', placeholder: '예 8', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { FText: Fi.value, vText: vi.value });
        if (r.FReason === 'unreadable' || r.vReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 750'); return; }
        const hF = { allMass: `지구 전체 질량을 넣었다. 캡슐보다 바깥 껍질은 알짜 중력을 작용하지 않고 안쪽 질량 ${tex('M_{\\text{ins}} = Mr^3/R^3')}만 당긴다.`, surface: '지표의 무게를 그대로 썼다. 안으로 들어가면 중력이 거리에 비례해 줄어든다.', value: `${tex('F = GmMr/R^3')} (13.4.3)이다.` }[r.FReason] ?? '';
        const hv = { uniformG: `${tex('\\sqrt{2gR}')}는 중력이 일정할 때다. 여기서는 중력이 ${tex('r')}에 비례하므로 용수철처럼 ${tex('W = \\tfrac{1}{2}KR^2')}다.`, units: 'km/s로 적자.', value: `${tex('\\tfrac{1}{2}mv^2 = \\tfrac{1}{2}KR^2')}, ${tex('K = GmM/R^3')}이다.` }[r.vReason] ?? '';
        const Fq = M.force(p.m, p.q * M.EARTH.R);
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hF, hv].filter(Boolean).join(' ')}<br>${tex(`F = \\dfrac{GmM}{R^3}r = ${N(Fq)}\\ \\mathrm{N}`)}<br>${tex(`v = R\\sqrt{K/m} = \\sqrt{GM/R} = ${N(s.vc / 1e3)}\\ \\mathrm{km/s}`)}`);
        if (!curve) { curve = gb.curve(q => M.force(p.m, q * M.EARTH.R), { color: 0xd55e00, tag: v => `${fmt(v)} N` }); gb.mark(p.q, Fq); }
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          const y = o.y / U;
          cap.position.set(0, y, 0);
          const rr = Math.max(Math.abs(y), 1e-3); inside.scale.set(rr, rr, rr);
          const dF = [0, -Math.sign(y), 0], LF = o.F * FS;
          Fa.update([0.45, y, 0], dF, LF); lF.node.dataset.off = LF > 0.05 ? '' : '1'; lF.move([0.95, y + dF[1] * (LF + 0.4), 0]);
          const LV = Math.abs(o.vy) * VS;
          Va.update([-0.45, y, 0], [0, Math.sign(o.vy) || 1, 0], LV); lV.node.dataset.off = LV > 0.05 ? '' : '1'; lV.move([-0.95, y + Math.sign(o.vy) * (LV + 0.4), 0]);
          if (curve) gb.setTime(o.r / M.EARTH.R);
        },
      };
      stage.setHome({ target: [R + 1.6, 0, 0], direction: [0.05, 0.1, 1], distance: 34, minDistance: 8, maxDistance: 120 });
      return { legend: [{ label: '힘 (force)', color: '#d55e00' }, { label: '속도 (velocity)', color: '#0072b2' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
