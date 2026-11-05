// 12.3 3D view. A vise on the left holds a horizontal rod; the force arrow (#D55E00) acts on the free end face,
// pulling (tension) or pushing (compression). The length change is exaggerated so that the end of the linear range
// shows as 30% of L; the rod is drawn 6 times thicker. The graph board stands above and behind the rod. A graph board shows stress against strain with dotted lines
// at the yield and ultimate strengths; the linear line (slope E) and the moving point appear after the check.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COLORS = { steel: 0x8d99a6, aluminum: 0xc4ccd4, polystyrene: 0xf2f2ee, glass: 0xa9d3e6, concrete: 0xb9b3a6, wood: 0xb08a5a, bone: 0xe8e0c8 };

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const m = M.MATERIALS[p.mat], s = M.solve(p), box = quizBox(ctx.panel, '예측');
      const pull = m.mode === 'tension', epsMax = M.limit(p.mat) / (m.E * 1e9), K = 0.3 / epsMax;
      const r = p.R * 1e-3 * 6, x0 = 0, y = 1.1;
      stage.floorPlane(0);
      const dark = stage.lit(0x273846, 0.4, 0.4), steel = stage.lit(0x6f8091, 0.6, 0.35);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.5, y - 0.15, 0.6), dark, [-0.3, (y - 0.15) / 2, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.5, 0.12, 0.6), steel, [-0.3, y - r - 0.06, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.5, 0.12, 0.6), steel, [-0.3, y + r + 0.06, 0]);
      stage.mesh(stage.group, new THREE.CylinderGeometry(r, r, 0.5, 32), stage.lit(COLORS[p.mat], 0.3, 0.5), [-0.3, y, 0], [0, 0, Math.PI / 2]);
      const rod = stage.mesh(stage.group, new THREE.CylinderGeometry(r, r, 1, 40), stage.lit(COLORS[p.mat], p.mat === 'steel' || p.mat === 'aluminum' ? 0.5 : 0.1, 0.5), [0, y, 0], [0, 0, Math.PI / 2]);
      // Faint mark of the unloaded end.
      stage.mesh(stage.group, new THREE.TorusGeometry(r * 1.25, 0.006, 6, 40), stage.flat(0x40546a), [x0 + p.L, y, 0], [0, Math.PI / 2, 0], false);
      stage.label(tex('L'), [x0 + p.L / 2, y - r - 0.22, 0], 'qty', { dy: 0, priority: 1 });
      const Fa = vecArrow(stage, 0xd55e00, { radius: 0.03 });
      const lF = stage.label(tex('\\vec F'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const Fscale = 0.6 / Math.max(s.Fmax, 1e-9);                    // m per kN, the largest allowed force is 0.6 m

      const strengths = [m.Sy, m.Su].filter(Boolean);
      const yr = niceRange(0, 1.1 * Math.max(...strengths), { target: 4 });
      const gb = graphBoard(stage, { origin: [-0.7, 1.75, -0.8], width: 4.6, height: 2.9, t: [0, epsMax * 1e3], y: [yr.min, yr.max], yStep: yr.step, tTitle: 'Δ<i>L</i>/<i>L</i> (10⁻³)', yTitle: '응력 (10⁶ N/m²)' });
      // Strength levels, drawn in full once (gb.setTime is not used, so they stay complete).
      const tEnd = epsMax * 1e3;
      if (m.Sy) gb.curve(() => m.Sy, { color: 0x40546a, dotted: true, dot: false }).update(tEnd);
      gb.curve(() => m.Su, { color: 0x40546a, dotted: true, dot: false }).update(tEnd);
      // Names just above each level, near the left of the plot.
      if (m.Sy) stage.label('항복 강도 <i>S</i><sub>y</sub>', gb.at(0.22 * tEnd, m.Sy), 'gtick', { dy: -12, priority: 2 });
      stage.label('극한 강도 <i>S</i><sub>u</sub>', gb.at(0.22 * tEnd, m.Su), 'gtick', { dy: -12, priority: 2 });
      let line = null;

      const word = pull ? '당긴다' : '누른다';
      box.text(`${m.label} 막대(${tex(`R = ${N(p.R)}\\ \\mathrm{mm}`)}, ${tex(`L = ${N(p.L)}\\ \\mathrm{m}`)})의 끝면을 ${tex(`F = ${N(p.F)}\\ \\mathrm{kN}`)}으로 ${word}. ${tex(`E = ${m.E} \\times 10^9\\ \\mathrm{N/m^2}`)}이다. 재생하기 전에 구해 보자.`);
      box.text(`① 응력 ${tex('F/A')} (${tex('10^6\\ \\mathrm{N/m^2}')} 단위)`, 'pred');
      const si = box.answer({ label: '응력', unit: '× 10⁶ N/m²', placeholder: '예 150', onEnter: () => check() });
      box.text(`② 길이 변화 ${tex('\\Delta L')}`, 'pred');
      const di = box.answer({ label: '길이 변화', unit: 'mm', placeholder: '예 0.9', onEnter: () => check() });
      const check = () => {
        const res = M.check(p, { sText: si.value, dText: di.value });
        if (res.sReason === 'unreadable' || res.dReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 120'); return; }
        const hs = { diameter: `${tex('R')}은 반지름이다. 지름으로 넓이를 구했다.`, noPi: `${tex('A = \\pi R^2')}다.`, units: `${tex('R')}을 m로 바꾸고 답을 ${tex('10^6\\ \\mathrm{N/m^2}')} 단위로 적자.`, value: `응력은 ${tex('F/A')}, ${tex('A = \\pi R^2')}다.` }[res.sReason] ?? '';
        const hd = { noL: `그 값은 변형률이다. ${tex('L')}을 곱하자.`, units: 'mm로 적자.', value: `${tex('\\Delta L = (F/A)L/E')} (12.3.2)다.` }[res.dReason] ?? '';
        box.feedback(res.ok, `${res.ok ? '맞다.' : [hs, hd].filter(Boolean).join(' ')}<br>${tex(`\\dfrac{F}{A} = \\dfrac{F}{\\pi R^2} = ${N(s.stress / 1e6)} \\times 10^6\\ \\mathrm{N/m^2}`)}<br>${tex(`\\Delta L = \\dfrac{(F/A)L}{E} = ${N(s.dL * 1e3)}\\ \\mathrm{mm},\\ \\dfrac{\\Delta L}{L} = ${N(s.strain * 1e3)} \\times 10^{-3}`)}`);
        if (!line) line = gb.curve(e => m.E * e, { color: 0xd55e00, dot: false });   // strain in 10⁻³, stress in 10⁶ N/m²
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      // Moving point on the stress–strain line (after the check).
      const dot = stage.mesh(stage.group, new THREE.SphereGeometry(0.08, 20, 14), stage.flat(0xd55e00), [0, 0, 0], [0, 0, 0], false);
      const dotTag = stage.label('', [0, 0, 0], 'gval', { dy: -16, priority: 2 });
      dotTag.node.style.color = '#d55e00';

      cur = {
        render(o) {
          const len = p.L + (pull ? 1 : -1) * K * o.strain * p.L, xe = x0 + len;
          rod.scale.set(1, len, 1); rod.position.set(x0 + len / 2, y, 0);
          const Lf = o.Fnow * Fscale;
          if (pull) { Fa.update([xe, y, 0], [1, 0, 0], Lf); lF.move([xe + Lf + 0.2, y + 0.1, 0]); }
          else { Fa.update([xe + Lf, y, 0], [-1, 0, 0], Lf); lF.move([xe + Lf + 0.2, y + 0.1, 0]); }
          lF.node.dataset.off = Lf > 0.02 ? '' : '1';
          if (line) line.update(o.strain * 1e3);
          const show = ui.revealed;
          dot.visible = show; dotTag.node.dataset.off = show ? '' : '1';
          if (show) { const P = gb.at(o.strain * 1e3, o.stress / 1e6); dot.position.set(...P); dotTag.move([P[0] + 0.25, P[1], P[2]]); dotTag.set(`${fmt(o.stress / 1e6, { zero: 1e-9 })} × 10⁶ N/m²`); }
        },
      };
      const W = Math.max(p.L * 1.3 + 1.6, 4.6);
      stage.setHome({ target: [W / 2 - 0.8, 2.3, 0], direction: [0.05, 0.1, 1], distance: 1.6 * Math.max(W, 4.8) + 1.2, minDistance: 2, maxDistance: 30 });
      return { legend: [{ label: '힘 (force)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
