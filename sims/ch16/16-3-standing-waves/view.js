// 16.7 3D view. 1 unit = 1 m, true scale. A string from x = 0 (an oscillator on the left) to x = L (a clamp) over a
// measuring board; the displacement is vertical.
// resonance: the string in its nth mode. After the check: node dots, node and antinode tags, a λ bracket, board ticks.
// nodes: wave 1 (thin line), wave 2 (dots) and their sum (the brown string); a black bead marks the element at x.
// After the check: the amplitude curve ±|2y_m sin kx| (grey dashed), node dots, the bead's amplitude bracket and its
// transverse velocity (#0072B2).
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const H0 = 1.0, VEL = 0x0072b2, US = 0.25;     // string height, arrow length per m/s

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // Curve from x = 0 to L as a tube whose rings move with the displacement (one draw call).
  function tube(L, radius, material, z = 0) {
    const R = 10, geo = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(L, 0, 0)), M.NS, radius, R, false);
    const pos = geo.attributes.position, base = Float32Array.from({ length: pos.count }, (_, i) => pos.getY(i));
    const m = stage.mesh(stage.group, geo, material, [0, H0, z], [0, 0, 0], false);
    m.frustumCulled = false;
    m.set = ys => {
      for (let i = 0; i <= M.NS; i++) for (let j = 0; j <= R; j++) { const k = i * (R + 1) + j; pos.setY(k, base[k] + ys[i]); }
      pos.needsUpdate = true;
    };
    return m;
  }
  function dots(L, radius, z = 0) {
    const every = 6, n = Math.floor(M.NS / every) + 1;
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 10, 8), stage.flat(0x000000), n), T = new THREE.Matrix4();
    m.frustumCulled = false; stage.group.add(m);
    m.set = ys => { for (let k = 0; k < n; k++) { const i = k * every; m.setMatrixAt(k, T.makeTranslation(L * i / M.NS, H0 + ys[i], z)); } m.instanceMatrix.needsUpdate = true; };
    return m;
  }
  function nodeDots(xs) {
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 16, 12), stage.flat(0x000000), xs.length), T = new THREE.Matrix4();
    xs.forEach((x, i) => m.setMatrixAt(i, T.makeTranslation(x, H0, 0.03)));
    m.visible = false; stage.group.add(m); return m;
  }
  // Board, oscillator on the left, clamp on the right, and board ticks (shown after the check).
  function rig(L) {
    stage.board(stage.group, -0.75, L + 0.5, 1.6, 0, { thickness: 0.3, rails: false });
    stage.floorPlane(-0.45);
    const steel = stage.lit(0x6f8091, 0.6, 0.35);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.36, 0.3, 0.36), stage.lit(0x40546a, 0.3, 0.5), [-0.3, H0, 0]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.12, H0 - 0.15, 0.12), steel, [-0.3, (H0 - 0.15) / 2, 0]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.14, 0.03, 0.03), steel, [-0.06, H0, 0]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.08, H0 + 0.3, 0.08), steel, [L + 0.07, (H0 + 0.3) / 2, 0]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.16, 0.1, 0.16), steel, [L + 0.04, H0, 0]);
    const ticks = [], labels = [];
    for (let x = 0; x <= L + 1e-9; x += 0.5) ticks.push([x, 0.012, 0.3], [x, 0.012, Math.abs(x - Math.round(x)) < 1e-9 ? 0.62 : 0.45]);
    for (let x = 0; x <= L + 1e-9; x += 1) { const l = stage.label(`${fmtFixed(x, 0)} m`, [x, 0.08, 0.74], 'measure'); l.node.dataset.off = '1'; labels.push(l); }
    const set = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xd8e5ee }));
    set.visible = false; stage.group.add(set);
    return { show() { set.visible = true; for (const l of labels) l.node.dataset.off = ''; } };
  }
  // Dimension line with end ticks (black), from a to b at height y.
  function bracket(a, b, y, vertical = false) {
    const d = 0.06, pts = vertical
      ? [[a, y[0], 0.12], [a, y[1], 0.12], [a - d, y[0], 0.12], [a + d, y[0], 0.12], [a - d, y[1], 0.12], [a + d, y[1], 0.12]]
      : [[a, y, 0], [b, y, 0], [a, y - d, 0], [a, y + d, 0], [b, y - d, 0], [b, y + d, 0]];
    const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0x000000, depthTest: false }));
    l.renderOrder = 18; l.visible = false; stage.group.add(l); return l;
  }

  return {
    build(p) {
      ui.revealed = false; ui.timeScale = M.playScale(p); cur = null;
      const box = quizBox(ctx.panel, '예측');
      return p.activity === 'nodes' ? buildNodes(p, box) : buildResonance(p, box);
    },
    render(o) { if (cur) cur.render(o); },
  };

  function buildResonance(p, box) {
    const s = M.resonance(p), A = M.drawAmp(s), L = p.L;
    const board = rig(L);
    const rope = tube(L, 0.028, stage.lit(0xb08a5a, 0.05, 0.6));
    const nd = nodeDots(M.nodes(s));
    const two = p.n >= 2, yb = H0 - A - 0.2;
    const br = bracket(0, two ? s.lam : L, yb);
    const lt = stage.label(two ? `<i>λ</i> = ${fmt(s.lam)} m` : `<i>λ</i>/2 = <i>L</i> = ${fmt(L)} m`, [(two ? s.lam : L) / 2, yb - 0.2, 0], 'tag', { dy: 0, priority: 3 });
    const tn = stage.label('마디 (node)', [M.nodes(s)[1], H0 - 0.22, 0], 'tag', { dy: 0, priority: 2 });
    const ta = stage.label('배 (antinode)', [M.antinodes(s)[0], H0 + A + 0.16, 0], 'tag', { dy: 0, priority: 2 });
    for (const l of [lt, tn, ta]) l.node.dataset.off = '1';

    box.text(`길이 ${tex(`L = ${N(L)}\\ \\mathrm{m}`)}인 줄의 양 끝이 고정되어 있다. 장력은 ${tex(`\\tau = ${N(p.tau)}\\ \\mathrm{N}`)}, 선밀도는 ${tex(`\\mu = ${N(p.mu)}\\ \\mathrm{g/m}`)}다. 진동자가 이 줄을 배음 번호 ${tex(`n = ${p.n}`)}인 진동 모드 (고리 ${p.n}개)로 흔든다. 재생하기 전에 구해 보자.`);
    box.text(`① 파장 ${tex('\\lambda')}`, 'pred');
    const li = box.answer({ label: '파장', unit: 'm', placeholder: '예 2', onEnter: () => check() });
    box.text(`② 공명 진동수 ${tex('f')}`, 'pred');
    const fi = box.answer({ label: '공명 진동수', unit: 'Hz', placeholder: '예 3', onEnter: () => check() });
    const check = () => {
      const r = M.checkResonance(p, { lText: li.value, fText: fi.value });
      if (r.lReason === 'unreadable' || r.fReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 1.5'); return; }
      const hl = { loop: `고리 하나는 반 파장이다. ${tex('\\lambda/2 = L/n')}이다.`, fundamental: `그 값은 ${tex('n = 1')}의 파장이다. 고리 ${tex('n')}개에 반 파장이 ${tex('n')}개 들어간다.`, value: `식 (16.7.8) ${tex('\\lambda = 2L/n')}을 쓰자.` }[r.lReason] ?? '';
      const hf = { loop: `파장을 ${tex('L/n')}으로 잡았다. ${tex('\\lambda = 2L/n')}이다.`, fundamental: `그 값은 첫째 배음 (first harmonic)의 진동수다. ${tex('n')}을 곱하자.`, units: `${tex('\\mu')}를 kg/m로 바꾸자. ${tex('1\\ \\mathrm{g/m} = 10^{-3}\\ \\mathrm{kg/m}')}이다.`, times: `${tex('f = v/\\lambda')}다. 곱하지 않는다.`, value: `식 (16.7.9) ${tex('f = nv/2L')}을 쓰자.` }[r.fReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hl, hf].filter(Boolean).join(' ')}<br>${tex(`v = \\sqrt{\\tau/\\mu} = ${N(s.v)}\\ \\mathrm{m/s},\\ \\lambda = \\dfrac{2L}{n} = ${N(s.lam)}\\ \\mathrm{m}`)}<br>${tex(`f = \\dfrac{v}{\\lambda} = ${N(s.f)}\\ \\mathrm{Hz}`)}`);
      ui.revealed = true; board.show(); nd.visible = true; br.visible = true; for (const l of [lt, tn, ta]) l.node.dataset.off = '';
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
    cur = { render(o) { rope.set(o.ys); } };
    stage.setHome({ target: [(L - 0.3) / 2, 0.8, 0], direction: [0, 0.2, 1], distance: 1.15 * (L + 1.3), minDistance: 1.5, maxDistance: 30 });
    return { legend: [{ label: '변위 (displacement)', color: '#000000' }] };
  }

  function buildNodes(p, box) {
    const q = M.probe(p), s = q.s, L = s.L;
    rig(L);
    const w1 = tube(L, 0.013, stage.flat(0x000000, { transparent: true, opacity: 0.7 }), 0.06), w2 = dots(L, 0.017, 0.06);
    const rope = tube(L, 0.024, stage.lit(0xb08a5a, 0.05, 0.6));
    const bead = stage.mesh(stage.group, new THREE.SphereGeometry(0.05, 24, 16), stage.lit(0x1a1a1a, 0.2, 0.45));
    stage.label(`<i>x</i> = ${p.xP} cm`, [q.x, H0 - 2 * q.ym - 0.25, 0], 'station', { dy: 0, priority: 1 });
    const nd = nodeDots(M.nodes(s));
    // Amplitude curve ±|2y_m sin kx| (grey dashed), shown after the check.
    const env = [1, -1].map(sg => {
      const l = stage.line(Array.from({ length: 241 }, (_, i) => { const x = L * i / 240; return [x, H0 + sg * Math.abs(2 * q.ym * Math.sin(s.k * x)), 0]; }), 0x7a8795, { dashed: true, dash: 0.05, gap: 0.035 });
      l.visible = false; return l;
    });
    const ab = bracket(q.x + 0.12, 0, [H0 - q.A, H0 + q.A], true);
    const at = stage.label(`${fmt(q.A * 100)} cm`, [q.x + 0.5, H0 + q.A + 0.08, 0.12], 'tag', { dy: 0, priority: 3 }); at.node.dataset.off = '1';
    const U = vecArrow(stage, VEL, { radius: 0.022 }), lu = stage.label(tex('\\vec u'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });

    box.text(`양 끝이 고정된 줄 (${tex(`L = ${N(L)}\\ \\mathrm{m}`)}, ${tex(`v = ${N(s.v)}\\ \\mathrm{m/s}`)})에서 진폭 ${tex(`y_m = ${N(p.ym)}\\ \\mathrm{cm}`)}인 두 진행파가 서로 반대로 가서 배음 번호 ${tex(`n = ${p.nN}`)}인 정상파를 만든다 (${tex(`f = ${N(s.f)}\\ \\mathrm{Hz}`)}). 위치 ${tex(`x = ${p.xP}\\ \\mathrm{cm}`)}의 줄 요소 (검은 구슬)를 보자. 재생하기 전에 구해 보자.`);
    box.text('① 이 줄 요소의 진폭', 'pred');
    const ai = box.answer({ label: '줄 요소의 진폭', unit: 'cm', placeholder: '예 10', onEnter: () => check() });
    box.text(`② 이 줄 요소의 최대 가로 속력 ${tex('u_{\\max}')}`, 'pred');
    const ui2 = box.answer({ label: '최대 가로 속력', unit: 'm/s', placeholder: '예 2', onEnter: () => check() });
    const check = () => {
      const r = M.checkNodes(p, { aText: ai.value, uText: ui2.value });
      if (r.aReason === 'unreadable' || r.uReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 8.5'); return; }
      const ha = { everywhere: `정상파에서는 진폭이 위치마다 다르다. 진폭은 ${tex('|2y_m\\sin kx|')}다.`, noTwo: `두 파가 겹쳐 ${tex('2y_m\\sin kx')}가 된다. 2를 빠뜨렸다.`, cos: `고정된 끝 ${tex('x = 0')}이 마디라서 ${tex('\\sin kx')}를 쓴다.`, degrees: `${tex('kx')}는 rad 단위다. 계산기를 rad 모드로 두자.`, value: `${tex('k = 2\\pi/\\lambda')}, ${tex('\\lambda = 2L/n')}으로 ${tex('|2y_m\\sin kx|')}를 구하자.` }[r.aReason] ?? '';
      const hu = { waveSpeed: `그 값은 진행파의 속력 ${tex('v')}다. 줄 요소는 위아래로만 움직인다.`, noTwoPi: `${tex('\\omega = 2\\pi f')}다.`, antinode: '그 값은 배에 있는 줄 요소의 최대 속력이다. 이 요소의 진폭을 쓰자.', accel: `그 값은 최대 가로 가속도 ${tex('\\omega^2 A')}다.`, cm: '진폭을 m 단위로 바꾸자.', value: `${tex('u = -[2y_m\\sin kx]\\,\\omega\\sin\\omega t')}의 최댓값은 ${tex('\\omega|2y_m\\sin kx|')}다.` }[r.uReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [ha, hu].filter(Boolean).join(' ')}<br>${tex(`k = \\dfrac{n\\pi}{L} = ${N(s.k)}\\ \\mathrm{rad/m},\\ |2y_m\\sin kx| = ${N(q.A * 100)}\\ \\mathrm{cm}`)}<br>${tex(`u_{\\max} = 2\\pi f\\,|2y_m\\sin kx| = ${N(q.umax)}\\ \\mathrm{m/s}`)}`);
      ui.revealed = true; nd.visible = true; ab.visible = true; at.node.dataset.off = ''; for (const l of env) l.visible = true;
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
    cur = {
      render(o) {
        rope.set(o.ys); w1.set(o.y1s); w2.set(o.y2s);
        bead.position.set(q.x, H0 + o.yP, 0.02);
        const Lu = ui.revealed ? Math.abs(o.uP) * US : 0, d = o.uP >= 0 ? 1 : -1;
        U.update([q.x, H0 + o.yP, 0.06], [0, d, 0], Lu);
        lu.node.dataset.off = Lu > 0.03 ? '' : '1'; lu.move([q.x - 0.18, H0 + o.yP + d * Lu * 0.6, 0.06]);
      },
    };
    stage.setHome({ target: [(L - 0.3) / 2, 0.85, 0], direction: [0, 0.16, 1], distance: 1.15 * (L + 1.3), minDistance: 1.5, maxDistance: 30 });
    return { legend: [{ label: '변위 (displacement)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '줄 (resultant wave)', color: '#b08a5a' }] };
  }
}
