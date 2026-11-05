// 6.3 3D view. flat: a car on a ring road on the measuring board (4-3 scene). banked: the same ring raised into
// a road banked at θ, with a cross-section free-body diagram above the centre. loop: a vertical loop standing
// on the board with a cart passing its top. Force arrows #D55E00, velocity #0072B2, acceleration #CC79A7.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { car } from '../../../core/models3d.js';
import { vecArrow, dashLine, GREY, UNKNOWN_LENGTH } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui, forceScale } from './spec.js';

const COL = { force: 0xd55e00, vel: 0x0072b2, acc: 0xcc79a7 };
const LEGEND = [{ label: '힘 (force)', color: '#d55e00' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' }];
const rad = d => d * Math.PI / 180;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;
  const add = (a, b) => a.map((c, i) => c + b[i]);
  const mul = (a, k) => a.map(c => c * k);
  const len = a => Math.hypot(...a);
  const unit = a => { const n = len(a); return n > 1e-12 ? mul(a, 1 / n) : [0, 0, 0]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const basis = new THREE.Matrix4();
  // Car model axes: x forward, y up. Point them along f and u.
  const orient = (obj, f, u) => { const F = new THREE.Vector3(...f), U = new THREE.Vector3(...u); basis.makeBasis(F, U, F.clone().cross(U)); obj.quaternion.setFromRotationMatrix(basis); };

  function onBody(color, html, { radius = 0.08, priority = 2, gap = 0.5, minR = 1, unknown = false } = {}) {
    const arrow = vecArrow(stage, unknown ? GREY : color, { radius });
    const lab = stage.label(unknown ? `${tex(html)} <span class="val">= ?</span>` : tex(html), [0, 0, 0], 'qty', { dy: 0, priority });
    let hidden = unknown;
    return {
      reveal() { hidden = false; arrow.mat.color.setHex(color); lab.set(tex(html)); },
      set(at, v, L, fixed = UNKNOWN_LENGTH) {
        if (hidden) L = len(v) > 1e-9 ? fixed : 0;
        arrow.update(at, v, L);
        lab.node.dataset.off = L > 0.02 ? '' : '1';
        if (len(v) > 1e-9) lab.move(add(at, mul(unit(v), Math.max(L + gap, minR))));
      },
      hide() { arrow.visible = false; lab.node.dataset.off = '1'; },
    };
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
      if (r.reveal) { ui.revealed = true; onReveal(); ctx.refresh(); }
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    return { set onReveal(f) { onReveal = f; } };
  }
  function boardWithLegs(half) {
    const g = stage.group;
    stage.board(g, -half, half, 2 * half, 0);
    stage.floorPlane(-1.45);
    for (const x of [-half + 2.5, half - 2.5]) for (const z of [-half + 2.5, half - 2.5]) stage.mesh(g, new THREE.CylinderGeometry(0.6, 0.75, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
  }
  const circle = (r, y, n = 160) => Array.from({ length: n + 1 }, (_, i) => [r * Math.cos(2 * Math.PI * i / n), y, -r * Math.sin(2 * Math.PI * i / n)]);
  function centrePost(h = 1.4) {
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.22, 0.3, h, 24), stage.lit(0x8c9ca9, 0.6, 0.3), [0, h / 2, 0]);
    stage.mesh(stage.group, new THREE.SphereGeometry(0.34, 24, 16), stage.lit(0xf4f8fc, 0.3, 0.3), [0, h + 0.1, 0]);
  }

  // ---------------- flat curve ----------------
  function buildFlat(p) {
    const s = M.flat(p), S = forceScale(p), half = p.R + M.ROAD + 3, H = 2.2;
    boardWithLegs(half);
    const road = stage.mesh(stage.group, new THREE.RingGeometry(p.R - M.ROAD, p.R + M.ROAD, 160, 1), stage.lit(0x5d6e7e, 0.1, 0.85), [0, 0.02, 0], [-Math.PI / 2, 0, 0]);
    road.castShadow = false;
    stage.line(circle(p.R - M.ROAD + 0.15, 0.03), 0xd8e5ee); stage.line(circle(p.R + M.ROAD - 0.15, 0.03), 0xd8e5ee);
    stage.line(circle(p.R, 0.03), 0xeef1f5, { dashed: true, dash: 1.2, gap: 1.0, opacity: 0.8 });
    centrePost();
    stage.label('원의 중심', [0, 2.3, 0], 'station', { priority: -1 });
    const body = car(stage, { length: 4.2 }); stage.group.add(body);
    const T = M.duration(p), rr = 0.07;
    const path = stage.line(Array.from({ length: 121 }, (_, i) => { const o = M.flatAt(T * i / 120, p); return [o.x, 0.06, o.z]; }), 0x40546a, { dashed: true, dash: 0.8, gap: 0.6 });
    path.visible = false;
    const vel = onBody(COL.vel, '\\vec v', { priority: 1, radius: rr }), fr = onBody(COL.force, '\\vec f', { unknown: true, radius: rr }), acc = onBody(COL.acc, '\\vec a', { priority: 3, radius: rr });

    const pr = predict('재생하기 전에 이 커브를 돌 수 있는 가장 큰 속력과 지금 속력에서 필요한 마찰력을 구해 보자.',
      [{ title: `① 최대 속력 ${tex('v_{\\max}')}`, label: '최대 속력', unit: 'm/s', placeholder: '예 15' },
       { title: `② 지금 속력에서 필요한 마찰력 ${tex('f')}`, label: '필요한 마찰력', unit: 'N', placeholder: '예 3000' }],
      ([vText, fText]) => {
        const r = M.checkFlat(p, { vText, fText });
        if (r.vReason === 'unreadable' || r.fReason === 'unreadable') return { ok: false, message: '①과 ②를 숫자로 적자. 예 3200' };
        const hv = { noRoot: '제곱근을 빠뜨렸다.', noG: `${tex('g')}를 빠뜨렸다.`, noMu: `${tex('\\mu_s')}를 빠뜨렸다.`, value: `${tex('m\\dfrac{v^2}{R} = \\mu_s mg')}에서 ${tex('v')}를 풀자.` }[r.vReason] ?? '';
        const hf = { fmax: `그 값은 최대 정지 마찰력 ${tex('\\mu_s mg')}다. 필요한 값은 ${tex('mv^2/R')}이다.`, noSquare: `${tex('v')}를 제곱하자.`, weight: `그 값은 ${tex('mg')}다.`, value: `필요한 구심력은 ${tex('F = mv^2/R')} (6.3.2)이다.` }[r.fReason] ?? '';
        const sol = [`v_{\\max} = \\sqrt{\\mu_s g R} = ${N(s.vmax)}\\ \\mathrm{m/s}`, `f = m\\dfrac{v^2}{R} = ${N(s.need)}\\ \\mathrm{N}`, `f_{s,\\max} = \\mu_s mg = ${N(s.fmax)}\\ \\mathrm{N}`].map(t => tex(t)).join('<br>');
        const verdict = `<small>${s.onRoad ? '필요한 마찰력이 최대 정지 마찰력 이하라 커브를 따라 돈다.' : `필요한 마찰력이 최대 정지 마찰력보다 커서 반지름 ${fmt(s.rPath)} m 원보다 작게 돌지 못하고 도로 밖으로 나간다.`}</small>`;
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hv, hf].filter(Boolean).join(' ')}<br>${sol}<br>${verdict}`, reveal: true };
      });
    pr.onReveal = () => { fr.reveal(); path.visible = !s.onRoad; };

    cur = {
      render(o) {
        const ang = o.heading, f = [-Math.sin(ang), 0, -Math.cos(ang)], cx = p.R - o.rPath;
        body.position.set(o.x, 0.03, o.z); orient(body, f, [0, 1, 0]);
        const top = [o.x, H, o.z], inward = unit([cx - o.x, 0, -o.z]);
        vel.set(top, f, p.v * 0.5);
        fr.set([o.x, 0.35, o.z], inward, o.f * S, 2);
        if (ui.revealed) acc.set(add(top, [0, 0.6, 0]), inward, p.v * p.v / o.rPath * 0.5); else acc.hide();
      },
    };
    const d = 3.05 * (p.R + 3);
    stage.setHome({ target: [0, 0, 0.2 * (p.R + 3)], direction: [0.75, 1.0, 1], distance: d, minDistance: d * 0.25, maxDistance: d * 2.5 });
    return { legend: LEGEND };
  }

  // ---------------- banked curve ----------------
  function buildBanked(p) {
    const s = M.banked(p), S = forceScale(p), th = rad(p.theta), w = M.ROAD + 0.6, half = p.R + w + 3;
    boardWithLegs(half);
    const yIn = 0.25, yOut = yIn + 2 * w * Math.tan(th), yc = yIn + w * Math.tan(th);
    const lathe = new THREE.LatheGeometry([[p.R - w, 0.01], [p.R - w, yIn], [p.R + w, yOut], [p.R + w, 0.01]].map(([x, y]) => new THREE.Vector2(x, y)), 160);
    stage.mesh(stage.group, lathe, stage.lit(0x5d6e7e, 0.1, 0.85));
    const lane = Array.from({ length: 161 }, (_, i) => { const a = 2 * Math.PI * i / 160; return [p.R * Math.cos(a), yc + 0.02, -p.R * Math.sin(a)]; });
    stage.line(lane, 0xeef1f5, { dashed: true, dash: 1.2, gap: 1.0, opacity: 0.8 });
    centrePost(1.4);
    const body = car(stage, { length: 4.2 }); stage.group.add(body);
    const rr = 0.07;
    const vel = onBody(COL.vel, '\\vec v', { priority: 1, radius: rr }), FN = onBody(COL.force, '\\vec F_N', { unknown: true, radius: rr }), Fg = onBody(COL.force, '\\vec F_g', { radius: rr });
    const acc = onBody(COL.acc, '\\vec a', { priority: 3, radius: rr });
    // Components of F_N on the car (shown after the check): horizontal toward the centre, vertical up.
    const comps = [dashLine(stage, [0, 0, 0], [0, 0, 0], COL.force, { dash: 0.5, gap: 0.3 }), dashLine(stage, [0, 0, 0], [0, 0, 0], COL.force, { dash: 0.5, gap: 0.3 })];
    const compLabels = [stage.label(tex('F_N\\sin\\theta'), [0, 0, 0], 'gtick', { dy: 0, priority: 1 }), stage.label(tex('F_N\\cos\\theta'), [0, 0, 0], 'gtick', { dy: 0, priority: 1 })];
    for (const c of comps) c.visible = false;
    for (const l of compLabels) l.node.dataset.off = '1';

    const pr = predict('재생하기 전에 마찰 없이 이 커브를 도는 속력을 구하고 수직항력을 중력과 비교해 보자.',
      [{ title: `① 마찰 없이 도는 속력 ${tex('v')}`, label: '속력', unit: 'm/s', placeholder: '예 12' },
       { title: `② 수직항력 ${tex('F_N')}과 중력 ${tex('mg')}`, choices: [{ value: 'more', html: `${tex('F_N > mg')}` }, { value: 'equal', html: `${tex('F_N = mg')}` }, { value: 'less', html: `${tex('F_N < mg')}` }] }],
      ([vText, cmp]) => {
        const r = M.checkBanked(p, { vText, cmp });
        if (r.cmpReason === 'empty') return { ok: null, message: '② 비교를 고르자.' };
        if (r.vReason === 'unreadable') return { ok: false, message: '①을 숫자로 적자. 예 12.5' };
        const hv = { sin: `${tex('\\sin\\theta')}가 아니라 ${tex('\\tan\\theta')}다. 두 식을 나누면 ${tex('\\tan\\theta = v^2/(gR)')}이다.`, cot: '분자와 분모가 바뀌었다.', noAngle: '경사각이 빠졌다.', value: `${tex('F_N\\sin\\theta = mv^2/R')}을 ${tex('F_N\\cos\\theta = mg')}로 나누자.` }[r.vReason] ?? '';
        const hc = r.cmpOk ? '' : `${tex('F_N')}의 연직 성분 ${tex('F_N\\cos\\theta')}가 ${tex('mg')}와 같으므로 ${tex('F_N = mg/\\cos\\theta')}는 ${tex('mg')}보다 크다.`;
        const sol = [`v = \\sqrt{gR\\tan\\theta} = ${N(s.v)}\\ \\mathrm{m/s}`, `F_N = \\dfrac{mg}{\\cos\\theta} = ${N(s.FN)}\\ \\mathrm{N}`].map(t => tex(t)).join('<br>');
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hv, hc].filter(Boolean).join(' ')}<br>${sol}`, reveal: true };
      });
    pr.onReveal = () => { FN.reveal(); for (const c of comps) c.visible = true; for (const l of compLabels) l.node.dataset.off = ''; };

    cur = {
      render(ob) {
        const a = ob.heading, f = [-Math.sin(a), 0, -Math.cos(a)], out = [Math.cos(a), 0, -Math.sin(a)];
        const u = add(mul([0, 1, 0], Math.cos(th)), mul(out, -Math.sin(th)));
        const pos = add(mul(out, p.R), [0, yc, 0]);
        body.position.set(...pos); orient(body, f, u);
        const c = add(pos, mul(u, 1.1));
        vel.set(add(pos, mul(u, 2.4)), f, s.v * 0.5);
        FN.set(c, u, s.FN * S, 2);
        const h = add(c, mul(out, -s.FN * Math.sin(th) * S)), tip = add(c, mul(u, s.FN * S));
        comps[0].set(c, h); comps[1].set(h, tip);
        compLabels[0].move(add(add(c, h).map(x => x / 2), [0, -0.8, 0])); compLabels[1].move(add(add(h, tip).map(x => x / 2), mul(out, -1.2)));
        Fg.set(c, [0, -1, 0], M.MASS * M.G * S);
        if (ui.revealed) acc.set(add(pos, mul(u, 2.9)), mul(out, -1), s.a * 0.5); else acc.hide();
      },
    };
    const d = 3.05 * (p.R + 3);
    stage.setHome({ target: [0, 0, 0.2 * (p.R + 3)], direction: [0.75, 1.0, 1], distance: d, minDistance: d * 0.25, maxDistance: d * 2.5 });
    return { legend: LEGEND };
  }

  // ---------------- vertical loop ----------------
  function buildLoop(p) {
    const q = M.lp(p), top = M.loopTop(q), S = forceScale(p), R = q.R;
    const Lc = Math.min(1.8, 0.42 * R), base = 0.5, C = [0, base + R, 0], tube = 0.07, half = R + 3;
    stage.board(stage.group, -half, half, 3.2, 0);
    stage.floorPlane(-1.45);
    for (const x of [-half + 0.9, half - 0.9]) for (const z of [-0.9, 0.9]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
    const steel = stage.lit(0x8c9ca9, 0.6, 0.3);
    for (const z of [-0.24 * Lc, 0.24 * Lc]) stage.mesh(stage.group, new THREE.TorusGeometry(R + tube, tube, 10, 200), steel, [C[0], C[1], z]);
    // Outer band so the track reads as one surface, and two legs to the board.
    stage.mesh(stage.group, new THREE.CylinderGeometry(R + 2 * tube, R + 2 * tube, 0.48 * Lc, 160, 1, true), stage.lit(0xb8c2cb, 0.4, 0.4), C, [Math.PI / 2, 0, 0]);
    for (const sgn of [-1, 1]) stage.mesh(stage.group, new THREE.BoxGeometry(0.14, base + 0.2, 0.14), steel, [sgn * 0.5, (base + 0.2) / 2, 0]);
    stage.label('꼭대기', add(C, [0, R + 0.9, 0]), 'station', { priority: -1 });
    const body = car(stage, { length: Lc, color: 0xdfe5ea }); stage.group.add(body);
    const vel = onBody(COL.vel, '\\vec v', { priority: 1, radius: 0.04, gap: 0.3, minR: 0.6 });
    const FN = onBody(COL.force, '\\vec F_N', { unknown: true, radius: 0.045, gap: 0.3, minR: 0.6 });
    const Fg = onBody(COL.force, '\\vec F_g', { radius: 0.045, gap: 0.3, minR: 0.6 });
    const acc = onBody(COL.acc, '\\vec a', { priority: 3, radius: 0.04, gap: 0.3, minR: 0.6 });
    const T = M.duration(p);
    const flight = stage.line(Array.from({ length: 61 }, (_, i) => { const o = M.loopAt(T * i / 60, q); return add(C, [o.x, o.y, 0]); }), 0x40546a, { dashed: true, dash: 0.2, gap: 0.14 });
    flight.visible = false;

    const pr = predict('재생하기 전에 꼭대기에서 트랙을 떠나지 않을 최소 속력과 지금 속력에서 꼭대기의 수직항력을 구해 보자.',
      [{ title: `① 꼭대기의 최소 속력 ${tex('v_{\\min}')}`, label: '최소 속력', unit: 'm/s', placeholder: '예 5' },
       { title: `② 지금 속력에서 꼭대기의 ${tex('F_N')}<small>트랙을 누르지 못하면 0</small>`, label: '꼭대기의 수직항력', unit: 'N', placeholder: '예 800' }],
      ([vText, nText]) => {
        const r = M.checkLoop(q, { vText, nText });
        if (r.vReason === 'unreadable' || r.nReason === 'unreadable') return { ok: false, message: '①과 ②를 숫자로 적자. 예 650' };
        const hv = { noRoot: '제곱근을 빠뜨렸다.', two: `${tex('\\sqrt{2gR}')}이 아니다. ${tex('F_N = 0')}일 때 ${tex('mg = mv^2/R')}이다.`, value: `${tex('F_N = 0')}으로 놓고 식 (6.3.3)을 풀자.` }[r.vReason] ?? '';
        const hn = {
          plus: `중력과 수직항력이 둘 다 아래(중심)를 향한다. ${tex('F_N = mv^2/R - mg')}이다.`,
          noWeight: `중력도 구심력의 일부다. ${tex('mg')}를 빼자.`, weight: `그 값은 ${tex('mg')}다.`,
          noContact: `이 속력은 ${tex('v_{\\min}')}보다 작다. 트랙은 수레를 당기지 못하므로 ${tex('F_N = 0')}이고 수레는 꼭대기 전에 떨어진다.`,
          value: `${tex('-F_N - mg = m(-v^2/R)')} (6.3.3)을 풀자.`,
        }[r.nReason] ?? '';
        const sol = [`v_{\\min} = \\sqrt{gR} = ${N(top.vmin)}\\ \\mathrm{m/s}`, top.contact ? `F_N = m\\dfrac{v^2}{R} - mg = ${N(top.FN)}\\ \\mathrm{N}` : 'F_N = 0'].map(t => tex(t)).join('<br>');
        return { ok: r.ok, message: `${r.ok ? '맞다.' : [hv, hn].filter(Boolean).join(' ')}<br>${sol}`, reveal: true };
      });
    pr.onReveal = () => { FN.reveal(); flight.visible = !top.contact; };

    let lastF = [1, 0, 0], lastU = [0, -1, 0];
    const vScale = 0.35 * R / q.v, aScale = 0.4 * R / Math.max(top.a, M.G);   // m of arrow per m/s and per m/s²
    cur = {
      render(o) {
        const pos = add(C, [o.x, o.y, 0]);
        const f = unit([o.vx, o.vy, 0]);
        if (o.contact) { lastF = f; lastU = unit([-o.x, -o.y, 0]); }
        body.position.set(...pos); orient(body, o.contact ? f : lastF, lastU);
        const c = add(pos, mul(lastU, 0.22 * Lc));
        vel.set(add(c, mul(lastU, 0.35 * Lc)), f, Math.hypot(o.vx, o.vy) * vScale);
        Fg.set(c, [0, -1, 0], q.m * M.G * S);
        if (o.contact) FN.set(c, lastU, o.FN * S, 0.6 * Math.min(R, 3) / 3 + 0.2); else FN.hide();
        if (ui.revealed) {
          if (o.contact) acc.set(add(c, mul(lastU, -0.35 * Lc)), lastU, q.v * q.v / R * aScale);
          else acc.set(add(c, [0.35 * Lc, 0, 0]), [0, -1, 0], M.G * aScale);
        } else acc.hide();
      },
    };
    stage.setHome({ target: [0, C[1], 0], direction: [0, 0.12, 1], distance: 2.9 * R + 5, minDistance: 3, maxDistance: 8 * R + 20 });
    return { legend: LEGEND };
  }

  return {
    build(p) { cur = null; ui.revealed = false; return { flat: buildFlat, banked: buildBanked, loop: buildLoop }[p.activity](p); },
    render(o) { if (cur) cur.render(o); },
  };
}
