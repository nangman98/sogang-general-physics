// 7.6 3D view. The camera follows the box: the box stays at the middle of the measuring board and 1 m floor ticks
// slide past it, so a run of any length fits the stage. Two graph boards stand behind: W–t (left) and P–t (right).
// The P–t curves are drawn only after the prediction is checked, because the asked powers are their values at t = 0.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { vecArrow, block } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui, forceScale } from './spec.js';

const COL = { force: 0xd55e00, vel: 0x0072b2 };
const LEGEND = [{ label: '힘 (force)', color: '#d55e00' }, { label: '속도 (velocity)', color: '#0072b2' }];
const rad = d => d * Math.PI / 180;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;
  const add = (a, b) => a.map((c, i) => c + b[i]);
  const mul = (a, k) => a.map(c => c * k);
  const len = a => Math.hypot(...a);

  function onBody(color, html, { radius = 0.045 } = {}) {
    const arrow = vecArrow(stage, color, { radius });
    const lab = stage.label(tex(html), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    return {
      set(at, v, L) {
        arrow.update(at, v, L);
        lab.node.dataset.off = L > 0.02 ? '' : '1';
        if (len(v) > 1e-9) lab.move(add(at, mul(v, Math.max(L + 0.3, 0.7) / len(v))));
      },
    };
  }
  const rangeOf = (fn, T) => { const vs = Array.from({ length: 41 }, (_, i) => fn(T * i / 40)); return [Math.min(0, ...vs), Math.max(0, ...vs)]; };

  return {
    build(p) {
      ui.revealed = false;
      const S = forceScale(p), T = Math.max(M.duration(p), 1e-3), sz = 0.6 + 0.08 * Math.cbrt(p.m), two = p.activity === 'two';
      stage.board(stage.group, -6.2, 6.2, 2.6, 0);
      stage.floorPlane(-1.45);
      for (const x of [-5.3, 5.3]) for (const z of [-0.7, 0.7]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
      // Treadmill ticks every 1 m and three distance labels every 5 m.
      const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.02, 2.3), stage.lit(0xd8e5ee, 0.2, 0.5), 13);
      ticks.frustumCulled = false; stage.group.add(ticks);
      const labs = [0, 1, 2].map(() => stage.label('', [0, 0, 0], 'measure'));
      const Mx = new THREE.Matrix4(), hide = new THREE.Matrix4().makeScale(0, 0, 0);
      const box = block(stage, sz, { color: 0xc8a978, eye: [1, 0, 0] });
      box.position.set(0, sz / 2, 0); stage.group.add(box);
      const c = [0, sz / 2, 0];
      const forces = two
        ? [{ a: onBody(COL.force, '\\vec F_1'), v: [-p.F1, 0, 0] }, { a: onBody(COL.force, '\\vec F_2'), v: [p.F2 * Math.cos(rad(p.phi2)), p.F2 * Math.sin(rad(p.phi2)), 0] }]
        : [{ a: onBody(COL.force, '\\vec F'), v: [p.F * Math.cos(rad(p.phi)), p.F * Math.sin(rad(p.phi)), 0] }];
      const s0 = M.setup(p);
      forces.push({ a: onBody(COL.force, '\\vec F_N'), v: [0, s0.FN, 0] }, { a: onBody(COL.force, '\\vec F_g'), v: [0, -p.m * M.G, 0] });
      for (const f of forces) f.a.set(c, f.v, len(f.v) * S);
      const vel = onBody(COL.vel, '\\vec v');

      const Wfn = t => M.stateAt(t, p).Wnet, Pfn = t => M.stateAt(t, p).Pnet;
      const [w0, w1] = rangeOf(Wfn, T), wr = niceRange(w0, w1 * 1.05 + 1e-6, { target: 4 });
      const gW = graphBoard(stage, { origin: [-6.3, 1.0, -2.2], width: 6, height: 3.6, t: [0, T], y: [wr.min, wr.max], yStep: wr.step, yTitle: '<i>W</i> (J)' });
      gW.curve(Wfn, { color: COL.force, tag: v => `<i>W</i> = ${fmt(v, { zero: 1e-9 })} J` });
      const Plist = two ? [t => M.stateAt(t, p).P1, t => M.stateAt(t, p).P2, Pfn] : [Pfn];
      const ranges = Plist.map(f => rangeOf(f, T));
      const pr0 = niceRange(Math.min(...ranges.map(r => r[0])) * 1.05, Math.max(...ranges.map(r => r[1])) * 1.05 + 1e-6, { target: 4 });
      const gP = graphBoard(stage, { origin: [0.3, 1.0, -2.2], width: 6, height: 3.6, t: [0, T], y: [pr0.min, pr0.max], yStep: pr0.step, yTitle: '<i>P</i> (W)' });
      const later = stage.label('확인 뒤에 그린다', gP.at(T / 2, (pr0.min + pr0.max) / 2), 'station', { dy: 0, priority: 1 });
      let tNow = 0;
      const drawP = () => {
        later.node.dataset.off = '1';
        if (two) {
          // Names fixed at the left end of each line (moving value tags would sit on the time-axis title near P = 0).
          const names = ['<i>P</i><sub>1</sub>', '<i>P</i><sub>2</sub>', '<i>P</i><sub>net</sub>'];
          Plist.forEach((f, i) => {
            gP.curve(f, { color: COL.force, dotted: i < 2 });
            const t0 = 0.1 * T, y = f(t0), others = Plist.filter((_, j) => j !== i).map(g => g(t0));
            const above = others.every(o => o <= y) || (others.some(o => o < y) && i !== 0);
            stage.label(names[i], gP.at(t0, y), 'gtick', { dy: above ? -13 : 13, priority: 3 });
          });
        } else gP.curve(Pfn, { color: COL.force, tag: v => `<i>P</i> = ${fmt(v, { zero: 1e-9 })} W` });
        gP.setTime(tNow);
      };

      const box2 = quizBox(ctx.panel, '예측');
      let grade;
      if (two) {
        const s = M.stateAt(0, p);
        box2.text(`상자가 ${tex(`v = ${N(p.v0)}\\ \\mathrm{m/s}`)}로 오른쪽으로 미끄러지는 순간이다. 재생하기 전에 구해 보자.`);
        box2.text(`① ${tex('\\vec F_1')}의 일률 ${tex('P_1')}`, 'pred');
        const a = box2.answer({ label: 'F1의 일률', unit: 'W', placeholder: '예 -4', onEnter: () => check() });
        box2.text(`② ${tex('\\vec F_2')}의 일률 ${tex('P_2')}`, 'pred');
        const b = box2.answer({ label: 'F2의 일률', unit: 'W', placeholder: '예 4', onEnter: () => check() });
        const tr = box2.choices('③ 재생하는 동안 알짜 일률은', [{ value: 'up', html: '커진다' }, { value: 'same', html: '일정하다' }, { value: 'down', html: '작아진다' }]);
        grade = () => {
          const r = M.checkTwo(p, { P1Text: a.value, P2Text: b.value, trendChoice: tr() });
          if (r.trendReason === 'empty') return { ok: null, msg: '③을 고르자.', stop: true };
          if (r.P1Reason === 'unreadable' || r.P2Reason === 'unreadable') return { ok: false, msg: '①과 ②를 숫자로 적자. 예 -4.5', stop: true };
          const h1 = { sign: `${tex('\\vec F_1')}은 운동과 반대라 ${tex('\\cos 180^\\circ = -1')}, 일률이 음수다.`, value: `${tex('P_1 = F_1 v\\cos 180^\\circ')}이다.` }[r.P1Reason] ?? '';
          const h2 = { noCos: `${tex('F_2')}의 운동 방향 성분 ${tex('F_2\\cos\\phi_2')}만 쓴다.`, sin: `${tex('\\sin')}이 아니라 ${tex('\\cos')}다.`, value: `${tex('P_2 = F_2 v\\cos\\phi_2')}이다.` }[r.P2Reason] ?? '';
          const h3 = r.trendOk ? '' : `알짜 일률은 ${tex('P_{\\text{net}} = F_{x,\\text{net}}v')}이고 ${tex('dP_{\\text{net}}/dt = F_{x,\\text{net}}^2/m')}이다. 알짜힘이 0이 아니면 늘 커진다(음수이면 0 쪽으로).`;
          const sol = [`P_1 = ${N(s.P1)}\\ \\mathrm{W}`, `P_2 = ${N(s.P2)}\\ \\mathrm{W}`, `P_{\\text{net}} = ${N(s.Pnet, 3)}\\ \\mathrm{W}`].map(t => tex(t)).join('<br>');
          return { ok: r.ok, msg: `${r.ok ? '맞다.' : [h1, h2, h3].filter(Boolean).join(' ')}<br>${sol}<br><small>${M.trend(p) === 'same' ? '알짜힘이 0이라 속력과 알짜 일률이 그대로다.' : '알짜힘이 0이 아니라 속력이 변하고 알짜 일률이 커진다.'}</small>` };
        };
      } else {
        const P0 = M.stateAt(0, p).P, avg = M.averagePower(p);
        box2.text(`힘이 상자를 ${tex(`v_i = ${N(p.vi)}\\ \\mathrm{m/s}`)}에서부터 ${fmt(T)} s 동안 끈다. 재생하기 전에 구해 보자.`);
        box2.text(`① 처음 순간의 일률 ${tex('P')}`, 'pred');
        const a = box2.answer({ label: '처음 일률', unit: 'W', placeholder: '예 5', onEnter: () => check() });
        box2.text(`② ${fmt(T)} s 동안 평균 일률 ${tex('P_{\\text{avg}}')}`, 'pred');
        const b = box2.answer({ label: '평균 일률', unit: 'W', placeholder: '예 12', onEnter: () => check() });
        grade = () => {
          const r = M.checkPull(p, { P0Text: a.value, avgText: b.value });
          if (r.P0Reason === 'unreadable' || r.avgReason === 'unreadable') return { ok: false, msg: '①과 ②를 숫자로 적자. 예 12.5', stop: true };
          const h1 = { noCos: `운동 방향 성분 ${tex('F\\cos\\phi')}만 일을 한다.`, sin: `${tex('\\sin')}이 아니라 ${tex('\\cos')}다.`, value: `${tex('P = Fv\\cos\\phi')} (7.6.6)이다.` }[r.P0Reason] ?? '';
          const h2 = { final: '그 값은 마지막 순간의 일률이다. 평균은 한 일을 걸린 시간으로 나눈다.', initial: '그 값은 처음 순간의 일률이다. 속력이 변하므로 일률도 변한다.', noTime: `한 일을 시간 ${tex('\\Delta t')}로 나누자.`, value: `${tex('P_{\\text{avg}} = W/\\Delta t')} (7.6.1), ${tex('W = F\\cos\\phi\\,\\Delta x')}이다.` }[r.avgReason] ?? '';
          const e = M.stateAt(T, p);
          const sol = [`P = Fv_i\\cos\\phi = ${N(P0)}\\ \\mathrm{W}`, `\\Delta x = ${N(e.x)}\\ \\mathrm{m},\\ W = F\\cos\\phi\\,\\Delta x = ${N(e.W)}\\ \\mathrm{J}`, `P_{\\text{avg}} = W/\\Delta t = ${N(avg)}\\ \\mathrm{W}`].map(t => tex(t)).join('<br>');
          return { ok: r.ok, msg: `${r.ok ? '맞다.' : [h1, h2].filter(Boolean).join(' ')}<br>${sol}` };
        };
      }
      const check = () => {
        const r = grade();
        box2.feedback(r.ok, r.msg);
        if (r.stop) return;
        if (!ui.revealed) { ui.revealed = true; drawP(); }
        ctx.refresh();
      };
      box2.buttons([{ label: '확인', primary: true, onClick: check }]);

      cur = {
        render(o) {
          tNow = o.t;
          const base = Math.floor(o.x);
          let k = 0, j = 0;
          for (let d = base - 6; d <= base + 6; d++) {
            const x = d - o.x, show = Math.abs(x) <= 6.05;
            ticks.setMatrixAt(k++, show ? Mx.makeTranslation(x, 0.012, 0) : hide);
            if (show && d % 5 === 0 && j < 3 && Math.abs(x) < 5.6) { labs[j].move([x, 0.05, 1.45]); labs[j].set(`${d} m`); labs[j].node.dataset.off = ''; j++; }
          }
          for (; j < 3; j++) labs[j].node.dataset.off = '1';
          ticks.instanceMatrix.needsUpdate = true;
          vel.set([0, sz + 0.35, 0], [1, 0, 0], o.v * 0.4);
          gW.setTime(o.t); gP.setTime(o.t);
        },
      };
      stage.setHome({ target: [0, 1.9, -0.8], direction: [0, 0.22, 1], distance: 14, minDistance: 5, maxDistance: 35 });
      return { legend: LEGEND };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
