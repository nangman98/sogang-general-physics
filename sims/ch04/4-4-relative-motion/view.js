// 4.6–4.7 Relative Motion — 3D view. A boat crosses a river between two measuring boards (the banks) of the
// approved 4-2 scene (board, lighting, fixed-size HTML labels). Floats on the water mark frame B.
// In frame B the banks (frame A) slide by −r_BA while the floats stay still.
// Velocity arrows are on by default here because the vector sum is the topic (README).
import { fmt, fmtFixed, parseNumber, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { boat } from './objects3d.js';
import * as M from './model.js';
import { ui, SCALE } from './spec.js';

const COL = { r: 0x000000, v: 0x0072b2, water: 0x86a6b6, light: 0xeef1f5, mark: 0xd8e5ee, guess: 0x56687a };
const BANK = 5, NEAR = 1.2, FAR = 1.8, TOP = 0.6;   // bank width, gap from O and from the arrival line, bank top (m)
const H = 1.7;                                       // m, velocity arrows above the water
const DOCK_X = -2.4;                                 // m, pier beside the start point O

export function view(stage, ctx) {
  const { THREE, v3 } = stage;
  const tex = ctx.tex;
  let cur = null, lIndex = 0, aIndex = 0;
  const saved = { land: null, aim: null };            // feedback kept across rebuilds, one per activity

  // ---------- scene ----------
  function scene(p, frameB) {
    const g = stage.group, tc = M.crossingTime(p), xL = M.landingX(p), xB = M.velocities(p).vPB[0] * tc;
    const lo = Math.min(-12, xL - 10, xB - 10), hi = Math.max(12, xL + 10, xB + 10);
    const drift = frameB ? p.w * tc : 0, bx0 = lo - 4, bx1 = hi + 4 + drift;
    // Frame A: both banks, the pier, the arrival line and the far-bank ticks move together in frame B.
    const A = new THREE.Group(); g.add(A);
    const nearG = new THREE.Group(), farG = new THREE.Group();
    nearG.position.z = NEAR + BANK / 2; farG.position.z = -M.D - FAR - BANK / 2; A.add(nearG, farG);
    stage.board(nearG, bx0, bx1, BANK, TOP); stage.board(farG, bx0, bx1, BANK, TOP);
    // Water and the floor. The water box covers the banks' whole travel.
    const wx0 = bx0 - drift - 12, wx1 = bx1 + 12;
    const water = stage.mesh(g, new THREE.BoxGeometry(wx1 - wx0, 1.3, M.D + NEAR + FAR + 2), stage.lit(COL.water, 0.15, 0.35), [(wx0 + wx1) / 2, -0.65, (NEAR - M.D - FAR) / 2]);
    water.castShadow = false;
    stage.floorPlane(-1.45);
    // Pier beside O on the near bank, flag directly opposite on the far bank.
    stage.mesh(A, new THREE.BoxGeometry(1.6, 0.25, NEAR + 1.6), stage.lit(0x8c7a64, 0.05, 0.8), [DOCK_X, TOP - 0.15, (NEAR - 0.4) / 2 + 0.2]);
    stage.mesh(farG, new THREE.CylinderGeometry(0.07, 0.07, 2.6, 12), stage.lit(0x8c9ca9, 0.6, 0.3), [0, TOP + 1.3, BANK / 2 - 0.9]);
    stage.mesh(farG, new THREE.BoxGeometry(1.1, 0.65, 0.04), stage.lit(0xf4f8fc, 0.1, 0.5), [0.58, TOP + 2.25, BANK / 2 - 0.9]);
    const moving = [];                                // labels fixed to frame A: [item, x, y, z]
    const aLabel = (html, pos, kind, opts) => { const it = stage.label(html, pos, kind, opts); moving.push([it, ...pos]); return it; };
    aLabel('출발점 O', [DOCK_X, TOP + 0.6, NEAR + 0.8], 'station', { priority: -1 });
    aLabel('바로 맞은편', [0, TOP + 3.2, -M.D - FAR - 0.9], 'station', { priority: -1 });
    // Far-bank ticks: x measured from the point directly opposite, downstream +.
    const step = hi - lo > 70 ? 10 : 5, ticks = [];
    for (let k = Math.ceil(bx0 / step); k * step <= bx1; k++) {
      const x = k * step;
      ticks.push([x, TOP + 0.014, BANK / 2 - 0.25], [x, TOP + 0.014, BANK / 2 - (x === 0 ? 1.1 : 0.75)]);
      aLabel(`${fmtFixed(x, 0)} m`, [x, TOP + 0.1, -M.D - FAR - 0.25], 'measure');
    }
    farG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks.map(v3)), new THREE.LineBasicMaterial({ color: COL.mark })));
    // Arrival line on the water: the boat's middle stops here.
    stage.line([[bx0, 0.03, -M.D], [bx1, 0.03, -M.D]], COL.light, { dashed: true, dash: 0.8, gap: 0.6, opacity: 0.7, parent: A });
    // Floats and ripple streaks drift with the water (frame B). One draw call each.
    const span = wx1 - wx0 - 6, nF = Math.max(12, Math.round(span / 5)), rows = [-0.2, -0.5, -0.8].map(f => f * M.D);
    const floats = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 16, 10), stage.lit(0xf4f8fc, 0.2, 0.4), nF * 3);
    floats.castShadow = true; g.add(floats);
    const fx = Array.from({ length: nF * 3 }, (_, i) => wx0 + 3 + ((i % nF) + (Math.floor(i / nF) * 0.37)) * span / nF);
    const nR = Math.round(span / 2.2);
    const ripples = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.01, 0.07), stage.flat(0xffffff, { transparent: true, opacity: 0.4, depthWrite: false }), nR);
    g.add(ripples);
    const rx = Array.from({ length: nR }, (_, i) => wx0 + 3 + ((i * 7919) % 1000) / 1000 * span);
    const rz = Array.from({ length: nR }, (_, i) => -0.08 * M.D - ((i * 104729) % 1000) / 1000 * 0.84 * M.D);
    const Mx = new THREE.Matrix4();
    const drawWater = shift => {
      const wrap = x => wx0 + 3 + ((((x + shift) - (wx0 + 3)) % span) + span) % span;
      fx.forEach((x, i) => floats.setMatrixAt(i, Mx.makeTranslation(wrap(x), 0.05, rows[Math.floor(i / nF)] + ((i % 2) ? 1.2 : -1.2))));
      rx.forEach((x, i) => ripples.setMatrixAt(i, Mx.makeTranslation(wrap(x), 0.02, rz[i])));
      floats.instanceMatrix.needsUpdate = true; ripples.instanceMatrix.needsUpdate = true;
    };
    const hull = boat(stage); g.add(hull);
    const trail = stage.line([[0, 0.06, 0], [0, 0.06, 0]], COL.r); trail.frustumCulled = false;
    return {
      lo, hi, tc, xL, xB,
      place(frameShift, waterShift, r, heading) {
        A.position.x = frameShift;
        for (const [it, x, y, z] of moving) it.move([x + frameShift, y, z]);
        drawWater(waterShift);
        hull.position.set(r[0], 0, r[2]);
        hull.rotation.y = Math.atan2(-heading[2], heading[0]);
        const pos = trail.geometry.attributes.position;
        pos.setXYZ(1, r[0], 0.06, r[2]); pos.needsUpdate = true;
      },
      flag(x, html) {                                   // prediction flag on the far bank
        stage.mesh(farG, new THREE.CylinderGeometry(0.07, 0.07, 2.2, 12), stage.lit(COL.guess, 0.4, 0.4), [x, TOP + 1.1, BANK / 2 - 0.5]);
        stage.mesh(farG, new THREE.BoxGeometry(0.9, 0.5, 0.04), stage.lit(COL.guess, 0.3, 0.5), [x + 0.48, TOP + 1.9, BANK / 2 - 0.5]);
        aLabel(html, [x, TOP + 2.7, -M.D - FAR - 0.5], 'tag', { priority: 2 });
      },
      dashed(to) { stage.line([[0, 0.04, 0], to], COL.light, { dashed: true, dash: 0.6, gap: 0.45, opacity: 0.9 }); },
    };
  }

  // Arrow with a KaTeX name past its head.
  // The name sits past the head (f = null) or at fraction f of the length, moved by off (m).
  function named(color, radius, html, priority = 1, { f = null, off = [0, 0, 0] } = {}) {
    const a = stage.arrow(color, { radius });
    a.visible = false;
    const l = stage.label(html, [0, 0, 0], 'tag', { dy: 0, priority });
    l.node.dataset.off = '1';
    return {
      set(origin, vec, len, on = true) {
        if (!on || !(len > 0.05)) { a.visible = false; l.node.dataset.off = '1'; return; }
        a.update(origin, vec, len);
        const n = Math.hypot(...vec);
        l.node.dataset.off = '';
        l.move(origin.map((c, i) => c + vec[i] / n * (f === null ? len + 1.0 : len * f) + off[i]));
      },
    };
  }
  function home(parts) {
    const span = parts.hi - parts.lo + 8, d = Math.max(1.2 * span, 1.85 * (M.D + NEAR + FAR + 2 * BANK));
    stage.setHome({ target: [(parts.lo + parts.hi) / 2, 0, -M.D / 2 + 1], direction: [0, 1.25, 1], distance: d, minDistance: d * 0.3, maxDistance: d * 2.5 });
  }
  const answered = p => p.activity === 'add' || (p.activity === 'land' && ui.ldone) || (p.activity === 'aim' && ui.adone);

  // ---------- shared motion: frame A or frame B ----------
  function motion(p) {
    const frameB = p.activity === 'add' && p.frame === 'B';
    const parts = scene(p, frameB);
    const show = answered(p);
    if (show) parts.dashed(frameB ? [parts.xB, 0.04, -M.D] : [parts.xL, 0.04, -M.D]);
    // Speeds beside the names in the velocity-addition activity only (the two prediction activities ask for them).
    const sp = p.activity === 'add' ? M.velocities(p) : null, val = v => (sp ? ` <span class="val">${fmt(Math.hypot(...v))} m/s</span>` : '');
    const A = {
      pb: named(COL.v, frameB ? 0.13 : 0.08, tex('\\vec v_{PB}') + (sp ? val(sp.vPB) : ''), 3, frameB ? {} : { f: 0.5, off: [-4.4, 0, 0.8] }),
      ba: named(COL.v, 0.08, tex('\\vec v_{BA}') + (sp ? val(sp.vBA) : ''), 3, { f: 0.5, off: [0, 0.3, -1.4] }),
      pa: named(COL.v, 0.13, tex('\\vec v_{PA}') + (sp ? val(sp.vPA) : ''), 4, { f: 0.5, off: [2.6, 0, 0.4] }),
      ab: named(COL.v, 0.08, tex('\\vec v_{AB}'), 2),
      rpa: named(COL.r, 0.05, tex('\\vec r_{PA}'), 1, { f: 0.5, off: [-1.4, 0.3, 0] }),
      rba: named(COL.r, 0.05, tex('\\vec r_{BA}'), 1, { f: 0.5, off: [0, 0.3, 1.3] }),
      rpb: named(COL.r, 0.05, tex('\\vec r_{PB}'), 1, { f: 0.5, off: [1.4, 0.3, 0] }),
    };
    // Frame B origin: a ring float that starts at O and drifts with the water.
    const bMark = stage.ring(stage.group, [0, 0.08, 0], 0.55, 0xf4f8fc, 0.09);
    // Named in full and set upstream of the float, so at t = 0 it does not read as the name of the boat above it.
    const bTag = stage.label('강물 원점 (frame B)', [0, 0, 0], 'tag', { dy: 0, priority: 2 });
    cur = {
      render(o, q) {
        const on = q.arrows, rBoat = frameB ? o.rPB : o.rPA;
        parts.place(frameB ? -o.rBA[0] : 0, frameB ? 0 : o.rBA[0], rBoat, o.vPB);
        const bPos = frameB ? [0, 0.08, 0] : [o.rBA[0], 0.08, 0];
        bMark.position.set(...bPos); bTag.move([bPos[0] - 3.2, 0.2, bPos[2] + 0.4]);
        const base = [rBoat[0], H, rBoat[2]], tip = base.map((c, i) => c + o.vPB[i] * SCALE.v);
        if (frameB) {
          A.pb.set(base, o.vPB, Math.hypot(...o.vPB) * SCALE.v, on);
          A.ab.set([DOCK_X - 5 - o.rBA[0], TOP + 1.2, NEAR + 1.5], [-o.vBA[0], 0, 0], o.vBA[0] * SCALE.v, on);
          A.ba.set(base, [1, 0, 0], 0); A.pa.set(base, [1, 0, 0], 0);
        } else {
          A.pb.set(base, o.vPB, Math.hypot(...o.vPB) * SCALE.v, on);
          A.ba.set(tip, o.vBA, o.vBA[0] * SCALE.v, on);
          A.pa.set(base, o.vPA, o.speedPA * SCALE.v, on && show);
          A.ab.set(base, [1, 0, 0], 0);
        }
        // Position vectors of Eq. (4.7.1), frame A of the first activity only.
        const pv = q.activity === 'add' && !frameB && o.t > 0;
        const lift = v => [v[0], 0.18, v[2]];
        A.rpa.set(lift([0, 0, 0]), o.rPA, Math.hypot(...o.rPA), pv);
        A.rba.set(lift([0, 0, 0]), o.rBA, Math.abs(o.rBA[0]), pv);
        A.rpb.set(lift(o.rBA), o.rPB, Math.hypot(...o.rPB), pv);
      },
    };
    home(parts);
    return parts;
  }

  const legend = [{ label: '속도 (velocity)', color: '#0072b2' }, { label: '위치·지나온 길 (position)', color: '#000000' }];

  // ---------- add ----------
  function buildAdd(p) {
    motion(p);
    return { legend };
  }

  // ---------- landing prediction (graded) ----------
  function buildLand(p) {
    const q = M.landQuestion(lIndex);
    if (ui.lq?.index !== q.index) { ui.lq = q; ui.ldone = false; ui.lGuess = null; ui.lInputs = null; saved.land = null; }
    for (const k of ['u', 'w', 'theta']) if (p[k] !== q[k]) ctx.setParam(k, q[k]);
    const parts = motion(p);
    if (ui.ldone && Number.isFinite(ui.lGuess)) parts.flag(ui.lGuess, '예측');
    const box = quizBox(ctx.panel, `문제 ${q.index + 1} / ${M.LCOUNT}`);
    const T = (x, u) => tex(`${N(x)}\\ \\mathrm{${u}}`);
    box.text(`강물에 대한 배의 속력 ${tex('v_{PB}')} = ${T(q.u, 'm/s')}, 뱃머리 각 ${tex(`\\theta = ${N(q.theta)}^\\circ`)}${q.theta > 0 ? ' (상류 쪽)' : q.theta < 0 ? ' (하류 쪽)' : ''}, 강물의 속력 ${tex('v_{BA}')} = ${T(q.w, 'm/s')}다. 재생하기 전에 예측하자.`);
    box.text('① 건너는 데 걸리는 시간 <i>t</i>', 'sub');
    const tIn = box.answer({ label: '건너는 시간', unit: 's', placeholder: '예 7.5' });
    if (ui.lInputs) tIn.value = ui.lInputs[0];
    box.text('② 도착 지점 <i>x</i> (바로 맞은편에서, 하류 쪽 +)', 'sub');
    const xIn = box.answer({ label: '도착 지점', unit: 'm', placeholder: '예 −3.2', onEnter: () => check() });
    if (ui.lInputs) xIn.value = ui.lInputs[1];
    const check = () => {
      if (ui.ldone) return;
      const r = M.checkLanding(q, tIn.value, xIn.value);
      if (r.reason === 'unreadable') { box.feedback(false, '두 칸 모두 숫자로 적자. 예 7.5, −3.2'); return; }
      const tMsg = r.tOk ? '① 시간은 맞다.' : {
        nocos: '① 시간이 틀렸다. <i>D</i>/<i>v</i><sub><i>PB</i></sub>는 뱃머리를 돌린 각을 빼먹었다. 건너는 성분은 <i>v</i><sub><i>PB</i></sub> cos <i>θ</i>다.',
        resultant: '① 시간이 틀렸다. 강가에 대한 속력 |<i>v⃗</i><sub><i>PA</i></sub>|가 아니라 건너는 방향 성분으로 나눈다.',
        value: '① 시간이 틀렸다. 건너는 방향(<i>z</i>) 성분만 강폭을 줄인다.',
      }[r.tWhy];
      const xMsg = r.xOk ? '② 도착 지점도 맞다.' : {
        sign: '② 부호가 반대다. 하류 쪽이 +다.',
        noheading: '② 뱃머리를 돌린 몫 −<i>v</i><sub><i>PB</i></sub> sin <i>θ</i>를 빼먹었다.',
        nocurrent: '② 강물이 배를 하류로 옮기는 몫 <i>v</i><sub><i>BA</i></sub><i>t</i>를 빼먹었다.',
        value: '② 도착 지점이 틀렸다. <i>x</i> 성분 <i>v</i><sub><i>PA,x</i></sub> = <i>v</i><sub><i>PB,x</i></sub> + <i>v</i><sub><i>BA</i></sub>에 시간을 곱한다.',
      }[r.xWhy];
      const sol = `${tex(`t = \\dfrac{D}{v_{PB}\\cos\\theta} = ${N(q.t)}\\ \\mathrm{s}`)}, ${tex(`x = (v_{BA} - v_{PB}\\sin\\theta)\\,t = ${N(Math.abs(q.x) < 1e-9 ? 0 : q.x)}\\ \\mathrm{m}`)}`;
      saved.land = { ok: r.ok, html: `${tMsg} ${xMsg}<br>${sol}<br>재생해서 확인하자. 회색 깃발이 예측이다.` };
      ui.lGuess = Math.max(parts.lo - 2, Math.min(parts.hi + 2, parseNumber(xIn.value)));
      ui.lInputs = [tIn.value, xIn.value];
      ui.ldone = true; ctx.rebuild();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }, { label: '새 문제', onClick: () => { lIndex += 1; ctx.rebuild(); } }]);
    if (saved.land) box.feedback(saved.land.ok, saved.land.html);
    return { legend };
  }

  // ---------- aiming (graded) ----------
  function buildAim(p) {
    const q = M.aimQuestion(aIndex);
    if (ui.aq?.index !== q.index) { ui.aq = q; ui.adone = false; ui.aTheta = 0; ui.aInputs = null; saved.aim = null; }
    for (const [k, v] of [['u', q.u], ['w', q.w], ['theta', ui.aTheta]]) if (p[k] !== v) ctx.setParam(k, v);
    motion(p);
    const box = quizBox(ctx.panel, `문제 ${q.index + 1} / ${M.ACOUNT}`);
    const T = (x, u) => tex(`${N(x)}\\ \\mathrm{${u}}`);
    box.text(`강물에 대한 배의 속력 ${tex('v_{PB}')} = ${T(q.u, 'm/s')}, 강물의 속력 ${tex('v_{BA}')} = ${T(q.w, 'm/s')}다. 출발점 바로 맞은편 (<i>x</i> = 0)에 닿으려면 뱃머리를 상류 쪽으로 몇 도 돌려야 하나?`);
    const input = box.answer({ label: '뱃머리 각', unit: '°', placeholder: '예 25', onEnter: () => check() });
    const none = box.check('어떤 각으로도 닿을 수 없다');
    if (ui.aInputs) { input.value = ui.aInputs[0]; none.checked = ui.aInputs[1]; }
    const check = () => {
      if (ui.adone) return;
      const r = M.checkAim(q, input.value, none.checked);
      if (r.reason === 'unreadable') { box.feedback(false, '각을 숫자로 적거나 아래 칸을 고르자. 예 25'); return; }
      const sol = q.possible
        ? `${tex(`v_{PB}\\sin\\theta = v_{BA}`)}에서 ${tex(`\\theta = \\sin^{-1}\\dfrac{${N(q.w)}}{${N(q.u)}} = ${N(q.theta)}^\\circ`)}, 건너는 시간 ${tex(`t = ${N(q.t)}\\ \\mathrm{s}`)}`
        : `${tex('v_{PB} < v_{BA}')}라 ${tex('v_{PB}\\sin\\theta = v_{BA}')}인 각이 없다.`;
      const why = {
        null: q.possible ? '맞다. 강물을 거슬러 가는 성분이 강물 속력과 같으면 <i>x</i> 성분이 0이다.' : '맞다. 배가 강물보다 느리면 <i>x</i> 성분을 0으로 만들 수 없다.',
        downstream: '하류 쪽으로 돌렸다. 강물을 거슬러 상류 쪽 (+)으로 돌린다.',
        tan: 'tan <i>θ</i> = <i>v</i><sub><i>BA</i></sub>/<i>v</i><sub><i>PB</i></sub>는 뱃머리를 바로 건너편에 둘 때 밀려가는 각이다. 맞은편에 닿으려면 sin <i>θ</i> = <i>v</i><sub><i>BA</i></sub>/<i>v</i><sub><i>PB</i></sub>다.',
        impossible: '배가 강물보다 느리면 어떤 각으로도 <i>x</i> 성분이 0이 되지 않는다.',
        possible: '닿을 수 있다. <i>v</i><sub><i>PB</i></sub> > <i>v</i><sub><i>BA</i></sub>이면 맞는 각이 있다.',
        value: '<i>v</i><sub><i>PA,x</i></sub> = <i>v</i><sub><i>BA</i></sub> − <i>v</i><sub><i>PB</i></sub> sin <i>θ</i> = 0이 되게 하자.',
      }[String(r.reason)];
      const th = none.checked ? 0 : parseNumber(input.value);
      ui.aTheta = Number.isFinite(th) ? Math.max(M.THETA[0], Math.min(M.THETA[1], th)) : 0;
      const tried = none.checked ? '<br>뱃머리를 바로 건너편에 두고 출발한다. 재생해 보자.' : `<br>적은 각 ${tex(`${N(ui.aTheta)}^\\circ`)}로 출발한다. 재생해 보자.`;
      saved.aim = { ok: r.ok, html: `${why}<br>${sol}${tried}` };
      ui.aInputs = [input.value, none.checked];
      ui.adone = true; ctx.rebuild();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }, { label: '새 문제', onClick: () => { aIndex += 1; ctx.rebuild(); } }]);
    if (saved.aim) box.feedback(saved.aim.ok, saved.aim.html);
    return { legend };
  }

  return {
    build(p) {
      cur = null;
      return p.activity === 'land' ? buildLand(p) : p.activity === 'aim' ? buildAim(p) : buildAdd(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
