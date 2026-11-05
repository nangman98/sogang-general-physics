// 15.6 3D view. The apparatus of 15-3 (stand, spring, block, rod, vane in a liquid) with the rigid support moving up and
// down. x is up. Scene unit = 10 cm, or larger when the highest amplitude over ωd would leave the tank (then the cm
// ruler is relabelled to the same scale). Arrows: the driving force on the spring at the support (#D55E00) and the
// velocity of the block (#0072B2). After the check the board on the right shows the resonance curves xm(ωd) for b (solid)
// and 2b (dotted, as Fig. 15.6.1) with a ring at the current ωd. Answers and the check survive moving the ωd slider.
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, block } from '../../../core/forces3d.js';
import { graphBoard, niceRange, niceStep } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const Y0 = 6.0, SIZE = 0.8, ROD = 3.6, TOP = 9.4, SURF = 3.9, AMAX = 1.5;
const COL = { x: 0x000000, v: 0x0072b2, F: 0xd55e00 };

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;
  const memo = {};               // answers, feedback and check per oscillator (m, k, b, Fm), kept when only ωd changes

  return {
    build(p) {
      cur = null;
      const key = [p.m, p.k, p.b, p.Fm].join('|'), saved = memo[key] ?? (memo[key] = { w: '', x: '', fb: null, revealed: false });
      ui.revealed = saved.revealed;
      const s = M.forced(p), pk = M.peak(p), K = Math.min(10, AMAX / pk.xm), box = quizBox(ctx.panel, '예측');
      stage.floorPlane(0);
      const steel = stage.lit(0x6f8091, 0.6, 0.35);
      stage.mesh(stage.group, new THREE.BoxGeometry(1.0, 0.12, 1.0), stage.lit(0x273846, 0.4, 0.4), [-2.3, 0.06, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.12, TOP + 0.7, 0.12), steel, [-2.3, (TOP + 0.7) / 2, 0]);
      // The rigid support: a plate on a slide that moves up and down on the stand.
      const support = new THREE.Group(); stage.group.add(support);
      stage.mesh(support, new THREE.BoxGeometry(3.0, 0.16, 0.7), steel, [-0.8, 0.08, 0]);
      stage.mesh(support, new THREE.BoxGeometry(0.3, 0.5, 0.3), stage.lit(0x40546a, 0.5, 0.4), [-2.3, 0.1, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(2.7, SURF + 0.5, 1.7), new THREE.MeshStandardMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.16, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide }), [0, (SURF + 0.5) / 2, 0]);
      const liq = stage.mesh(stage.group, new THREE.BoxGeometry(2.6, SURF, 1.6), new THREE.MeshStandardMaterial({ color: 0xb8cbd8, transparent: true, opacity: 0.4, roughness: 0.4, depthWrite: false }), [0, SURF / 2, 0]);
      liq.castShadow = false;
      // Ruler in cm left of the block, on the scene scale K.
      const R = AMAX / K * 100, step = niceStep(R, 3), X0 = -0.85, major = [], minor = [];
      for (let i = Math.ceil(-R / step * 5 - 1e-9); i <= Math.floor(R / step * 5 + 1e-9); i++) {
        const c = i * step / 5, Y = Y0 + c / 100 * K, big = i % 5 === 0;
        (big ? major : minor).push([X0, Y, 0.3], [X0 - (big ? 0.3 : 0.18), Y, 0.3]);
        if (big) stage.label(`${fmtFixed(c, Math.max(0, -Math.floor(Math.log10(step) + 1e-9)))} cm`, [X0 - 0.75, Y, 0.3], 'gtick', { dy: 0 });
      }
      stage.mesh(stage.group, new THREE.BoxGeometry(0.05, 2 * AMAX + 0.2, 0.05), stage.lit(0x40546a, 0.3, 0.5), [X0, Y0, 0.3]);
      for (const [pts, color] of [[major, 0x40546a], [minor, 0x7a8795]]) stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(stage.v3)), new THREE.LineBasicMaterial({ color })));
      stage.line([[X0, Y0, 0.3], [0.7, Y0, -0.45]], 0x7a8795, { dashed: true, dash: 0.08, gap: 0.06 });

      const pts = Array.from({ length: 241 }, (_, i) => { const u = i / 240, q = u * 12 * 2 * Math.PI; return new THREE.Vector3(0.2 * Math.cos(q), -u, 0.2 * Math.sin(q)); });
      const spring = stage.mesh(stage.group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 480, 0.022, 6, false), stage.lit(0x8c9ca9, 0.7, 0.3), [0, TOP, 0], [0, 0, 0], false);
      const blk = block(stage, SIZE, { color: 0xa9bccb, eye: [0, 1, 0] }); stage.group.add(blk);
      const rod = stage.mesh(stage.group, new THREE.CylinderGeometry(0.03, 0.03, ROD, 10), steel, [0, 0, 0], [0, 0, 0], false);
      const vane = stage.mesh(stage.group, new THREE.BoxGeometry(1.4, 0.06, 0.9), stage.lit(0x40546a, 0.4, 0.45));
      const V = vecArrow(stage, COL.v, { radius: 0.045 }), F = vecArrow(stage, COL.F, { radius: 0.045 });
      const lV = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lF = stage.label(tex('\\vec F'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const VS = 1.6 / (p.Fm / p.b), FS = 1.0 / p.Fm;      // the largest velocity amplitude, Fm/b at ωd = ω, is 1.6 units

      // Resonance board: xm (cm) against ωd.
      const xmax = pk.xm * 100, yr = niceRange(0, xmax * 1.12, { target: 4 });
      const gb = graphBoard(stage, { origin: [2.4, 2.6, -0.6], width: 8.6, height: 5.0, t: [0, M.WMAX], tStep: 5, y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>ω</i><sub>d</sub> (rad/s)', yTitle: '<i>x</i><sub>m</sub> (cm)' });
      const wait = stage.label('확인하면 공명 곡선이 나타난다', gb.at(M.WMAX / 2, yr.max / 2), 'station', { dy: 0, priority: 2 });
      function reveal() {
        wait.node.dataset.off = '1';
        const q = { ...p, b: 2 * p.b }, pk2 = M.peak(q);
        gb.curve(wd => M.forced(p, wd).xm * 100, { color: COL.x, samples: 400, dot: false }).update(M.WMAX);
        gb.curve(wd => M.forced(q, wd).xm * 100, { color: COL.x, samples: 400, radius: 0.03, dotted: true, dot: false }).update(M.WMAX);
        stage.label(`<i>b</i> = ${fmt(p.b)} kg/s`, gb.at(pk.wp, xmax), 'gval', { dy: -14, priority: 3 });
        const w2 = Math.min(pk2.wp + 0.25 * M.WMAX, M.WMAX * 0.9);
        stage.label(`2<i>b</i>`, gb.at(w2, M.forced(q, w2).xm * 100), 'gval', { dy: -14, priority: 3 });
        const yNow = s.xm * 100;
        gb.mark(p.wd, Math.min(yNow, yr.max));
        stage.line([gb.at(p.wd, 0), gb.at(p.wd, Math.min(yNow, yr.max))].map(a => [a[0], a[1], a[2] + 0.01]), 0x40546a, { dashed: true, dash: 0.1, gap: 0.08 }).frustumCulled = false;
        stage.label(`지금 <i>ω</i><sub>d</sub>`, gb.at(p.wd, 0), 'gval', { dy: -12, priority: 2 });
      }

      const w0 = M.natural(p), xr = M.forced(p, w0).xm * 100;
      box.text(`질량 ${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}, 용수철 상수 ${tex(`k = ${N(p.k)}\\ \\mathrm{N/m}`)}, 감쇠 상수 ${tex(`b = ${N(p.b)}\\ \\mathrm{kg/s}`)}인 진동자를 지지대가 진폭 ${tex(`F_m = ${N(p.Fm)}\\ \\mathrm{N}`)}인 구동력으로 흔든다. 확인하기 전에 구해 보자.`);
      box.text(`① 공명이 일어나는 구동 각진동수 ${tex('\\omega_d')}`, 'pred');
      const wi = box.answer({ label: '공명 구동 각진동수', unit: 'rad/s', placeholder: '예 6', onEnter: () => check() });
      box.text(`② 공명일 때 변위 진폭 ${tex('x_m')}`, 'pred');
      const xi = box.answer({ label: '공명 변위 진폭', unit: 'cm', placeholder: '예 10', onEnter: () => check() });
      wi.value = saved.w; xi.value = saved.x;
      wi.addEventListener('input', () => { saved.w = wi.value; }); xi.addEventListener('input', () => { saved.x = xi.value; });
      const check = () => {
        saved.w = wi.value; saved.x = xi.value;
        const r = M.check(p, { wText: wi.value, xText: xi.value });
        if (r.wReason === 'unreadable' || r.xReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 6.5'); return; }
        const hw = {
          freq: `그 값은 진동수 ${tex('f = \\omega/2\\pi')}다. 공명 조건은 각진동수로 ${tex('\\omega_d = \\omega')}다.`,
          inverted: `${tex('\\sqrt{m/k}')}가 아니라 ${tex('\\omega = \\sqrt{k/m}')}이다.`,
          noRoot: `${tex('k/m')}은 ${tex('\\omega^2')}이다.`,
          value: `식 (15.6.2) ${tex('\\omega_d = \\omega')}에 ${tex('\\omega = \\sqrt{k/m}')}을 넣자.`,
        }[r.wReason] ?? '';
        const hx = {
          static: `그 값은 ${tex('F_m/k')}, 아주 느리게 흔들 때의 진폭이다. 공명에서는 감쇠만이 진폭을 막는다.`,
          velAmp: `그 값은 공명에서의 속도 진폭 ${tex('v_m = F_m/b')}(m/s)다. ${tex('x_m = v_m/\\omega')}다.`,
          units: '진폭을 cm 단위로 적자.',
          value: `진폭 식에 ${tex('\\omega_d = \\omega')}를 넣으면 첫 항이 0이 되어 ${tex('x_m = F_m/b\\omega')}다.`,
        }[r.xReason] ?? '';
        saved.fb = { ok: r.ok, html: `${r.ok ? '맞다.' : [hw, hx].filter(Boolean).join(' ')}<br>${tex(`\\omega_d = \\omega = \\sqrt{k/m} = ${N(w0)}\\ \\mathrm{rad/s}`)}<br>${tex(`x_m = \\dfrac{F_m}{b\\omega} = ${N(xr)}\\ \\mathrm{cm}`)}` };
        box.feedback(saved.fb.ok, saved.fb.html);
        if (!saved.revealed) reveal();
        saved.revealed = true; ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
      if (saved.fb) box.feedback(saved.fb.ok, saved.fb.html);
      if (saved.revealed) reveal();

      cur = {
        render(o) {
          const top = TOP + o.ys * K, Y = Y0 + o.x * K;
          support.position.set(0, top, 0);
          spring.position.y = top;
          blk.position.set(0, Y, 0);
          spring.scale.set(1, Math.max(0.05, top - (Y + SIZE / 2) - 0.17), 1);
          rod.position.set(0, Y - SIZE / 2 - ROD / 2, 0);
          vane.position.set(0, Y - SIZE / 2 - ROD, 0);
          const dv = [0, o.v >= 0 ? 1 : -1, 0], LV = Math.abs(o.v) * VS;
          V.update([SIZE / 2 + 0.3, Y, 0], dv, LV); lV.node.dataset.off = LV > 0.12 ? '' : '1'; lV.move([SIZE / 2 + 0.65, Y + dv[1] * (LV + 0.25), 0]);
          const df = [0, o.F >= 0 ? 1 : -1, 0], LF = Math.abs(o.F) * FS;
          F.update([0.6, top - 1.2, 0.3], df, LF); lF.node.dataset.off = LF > 0.12 ? '' : '1'; lF.move([1.0, top - 1.2 + df[1] * LF / 2, 0.3]);
        },
      };
      stage.setHome({ target: [4.2, 5.25, 0], direction: [0, 0.1, 1], distance: 19, minDistance: 4, maxDistance: 50 });
      return { legend: [{ label: '변위 (displacement)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '힘 (force)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
