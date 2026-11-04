// 2.4 Constant Acceleration — 3D view. Measuring board as the x axis, a car as the particle,
// and x–t, v–t, a–t boards stacked behind it with one shared time cursor (textbook Fig. 2.2.1 order).
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { car } from '../../../core/models3d.js';
import { quizBox } from '../../../core/quiz.js';
import * as M from './model.js';

const COL = { x: 0x000000, v: 0x0072b2, a: 0xcc79a7 };
const UNIT_TEX = { m: '\\mathrm{m}', 'm/s': '\\mathrm{m/s}', 'm/s²': '\\mathrm{m/s^2}', s: '\\mathrm{s}' };
const W = 20;                                     // world length of the track

export function view(stage, ctx) {
  const { THREE } = stage;
  let cur = null, qIndex = 0;

  // Measuring board covering physical x in [lo, hi]. Returns the map from x (m) to world x.
  function track(lo, hi, step, lanes) {
    const s = W / (hi - lo), wx = x => -W / 2 + (x - lo) * s;
    const width = lanes === 2 ? 5.4 : 4.4, half = width / 2;
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
    // One draw call per tick set.
    for (const [pts, color] of [[major, 0xd8e5ee], [minor, 0xa9bccb]]) stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(stage.v3)), new THREE.LineBasicMaterial({ color })));
    stage.arrow(0x56687a, { radius: 0.045 }).update([W / 2 + 0.15, 0.08, half - 0.55], [1, 0, 0], 0.95);
    stage.label('+<i>x</i>', [W / 2 + 1.35, 0.1, half - 0.55], 'axis', { dy: 0 });
    return { wx, half };
  }

  // Three boards behind the track, x–t on top, then v–t, then a–t.
  // The a–t range is symmetric about 0 and covers every acceleration drawn (at least ±3 m/s²).
  function boards(half, tEnd, xr, vr, accels) {
    const width = 21, h = 4.3, gap = 0.35, z = -half - 0.8, x0 = -width / 2, base = 0.6;
    const am = Math.max(3, ...accels.map(Math.abs)), ar = niceRange(-am, am, { target: 3 });
    const top = base + 3 * h + 2 * gap;
    for (const x of [x0 - 0.22, x0 + width + 0.22]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.09, 0.11, top + 1.45, 20), stage.lit(0x8c9ca9, 0.6, 0.3), [x, (top - 1.45) / 2, z + 0.07]);
    const mk = (row, r, title) => graphBoard(stage, { origin: [x0, base + row * (h + gap), z], width, height: h, t: [0, tEnd], y: [r.min, r.max], yStep: r.step, yTitle: title });
    return { x: mk(2, xr, '<i>x</i> (m)'), v: mk(1, vr, '<i>v</i> (m/s)'), a: mk(0, ar, '<i>a</i> (m/s²)'), top };
  }

  // A car with a ring on the ruler below its middle, and optional velocity and acceleration arrows.
  function mover(lane, color, name, withArrows) {
    const body = car(stage, { length: 2.0, color }); stage.group.add(body);
    const ring = stage.ring(stage.group, [0, 0.03, 0], 0.24, 0x40546a, 0.03);
    const tag = name ? stage.label(name, [0, 1.2, lane], 'tag', { dy: -6 }) : null;
    const va = withArrows ? stage.arrow(COL.v, { radius: 0.07 }) : null, aa = withArrows ? stage.arrow(COL.a, { radius: 0.07 }) : null;
    const vl = withArrows ? stage.label('<i>v</i>', [0, 0, 0], 'axis', { dy: 0 }) : null, al = withArrows ? stage.label('<i>a</i>', [0, 0, 0], 'axis', { dy: 0 }) : null;
    return {
      place(X, ringZ, v, a) {
        body.position.set(X, 0, lane); ring.position.set(X, 0.03, ringZ);
        if (tag) tag.move([X, 1.25, lane]);
        if (!withArrows) return;
        const lv = Math.abs(v) * 0.13, la = Math.abs(a) * 0.6;
        va.update([X, 1.45, lane], [Math.sign(v) || 1, 0, 0], lv); aa.update([X, 2.05, lane], [Math.sign(a) || 1, 0, 0], la);
        vl.node.dataset.off = lv > 0.05 ? '' : '1'; al.node.dataset.off = la > 0.05 ? '' : '1';
        vl.move([X + Math.sign(v) * (lv + 0.35), 1.45, lane]); al.move([X + Math.sign(a) * (la + 0.35), 2.05, lane]);
      },
    };
  }

  function home(top) {
    stage.setHome({ target: [0, top * 0.45, -1.4], direction: [0, 0.26, 1], distance: top * 2.05 + 2, minDistance: 10, maxDistance: 70 });
  }

  // ---------------- graphs and meet ----------------
  function buildMotion(p) {
    const meet = p.activity === 'meet', A = M.carA(p), B = M.carB(p);
    const xs = [...M.xRange(A), ...(meet ? M.xRange(B) : [])], vs = [...M.vRange(A), ...(meet ? M.vRange(B) : [])];
    const xr = niceRange(Math.min(...xs), Math.max(...xs), { target: 3, minSpan: 10 });
    const vr = niceRange(Math.min(...vs), Math.max(...vs), { target: 3, minSpan: 4 });
    const { wx, half } = track(xr.min, xr.max, xr.step, meet ? 2 : 1);
    const gb = boards(half, M.T, xr, vr, meet ? [A.a, B.a] : [A.a]);
    const lanes = meet ? [-0.95, 0.95] : [0];
    const ringZ = half - 0.85;
    const movers = [mover(lanes[0], 0xdfe5ea, meet ? 'A' : '', p.arrows)];
    if (meet) movers.push(mover(lanes[1], 0x75879a, 'B', p.arrows));
    const fA = t => M.stateAt(A, t), fB = t => M.stateAt(B, t);
    const curves = [];
    for (const [k, col] of [['x', COL.x], ['v', COL.v], ['a', COL.a]]) {
      // Current value beside the dot (graphs activity only, the meet boards carry two cars).
      const unit = { x: 'm', v: 'm/s', a: 'm/s²' }[k];
      curves.push(gb[k].curve(t => fA(t)[k], { color: col, tag: meet ? null : y => `${fmt(y, { zero: 1e-9 })} ${unit}` }));
      if (meet) curves.push(gb[k].curve(t => fB(t)[k], { color: col, dotted: true }));
    }

    if (meet) {
      const marks = [];
      const box = quizBox(ctx.panel, '예측');
      box.text('두 자동차가 처음 만나는 시각 <i>t</i>는? 재생하기 전에 적어 보자.');
      const input = box.answer({ label: '처음 만나는 시각', unit: 's', placeholder: '예 4.5', onEnter: () => check() });
      const none = box.check(`${M.T} s 안에 만나지 않는다`);
      const check = () => {
        const r = M.checkMeet(p, input.value, none.checked);
        const at = t => `<i>t</i> = ${fmt(t)} s, <i>x</i> = ${fmt(fA(t).x, { zero: 1e-9 })} m`;
        const first = r.roots.length ? `처음 만나는 때는 ${at(r.roots[0])}이다.` : `두 자동차는 ${M.T} s 안에 만나지 않는다.`;
        const again = r.roots.length > 1 ? ` ${at(r.roots[1])}에 다시 만난다.` : '';
        const msg = {
          null: `맞다. ${first}${again}`,
          second: `그것은 두 번째로 만나는 시각이다. ${first}`,
          value: `<i>x</i>–<i>t</i> 판에서 두 곡선이 만나는 곳을 보자. ${first}${again}`,
          none: first, meets: `만난다. ${first}${again}`, unreadable: '숫자로 적자. 예 4.5',
        }[String(r.reason)];
        box.feedback(r.ok, msg);
        if (r.reason === 'unreadable' || marks.length) return;
        r.roots.forEach((t, i) => {
          marks.push(gb.x.mark(t, fA(t).x));
          // First meeting label above the curve, second below, so the two never overlap.
          stage.label(`만남 <i>t</i> = ${fmt(t)} s`, gb.x.at(t, fA(t).x), 'tag', { dy: i === 0 ? -22 : 22, priority: 2 });
        });
      };
      box.buttons([{ label: '확인', primary: true, onClick: check }]);
    }

    cur = {
      render(o) {
        movers[0].place(wx(o.x), ringZ, o.v, o.a);
        if (meet) movers[1].place(wx(o.B.x), ringZ, o.B.v, o.B.a);
        for (const k of ['x', 'v', 'a']) gb[k].setTime(o.t);
      },
    };
    home(gb.top);
    const legend = [{ label: '위치 (position)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' }];
    if (meet) legend.push({ label: '실선 A · 점선 B', color: '#75879a' });
    return { legend };
  }

  // ---------------- missing quantity ----------------
  function buildMissing() {
    const q = M.question(qIndex), c = { x0: 0, v0: q.values.v0, a: q.values.a };
    const tEnd = Math.ceil(q.t);
    const xr = niceRange(...M.xRange(c, tEnd), { target: 3, minSpan: 10 });
    const vr = niceRange(...M.vRange(c, tEnd), { target: 3, minSpan: 4 });
    const { wx, half } = track(xr.min, xr.max, xr.step, 1);
    const gb = boards(half, tEnd, xr, vr, [c.a]);
    const m = mover(0, 0xdfe5ea, '', false);
    m.place(wx(0), half - 0.85, 0, 0);
    const startTag = stage.label('<i>t</i> = 0', [wx(0), 1.2, 0], 'tag', { dy: -6 });

    const box = quizBox(ctx.panel, `문제 ${(qIndex % M.QCOUNT) + 1} / ${M.QCOUNT}`);
    const line = k => ctx.tex(`${M.QTEX[k]} = ${N(q.values[k])}\\ ${UNIT_TEX[M.QUNIT[k]]}`);
    box.text(`<div class="given">알려진 양<br>${q.given.map(line).join('<br>')}</div>구할 양 ${ctx.tex(M.QTEX[q.ask])} <small>${M.QNAME[q.ask]}</small>${q.note ? `<br><small>${q.note}</small>` : ''}`);
    const pick = box.choices('① 쓸 식 (Table 2.4.1)', M.EQUATIONS.map(e => ({ value: e.no, html: `${ctx.tex(e.tex)} <small>(${e.no})</small>` })));
    const input = box.answer({ label: '② 구한 값', unit: M.QUNIT[q.ask], placeholder: '예 12.5', onEnter: () => check() });
    let shown = false;
    const reveal = () => {
      if (shown) return; shown = true;
      for (const [k, col] of [['x', COL.x], ['v', COL.v], ['a', COL.a]]) gb[k].curve(t => M.stateAt(c, Math.min(t, q.t))[k], { color: col, dot: false }).update(q.t);
      for (const k of ['x', 'v', 'a']) gb[k].setTime(q.t);
      const end = M.stateAt(c, q.t);
      m.place(wx(end.x), half - 0.85, end.v, end.a);
      startTag.move([wx(0), 0.35, 0]);
      stage.ring(stage.group, [wx(0), 0.03, half - 0.85], 0.24, 0x9aa9b5, 0.03);
      stage.label(`<i>t</i> = ${fmt(q.t)} s`, [wx(end.x), 1.2, 0], 'tag', { dy: -6 });
    };
    const check = () => {
      const eq = pick();
      if (!eq) { box.feedback(null, '먼저 ① 쓸 식을 고르자.'); return; }
      const r = M.checkMissing(q, eq, input.value);
      if (r.reason === 'unreadable') { box.feedback(false, '숫자로 적자. 예 −2.5'); return; }
      const e = M.EQUATIONS.find(x => x.no === q.equation);
      const sol = `${ctx.tex(e.tex)} (${e.no})<br>${ctx.tex(`${M.QTEX[q.ask]} = ${N(q.answer)}\\ ${UNIT_TEX[M.QUNIT[q.ask]]}`)}`;
      const parts = [];
      if (!r.eqOk) parts.push(`빠진 양은 ${ctx.tex(M.QTEX[q.missing])}이다. 그 양이 없는 식은 (${q.equation})이다.`);
      if (!r.valueOk) parts.push(r.reason === 'sign' ? '부호를 다시 보자. +<i>x</i> 방향이 양(+)이다.' : '값을 다시 계산해 보자.');
      box.feedback(r.ok, (r.ok ? '맞다.' : parts.join(' ')) + `<br>${sol}`);
      reveal();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }, { label: '새 문제', onClick: () => { qIndex += 1; ctx.rebuild(); } }]);
    cur = { render() {} };
    home(gb.top);
    return { legend: [{ label: '위치 (position)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' }] };
  }

  return {
    build(p) {
      cur = null;
      return p.activity === 'missing' ? buildMissing(p) : buildMotion(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
