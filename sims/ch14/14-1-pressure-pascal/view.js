// 14.2–14.4 3D view.
// depth: an open glass tank (scene unit 1 m) holding up to 10.5 m of liquid; a probe on a cable goes down to h.
// Four equal arrows (#D55E00) push on the probe from the sides and from above and below. After the check a graph
// board on the right shows p(h). hydraulic: two vertical tubes joined at the bottom (scene unit 10 cm); pistons and
// liquid columns move with the run; force arrows have equal drawn lengths and carry their values after the check.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const FORCE = 0xd55e00;
const LIQ = { water: 0x56b4e9, seawater: 0x56b4e9, mercury: 0xa9b3bc, oil: 0xe69f00 };

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;
  const glass = () => new THREE.MeshStandardMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.18, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const liquid = c => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.45, roughness: 0.4, depthWrite: false });

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측');
      stage.floorPlane(-0.02);
      if (p.activity === 'hydraulic') return buildHydraulic(p, box);
      const H = 10.5, W = 3, D = 2, s = M.depth(p);
      stage.mesh(stage.group, new THREE.BoxGeometry(W + 0.1, H + 0.6, D + 0.1), glass(), [0, (H + 0.6) / 2, 0]);
      const liq = stage.mesh(stage.group, new THREE.BoxGeometry(W, H, D), liquid(LIQ[p.liquid]), [0, H / 2, 0]);
      liq.castShadow = false;
      // Depth ruler on the left wall, 0 at the surface.
      for (let k = 0; k <= 10; k += 2) {
        stage.line([[-W / 2 - 0.05, H - k, D / 2], [-W / 2 - 0.35, H - k, D / 2]], 0x40546a);
        stage.label(`${k} m`, [-W / 2 - 0.8, H - k, D / 2], 'gtick', { dy: 0, priority: 0 });
      }
      stage.label('수면 <i>p</i><sub>0</sub>', [W / 2 + 0.9, H, 0], 'tag', { dy: 0, priority: 1 });
      const cable = stage.mesh(stage.group, new THREE.CylinderGeometry(0.02, 0.02, 1, 8), stage.lit(0x40546a, 0.2, 0.7), [0, 0, 0], [0, 0, 0], false);
      const probe = stage.mesh(stage.group, new THREE.CylinderGeometry(0.22, 0.22, 0.3, 32), stage.lit(0xd0d6dc, 0.6, 0.3));
      const arrows = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]].map(d => ({ d, a: vecArrow(stage, FORCE, { radius: 0.04 }) }));
      const pr = niceRange(0, (M.P0 + M.depth({ ...p, h: 10 }).gauge) / 1e3 * 1.05, { target: 4 });
      const gb = graphBoard(stage, { origin: [W / 2 + 1.6, 1.0, -0.8], width: 7, height: 8, t: [0, 10], y: [0, pr.max], yStep: pr.step, tTitle: '깊이 <i>h</i> (m)', yTitle: '<i>p</i> (kPa)' });
      let curve = null;

      box.text(`${M.LIQUIDS[p.liquid].label}의 밀도는 ${tex(`\\rho = ${p.liquid === 'mercury' ? '13.6 \\times 10^3' : N(M.LIQUIDS[p.liquid].rho)}\\ \\mathrm{kg/m^3}`)}이다. 탐침을 수면에서 ${tex(`h = ${N(p.h)}\\ \\mathrm{m}`)}까지 내린다. 재생하기 전에 구해 보자.`);
      box.text('① 그 깊이의 계기 압력 (kPa)', 'pred');
      const gi = box.answer({ label: '계기 압력', unit: 'kPa', placeholder: '예 50', onEnter: () => check() });
      box.text('② 그 깊이의 절대 압력 (kPa)', 'pred');
      const pi = box.answer({ label: '절대 압력', unit: 'kPa', placeholder: '예 150', onEnter: () => check() });
      const check = () => {
        const r = M.checkDepth(p, { gText: gi.value, pText: pi.value });
        if (r.gReason === 'unreadable' || r.pReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 60'); return; }
        const hg = { absolute: '그 값은 절대 압력이다. 계기 압력은 대기압을 뺀 값이다.', noG: `${tex('g')}를 곱하자.`, units: 'kPa로 적자.', value: `계기 압력은 ${tex('\\rho gh')}다.` }[r.gReason] ?? '';
        const hp = { noP0: `수면을 누르는 대기압 ${tex('p_0')}를 더하자.`, value: `${tex('p = p_0 + \\rho gh')} (14.2.4)이다.` }[r.pReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hg, hp].filter(Boolean).join(' ')}<br>${tex(`\\rho gh = ${N(s.gauge / 1e3)}\\ \\mathrm{kPa}`)}<br>${tex(`p = p_0 + \\rho gh = ${N(s.p / 1e3)}\\ \\mathrm{kPa}`)}`);
        if (!curve) curve = gb.curve(h => M.depth({ ...p, h }).p / 1e3, { color: 0x000000, tag: v => `${fmt(v)} kPa` });
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
      const AS = 0.9 / ((M.P0 + M.depth({ ...p, h: 10 }).gauge));      // the longest arrow (10 m) is 0.9 m
      cur = {
        render(o) {
          const y = H - o.y;
          probe.position.set(0, y, 0);
          const top = H + 0.9, L = top - y; cable.scale.set(1, L, 1); cable.position.set(0, y + L / 2, 0);
          const len = o.p * AS;
          for (const { d, a } of arrows) a.update([-d[0] * (0.25 + len), y - d[1] * (0.18 + len), 0], d, len);
          if (curve) gb.setTime(o.y);
        },
      };
      stage.setHome({ target: [3.6, 5.3, 0], direction: [0.08, 0.1, 1], distance: 24, minDistance: 4, maxDistance: 60 });
      return { legend: [{ label: '압력이 미는 힘 (force)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };

  function buildHydraulic(p, box) {
    const s = M.hydraulic(p), K = 0.1;                                // scene units per cm
    const ri = Math.sqrt(p.Ai / Math.PI) * K, ro = Math.sqrt(p.Ao / Math.PI) * K;
    const xi = -2.2, xo = 2.2, base = 0.6, level = 5.0, top = 9;
    stage.mesh(stage.group, new THREE.BoxGeometry(xo - xi + 2 * ro, 0.5, 2 * ro), liquid(LIQ.oil), [(xi + xo) / 2, base + 0.25, 0]);
    for (const [x, r] of [[xi, ri], [xo, ro]]) stage.mesh(stage.group, new THREE.CylinderGeometry(r + 0.03, r + 0.03, top - base, 40, 1, true), glass(), [x, (top + base) / 2, 0]);
    const colI = stage.mesh(stage.group, new THREE.CylinderGeometry(ri, ri, 1, 32), liquid(LIQ.oil), [xi, 0, 0]);
    const colO = stage.mesh(stage.group, new THREE.CylinderGeometry(ro, ro, 1, 48), liquid(LIQ.oil), [xo, 0, 0]);
    const steel = stage.lit(0x6f8091, 0.6, 0.35);
    const pi = stage.mesh(stage.group, new THREE.CylinderGeometry(ri, ri, 0.25, 32), steel);
    const po = stage.mesh(stage.group, new THREE.CylinderGeometry(ro, ro, 0.25, 48), steel);
    const load = stage.mesh(stage.group, new THREE.BoxGeometry(ro * 1.4, 0.7, ro * 1.4), stage.lit(0xa9bccb, 0.35, 0.45));
    const Fi = vecArrow(stage, FORCE, { radius: 0.06 }), Fo = vecArrow(stage, FORCE, { radius: 0.06 });
    const lFi = stage.label('', [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lFo = stage.label('', [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const AL = 1.6;

    box.text(`입력 피스톤 ${tex(`A_i = ${N(p.Ai)}\\ \\mathrm{cm^2}`)}을 ${tex(`F_i = ${N(p.Fi)}\\ \\mathrm{N}`)}으로 눌러 ${tex(`d_i = ${N(p.di)}\\ \\mathrm{cm}`)} 내린다. 출력 피스톤은 ${tex(`A_o = ${N(p.Ao)}\\ \\mathrm{cm^2}`)}이다. 재생하기 전에 구해 보자.`);
    box.text(`① 출력 피스톤이 짐에 작용하는 힘 ${tex('F_o')}`, 'pred');
    const Fin = box.answer({ label: '출력 힘', unit: 'N', placeholder: '예 1500', onEnter: () => check() });
    box.text(`② 출력 피스톤이 올라가는 거리 ${tex('d_o')}`, 'pred');
    const din = box.answer({ label: '출력 피스톤 거리', unit: 'cm', placeholder: '예 2', onEnter: () => check() });
    const check = () => {
      const r = M.checkHydraulic(p, { FText: Fin.value, dText: din.value });
      if (r.FReason === 'unreadable' || r.dReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 1000'); return; }
      const hF = { inverse: `넓이 비를 거꾸로 썼다. ${tex('F_o = F_iA_o/A_i')}다.`, same: '압력 변화가 그대로 전달되므로 넓이가 크면 힘도 커진다.', value: `${tex('\\Delta p = F_i/A_i = F_o/A_o')}다.` }[r.FReason] ?? '';
      const hd = { inverse: '밀려난 부피가 같다. 넓은 피스톤은 덜 움직인다.', same: `밀려난 부피 ${tex('A_id_i = A_od_o')}가 같다.`, value: `${tex('d_o = d_iA_i/A_o')} (14.4.4)다.` }[r.dReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hF, hd].filter(Boolean).join(' ')}<br>${tex(`F_o = F_i\\dfrac{A_o}{A_i} = ${N(s.Fo)}\\ \\mathrm{N},\\ d_o = d_i\\dfrac{A_i}{A_o} = ${N(s.do)}\\ \\mathrm{cm}`)}<br>${tex(`W = F_id_i = F_od_o = ${N(s.W)}\\ \\mathrm{J}`)}`);
      ui.revealed = true; ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
    cur = {
      render(o) {
        const yi = level - o.di * K, yo = level + o.do * K;
        colI.scale.set(1, yi - base - 0.5, 1); colI.position.set(xi, (yi + base + 0.5) / 2, 0);
        colO.scale.set(1, yo - base - 0.5, 1); colO.position.set(xo, (yo + base + 0.5) / 2, 0);
        pi.position.set(xi, yi + 0.125, 0); po.position.set(xo, yo + 0.125, 0); load.position.set(xo, yo + 0.6, 0);
        Fi.update([xi, yi + 0.25 + AL, 0], [0, -1, 0], AL);
        Fo.update([xo + ro + 0.35, yo, 0], [0, 1, 0], AL);
        lFi.set(tex('\\vec F_i') + ` <span class="val">${fmt(p.Fi)} N</span>`); lFi.move([xi - 0.7, yi + 0.25 + AL + 0.2, 0]);
        lFo.set(ui.revealed ? tex('\\vec F_o') + ` <span class="val">${fmt(s.Fo)} N</span>` : `${tex('\\vec F_o')} <span class="val">= ?</span>`); lFo.move([xo + ro + 0.9, yo + AL + 0.2, 0]);
      },
    };
    stage.setHome({ target: [0.4, 4.8, 0], direction: [0.12, 0.22, 1], distance: 19.5, minDistance: 4, maxDistance: 50 });
    return { legend: [{ label: '힘 (force)', color: '#d55e00' }] };
  }
}
