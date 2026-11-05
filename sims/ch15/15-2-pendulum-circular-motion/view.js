// 15.4 3D view.
// pendulum: scene unit = 50 cm. A stand with a bob on a string (or a uniform rod) swinging in the x–y plane, the swing
//   arc, and the restoring force F_g sin θ (#D55E00, tangent to the path, at the bob or at the rod's center of mass).
//   After the check a translucent small-angle pendulum swings beside it, the rod gets its center of oscillation,
//   and the board on the right shows θ–t (actual solid, small-angle dotted, both #000000 as angular position).
// circle: scene unit = 10 cm. A turntable carries the reference particle P′ counterclockwise seen from above
//   (Fig. 15.4.5); P slides on a rail in front along x, joined to P′ by a dashed line along z. Arrows: velocity
//   (#0072B2) and acceleration (#CC79A7) on P′, and their x components on P after the check. A board behind shows x–t of P.
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, dashLine } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;
const COL = { x: 0x000000, v: 0x0072b2, a: 0xcc79a7, F: 0xd55e00 };

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function legs(x0, x1, width) {
    stage.floorPlane(-1.45);
    for (const x of [x0 + 0.9, x1 - 0.9]) for (const z of [-width / 2 + 0.6, width / 2 - 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
  }
  function feedback(box, r, html) { box.feedback(r.ok, html); }

  // ---------------- pendulum ----------------
  function buildPendulum(p, box) {
    const K = 2, rod = p.kind === 'rod', L = p.L * K, H = L + 1.0, pivot = [0, H, 0], th0 = rad(p.thetaM);
    const T0 = M.smallPeriod(p), T = M.exactPeriod(p), L0 = M.effLength(p) * K;
    const half = Math.max(L * Math.sin(th0) + 0.7, 1.5), gx = half + 0.5, gW = 5.6, gH = Math.min(Math.max(3.4, 0.75 * H), 4.6), right = gx + gW;
    stage.board(stage.group, -half - 0.5, right + 0.3, 2.2, 0);
    legs(-half - 0.5, right + 0.3, 2.2);
    const steel = stage.lit(0x6f8091, 0.6, 0.35);
    for (const zz of [-0.6, 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.05, 0.05, H + 0.1, 16), steel, [0, (H + 0.1) / 2, zz]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.05, 0.05, 1.3, 16), steel, pivot, [Math.PI / 2, 0, 0]);
    // Path of the bob (or of the rod's end), the vertical through the pivot.
    const arc = Array.from({ length: 81 }, (_, i) => { const a = -th0 + 2 * th0 * i / 80; return [L * Math.sin(a), H - L * Math.cos(a), 0]; });
    stage.line(arc, 0x40546a, { dashed: true, dash: 0.08, gap: 0.06 });
    stage.line([pivot, [0, H - L - 0.25, 0]], 0x7a8795, { dashed: true, dash: 0.08, gap: 0.06 });
    stage.label('<i>θ</i><sub>m</sub>', [L * Math.sin(th0) * 0.42 + 0.12, H - L * Math.cos(th0) * 0.42, 0], 'axis', { dy: 0, priority: 0 });

    // Swinging body in a group turning about the pivot (z axis). make(opacity) builds the actual or the ghost one.
    const make = opacity => {
      const g = new THREE.Group(); g.position.set(...pivot); stage.group.add(g);
      const fade = m => { if (opacity < 1) { m.transparent = true; m.opacity = opacity; m.depthWrite = false; } return m; };
      if (rod) stage.mesh(g, new THREE.BoxGeometry(0.1, L, 0.1), fade(stage.lit(0xb08a5a, 0.05, 0.6)), [0, -L / 2, 0]);
      else {
        stage.mesh(g, new THREE.CylinderGeometry(0.01, 0.01, L, 6), fade(stage.lit(0x40546a, 0, 0.8)), [0, -L / 2, 0], [0, 0, 0], false);
        stage.mesh(g, new THREE.SphereGeometry(0.16, 40, 28), fade(stage.lit(0xc8a978, 0.32, 0.22)), [0, -L, 0]);
      }
      return g;
    };
    const body = make(1), ghost = make(0.3);
    ghost.visible = false;
    // Center of oscillation (rod only), shown after the check: a ring on the rod at L0 = 2L/3 from the pivot.
    let center = null, cLab = null;
    if (rod) {
      center = stage.mesh(body, new THREE.TorusGeometry(0.12, 0.03, 10, 32), stage.flat(0x1a1a1a), [0, -L0, 0], [0, 0, 0], false);
      center.visible = false;
      cLab = stage.label('진동 중심', [0, 0, 0], 'tag', { dy: 0, priority: 1 }); cLab.node.dataset.off = '1';
    }
    const Fr = vecArrow(stage, COL.F, { radius: 0.035 });
    const lF = stage.label(tex('F_g\\sin\\theta'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const arm = rod ? L / 2 : L, FS = 0.55 * Math.min(L, 3.2);            // scene units per mg

    // θ–t board on the right.
    const yr = niceRange(-p.thetaM, p.thetaM, { target: 6 });
    const gb = graphBoard(stage, { origin: [gx, 0.35, -0.6], width: gW, height: gH, t: [0, M.RUN], tStep: 2, y: [yr.min, yr.max], yStep: yr.step, yTitle: '<i>θ</i> (°)' });
    const wait = stage.label('확인하면 그래프가 나타난다', gb.at(M.RUN / 2, 0), 'station', { dy: 0, priority: 2 });

    const who = rod ? `길이 ${tex(`L = ${N(L)}\\ \\mathrm{m}`)}인 고른 막대를 한쪽 끝에 매달아` : `길이 ${tex(`L = ${N(L)}\\ \\mathrm{m}`)}인 줄에 추를 매달아`;
    box.text(`${who} 각진폭 ${tex(`\\theta_m = ${p.thetaM}^\\circ`)}에서 가만히 놓는다. 재생하기 전에 예측해 보자.`);
    box.text(`① 작은 각 근사로 구한 주기 ${tex('T')}`, 'pred');
    const Ti = box.answer({ label: '작은 각 근사 주기', unit: 's', placeholder: '예 2', onEnter: () => check() });
    const pick = box.choices('② 실제 주기는 ①의 값보다', [{ value: 'longer', html: '길다' }, { value: 'same', html: '1% 안에서 같다' }, { value: 'shorter', html: '짧다' }]);
    const check = () => {
      const r = M.checkPendulum(p, { TText: Ti.value, choice: pick() });
      if (r.cReason === 'empty') { box.feedback(null, '② 하나를 고르자.'); return; }
      if (r.TReason === 'unreadable') { box.feedback(false, '①을 숫자로 적자. 예 2.15'); return; }
      const form = rod ? '\\sqrt{2L/3g}' : '\\sqrt{L/g}', inv = rod ? '\\sqrt{3g/2L}' : '\\sqrt{g/L}';
      const hT = {
        inverted: `${tex(inv)}가 아니라 ${tex(form)}다. 길수록 주기가 길다.`,
        noTwoPi: `그 값은 ${tex('1/\\omega')}다. ${tex('T = 2\\pi/\\omega')}다.`,
        freq: `그 값은 진동수 ${tex('f = 1/T')}다.`,
        simple: `막대는 단진자가 아니다. 질량이 막대 전체에 퍼져 있어 ${tex('I = \\tfrac{1}{3}mL^2')}과 ${tex('h = L/2')}를 식 (15.4.6)에 넣는다.`,
        half: `질량중심까지의 거리 ${tex('h')}를 길이로 둔 단진자가 아니다. 막대의 ${tex('I = \\tfrac{1}{3}mL^2')}를 쓴다.`,
        value: rod ? '식 (15.4.10)에 <i>L</i>을 넣자.' : '식 (15.4.5)에 <i>L</i>을 넣자.',
      }[r.TReason] ?? '';
      const hc = r.cOk ? '' : r.want === 'longer'
        ? `주기가 진폭과 상관없는 것은 작은 각에서만이다. ${tex('\\sin\\theta < \\theta')}라 되돌리는 돌림힘이 작은 각 근사보다 작아서 더 느리게 흔들린다.`
        : `${tex('\\theta_m')}이 작으면 ${tex('\\sin\\theta \\approx \\theta')}라 두 주기의 차이가 1%보다 작다.`;
      const extra = rod ? `<br>진동 중심 (center of oscillation) ${tex(`L_0 = \\tfrac{2}{3}L = ${N(L0)}\\ \\mathrm{m}`)}` : '';
      feedback(box, r, `${r.ok ? '맞다.' : [hT, hc].filter(Boolean).join(' ')}<br>${tex(`T = 2\\pi${form} = ${N(T0)}\\ \\mathrm{s}`)}<br>실제 주기는 ${fmt(T)} s로 작은 각 근사의 ${fmt(T / T0, { sig: 4 })}배다.${extra}`);
      if (!ui.revealed) {
        ghost.visible = true; wait.node.dataset.off = '1';
        gb.curve(t => deg(M.pendulumAt(t, p).theta), { color: COL.x, samples: 500 });
        gb.curve(t => deg(M.smallAt(t, p)), { color: COL.x, samples: 500, radius: 0.028, dotted: true, dot: false });
        if (center) { center.visible = true; cLab.node.dataset.off = ''; }
      }
      ui.revealed = true; ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        body.rotation.z = o.theta; ghost.rotation.z = o.model;
        // Restoring force at the bob (rod: center of mass), tangent to the path toward θ = 0.
        const c = Math.cos(o.theta), s = Math.sin(o.theta), at = [arm * s, H - arm * c, 0.06];
        const dir = o.theta >= 0 ? [-c, -s, 0] : [c, s, 0], LF = Math.abs(s) * FS;
        Fr.update(at, dir, LF); lF.node.dataset.off = LF > 0.12 ? '' : '1';
        lF.move([at[0] + dir[0] * (LF + 0.3), at[1] + dir[1] * (LF + 0.3) + 0.12, 0.06]);
        if (cLab) cLab.move([L0 * s + 0.85, H - L0 * c, 0.1]);
        gb.setTime(o.t);
      },
    };
    const top = Math.max(H + 0.3, gH + 0.6), left = -half - 0.5;
    stage.setHome({ target: [(left + right) / 2, (top - 1.0) / 2, 0], direction: [0, 0.12, 1], distance: 1.2 * (right + 0.3 - left), minDistance: 3, maxDistance: 60 });
    return { legend: [{ label: '변위 (displacement)', color: '#000000' }, { label: '힘 (force)', color: '#d55e00' }] };
  }

  // ---------------- circle ----------------
  function buildCircle(p, box) {
    const K = 10, A = p.xm / 100 * K, Rd = A + 0.45, zc = -0.8, zr = Rd + 0.5, yd = 0.31, T = M.circlePeriod(p);
    stage.board(stage.group, -Rd - 1.6, Rd + 1.6, 2 * (Rd + 1.5), 0);
    legs(-Rd - 1.6, Rd + 1.6, 2 * (Rd + 1.5));
    // Turntable with a spindle, its +x line, and the radius to P′.
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.22, 0.28, 0.2, 24), stage.lit(0x40546a, 0.5, 0.4), [0, 0.1, zc]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(Rd, Rd, 0.1, 96), stage.lit(0xdfe5ea, 0.2, 0.5), [0, yd - 0.05, zc]);
    stage.mesh(stage.group, new THREE.TorusGeometry(A, 0.012, 6, 120), stage.flat(0x7a8795), [0, yd + 0.005, zc], [Math.PI / 2, 0, 0], false);
    stage.line([[0, yd + 0.01, zc], [Rd, yd + 0.01, zc]], 0x40546a, { dashed: true, dash: 0.1, gap: 0.07 });
    stage.label('+<i>x</i>', [Rd + 0.3, yd, zc], 'axis', { dy: 0 });
    const radius = stage.line([[0, yd + 0.012, zc], [A, yd + 0.012, zc]], 0x40546a);
    radius.frustumCulled = false;
    const Pp = stage.ball([A, yd + 0.13, zc], 0.13, 0xb08a5a);
    // Rail in front with a cm ruler and the slider P.
    stage.mesh(stage.group, new THREE.BoxGeometry(2 * Rd + 0.6, 0.06, 0.1), stage.lit(0x8c9ca9, 0.65, 0.3), [0, 0.06, zr]);
    const tk = [];
    for (let c = -30; c <= 30; c += 5) {
      const X = c / 100 * K; if (Math.abs(X) > Rd) continue;
      tk.push([X, 0.014, zr + 0.25], [X, 0.014, zr + (c % 10 === 0 ? 0.45 : 0.35)]);
      if (c % 10 === 0) stage.label(`${fmtFixed(c, 0)} cm`, [X, 0.05, zr + 0.7], 'measure');
    }
    stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tk.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xd8e5ee })));
    const P = stage.mesh(stage.group, new THREE.BoxGeometry(0.3, 0.22, 0.24), stage.lit(0x9fb3c4, 0.35, 0.45), [A, 0.2, zr]);
    const proj = dashLine(stage, [A, yd + 0.13, zc], [A, 0.2, zr], 0x40546a, { dash: 0.08, gap: 0.06 });
    const lP1 = stage.label('P′', [0, 0, 0], 'tag', { dy: -22, priority: 3 }), lP = stage.label('P', [0, 0, 0], 'tag', { dy: -20, priority: 3 });
    const VS = 1.5 / (p.w * A / K), AS = 1.5 / (p.w * p.w * A / K);     // scene units per (m/s) and per (m/s²)
    const v1 = vecArrow(stage, COL.v, { radius: 0.04 }), a1 = vecArrow(stage, COL.a, { radius: 0.04 });
    const v2 = vecArrow(stage, COL.v, { radius: 0.04 }), a2 = vecArrow(stage, COL.a, { radius: 0.04 });
    const lv1 = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), la1 = stage.label(tex('\\vec a'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const lv2 = stage.label(tex('v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), la2 = stage.label(tex('a'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });

    // x–t board of P behind the table.
    const yr = niceRange(-p.xm, p.xm, { target: 4 });
    const gb = graphBoard(stage, { origin: [-4.6, 0.4, zc - Rd - 1.0], width: 9.2, height: 3.2, t: [0, 2 * T], y: [yr.min, yr.max], yStep: yr.step, yTitle: '<i>x</i> (cm)' });
    const wait = stage.label('확인하면 그래프가 나타난다', gb.at(T, 0), 'station', { dy: 0, priority: 2 });

    const o0 = M.circleAt(0, p);
    box.text(`반지름 ${tex(`x_m = ${N(p.xm)}\\ \\mathrm{cm}`)}인 기준 원 위의 P′이 각속력 ${tex(`\\omega = ${N(p.w)}\\ \\mathrm{rad/s}`)}로 돈다. ${tex('t = 0')}일 때 P′의 각 위치는 ${tex(`\\phi = ${p.phi}^\\circ`)}다. 재생하기 전에 구해 보자.`);
    box.text(`① ${tex('t = 0')}일 때 P의 속도 ${tex('v')} <small>+<i>x</i> 방향이 +다</small>`, 'pred');
    const vi = box.answer({ label: 'P의 처음 속도', unit: 'm/s', placeholder: '예 -0.3', onEnter: () => check() });
    box.text(`② ${tex('t = 0')}일 때 P의 가속도 ${tex('a')}`, 'pred');
    const ai = box.answer({ label: 'P의 처음 가속도', unit: 'm/s²', placeholder: '예 -1', onEnter: () => check() });
    const check = () => {
      const r = M.checkCircle(p, { vText: vi.value, aText: ai.value });
      if (r.vReason === 'unreadable' || r.aReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 −0.35'); return; }
      const hv = {
        sign: `부호를 보자. P′이 시계 반대 방향으로 돌면 속도의 ${tex('x')} 성분은 ${tex('-\\omega x_m\\sin(\\omega t + \\phi)')}다.`,
        cos: '속도는 반지름에 수직이라 <i>x</i> 성분에 cos가 아니라 sin이 붙는다.',
        noOmega: `P′의 속력은 ${tex('v = \\omega r = \\omega x_m')}이다.`,
        speed: `그 값은 P′의 속력이다. P는 그 ${tex('x')} 성분만 갖는다.`,
        value: '식 (15.4.14)에 <i>t</i> = 0을 넣자.',
      }[r.vReason] ?? '';
      const ha = {
        sign: `P′의 가속도는 중심을 향한다. ${tex('x')} 성분은 ${tex('-\\omega^2x_m\\cos\\phi')}다.`,
        sin: '가속도는 반지름 방향이라 <i>x</i> 성분에 cos가 붙는다.',
        omega1: `구심 가속도의 크기는 ${tex('a_r = \\omega^2 r')}이다.`,
        full: `그 값은 P′의 가속도 크기다. P는 그 ${tex('x')} 성분만 갖는다.`,
        value: '식 (15.4.15)에 <i>t</i> = 0을 넣자.',
      }[r.aReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hv, ha].filter(Boolean).join(' ')}<br>${tex(`v(0) = -\\omega x_m\\sin\\phi = ${N(o0.v)}\\ \\mathrm{m/s}`)}<br>${tex(`a(0) = -\\omega^2x_m\\cos\\phi = ${N(o0.a)}\\ \\mathrm{m/s^2}`)}`);
      if (!ui.revealed) { wait.node.dataset.off = '1'; gb.curve(t => M.circleAt(t, p).x * 100, { color: COL.x, samples: 300 }); }
      ui.revealed = true; ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    const put = (arrow, lab, at, vec, scale, gap = 0.3) => {
      const n = Math.hypot(...vec), Lh = n * scale;
      arrow.update(at, vec, Lh); lab.node.dataset.off = Lh > 0.15 ? '' : '1';
      if (n > 1e-12) lab.move(at.map((c, i) => c + vec[i] / n * (Lh + gap)));
    };
    cur = {
      render(o) {
        const X = o.ref[0] * K, Z = zc + o.ref[1] * K, at1 = [X, yd + 0.13, Z];
        Pp.position.set(...at1);
        const pos = radius.geometry.attributes.position; pos.setXYZ(1, X, yd + 0.012, Z); pos.needsUpdate = true;
        P.position.set(o.x * K, 0.2, zr);
        proj.set(at1, [o.x * K, 0.2, zr]);
        lP1.move([X, yd + 0.3, Z]); lP.move([o.x * K, 0.4, zr]);
        put(v1, lv1, [X, yd + 0.13, Z], [o.refV[0], 0, o.refV[1]], VS);
        put(a1, la1, [X, yd + 0.13, Z], [o.refA[0], 0, o.refA[1]], AS);
        const show = ui.revealed;
        put(v2, lv2, [o.x * K, 0.44, zr], [show ? o.v : 0, 0, 0], VS);
        put(a2, la2, [o.x * K, 0.2, zr + 0.2], [show ? o.a : 0, 0, 0], AS);
        gb.setTime(o.t);
      },
    };
    stage.setHome({ target: [0, 1.2, -0.3], direction: [0, 0.55, 1], distance: 2.6 * (Rd + 2.5) + 3, minDistance: 3, maxDistance: 50 });
    return { legend: [{ label: '변위 (displacement)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' }] };
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측');
      return p.activity === 'circle' ? buildCircle(p, box) : buildPendulum(p, box);
    },
    render(o) { if (cur) cur.render(o); },
  };
}
