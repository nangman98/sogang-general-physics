// 6.1 3D view. A block on the measuring board with force arrows drawn on it (textbook Fig. 6.1.1 style).
// ramp: a graph board behind the board plots the pull F and the friction f against t (Fig. 6.1.1g).
// angled, incline: a free-body diagram beside the block (Figs. 6.1.3, 6.1.4b). The asked quantities are grey
// and named "= ?" until the prediction is checked.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { vecArrow, dashLine, block, freeBody, GREY, UNKNOWN_LENGTH } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COL = { force: 0xd55e00, acc: 0xcc79a7 };
const LEGEND = [{ label: '힘 (force)', color: '#d55e00' }, { label: '가속도 (acceleration)', color: '#cc79a7' }];
const ACC = 0.3;                                      // m of arrow per m/s²
const sizeOf = m => 0.5 + 0.13 * Math.cbrt(m);        // block side grows with mass (not to scale)
const rad = d => d * Math.PI / 180;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  const add = (a, b) => a.map((c, i) => c + b[i]);
  const mul = (a, k) => a.map(c => c * k);
  const len = a => Math.hypot(...a);
  const val = (html, v) => `${tex(html)} <span class="val">${v}</span>`;

  function ground(x0, x1, width) {
    stage.board(stage.group, x0, x1, width, 0);
    stage.floorPlane(-1.45);
    for (const x of [x0 + 0.9, x1 - 0.9]) for (const z of [-width / 2 + 0.6, width / 2 - 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
  }
  // Arrow drawn on the block, label past the tip. unknown: grey, fixed length, "= ?" until reveal().
  function onBody(color, html, { radius = 0.045, priority = 2, gap = 0.3, minR = 0.75, unknown = false } = {}) {
    const arrow = vecArrow(stage, unknown ? GREY : color, { radius });
    const lab = stage.label(unknown ? `${tex(html)} <span class="val">= ?</span>` : tex(html), [0, 0, 0], 'qty', { dy: 0, priority });
    let hidden = unknown;
    return {
      reveal() { hidden = false; arrow.mat.color.setHex(color); lab.set(tex(html)); },
      set(at, v, L) {
        if (hidden) L = len(v) > 1e-9 ? UNKNOWN_LENGTH : 0;
        arrow.update(at, v, L);
        const n = len(v);
        lab.node.dataset.off = L > 0.02 ? '' : '1';
        if (n > 1e-9) lab.move(add(at, mul(v, Math.max(L + gap, minR) / n)));
      },
      hide() { arrow.visible = false; lab.node.dataset.off = '1'; },
    };
  }
  // Prediction panel. fields: [{ title, unit, placeholder }] or a choice set { choices, title }.
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
      const values = getters.map(g => (g.choice ? g.choice() : g.input.value));
      const r = grade(values);
      if (r.message === null) return;
      box.feedback(r.ok, r.message);
      if (r.reveal) { ui.revealed = true; onReveal(); ctx.refresh(); }
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    return { set onReveal(f) { onReveal = f; } };
  }

  // ---------------- ramp: the pull grows until the block breaks away ----------------
  function buildRamp(p) {
    const L = M.rampLimits(p), T = M.duration(p), S = M.forceScale(p), s = sizeOf(p.m), X0 = -2.6;
    ground(-5.6, 5.6, 2.6);
    const b = block(stage, s, { color: 0xa9bccb, eye: [1, 0, 0] });
    stage.group.add(b);
    // Cord from the eye to a handle that is pulled to the right.
    const cord = stage.mesh(stage.group, new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8), stage.lit(0xd9c49a, 0, 0.9), [0, 0, 0], [0, 0, Math.PI / 2], false);
    const handle = stage.mesh(stage.group, new THREE.CylinderGeometry(0.07, 0.07, 0.5, 16), stage.lit(0x33475b, 0.5, 0.4), [0, 0, 0], [Math.PI / 2, 0, 0]);
    const tag = stage.label('블록', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
    const F = onBody(COL.force, '\\vec F'), fr = onBody(COL.force, '\\vec f', { gap: 0.25 }), FN = onBody(COL.force, '\\vec F_N'), Fg = onBody(COL.force, '\\vec F_g');
    const acc = onBody(COL.acc, '\\vec a', { priority: 3 });

    const top = Math.max(M.RATE * T, L.fsMax), yr = niceRange(0, top * 1.08, { target: 4 });
    const gb = graphBoard(stage, { origin: [-5.6, 0.75, -2.4], width: 11.2, height: 4.3, t: [0, T], y: [yr.min, yr.max], yStep: yr.step, yTitle: '<i>F</i>, <i>f</i> (N)' });
    gb.curve(t => M.rampAt(t, p).F, { color: COL.force, dotted: true, tag: () => '<i>F</i>', samples: 240 });
    gb.curve(t => M.rampAt(t, p).f, { color: COL.force, tag: v => `<i>f</i> = ${fmt(v, { zero: 1e-9 })} N`, samples: 480 });
    const ring = gb.mark(L.tb, L.fsMax); ring.visible = false;
    const ringLabel = stage.label(`${tex('f_{s,\\max}')} = ${fmt(L.fsMax)} N`, gb.at(L.tb, L.fsMax), 'gval', { dy: -18, priority: 4 });
    ringLabel.node.dataset.off = '1';

    const pr = predict('당기는 힘을 천천히 늘린다. 재생하기 전에 두 값을 구해 보자.',
      [{ title: `① 블록이 미끄러지기 시작할 때의 ${tex('F')}`, label: '미끄러지기 시작할 때의 힘', unit: 'N', placeholder: '예 20' },
       { title: `② 미끄러지기 시작한 뒤의 마찰력 ${tex('f')}`, label: '미끄러지는 동안의 마찰력', unit: 'N', placeholder: '예 12' }],
      ([breakText, afterText]) => {
        const r = M.checkRamp(p, { breakText, afterText });
        if (r.breakReason === 'unreadable' || r.afterReason === 'unreadable') return { message: '①과 ②를 숫자로 적자. 예 20.5', ok: false };
        const hintB = { kinetic: `${tex('\\mu_k')}가 아니라 ${tex('\\mu_s')}다. 블록이 서 있는 동안은 정지 마찰력이 버틴다.`, weight: `그 값은 ${tex('F_N = mg')}다. 최대 정지 마찰력은 ${tex('\\mu_s F_N')}이다.`, value: `최대 정지 마찰력 ${tex('f_{s,\\max} = \\mu_s F_N')} (6.1.1)을 넘어야 미끄러진다.` }[r.breakReason] ?? '';
        const hintA = { static: `미끄러지면 마찰력은 운동 마찰력 ${tex('\\mu_k F_N')}로 줄어든다.`, value: `미끄러지는 동안은 ${tex('f_k = \\mu_k F_N')} (6.1.2)이다.` }[r.afterReason] ?? '';
        const sol = `${tex(`F = f_{s,\\max} = \\mu_s mg = ${N(L.fsMax)}\\ \\mathrm{N}`)}<br>${tex(`f_k = \\mu_k mg = ${N(L.fk)}\\ \\mathrm{N}`)}`;
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hintB, hintA].filter(Boolean).join(' ')}<br>${sol}`, reveal: true };
      });
    pr.onReveal = () => { ring.visible = true; ringLabel.node.dataset.off = ''; };

    cur = {
      render(o) {
        const x = X0 + o.x, c = [x, s / 2, 0];
        b.position.set(...c);
        cord.position.set(x + s / 2 + 0.55, s / 2, 0); handle.position.set(x + s / 2 + 1.1, s / 2, 0);
        tag.move([x - s / 2 - 0.45, s + 0.15, 0.4]);
        F.set(c, [1, 0, 0], o.F * S);
        fr.set([x, 0.03, 0.2], [-1, 0, 0], o.f * S);
        FN.set(c, [0, 1, 0], o.FN * S);
        Fg.set(c, [0, -1, 0], o.FN * S);
        if (o.a > 1e-9) acc.set([x, s + 0.35, 0], [1, 0, 0], o.a * ACC); else acc.hide();
        gb.setTime(o.t);
      },
    };
    stage.setHome({ target: [0, 2.0, -0.9], direction: [0, 0.3, 1], distance: 16, minDistance: 6, maxDistance: 40 });
    return { legend: LEGEND };
  }

  // ---------------- angled force on a block on a level floor ----------------
  function buildAngled(p) {
    const s = M.angled(p), S = M.forceScale(p), sz = sizeOf(p.m), X0 = -3.2, th = rad(p.theta);
    ground(-5.4, 5.8, 2.6);
    const b = block(stage, sz, { color: 0xa9bccb });
    stage.group.add(b);
    const tag = stage.label('블록', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
    const Fv = [s.Fx, s.Fy, 0];
    const F = onBody(COL.force, '\\vec F'), fr = onBody(COL.force, '\\vec f', { unknown: true, gap: 0.25 });
    const FN = onBody(COL.force, '\\vec F_N'), Fg = onBody(COL.force, '\\vec F_g');
    const acc = onBody(COL.acc, '\\vec a', { priority: 3 });

    // Free-body diagram right of the block, with the components of F as dashed lines.
    const o = [3.5, Math.max(1.9, s.FN * S + 0.4), 0];
    const fb = freeBody(stage, o, {
      axes: [{ name: 'x', dir: [1, 0, 0], side: [0, -0.3, 0] }, { name: 'y', dir: [0, 1, 0], side: [-0.3, 0, 0] }],
      forces: [{ v: Fv, html: '\\vec F', value: `${fmt(p.F)} N` }, { v: [-s.f, 0, 0], html: '\\vec f', unknown: true },
               { v: [0, s.FN, 0], html: '\\vec F_N' }, { v: [0, -p.m * M.G, 0], html: '\\vec F_g', value: `${fmt(p.m * M.G)} N` }],
      title: '블록 자유물체도', titleAt: add(o, [0, -(p.m * M.G * S + 0.95), 0]), scale: S, tex,
    });
    if (p.F > 0 && th > 0) {
      const fx = [s.Fx * S, 0, 0], fy = [0, s.Fy * S, 0];
      dashLine(stage, o, add(o, fx), COL.force); dashLine(stage, add(o, fx), add(o, add(fx, fy)), COL.force);
    }

    const pr = predict('재생하기 전에 블록이 미끄러지는지 고르고 마찰력의 크기를 구해 보자.',
      [{ title: '① 블록은', choices: [{ value: 'slide', html: '미끄러진다' }, { value: 'rest', html: '정지해 있다' }] },
       { title: `② 마찰력의 크기 ${tex('f')}`, label: '마찰력의 크기', unit: 'N', placeholder: '예 12.5' }],
      ([move, fText]) => {
        if (!move) return { message: '먼저 ① 블록이 미끄러지는지 고르자.', ok: null };
        const r = M.checkAngled(p, { move, fText });
        if (r.fReason === 'unreadable') return { message: '②를 숫자로 적자. 예 12.5', ok: false };
        const sign = p.dir === 'pull' ? '-' : '+';
        const hintM = { wrong: `${tex('F\\cos\\theta')}와 ${tex('f_{s,\\max} = \\mu_s F_N')}을 비교하자.`, noFy: `${tex('F_N')}은 ${tex('mg')}가 아니다. ${tex('F')}의 연직 성분 ${tex('F\\sin\\theta')}가 ${tex('F_N')}을 바꾼다.` }[r.moveReason] ?? '';
        const hintF = {
          fsmax: `정지해 있으면 마찰력은 ${tex('F')}의 수평 성분과 같다. ${tex('\\mu_s F_N')}은 최댓값이다.`,
          kineticAtRest: `정지해 있으면 정지 마찰력이다. ${tex('\\mu_k F_N')}이 아니다.`,
          noFy: `${tex('F_N = mg')}로 계산했다. ${tex('F\\sin\\theta')}도 넣자.`,
          staticWhileSliding: `미끄러지면 운동 마찰력 ${tex('\\mu_k F_N')}이다.`,
          value: s.slides ? `미끄러지면 ${tex('f = \\mu_k F_N')}이다.` : `정지해 있으면 ${tex('f = F\\cos\\theta')}이다.`,
        }[r.fReason] ?? '';
        const sol = [`F_N = mg ${sign} F\\sin\\theta = ${N(s.FN)}\\ \\mathrm{N}`, `F\\cos\\theta = ${N(s.Fx)}\\ \\mathrm{N}`,
          `f_{s,\\max} = \\mu_s F_N = ${N(s.fsMax)}\\ \\mathrm{N}`,
          s.slides ? `f = \\mu_k F_N = ${N(s.f)}\\ \\mathrm{N}` : `f = F\\cos\\theta = ${N(s.f)}\\ \\mathrm{N}`].map(t => tex(t)).join('<br>');
        const verdict = `<small>${s.slides ? 'F cos θ가 최대 정지 마찰력보다 커서 미끄러진다.' : 'F cos θ가 최대 정지 마찰력을 넘지 않아 정지해 있다.'}</small>`;
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hintM, hintF].filter(Boolean).join(' ')}<br>${sol}<br>${verdict}`, reveal: true };
      });
    pr.onReveal = () => {
      fr.reveal(); fb.reveal();
      fb.items[2].lab.set(val('\\vec F_N', `${fmt(s.FN)} N`));
      fb.items[1].lab.set(val('\\vec f', `${fmt(s.f, { zero: 1e-9 })} N`));
    };

    cur = {
      render(ob) {
        const x = X0 + ob.x, c = [x, sz / 2, 0];
        b.position.set(...c);
        tag.move([x - sz / 2 - 0.45, sz + 0.15, 0.4]);
        F.set(c, Fv, p.F * S);
        fr.set([x, 0.03, 0.2], [-1, 0, 0], s.f * S);
        FN.set(c, [0, 1, 0], s.FN * S);
        Fg.set(c, [0, -1, 0], p.m * M.G * S);
        if (ui.revealed && s.a > 1e-9) acc.set([x, sz + 0.4, 0], [1, 0, 0], s.a * ACC); else acc.hide();
      },
    };
    const yTop = o[1] + Math.max(s.FN * S + 0.9, 1.4), yLow = Math.min(-0.6, o[1] - p.m * M.G * S - 1.2);
    stage.setHome({ target: [0.3, (yTop + yLow) / 2, 0], direction: [0, 0.18, 1], distance: 8 + (yTop - yLow) * 1.2, minDistance: 5, maxDistance: 40 });
    return { legend: LEGEND };
  }

  // ---------------- block on an incline ----------------
  function buildIncline(p) {
    const s = M.incline(p), S = M.forceScale(p), sz = sizeOf(p.m), th = rad(p.incl);
    // Wedge: top at the left, the slope runs down to the right corner (xR, 0). x axis down the slope.
    const Ls = 6, xR = 1.2, xL = xR - Ls * Math.cos(th), h = Ls * Math.sin(th), d0 = 0.9;
    const u = [Math.cos(th), -Math.sin(th), 0], n = [Math.sin(th), Math.cos(th), 0];
    const Ptop = [xL, h, 0];
    ground(Math.min(xL, xR - 5) - 1.2, xR + 4.8, 2.6);
    if (h > 0.01) {
      const sh = new THREE.Shape();
      sh.moveTo(xL - 0.05, 0); sh.lineTo(xR, 0); sh.lineTo(xL, h); sh.lineTo(xL - 0.05, h); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: false });
      geo.translate(0, 0, -0.7);
      stage.mesh(stage.group, geo, stage.lit(0xa9b8c4, 0.25, 0.5));
      // Angle mark at the bottom corner.
      const arc = Array.from({ length: 25 }, (_, i) => { const a = Math.PI - th * i / 24; return [xR + 1.1 * Math.cos(a), 1.1 * Math.sin(a), 0.72]; });
      stage.line(arc, 0x33475b);
      stage.label(`<i>θ</i> = ${p.incl}°`, [xR - 1.55 * Math.cos(th / 2), 1.55 * Math.sin(th / 2) + 0.05, 0.72], 'tag', { dy: 0, priority: 1 });
    }
    const b = block(stage, sz, { color: 0xa9bccb });
    b.rotation.z = -th; stage.group.add(b);
    const tag = stage.label('블록', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
    const FgV = [0, -p.m * M.G, 0], FNV = mul(n, s.FN), fV = mul(u, -s.f);
    const Fg = onBody(COL.force, '\\vec F_g'), FN = onBody(COL.force, '\\vec F_N'), fr = onBody(COL.force, '\\vec f', { unknown: true, gap: 0.25 });
    const acc = onBody(COL.acc, '\\vec a', { priority: 3 });

    // Critical-angle slope, shown after the check.
    const tc = rad(Math.min(s.thetaC, 75)), guide = [];
    const Lg = 6;
    guide.push(dashLine(stage, [xR, 0, 0.72], [xR - Lg * Math.cos(tc), Lg * Math.sin(tc), 0.72], 0x33475b, { dash: 0.2, gap: 0.12 }));
    const guideLabel = stage.label(`<i>θ</i><sub>c</sub> = ${fmt(s.thetaC)}°`, [xR - (Lg + 0.4) * Math.cos(tc), (Lg + 0.4) * Math.sin(tc), 0.72], 'tag', { dy: 0, priority: 2 });
    for (const g of guide) g.visible = false;
    guideLabel.node.dataset.off = '1';

    // Free-body diagram right of the wedge, axes tilted with x down the slope (Fig. 6.1.4b).
    const o = [xR + 2.7, Math.max(2.4, p.m * M.G * S + 0.9), 0];
    const fb = freeBody(stage, o, {
      axes: [{ name: 'x', dir: u, side: mul(n, -0.3) }, { name: 'y', dir: n, side: mul(u, -0.3) }],
      forces: [{ v: FgV, html: '\\vec F_g', value: `${fmt(p.m * M.G)} N` }, { v: FNV, html: '\\vec F_N' }, { v: fV, html: '\\vec f', unknown: true }],
      title: '블록 자유물체도', titleAt: add(o, [0, -(p.m * M.G * S + 0.95), 0]), scale: S, tex,
    });
    if (th > 0) {
      const par = mul(u, p.m * M.G * Math.sin(th) * S), per = mul(n, -p.m * M.G * Math.cos(th) * S);
      dashLine(stage, o, add(o, par), COL.force); dashLine(stage, add(o, par), add(add(o, par), per), COL.force);
      dashLine(stage, o, add(o, per), COL.force);
    }

    const pr = predict('재생하기 전에 임계각과 지금 빗면 각에서의 가속도를 구해 보자.',
      [{ title: `① 임계각 ${tex('\\theta_c')} (블록이 미끄러지기 시작하는 빗면 각)`, label: '임계각', unit: '°', placeholder: '예 25' },
       { title: `② 지금 빗면 각에서 가속도 크기 ${tex('a')}<small>미끄러지지 않으면 0</small>`, label: '가속도 크기', unit: 'm/s²', placeholder: '예 1.5' }],
      ([cText, aText]) => {
        const r = M.checkIncline(p, { cText, aText });
        if (r.cReason === 'unreadable' || r.aReason === 'unreadable') return { message: '①과 ②를 숫자로 적자. 예 2.5', ok: false };
        const hintC = { sin: `${tex('\\sin\\theta_c')}가 아니라 ${tex('\\tan\\theta_c = \\mu_s')}다.`, cos: `${tex('\\cos\\theta_c')}가 아니라 ${tex('\\tan\\theta_c = \\mu_s')}다.`, value: `${tex('mg\\sin\\theta_c = \\mu_s mg\\cos\\theta_c')}에서 ${tex('\\theta_c')}를 구하자.` }[r.cReason] ?? '';
        const hintA = { rest: `이 빗면 각은 ${tex('\\theta_c')}보다 작아서 블록이 정지해 있다.`, noFriction: `운동 마찰력 ${tex('\\mu_k mg\\cos\\theta')}를 빼자.`, static: `미끄러지는 동안은 ${tex('\\mu_s')}가 아니라 ${tex('\\mu_k')}를 쓴다.`, value: `${tex('mg\\sin\\theta - \\mu_k mg\\cos\\theta = ma')}이다.` }[r.aReason] ?? '';
        const sol = [`\\theta_c = \\tan^{-1}\\mu_s = ${N(s.thetaC)}^\\circ`,
          s.slides ? `a = g(\\sin\\theta - \\mu_k\\cos\\theta) = ${N(s.a)}\\ \\mathrm{m/s^2}` : 'a = 0'].map(t => tex(t)).join('<br>');
        const verdict = `<small>${s.slides ? '빗면 각이 임계각보다 커서 미끄러진다.' : '빗면 각이 임계각 이하라 정지 마찰력이 블록을 잡고 있다.'}</small>`;
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hintC, hintA].filter(Boolean).join(' ')}<br>${sol}<br>${verdict}`, reveal: true };
      });
    pr.onReveal = () => {
      fr.reveal(); fb.reveal();
      fb.items[1].lab.set(val('\\vec F_N', `${fmt(s.FN)} N`));
      fb.items[2].lab.set(val('\\vec f', `${fmt(s.f, { zero: 1e-9 })} N`));
      for (const g of guide) g.visible = true;
      guideLabel.node.dataset.off = '';
    };

    cur = {
      render(ob) {
        const c = add(add(Ptop, mul(u, d0 + ob.x)), mul(n, sz / 2));
        b.position.set(...c);
        tag.move(add(add(c, mul(n, sz / 2 + 0.35)), [-0.3, 0, 0.5]));
        Fg.set(c, FgV, p.m * M.G * S);
        FN.set(c, FNV, s.FN * S);
        fr.set(add(c, mul(n, -sz / 2 + 0.03)), mul(u, -1), s.f * S);
        if (ui.revealed && s.a > 1e-9) acc.set(add(c, mul(n, sz / 2 + 0.4)), u, s.a * ACC); else acc.hide();
      },
    };
    const yTop = Math.max(h + 1.4, o[1] + Math.max(s.FN * S + 0.9, 1.4)), yLow = Math.min(-0.6, o[1] - p.m * M.G * S - 1.2);
    const xLeft = Math.min(xL, xR - Lg * Math.cos(tc)) - 1, xRight = o[0] + 1.8;
    stage.setHome({ target: [(xLeft + xRight) / 2, (yTop + yLow) / 2, 0], direction: [0, 0.16, 1], distance: 5 + Math.max(yTop - yLow, (xRight - xLeft) * 0.62) * 1.25, minDistance: 5, maxDistance: 45 });
    return { legend: LEGEND };
  }

  return {
    build(p) {
      cur = null; ui.revealed = false;
      return { ramp: buildRamp, angled: buildAngled, incline: buildIncline }[p.activity](p);
    },
    render(o) { if (cur) cur.render(o); },
  };
}
