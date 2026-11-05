// 16.1–16.2 3D view. 1 unit = 1 m, the string runs along x and its displacement y is vertical (true scale).
// speed: a rope of length l over a measuring board, a driver at x = 0 and a clamp at x = l. A grey cone rides the
// first peak; after the check the board ticks, the velocity of the wave form (#0072B2) and a λ bracket appear.
// element: a long string with the marked element at x = 0 (black bead). A grey cone rides one peak with the wave
// velocity. After the check the element's transverse velocity u and the y–t graph of the element (graph board) appear.
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import { graphBoard, niceRange, niceStep } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const VEL = 0x0072b2;
const H0 = 1.0, H1 = 3.3;       // rope height in the speed and element activities
const VS = 0.12, US = 0.25;     // arrow length per m/s: wave velocity, transverse velocity
const z = { zero: 1e-9 };

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // Rope drawn as one tube along x. Its rings move up and down with the displacement (one draw call).
  function ropeTube(x0, x1, y0, radius, color) {
    const R = 10, geo = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(x0, 0, 0), new THREE.Vector3(x1, 0, 0)), M.NS, radius, R, false);
    const pos = geo.attributes.position, base = Float32Array.from({ length: pos.count }, (_, i) => pos.getY(i));
    const m = stage.mesh(stage.group, geo, stage.lit(color, 0.05, 0.6), [0, y0, 0]);
    m.frustumCulled = false;
    m.set = ys => {
      for (let i = 0; i <= M.NS; i++) for (let j = 0; j <= R; j++) { const k = i * (R + 1) + j; pos.setY(k, base[k] + ys[i]); }
      pos.needsUpdate = true;
    };
    return m;
  }
  // Grey cone pointing down at a peak (the short arrow of Fig. 16.1.4).
  const peakCone = () => stage.mesh(stage.group, new THREE.ConeGeometry(0.07, 0.18, 18), stage.lit(0x7a8795, 0.2, 0.5), [0, 0, 0], [Math.PI, 0, 0], false);
  const bead = () => stage.mesh(stage.group, new THREE.SphereGeometry(0.07, 24, 16), stage.lit(0x1a1a1a, 0.2, 0.45));

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측');
      return p.activity === 'element' ? buildElement(p, box) : buildSpeed(p, box);
    },
    render(o) { if (cur) cur.render(o); },
  };

  function buildSpeed(p, box) {
    const s = M.rope(p), Lr = M.LROPE;
    stage.board(stage.group, -0.7, Lr + 0.7, 1.6, 0, { thickness: 0.3, rails: false });
    stage.floorPlane(-0.45);
    const steel = stage.lit(0x6f8091, 0.6, 0.35);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.05, H0 + 0.55, 0.05), steel, [-0.15, (H0 + 0.55) / 2, 0]);
    const drv = stage.mesh(stage.group, new THREE.BoxGeometry(0.2, 0.12, 0.2), stage.lit(0x40546a, 0.3, 0.5), [-0.08, H0, 0]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.08, H0 + 0.3, 0.08), steel, [Lr + 0.07, (H0 + 0.3) / 2, 0]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.16, 0.1, 0.16), steel, [Lr + 0.04, H0, 0]);
    const rp = ropeTube(0, Lr, H0, 0.028, 0xb08a5a);
    const dot = bead(), cone = peakCone();
    const V = vecArrow(stage, VEL, { radius: 0.03 }), lv = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    // Board ticks every 1 m (one draw call), shown after the check.
    const ticks = [], tickLabels = [];
    for (let x = 0; x <= Lr + 1e-9; x += 0.5) ticks.push([x, 0.012, 0.3], [x, 0.012, Number.isInteger(x) ? 0.62 : 0.45]);
    for (let x = 0; x <= Lr + 1e-9; x += 1) { const l = stage.label(`${fmtFixed(x, 0)} m`, [x, 0.08, 0.74], 'measure'); l.node.dataset.off = '1'; tickLabels.push(l); }
    const tickSet = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xd8e5ee }));
    tickSet.visible = false; stage.group.add(tickSet);
    // λ bracket under the wave: a line with end ticks, riding with the wave form.
    const br = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 6 }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: 0x000000 }));
    br.frustumCulled = false; br.visible = false; stage.group.add(br);
    const lt = stage.label('', [0, 0, 0], 'tag', { dy: 0, priority: 3 }); lt.node.dataset.off = '1';

    box.text(`길이 ${tex(`l = ${N(Lr)}\\ \\mathrm{m}`)}, 질량 ${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}인 밧줄을 장력 ${tex(`\\tau = ${N(p.tau)}\\ \\mathrm{N}`)}으로 당겨 두었다. 왼쪽 끝을 진동수 ${tex(`f = ${N(p.f)}\\ \\mathrm{Hz}`)}로 위아래로 흔들기 시작한다. 재생하기 전에 구해 보자.`);
    box.text(`① 파동 속력 ${tex('v')}`, 'pred');
    const vi = box.answer({ label: '파동 속력', unit: 'm/s', placeholder: '예 8', onEnter: () => check() });
    box.text(`② 파장 ${tex('\\lambda')}`, 'pred');
    const li = box.answer({ label: '파장', unit: 'm', placeholder: '예 3', onEnter: () => check() });
    const check = () => {
      const r = M.checkSpeed(p, { vText: vi.value, lText: li.value });
      if (r.vReason === 'unreadable' || r.lReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 4.5'); return; }
      const hv = { noRoot: `제곱근을 빠뜨렸다. ${tex('v = \\sqrt{\\tau/\\mu}')}다.`, inverted: `${tex('\\tau')}와 ${tex('\\mu')}를 뒤집었다. 장력이 클수록 파동이 빠르다.`, mass: `밧줄 전체 질량 ${tex('m')}이 아니라 선밀도 ${tex('\\mu = m/l')}을 쓴다.`, value: `식 (16.2.5) ${tex('v = \\sqrt{\\tau/\\mu}')}에 ${tex('\\mu = m/l')}을 넣자.` }[r.vReason] ?? '';
      const hl = { times: `${tex('v = \\lambda f')}에서 ${tex('\\lambda = v/f')}다. 곱하지 않는다.`, omega: `각진동수 ${tex('\\omega')}가 아니라 진동수 ${tex('f')}로 나눈다.`, value: `${tex('v = \\lambda f')} (16.1.13)에서 ${tex('\\lambda')}를 구하자.` }[r.lReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hv, hl].filter(Boolean).join(' ')}<br>${tex(`\\mu = \\dfrac{m}{l} = ${N(s.mu)}\\ \\mathrm{kg/m},\\ v = \\sqrt{\\dfrac{\\tau}{\\mu}} = ${N(s.v)}\\ \\mathrm{m/s}`)}<br>${tex(`\\lambda = \\dfrac{v}{f} = ${N(s.lam)}\\ \\mathrm{m}`)}`);
      ui.revealed = true; tickSet.visible = true; for (const l of tickLabels) l.node.dataset.off = '';
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        rp.set(o.ys);
        drv.position.y = H0 + o.drive;
        dot.position.set(M.D, H0 + o.yd, 0);
        const has = o.crest !== null, top = H0 + s.ym + 0.2;
        cone.visible = has; if (has) cone.position.set(o.crest, top, 0);
        const L = ui.revealed && has ? s.v * VS : 0;
        V.update([has ? o.crest : 0, top + 0.22, 0], [1, 0, 0], L);
        lv.node.dataset.off = L > 0 ? '' : '1'; if (has) lv.move([o.crest + L + 0.2, top + 0.22, 0]);
        const show = ui.revealed && o.front >= s.lam - 1e-9;
        br.visible = show; lt.node.dataset.off = show ? '' : '1';
        if (show) {
          const a = o.front - s.lam, b = o.front, yb = H0 - s.ym - 0.16, pos = br.geometry.attributes.position;
          [[a, yb, 0], [b, yb, 0], [a, yb - 0.07, 0], [a, yb + 0.07, 0], [b, yb - 0.07, 0], [b, yb + 0.07, 0]].forEach((q, i) => pos.setXYZ(i, ...q));
          pos.needsUpdate = true;
          lt.set(`<i>λ</i> = ${fmt(s.lam)} m`); lt.move([(a + b) / 2, yb - 0.24, 0]);
        }
      },
    };
    stage.setHome({ target: [Lr / 2, 0.7, 0], direction: [0, 0.26, 1], distance: 7.4, minDistance: 2, maxDistance: 30 });
    return { legend: [{ label: '속도 (velocity)', color: '#0072b2' }] };
  }

  function buildElement(p, box) {
    const s = M.wave(p), [x0, x1] = M.XE;
    stage.floorPlane(-0.05);
    const rp = ropeTube(x0, x1, H1, 0.028, 0xb08a5a);
    const dot = bead(), cone = peakCone();
    const V = vecArrow(stage, VEL, { radius: 0.03 }), lv = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const U = vecArrow(stage, VEL, { radius: 0.03 }), lu = stage.label(tex('\\vec u'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const T2 = 2 * s.T, yr = niceRange(-p.ym, p.ym, { target: 4 });
    const gb = graphBoard(stage, { origin: [x0, 0, -0.3], width: x1 - x0, height: 2.6, t: [0, T2], tStep: niceStep(T2, 5), y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>t</i> (s)', yTitle: '<i>y</i>(0, <i>t</i>) (cm)' });
    let shown = false;

    box.text(`진폭 ${tex(`y_m = ${N(p.ym)}\\ \\mathrm{cm}`)}, 파장 ${tex(`\\lambda = ${N(p.lam)}\\ \\mathrm{m}`)}, 진동수 ${tex(`f = ${N(p.fe)}\\ \\mathrm{Hz}`)}인 사인파 ${tex('y = y_m\\sin(kx - \\omega t)')}가 줄을 따라 +${tex('x')} 방향으로 간다. ${tex('x = 0')}의 줄 요소 (검은 구슬)를 보자. 재생하기 전에 구해 보자.`);
    box.text(`① 이 줄 요소의 최대 가로 속력 ${tex('u_{\\max}')}`, 'pred');
    const ui1 = box.answer({ label: '최대 가로 속력', unit: 'm/s', placeholder: '예 1.5', onEnter: () => check() });
    box.text(`② ${tex('t = 0')} 뒤 이 줄 요소가 처음으로 가장 높은 곳 (${tex('y = +y_m')})에 닿는 시각 ${tex('t')}`, 'pred');
    const ti = box.answer({ label: '처음 가장 높은 곳에 닿는 시각', unit: 's', placeholder: '예 0.3', onEnter: () => check() });
    const check = () => {
      const r = M.checkElement(p, { uText: ui1.value, tText: ti.value });
      if (r.uReason === 'unreadable' || r.tReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 0.25'); return; }
      const hu = { waveSpeed: `그 값은 파동 속력 ${tex('v = \\lambda f')}다. 줄 요소는 ${tex('x')} 방향으로 가지 않고 위아래로만 움직인다.`, noTwoPi: `${tex('\\omega = 2\\pi f')}다. ${tex('2\\pi')}를 빠뜨렸다.`, accel: `그 값은 최대 가로 가속도 ${tex('\\omega^2 y_m')}이다.`, cm: `${tex('y_m')}을 m 단위로 바꾸자.`, value: `${tex('u = -\\omega y_m\\cos(kx - \\omega t)')} (16.1.20)의 최댓값은 ${tex('\\omega y_m')}이다.` }[r.uReason] ?? '';
      const ht = { upFirst: `${tex('x = 0')}에서 ${tex('y = -y_m\\sin\\omega t')} (16.1.6)라 줄 요소는 처음에 아래로 간다.`, half: `${tex('T/2')}에는 줄 요소가 다시 ${tex('y = 0')}을 지난다.`, full: `한 주기 ${tex('T')}가 지나기 전에 이미 가장 높은 곳을 지난다.`, value: `${tex('-\\sin\\omega t = 1')}이 되는 가장 작은 ${tex('t')}를 구하자.` }[r.tReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hu, ht].filter(Boolean).join(' ')}<br>${tex(`u_{\\max} = \\omega y_m = 2\\pi f y_m = ${N(s.umax)}\\ \\mathrm{m/s}`)}, 파동 속력 ${tex(`v = ${N(s.v)}\\ \\mathrm{m/s}`)}<br>${tex(`\\omega t = \\tfrac{3\\pi}{2},\\ t = \\tfrac{3}{4}T = ${N(s.tTop)}\\ \\mathrm{s}`)}`);
      if (!shown) {
        gb.curve(t => M.elementAt(t, p).y0 * 100, { color: 0x000000, tag: v => `${tex('y')} ${fmt(v, z)} cm` });
        gb.mark(s.tTop, p.ym);
        stage.label(tex('\\tfrac{3}{4}T'), gb.at(s.tTop, p.ym), 'gval', { dy: -18, priority: 4 });
        shown = true;
      }
      ui.revealed = true; ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        rp.set(o.ys);
        dot.position.set(0, H1 + o.y0, 0);
        const top = H1 + s.ym + 0.2;
        cone.position.set(o.crest, top, 0);
        const L = s.v * VS;
        V.update([o.crest, top + 0.22, 0], [1, 0, 0], L); lv.move([o.crest + L + 0.2, top + 0.22, 0]);
        const Lu = ui.revealed ? Math.abs(o.u0) * US : 0, d = o.u0 >= 0 ? 1 : -1;
        U.update([0, H1 + o.y0, 0.1], [0, d, 0], Lu);
        lu.node.dataset.off = Lu > 0.03 ? '' : '1'; lu.move([0.28, H1 + o.y0 + d * Lu * 0.6, 0.1]);
        gb.setTime(o.t);
      },
    };
    stage.setHome({ target: [(x0 + x1) / 2, 2.1, 0], direction: [0, 0.1, 1], distance: 9.4, minDistance: 2, maxDistance: 30 });
    return { legend: [{ label: '속도 (velocity)', color: '#0072b2' }, { label: '변위 (displacement)', color: '#000000' }] };
  }
}
