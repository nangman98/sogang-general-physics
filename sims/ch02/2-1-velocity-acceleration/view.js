// 2.1–2.3 Average velocity, instantaneous velocity, acceleration — 3D view.
// Measuring board as the x axis with a car, and x–t (top) and v–t (bottom) boards behind it.
// Track, boards and car follow sims/ch02/2-2-constant-acceleration/view.js. Secant, tangent and trace come from ./boardlines.js.
import { fmt, fmtFixed } from '../../../core/format.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { car } from '../../../core/models3d.js';
import { quizBox } from '../../../core/quiz.js';
import { boardLines } from './boardlines.js';
import * as M from './model.js';

const COL = { x: 0x000000, v: 0x0072b2, a: 0xcc79a7, mark: 0x40546a, leg: 0x7d94a8 };
const W = 20;                                     // world length of the track
const MARK = ['1', '2', '3', '4'];                // tags on the boards; the quiz calls them 1번, 2번, …
const VAVG = '<i>v</i><sub>avg</sub>', AAVG = '<i>a</i><sub>avg</sub>';
const z9 = { zero: 1e-9 };
const LEGEND = [{ label: '위치 (position)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' }];

export function view(stage, ctx) {
  const { THREE } = stage;
  let cur = null;
  const memo = {};                                // estimate answers kept across rebuilds (key: motion, board, t1)

  // Measuring board covering physical x in [lo, hi]. Returns the map from x (m) to world x (same as 2-2).
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

  // x–t board on top, v–t board below, one shared time axis.
  function boards(half, xr, vr) {
    const width = 21, h = 5.2, gap = 0.4, z = -half - 0.8, x0 = -width / 2, base = 1.5;
    const top = base + 2 * h + gap;
    for (const x of [x0 - 0.22, x0 + width + 0.22]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.09, 0.11, top + 1.45, 20), stage.lit(0x8c9ca9, 0.6, 0.3), [x, (top - 1.45) / 2, z + 0.07]);
    const mk = (row, r, title) => graphBoard(stage, { origin: [x0, base + row * (h + gap), z], width, height: h, t: [0, M.T], y: [r.min, r.max], yStep: r.step, yTitle: title });
    const b = { x: mk(1, xr, '<i>x</i> (m)'), v: mk(0, vr, '<i>v</i> (m/s)'), top };
    return b;
  }

  // Car with a ring on the ruler below its middle and optional velocity and acceleration arrows (as 2-2).
  function mover(color, name, withArrows, opacity = 1) {
    const body = car(stage, { length: 2.0, color }); stage.group.add(body);
    if (opacity < 1) body.traverse(o => { if (o.material) for (const mt of [].concat(o.material)) { mt.transparent = true; mt.opacity = opacity; mt.depthWrite = false; } });
    const ring = stage.ring(stage.group, [0, 0.03, 0], 0.24, COL.mark, 0.03);
    const tag = name ? stage.label(name, [0, 1.2, 0], 'tag', { dy: -6 }) : null;
    const va = withArrows ? stage.arrow(COL.v, { radius: 0.07 }) : null, aa = withArrows ? stage.arrow(COL.a, { radius: 0.07 }) : null;
    const vl = withArrows ? stage.label('<i>v</i>', [0, 0, 0], 'axis', { dy: 0 }) : null, al = withArrows ? stage.label('<i>a</i>', [0, 0, 0], 'axis', { dy: 0 }) : null;
    return {
      place(X, ringZ, v, a) {
        body.position.set(X, 0, 0); ring.position.set(X, 0.03, ringZ);
        if (tag) tag.move([X, 1.25, 0]);
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
  function scene(m) {
    const xr = pad(niceRange(...M.range(m.x), { target: 3, minSpan: 10 }));
    const vr = pad(niceRange(...M.range(m.v), { target: 3, minSpan: 4 }));
    const { wx, half } = track(xr.min, xr.max, xr.step);
    const gb = boards(half, xr, vr);
    stage.setHome({ target: [0, gb.top * 0.5, -1.4], direction: [0, 0.24, 1], distance: gb.top * 2.2 + 4, minDistance: 10, maxDistance: 70 });
    return { wx, half, gb, ringZ: half - 0.85 };
  }

  // Tag next to a board point: below it in the upper half of the board, above it in the lower half (keeps tick rows clear).
  function tagAt(board, t, y, html, priority = 1) {
    const [y0, y1] = board.range.y;
    return stage.label(html, board.at(t, y), 'tag', { dy: y > (y0 + y1) / 2 ? 22 : -22, priority });
  }

  // Radio choices laid out in one row (core/quiz.js stacks them).
  function row(box, cols) {
    const fs = box.box.querySelectorAll('fieldset');
    const f = fs[fs.length - 1];
    f.style.display = 'grid'; f.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`; f.style.columnGap = '6px';
  }

  // ---------------- secant: average to instantaneous ----------------
  function buildSecant(p) {
    const m = M.motionOf(p), q = p.board, S = scene(m), { gb } = S;
    const main = gb[q], other = gb[q === 'v' ? 'x' : 'v'];
    const fq = q === 'v' ? m.v : m.x, slopeCol = q === 'v' ? COL.a : COL.v;
    main.setTime(p.t1); other.setTime(p.t1);
    main.curve(fq, { color: q === 'v' ? COL.v : COL.x, dot: false }).update(M.T);
    let otherCurve = null;
    const showOther = () => { if (!otherCurve) { otherCurve = other.curve(q === 'v' ? m.x : m.v, { color: q === 'v' ? COL.x : COL.v, dot: false }); otherCurve.update(M.T); } };
    if (q === 'v') showOther();                     // x–t does not give a directly; v–t would give v, so it waits
    const wait = q === 'x' ? stage.label('확인하면 <i>v</i>–<i>t</i> 곡선이 나타난다', other.at((M.T) / 2, (other.range.y[0] + other.range.y[1]) / 2), 'station', { dy: 0 }) : null;

    const L = boardLines(stage, main), s = M.secant(m, p.t1, p.dt, q);
    const sec = L.segment(slopeCol, { radius: 0.04 });
    const end = sec.through(s.t1, s.y1, s.slope, s.t1 - 0.8, s.t2 + 0.8);
    const run = L.segment(COL.leg, { radius: 0.022, dashed: true, dash: 0.16, gap: 0.12 }), rise = L.segment(COL.leg, { radius: 0.022, dashed: true, dash: 0.16, gap: 0.12 });
    run.set(s.t1, s.y1, s.t2, s.y1); rise.set(s.t2, s.y1, s.t2, s.y2);
    const Pd = L.dot(COL.mark, 0.13), Qd = L.dot(COL.mark, 0.13);
    Pd.place(s.t1, s.y1); Qd.place(s.t2, s.y2);
    tagAt(main, s.t1, s.y1, 'P'); tagAt(main, s.t2, s.y2, 'Q');
    const yname = q === 'v' ? '<i>v</i>' : '<i>x</i>';
    if (p.dt >= 0.6) {
      stage.label('Δ<i>t</i>', main.at((s.t1 + s.t2) / 2, s.y1), 'gtitle', { dy: 14 });
      if (Math.abs(s.dy) > 1e-6) stage.label(`Δ${yname}`, main.at(s.t2, (s.y1 + s.y2) / 2), 'gtitle', { dy: 0 });
    }
    const unit = q === 'v' ? 'm/s²' : 'm/s';
    // Slope values sit in the board's top margin, right of the axis title, so they never cover the curve or P and Q.
    const margin = f => [main.X(M.T * f), main.Y(main.range.y[1]) + 0.33, main.Z];
    if (end) stage.label(`할선 (실선) ${q === 'v' ? AAVG : VAVG} = ${fmt(s.slope, z9)} ${unit}`, margin(0.42), 'tag', { dy: 0, priority: 2 });

    // Tangent and the hidden board appear once the estimate is checked right or the answer is asked for.
    const tan = L.segment(slopeCol, { radius: 0.03, dashed: true });
    tan.hide();
    let revealed = false;
    const reveal = () => {
      if (revealed) return; revealed = true;
      const r = tan.through(s.t1, s.y1, s.tangent, s.t1 - 1.6, s.t1 + 1.6);
      if (r) stage.label(`접선 (점선) ${q === 'v' ? '<i>a</i>' : '<i>v</i>'} = ${fmt(s.tangent, z9)} ${unit}`, margin(0.78), 'tag', { dy: 0, priority: 2 });
      showOther();
      if (wait) wait.node.dataset.off = '1';
      if (q === 'x') other.mark(s.t1, m.v(s.t1));
    };

    // Two cars: solid at t1, faint at t2, displacement arrow between them.
    const A = mover(0xdfe5ea, '<i>t</i><sub>1</sub>', p.arrows), B = mover(0xdfe5ea, '<i>t</i><sub>2</sub>', p.arrows, 0.38);
    const k1 = M.kin(m, s.t1), k2 = M.kin(m, s.t2);
    A.place(S.wx(k1.x), S.ringZ, k1.v, k1.a); B.place(S.wx(k2.x), S.ringZ, k2.v, k2.a);
    const dX = S.wx(k2.x) - S.wx(k1.x);
    if (Math.abs(dX) > 0.3) {
      stage.arrow(COL.x, { radius: 0.05 }).update([S.wx(k1.x), 0.25, S.half - 1.45], [Math.sign(dX), 0, 0], Math.abs(dX));
      stage.label('Δ<i>x</i>', [(S.wx(k1.x) + S.wx(k2.x)) / 2, 0.3, S.half - 1.45], 'axis', { dy: -14 });
    }

    // Prediction: read the limit of the secant slope.
    const key = `${p.motion}|${q}|${p.t1}`, saved = memo[key] ?? (memo[key] = { text: '', fb: null, shown: false });
    const what = q === 'v' ? '가속도 (acceleration) <i>a</i>' : '순간 속도 (instantaneous velocity) <i>v</i>';
    const box = quizBox(ctx.panel, '예측');
    box.text(`<i>t</i><sub>1</sub> = ${fmt(p.t1)} s에서 ${what}는? Δ<i>t</i>를 줄여 가며 ${q === 'v' ? AAVG : VAVG}가 다가가는 값을 적는다.`);
    const input = box.answer({ label: q === 'v' ? '가속도' : '순간 속도', unit, placeholder: '예 2.5', onEnter: () => check() });
    input.value = saved.text;
    input.addEventListener('input', () => { saved.text = input.value; });
    const say = (ok, html) => { saved.fb = { ok, html }; box.feedback(ok, html); };
    const show = () => { saved.shown = true; reveal(); };
    const lim = `Δ<i>t</i> → 0에서 ${q === 'v' ? AAVG : VAVG} → ${q === 'v' ? '<i>a</i>' : '<i>v</i>'} = ${fmt(s.tangent, z9)} ${unit} (식 ${q === 'v' ? '2.3.2' : '2.2.1'})`;
    const check = () => {
      const r = M.checkEstimate(m, p.t1, p.dt, q, input.value);
      const msg = {
        null: `맞다. ${lim}. 점선이 P에서의 접선이다.`,
        unreadable: '숫자로 적자. 예 −2.5',
        sign: s.tangent > 0 ? '부호를 다시 보자. P에서 곡선이 오른쪽으로 올라가므로 기울기는 양(+)이다.' : '부호를 다시 보자. P에서 곡선이 오른쪽으로 내려가므로 기울기는 음(−)이다.',
        secant: `그 값은 Δ<i>t</i> = ${fmt(p.dt)} s일 때의 ${q === 'v' ? AAVG : VAVG}다. Δ<i>t</i>를 더 줄여 보자.`,
        ratio: `그 값은 ${yname}<sub>1</sub>/<i>t</i><sub>1</sub>이다. 기울기는 ${yname}의 변화 Δ${yname}를 Δ<i>t</i>로 나눈 값이다.`,
        height: `그 값은 <i>t</i><sub>1</sub>에서의 ${yname}, 곧 판의 높이다. 구할 것은 기울기다.`,
        value: `Δ<i>t</i>를 0.05 s 이하로 줄이고 ${q === 'v' ? AAVG : VAVG}를 다시 읽어 보자.`,
      }[String(r.reason)];
      say(r.ok, msg);
      if (r.ok) show();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }, { label: '답 보기', onClick: () => { say(null, lim + '.'); show(); } }]);
    if (saved.fb) box.feedback(saved.fb.ok, saved.fb.html);
    if (saved.shown) reveal();

    cur = { render() {} };
    return { legend: LEGEND };
  }

  // ---------------- slope: tangent slopes become the next graph ----------------
  function buildSlope(p) {
    const m = M.motionOf(p), S = scene(m), { gb } = S;
    const cx = gb.x.curve(m.x, { color: COL.x });
    const Lx = boardLines(stage, gb.x), Lv = boardLines(stage, gb.v);
    const tx = Lx.segment(COL.v, { radius: 0.04 }), tv = Lv.segment(COL.a, { radius: 0.04 });
    const vTrace = Lv.trace(m.v, COL.v);
    const xTag = stage.label('', [0, 0, 0], 'tag', { dy: -16, priority: 2 }), vTag = stage.label('', [0, 0, 0], 'tag', { dy: -16, priority: 2 });
    m.marks.forEach((t, i) => {
      gb.x.mark(t, m.x(t));
      tagAt(gb.x, t, m.x(t), MARK[i]);
    });
    const mv = mover(0xdfe5ea, '', p.arrows);

    const box = quizBox(ctx.panel, '예측');
    box.text('표시한 세 시각에서 속도 <i>v</i>의 부호는? 재생하기 전에 <i>x</i>–<i>t</i> 곡선의 기울기를 보고 고른다.');
    const picks = m.marks.map((t, i) => {
      const g = box.choices(`${MARK[i]}번 <i>t</i> = ${fmt(t)} s`, [{ value: '+', html: '<i>v</i> > 0' }, { value: '0', html: '<i>v</i> = 0' }, { value: '-', html: '<i>v</i> < 0' }]);
      row(box, 3); return g;
    });
    let marked = false;
    const check = () => {
      const r = M.checkSigns(m, picks.map(g => g()));
      if (!r.complete) { box.feedback(null, '세 시각 모두 고르자.'); return; }
      const word = { '+': '<i>v</i> > 0', '0': '<i>v</i> = 0', '-': '<i>v</i> < 0' };
      const why = { '+': '곡선이 오른쪽으로 올라간다', '0': '접선이 수평이다', '-': '곡선이 오른쪽으로 내려간다' };
      const wrong = r.items.map((it, i) => (it.ok ? '' : `${MARK[i]}번은 ${why[it.sign]}. ${word[it.sign]}이다.`)).filter(Boolean);
      box.feedback(r.ok, r.ok ? '맞다. <i>x</i>–<i>t</i> 곡선의 기울기 부호가 <i>v</i>의 부호다. 시간을 옮겨 <i>v</i>–<i>t</i> 판에서 확인하자.' : wrong.join(' '));
      if (marked) return; marked = true;
      r.items.forEach((it, i) => { gb.v.mark(it.t, it.v); tagAt(gb.v, it.t, it.v, MARK[i]); });
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);

    cur = {
      render(o) {
        mv.place(S.wx(o.x), S.ringZ, o.v, o.a);
        gb.x.setTime(o.t); gb.v.setTime(o.t); cx.update(o.t);
        vTrace.update(o.t);
        const rx = tx.through(o.t, o.x, o.v, o.t - 1.2, o.t + 1.2), rv = tv.through(o.t, o.v, o.a, o.t - 1.2, o.t + 1.2);
        if (rx) { xTag.set(`기울기 = <i>v</i> = ${fmt(o.v, z9)} m/s`); xTag.move(gb.x.at(rx[1], o.x + o.v * (rx[1] - o.t))); }
        if (rv) { vTag.set(`기울기 = <i>a</i> = ${fmt(o.a, z9)} m/s²`); vTag.move(gb.v.at(rv[1], o.v + o.a * (rv[1] - o.t))); }
        xTag.node.dataset.off = rx ? '' : '1'; vTag.node.dataset.off = rv ? '' : '1';
      },
    };
    return { legend: LEGEND };
  }

  // ---------------- speed: signs of v and a ----------------
  function buildSpeed(p) {
    const m = M.motionOf(p), S = scene(m), { gb } = S;
    const cx = gb.x.curve(m.x, { color: COL.x }), cv = gb.v.curve(m.v, { color: COL.v });
    const Lv = boardLines(stage, gb.v);
    M.SPEED_TIMES.forEach((t, i) => {
      gb.x.mark(t, m.x(t)); gb.v.mark(t, m.v(t));
      tagAt(gb.x, t, m.x(t), MARK[i]); tagAt(gb.v, t, m.v(t), MARK[i]);
      Lv.segment(COL.a, { radius: 0.035 }).through(t, m.v(t), m.a(t), t - 0.55, t + 0.55);
    });
    const mv = mover(0xdfe5ea, '', p.arrows);

    const box = quizBox(ctx.panel, '예측');
    box.text('네 시각에서 속력 (speed) |<i>v</i>|는 커지는가, 작아지는가? <i>v</i>–<i>t</i> 판의 짧은 선은 그 시각의 접선이고 기울기가 <i>a</i>다.');
    const sg = y => (y > 0 ? '> 0' : '< 0');
    const picks = M.SPEED_TIMES.map((t, i) => {
      const g = box.choices(`${MARK[i]}번 <i>t</i> = ${fmt(t)} s · <i>v</i> ${sg(m.v(t))}, <i>a</i> ${sg(m.a(t))}`, [{ value: 'up', html: '커진다' }, { value: 'down', html: '작아진다' }]);
      row(box, 2); return g;
    });
    const check = () => {
      const r = M.checkSpeed(picks.map(g => g()), m);
      if (!r.complete) { box.feedback(null, '네 시각 모두 고르자.'); return; }
      const rule = '<i>v</i>와 <i>a</i>의 부호가 같으면 속력이 커지고 다르면 작아진다. 가속도의 부호는 방향을 나타낸다.';
      const wrong = r.items.map((it, i) => (it.ok ? '' : MARK[i] + '번')).filter(Boolean).join(', ');
      const msg = r.ok ? `맞다. ${rule}`
        : r.pattern === 'a-sign' ? `<i>a</i>의 부호만 보고 골랐다. 2번은 <i>a</i> < 0이지만 <i>v</i> < 0이라 속력이 커진다. 3번은 <i>a</i> > 0이지만 <i>v</i> < 0이라 속력이 작아진다. ${rule}`
          : r.pattern === 'v-sign' ? `<i>v</i>의 부호만 보고 골랐다. 1번은 <i>v</i> > 0이지만 <i>a</i> < 0이라 속력이 작아진다. 2번은 <i>v</i> < 0이지만 <i>a</i>도 음(−)이라 속력이 커진다. ${rule}`
            : `${wrong}을 다시 보자. ${rule}`;
      box.feedback(r.ok, msg);
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);

    cur = {
      render(o) {
        mv.place(S.wx(o.x), S.ringZ, o.v, o.a);
        gb.x.setTime(o.t); gb.v.setTime(o.t); cx.update(o.t); cv.update(o.t);
      },
    };
    return { legend: LEGEND };
  }

  return {
    build(p) {
      cur = null;
      return p.activity === 'secant' ? buildSecant(p) : p.activity === 'slope' ? buildSlope(p) : buildSpeed(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
