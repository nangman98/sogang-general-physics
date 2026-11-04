// 3.3 Multiplying Vectors — 3D view. Same glass xy panel and measuring board as 3-1 (textbook Fig. 3.2.1 axes).
// dot: a and b, the angle ϕ, the perpendicular dropped from one head onto the other vector's line, and that component.
// cross: a and b with the plane they span, the sweep from a to b, four choices for the direction of a × b,
//   then a right hand curls from a to b and c = a × b grows along the thumb (drawn at half length).
// practice: one question at a time, the answer is drawn after checking.
import { fmt, texNum as N } from '../../../core/format.js';
import { tex } from '../../../core/math.js';
import { quizBox } from '../../../core/quiz.js';
import { vectorKit, HEX, CSS, UNIT, unitVectorTex } from './vectors3d.js';
import { rightHand } from './objects3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { C_SCALE } from './spec.js';
import * as M from './model.js';

const CIRCLED = ['①', '②', '③', '④'];
const PURPLE = 0xcc79a7;
const ease = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const deg = x => `${fmt(x, { zero: 1e-9 })}°`;

export function view(stage, ctx) {
  const K = vectorKit(stage);
  const { THREE } = stage;
  let cur = null, qIndex = 0, anim = null;
  stage.onFrame(dt => { if (anim) anim(dt); });

  // wide: the angle graph stands right of the panel, so the camera looks between the two.
  function home(L, wide = false) {
    const t = wide ? [0.95 * L, -0.02 * L, 0.1 * L] : [0.1 * L, -0.02 * L, 0.1 * L];
    stage.setHome({ target: t, direction: wide ? [0.32, 0.3, 1] : [0.6, 0.34, 1], distance: 3.35 * (L + 1.3) * (wide ? 1.32 : 1), minDistance: L * 1.3, maxDistance: L * 9 });
  }
  // Product against the angle between the vectors (as in the department's earlier dot/cross lab): the whole curve for
  // the current magnitudes a and b, a dashed line at the current ϕ and the current value beside its point.
  function angleGraph(kind, a, b, L) {
    const ab = M.norm(a) * M.norm(b), phi = M.angleBetween(a, b);
    const f = kind === 'dot' ? x => ab * Math.cos(x * Math.PI / 180) : x => ab * Math.sin(x * Math.PI / 180);
    const yr = niceRange(kind === 'dot' ? -ab : 0, Math.max(ab, 1e-6), { target: 2, includeZero: true, minSpan: 2 });
    const g = graphBoard(stage, { origin: [1.35 * L, -0.75 * L, 0], width: 2.2 * L, height: 1.5 * L, t: [0, 180], tStep: 45, y: [yr.min, yr.max], yStep: yr.step,
      tTitle: '<i>ϕ</i> (°)', yTitle: kind === 'dot' ? tex('\\vec a\\cdot\\vec b') : tex('|\\vec a\\times\\vec b|') });
    const c = g.curve(f, { color: kind === 'dot' ? 0x1a1a1a : HEX.c, dot: false });
    g.setTime(phi); c.update(180);
    g.mark(phi, f(phi));
    stage.label(`${fmt(f(phi), { zero: 1e-9 })}`, g.at(phi, f(phi)), 'gval', { dy: f(phi) > (yr.min + yr.max) / 2 ? 18 : -18, priority: 3 });
  }
  // Panel size follows the vectors (whole numbers, set again only when a control changes).
  function frameFor(vs) {
    const m = Math.max(...vs.flat().map(Math.abs));
    const L = Math.min(7, Math.max(4, Math.ceil(m + 0.6)));
    K.frame(L, { units: false, labelEvery: L >= 6 ? 2 : 1 });
    home(L);
    return L;
  }
  function vector(v, color, name, { origin = [0, 0, 0], radius = 0.075, opacity = 1, priority = 6, off = 0.5 } = {}) {
    const ar = K.arrow(color, { radius, opacity }); ar.set(origin, v);
    const n = M.norm(v);
    if (!name || n < 1e-9) return { ar, lab: null };
    const u = M.scale(v, 1 / n);
    return { ar, lab: K.label(name, M.add(M.add(origin, v), [u[0] * off, u[1] * off + 0.25, u[2] * off]), { priority }) };
  }
  // Arc for ϕ in the plane of a and b, from a toward b through the smaller angle.
  function phiArc(a, b, { head = false, text = '\\phi', priority = 5 } = {}) {
    if (M.norm(a) < 1e-9 || M.norm(b) < 1e-9 || M.parallel(a, b)) return null;
    const u = M.unit(a), w = M.unit(M.sub(b, M.scale(u, M.dot(b, u)))), f = M.angleBetween(a, b) * M.DEG;
    const r = Math.min(1.6, Math.max(0.8, 0.4 * Math.min(M.norm(a), M.norm(b))));
    const arc = K.arc([0, 0, 0], u, w, f, r, HEX.angle, { head, radius: 0.024 });
    if (arc && text) K.label(text, arc.at(f / 2).multiplyScalar((r + 0.5) / r).toArray(), { priority });
    return arc;
  }
  // Bar along a line (the component of one vector along another), with no head.
  function bar(p0, p1, color, { radius = 0.13, opacity = 0.42 } = {}) {
    const d = new THREE.Vector3(...M.sub(p1, p0)), n = d.length();
    if (n < 1e-6) return null;
    const m = stage.mesh(stage.group, new THREE.CylinderGeometry(radius, radius, n, 18), stage.flat(color, { transparent: true, opacity, depthWrite: false }), M.scale(M.add(p0, p1), 0.5), [0, 0, 0], false);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return m;
  }
  // Component of `from` along `onto`, the dropped perpendicular and its right-angle mark.
  function component(onto, from, color, name, { priority = 5 } = {}) {
    if (M.norm(onto) < 1e-9 || M.norm(from) < 1e-9) return;
    const { comp, foot } = M.along(onto, from), u = M.unit(onto), n = M.norm(onto);
    const up = M.sub(from, foot), off = M.scale(M.unit(up) ?? [0, 1, 0], 0.22);
    // The component is drawn as a bar beside the vector line (like a dimension line), so it does not hide inside the arrow.
    bar(off, M.add(foot, off), color, { radius: 0.06, opacity: 0.8 });
    K.guides([[from, foot]]);
    // Extend the line of `onto` when the foot lies behind the tail or past the head.
    if (comp < 0) K.guides([[[0, 0, 0], M.scale(u, comp - 0.4)]], HEX.angle);
    else if (comp > n) K.guides([[M.scale(u, n), M.scale(u, comp + 0.4)]], HEX.angle);
    if (M.norm(up) > 1e-6 && Math.abs(comp) > 1e-6) K.rightAngle(foot, M.scale(u, comp > 0 ? -1 : 1), M.unit(up), 0.26);
    const side = M.unit(M.sub([0, 0, 0], up)) ?? [0, -1, 0];
    K.label(`${name} = ${N(comp)}`, M.add(M.scale(foot, 0.5), M.scale(side, 0.55)), { kind: 'tag', priority });
  }
  // Right hand at the origin, fingers from a toward b, thumb along c (Fig. 3.3.2). Returns the hand, hidden until shown.
  function hand(a, c) {
    const h = rightHand(stage, { size: 2.0 });
    h.orient(M.unit(a), M.unit(c));
    h.visible = false;
    stage.group.add(h);
    return h;
  }
  // Reveal animation: the fingers curl, then c grows along the thumb.
  // Clock time, so a slow device shows the same 1.35 s animation with fewer frames.
  function play(h, grow, done = () => {}) {
    const t0 = performance.now();
    if (h) { h.visible = true; h.pose(0.2); }
    anim = () => {
      const t = (performance.now() - t0) / 1000;
      if (h) h.pose(0.2 + 0.8 * ease(t / 0.9));
      grow(ease((t - 0.5) / 0.8));
      if (t > 1.35) { anim = null; done(); }
      ctx.refresh();
    };
  }

  // ---------------- dot ----------------
  function buildDot(p) {
    const a = M.vectorA(p), b = M.vectorB(p);
    frameFor([a, b]);
    vector(a, HEX.a, '\\vec a'); vector(b, HEX.b, '\\vec b');
    phiArc(a, b);
    if (p.proj === 'b') component(a, b, HEX.b, 'b\\cos\\phi');
    else component(b, a, HEX.a, 'a\\cos\\phi');
    if (Math.abs(M.dot(a, b)) < 1e-9 && M.norm(a) > 1e-9 && M.norm(b) > 1e-9) K.rightAngle([0, 0, 0], M.unit(a), M.unit(b), 0.45);
    const L = Math.min(7, Math.max(4, Math.ceil(Math.max(...[a, b].flat().map(Math.abs)) + 0.6)));
    if (M.norm(a) > 1e-9 && M.norm(b) > 1e-9) { angleGraph('dot', a, b, L); home(L, true); }
    return { legend: [{ label: tex('\\vec a'), color: CSS.a }, { label: tex('\\vec b'), color: CSS.b }, { label: '방향 성분 (component)', color: p.proj === 'b' ? CSS.b : CSS.a }, { label: '단위 벡터 (unit vector)', color: CSS.unit }] };
  }

  // ---------------- cross ----------------
  function buildCross(p) {
    const a = M.vectorA(p), b = M.vectorB(p), c = M.cross(a, b), cs = M.scale(c, C_SCALE);
    const L = frameFor([a, b, cs]);
    vector(a, HEX.a, '\\vec a'); vector(b, HEX.b, '\\vec b');
    const choices = M.crossChoices(p);
    let h = null, cands = [];
    if (!choices.parallel) {
      const n = M.unit(c), R = 0.85 * Math.max(M.norm(a), M.norm(b));
      const disc = stage.mesh(stage.group, new THREE.CircleGeometry(R, 72), new THREE.MeshStandardMaterial({ color: 0x9fb0c0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }), [0, 0, 0], [0, 0, 0], false);
      disc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...n));
      disc.renderOrder = 2;
      const rim = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 96 }, (_, i) => new THREE.Vector3(R * Math.cos(i / 96 * 2 * Math.PI), R * Math.sin(i / 96 * 2 * Math.PI), 0))), new THREE.LineBasicMaterial({ color: 0x555555 }));
      rim.quaternion.copy(disc.quaternion); stage.group.add(rim);
      phiArc(a, b, { head: true });
      const len = Math.min(0.62 * L, 3.2);
      cands = choices.list.map(ch => {
        const ar = K.arrow(HEX.cand, { radius: 0.05, opacity: 0.85 }); ar.set([0, 0, 0], M.scale(ch.v, len));
        K.label(CIRCLED[+ch.label - 1], M.scale(ch.v, len + 0.5), { raw: true, kind: 'cand', priority: 5 });
        return { ...ch, ar };
      });
      h = hand(a, c);
    }
    const cAr = K.arrow(HEX.c, { radius: 0.09 }); cAr.hide();
    const ncs = M.norm(cs);
    const cLab = ncs > 1e-9 ? K.label('\\vec c = \\vec a\\times\\vec b', M.add(cs, M.scale(cs, 0.6 / ncs)), { priority: 7 }) : null;
    if (cLab) cLab.node.dataset.off = '1';
    const cRev = K.dashed(HEX.c, { radius: 0.06 }); cRev.hide();
    const rLab = p.reverse && ncs > 1e-9 ? K.label("\\vec c' = \\vec b\\times\\vec a", M.sub([0, 0, 0], M.add(cs, M.scale(cs, 0.6 / ncs))), { priority: 6 }) : null;
    if (rLab) rLab.node.dataset.off = '1';

    const box = quizBox(ctx.panel, '예측');
    box.text(`${tex('\\vec c = \\vec a\\times\\vec b')}는 어느 방향인가? 오른손 규칙 (right-hand rule)으로 먼저 고른다.`);
    const pick = box.choices('방향', [
      { value: 'rh1', html: '①' }, { value: 'rh2', html: '②' }, { value: 'rh3', html: '③' },
      { value: 'rh4', html: `④ ${tex('\\vec c = 0')} (평행 또는 반평행)` },
    ]);
    box.box.querySelector('fieldset.choices').classList.add('inline');
    let revealed = false;
    const check = () => {
      const r = M.checkCross(p, pick().replace('rh', ''));
      if (r.reason === 'none') { box.feedback(null, '먼저 하나를 고르자.'); return; }
      const phi = M.angleBetween(a, b);
      const msg = {
        null: choices.parallel ? `맞다. 두 벡터가 한 직선 위에 있어 sin <i>ϕ</i> = 0이므로 ${tex('\\vec a\\times\\vec b = 0')}이다.` : `맞다. 네 손가락을 ${tex('\\vec a')}에서 ${tex('\\vec b')}로 감으면 엄지가 ${tex('\\vec c')} 방향이다.`,
        opposite: `반대 방향이다. 그쪽은 ${tex('\\vec b\\times\\vec a = -(\\vec a\\times\\vec b)')}다. 손가락은 ${tex('\\vec a')}에서 ${tex('\\vec b')} 쪽으로 감는다.`,
        inPlane: `${tex('\\vec c')}는 두 벡터가 이루는 평면 안에 있지 않다. ${tex('\\vec a')}와 ${tex('\\vec b')}에 모두 수직이다.`,
        zero: `${tex('\\vec a\\times\\vec b = 0')}은 두 벡터가 평행 (parallel)하거나 반평행 (antiparallel)할 때뿐이다. 지금 <i>ϕ</i> = ${deg(phi)}다.`,
        parallel: `두 벡터가 한 직선 위에 있어 sin <i>ϕ</i> = 0이다. 그래서 ${tex('\\vec a\\times\\vec b = 0')}이다.`,
      }[String(r.reason)];
      const sol = choices.parallel ? '' : `<br>정답은 ${CIRCLED[+r.answer - 1]}이고 ${tex(`\\vec c = ${unitVectorTex(M.clean(c), N)}`)}, ${tex(`c = ${N(M.norm(c))}`)}이다.`;
      box.feedback(r.ok, msg + sol);
      if (revealed || choices.parallel) return;
      revealed = true;
      for (const ch of cands) if (ch.kind === 'right') ch.ar.hide();
      play(h, g => {
        if (g > 1e-3) cAr.set([0, 0, 0], M.scale(cs, g)); else cAr.hide();
        if (p.reverse) { if (g > 1e-3) cRev.set([0, 0, 0], M.scale(cs, -g)); else cRev.hide(); }
      }, () => { if (cLab) cLab.node.dataset.off = ''; if (rLab) rLab.node.dataset.off = ''; });
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    if (M.norm(a) > 1e-9 && M.norm(b) > 1e-9) { angleGraph('cross', a, b, L); home(L, true); }
    const legend = [{ label: tex('\\vec a'), color: CSS.a }, { label: tex('\\vec b'), color: CSS.b }, { label: `${tex('\\vec c')}, 길이 1/2`, color: CSS.c }, { label: '①–③ 후보', color: CSS.cand }];
    return { legend };
  }

  // ---------------- practice ----------------
  function buildPractice() {
    const q = M.question(qIndex);
    const box = quizBox(ctx.panel, `문제 ${(qIndex % M.QCOUNT) + 1} / ${M.QCOUNT}`);
    let grade = () => {}, shown = false;
    const once = fn => () => { if (!shown) { shown = true; fn(); } };
    const legend = [{ label: tex('\\vec a'), color: CSS.a }, { label: tex('\\vec b'), color: CSS.b }];
    const given = (...rows) => `<div class="given">알려진 양<br>${rows.join('<br>')}</div>`;
    const vt = (name, v) => tex(`\\vec ${name} = ${unitVectorTex(v, N)}`);
    const field = (sym, unit = '') => {
      const input = box.answer({ label: sym.replace(/[\\{}]/g, ''), unit, onEnter: () => grade() });
      const lab = document.createElement('span'); lab.className = 'field-label'; lab.innerHTML = tex(`${sym} =`);
      input.parentNode.prepend(lab); input.parentNode.classList.add('labeled');
      return input;
    };
    const inline = () => { const s = box.box.querySelectorAll('fieldset.choices'); s[s.length - 1].classList.add('inline'); };
    const showCross = (a, b) => {
      const c = M.cross(a, b), cs = M.scale(c, C_SCALE);
      if (M.norm(c) < 1e-9) return;
      const h = hand(a, c), ar = K.arrow(HEX.c, { radius: 0.09 }); ar.hide();
      const lab = K.label('\\vec c = \\vec a\\times\\vec b', M.add(cs, M.scale(M.unit(cs), 0.6)), { priority: 7 }); lab.node.dataset.off = '1';
      play(h, g => { if (g > 1e-3) ar.set([0, 0, 0], M.scale(cs, g)); else ar.hide(); }, () => { lab.node.dataset.off = ''; });
    };

    if (q.type === 'scalar') {
      frameFor([q.v, q.sv]);
      vector(q.v, HEX.a, '\\vec v');
      legend.splice(0, 2, { label: tex('\\vec v'), color: CSS.a }, { label: tex('s\\vec v'), color: '#cc79a7' });
      box.text(`${given(vt('v', q.v), tex(`s = ${q.s}`))}구할 양 ${tex('s\\vec v')}의 방향과 크기`);
      const pick = box.choices(`${tex('s\\vec v')}의 방향`, [{ value: 'sv:same', html: `${tex('\\vec v')}와 같은 방향` }, { value: 'sv:opposite', html: `${tex('\\vec v')}와 반대 방향` }]);
      const fm = field('|s\\vec v|');
      const reveal = once(() => vector(q.sv, PURPLE, 's\\vec v', { radius: 0.085 }));
      grade = () => {
        const ch = pick().split(':')[1] ?? '';
        const r = M.checkScalar(q, ch, fm.value);
        if (r.reason === 'none') { box.feedback(null, '먼저 방향을 고르자.'); return; }
        if (r.reason === 'unreadable') { box.feedback(false, '크기를 숫자로 적자. 예 4.5'); return; }
        const msg = { null: '맞다.', direction: '<i>s</i> < 0이면 방향이 반대가 된다.', noScale: `${tex('|\\vec v|')}만 구했다. 크기는 |<i>s</i>|배가 된다.`, mag: '크기는 |<i>s</i>|와 <i>v</i>의 곱이다.' }[String(r.reason)];
        box.feedback(r.ok, `${msg}<br>${tex(`s\\vec v = ${unitVectorTex(q.sv, N)}`)}, ${tex(`|s\\vec v| = |${q.s}|\\times ${N(M.norm(q.v))} = ${N(q.mag)}`)}`);
        reveal();
      };
    } else {
      frameFor([q.a, q.b, M.scale(q.c, C_SCALE)]);
      vector(q.a, HEX.a, '\\vec a'); vector(q.b, HEX.b, '\\vec b');
      if (q.type === 'unit') {
        legend.push({ label: `${tex('\\vec c')}, 길이 1/2`, color: CSS.c });
        box.text(`${given(vt('a', q.a), vt('b', q.b))}구할 양 ${tex('\\vec a\\times\\vec b')}의 방향`);
        const opts = [['+x', `+${UNIT.x}`], ['-x', `-${UNIT.x}`], ['+y', `+${UNIT.y}`], ['-y', `-${UNIT.y}`], ['+z', `+${UNIT.z}`], ['-z', `-${UNIT.z}`], ['0', '0']];
        const pick = box.choices('방향', opts.map(([v, h]) => ({ value: 'dir' + v, html: tex(h) }))); inline();
        const reveal = once(() => showCross(q.a, q.b));
        grade = () => {
          const r = M.checkUnit(q, pick().replace('dir', ''));
          if (r.reason === 'none') { box.feedback(null, '먼저 방향을 고르자.'); return; }
          const msg = {
            null: '맞다.',
            opposite: `축은 맞고 방향이 반대다. 네 손가락을 ${tex('\\vec a')}에서 ${tex('\\vec b')} 쪽으로 감는다. 순서를 바꾸면 ${tex('\\vec b\\times\\vec a = -(\\vec a\\times\\vec b)')}다.`,
            axis: `${tex('\\vec a\\times\\vec b')}는 ${tex('\\vec a')}와 ${tex('\\vec b')}에 모두 수직인 축을 따른다.`,
            zero: '두 벡터가 수직이므로 sin 90° = 1이다. 0이 아니다.',
            parallel: `두 벡터가 같은 축 위에 있어 ${tex('\\vec a\\times\\vec b = 0')}이다.`,
          }[String(r.reason)];
          box.feedback(r.ok, `${msg}<br>${tex(`\\vec a\\times\\vec b = ${unitVectorTex(q.c, N)}`)}`);
          reveal();
        };
      } else if (q.type === 'dot' || q.type === 'sign') {
        const isDot = q.type === 'dot';
        box.text(`${given(vt('a', q.a), vt('b', q.b))}구할 양 ${isDot ? `${tex('\\vec a\\cdot\\vec b')}와 사이 각 <i>ϕ</i>` : `${tex('\\vec a\\cdot\\vec b')}의 부호 <small>(장면을 돌려 보고 정한다)</small>`}`);
        let pick = null, fd = null, ff = null;
        if (isDot) { fd = field('\\vec a\\cdot\\vec b'); ff = field('\\phi', '°'); }
        else { pick = box.choices('부호', [['+', '+'], ['0', '0'], ['-', '−']].map(([v, h]) => ({ value: 'sg' + v, html: h }))); inline(); }
        const reveal = once(() => {
          phiArc(q.a, q.b, { text: `\\phi = ${N(q.phi)}^\\circ`, priority: 9 });
          component(q.a, q.b, HEX.b, 'b\\cos\\phi');
          if (Math.abs(q.d) < 1e-9) K.rightAngle([0, 0, 0], M.unit(q.a), M.unit(q.b), 0.45);
        });
        grade = () => {
          let r;
          if (isDot) {
            r = M.checkDot(q, [fd.value, ff.value]);
            if (r.reason === 'unreadable') { box.feedback(false, '두 칸 모두 숫자로 적자. 각은 도 단위다.'); return; }
          } else {
            r = M.checkSign(q, pick().replace('sg', ''));
            if (r.reason === 'none') { box.feedback(null, '먼저 부호를 고르자.'); return; }
          }
          const msg = {
            null: '맞다.',
            dot: '식 (3.3.4)로 성분끼리 곱해 더하자.',
            supplement: `${tex('\\cos\\phi')}의 부호를 다시 보자. 스칼라 곱이 ${q.d < 0 ? '음수면 ϕ > 90°' : '양수면 ϕ < 90°'}다.`,
            angle: `식 (3.3.1)에서 ${tex('\\cos\\phi = \\vec a\\cdot\\vec b/(ab)')}다.`,
            sign: '그림만으로는 각을 잘못 보기 쉽다. 성분으로 계산해 보자.',
          }[String(r.reason)];
          const sol = `${tex(`\\vec a\\cdot\\vec b = (${N(q.a[0])})(${N(q.b[0])}) + (${N(q.a[1])})(${N(q.b[1])}) + (${N(q.a[2])})(${N(q.b[2])}) = ${N(q.d)}`)}<br>${tex(`a = ${N(M.norm(q.a))},\\ b = ${N(M.norm(q.b))},\\ \\phi = ${N(q.phi)}^\\circ`)}`;
          box.feedback(r.ok, `${msg}<br>${sol}`);
          reveal();
        };
        legend.push({ label: '방향 성분 (component)', color: CSS.b });
      } else {
        legend.push({ label: `${tex('\\vec c')}, 길이 1/2`, color: CSS.c });
        box.text(`${given(vt('a', q.a), vt('b', q.b))}구할 양 ${tex('\\vec c = \\vec a\\times\\vec b')}의 성분`);
        const fs = ['x', 'y', 'z'].map(k => field(`c_${k}`));
        const reveal = once(() => showCross(q.a, q.b));
        grade = () => {
          const r = M.checkCrossComponents(q, fs.map(x => x.value));
          if (r.reason === 'unreadable') { box.feedback(false, '세 칸 모두 숫자로 적자. 성분이 0이면 0을 적는다.'); return; }
          const wrong = r.valueOk.map((ok, i) => (ok ? null : 'xyz'[i])).filter(Boolean);
          const msg = { null: '맞다.', reversed: `부호가 모두 반대다. ${tex('\\vec b\\times\\vec a')}를 구한 것이다 (3.3.6).`, value: `${wrong.map(k => tex(`c_${k}`)).join(', ')}를 식 (3.3.8)로 다시 계산해 보자.` }[String(r.reason)];
          const [ax, ay, az] = q.a.map(x => N(x)), [bx, by, bz] = q.b.map(x => N(x));
          const rows = [`c_x = (${ay})(${bz}) - (${by})(${az}) = ${N(q.c[0])}`, `c_y = (${az})(${bx}) - (${bz})(${ax}) = ${N(q.c[1])}`, `c_z = (${ax})(${by}) - (${bx})(${ay}) = ${N(q.c[2])}`];
          box.feedback(r.ok, `${msg}<br>${rows.map(x => tex(x)).join('<br>')}`);
          reveal();
        };
      }
    }
    box.buttons([{ label: '확인', primary: true, onClick: () => grade() }, { label: '새 문제', onClick: () => { qIndex += 1; ctx.rebuild(); } }]);
    legend.push({ label: '단위 벡터 (unit vector)', color: CSS.unit });
    return { legend };
  }

  return {
    build(p) {
      cur = null; anim = null;
      if (p.activity === 'cross') return buildCross(p);
      if (p.activity === 'practice') return buildPractice(p);
      return buildDot(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
