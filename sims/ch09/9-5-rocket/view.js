// 9.9 3D view. A rocket held in view at the middle of the stage (the camera follows it), a flame whose length
// follows the thrust, a see-through fuel tank whose inner bar shows the fuel left, a thrust arrow, and two graph
// boards behind: v–t and M–t.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const LEGEND = [{ label: '힘 (force)', color: '#d55e00' }, { label: '속력 (speed)', color: '#0072b2' }, { label: '질량', color: '#000000' }];

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const tb = M.burnTime(p), T = M.duration(p), Y = 1.3;
      // Rocket body along +x: tank, nose cone, fins, nozzle.
      const g = new THREE.Group(); g.position.set(0, Y, 0.8); stage.group.add(g);
      const body = stage.lit(0xdfe5ea, 0.5, 0.35), dark = stage.lit(0x40546a, 0.5, 0.4);
      stage.mesh(g, new THREE.CylinderGeometry(0.42, 0.42, 3.2, 40, 1, true), stage.lit(0xdfe5ea, 0.2, 0.2, { }), [0, 0, 0], [0, 0, -Math.PI / 2]).material.transparent = true;
      g.children[0].material.opacity = 0.35;
      const fuel = stage.mesh(g, new THREE.CylinderGeometry(0.36, 0.36, 1, 32), stage.lit(0xe69f00, 0.1, 0.5), [0, 0, 0], [0, 0, -Math.PI / 2]);
      stage.mesh(g, new THREE.ConeGeometry(0.42, 1.0, 40), body, [2.1, 0, 0], [0, 0, -Math.PI / 2]);
      for (const a of [0, 2 * Math.PI / 3, 4 * Math.PI / 3]) stage.mesh(g, new THREE.BoxGeometry(0.7, 0.04, 0.5), dark, [-1.35, 0.5 * Math.cos(a), 0.5 * Math.sin(a)], [a, 0, 0]);
      stage.mesh(g, new THREE.CylinderGeometry(0.22, 0.32, 0.4, 24), dark, [-1.8, 0, 0], [0, 0, -Math.PI / 2]);
      const flame = stage.mesh(g, new THREE.ConeGeometry(0.28, 1, 24), stage.flat(0xf0e442, { transparent: true, opacity: 0.85 }), [-2.5, 0, 0], [0, 0, Math.PI / 2], false);
      const fuelMax = p.Mi - p.Mf, tankLen = 3.0;
      const Tarrow = vecArrow(stage, 0xd55e00, { radius: 0.05 });
      const tl = stage.label(tex('\\vec T'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      stage.label('연료 통', [0, Y + 0.75, 0.8], 'tag', { dy: 0, priority: -1 });

      const vmax = M.deltaV(p) * 1.1, vr = niceRange(0, vmax, { target: 4 });
      const gv = graphBoard(stage, { origin: [-6.4, 2.6, -1.6], width: 6.2, height: 3.6, t: [0, T], y: [vr.min, vr.max], yStep: vr.step, yTitle: '<i>v</i> (m/s)' });
      gv.curve(t => M.stateAt(t, p).v, { color: 0x0072b2, tag: v => `<i>v</i> = ${fmt(v, { zero: 1e-9 })} m/s` });
      const mr = niceRange(0, p.Mi * 1.05, { target: 4 });
      const gm = graphBoard(stage, { origin: [0.2, 2.6, -1.6], width: 6.2, height: 3.6, t: [0, T], y: [mr.min, mr.max], yStep: mr.step, yTitle: '<i>M</i> (kg)' });
      gm.curve(t => M.stateAt(t, p).M, { color: 0x000000, tag: v => `<i>M</i> = ${fmt(v)} kg` });

      const box = quizBox(ctx.panel, '예측');
      box.text(`${tex(`M_i = ${p.Mi}\\ \\mathrm{kg}`)}의 로켓이 ${tex(`R = ${p.R}\\ \\mathrm{kg/s}`)}로 연료를 태워 ${tex(`M_f = ${p.Mf}\\ \\mathrm{kg}`)}이 된다. 배기 속력은 ${tex(`v_{\\text{rel}} = ${p.vrel}\\ \\mathrm{m/s}`)}다. 재생하기 전에 구해 보자.`);
      box.text(`① 처음 가속도 ${tex('a_i')}`, 'pred');
      const ai = box.answer({ label: '처음 가속도', unit: 'm/s²', placeholder: '예 30', onEnter: () => check() });
      box.text(`② 연료를 다 태운 뒤 속력 ${tex('v_f')}`, 'pred');
      const vi = box.answer({ label: '나중 속력', unit: 'm/s', placeholder: '예 2000', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { aText: ai.value, vText: vi.value });
        if (r.aReason === 'unreadable' || r.vReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 2000'); return; }
        const ha = { final: `처음 가속도는 처음 질량 ${tex('M_i')}로 나눈다. 연료가 줄면 가속도가 커진다.`, noRate: `추력은 ${tex('T = Rv_{\\text{rel}}')}다.`, value: `${tex('a_i = Rv_{\\text{rel}}/M_i')} (9.9.6)이다.` }[r.aReason] ?? '';
        const hv = { log10: '자연로그 ln을 쓴다.', linear: '속력 변화는 질량 비의 로그에 비례한다.', noLog: `${tex('\\ln')}을 빠뜨렸다.`, value: `${tex('v_f = v_{\\text{rel}}\\ln(M_i/M_f)')} (9.9.7)이다.` }[r.vReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [ha, hv].filter(Boolean).join(' ')}<br>${tex(`a_i = \\dfrac{${p.R}\\times${p.vrel}}{${p.Mi}} = ${N(M.thrust(p) / p.Mi)}\\ \\mathrm{m/s^2}`)}<br>${tex(`v_f = ${p.vrel}\\ln\\dfrac{${p.Mi}}{${p.Mf}} = ${N(M.deltaV(p))}\\ \\mathrm{m/s}`)}`);
        ui.revealed = true;
      };
      box.buttons([{ label: '확인', primary: true, onClick: check }]);

      cur = {
        render(o) {
          const left = (o.M - p.Mf) / fuelMax, L = Math.max(0.01, tankLen * left);
          fuel.scale.set(1, L, 1); fuel.position.set(-1.5 + L / 2, 0, 0);
          flame.visible = o.burning; flame.scale.set(1, 1.6, 1); flame.position.set(-2.8, 0, 0);
          const TL = o.burning ? 1.8 : 0;
          Tarrow.update([2.7, Y, 0.8], [1, 0, 0], TL); tl.node.dataset.off = TL > 0 ? '' : '1'; tl.move([2.7 + TL + 0.3, Y, 0.8]);
          gv.setTime(o.t); gm.setTime(o.t);
        },
      };
      stage.setHome({ target: [0, 3.0, -0.4], direction: [0, 0.12, 1], distance: 15.5, minDistance: 5, maxDistance: 35 });
      return { legend: LEGEND };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
