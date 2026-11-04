// 5.1–5.2 3D view. A crate on the measuring board with its force arrows (textbook sketch, Fig. 5.1.4a and
// Fig. 5.2.3a style) and, beside it, the free-body diagram: the crate as a dot, axes through it, tails anchored
// on the dot (Fig. 5.2.3b). Force arrows are always shown (Chapter 5 rule). The net force and the acceleration
// appear after the prediction is checked.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, dashLine, crate, freeBody, GREY, UNKNOWN_LENGTH } from './forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COL = { force: 0xd55e00, acc: 0xcc79a7, guess: 0x8a98a6 };
// m per N and m per m/s² of the sum activity. Its free-body diagram uses half the force scale so that it fits beside
// the board. The fbd activity scales with the slider values (model.js fbdScales).
export const SCALE = { sum: { F: 1 / 4, fbd: 1 / 8, a: 1 / 8 } };
const LEGEND = [
  { label: '힘 (force)', color: '#d55e00' },
  { label: '가속도 (acceleration)', color: '#cc79a7' },
];

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  const add = (a, b) => a.map((c, i) => c + b[i]);
  const mul = (a, k) => a.map(c => c * k);
  const len = a => Math.hypot(...a);

  // Board with feet and floor, as in the approved scene.
  function ground(x0, x1, width) {
    stage.board(stage.group, x0, x1, width, 0);
    stage.floorPlane(-1.45);
    for (const x of [x0 + 1.2, x1 - 1.2]) for (const z of [-width / 2 + 0.8, width / 2 - 0.8]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.42, 0.52, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
  }
  // Arrow on the crate with its label just past the tip.
  // unknown: a force the student is asked for is grey, of fixed length and named "= ?" until reveal().
  function onBody(color, html, { radius = 0.05, priority = 2, gap = 0.3, raw = false, minR = 0.8, unknown = false } = {}) {
    const arrow = vecArrow(stage, unknown ? GREY : color, { radius });
    const name = raw ? html : tex(html);
    const lab = stage.label(unknown ? `${name} <span class="val">= ?</span>` : name, [0, 0, 0], raw ? 'qty word' : 'qty', { dy: 0, priority });
    let hidden = unknown;
    return {
      reveal() { hidden = false; arrow.mat.color.setHex(color); lab.set(name); },
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
  const step = (box, html) => box.text(html, 'pred');

  // ---------------- sum: horizontal forces on a frictionless surface ----------------
  function buildSum(p) {
    const q = M.problemOf(p), S = SCALE.sum, size = 0.7, H = size / 2;
    ground(-4, 4, 8);
    // Ice sheet with a 1 m grid on the board top.
    const ice = stage.mesh(stage.group, new THREE.BoxGeometry(7, 0.03, 7), stage.lit(0xe3edf3, 0, 0.18), [0, 0.015, 0]);
    ice.castShadow = false;
    // 1 m grid that scrolls under the crate: the crate stays in the middle and the floor moves by −r (the run goes on
    // until it is paused, as in the department's earlier Newton's-second-law lab).
    const gpos = new Float32Array(16 * 2 * 3), ggeo = new THREE.BufferGeometry();
    ggeo.setAttribute('position', new THREE.BufferAttribute(gpos, 3));
    const gridLines = new THREE.LineSegments(ggeo, new THREE.LineBasicMaterial({ color: 0xb9cad6 }));
    gridLines.frustumCulled = false; stage.group.add(gridLines);
    const scroll = (rx, rz) => {
      const ox = -(((rx % 1) + 1) % 1), oz = -(((rz % 1) + 1) % 1);
      let k = 0;
      const put = (a, b) => { gpos.set(a, k); gpos.set(b, k + 3); k += 6; };
      for (let j = -3; j <= 4; j++) {
        const X = j + ox, Z = j + oz;
        if (Math.abs(X) <= 3.5) put([X, 0.035, -3.5], [X, 0.035, 3.5]); else put([0, 0, 0], [0, 0, 0]);
        if (Math.abs(Z) <= 3.5) put([-3.5, 0.035, Z], [3.5, 0.035, Z]); else put([0, 0, 0], [0, 0, 0]);
      }
      ggeo.attributes.position.needsUpdate = true;
    };
    const state = stage.label('', [0, size + 1.9, 0], 'tag', { dy: 0, priority: 3 });
    stage.label('마찰 없는 면 (frictionless surface)', [1.4, 0.1, 3.75], 'station');

    const body = crate(stage, size); stage.group.add(body);
    // Horizontal forces on the crate (overhead sketch). F_g and F_N balance and are drawn in the free-body diagram.
    const F3 = q.forces.map(f => [f[0], 0, f[1]]);
    const onCrate = F3.map((v, i) => ({ v, a: onBody(COL.force, `\\vec F_${i + 1}`) }));
    const guess = onBody(COL.guess, '예측', { radius: 0.04, priority: 1, raw: true });
    const net = onBody(COL.force, '\\vec F_{\\mathrm{net}}', { radius: 0.075, priority: 3 });
    const acc = onBody(COL.acc, '\\vec a', { radius: 0.05, priority: 3 });
    const chain = F3.slice(1).map(() => vecArrow(stage, COL.force, { radius: 0.03, opacity: 0.45 }));

    // Free-body diagram right of the board, same orientation as the scene.
    const fo = [5.7, 1.7, -0.6];
    freeBody(stage, fo, {
      axes: [{ name: 'x', dir: [1, 0, 0], side: [0, -0.3, 0] }, { name: 'y', dir: [0, 1, 0], side: [-0.35, 0, 0] }, { name: 'z', dir: [0, 0, 1], side: [0.35, 0, 0] }],
      forces: [...F3.map((v, i) => ({ v, html: `\\vec F_${i + 1}`, value: `${fmt(len(v))} N` })), { v: [0, q.m * M.G, 0], html: '\\vec F_N', value: `${fmt(q.m * M.G)} N` }, { v: [0, -q.m * M.G, 0], html: '\\vec F_g', value: `${fmt(q.m * M.G)} N` }],
      title: '자유물체도 (free-body diagram)', titleAt: add(fo, [0.6, -3.3, 0]), scale: S.fbd, tex,
    });

    // ---- prediction panel ----
    const box = quizBox(ctx.panel, '예측');
    // Unit-vector notation as in Sample Problem 5.1.2: (12.5 N)î − (10.4 N)ĵ.
    const vecTex = f => {
      const term = (c, u) => `(${N(c)}\\ \\mathrm{N})\\hat{\\mathrm{${u}}}`;
      const hasX = Math.abs(f[0]) > 1e-9, hasZ = Math.abs(f[1]) > 1e-9;
      if (!hasX && !hasZ) return '0';
      if (!hasZ) return term(f[0], 'i');
      if (!hasX) return term(f[1], 'k');
      return `${term(f[0], 'i')} ${f[1] < 0 ? '-' : '+'} ${term(Math.abs(f[1]), 'k')}`;
    };
    box.text(`<div class="given">${tex(`m = ${N(q.m)}\\ \\mathrm{kg}`)}<br>${q.forces.map((f, i) => tex(`\\vec F_${i + 1} = ${vecTex(f)}`)).join('<br>')}</div>재생하기 전에 가속도의 방향과 크기를 예측해 보자.`);
    const dirRow = step(box, '① 가속도 방향<small>장면의 회색 화살표를 돌린다</small>');
    const range = document.createElement('input');
    Object.assign(range, { type: 'range', min: 0, max: 355, step: 5, value: 0 });
    range.setAttribute('aria-label', '예측한 가속도 방향');
    dirRow.append(range);
    let guessDeg = 0, shown = false;
    const zero = box.check('알짜힘이 0이다 (방향 없음)', () => { range.disabled = zero.checked; ctx.refresh(); });
    range.addEventListener('input', () => { guessDeg = +range.value; ctx.refresh(); });
    step(box, `② 가속도 크기 ${tex('a')}`);
    const aInput = box.answer({ label: '가속도 크기', unit: 'm/s²', placeholder: '예 2.5', onEnter: () => check() });

    const check = () => {
      const r = M.checkSum(q, { heading: guessDeg, zero: zero.checked, aText: aInput.value });
      if (r.aReason === 'unreadable') { box.feedback(false, '② 가속도 크기를 숫자로 적자. 예 2.5'); return; }
      const dirMsg = {
        zeroMissed: '힘들을 성분별로 더하면 0이다. 알짜힘이 0이면 정지한 상자는 그대로 정지해 있다. 뉴턴 제1법칙 (Newton’s First Law)이다.',
        notZero: '알짜힘은 0이 아니다. 성분별로 더해 보자.',
        largest: '그 방향은 가장 큰 힘의 방향이다. 상자는 모든 힘의 벡터 합 방향으로 가속한다.',
        direction: `방향을 다시 보자. ${tex('F_{\\mathrm{net},x}')}와 ${tex('F_{\\mathrm{net},z}')}를 따로 더한다.`,
      }[r.dirReason];
      const aMsg = {
        scalar: '힘의 크기를 그냥 더했다. 힘은 벡터로 더한다.',
        noMass: `그 값은 알짜힘의 크기 ${tex('F_{\\mathrm{net}}')}이다. ${tex('a = F_{\\mathrm{net}}/m')}이다.`,
        value: '가속도 크기를 다시 계산해 보자.',
      }[r.aReason];
      const sol = q.zero
        ? tex('\\vec F_{\\mathrm{net}} = 0,\\quad a = 0')
        : `${tex(`\\vec F_{\\mathrm{net}} = ${vecTex(q.Fnet)}`)}<br>${tex(`F_{\\mathrm{net}} = ${N(q.FnetMag)}\\ \\mathrm{N},\\ a = F_{\\mathrm{net}}/m = ${N(q.aMag)}\\ \\mathrm{m/s^2}`)}`;
      box.feedback(r.ok, `${r.ok ? '맞다.' : [dirMsg, aMsg].filter(Boolean).join(' ')}<br>${sol}`);
      shown = true; ui.revealed = true;
      ctx.refresh();
    };
    box.buttons([
      { label: '확인', primary: true, onClick: check },
      { label: '다음 문제', onClick: () => { ctx.setParam('problem', String((q.index + 1) % M.PROBLEMS.length + 1)); ctx.rebuild(); } },
    ]);

    cur = {
      render(o) {
        const c = [0, H, 0], top = [0, size + 0.3, 0];
        body.position.set(0, 0, 0); scroll(o.r[0], o.r[2]);
        state.node.dataset.off = shown ? '' : '1';
        if (shown) state.set(q.zero ? '정지 (알짜힘 0)' : `가속 중 · ${fmt(o.speed, { zero: 1e-9 })} m/s`);
        for (const it of onCrate) it.a.set(c, it.v, len(it.v) * S.F);
        const [gx, gz] = M.fromHeading(guessDeg);
        if (zero.checked) guess.hide(); else guess.set(top, [gx, 0, gz], 1.3);
        if (!shown) { net.hide(); acc.hide(); chain.forEach(a => { a.visible = false; }); return; }
        let tip = add(c, mul(F3[0], S.F));
        F3.slice(1).forEach((f, i) => { chain[i].update(tip, f, len(f) * S.F); tip = add(tip, mul(f, S.F)); });
        const Fn = [q.Fnet[0], 0, q.Fnet[1]], A = [q.a[0], 0, q.a[1]];
        net.set(c, Fn, len(Fn) * S.F);
        acc.set(top, A, len(A) * S.a);
      },
    };
    stage.setHome({ target: [1.9, 0.7, 0.5], direction: [0, 0.95, 1], distance: 14.5, minDistance: 6, maxDistance: 40 });
    return { legend: [...LEGEND, { label: '예측', color: '#8a98a6' }] };
  }

  // ---------------- fbd: crate pulled by a cord at angle θ, sliding against friction ----------------
  function buildFbd(p) {
    const s = M.pulled(p), sc = M.fbdScales(p), S = { F: sc.F, fbd: sc.F, a: sc.a }, size = 1.0, H = size / 2, XC = -3.2;
    ground(-6, 4.6, 4.0);
    // The crate stays at XC and the ruler scrolls under it: 1 m ticks, a label every 2 m with the distance from the start.
    const NT = 12, tpos = new Float32Array(NT * 2 * 3), tgeo = new THREE.BufferGeometry();
    tgeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
    const tickLines = new THREE.LineSegments(tgeo, new THREE.LineBasicMaterial({ color: 0xd8e5ee }));
    tickLines.frustumCulled = false; stage.group.add(tickLines);
    const tickTags = Array.from({ length: 6 }, () => stage.label('', [0, 0.1, 1.85], 'measure'));
    const ruler = x => {
      const m0 = Math.ceil(x - 2.6);
      let k = 0, n = 0;
      for (let i = 0; i < NT; i++) {
        const m = m0 + i, X = XC + (m - x);
        if (X > 4.4) { tpos.fill(0, k, k + 6); k += 6; continue; }
        tpos.set([X, 0.014, 1.45, X, 0.014, m % 2 ? 1.65 : 1.75], k); k += 6;
        if (m % 2 === 0 && n < tickTags.length) { tickTags[n].move([X, 0.1, 1.85]); tickTags[n].set(`${m} m`); tickTags[n].node.dataset.off = ''; n++; }
      }
      for (; n < tickTags.length; n++) tickTags[n].node.dataset.off = '1';
      tgeo.attributes.position.needsUpdate = true;
    };
    const state = stage.label('', [XC, 0, 0], 'tag', { dy: 0, priority: 3 });

    const body = crate(stage, size); stage.group.add(body);
    const th = p.theta * Math.PI / 180, u = [Math.cos(th), Math.sin(th), 0];
    // Cord from the middle of the front face with a handle at its end (the pulling hand is not drawn).
    const cordLen = 2.4;
    const cord = stage.mesh(stage.group, new THREE.CylinderGeometry(0.028, 0.028, cordLen, 10), stage.lit(0xd9c49a, 0, 0.9), [0, 0, 0]);
    cord.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...u));
    const handle = stage.mesh(stage.group, new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16), stage.lit(0x33475b, 0.3, 0.5), [0, 0, 0], [Math.PI / 2, 0, 0]);

    // F_N is asked for: grey and unnamed in size until the check. The other forces carry their values.
    const forces = [
      { v: [s.Tx, s.Ty, 0], html: '\\vec T', value: `${fmt(p.T)} N` },
      { v: [-p.f, 0, 0], html: '\\vec f', value: `${fmt(p.f)} N` },
      { v: [0, s.FN, 0], html: '\\vec F_N', value: `${fmt(s.FN, { zero: 1e-9 })} N`, unknown: true },
      { v: [0, -s.Fg, 0], html: '\\vec F_g', value: `${fmt(s.Fg)} N` },
    ];
    const onCrate = forces.map(f => ({ ...f, a: onBody(COL.force, f.html, { unknown: f.unknown }) }));
    const net = onBody(COL.force, '\\vec F_{\\mathrm{net}}', { radius: 0.075, priority: 3 });
    const acc = onBody(COL.acc, '\\vec a', { radius: 0.05, priority: 3 });

    // Free-body diagram up and to the right, in the x–y plane like the textbook figures.
    const fo = [2.4, 2.1, -2.6];
    const fb = freeBody(stage, fo, {
      axes: [{ name: 'x', dir: [1, 0, 0], side: [0, -0.3, 0] }, { name: 'y', dir: [0, 1, 0], side: [-0.35, 0, 0] }],
      forces, title: '자유물체도 (free-body diagram)', titleAt: add(fo, [-2.3, 1.7, 0]), scale: S.fbd, tex,
    });
    // Components of T: T cos θ along x, then T sin θ up to the tip of T.
    if (p.T > 0 && p.theta > 0) {
      const tx = add(fo, [s.Tx * S.fbd, 0, 0]), tt = add(fo, [s.Tx * S.fbd, s.Ty * S.fbd, 0]);
      dashLine(stage, add(fo, [0, -0.02, 0]), add(tx, [0, -0.02, 0]), COL.force);
      dashLine(stage, tx, tt, COL.force);
      // Component names only where the component is long enough to carry one.
      if (s.Tx * S.fbd > 0.3) stage.label(tex('T\\cos\\theta'), add(fo, [s.Tx * S.fbd / 2, -0.3, 0]), 'gtick', { dy: 0, priority: 1 });
      if (s.Ty * S.fbd > 0.3) stage.label(tex('T\\sin\\theta'), add(tx, [0.75, s.Ty * S.fbd * 0.4, 0]), 'gtick', { dy: 0, priority: 1 });
    }

    // ---- prediction panel ----
    const box = quizBox(ctx.panel, '예측');
    box.text('재생하기 전에 자유물체도로 두 값을 구해 보자.');
    step(box, `① 수직항력 (normal force) 크기 ${tex('F_N')}`);
    const FNIn = box.answer({ label: '수직항력 크기', unit: 'N', placeholder: '예 30.5', onEnter: () => check() });
    step(box, `② 가속도 ${tex('a_x')}<small>+<i>x</i> 방향이 양(+)이다</small>`);
    const aIn = box.answer({ label: '가속도 x 성분', unit: 'm/s²', placeholder: '예 −1.2', onEnter: () => check() });
    let shown = false;
    const check = () => {
      const r = M.checkFbd(p, { FNText: FNIn.value, aText: aIn.value });
      if (r.FNReason === 'unreadable' || r.aReason === 'unreadable') { box.feedback(false, '두 칸 모두 숫자로 적자. 예 −2.5'); return; }
      const fnMsg = {
        mg: `${tex('F_N = mg')}는 줄이 위로 당기지 않을 때만 맞다. ${tex('T\\sin\\theta')}만큼 줄어든다.`,
        plus: `${tex('T\\sin\\theta')}는 위쪽이다. ${tex('y')} 성분 식의 부호를 보자.`,
        value: `${tex('y')} 성분 식 ${tex('F_N + T\\sin\\theta - F_g = 0')}을 풀어 보자.`,
      }[r.FNReason];
      const aMsg = {
        sign: '부호를 보자. +<i>x</i> 방향이 양이다.',
        fullT: `${tex('x')} 성분 식에는 ${tex('\\vec T')} 전체가 아니라 ${tex('x')} 성분 ${tex('T\\cos\\theta')}가 들어간다.`,
        noFriction: `마찰력 ${tex('\\vec f')}도 ${tex('x')} 성분이 있다. 미끄러짐 반대 방향이다.`,
        value: `${tex('x')} 성분 식 ${tex('T\\cos\\theta - f = ma_x')}를 풀어 보자.`,
      }[r.aReason];
      const note = Math.abs(s.ax) < 1e-9 ? ' 알짜힘이 0이라 상자는 같은 속도로 미끄러진다. 뉴턴 제1법칙 (Newton’s First Law)이다.' : s.ax < 0 ? ' 상자는 느려지다가 멈춘다.' : '';
      const sol = `${tex(`F_N = mg - T\\sin\\theta = ${N(s.FN)}\\ \\mathrm{N}`)}<br>${tex(`a_x = (T\\cos\\theta - f)/m = ${N(s.ax)}\\ \\mathrm{m/s^2}`)}`;
      box.feedback(r.ok, `${r.ok ? '맞다.' : [fnMsg, aMsg].filter(Boolean).join(' ')}${note}<br>${sol}`);
      shown = true; ui.revealed = true;
      fb.reveal(); for (const it of onCrate) it.a.reveal();
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);

    cur = {
      render(o) {
        const X = XC, c = [X, H, 0];
        body.position.set(X, 0, 0); ruler(o.r[0]);
        const start = [X + size / 2, H, 0];
        cord.position.set(...add(start, mul(u, cordLen / 2)));
        handle.position.set(...add(start, mul(u, cordLen)));
        for (const it of onCrate) it.a.set(c, it.v, len(it.v) * S.F);
        if (!shown) { net.hide(); acc.hide(); state.node.dataset.off = '1'; return; }
        // Above the label of F_N so that the horizontal F_net and a do not cross the vertical arrows.
        const top = [X, Math.max(size + 0.35, H + s.FN * S.F + 0.75), 0];
        const Fx = o.stopped ? 0 : s.Fx;
        net.set(top, [Fx, 0, 0], Math.abs(Fx) * S.F);
        acc.set(add(top, [0, 0.45, 0]), [o.a[0], 0, 0], Math.abs(o.a[0]) * S.a);
        state.move(add(top, [0, 1.15, 0])); state.node.dataset.off = '';
        state.set(o.stopped ? '정지' : Math.abs(s.ax) < 1e-9 ? '등속' : s.ax > 0 ? '가속' : '감속');
      },
    };
    stage.setHome({ target: [-0.6, 1.8, -0.7], direction: [0, 0.36, 1], distance: 13.5, minDistance: 6, maxDistance: 40 });
    return { legend: LEGEND };
  }

  return {
    build(p) {
      cur = null; ui.revealed = false; ui.activity = p.activity;
      return p.activity === 'fbd' ? buildFbd(p) : buildSum(p);
    },
    render(o) { if (cur) cur.render(o); },
  };
}
