// 8.4–8.5 3D view. pull: a block pulled along the measuring board with friction, force arrows on it, and an energy
// bar board (W, ΔK, ΔE_th). ramp: a wedge at the left of the board, a level run to the right, and bars
// (U, K, ΔE_th, total). The floor run d is marked after the check.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, block } from '../../../core/forces3d.js';
import { barBoard, BAR } from '../../../core/bars3d.js';
import * as M from './model.js';

const COL = { force: 0xd55e00 };
const rad = d => d * Math.PI / 180;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function base(x0, x1) {
    stage.board(stage.group, x0, x1, 2.4, 0);
    stage.floorPlane(-1.45);
    for (const x of [x0 + 0.9, x1 - 0.9]) for (const z of [-0.6, 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
    const tick = [];
    for (let x = Math.ceil(x0 + 0.4); x <= x1 - 0.4; x++) tick.push([x, 0.012, 0.95], [x, 0.012, 1.15]);
    stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tick.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xd8e5ee })));
  }
  function arrow(color, html) {
    const a = vecArrow(stage, color, { radius: 0.045 });
    const l = stage.label(tex(html), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    return { set(at, v, L) { a.update(at, v, L); l.node.dataset.off = L > 0.02 ? '' : '1'; const n = Math.hypot(...v) || 1; l.move(at.map((c, i) => c + v[i] / n * Math.max(L + 0.3, 0.7))); } };
  }
  function predict(intro, fields, grade) {
    const box = quizBox(ctx.panel, '예측');
    box.text(intro);
    const getters = fields.map(f => {
      if (f.choices) return { choice: box.choices(f.title, f.choices) };
      box.text(f.title, 'pred');
      return { input: box.answer({ label: f.label, unit: f.unit, placeholder: f.placeholder, onEnter: () => check() }) };
    });
    let onReveal = () => {};
    const check = () => {
      const r = grade(getters.map(g => (g.choice ? g.choice() : g.input.value)));
      box.feedback(r.ok, r.message);
      if (r.reveal) onReveal();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    return { set onReveal(f) { onReveal = f; } };
  }

  // ---------------- pull ----------------
  function buildPull(p) {
    const s = M.pull(p), sz = 0.5 + 0.1 * Math.cbrt(p.m), X0 = -p.d / 2 - 0.5, S = 1.6 / Math.max(p.F, p.m * M.G);
    base(X0 - 1.6, X0 + p.d + 6.2);
    for (const x of [X0, X0 + p.d]) stage.mesh(stage.group, new THREE.BoxGeometry(0.04, 0.02, 2.2), stage.lit(0xf4f8fc, 0.2, 0.4), [x, 0.015, 0]);
    stage.label(`<i>d</i> = ${fmt(p.d)} m`, [X0 + p.d / 2, 0.05, 1.3], 'tag', { dy: 0, priority: 1 });
    const b = block(stage, sz, { color: 0xa9bccb, eye: [1, 0, 0] }); stage.group.add(b);
    const F = arrow(COL.force, '\\vec F'), fk = arrow(COL.force, '\\vec f_k'), FN = arrow(COL.force, '\\vec F_N'), Fg = arrow(COL.force, '\\vec F_g');
    const W = s.W, top = Math.max(W, 1e-6) * 1.35;
    const bb = barBoard(stage, { origin: [X0 + p.d + 1.4, 0.3, -0.5], width: 3.4, height: 3.8, range: [0, top], title: '에너지 (J)',
      bars: [{ label: '<i>W</i>', fill: null }, { label: 'Δ<i>K</i>', fill: BAR.K }, { label: 'Δ<i>E</i><sub>th</sub>', fill: BAR.Eth }] });
    predict(`블록이 ${tex(`v_0 = ${N(p.v0)}\\ \\mathrm{m/s}`)}로 움직이는 동안 힘 ${tex(`F = ${N(p.F)}\\ \\mathrm{N}`)}이 ${tex(`d = ${N(p.d)}\\ \\mathrm{m}`)} 끈다. 재생하기 전에 구해 보자.`,
      [{ title: `① 늘어난 열에너지 ${tex('\\Delta E_{\\text{th}}')}`, label: '늘어난 열에너지', unit: 'J', placeholder: '예 20' },
       { title: `② 나중 운동에너지 ${tex('K_f')}`, label: '나중 운동에너지', unit: 'J', placeholder: '예 25' }],
      ([EText, KText]) => {
        const r = M.checkPull(p, { EText, KText });
        if (r.EReason === 'unreadable' || r.KReason === 'unreadable') return { ok: false, message: '①과 ②를 숫자로 적자. 예 22.5' };
        const he = { work: `그 값은 끄는 힘이 한 일 ${tex('Fd')}다. 열에너지는 ${tex('f_k d')} (8.4.7)다.`, noWeight: `${tex('f_k = \\mu_k F_N = \\mu_k mg')}다.`, value: `${tex('\\Delta E_{\\text{th}} = \\mu_k mg\\,d')}이다.` }[r.EReason] ?? '';
        const hk = { noFriction: '마찰로 열에너지가 된 만큼은 운동에너지가 되지 않는다.', noKi: `처음 운동에너지 ${tex('\\tfrac{1}{2}mv_0^2')}를 더하자.`, value: `${tex('K_f = K_i + Fd - f_k d')}이다.` }[r.KReason] ?? '';
        const sol = [`\\Delta E_{\\text{th}} = \\mu_k mgd = ${N(s.Eth)}\\ \\mathrm{J}`, `K_f = \\tfrac{1}{2}mv_0^2 + Fd - \\Delta E_{\\text{th}} = ${N(s.Kf)}\\ \\mathrm{J}`].map(t => tex(t)).join('<br>');
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [he, hk].filter(Boolean).join(' ')}<br>${sol}`, reveal: true };
      });
    cur = {
      render(o) {
        const c = [X0 + o.x, sz / 2, 0];
        b.position.set(...c);
        F.set(c, [1, 0, 0], p.F * S); fk.set([c[0], 0.03, 0.25], [-1, 0, 0], s.fk * S);
        FN.set(c, [0, 1, 0], p.m * M.G * S); Fg.set(c, [0, -1, 0], p.m * M.G * S);
        bb.set([o.W, o.K - s.Ki, o.Eth]);
      },
    };
    const right = X0 + p.d + 5;
    stage.setHome({ target: [(X0 - 1.5 + right) / 2, 1.7, 0], direction: [0, 0.2, 1], distance: 3 + (right - X0 + 1.5) * 0.95, minDistance: 5, maxDistance: 40 });
    return { legend: [{ label: '힘 (force)', color: '#d55e00' }] };
  }

  // ---------------- ramp ----------------
  function buildRamp(p) {
    const r = M.ramp(p), th = rad(p.theta), xL = -p.H / Math.tan(th), sz = 0.3 + 0.05 * Math.cbrt(p.m);
    const xEnd = r.d;                                                           // floor from x = 0 (foot of the plane) to d
    base(Math.min(xL, -0.5) - 1.2, Math.max(xEnd + 1.6, 4) + 4.6);
    const sh = new THREE.Shape();
    sh.moveTo(xL - 0.05, 0); sh.lineTo(0, 0); sh.lineTo(xL, p.H); sh.lineTo(xL - 0.05, p.H); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }); geo.translate(0, 0, -0.6);
    stage.mesh(stage.group, geo, stage.lit(0xa9b8c4, 0.25, 0.5));
    stage.label(`<i>θ</i> = ${p.theta}°`, [-0.9, 0.25, 0.65], 'tag', { dy: 0, priority: 1 });
    stage.label(`<i>H</i> = ${fmt(p.H)} m`, [xL - 0.55, p.H / 2, 0.65], 'tag', { dy: 0, priority: 1 });
    const stop = stage.mesh(stage.group, new THREE.BoxGeometry(0.05, 0.4, 1.0), stage.lit(0x33475b, 0.4, 0.4), [xEnd, 0.2, 0]);
    const stopLab = stage.label(`<i>d</i> = ${fmt(r.d)} m`, [xEnd / 2, 0.05, 1.25], 'tag', { dy: 0, priority: 2 });
    stop.visible = false; stopLab.node.dataset.off = '1';
    const b = block(stage, sz, { color: 0xa9bccb }); stage.group.add(b);
    const bb = barBoard(stage, { origin: [Math.max(xEnd + 1.6, 4) + 0.4, 0.3, -0.5], width: 4, height: 3.8, range: [0, r.E0 * 1.35], title: '에너지 (J)',
      bars: [{ label: '<i>U</i>', fill: BAR.U }, { label: '<i>K</i>', fill: BAR.K }, { label: 'Δ<i>E</i><sub>th</sub>', fill: BAR.Eth }, { label: '합', fill: null }] });
    const pr = predict(`블록을 높이 ${tex(`H = ${N(p.H)}\\ \\mathrm{m}`)}에서 가만히 놓는다. 경사면과 바닥의 ${tex(`\\mu_k = ${N(p.muk, 2)}`)}이다. 재생하기 전에 예측해 보자.`,
      [{ title: `① 바닥에서 미끄러지는 거리 ${tex('d')}`, label: '바닥에서 미끄러지는 거리', unit: 'm', placeholder: '예 3' },
       { title: `② 멈췄을 때 늘어난 열에너지 ${tex('\\Delta E_{\\text{th}}')}는 ${tex('mgH')}보다`, choices: [{ value: 'less', html: '작다' }, { value: 'equal', html: '같다' }, { value: 'more', html: '크다' }] }],
      ([dText, cmp]) => {
        const res = M.checkRamp(p, { dText, cmp });
        if (res.cReason === 'empty') return { ok: null, message: '② 하나를 고르자.' };
        if (res.dReason === 'unreadable') return { ok: false, message: '①을 숫자로 적자. 예 3.2' };
        const hd = { noPlane: `경사면에서도 마찰로 열에너지가 생긴다. ${tex('-\\tfrac{1}{\\tan\\theta}')} 항이 그 몫이다.`, sign: `경사면의 마찰은 바닥에서 갈 거리를 줄인다. 부호를 보자.`, inverse: '분자와 분모가 바뀌었다.', value: `${tex('mgH = \\mu_k mg\\cos\\theta\\,\\tfrac{H}{\\sin\\theta} + \\mu_k mg\\,d')}을 풀자.` }[res.dReason] ?? '';
        const hc = res.cOk ? '' : '블록이 멈추면 운동에너지가 0이고 높이도 0이다. 처음 퍼텐셜 에너지 mgH가 모두 열에너지가 되었다.';
        return { ok: res.ok, message: `${res.ok ? '맞다.' : [hd, hc].filter(Boolean).join(' ')}<br>${tex(`d = H\\left(\\dfrac{1}{\\mu_k} - \\dfrac{1}{\\tan\\theta}\\right) = ${N(r.d)}\\ \\mathrm{m}`)}<br>${tex(`\\Delta E_{\\text{th}} = mgH = ${N(r.E0)}\\ \\mathrm{J}`)}`, reveal: true };
      });
    pr.onReveal = () => { stop.visible = true; stopLab.node.dataset.off = ''; };
    const u = [Math.cos(th), -Math.sin(th), 0], n = [Math.sin(th), Math.cos(th), 0];
    cur = {
      render(o) {
        if (o.onPlane) {
          const c = [xL + u[0] * o.s + n[0] * sz / 2, p.H + u[1] * o.s + n[1] * sz / 2, 0];
          b.position.set(...c); b.rotation.z = -th;
        } else { b.position.set(o.s - r.L, sz / 2, 0); b.rotation.z = 0; }
        bb.set([o.U, o.K, o.Eth, o.U + o.K + o.Eth]);
      },
    };
    const left = Math.min(xL, -0.5) - 1, right = Math.max(xEnd + 1.6, 4) + 4.6;
    stage.setHome({ target: [(left + right) / 2, Math.max(p.H, 3.6) / 2 + 0.3, 0], direction: [0, 0.18, 1], distance: 2 + (right - left) * 0.95, minDistance: 4, maxDistance: 45 });
    return { legend: [] };
  }

  return {
    build(p) { cur = null; return p.activity === 'ramp' ? buildRamp(p) : buildPull(p); },
    render(o) { if (cur) cur.render(o); },
  };
}
