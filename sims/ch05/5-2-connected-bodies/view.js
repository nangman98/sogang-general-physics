// 5.3 3D view. Blocks joined by a cord over a pulley, with force arrows drawn on each block (textbook Fig. 5.3.4
// style) and a free-body diagram for each block beside it (Fig. 5.3.5 style, tilted axes on the plane as in
// Fig. 5.3.6). Force arrows are always shown. Acceleration and tension appear after the prediction is checked.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, dashLine, block, freeBody, GREY, UNKNOWN_LENGTH } from './forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COL = { force: 0xd55e00, acc: 0xcc79a7 };
const LEGEND = [{ label: '힘 (force)', color: '#d55e00' }, { label: '가속도 (acceleration)', color: '#cc79a7' }];
const sizeOf = m => 0.3 + 0.12 * Math.cbrt(m);          // block side grows with mass (not to scale)

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  const add = (a, b) => a.map((c, i) => c + b[i]);
  const mul = (a, k) => a.map(c => c * k);
  const len = a => Math.hypot(...a);
  const up = new THREE.Vector3(0, 1, 0);

  function ground(x0, x1, width) {
    stage.board(stage.group, x0, x1, width, 0);
    stage.floorPlane(-1.45);
    for (const x of [x0 + 0.9, x1 - 0.9]) for (const z of [-width / 2 + 0.6, width / 2 - 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
  }
  // Arrow drawn on a block, with its label past the tip.
  // unknown: the tension is asked for, so its arrows are grey, of fixed length and named "= ?" until reveal().
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
  // Cord piece between two points (thin cylinder moved every frame).
  function cordPiece() {
    const m = stage.mesh(stage.group, new THREE.CylinderGeometry(0.018, 0.018, 1, 8), stage.lit(0xd9c49a, 0, 0.9), [0, 0, 0], [0, 0, 0], false);
    const d = new THREE.Vector3();
    m.set = (a, b) => {
      d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const L = d.length(); m.visible = L > 1e-3;
      m.scale.set(1, Math.max(L, 1e-3), 1);
      m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      if (L > 1e-6) m.quaternion.setFromUnitVectors(up, d.normalize());
    };
    return m;
  }
  // Pulley wheel in the x–y plane with three spokes, turning about z.
  function pulley(center, r) {
    const g = new THREE.Group(); g.position.set(...center); stage.group.add(g);
    const wheel = new THREE.Group(); g.add(wheel);
    stage.mesh(wheel, new THREE.CylinderGeometry(r, r, 0.1, 48), stage.lit(0xb8c2cb, 0.7, 0.3), [0, 0, 0], [Math.PI / 2, 0, 0]);
    stage.mesh(wheel, new THREE.TorusGeometry(r, 0.03, 8, 48), stage.lit(0x56687a, 0.6, 0.35));
    const spokes = new THREE.InstancedMesh(new THREE.BoxGeometry(r * 1.7, 0.05, 0.13), stage.lit(0x56687a, 0.6, 0.35), 3);
    const Mx = new THREE.Matrix4();
    for (let k = 0; k < 3; k++) spokes.setMatrixAt(k, Mx.makeRotationZ(k * Math.PI / 3));
    wheel.add(spokes);
    stage.mesh(g, new THREE.CylinderGeometry(0.06, 0.06, 0.3, 16), stage.lit(0x33475b, 0.5, 0.4), [0, 0, 0], [Math.PI / 2, 0, 0]);
    return wheel;
  }
  // Static cord over the pulley from angle a0 to a1 (radians, measured from +x).
  function cordArc(center, r, a0, a1) {
    const pts = Array.from({ length: 25 }, (_, i) => { const a = a0 + (a1 - a0) * i / 24; return new THREE.Vector3(center[0] + (r + 0.018) * Math.cos(a), center[1] + (r + 0.018) * Math.sin(a), center[2]); });
    stage.mesh(stage.group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 6, false), stage.lit(0xd9c49a, 0, 0.9), [0, 0, 0], [0, 0, 0], false);
  }

  // ---- shared prediction panel: direction, |a| and T ----
  function predict(p, labels, solution, hints) {
    const box = quizBox(ctx.panel, '예측');
    box.text('재생하기 전에 움직이는 방향과 두 값을 구해 보자.');
    const dir = box.choices('① 움직이는 방향', labels);
    box.text(`② 가속도 크기 ${tex('a')}`, 'pred');
    const aIn = box.answer({ label: '가속도 크기', unit: 'm/s²', placeholder: '예 1.5', onEnter: () => check() });
    box.text(`③ 장력 (tension) ${tex('T')}`, 'pred');
    const TIn = box.answer({ label: '장력', unit: 'N', placeholder: '예 12.5', onEnter: () => check() });
    let onReveal = () => {};
    const check = () => {
      if (!dir()) { box.feedback(null, '먼저 ① 움직이는 방향을 고르자.'); return; }
      const r = M.check(p, { dir: dir(), aText: aIn.value, TText: TIn.value });
      if (r.aReason === 'unreadable' || r.TReason === 'unreadable') { box.feedback(false, '②와 ③을 숫자로 적자. 예 2.5'); return; }
      const msgs = [r.dirOk ? '' : hints.dir, hints.a[r.aReason] ?? '', hints.T[r.TReason] ?? ''].filter(Boolean);
      box.feedback(r.ok, `${r.ok ? '맞다.' : msgs.join(' ')}<br>${solution()}`);
      ui.revealed = true; onReveal(); ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    return { set onReveal(f) { onReveal = f; } };
  }
  const commonA = {
    freefall: `줄이 블록을 잡아당기므로 ${tex('a')}는 ${tex('g')}보다 작다.`,
    value: `두 블록의 식을 더해 ${tex('T')}를 없애 보자.`,
  };
  const commonT = { value: `구한 ${tex('a')}를 한 블록의 식에 넣어 ${tex('T')}를 구하자.` };

  // ---------------- Atwood's machine ----------------
  function buildAtwood(p) {
    // Tall stand: the blocks start at Y0 and can move 3.5 m (model.js TRAVEL) before one reaches the board.
    const { a, T } = M.atwood(p), S = M.scales(p), r = 0.45, Y0 = 3.9, top = 8.2;
    ground(-3.9, 3.9, 2.8);
    // Stand: two posts, a beam, and a hanger for the pulley.
    const steel = stage.lit(0x6f8091, 0.6, 0.35);
    for (const x of [-1.6, 1.6]) {
      stage.mesh(stage.group, new THREE.CylinderGeometry(0.07, 0.07, top + 0.6, 20), steel, [x, (top + 0.6) / 2, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.5, 0.06, 0.9), steel, [x, 0.03, 0]);
    }
    stage.mesh(stage.group, new THREE.BoxGeometry(3.5, 0.14, 0.18), steel, [0, top + 0.6, 0]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.08, 0.6, 0.06), steel, [0, top + 0.3, 0.1]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.08, 0.6, 0.06), steel, [0, top + 0.3, -0.1]);
    const wheel = pulley([0, top, 0], r);
    cordArc([0, top, 0], r, 0, Math.PI);

    const s1 = sizeOf(p.m1), s2 = sizeOf(p.m2);
    const b1 = block(stage, s1, { color: 0xa9bccb }), b2 = block(stage, s2, { color: 0x8aa0b4 });
    stage.group.add(b1, b2);
    const c1 = cordPiece(), c2 = cordPiece();
    const tag1 = stage.label('블록 1', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
    const tag2 = stage.label('블록 2', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
    const on = [
      { v: [0, T, 0], a: onBody(COL.force, '\\vec T', { unknown: true }), k: 1 }, { v: [0, -p.m1 * M.G, 0], a: onBody(COL.force, '\\vec F_{g1}'), k: 1 },
      { v: [0, T, 0], a: onBody(COL.force, '\\vec T', { unknown: true }), k: 2 }, { v: [0, -p.m2 * M.G, 0], a: onBody(COL.force, '\\vec F_{g2}'), k: 2 },
    ];
    const Tval = `${fmt(T)} N`, W = m => `${fmt(m * M.G)} N`;
    const acc1 = onBody(COL.acc, '\\vec a', { priority: 3 }), acc2 = onBody(COL.acc, '\\vec a', { priority: 3 });

    // Free-body diagrams left and right.
    const axes = [{ name: 'x', dir: [1, 0, 0], side: [0, -0.3, 0] }, { name: 'y', dir: [0, 1, 0], side: [-0.3, 0, 0] }];
    const f1 = [-3.2, Y0, 0], f2 = [3.2, Y0, 0];
    // Titles sit below the label of the gravitational force.
    const below = m => -(Math.max(m * M.G * S.F, 0.5) + 0.85);
    const fb1 = freeBody(stage, f1, { axes, forces: [{ v: [0, T, 0], html: '\\vec T', value: Tval, unknown: true }, { v: [0, -p.m1 * M.G, 0], html: '\\vec F_{g1}', value: W(p.m1) }], title: '블록 1 자유물체도', titleAt: add(f1, [-0.2, below(p.m1), 0]), scale: S.F, tex });
    const fb2 = freeBody(stage, f2, { axes, forces: [{ v: [0, T, 0], html: '\\vec T', value: Tval, unknown: true }, { v: [0, -p.m2 * M.G, 0], html: '\\vec F_{g2}', value: W(p.m2) }], title: '블록 2 자유물체도', titleAt: add(f2, [0.2, below(p.m2), 0]), scale: S.F, tex });

    const pr = predict(p,
      [{ value: 'pos', html: '블록 2가 내려간다' }, { value: 'neg', html: '블록 1이 내려간다' }, { value: 'none', html: '움직이지 않는다' }],
      () => `${tex(`a = \\dfrac{m_2 - m_1}{m_1 + m_2}g = ${N(a)}\\ \\mathrm{m/s^2}`)}<br>${tex(`T = \\dfrac{2m_1 m_2}{m_1 + m_2}g = ${N(T)}\\ \\mathrm{N}`)}`,
      {
        dir: `두 블록의 중력 차 ${tex('m_2 g - m_1 g')}의 부호가 방향을 정한다.`,
        a: { ...commonA, oneMass: `두 블록이 함께 가속하므로 질량의 합 ${tex('m_1 + m_2')}로 나눈다.` },
        T: { ...commonT, weight: `그 값은 한 블록의 중력 크기다. 블록이 가속하면 ${tex('T')}는 ${tex('m_1 g')}와 ${tex('m_2 g')} 사이에 있다.` },
      });
    let shown = false;
    pr.onReveal = () => { shown = true; fb1.reveal(); fb2.reveal(); for (const it of on) it.a.reveal(); };

    cur = {
      render(o) {
        const y1 = Y0 + o.s, y2 = Y0 - o.s;               // a > 0: block 2 down, block 1 up
        b1.position.set(-r, y1, 0); b2.position.set(r, y2, 0);
        c1.set([-r, top, 0], [-r, y1 + s1 / 2 + s1 * 0.12, 0]); c2.set([r, top, 0], [r, y2 + s2 / 2 + s2 * 0.12, 0]);
        wheel.rotation.z = -o.s / r;
        tag1.move([-r - s1 / 2 - 0.5, y1 + 0.05, 0.3]); tag2.move([r + s2 / 2 + 0.5, y2 + 0.05, 0.3]);
        for (const it of on) {
          const c = it.k === 1 ? [-r, y1, 0] : [r, y2, 0];
          it.a.set(c, it.v, len(it.v) * S.F);
        }
        if (!shown || Math.abs(o.a) < 1e-9) { acc1.hide(); acc2.hide(); return; }
        acc1.set([-r - s1 / 2 - 0.25, y1, 0], [0, Math.sign(o.a), 0], Math.abs(o.a) * S.a);
        acc2.set([r + s2 / 2 + 0.25, y2, 0], [0, -Math.sign(o.a), 0], Math.abs(o.a) * S.a);
      },
    };
    stage.setHome({ target: [0, 4.3, 0], direction: [0, 0.16, 1], distance: 18.5, minDistance: 6, maxDistance: 40 });
    return { legend: LEGEND };
  }

  // ---------------- block on a frictionless incline, tied to a hanging block ----------------
  function buildIncline(p) {
    const { a, T } = M.incline(p), S = M.scales(p), th = p.theta * Math.PI / 180;
    // A table on the board with a wedge on top (no wedge when θ = 0, as in Sample Problem 5.3.1). The board ends
    // at the table edge, so block H hangs past it over the floor.
    const L = 5.0, H0 = 3.0, xR = 1.2, xL = xR - L * Math.cos(th), yTop = H0 + L * Math.sin(th);
    const u = [Math.cos(th), Math.sin(th), 0], n = [-Math.sin(th), Math.cos(th), 0];
    const sS = sizeOf(p.M), sH = sizeOf(p.m), rp = 0.25, d0 = 2.6;            // S starts 2.6 m from the top corner
    ground(xL - 2.6, xR + 0.05, 2.6);
    const x0 = Math.min(xL, xR - 3.2);
    stage.mesh(stage.group, new THREE.BoxGeometry(xR - x0, H0, 1.3), stage.lit(0x6f8091, 0.45, 0.45), [(x0 + xR) / 2, H0 / 2, 0]);
    if (th > 0) {
      const sh = new THREE.Shape();
      // A 5 cm back face keeps the plane visible at steep angles (at 90° the wedge is a wall); H always hangs right of it.
      sh.moveTo(xL, H0); sh.lineTo(xR + 0.05, H0); sh.lineTo(xR + 0.05, yTop); sh.lineTo(xR, yTop); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.3, bevelEnabled: false });
      geo.translate(0, 0, -0.65);
      stage.mesh(stage.group, geo, stage.lit(0xa9b8c4, 0.25, 0.5));
    }
    const Ptop = [xR, yTop, 0];
    const Pc = add(add(Ptop, mul(u, 0.32)), mul(n, sS / 2 - rp));          // the cord leaves S parallel to the plane
    stage.mesh(stage.group, new THREE.BoxGeometry(0.1, 0.1, 0.5), stage.lit(0x33475b, 0.5, 0.4), add(Ptop, mul(u, 0.12)));
    stage.mesh(stage.group, new THREE.BoxGeometry(0.06, len([Pc[0] - xR, Pc[1] - yTop]) + 0.1, 0.06), stage.lit(0x33475b, 0.5, 0.4), [(xR + Pc[0]) / 2 + 0.02, (yTop + Pc[1]) / 2, 0.12]);
    const wheel = pulley(Pc, rp);
    cordArc(Pc, rp, th + Math.PI / 2, 0);
    const xH = Pc[0] + rp + 0.018, yH0 = Pc[1] - (rp + sH / 2 + M.TRAVEL.incline + 0.12);   // room to rise by TRAVEL

    const bS = block(stage, sS, { color: 0xa9bccb, eye: [1, 0, 0] }), bH = block(stage, sH, { color: 0x8aa0b4 });
    bS.rotation.z = th; stage.group.add(bS, bH);
    const cS = cordPiece(), cH = cordPiece();
    const tagS = stage.label('블록 S', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
    const tagH = stage.label('블록 H', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
    const FgS = [0, -p.M * M.G, 0], FN = mul(n, p.M * M.G * Math.cos(th)), Tu = mul(u, T);
    const FgH = [0, -p.m * M.G, 0];
    const onS = [{ v: Tu, a: onBody(COL.force, '\\vec T', { unknown: true }) }, { v: FN, a: onBody(COL.force, '\\vec F_N') }, { v: FgS, a: onBody(COL.force, '\\vec F_{gS}') }];
    const onH = [{ v: [0, T, 0], a: onBody(COL.force, '\\vec T', { unknown: true }) }, { v: FgH, a: onBody(COL.force, '\\vec F_{gH}') }];
    const Tval = `${fmt(T)} N`;
    const accS = onBody(COL.acc, '\\vec a', { priority: 3 }), accH = onBody(COL.acc, '\\vec a', { priority: 3 });

    // Free-body diagrams. S: tilted axes, x up the plane (Fig. 5.3.6), with the two components of F_gS.
    const fS = [xL - 1.9, yTop + 0.7, 0], fH = [xH + 2.3, yH0, 0];
    const fbS = freeBody(stage, fS, {
      axes: [{ name: 'x', dir: u, side: mul(n, -0.3) }, { name: 'y', dir: n, side: mul(u, -0.3) }],
      forces: [{ v: Tu, html: '\\vec T', value: Tval, unknown: true }, { v: FN, html: '\\vec F_N', value: `${fmt(len(FN), { zero: 1e-9 })} N` }, { v: FgS, html: '\\vec F_{gS}', value: `${fmt(p.M * M.G)} N` }],
      title: '블록 S 자유물체도', titleAt: add(fS, [0, -(Math.max(p.M * M.G * S.F, 0.5) + 0.85), 0]), scale: S.F, tex,
    });
    if (th > 0) {
      const par = mul(u, -p.M * M.G * Math.sin(th) * S.F), per = mul(n, -p.M * M.G * Math.cos(th) * S.F);
      dashLine(stage, fS, add(fS, par), COL.force); dashLine(stage, add(fS, par), add(add(fS, par), per), COL.force);
      dashLine(stage, fS, add(fS, per), COL.force);
      if (len(par) > 0.35) stage.label(tex('Mg\\sin\\theta'), add(add(fS, mul(par, 0.7)), mul(n, 0.42)), 'gtick', { dy: 0, priority: 1 });
      if (len(per) > 0.35) stage.label(tex('Mg\\cos\\theta'), add(add(fS, mul(per, 0.55)), mul(u, 0.55)), 'gtick', { dy: 0, priority: 1 });
    }
    const fbH = freeBody(stage, fH, {
      axes: [{ name: 'x', dir: [1, 0, 0], side: [0, -0.3, 0] }, { name: 'y', dir: [0, 1, 0], side: [-0.3, 0, 0] }],
      forces: [{ v: [0, T, 0], html: '\\vec T', value: Tval, unknown: true }, { v: FgH, html: '\\vec F_{gH}', value: `${fmt(p.m * M.G)} N` }],
      title: '블록 H 자유물체도', titleAt: add(fH, [0.3, -(Math.max(p.m * M.G * S.F, 0.5) + 0.85), 0]), scale: S.F, tex,
    });

    const pr = predict(p,
      [{ value: 'pos', html: '블록 S가 빗면 위로 (블록 H는 아래로)' }, { value: 'neg', html: '블록 S가 빗면 아래로 (블록 H는 위로)' }, { value: 'none', html: '움직이지 않는다' }],
      () => `${tex(`a = \\dfrac{m - M\\sin\\theta}{M + m}g = ${N(a)}\\ \\mathrm{m/s^2}`)}<br>${tex(`T = \\dfrac{Mm(1 + \\sin\\theta)}{M + m}g = ${N(T)}\\ \\mathrm{N}`)}${p.theta === 0 ? '<br><small>θ = 0이면 식 (5.3.7), (5.3.8)과 같다.</small>' : ''}`,
      {
        dir: `${tex('mg')}와 ${tex('Mg\\sin\\theta')}를 비교하자. 큰 쪽으로 움직인다.`,
        a: { ...commonA, noSin: `빗면 방향으로는 중력의 성분 ${tex('Mg\\sin\\theta')}만 들어간다.`, cos: `빗면 방향 성분은 ${tex('Mg\\sin\\theta')}다. ${tex('Mg\\cos\\theta')}는 빗면에 수직인 성분이다.` },
        T: { ...commonT, weight: `${tex('T = mg')}이면 블록 H의 알짜힘이 0이라 가속하지 않는다.` },
      });
    let shown = false;
    pr.onReveal = () => { shown = true; fbS.reveal(); fbH.reveal(); for (const it of [...onS, ...onH]) it.a.reveal(); };

    cur = {
      render(o) {
        const d = d0 - o.s;                                  // distance of S from the top corner along the plane
        const cS0 = add(add(Ptop, mul(u, -d)), mul(n, sS / 2));
        const cH0 = [xH, yH0 - o.s, 0];
        bS.position.set(...cS0); bH.position.set(...cH0);
        cS.set(add(cS0, mul(u, sS / 2 + sS * 0.12)), add(Pc, mul(n, rp + 0.018)));
        cH.set([xH, Pc[1], 0], [xH, cH0[1] + sH / 2 + sH * 0.12, 0]);
        wheel.rotation.z = -o.s / rp;
        tagS.move(add(add(cS0, mul(n, -sS / 2 - 0.35)), [-0.35, 0, 0.5]));
        tagH.move([xH - sH / 2 - 0.5, cH0[1], 0.3]);
        for (const it of onS) it.a.set(cS0, it.v, len(it.v) * S.F);
        for (const it of onH) it.a.set(cH0, it.v, len(it.v) * S.F);
        if (!shown || Math.abs(o.a) < 1e-9) { accS.hide(); accH.hide(); return; }
        accS.set(add(cS0, mul(n, sS / 2 + 0.3)), mul(u, Math.sign(o.a)), Math.abs(o.a) * S.a);
        accH.set([xH + sH / 2 + 0.25, cH0[1], 0], [0, -Math.sign(o.a), 0], Math.abs(o.a) * S.a);
      },
    };
    const yLow = Math.min(-0.4, yH0 - M.TRAVEL.incline - sH / 2, fS[1] - p.M * M.G * S.F - 1.0, fH[1] - p.m * M.G * S.F - 1.0);
    // Highest label: the y axis name of S (along n), the x axis name of S (along u), or the T label of H.
    const FNm = p.M * M.G * Math.cos(th);
    const topS = fS[1] + Math.max((Math.max(FNm * S.F + 0.7, 1.2) + 0.2) * Math.cos(th), (Math.max(T * S.F + 0.7, 1.2) + 0.2) * Math.sin(th)) + 0.55;
    const yHigh = Math.max(topS, Pc[1] + 0.5, fH[1] + Math.max(T * S.F + 0.7, 1.2) + 0.75);
    stage.setHome({ target: [(xL - 1.9 + xH + 2.3) / 2, (yLow + yHigh) / 2 - 0.35, 0], direction: [0, 0.16, 1], distance: 7.5 + (yHigh - yLow) * 1.05, minDistance: 5, maxDistance: 35 });
    return { legend: LEGEND };
  }

  return {
    build(p) {
      cur = null; ui.revealed = false;
      return p.activity === 'incline' ? buildIncline(p) : buildAtwood(p);
    },
    render(o) { if (cur) cur.render(o); },
  };
}
