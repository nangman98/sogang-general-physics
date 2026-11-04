// 3.1–3.2 — 3D view. The xy plane is a glass panel standing on the measuring board (textbook Fig. 3.2.1 axes).
// components: a with dashed vector components on the axes, the box whose diagonal is a, θ, and rotated axes x′, y′.
// add: a and b tail to tail with three candidate arrows, then a drone flies a and b while b slides head to tail.
// practice: one question at a time, the answer is drawn in the scene after checking.
import { fmt, texNum as N } from '../../../core/format.js';
import { tex } from '../../../core/math.js';
import { quizBox } from '../../../core/quiz.js';
import { vectorKit, HEX, CSS, unitVectorTex } from './vectors3d.js';
import { drone } from './objects3d.js';
import * as M from './model.js';

const AX = ['x', 'y', 'z'];
const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const along = (k, s) => E[k].map(c => c * s);
const deg = x => `${fmt(x, { zero: 1e-9 })}°`;
const mTex = x => `${N(x)}\\ \\mathrm{m}`;
const CIRCLED = ['①', '②', '③'];
const QUAD = ['', '제1사분면', '제2사분면', '제3사분면', '제4사분면'];
function quadrant(t) {
  const a = ((t % 360) + 360) % 360;
  if ([0, 90, 180, 270, 360].some(q => Math.abs(a - q) < 1e-9)) return 0;
  return Math.floor(a / 90) + 1;
}
const signWord = x => (Math.abs(x) < 1e-9 ? '0' : x > 0 ? '양 (+)' : '음 (−)');

export function view(stage, ctx) {
  const K = vectorKit(stage);
  let cur = null, qIndex = 0;

  function home(L) {
    stage.setHome({ target: [0.1 * L, -0.02 * L, 0.1 * L], direction: [0.6, 0.34, 1], distance: 3.35 * (L + 1.3), minDistance: L * 1.3, maxDistance: L * 9 });
  }

  // Arrow from origin with its KaTeX name just past the head.
  function vector(v, color, name, { origin = [0, 0, 0], radius = 0.075, opacity = 1, priority = 6, off = 0.5 } = {}) {
    const ar = K.arrow(color, { radius, opacity }); ar.set(origin, v);
    const n = M.norm(v);
    if (!name || n < 1e-9) return { ar, lab: null };
    const u = M.scale(v, 1 / n), tip = M.add(origin, v);
    return { ar, lab: K.label(name, M.add(tip, [u[0] * off, u[1] * off + 0.25, u[2] * off]), { priority }) };
  }
  // Vector components on the axes (dashed), with value tags.
  function components(v, color, sym, { tags = true, priority = 4 } = {}) {
    // Each tag sits on the side away from the vector so the three tags do not collide.
    const sx = v[0] >= 0 ? 1 : -1, sy = v[1] >= 0 ? 1 : -1;
    const tagAt = [[v[0] / 2, -0.85 * sy, 0], [-1.35 * sx, v[1] / 2, 0], [-1.15 * sx, -0.6 * sy, v[2] / 2]];
    v.forEach((c, k) => {
      if (Math.abs(c) < 1e-9) return;
      K.dashed(color).set([0, 0, 0], along(k, c));
      if (tags) K.label(`${sym}_${AX[k]} = ${mTex(c)}`, tagAt[k], { kind: 'tag', priority });
    });
  }
  // θ arc in the xy plane from +x toward (vx, vy), counterclockwise positive.
  function thetaArc(v, { r = 1.15, text = '\\theta', priority = 5 } = {}) {
    const t = M.angleOf(v[0], v[1]);
    if (Number.isNaN(t)) return;
    const arc = K.arc([0, 0, 0], [1, 0, 0], [0, 1, 0], t * M.DEG, r, HEX.angle, { head: true });
    if (arc) K.label(text, arc.at(t * M.DEG / 2).multiplyScalar((r + 0.5) / r).toArray(), { priority });
  }
  // Extra controls in the quiz box: a labelled number field and a row of sign choices.
  function field(box, sym, unit, onEnter) {
    const input = box.answer({ label: sym.replace(/[\\{}]/g, ''), unit, onEnter });
    const lab = document.createElement('span');
    lab.className = 'field-label'; lab.innerHTML = tex(`${sym} =`);
    input.parentNode.prepend(lab); input.parentNode.classList.add('labeled');
    return input;
  }
  function signs(box, sym, id) {
    const get = box.choices(`${tex(sym)}의 부호`, [['+', '+'], ['0', '0'], ['-', '−']].map(([v, h]) => ({ value: `${id}:${v}`, html: h })));
    const sets = box.box.querySelectorAll('fieldset.choices');
    sets[sets.length - 1].classList.add('inline');
    return () => get().split(':')[1] ?? '';
  }

  // ---------------- components ----------------
  function buildComponents(p) {
    const L = 3.5;
    K.frame(L);
    const a = M.vectorA(p), P = [a[0], a[1], 0];
    components(a, HEX.a, 'a');
    K.guides(K.boxEdges(a));
    if (Math.abs(a[2]) > 1e-9 && Math.hypot(a[0], a[1]) > 1e-9) K.guides([[[0, 0, 0], P]], HEX.a, { opacity: 0.7, dash: 0.24, gap: 0.12 });
    thetaArc(a);
    vector(a, HEX.a, '\\vec a');
    if (p.phi > 0) {
      const f = p.phi * M.DEG, ux = [Math.cos(f), Math.sin(f), 0], uy = [-Math.sin(f), Math.cos(f), 0], ap = M.rotateAxes(a, p.phi);
      K.guides([[M.scale(ux, -L), M.scale(ux, L + 0.7)], [M.scale(uy, -L), M.scale(uy, L + 0.7)]], HEX.angle, { dash: 0.32, gap: 0.16 });
      K.label("x'", M.scale(ux, L + 1.1), { priority: 3 });
      K.label("y'", M.scale(uy, L + 1.1), { priority: 3 });
      for (const [u, c, k] of [[ux, ap[0], 'x'], [uy, ap[1], 'y']]) {
        if (Math.abs(c) < 1e-9) continue;
        K.dashed(HEX.a, { opacity: 0.45, radius: 0.034 }).set([0, 0, 0], M.scale(u, c));
        K.guides([[P, M.scale(u, c)]]);
        const n = k === 'x' ? uy : ux, side = k === 'x' ? -0.75 : -0.95;
        K.label(`a'_${k} = ${mTex(c)}`, M.add(M.scale(u, c / 2), M.scale(n, side)), { kind: 'tag', priority: 1 });
      }
      const arc = K.arc([0, 0, 0], [1, 0, 0], [0, 1, 0], f, 2.6, HEX.angle);
      if (arc) K.label('\\phi', arc.at(f / 2).multiplyScalar(3.05 / 2.6).toArray(), { priority: 4 });
    }
    home(L);
    cur = null;
    return { legend: [{ label: `${tex('\\vec a')} 실선, 성분 (component) 점선`, color: CSS.a }, { label: '단위 벡터 (unit vector)', color: CSS.unit }] };
  }

  // ---------------- head-to-tail addition ----------------
  function buildAdd(p) {
    const a = M.vectorA(p), b = M.vectorB(p), s = M.add(a, b), d = M.sub(a, b);
    // Panel size follows the vectors (whole metres, set again only when a control changes, 05 §무대).
    const L = Math.min(7, Math.max(4, Math.ceil(Math.max(...[...a, ...b, ...s, ...d].map(Math.abs)) + 0.6)));
    K.frame(L, { labelEvery: L >= 6 ? 2 : 1 });
    let revealed = false;
    vector(a, HEX.a, '\\vec a');
    K.arrow(HEX.b, { opacity: 0.3 }).set([0, 0, 0], b);                       // where b started
    const cands = M.candidates(p).map(c => {
      const n = M.norm(c.v), ar = K.arrow(HEX.cand, { radius: 0.05, opacity: 0.85 });
      ar.set([0, 0, 0], c.v);
      const lab = n > 1e-9 ? K.label(CIRCLED[+c.label - 1], M.add(c.v, M.scale(c.v, 0.5 / n)), { raw: true, kind: 'cand', priority: 5 }) : null;
      return { ...c, ar, lab };
    });
    const bMove = K.arrow(HEX.b), bLab = K.label('\\vec b', [0, 0, 0], { priority: 6 });
    const sAr = K.arrow(HEX.s, { radius: 0.095 }), ns = M.norm(s);
    const sLab = ns > 1e-9 ? K.label('\\vec s', M.add(s, [s[0] / ns * 0.55, s[1] / ns * 0.55 + 0.25, s[2] / ns * 0.55]), { priority: 7 }) : null;
    if (p.commute) {
      vector(a, HEX.a, '\\vec a', { origin: b, opacity: 0.5, priority: 3 });
      K.arrow(HEX.b, { opacity: 0.55 }).set([0, 0, 0], b);
    }
    if (p.diff) {
      vector(M.scale(b, -1), HEX.b, '-\\vec b', { origin: a, opacity: 0.6, priority: 3 });
      vector(d, 0xcc79a7, '\\vec d', { radius: 0.08, priority: 6 });
    }
    const dr = drone(stage, { size: 2.0 }); stage.group.add(dr);

    const box = quizBox(ctx.panel, '예측');
    box.text(`${tex('\\vec s = \\vec a + \\vec b')}는 ①–③ 가운데 어느 화살표인가? 재생하기 전에 고른다.`);
    const pick = box.choices('벡터 합 (vector sum)', M.candidates(p).map(c => ({ value: 'cand' + c.label, html: CIRCLED[+c.label - 1] })));
    box.box.querySelector('fieldset.choices').classList.add('inline');
    const check = () => {
      const r = M.checkSum(p, pick().replace('cand', ''));
      if (r.reason === 'none') { box.feedback(null, '먼저 화살표 하나를 고르자.'); return; }
      const ans = `벡터 합은 ${CIRCLED[+r.answer - 1]}이고 ${tex(`\\vec s = ${unitVectorTex(s, N, 'm')}`)}이다.`;
      const msg = {
        null: `맞다. ${tex('\\vec b')}의 꼬리를 ${tex('\\vec a')}의 머리에 붙이면 ${tex('\\vec a')}의 꼬리에서 ${tex('\\vec b')}의 머리까지가 ${tex('\\vec s')}다. `,
        aminusb: `고른 화살표는 ${tex('\\vec a - \\vec b')}다. ${tex('\\vec b')}를 거꾸로 붙인 것이다. 더할 때는 ${tex('\\vec b')}를 그대로 옮겨 꼬리를 ${tex('\\vec a')}의 머리에 붙인다. `,
        bminusa: `고른 화살표는 ${tex('\\vec b - \\vec a')}다. 꼬리를 모아 그린 두 벡터의 머리끼리 이은 화살표와 같다. 더할 때는 머리–꼬리 (head to tail)로 잇는다. `,
      }[String(r.reason)];
      box.feedback(r.ok, msg + ans);
      if (!revealed) vector(b, HEX.b, null, { origin: a, opacity: 0.55 });   // b placed head to tail
      revealed = true;
      for (const c of cands) if (c.kind === 'sum') c.ar.hide();
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);

    cur = {
      render(o) {
        dr.position.set(...o.drone);
        dr.spin(o.t * 38);
        bMove.set(o.bTail, b);
        const tip = M.add(o.bTail, b), nb = M.norm(b);
        if (nb > 1e-9) bLab.move(M.add(tip, [b[0] / nb * 0.5, b[1] / nb * 0.5 + 0.25, b[2] / nb * 0.5]));
        const grow = revealed ? 1 : o.sGrow;
        if (grow > 1e-6 && ns > 1e-9) sAr.set([0, 0, 0], M.scale(s, grow)); else sAr.hide();
        if (sLab) sLab.node.dataset.off = grow >= 1 ? '' : '1';
        if (o.done) for (const c of cands) if (c.kind === 'sum') c.ar.hide();
      },
    };
    home(L);
    const legend = [{ label: tex('\\vec a'), color: CSS.a }, { label: tex('\\vec b'), color: CSS.b }, { label: `${tex('\\vec s')} 벡터 합 (vector sum)`, color: CSS.s }, { label: '①–③ 후보', color: CSS.cand }];
    if (p.diff) legend.splice(3, 0, { label: `${tex('\\vec d')} 차 벡터`, color: '#cc79a7' });
    return { legend };
  }

  // ---------------- practice ----------------
  function buildPractice() {
    const q = M.question(qIndex), L = 5;
    K.frame(L);
    const box = quizBox(ctx.panel, `문제 ${(qIndex % M.QCOUNT) + 1} / ${M.QCOUNT}`);
    let grade = () => {}, shown = false;
    const once = f => () => { if (!shown) { shown = true; f(); } };
    const legend = [{ label: tex('\\vec a'), color: CSS.a }];

    if (q.type === 'comp') {
      vector(q.v, HEX.a, '\\vec a');
      thetaArc(q.v, { text: `\\theta = ${q.theta}^\\circ`, priority: 9 });
      K.label(`a = ${mTex(q.mag)}`, M.add(M.scale(q.v, 0.55), [0.55, 0.45, 0]), { kind: 'tag', priority: 5 });
      box.text(`<div class="given">알려진 양 ${tex(`a = ${mTex(q.mag)},\\ \\theta = ${q.theta}^\\circ`)}<br><small>xy 평면 위 벡터, 크기–각 표기 (magnitude-angle notation)</small></div>구할 양 ${tex('a_x,\\ a_y')}`);
      const sx = signs(box, 'a_x', 'ax'), sy = signs(box, 'a_y', 'ay');
      const fx = field(box, 'a_x', 'm', () => grade()), fy = field(box, 'a_y', 'm', () => grade());
      const reveal = once(() => { components(q.v, HEX.a, 'a'); K.guides([[[q.v[0], 0, 0], q.v], [[0, q.v[1], 0], q.v]]); });
      grade = () => {
        if (!sx() || !sy()) { box.feedback(null, '먼저 두 성분의 부호를 고르자.'); return; }
        const r = M.checkComp(q, [sx(), sy()], [fx.value, fy.value]);
        if (r.reason === 'unreadable') { box.feedback(false, '숫자로 적자. 예 −2.5'); return; }
        const qd = quadrant(q.theta), where = qd ? `<i>θ</i> = ${deg(q.theta)}는 ${QUAD[qd]} (quadrant)이므로 ${tex('a_x')}는 ${signWord(q.v[0])}, ${tex('a_y')}는 ${signWord(q.v[1])}이다.` : '';
        const msg = {
          null: '맞다.',
          signChoice: `값은 맞다. 고른 부호를 다시 보자. ${where}`,
          swap: `cos와 sin이 바뀌었다. <i>θ</i>는 +<i>x</i> 방향에서 잰 각이므로 ${tex('a_x = a\\cos\\theta')}이다.`,
          sign: `크기는 맞고 부호가 틀렸다. ${where}`,
          value: '식 (3.1.5)로 다시 계산해 보자.',
        }[String(r.reason)];
        box.feedback(r.ok, `${msg}<br>${tex(`a_x = ${N(q.mag)}\\cos ${q.theta}^\\circ = ${mTex(q.v[0])}`)}<br>${tex(`a_y = ${N(q.mag)}\\sin ${q.theta}^\\circ = ${mTex(q.v[1])}`)}`);
        reveal();
      };
    } else if (q.type === 'angle') {
      components(q.v, HEX.a, 'a');
      K.guides([[[q.v[0], 0, 0], q.v], [[0, q.v[1], 0], q.v]]);
      box.text(`<div class="given">알려진 양 ${tex(`a_x = ${mTex(q.v[0])},\\ a_y = ${mTex(q.v[1])}`)}<br><small>xy 평면 위 벡터 (${tex('a_z = 0')})</small></div>구할 양 크기 (magnitude) <i>a</i>, 각 (angle) <i>θ</i>`);
      const fa = field(box, 'a', 'm', () => grade()), ft = field(box, '\\theta', '°', () => grade());
      const reveal = once(() => { vector(q.v, HEX.a, '\\vec a'); thetaArc(q.v, { text: `\\theta = ${N(q.theta)}^\\circ`, priority: 9 }); });
      grade = () => {
        const r = M.checkAngle(q, [fa.value, ft.value]);
        if (r.reason === 'unreadable') { box.feedback(false, '두 칸 모두 숫자로 적자. 각은 도 단위다.'); return; }
        const qd = quadrant(q.theta);
        const msg = {
          null: '맞다.',
          calculator: `계산기의 tan⁻¹은 −90°에서 90° 사이 값만 준다. ${tex('a_x < 0')}이므로 ${tex('\\vec a')}는 ${QUAD[qd]}에 있다. 계산기 값 ${deg(q.calc)}에 180°를 더하거나 빼야 한다.`,
          angle: `성분의 부호로 사분면 (quadrant)을 먼저 정하자. ${tex('a_x')}는 ${signWord(q.v[0])}, ${tex('a_y')}는 ${signWord(q.v[1])}이므로 ${QUAD[qd]}다.`,
          mag: '각은 맞다. 크기는 식 (3.1.6)으로 다시 계산해 보자.',
        }[String(r.reason)];
        box.feedback(r.ok, `${msg}<br>${tex(`a = \\sqrt{(${N(q.v[0])})^2 + (${N(q.v[1])})^2} = ${mTex(q.mag)}`)}<br>${tex(`\\theta = ${N(q.theta)}^\\circ`)} <small>(${deg(q.theta + (q.theta < 0 ? 360 : -360))}와 같은 각)</small>`);
        reveal();
      };
    } else if (q.type === 'sum' || q.type === 'diff') {
      const isSum = q.type === 'sum', R = isSum ? 'r' : 'd';
      vector(q.a, HEX.a, '\\vec a'); vector(q.b, HEX.b, '\\vec b');
      legend.push({ label: tex('\\vec b'), color: CSS.b });
      box.text(`<div class="given">알려진 양<br>${tex(`\\vec a = ${unitVectorTex(q.a, N, 'm')}`)}<br>${tex(`\\vec b = ${unitVectorTex(q.b, N, 'm')}`)}</div>구할 양 ${tex(isSum ? '\\vec r = \\vec a + \\vec b' : '\\vec d = \\vec a - \\vec b')}의 성분`);
      const fs = AX.map(k => field(box, `${R}_${k}`, 'm', () => grade()));
      const reveal = once(() => {
        if (isSum) { vector(q.b, HEX.b, null, { origin: q.a, opacity: 0.65 }); vector(q.r, HEX.s, '\\vec r', { radius: 0.09 }); }
        else { vector(M.scale(q.b, -1), HEX.b, '-\\vec b', { origin: q.a, opacity: 0.65 }); vector(q.r, 0xcc79a7, '\\vec d', { radius: 0.09 }); }
        K.guides(K.boxEdges(q.r), HEX.guide, { opacity: 0.6 });
      });
      grade = () => {
        const r = M.checkComponents(q, fs.map(f => f.value));
        if (r.reason === 'unreadable') { box.feedback(false, '세 칸 모두 숫자로 적자. 성분이 0이면 0을 적는다.'); return; }
        const wrong = r.valueOk.map((ok, i) => (ok ? null : AX[i])).filter(Boolean);
        const msg = {
          null: '맞다.',
          subtracted: '성분끼리 뺐다. 합은 축마다 성분끼리 더한다 (3.2.4–3.2.6).',
          added: '성분끼리 더했다. 차 벡터는 축마다 성분끼리 뺀다 (3.2.7).',
          value: `${wrong.map(k => tex(`${R}_${k}`)).join(', ')}를 다시 계산해 보자.`,
        }[String(r.reason)];
        const op = isSum ? '+' : '-';
        box.feedback(r.ok, `${msg}<br>${AX.map((k, i) => tex(`${R}_${k} = ${N(q.a[i])} ${op} (${N(q.b[i])}) = ${mTex(q.r[i])}`)).join('<br>')}`);
        reveal();
      };
      legend.push({ label: tex(isSum ? '\\vec r' : '\\vec d'), color: isSum ? CSS.s : '#cc79a7' });
    } else {
      vector(q.v, HEX.a, '\\vec a');
      components(q.v, HEX.a, 'a');
      K.guides(K.boxEdges(q.v));
      box.text(`<div class="given">알려진 양 ${tex(`\\vec a = ${unitVectorTex(q.v, N, 'm')}`)}</div>구할 양 크기 (magnitude) <i>a</i>`);
      const fa = field(box, 'a', 'm', () => grade());
      const P = [q.v[0], q.v[1], 0];
      const reveal = once(() => {
        K.guides([[[0, 0, 0], P]], HEX.a, { opacity: 0.8, dash: 0.24, gap: 0.12 });
        K.label(`\\sqrt{a_x^2 + a_y^2} = ${mTex(q.magXY)}`, M.add(M.scale(P, 0.5), [0.4, -0.75, 0]), { kind: 'tag', priority: 5 });
      });
      grade = () => {
        const r = M.checkMag(q, fa.value);
        if (r.reason === 'unreadable') { box.feedback(false, '숫자로 적자. 예 4.25'); return; }
        const msg = { null: '맞다.', noZ: `${tex('a_z')}를 빠뜨렸다. xy 평면 성분의 크기와 ${tex('a_z')}로 피타고라스 정리를 한 번 더 쓴다.`, value: '피타고라스 정리를 두 번 쓴다. 먼저 xy 평면 성분의 크기를 구하자.' }[String(r.reason)];
        box.feedback(r.ok, `${msg}<br>${tex(`a = \\sqrt{(${N(q.v[0])})^2 + (${N(q.v[1])})^2 + (${N(q.v[2])})^2} = ${mTex(q.mag)}`)}`);
        reveal();
      };
    }
    box.buttons([{ label: '확인', primary: true, onClick: () => grade() }, { label: '새 문제', onClick: () => { qIndex += 1; ctx.rebuild(); } }]);
    home(L);
    cur = null;
    legend.push({ label: '단위 벡터 (unit vector)', color: CSS.unit });
    return { legend };
  }

  return {
    build(p) {
      cur = null;
      if (p.activity === 'add') return buildAdd(p);
      if (p.activity === 'practice') return buildPractice(p);
      return buildComponents(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
