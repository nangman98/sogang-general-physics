// 2.5 Free-Fall Acceleration — 3D view.
// A person on a roof edge tosses a ball straight up. A vertical measuring board is the y axis, and the y–t board
// next to it uses the same scale and the same height as the scene (1 world unit = 1 m, y = 0 at the release point),
// so the ball and its point on the y–t curve are always at one height. A v–t board stands to the right.
import { fmt } from '../../../core/format.js';
import { graphBoard, niceRange, niceStep } from '../../../core/graph3d.js';
import { quizBox } from '../../../core/quiz.js';
import { boardLines } from './boardlines.js';
import { person, building, equalImages } from './props.js';
import * as M from './model.js';

const COL = { y: 0x000000, v: 0x0072b2, a: 0xcc79a7, mark: 0x40546a, guide: 0x7d94a8 };
const R = 0.4;                                    // ball radius in the scene (m), not to scale
const ROOF = -1.55;                               // roof surface; the raised hand of a 1.75 m person is at y = 0
const EDGE = -0.75;                               // roof edge (x); the ball rises and falls just outside it
const RULER = { x: 1.85, w: 1.0, face: 0.2 };     // vertical measuring board
const z9 = { zero: 1e-9 };
const LEGEND = [{ label: '위치 (position)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' }];

export function view(stage, ctx) {
  const { THREE } = stage;
  let cur = null;
  const memo = {};                                // checked predictions, kept across rebuilds (key: activity, v0, h)

  // Vertical measuring board: the 2-2 board turned so its length runs along +y and its face looks along +z.
  function ruler(y0, y1) {
    const g = new THREE.Group();
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)));
    g.position.set(RULER.x, 0, 0);
    stage.group.add(g);
    stage.board(g, y0, y1 + 0.6, RULER.w, RULER.face, { thickness: 0.4 });
    const major = [], minor = [], xl = RULER.x - RULER.w / 2 + 0.12, zf = RULER.face + 0.016;
    for (let y = Math.ceil(y0); y <= y1 + 1e-9; y++) {
      const long = y % 5 === 0;
      (long ? major : minor).push([xl, y, zf], [xl + (y === 0 ? 0.75 : long ? 0.45 : 0.22), y, zf]);
    }
    for (const [pts, color] of [[major, 0xd8e5ee], [minor, 0xa9bccb]]) stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(stage.v3)), new THREE.LineBasicMaterial({ color })));
    stage.arrow(0x56687a, { radius: 0.045 }).update([RULER.x, y1 + 0.75, zf], [0, 1, 0], 0.9);
    stage.label('+<i>y</i>', [RULER.x, y1 + 2.1, zf], 'axis', { dy: 0 });
  }

  function scene(p) {
    const v0 = p.v0, h = p.h, T = M.groundTime(v0, h), yMax = M.maxHeight(v0);
    const span = h + yMax, ys = niceStep(span, 5) < 5 ? 5 : niceStep(span, 5);
    const y0 = -h, y1 = Math.max(ys, Math.ceil((yMax + 1) / ys) * ys);
    // Ground slab (lawn) under the building and the landing spot, on a floor further down like the 2-2 track legs.
    stage.floorPlane(y0 - 3);
    stage.mesh(stage.group, new THREE.BoxGeometry(13.4, 1, 11), stage.lit(0xb9c5b4, 0, 0.95), [-4.3, y0 - 0.5, 0]).castShadow = false;
    stage.group.add(building(stage, { x0: -8.75, x1: EDGE, d: 7, yb: y0, yr: ROOF }));
    const man = person(stage, 1.75, 0x34495e); man.position.set(EDGE - 0.35, ROOF, -0.15); stage.group.add(man);
    ruler(y0, y1);
    stage.label(`땅 <i>y</i> = ${fmt(-h)} m`, [0.2, y0 + 0.1, 3.2], 'station', { dy: 0 });

    // y–t board: plot box exactly [y0, y1] in world height (graphBoard margins B = 0.66, T = 0.62).
    const bx = 2.45, bw = Math.max(20, 0.72 * (y1 - y0)), bz = -0.6, tEnd = Math.ceil(T * 2) / 2;
    const yb = graphBoard(stage, { origin: [bx, y0 - 0.66, bz], width: bw, height: (y1 - y0) + 0.66 + 0.62, t: [0, tEnd], y: [y0, y1], yStep: ys, yTitle: '<i>y</i> (m)' });
    // v–t board, ordinary scale, standing to the right at mid height.
    // A range that ends at 0 puts the t-axis title on the tick row (core/graph3d.js), so leave half a step of room.
    const vr0 = niceRange(M.groundVelocity(v0, h), Math.max(v0, 0), { target: 4, minSpan: 4 });
    const vr = { ...vr0, max: vr0.max === 0 ? vr0.step / 2 : vr0.max };
    const vh = Math.max(9, 0.6 * (y1 - y0)), vx = bx + bw + 0.8, vw = Math.max(14, 0.5 * (y1 - y0)), vy = (y0 + y1) / 2 - vh / 2;
    const vb = graphBoard(stage, { origin: [vx, vy, bz], width: vw, height: vh, t: [0, tEnd], y: [vr.min, vr.max], yStep: vr.step, yTitle: '<i>v</i> (m/s)' });
    for (const [x, top] of [[bx + 0.3, y0 - 0.66], [bx + bw - 0.3, y0 - 0.66], [vx + 0.3, vy], [vx + vw - 0.3, vy]]) {
      const len = top - (y0 - 3);
      if (len > 0.05) stage.mesh(stage.group, new THREE.CylinderGeometry(0.09, 0.11, len, 16), stage.lit(0x8c9ca9, 0.6, 0.3), [x, (y0 - 3) + len / 2, bz + 0.07]);
    }

    // Ball with three bands (as 4-2), a dashed line to its point on the y–t board, optional v and a arrows.
    const ball = new THREE.Group(); stage.group.add(ball);
    stage.ball([0, 0, 0], R, 0x8696a6, ball);
    for (const r of [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]]) stage.ring(ball, [0, 0, 0], R * 1.01, 0x24323f, 0.02, r);
    const level = stage.line([[0, 0, 0], [1, 0, 0]], COL.guide, { dashed: true, dash: 0.35, gap: 0.25 });
    level.frustumCulled = false;
    const arrows = p.arrows ? { v: stage.arrow(COL.v, { radius: 0.07 }), a: stage.arrow(COL.a, { radius: 0.07 }), vl: stage.label('<i>v</i>', [0, 0, 0], 'axis', { dy: 0 }), al: stage.label('<i>a</i>', [0, 0, 0], 'axis', { dy: 0 }) } : null;

    // Frame the whole scene with room for the tick rows above the stage footer.
    const xMin = -9.5, xMax = vx + vw + 0.5, H = (y1 + 3) - (y0 - 1.5);
    const distance = Math.max(H / 0.47, (xMax - xMin) / 0.98);
    stage.setHome({ target: [(xMin + xMax) / 2, (y0 - 1.5 + y1 + 3) / 2 + 0.03 * H, 0], direction: [0.04, 0.12, 1], distance, minDistance: distance * 0.25, maxDistance: distance * 2.2 });

    return {
      v0, h, T, yMax, yb, vb, ball,
      place(o) {
        ball.position.set(0, o.y, 0); ball.rotation.set(o.t * 0.9, o.t * 0.4, 0);
        const pos = level.geometry.attributes.position;
        pos.setXYZ(0, R + 0.1, o.y, 0); pos.setXYZ(1, yb.X(o.t), o.y, yb.Z); pos.needsUpdate = true;
        level.computeLineDistances();
        yb.setTime(o.t); vb.setTime(o.t);
        if (arrows) {
          const lv = Math.abs(o.v) * 0.18, la = Math.abs(o.a) * 0.2;
          arrows.v.update([0.7, o.y, 0.8], [0, Math.sign(o.v) || 1, 0], lv); arrows.a.update([1.1, o.y, 0.8], [0, -1, 0], la);
          arrows.vl.node.dataset.off = lv > 0.05 ? '' : '1';
          arrows.vl.move([0.45, o.y + Math.sign(o.v) * (lv + 0.45), 0.8]); arrows.al.move([1.35, o.y - la - 0.45, 0.8]);
        }
      },
    };
  }

  // Tag next to a board point: below it in the upper half of the board, above it in the lower half.
  const tagAt = (board, t, y, html, priority = 1) => stage.label(html, board.at(t, y), 'tag', { dy: y > (board.range.y[0] + board.range.y[1]) / 2 ? 22 : -22, priority });

  // ---------------- throw: equal-interval images ----------------
  function buildThrow(p) {
    const S = scene(p);
    const cy = S.yb.curve(t => M.stateAt(S.v0, Math.min(t, S.T)).y, { color: COL.y, tag: y => `${fmt(y, { zero: 1e-9 })} m` });
    const cv = S.vb.curve(t => M.stateAt(S.v0, Math.min(t, S.T)).v, { color: COL.v, tag: v => `${fmt(v, { zero: 1e-9 })} m/s` });
    const tTop = M.timeToTop(S.v0), tBack = M.returnTime(S.v0);
    const imgs = equalImages(stage, stage.group, R, M.ghostTimes(S.v0, S.h).map(t => ({ t, up: S.v0 > 0 && t <= tTop + 1e-9, pos: [0, M.stateAt(S.v0, t).y, -0.05] })));
    const apex = S.v0 > 0 ? stage.label(`최고 높이 (maximum height) <i>y</i> = ${fmt(S.yMax)} m`, [-0.2, S.yMax + R, 0], 'apex', { dy: -22 }) : null;
    const back = S.v0 > 0 ? stage.label(`던진 높이로 돌아옴 <i>v</i> = ${fmt(-S.v0)} m/s`, [-0.2, 0, 0.5], 'tag', { dy: 0, priority: 1 }) : null;
    cur = {
      render(o) {
        S.place(o); imgs.update(o.t);
        cy.update(Math.min(o.t, S.T)); cv.update(Math.min(o.t, S.T));
        if (apex) apex.node.dataset.off = o.t >= tTop - 1e-9 ? '' : '1';
        if (back) back.node.dataset.off = o.t >= tBack - 1e-9 ? '' : '1';
      },
    };
    return { legend: LEGEND };
  }

  // ---------------- top: predict v and a at the highest point ----------------
  function buildTop(p) {
    const S = scene(p), tTop = M.timeToTop(S.v0);
    const cy = S.yb.curve(t => M.stateAt(S.v0, Math.min(t, S.T)).y, { color: COL.y });
    const Lv = boardLines(stage, S.vb);
    const vTrace = Lv.trace(t => M.stateAt(S.v0, Math.min(t, S.T)).v, COL.v);
    const key = `top|${S.v0}|${S.h}`, saved = memo[key] ?? (memo[key] = { shown: false, fb: null });
    let shown = false;
    const reveal = () => {
      if (shown) return; shown = true; saved.shown = true;
      S.yb.mark(tTop, S.yMax); S.vb.mark(tTop, 0);
      tagAt(S.yb, tTop, S.yMax, `최고점 <i>t</i> = ${fmt(tTop)} s`, 2);
      // Slope at the top as a run–rise triangle (a tangent would lie on the straight v–t line and hide it).
      const run = 1;
      Lv.segment(COL.a, { radius: 0.035, dashed: true, dash: 0.16, gap: 0.1 }).set(tTop, 0, tTop + run, 0);
      Lv.segment(COL.a, { radius: 0.035, dashed: true, dash: 0.16, gap: 0.1 }).set(tTop + run, 0, tTop + run, -M.G * run);
      stage.label(`1 s에 <i>v</i>가 −9.8 m/s 바뀐다`, S.vb.at(tTop + run, -M.G * run), 'tag', { dy: 18, priority: 2 });
    };

    const box = quizBox(ctx.panel, '예측');
    box.text('공이 최고점에 있는 순간의 속도 <i>v</i>와 가속도 <i>a</i>는? 재생하기 전에 고른다.');
    const pv = box.choices('최고점에서 속도 <i>v</i>', [{ value: '+', html: '<i>v</i> > 0' }, { value: '0', html: '<i>v</i> = 0' }, { value: '-', html: '<i>v</i> < 0' }]);
    const fs = box.box.querySelector('fieldset'); Object.assign(fs.style, { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', columnGap: '6px' });
    const pa = box.choices('최고점에서 가속도 <i>a</i>', [{ value: '0', html: '<i>a</i> = 0' }, { value: '-g', html: '<i>a</i> = −9.8 m/s²' }, { value: '+g', html: '<i>a</i> = +9.8 m/s²' }]);
    const say = (ok, html) => { saved.fb = { ok, html }; box.feedback(ok, html); };
    const check = () => {
      const r = M.checkTop(pv(), pa());
      if (r.reason === 'incomplete') { box.feedback(null, '<i>v</i>와 <i>a</i>를 모두 고르자.'); return; }
      const parts = [];
      if (!r.vOk) parts.push('최고점에서 공은 잠깐 멈춘다. 위로 가던 속도가 아래로 바뀌는 순간이라 <i>v</i> = 0이다.');
      if (r.reason === 'a-zero') parts.push('<i>a</i> = 0이 아니다. 최고점에서 <i>v</i>는 0이지만 <i>v</i>가 바뀌는 비율은 그대로 −9.8 m/s²이다. <i>a</i>가 0이면 공은 최고점에 멈춘 채로 있어야 한다.');
      if (r.reason === 'a-up') parts.push('가속도는 던진 뒤 내내 아래 방향이다. <i>a</i> = −<i>g</i> = −9.8 m/s²이다.');
      say(r.ok, r.ok ? `맞다. 최고점에서 <i>v</i> = 0이지만 <i>a</i> = −<i>g</i> = −9.8 m/s²이다. <i>v</i>–<i>t</i> 판의 기울기는 최고점에서도 −9.8 m/s²로 같다. 최고점은 <i>t</i> = ${fmt(tTop)} s, <i>y</i> = ${fmt(S.yMax)} m이다.` : parts.join(' '));
      reveal();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    if (saved.fb) box.feedback(saved.fb.ok, saved.fb.html);
    if (saved.shown) reveal();

    cur = { render(o) { S.place(o); cy.update(Math.min(o.t, S.T)); vTrace.update(Math.min(o.t, S.T)); } };
    return { legend: LEGEND };
  }

  // ---------------- sym: ascent and descent ----------------
  function buildSym(p) {
    const S = scene(p), tTop = M.timeToTop(S.v0), tBack = M.returnTime(S.v0), sy = M.symmetry(S.v0, p.yp);
    const cy = S.yb.curve(t => M.stateAt(S.v0, Math.min(t, S.T)).y, { color: COL.y });
    const cv = S.vb.curve(t => M.stateAt(S.v0, Math.min(t, S.T)).v, { color: COL.v });
    const Ly = boardLines(stage, S.yb), Lv = boardLines(stage, S.vb);
    Ly.segment(COL.guide, { radius: 0.03, dashed: true }).set(0, p.yp, S.yb.range.t[1], p.yp);
    stage.mesh(stage.group, new THREE.BoxGeometry(1.6, 0.05, 0.05), stage.flat(COL.guide), [0.3, p.yp, 0.3], [0, 0, 0], false);
    stage.label(`<i>y</i> = ${fmt(p.yp, z9)} m`, [-0.9, p.yp, 0.3], 'tag', { dy: 0, priority: 2 });
    for (const ps of sy.passes) S.yb.mark(ps.t, p.yp);

    const key = `sym|${S.v0}|${S.h}`, saved = memo[key] ?? (memo[key] = { shown: false, fb: null });
    let shown = false;
    const reveal = () => {
      if (shown) return; shown = true; saved.shown = true;
      sy.passes.forEach((ps, i) => {
        S.vb.mark(ps.t, ps.v);
        tagAt(S.vb, ps.t, ps.v, `<i>v</i> = ${fmt(ps.v, z9)} m/s`, 2);
        tagAt(S.yb, ps.t, p.yp, `<i>t</i> = ${fmt(ps.t, z9)} s`, 2);
      });
      Lv.segment(COL.guide, { radius: 0.025, dashed: true }).set(0, 0, S.vb.range.t[1], 0);
      stage.label(`올라간 시간 ${fmt(sy.ascent)} s`, S.yb.at(tTop / 2, 0), 'tag', { dy: 18, priority: 1 });
      stage.label(`내려온 시간 ${fmt(sy.descent)} s`, S.yb.at((tTop + tBack) / 2, 0), 'tag', { dy: 46, priority: 1 });
    };

    const box = quizBox(ctx.panel, '예측');
    box.text('던진 높이 <i>y</i> = 0에서 최고점까지 올라간 시간과 최고점에서 <i>y</i> = 0까지 내려온 시간, 그리고 <i>y</i> = 0으로 돌아온 순간의 속력을 재생하기 전에 비교한다.');
    const pt = box.choices('걸린 시간', [{ value: 'up', html: '올라간 시간이 길다' }, { value: 'equal', html: '같다' }, { value: 'down', html: '내려온 시간이 길다' }]);
    const ps = box.choices('돌아온 순간의 속력 |<i>v</i>|', [{ value: 'more', html: '<i>v</i><sub>0</sub>보다 크다' }, { value: 'equal', html: '<i>v</i><sub>0</sub>와 같다' }, { value: 'less', html: '<i>v</i><sub>0</sub>보다 작다' }]);
    const say = (ok, html) => { saved.fb = { ok, html }; box.feedback(ok, html); };
    const check = () => {
      const r = M.checkSym(pt(), ps());
      if (r.reason === 'incomplete') { box.feedback(null, '두 가지를 모두 고르자.'); return; }
      const parts = [];
      if (!r.tOk) parts.push(`올라간 시간과 내려온 시간은 모두 ${fmt(sy.ascent)} s로 같다. 올라갈 때 속력이 줄어드는 비율과 내려올 때 늘어나는 비율이 모두 <i>g</i>다.`);
      if (!r.sOk) parts.push(`돌아온 순간의 속력은 <i>v</i><sub>0</sub> = ${fmt(S.v0)} m/s와 같다. 방향만 아래로 바뀌어 <i>v</i> = ${fmt(-S.v0)} m/s이다.`);
      say(r.ok, r.ok ? `맞다. 두 시간이 모두 ${fmt(sy.ascent)} s이고 돌아온 순간의 속력도 ${fmt(sy.returnSpeed)} m/s로 <i>v</i><sub>0</sub>와 같다. 같은 높이에서 두 속도는 크기가 같고 방향이 반대다.` : parts.join(' '));
      reveal();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    if (saved.fb) box.feedback(saved.fb.ok, saved.fb.html);
    if (saved.shown) reveal();

    cur = { render(o) { S.place(o); cy.update(Math.min(o.t, S.T)); cv.update(Math.min(o.t, S.T)); } };
    return { legend: LEGEND };
  }

  return {
    build(p) {
      cur = null;
      return p.activity === 'top' ? buildTop(p) : p.activity === 'sym' ? buildSym(p) : buildThrow(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
