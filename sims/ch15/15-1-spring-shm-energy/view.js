// 15.1–15.2 3D view. Scene unit = 5 cm. A block on a spring on the measuring board (Fig. 15.1.7), the wall on the
// left and x = 0 at the equilibrium position. Arrows: v⃗ (#0072B2) and a⃗ (#CC79A7) above the block, the spring force
// F⃗ (#D55E00) on its front face. Three graph boards (x–t, v–t, a–t, as Fig. 15.1.6) stand behind the board. Their
// curves and the energy bar board (K, U, E as Fig. 15.2.1a) appear after the check.
import { fmtFixed, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, block } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { barBoard, BAR } from '../../../core/bars3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const K = 20;                          // scene units per m
const WALL = -6.2, SIZE = 1.2, ARROW = 2.2, RIGHT = 5.2;
const COL = { x: 0x000000, v: 0x0072b2, a: 0xcc79a7, F: 0xd55e00 };

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // Measuring board with legs, the wall, and a ruler in cm along the front edge.
  function track() {
    stage.board(stage.group, WALL - 0.5, RIGHT, 2.4, 0);
    stage.floorPlane(-1.45);
    for (const x of [WALL + 0.4, RIGHT - 0.8]) for (const z of [-0.6, 0.6]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.25, 2.2, 2.0), stage.lit(0x6f8091, 0.45, 0.45), [WALL - 0.125, 1.1, 0]);
    const major = [], minor = [];
    for (let c = -25; c <= 25; c++) {
      const X = c / 100 * K;
      (c % 5 === 0 ? major : minor).push([X, 0.014, 0.75], [X, 0.014, c % 5 === 0 ? 0.45 : 0.6]);
      if (c % 10 === 0) stage.label(`${fmtFixed(c, 0)} cm`, [X, 0.05, 1.0], 'measure');
    }
    for (const [pts, color] of [[major, 0xd8e5ee], [minor, 0xa9bccb]]) stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(stage.v3)), new THREE.LineBasicMaterial({ color })));
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const s = M.oscillator(p), A = s.A * K, Tend = M.duration(p);
      const box = quizBox(ctx.panel, '예측');
      track();
      // Turning points ±xm: vertical dashed lines behind the block, named above it.
      for (const [X, html] of [[A, '+<i>x</i><sub>m</sub>'], [-A, '−<i>x</i><sub>m</sub>']]) {
        stage.line([[X, 0.012, -1.0], [X, 2.45, -1.0]], 0x40546a, { dashed: true, dash: 0.1, gap: 0.07 });
        stage.label(html, [X, 2.65, -1.0], 'axis', { dy: 0, priority: 0 });
      }
      // Helix of unit length along +x from the wall, stretched to the current length.
      const pts = Array.from({ length: 281 }, (_, i) => { const u = i / 280, q = u * 14 * 2 * Math.PI; return new THREE.Vector3(u, 0.22 * Math.sin(q), 0.22 * Math.cos(q)); });
      const spring = stage.mesh(stage.group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 560, 0.026, 6, false), stage.lit(0x8c9ca9, 0.7, 0.3), [WALL, SIZE / 2, 0], [0, 0, 0], false);
      const blk = block(stage, SIZE, { color: 0xa9bccb, eye: [-1, 0, 0] }); stage.group.add(blk);
      const V = vecArrow(stage, COL.v, { radius: 0.045 }), Aa = vecArrow(stage, COL.a, { radius: 0.045 }), F = vecArrow(stage, COL.F, { radius: 0.045 });
      const lV = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lA = stage.label(tex('\\vec a'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lF = stage.label(tex('\\vec F'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });

      // Graph boards: x–t on top, v–t, a–t at the bottom, one time axis over two periods.
      const gx0 = WALL - 0.5, gw = RIGHT - gx0, gh = 2.5, gap = 0.2, gz = -1.9, base = 3.3;
      const ranges = { x: niceRange(-p.xm, p.xm, { target: 4 }), v: niceRange(-s.vm, s.vm, { target: 4, minSpan: 0 }), a: niceRange(-s.am, s.am, { target: 4, minSpan: 0 }) };
      const mk = (row, r, title) => graphBoard(stage, { origin: [gx0, base + row * (gh + gap), gz], width: gw, height: gh, t: [0, Tend], y: [r.min, r.max], yStep: r.step, yTitle: title });
      const gb = { x: mk(2, ranges.x, '<i>x</i> (cm)'), v: mk(1, ranges.v, '<i>v</i> (m/s)'), a: mk(0, ranges.a, '<i>a</i> (m/s²)') };
      const top = base + 3 * gh + 2 * gap;
      for (const X of [gx0 - 0.2, gx0 + gw + 0.2]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.08, 0.1, top + 1.45, 20), stage.lit(0x8c9ca9, 0.6, 0.3), [X, (top - 1.45) / 2, gz + 0.07]);
      const wait = stage.label('확인하면 그래프와 에너지 막대가 나타난다', gb.v.at(Tend / 2, 0), 'station', { dy: 0, priority: 2 });
      let bars = null;

      box.text(`질량 ${tex(`m = ${N(p.m)}\\ \\mathrm{kg}`)}인 블록이 용수철 상수 ${tex(`k = ${N(p.k)}\\ \\mathrm{N/m}`)}인 용수철에 매여 마찰 없는 바닥에서 진폭 ${tex(`x_m = ${N(p.xm)}\\ \\mathrm{cm}`)}로 진동한다. 재생하기 전에 구해 보자.`);
      box.text(`① 주기 ${tex('T')}`, 'pred');
      const Ti = box.answer({ label: '주기', unit: 's', placeholder: '예 1.5', onEnter: () => check() });
      box.text(`② 평형 위치를 지날 때의 속력, 곧 속도 진폭 ${tex('v_m')}`, 'pred');
      const vi = box.answer({ label: '속도 진폭', unit: 'm/s', placeholder: '예 0.8', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { TText: Ti.value, vText: vi.value });
        if (r.TReason === 'unreadable' || r.vReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 1.25'); return; }
        const hT = { inverted: `${tex('\\sqrt{k/m}')}이 아니라 ${tex('\\sqrt{m/k}')}다. 질량이 클수록 주기가 길다.`, noTwoPi: `그 값은 ${tex('1/\\omega')}다. ${tex('T = 2\\pi/\\omega')}다.`, freq: `그 값은 진동수 ${tex('f = 1/T')}다.`, omega: `그 값은 각진동수 ${tex('\\omega')}다. ${tex('T = 2\\pi/\\omega')}다.`, value: `식 (15.1.13)에 ${tex('m')}과 ${tex('k')}를 넣자.` }[r.TReason] ?? '';
        const hv = { amp: `그 값은 진폭 ${tex('x_m')}이다. 속도 진폭은 ${tex('v_m = \\omega x_m')}이다.`, accel: `그 값은 가속도 진폭 ${tex('a_m = \\omega^2x_m')}이다.`, useF: `진동수 ${tex('f')}가 아니라 각진동수 ${tex('\\omega = 2\\pi f')}를 곱한다.`, units: `진폭을 m 단위로 넣자. ${tex(`x_m = ${N(s.A)}\\ \\mathrm{m}`)}다.`, value: `${tex('\\tfrac{1}{2}mv_m^2 = \\tfrac{1}{2}kx_m^2')} (15.2.4)에서 ${tex('v_m')}을 구하자.` }[r.vReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hT, hv].filter(Boolean).join(' ')}<br>${tex(`T = 2\\pi\\sqrt{m/k} = ${N(s.T)}\\ \\mathrm{s}`)}<br>${tex(`v_m = \\omega x_m = \\sqrt{k/m}\\,x_m = ${N(s.vm)}\\ \\mathrm{m/s}`)}`);
        if (!ui.revealed) reveal();
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      function reveal() {
        wait.node.dataset.off = '1';
        gb.x.curve(t => M.stateAt(t, p).x * 100, { color: COL.x, samples: 400 });
        gb.v.curve(t => M.stateAt(t, p).v, { color: COL.v, samples: 400 });
        gb.a.curve(t => M.stateAt(t, p).a, { color: COL.a, samples: 400 });
        // Period mark on the x–t board.
        const [y0, y1] = gb.x.range.y;
        stage.line([gb.x.at(s.T, y0), gb.x.at(s.T, y1)].map(q => [q[0], q[1], q[2] + 0.01]), 0x40546a, { dashed: true, dash: 0.1, gap: 0.08 }).frustumCulled = false;
        stage.label(`<i>T</i> = ${N(s.T)} s`, gb.x.at(s.T, y1), 'gval', { dy: -10, priority: 3 });
        bars = barBoard(stage, { origin: [RIGHT + 0.7, 0.3, -1.2], width: 3.6, height: 5.0, range: [0, s.E * 1.35], title: '에너지 (J)',
          bars: [{ label: '<i>K</i>', fill: BAR.K }, { label: '<i>U</i>', fill: BAR.U }, { label: '<i>E</i>', fill: null }] });
      }

      cur = {
        render(o) {
          const X = o.x * K;
          blk.position.set(X, SIZE / 2, 0);
          spring.scale.set(Math.max(0.05, X - SIZE / 2 - 0.17 - WALL), 1, 1);
          const sg = q => (q >= 0 ? [1, 0, 0] : [-1, 0, 0]);
          const LV = Math.abs(o.v) / s.vm * ARROW, LA = Math.abs(o.a) / s.am * ARROW, LF = Math.abs(o.F) / s.Fm * ARROW;
          V.update([X, SIZE + 0.35, 0], sg(o.v), LV); lV.node.dataset.off = LV > 0.15 ? '' : '1'; lV.move([X + Math.sign(o.v) * (LV + 0.35), SIZE + 0.35, 0]);
          Aa.update([X, SIZE + 0.95, 0], sg(o.a), LA); lA.node.dataset.off = LA > 0.15 ? '' : '1'; lA.move([X + Math.sign(o.a) * (LA + 0.35), SIZE + 0.95, 0]);
          F.update([X, SIZE / 2, SIZE / 2 + 0.06], sg(o.F), LF); lF.node.dataset.off = LF > 0.15 ? '' : '1'; lF.move([X + Math.sign(o.F) * (LF + 0.35), SIZE / 2, SIZE / 2 + 0.06]);
          for (const g of Object.values(gb)) g.setTime(o.t);
          if (bars) bars.set([o.K, o.U, o.E]);
        },
      };
      stage.setHome({ target: [1.4, 5.15, -0.8], direction: [0, 0.14, 1], distance: 25.2, minDistance: 6, maxDistance: 60 });
      return { legend: [{ label: '변위 (displacement)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' }, { label: '힘 (force)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
