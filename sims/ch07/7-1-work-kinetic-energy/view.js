// 7.2 3D view. A crate slides along the measuring board through a displacement d⃗ (black arrow in front of the
// board). Force arrows sit on the crate. A graph board behind plots K against the distance x, so the work done
// so far is the rise or drop of the curve from K_i (work–kinetic energy theorem).
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { vecArrow, dashLine, block } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui, forceScale } from './spec.js';

const COL = { force: 0xd55e00, disp: 0x000000, energy: 0x0072b2 };   // kinetic energy shares the velocity colour (05 §색)
const LEGEND = [{ label: '힘 (force)', color: '#d55e00' }, { label: '변위 (displacement)', color: '#000000' }];
const sizeOf = m => 0.55 + 0.1 * Math.cbrt(m);
const rad = d => d * Math.PI / 180;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;
  const add = (a, b) => a.map((c, i) => c + b[i]);
  const mul = (a, k) => a.map(c => c * k);
  const len = a => Math.hypot(...a);

  function onBody(color, html, { radius = 0.045, priority = 2, gap = 0.3, minR = 0.75 } = {}) {
    const arrow = vecArrow(stage, color, { radius });
    const lab = stage.label(tex(html), [0, 0, 0], 'qty', { dy: 0, priority });
    return {
      set(at, v, L) {
        arrow.update(at, v, L);
        lab.node.dataset.off = L > 0.02 ? '' : '1';
        if (len(v) > 1e-9) lab.move(add(at, mul(v, Math.max(L + gap, minR) / len(v))));
      },
    };
  }
  function predict(intro, fields, grade) {
    const box = quizBox(ctx.panel, '예측');
    box.text(intro);
    const inputs = fields.map(f => { box.text(f.title, 'pred'); return box.answer({ label: f.label, unit: f.unit, placeholder: f.placeholder, onEnter: () => check() }); });
    let onReveal = () => {};
    const check = () => {
      const r = grade(inputs.map(i => i.value));
      box.feedback(r.ok, r.message);
      if (r.reveal) { ui.revealed = true; onReveal(); ctx.refresh(); }
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    return { set onReveal(f) { onReveal = f; } };
  }

  return {
    build(p) {
      ui.revealed = false;
      const s = M.solve(p), S = forceScale(p), sz = sizeOf(p.m), X0 = -p.d / 2, T = M.duration(p);
      stage.board(stage.group, X0 - 3, X0 + p.d + 3, 2.6, 0);
      stage.floorPlane(-1.45);
      for (const x of [X0 - 2.1, X0 + p.d + 2.1]) for (const z of [-0.7, 0.7]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
      // Start and end marks and the displacement arrow in front of the crate path.
      for (const x of [X0, X0 + p.d]) stage.mesh(stage.group, new THREE.BoxGeometry(0.04, 0.02, 2.4), stage.lit(0xf4f8fc, 0.2, 0.4), [x, 0.015, 0]);
      const dArrow = vecArrow(stage, COL.disp, { radius: 0.035 });
      dArrow.update([X0, 0.05, 1.05], [1, 0, 0], p.d);
      stage.label(`${tex('\\vec d')} <span class="val">${fmt(p.d)} m</span>`, [X0 + p.d + 0.75, 0.05, 1.05], 'qty', { dy: 0, priority: 3 });

      const crate = block(stage, sz, { color: 0xc8a978, eye: [1, 0, 0] });
      stage.group.add(crate);
      const tag = stage.label('상자', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
      const arrows = [];
      if (p.activity === 'wind') {
        arrows.push({ a: onBody(COL.force, '\\vec F'), v: [p.Fx, p.Fy, 0] });
      } else {
        arrows.push({ a: onBody(COL.force, '\\vec F_1'), v: [p.F1 * Math.cos(rad(p.th1)), -p.F1 * Math.sin(rad(p.th1)), 0] });
        arrows.push({ a: onBody(COL.force, '\\vec F_2'), v: [p.F2 * Math.cos(rad(p.th2)), p.F2 * Math.sin(rad(p.th2)), 0] });
      }
      arrows.push({ a: onBody(COL.force, '\\vec F_N'), v: [0, s.FN, 0] }, { a: onBody(COL.force, '\\vec F_g'), v: [0, -p.m * M.G, 0] });
      // Dashed component of each applied force along d⃗ (the part that does work), shown after the check.
      const comps = arrows.slice(0, p.activity === 'wind' ? 1 : 2).map(() => dashLine(stage, [0, 0, 0], [0, 0, 0], COL.force));
      for (const c of comps) c.visible = false;

      // K–x board behind the board.
      const Kmax = Math.max(s.Ki, s.Kf, 1e-6), yr = niceRange(0, Kmax * 1.12, { target: 4 });
      const gb = graphBoard(stage, { origin: [X0 - 2.6, 0.8, -2.2], width: p.d + 5.2, height: 3.8, t: [0, p.d], y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>x</i> (m)', yTitle: '<i>K</i> (J)' });
      gb.curve(x => s.Ki + s.Fx * x, { color: COL.energy, tag: v => `<i>K</i> = ${fmt(v, { zero: 1e-9 })} J` });
      const guide = stage.line([gb.at(0, s.Ki), gb.at(p.d, s.Ki)].map(q => [q[0], q[1], q[2] + 0.02]), 0x40546a, { dashed: true, dash: 0.16, gap: 0.12 });
      const wLabel = stage.label(`${tex('W = \\Delta K')} = ${fmt(s.W, { zero: 1e-9 })} J`, gb.at(p.d * 0.35, yr.max * 0.93), 'gval', { dy: 0, priority: 4 });
      guide.visible = false; wLabel.node.dataset.off = '1';

      let pr;
      if (p.activity === 'wind') {
        pr = predict(`상자가 ${tex(`\\vec d = (${N(p.d)}\\ \\mathrm{m})\\hat i`)}만큼 가는 동안 바람이 ${tex(`\\vec F = (${p.Fx}\\ \\mathrm{N})\\hat i + (${p.Fy}\\ \\mathrm{N})\\hat j`)}로 민다. 재생하기 전에 두 값을 구해 보자.`,
          [{ title: `① 바람이 한 일 ${tex('W')}`, label: '바람이 한 일', unit: 'J', placeholder: '예 -12' },
           { title: `② 나중 운동에너지 ${tex('K_f')}`, label: '나중 운동에너지', unit: 'J', placeholder: '예 30' }],
          ([WText, KText]) => {
            const r = M.checkWind(p, { WText, KText });
            if (r.WReason === 'unreadable' || r.KReason === 'unreadable') return { ok: false, message: '①과 ②를 숫자로 적자. 예 -8.5' };
            const hW = { magnitude: `힘의 크기 전체가 아니라 변위 방향 성분만 일을 한다. ${tex('W = F_x d')}이다.`, perp: `${tex('F_y')}는 변위에 수직이라 일을 하지 않는다.`, sign: `${tex('F_x')}와 ${tex('d')}의 부호를 보자. 반대 방향이면 일이 음수다.`, value: `${tex('W = \\vec F\\cdot\\vec d = F_x d_x + F_y d_y')}이다.` }[r.WReason] ?? '';
            const hK = { minus: `${tex('K_f = K_i + W')} (7.2.9)이다. ${tex('W')}의 부호를 그대로 더하자.`, noKi: `처음 운동에너지 ${tex('K_i')}를 더하자.`, value: `${tex('K_f = K_i + W')}이다.` }[r.KReason] ?? '';
            const sol = [`K_i = \\tfrac{1}{2}mv_i^2 = ${N(s.Ki)}\\ \\mathrm{J}`, `W = F_x d = ${N(s.W)}\\ \\mathrm{J}`, `K_f = K_i + W = ${N(s.Kf)}\\ \\mathrm{J}`].map(t => tex(t)).join('<br>');
            return { ok: r.ok, message: `${r.ok ? '맞다.' : [hW, hK].filter(Boolean).join(' ')}<br>${sol}`, reveal: true };
          });
      } else {
        pr = predict('정지해 있던 상자를 두 힘이 변위 d만큼 옮긴다. 재생하기 전에 두 값을 구해 보자.',
          [{ title: `① 두 힘이 한 알짜 일 ${tex('W')}`, label: '알짜 일', unit: 'J', placeholder: '예 80' },
           { title: `② 나중 속력 ${tex('v_f')}`, label: '나중 속력', unit: 'm/s', placeholder: '예 2.5' }],
          ([WText, vText]) => {
            const r = M.checkTwo(p, { WText, vText });
            if (r.WReason === 'unreadable' || r.vReason === 'unreadable') return { ok: false, message: '①과 ②를 숫자로 적자. 예 75.5' };
            const hW = { sin: `${tex('\\sin')}이 아니라 ${tex('\\cos')}다. 변위 방향 성분만 일을 한다.`, noCos: `힘의 크기가 아니라 변위 방향 성분 ${tex('F\\cos\\phi')}를 쓰자.`, oneForce: '두 힘의 일을 더하자.', value: `${tex('W = F_1 d\\cos\\theta_1 + F_2 d\\cos\\theta_2')}이다.` }[r.WReason] ?? '';
            const hv = { noHalf: `${tex('K = \\tfrac{1}{2}mv^2')}의 ${tex('\\tfrac{1}{2}')}을 빠뜨렸다.`, noRoot: '제곱근을 빠뜨렸다.', value: `${tex('W = \\tfrac{1}{2}mv_f^2 - 0')}에서 ${tex('v_f')}를 풀자.` }[r.vReason] ?? '';
            const sol = [`W_1 = F_1 d\\cos\\theta_1 = ${N(s.W1)}\\ \\mathrm{J}`, `W_2 = F_2 d\\cos\\theta_2 = ${N(s.W2)}\\ \\mathrm{J}`, `W = W_1 + W_2 = ${N(s.W)}\\ \\mathrm{J}`, `v_f = \\sqrt{2W/m} = ${N(s.vf)}\\ \\mathrm{m/s}`].map(t => tex(t)).join('<br>');
            return { ok: r.ok, message: `${r.ok ? '맞다.' : [hW, hv].filter(Boolean).join(' ')}<br>${sol}`, reveal: true };
          });
      }
      pr.onReveal = () => { for (const c of comps) c.visible = true; guide.visible = true; wLabel.node.dataset.off = ''; };

      cur = {
        render(o) {
          const c = [X0 + o.x, sz / 2, 0];
          crate.position.set(...c);
          tag.move([c[0] - sz / 2 - 0.45, sz + 0.15, 0.4]);
          for (const it of arrows) it.a.set(c, it.v, len(it.v) * S);
          comps.forEach((d, i) => { const v = arrows[i].v; d.set(add(c, mul(v, S)), add(c, [v[0] * S, 0, 0])); });
          gb.setTime(o.x);
        },
      };
      const yTop = Math.max(4.8, sz + 1.6 + 1), yLow = -1.2;
      stage.setHome({ target: [0, (yTop + yLow) / 2, -0.6], direction: [0, 0.22, 1], distance: 6 + (p.d + 6) * 0.95, minDistance: 5, maxDistance: 40 });
      return { legend: LEGEND };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
