// 15.5 3D view. Scene unit = 10 cm, x is up (Fig. 15.5.1). A stand holds the rigid support; the spring hangs from it
// to the block, and a rod runs from the block down to a flat vane in a tank of liquid. Arrows: velocity of the block
// (#0072B2) and the damping force on the vane (#D55E00). A cm ruler stands left of the block. After the check the board
// on the upper right gets x–t with the amplitude envelope (dotted), and energy bars (K, U, ΔE_th, sum) stand below it.
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, block } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { barBoard, BAR } from '../../../core/bars3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const K = 10;                                // scene units per m
const Y0 = 6.0, SIZE = 0.8, ROD = 3.6, TOP = 9.4, SURF = 3.9;
const COL = { x: 0x000000, v: 0x0072b2, F: 0xd55e00 };

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const s = M.oscillator(p), A = s.A * K, box = quizBox(ctx.panel, '예측');
      stage.floorPlane(0);
      const steel = stage.lit(0x6f8091, 0.6, 0.35);
      // Stand and rigid support.
      stage.mesh(stage.group, new THREE.BoxGeometry(1.0, 0.12, 1.0), stage.lit(0x273846, 0.4, 0.4), [-2.3, 0.06, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(0.12, TOP + 0.3, 0.12), steel, [-2.3, (TOP + 0.3) / 2, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(3.0, 0.16, 0.7), steel, [-0.8, TOP + 0.08, 0]);
      // Tank of liquid.
      stage.mesh(stage.group, new THREE.BoxGeometry(2.7, SURF + 0.5, 1.7), new THREE.MeshStandardMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.16, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide }), [0, (SURF + 0.5) / 2, 0]);
      const liq = stage.mesh(stage.group, new THREE.BoxGeometry(2.6, SURF, 1.6), new THREE.MeshStandardMaterial({ color: 0xb8cbd8, transparent: true, opacity: 0.4, roughness: 0.4, depthWrite: false }), [0, SURF / 2, 0]);
      liq.castShadow = false;
      // Ruler in cm left of the block, the equilibrium line and the starting amplitude.
      const major = [], minor = [], X0 = -0.85;
      for (let c = -15; c <= 15; c++) {
        const Y = Y0 + c / 100 * K;
        (c % 5 === 0 ? major : minor).push([X0, Y, 0.3], [X0 - (c % 5 === 0 ? 0.3 : 0.18), Y, 0.3]);
        if (c % 5 === 0) stage.label(`${fmtFixed(c, 0)} cm`, [X0 - 0.75, Y, 0.3], 'gtick', { dy: 0 });   // gtick: the measure kind thins labels along x only
      }
      stage.mesh(stage.group, new THREE.BoxGeometry(0.05, 3.2, 0.05), stage.lit(0x40546a, 0.3, 0.5), [X0, Y0, 0.3]);
      for (const [pts, color] of [[major, 0x40546a], [minor, 0x7a8795]]) stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(stage.v3)), new THREE.LineBasicMaterial({ color })));
      stage.line([[X0, Y0, 0.3], [0.7, Y0, -0.45]], 0x7a8795, { dashed: true, dash: 0.08, gap: 0.06 });

      // Spring (unit helix along −y from the support, scaled to its length), block, rod and vane.
      const pts = Array.from({ length: 241 }, (_, i) => { const u = i / 240, q = u * 12 * 2 * Math.PI; return new THREE.Vector3(0.2 * Math.cos(q), -u, 0.2 * Math.sin(q)); });
      const spring = stage.mesh(stage.group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 480, 0.022, 6, false), stage.lit(0x8c9ca9, 0.7, 0.3), [0, TOP, 0], [0, 0, 0], false);
      const blk = block(stage, SIZE, { color: 0xa9bccb, eye: [0, 1, 0] }); stage.group.add(blk);
      const rod = stage.mesh(stage.group, new THREE.CylinderGeometry(0.03, 0.03, ROD, 10), steel, [0, 0, 0], [0, 0, 0], false);
      const vane = stage.mesh(stage.group, new THREE.BoxGeometry(1.4, 0.06, 0.9), stage.lit(0x40546a, 0.4, 0.45));
      const V = vecArrow(stage, COL.v, { radius: 0.045 }), F = vecArrow(stage, COL.F, { radius: 0.045 });
      const lV = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lF = stage.label(tex('\\vec F_d'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const vMax = Math.hypot(s.g, s.wd) * s.A, VS = 1.6 / vMax, FS = 1.2 / (p.b * vMax);

      // x–t board and, after the check, the energy bars.
      const yr = niceRange(-p.xm, p.xm, { target: 4 });
      const gb = graphBoard(stage, { origin: [2.4, 5.0, -0.6], width: 8.6, height: 4.2, t: [0, M.RUN], tStep: 2, y: [yr.min, yr.max], yStep: yr.step, yTitle: '<i>x</i> (cm)' });
      const wait = stage.label('확인하면 그래프와 에너지 막대가 나타난다', gb.at(M.RUN / 2, yr.max / 2), 'station', { dy: 0, priority: 2 });
      let bars = null;

      box.text(`질량 ${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}인 블록이 용수철 상수 ${tex(`k = ${N(p.k)}\\ \\mathrm{N/m}`)}인 용수철에 달려 있고 액체 속 날개의 감쇠 상수는 ${tex(`b = ${N(p.b)}\\ \\mathrm{kg/s}`)}다. ${tex(`x = x_m = ${N(p.xm)}\\ \\mathrm{cm}`)}에서 시작한다. 재생하기 전에 구해 보자.`);
      box.text('① 진폭이 처음 값의 절반이 되는 시각', 'pred');
      const ai = box.answer({ label: '진폭이 절반이 되는 시각', unit: 's', placeholder: '예 3', onEnter: () => check() });
      box.text('② 역학적 에너지가 처음 값의 절반이 되는 시각', 'pred');
      const ei = box.answer({ label: '에너지가 절반이 되는 시각', unit: 's', placeholder: '예 2', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { ampText: ai.value, EText: ei.value });
        if (r.aReason === 'unreadable' || r.eReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 3.5'); return; }
        const ha = {
          energy: `그 값은 에너지가 절반이 되는 시각이다. 진폭은 ${tex('e^{-bt/2m}')}로 줄어든다.`,
          log10: '상용로그가 아니라 자연로그 ln을 쓴다.',
          noLn: `${tex('e^{-bt/2m} = \\tfrac{1}{2}')}에서 ${tex('t = 2m\\ln 2/b')}다.`,
          value: `${tex('x_me^{-bt/2m} = \\tfrac{1}{2}x_m')}을 풀자.`,
        }[r.aReason] ?? '';
        const he = {
          amplitude: `그 값은 진폭이 절반이 되는 시각이다. 에너지는 진폭의 제곱에 비례해 ${tex('e^{-bt/m}')}로 두 배 빨리 줄어든다.`,
          log10: '상용로그가 아니라 자연로그 ln을 쓴다.',
          noLn: `${tex('e^{-bt/m} = \\tfrac{1}{2}')}에서 ${tex('t = m\\ln 2/b')}다.`,
          value: `식 (15.5.6)에서 ${tex('e^{-bt/m} = \\tfrac{1}{2}')}을 풀자.`,
        }[r.eReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [ha, he].filter(Boolean).join(' ')}<br>${tex(`t = \\dfrac{2m\\ln 2}{b} = ${N(s.tAmp)}\\ \\mathrm{s}`)}<br>${tex(`t = \\dfrac{m\\ln 2}{b} = ${N(s.tE)}\\ \\mathrm{s}`)}`);
        if (!ui.revealed) {
          wait.node.dataset.off = '1';
          gb.curve(t => M.stateAt(t, p).x * 100, { color: COL.x, samples: 900 });
          for (const sg of [1, -1]) gb.curve(t => sg * M.stateAt(t, p).amp * 100, { color: COL.x, samples: 240, radius: 0.028, dotted: true, dot: false });
          gb.mark(s.tAmp, p.xm / 2);
          stage.label(`진폭 ½ (${fmt(s.tAmp)} s)`, gb.at(s.tAmp, p.xm / 2), 'gval', { dy: -16, priority: 3 });
          bars = barBoard(stage, { origin: [2.6, 0.3, -0.6], width: 4.6, height: 4.2, range: [0, M.stateAt(0, p).E * 1.3], title: '에너지 (J)',
            bars: [{ label: '<i>K</i>', fill: BAR.K }, { label: '<i>U</i>', fill: BAR.U }, { label: 'Δ<i>E</i><sub>th</sub>', fill: BAR.Eth }, { label: '합', fill: null }] });
        }
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          const Y = Y0 + o.x * K, top = Y + SIZE / 2;
          blk.position.set(0, Y, 0);
          spring.scale.set(1, Math.max(0.05, TOP - top - 0.17), 1);
          rod.position.set(0, Y - SIZE / 2 - ROD / 2, 0);
          const yv = Y - SIZE / 2 - ROD; vane.position.set(0, yv, 0);
          const dv = [0, o.v >= 0 ? 1 : -1, 0], LV = Math.abs(o.v) * VS;
          V.update([SIZE / 2 + 0.3, Y, 0], dv, LV); lV.node.dataset.off = LV > 0.12 ? '' : '1'; lV.move([SIZE / 2 + 0.65, Y + dv[1] * (LV + 0.25), 0]);
          const df = [0, o.Fd >= 0 ? 1 : -1, 0], LF = Math.abs(o.Fd) * FS;
          F.update([0.95, yv, 0.3], df, LF); lF.node.dataset.off = LF > 0.12 ? '' : '1'; lF.move([1.35, yv + df[1] * (LF + 0.25), 0.3]);
          gb.setTime(o.t);
          if (bars) bars.set([o.K, o.U, o.Eth, o.K + o.U + o.Eth]);
        },
      };
      stage.setHome({ target: [4.2, 5.25, 0], direction: [0, 0.1, 1], distance: 19, minDistance: 4, maxDistance: 50 });
      return { legend: [{ label: '변위 (displacement)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '힘 (force)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
