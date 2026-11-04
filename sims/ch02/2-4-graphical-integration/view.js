// 2.6 Graphical Integration in Motion Analysis — 3D view.
// Measuring board as the x axis with a car, and x–t, v–t, a–t boards stacked behind it (as 2-2).
// The a–t area fills as time runs and becomes the v–t curve, the v–t area becomes the car's displacement.
// Track, boards and car follow sims/ch02/2-2-constant-acceleration/view.js. Fill and step curve come from ./area.js.
import { fmt, fmtFixed } from '../../../core/format.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { car } from '../../../core/models3d.js';
import { quizBox } from '../../../core/quiz.js';
import { boardLines } from './boardlines.js';
import { areaFill, stepCurve } from './area.js';
import * as M from './model.js';

const COL = { x: 0x000000, v: 0x0072b2, a: 0xcc79a7, mark: 0x40546a, guide: 0x7d94a8 };
const W = 20;                                     // world length of the track
const z9 = { zero: 1e-9 };
const LEGEND = [
  { label: '위치 (position)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' },
  { label: '넓이 (area)', color: '#e69f00' },
];

export function view(stage, ctx) {
  const { THREE } = stage;
  let cur = null;
  const memo = {};                                // checked predictions kept across rebuilds (key: activity and steps)

  // Measuring board covering physical x in [lo, hi] (same as 2-2).
  function track(lo, hi, step) {
    const s = W / (hi - lo), wx = x => -W / 2 + (x - lo) * s;
    const width = 4.4, half = width / 2;
    stage.board(stage.group, -W / 2 - 1.3, W / 2 + 1.3, width, 0);
    stage.floorPlane(-1.45);
    for (const x of [-W / 2, W / 2]) for (const z of [-half + 0.8, half - 0.8]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.42, 0.52, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
    const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9)), major = [], minor = [];
    for (let k = Math.round(lo / step); k * step <= hi + 1e-9; k++) {
      const x = k * step, X = wx(x);
      major.push([X, 0.014, half - 0.55], [X, 0.014, half - (Math.abs(x) < 1e-9 ? 1.25 : 0.95)]);
      stage.label(`${fmtFixed(x, d)} m`, [X, 0.1, half - 0.2], 'measure');
    }
    for (let k = Math.round(lo / step * 5); k * step / 5 <= hi + 1e-9; k++) { const X = wx(k * step / 5); minor.push([X, 0.012, half - 0.55], [X, 0.012, half - 0.75]); }
    minor.push([-W / 2, 0.016, half - 0.55], [W / 2, 0.016, half - 0.55]);
    for (const [pts, color] of [[major, 0xd8e5ee], [minor, 0xa9bccb]]) stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(stage.v3)), new THREE.LineBasicMaterial({ color })));
    stage.arrow(0x56687a, { radius: 0.045 }).update([W / 2 + 0.15, 0.08, half - 0.55], [1, 0, 0], 0.95);
    stage.label('+<i>x</i>', [W / 2 + 1.35, 0.1, half - 0.55], 'axis', { dy: 0 });
    return { wx, half };
  }

  // x–t on top, then v–t, then a–t (as 2-2), raised so the car tags do not cover the lowest tick row.
  function boards(half, xr, vr) {
    const width = 21, h = 4.3, gap = 0.35, z = -half - 0.8, x0 = -width / 2, base = 0.9;
    const ar = { min: -4, max: 4, step: 2 };
    const top = base + 3 * h + 2 * gap;
    for (const x of [x0 - 0.22, x0 + width + 0.22]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.09, 0.11, top + 1.45, 20), stage.lit(0x8c9ca9, 0.6, 0.3), [x, (top - 1.45) / 2, z + 0.07]);
    const mk = (row, r, title) => graphBoard(stage, { origin: [x0, base + row * (h + gap), z], width, height: h, t: [0, M.T], y: [r.min, r.max], yStep: r.step, yTitle: title });
    const b = { x: mk(2, xr, '<i>x</i> (m)'), v: mk(1, vr, '<i>v</i> (m/s)'), a: mk(0, ar, '<i>a</i> (m/s²)'), top };
    return b;
  }

  // Car with a ring on the ruler below its middle and optional velocity and acceleration arrows (as 2-2).
  function mover(withArrows) {
    const body = car(stage, { length: 2.0, color: 0xdfe5ea }); stage.group.add(body);
    const ring = stage.ring(stage.group, [0, 0.03, 0], 0.24, COL.mark, 0.03);
    const va = withArrows ? stage.arrow(COL.v, { radius: 0.07 }) : null, aa = withArrows ? stage.arrow(COL.a, { radius: 0.07 }) : null;
    const vl = withArrows ? stage.label('<i>v</i>', [0, 0, 0], 'axis', { dy: 0 }) : null, al = withArrows ? stage.label('<i>a</i>', [0, 0, 0], 'axis', { dy: 0 }) : null;
    return {
      place(X, ringZ, v, a) {
        body.position.set(X, 0, 0); ring.position.set(X, 0.03, ringZ);
        if (!withArrows) return;
        const lv = Math.abs(v) * 0.13, la = Math.abs(a) * 0.6;
        va.update([X, 1.45, 0], [Math.sign(v) || 1, 0, 0], lv); aa.update([X, 2.05, 0], [Math.sign(a) || 1, 0, 0], la);
        vl.node.dataset.off = lv > 0.05 ? '' : '1'; al.node.dataset.off = la > 0.05 ? '' : '1';
        vl.move([X + Math.sign(v) * (lv + 0.35), 1.45, 0]); al.move([X + Math.sign(a) * (la + 0.35), 2.05, 0]);
      },
    };
  }

  // A range that ends at 0 puts the t-axis title on the tick row (core/graph3d.js), so leave half a step of room.
  const pad = r => ({ ...r, min: r.min === 0 ? -r.step / 2 : r.min, max: r.max === 0 ? r.step / 2 : r.max });

  function scene(p, extraX = []) {
    const vs = M.velocitySegs(p), xs = [], vv = [0, ...vs.map(s => s.f1)];
    for (let i = 0; i <= 400; i++) xs.push(M.kin(p, M.T * i / 400).x);
    const xr = pad(niceRange(Math.min(...xs, ...extraX), Math.max(...xs, ...extraX), { target: 2, minSpan: 10 }));
    const vr = pad(niceRange(Math.min(...vv), Math.max(...vv), { target: 3, minSpan: 4 }));
    const { wx, half } = track(xr.min, xr.max, xr.step);
    const gb = boards(half, xr, vr);
    stage.setHome({ target: [0, gb.top * 0.45, -1.4], direction: [0, 0.26, 1], distance: gb.top * 2.05 + 2.5, minDistance: 10, maxDistance: 70 });
    const a = M.steps(p);
    const pts = []; a.forEach(g => { pts.push([g.t0, g.f0], [g.t1, g.f1]); });
    stepCurve(stage, gb.a, pts, COL.a);
    const aDot = boardLines(stage, gb.a).dot(COL.a, 0.12);
    return { wx, half, gb, ringZ: half - 0.85, vs, a, mv: mover(p.arrows), aDot };
  }

  const key = (act, p) => `${act}|${M.STEP_IDS.map(id => p[id]).join(',')}`;

  // ---------------- dv: a–t area to the change in velocity ----------------
  function buildDv(p) {
    const S = scene(p), { gb } = S;
    const fillA = areaFill(stage, gb.a, M.regions(S.a), { unit: 'm/s' });
    const Lv = boardLines(stage, gb.v), Lx = boardLines(stage, gb.x);
    const vTrace = Lv.trace(t => M.kin(p, t).v, COL.v), xTrace = Lx.trace(t => M.kin(p, t).x, COL.x);

    const k = key('dv', p), saved = memo[k] ?? (memo[k] = { fb: null, text: '' });
    const box = quizBox(ctx.panel, '예측');
    box.text(`재생하기 전에 <i>a</i>–<i>t</i> 판의 넓이를 더해 <i>t</i> = ${fmt(M.T)} s에서의 속도 <i>v</i>를 구한다. <i>v</i><sub>0</sub> = 0이다.`);
    const input = box.answer({ label: '속도', unit: 'm/s', placeholder: '예 −2.5', onEnter: () => check() });
    input.value = saved.text; input.addEventListener('input', () => { saved.text = input.value; });
    const sum = M.totalArea(M.regions(S.a));
    const sol = () => `넓이의 합 = ${S.a.map(g => `(${fmt(g.f0, z9)})(${fmt(M.TAU)})`).join(' + ')} = ${fmt(sum, z9)} m/s이고 <i>v</i> = <i>v</i><sub>0</sub> + 넓이 = ${fmt(sum, z9)} m/s이다.`;
    const say = (ok, html) => { saved.fb = { ok, html }; box.feedback(ok, html); fillA.values(true); fillA.update(M.T); };
    const check = () => {
      const r = M.checkDv(p, input.value);
      if (r.reason === 'unreadable') { box.feedback(false, '숫자로 적자. 예 −2.5'); return; }
      const msg = {
        null: '맞다.',
        abs: '시간축 아래 넓이는 음(−)이다. 넓이의 크기만 더하면 안 된다.',
        heights: `가속도 값만 더했다. 넓이는 가속도 × 시간 간격이고 한 구간은 ${fmt(M.TAU)} s다.`,
        sign: '부호를 다시 보자. 시간축 위 넓이는 양(+), 아래 넓이는 음(−)이다.',
        value: `구간마다 <i>a</i> × ${fmt(M.TAU)} s를 구해 부호까지 더하자.`,
      }[String(r.reason)];
      say(r.ok, `${msg} ${sol()}`);
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    if (saved.fb) { box.feedback(saved.fb.ok, saved.fb.html); fillA.values(true); }

    cur = {
      render(o) {
        S.mv.place(S.wx(o.x), S.ringZ, o.v, o.a);
        for (const b of ['x', 'v', 'a']) gb[b].setTime(o.t);
        fillA.update(saved.fb ? M.T : o.t); vTrace.update(o.t); xTrace.update(o.t); S.aDot.place(o.t, o.a);
      },
    };
    return { legend: LEGEND };
  }

  // ---------------- dx: v–t area to the displacement ----------------
  function buildDx(p) {
    const S = scene(p), { gb } = S;
    // The given v–t graph: exact straight pieces, drawn whole, with a marker at the current time.
    stepCurve(stage, gb.v, S.vs.flatMap(g => [[g.t0, g.f0], [g.t1, g.f1]]), COL.v);
    const vDot = boardLines(stage, gb.v).dot(COL.v, 0.12);
    const fillV = areaFill(stage, gb.v, M.regions(S.vs), { unit: 'm' });
    const Lx = boardLines(stage, gb.x), xTrace = Lx.trace(t => M.kin(p, t).x, COL.x);
    const start = stage.ring(stage.group, [S.wx(0), 0.03, S.ringZ], 0.24, 0x9aa9b5, 0.03);
    start.castShadow = false;

    const k = key('dx', p), saved = memo[k] ?? (memo[k] = { fb: null, text: '' });
    const box = quizBox(ctx.panel, '예측');
    box.text(`재생하기 전에 <i>v</i>–<i>t</i> 판의 넓이로 <i>t</i> = ${fmt(M.T)} s까지의 변위 <i>x</i> − <i>x</i><sub>0</sub>를 구한다. 축 아래 넓이는 음(−)이다.`);
    const input = box.answer({ label: '변위', unit: 'm', placeholder: '예 7.5', onEnter: () => check() });
    input.value = saved.text; input.addEventListener('input', () => { saved.text = input.value; });
    const say = (ok, html) => { saved.fb = { ok, html }; box.feedback(ok, html); fillV.values(true); fillV.update(M.T); };
    const check = () => {
      const r = M.checkDx(p, input.value);
      if (r.reason === 'unreadable') { box.feedback(false, '숫자로 적자. 예 7.5'); return; }
      const tail = `변위 <i>x</i> − <i>x</i><sub>0</sub> = ${fmt(r.target, z9)} m이다. 넓이의 크기를 모두 더한 전체 거리는 ${fmt(r.dist, z9)} m이고 평균 속력 <i>s</i><sub>avg</sub> = ${fmt(r.dist, z9)} m / ${fmt(M.T)} s = ${fmt(M.sAvg(r.dist, M.T), z9)} m/s이다.`;
      const msg = {
        null: '맞다.',
        distance: '그 값은 전체 거리 (total distance)다. 변위는 축 아래 넓이를 음(−)으로 더한다.',
        'final-v': `그 값은 <i>t</i> = ${fmt(M.T)} s의 <i>v</i>에 ${fmt(M.T)} s를 곱한 값이다. 속도가 바뀌므로 조각마다 넓이를 구해 더하자.`,
        sign: '부호를 다시 보자. 축 위 넓이는 양(+), 아래 넓이는 음(−)이다.',
        value: '직사각형과 삼각형 조각으로 나눠 넓이를 다시 더해 보자.',
      }[String(r.reason)];
      say(r.ok, `${msg} ${tail}`);
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    if (saved.fb) { box.feedback(saved.fb.ok, saved.fb.html); fillV.values(true); }

    cur = {
      render(o) {
        S.mv.place(S.wx(o.x), S.ringZ, o.v, o.a);
        for (const b of ['x', 'v', 'a']) gb[b].setTime(o.t);
        fillV.update(saved.fb ? M.T : o.t); xTrace.update(o.t); vDot.place(o.t, o.v); S.aDot.place(o.t, o.a);
      },
    };
    return { legend: LEGEND };
  }

  // ---------------- stop: reach the stop line with v = 0 ----------------
  function buildStop(p) {
    const X = M.goalX(p), S = scene(p, [X]), { gb } = S;
    const cv = gb.v.curve(t => M.kin(p, t).v, { color: COL.v }), cx = gb.x.curve(t => M.kin(p, t).x, { color: COL.x });
    const fillA = areaFill(stage, gb.a, M.regions(S.a), { unit: 'm/s' }), fillV = areaFill(stage, gb.v, M.regions(S.vs), { unit: 'm' });
    fillA.values(true); fillV.values(true); fillA.update(M.T); fillV.update(M.T);
    // Stop line across the track with a post, and the goal on the x–t board.
    stage.mesh(stage.group, new THREE.BoxGeometry(0.14, 0.03, S.half * 2 - 0.5), stage.flat(0xffffff), [S.wx(X), 0.02, 0], [0, 0, 0], false);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.06, 0.06, 1.6, 16), stage.lit(0x8c9ca9, 0.6, 0.3), [S.wx(X), 0.8, -S.half + 0.3]);
    boardLines(stage, gb.x).segment(COL.guide, { radius: 0.025, dashed: true }).set(0, X, M.T, X);
    const [g0, g1] = gb.x.range.y;
    stage.label(`정지선 <i>x</i> = ${fmt(X, z9)} m`, gb.x.at(1.2, X), 'tag', { dy: X > (g0 + g1) / 2 ? 16 : -16, priority: 2 });
    gb.x.mark(M.T, X);

    const box = quizBox(ctx.panel, '정지선 맞추기');
    box.text(`<i>t</i> = ${fmt(M.T)} s에 정지선 <i>x</i> = ${fmt(X, z9)} m에서 <i>v</i> = 0으로 멈추도록 <i>a</i><sub>1</sub>–<i>a</i><sub>4</sub>를 맞춘다. 재생해 보고 확인한다.`);
    const check = () => {
      const r = M.checkStop(p, X);
      const parts = [];
      if (!r.vOk) parts.push(`<i>t</i> = ${fmt(M.T)} s에서 <i>v</i> = ${fmt(r.v, z9)} m/s다. <i>a</i>–<i>t</i> 넓이의 합이 0이어야 멈춘다.`);
      if (!r.xOk) parts.push(`<i>t</i> = ${fmt(M.T)} s의 위치가 <i>x</i> = ${fmt(r.x, z9)} m다. <i>v</i>–<i>t</i> 넓이의 합이 ${fmt(X, z9)} m가 되도록 바꾸자.`);
      box.feedback(r.ok, r.ok ? `맞다. <i>a</i>–<i>t</i> 넓이의 합이 0이라 <i>v</i> = 0이고 <i>v</i>–<i>t</i> 넓이의 합이 ${fmt(r.x, z9)} m다.` : parts.join(' '));
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);

    cur = {
      render(o) {
        S.mv.place(S.wx(o.x), S.ringZ, o.v, o.a);
        for (const b of ['x', 'v', 'a']) gb[b].setTime(o.t);
        cv.update(o.t); cx.update(o.t); S.aDot.place(o.t, o.a);
      },
    };
    return { legend: LEGEND };
  }

  return {
    build(p) {
      cur = null;
      return p.activity === 'dx' ? buildDx(p) : p.activity === 'stop' ? buildStop(p) : buildDv(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
