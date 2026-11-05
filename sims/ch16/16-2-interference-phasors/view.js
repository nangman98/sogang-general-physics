// 16.5–16.6 3D view. 1 unit = 1 cm along the string. Displacements and phasors are drawn 2.5 times larger
// (1 mm = 0.25 unit) so the phasor diagram is readable. Right: the string from x = 0 to 10 cm. Wave 1 is a thin black line, wave 2 black dots, and after the check the
// real string (the resultant wave) appears as a brown tube. Left: the phasor diagram for x = 0 in the x–y plane facing
// the camera. Phasors (black) turn clockwise; grey dashed lines carry their vertical projections to x = 0 on the string.
// After the check: the resultant phasor, phasor 2 moved to the head of phasor 1 (faint) and the angle β.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, dashLine } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const MM = 0.25;                // scene units per mm (2.5 times the x scale)
const GUIDE = 0x7a8795;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // A curve along x drawn as a tube whose rings move with the displacement (one draw call).
  function tube(radius, material) {
    const R = 8, geo = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(M.XLEN, 0, 0)), M.NS, radius, R, false);
    const pos = geo.attributes.position, base = Float32Array.from({ length: pos.count }, (_, i) => pos.getY(i));
    const m = stage.mesh(stage.group, geo, material, [0, 0, 0], [0, 0, 0], false);
    m.frustumCulled = false;
    m.set = ys => {
      for (let i = 0; i <= M.NS; i++) for (let j = 0; j <= R; j++) { const k = i * (R + 1) + j; pos.setY(k, base[k] + ys[i] * MM); }
      pos.needsUpdate = true;
    };
    return m;
  }
  // Dotted curve: beads every 6 samples as one instanced mesh.
  function dots(radius) {
    const every = 6, n = Math.floor(M.NS / every) + 1;
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 10, 8), stage.flat(0x000000), n), T = new THREE.Matrix4();
    m.frustumCulled = false; stage.group.add(m);
    m.set = ys => { for (let k = 0; k < n; k++) { const i = k * every; m.setMatrixAt(k, T.makeTranslation(M.XLEN * i / M.NS, ys[i] * MM, 0)); } m.instanceMatrix.needsUpdate = true; };
    return m;
  }
  // Arc of radius r about the diagram centre (CX, 0) from angle a to a + span (rad), redrawn every frame.
  function arc(CX) {
    const n = 48, l = stage.line(Array.from({ length: n + 1 }, () => [0, 0, 0]), 0x000000);
    l.frustumCulled = false;
    l.set = (r, a, span) => {
      const pos = l.geometry.attributes.position;
      for (let i = 0; i <= n; i++) { const g = a + span * i / n; pos.setXYZ(i, CX + r * Math.cos(g), r * Math.sin(g), 0.02); }
      pos.needsUpdate = true;
    };
    return l;
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측');
      const phasor = p.activity === 'phasor';
      const { a1, a2, phi } = M.amps(p), s = M.phasorSum(a1, a2, phi), f = phi * Math.PI / 180;
      const rMax = Math.max(a1, a2, s.ym) * MM + 0.3, CX = -rMax - 0.8;

      // Axes of the phasor diagram, the string's rest line and the line x = 0.
      const axes = [[CX - rMax, 0, 0], [M.XLEN + 0.3, 0, 0], [CX, -rMax, 0], [CX, rMax, 0], [0, -rMax, 0], [0, rMax, 0]];
      stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(axes.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xb4c0cc })));
      stage.label('<i>x</i> = 0의 phasor', [CX, rMax + 0.45, 0], 'station', { dy: 0, priority: -2 });
      stage.label('<i>x</i> = 0', [0, -rMax - 0.3, 0], 'gtick', { dy: 0, priority: 1 });

      const w1 = tube(0.025, stage.flat(0x000000, { transparent: true, opacity: 0.6 })), w2 = dots(0.045);
      const str = tube(0.06, stage.lit(0xb08a5a, 0.05, 0.6)); str.visible = false;
      const P1 = vecArrow(stage, 0x000000, { radius: 0.032 }), P2 = vecArrow(stage, 0x000000, { radius: 0.032 });
      const P2m = vecArrow(stage, 0x000000, { radius: 0.03, opacity: 0.35 }), PR = vecArrow(stage, 0x000000, { radius: 0.048 });
      const l1 = stage.label(tex('y_{m1}'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), l2 = stage.label(tex('y_{m2}'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const lR = stage.label(tex("y'_m"), [0, 0, 0], 'qty', { dy: 0, priority: 3 });
      const d1 = dashLine(stage, [0, 0, 0], [0, 0, 0], GUIDE, { dash: 0.1, gap: 0.07 }), d2 = dashLine(stage, [0, 0, 0], [0, 0, 0], GUIDE, { dash: 0.1, gap: 0.07 });
      const dR = dashLine(stage, [0, 0, 0], [0, 0, 0], GUIDE, { dash: 0.1, gap: 0.07 });
      const aPhi = arc(CX), aBeta = arc(CX);
      const lPhi = stage.label(tex('\\phi'), [0, 0, 0], 'qty', { dy: 0, priority: 1 }), lBeta = stage.label(tex('\\beta'), [0, 0, 0], 'qty', { dy: 0, priority: 1 });
      const span = ((phi % 360) + 360) % 360 * Math.PI / 180;
      const rPhi = Math.max(0.2, 0.45 * Math.min(a1, a2) * MM), rBeta = Math.max(0.16, 0.28 * Math.min(a1, s.ym) * MM);

      let check;
      if (!phasor) {
        const r0 = M.sameAmp(p.ym, p.phi);
        box.text(`진폭이 ${tex(`y_m = ${N(p.ym)}\\ \\mathrm{mm}`)}로 같은 두 사인파가 한 줄을 따라 같은 방향으로 간다. 두 파의 위상차는 ${tex(`\\phi = ${p.phi}^\\circ`)}다. 재생하기 전에 구해 보자.`);
        box.text(`① 결과 파의 진폭 ${tex("y'_m")}`, 'pred');
        const yi = box.answer({ label: '결과 파의 진폭', unit: 'mm', placeholder: '예 4', onEnter: () => check() });
        const kind = box.choices('② 간섭의 종류', [
          { value: 'constructive', html: '완전 보강 간섭 (fully constructive)' },
          { value: 'destructive', html: '완전 상쇄 간섭 (fully destructive)' },
          { value: 'intermediate', html: '중간 간섭 (intermediate)' },
        ]);
        const NAME = { constructive: '완전 보강 간섭 (fully constructive interference)', destructive: '완전 상쇄 간섭 (fully destructive interference)', intermediate: '중간 간섭 (intermediate interference)' };
        check = () => {
          const r = M.checkSame(p, { ymText: yi.value, type: kind() });
          if (r.yReason === 'unreadable') { box.feedback(false, '①을 숫자로 적자. 예 4.5'); return; }
          if (r.tReason === 'empty') { box.feedback(null, '② 하나를 고르자.'); return; }
          const hy = { noHalf: `코사인 안에는 각의 절반 ${tex('\\tfrac{1}{2}\\phi')}가 들어간다.`, noPhase: '그 값은 위상차가 0일 때 (완전 보강)의 진폭이다.', noTwo: `${tex("y'_m = |2y_m\\cos\\tfrac{1}{2}\\phi|")}에서 2를 빠뜨렸다.`, degRad: '각을 rad로 읽었다. 계산기를 도 (°) 모드로 두자.', value: `식 (16.5.7) ${tex("y'_m = |2y_m\\cos\\tfrac{1}{2}\\phi|")}을 쓰자.` }[r.yReason] ?? '';
          const frac = ((p.phi / 360) % 1);
          const ht = r.tOk ? '' : `${tex(`\\phi = ${N(p.phi / 360)}`)} 파장이다. 정수 부분을 버린 ${N(frac, 2)} 파장을 0, 0.5, 1과 비교하자.`;
          box.feedback(r.ok, `${r.ok ? '맞다.' : [hy, ht].filter(Boolean).join(' ')}<br>${tex(`y'_m = |2y_m\\cos\\tfrac{1}{2}\\phi| = |2(${N(p.ym)})\\cos ${N(p.phi / 2)}^\\circ| = ${N(r0.ym)}\\ \\mathrm{mm}`)}<br>${NAME[r0.type]}`);
          reveal();
        };
      } else {
        box.text(`두 사인파 ${tex('y_1 = y_{m1}\\sin(kx - \\omega t)')}와 ${tex('y_2 = y_{m2}\\sin(kx - \\omega t + \\phi)')}가 한 줄을 따라 같은 방향으로 간다. ${tex(`y_{m1} = ${N(p.ym1)}\\ \\mathrm{mm}`)}, ${tex(`y_{m2} = ${N(p.ym2)}\\ \\mathrm{mm}`)}, ${tex(`\\phi = ${p.phiP}^\\circ`)}다. 재생하기 전에 phasor로 구해 보자.`);
        box.text(`① 결과 파의 진폭 ${tex("y'_m")}`, 'pred');
        const yi = box.answer({ label: '결과 파의 진폭', unit: 'mm', placeholder: '예 4', onEnter: () => check() });
        box.text(`② 결과 파의 위상 상수 ${tex('\\beta')} <small>phasor 1에서 시계 반대 방향으로 잰 각</small>`, 'pred');
        const bi = box.answer({ label: '결과 파의 위상 상수', unit: '°', placeholder: '예 30', onEnter: () => check() });
        check = () => {
          const r = M.checkPhasor(p, { ymText: yi.value, bText: bi.value });
          if (r.yReason === 'unreadable' || r.bReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 25'); return; }
          const hy = { scalar: '두 진폭을 그냥 더하면 위상차가 0일 때만 맞는다. phasor를 벡터로 더하자.', diff: '그 값은 위상차가 180°일 때의 진폭이다.', perp: `그 값은 위상차가 90°일 때다. 수평 성분에 ${tex('y_{m2}\\cos\\phi')}도 넣자.`, sameAmp: '식 (16.5.7)은 두 진폭이 같을 때만 쓴다. phasor를 벡터로 더하자.', value: `수평 성분과 수직 성분으로 나누어 더하자.` }[r.yReason] ?? '';
          const hb = { half: `${tex('\\beta = \\tfrac{1}{2}\\phi')}는 두 진폭이 같을 때만 맞는다.`, full: '그 값은 phasor 2의 각이다. 합 phasor의 각을 구하자.', fromTwo: 'phasor 2에서 잰 각이다. phasor 1에서 잰다.', noHoriz: `수평 성분에 ${tex('y_{m2}\\cos\\phi')}도 넣자.`, radians: '도 (°) 단위로 적자.', value: `${tex("\\tan\\beta = y'_{mv}/y'_{mh}")}에서 사분면을 확인하자.` }[r.bReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [hy, hb].filter(Boolean).join(' ')}<br>${tex(`y'_{mh} = ${N(p.ym1)} + ${N(p.ym2)}\\cos ${p.phiP}^\\circ = ${N(s.h)}\\ \\mathrm{mm},\\ y'_{mv} = ${N(p.ym2)}\\sin ${p.phiP}^\\circ = ${N(s.v)}\\ \\mathrm{mm}`)}<br>${tex(`y'_m = \\sqrt{y'^2_{mh} + y'^2_{mv}} = ${N(s.ym)}\\ \\mathrm{mm}`)}${s.ym < 1e-9 ? '' : `, ${tex(`\\beta = ${N(s.beta)}^\\circ`)}`}`);
          reveal();
        };
      }
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
      function reveal() { ui.revealed = true; str.visible = true; ctx.refresh(); }

      cur = {
        render(o) {
          w1.set(o.y1s); w2.set(o.y2s); str.set(o.ys);
          const th = o.th, t1 = [CX + a1 * MM * Math.cos(th), a1 * MM * Math.sin(th), 0], t2 = [CX + a2 * MM * Math.cos(th + f), a2 * MM * Math.sin(th + f), 0];
          P1.update([CX, 0, 0], [Math.cos(th), Math.sin(th), 0], a1 * MM); P2.update([CX, 0, 0], [Math.cos(th + f), Math.sin(th + f), 0], a2 * MM);
          const away = (tip, ang, gap) => [tip[0] + gap * Math.cos(ang), tip[1] + gap * Math.sin(ang), 0];
          l1.move(away(t1, th, 0.3)); l2.move(away(t2, th + f, 0.3));
          d1.set(t1, [0, t1[1], 0]); d2.set(t2, [0, t2[1], 0]);
          aPhi.visible = span > 1e-6; aPhi.set(rPhi, th, span);
          lPhi.node.dataset.off = span > 1e-6 ? '' : '1'; lPhi.move([CX + (rPhi + 0.22) * Math.cos(th + span / 2), (rPhi + 0.22) * Math.sin(th + span / 2), 0]);
          const b = o.beta * Math.PI / 180, show = ui.revealed && o.R > 1e-9;
          const tR = [CX + o.R * MM * Math.cos(th + b), o.R * MM * Math.sin(th + b), 0];
          PR.update([CX, 0, 0], [Math.cos(th + b), Math.sin(th + b), 0], show ? o.R * MM : 0);
          P2m.update(t1, [Math.cos(th + f), Math.sin(th + f), 0], show && phasor ? a2 * MM : 0);
          lR.node.dataset.off = show ? '' : '1'; lR.move(away(tR, th + b, 0.32));
          dR.visible = show; dR.set(tR, [0, tR[1], 0]);
          const sb = show && phasor && Math.abs(b) > 1e-6;
          aBeta.visible = sb; lBeta.node.dataset.off = sb ? '' : '1';
          if (sb) { aBeta.set(rBeta, th, b); lBeta.move([CX + (rBeta + 0.2) * Math.cos(th + b / 2), (rBeta + 0.2) * Math.sin(th + b / 2), 0]); }
        },
      };
      const x0 = CX - rMax - 0.2, x1 = M.XLEN + 0.4;      // frame the content with room for the 390 px stage
      stage.setHome({ target: [(x0 + x1) / 2, 0, 0], direction: [0, 0.06, 1], distance: 1.12 * (x1 - x0), minDistance: 3, maxDistance: 80 });
      return { legend: [{ label: '변위와 phasor (displacement)', color: '#000000' }, { label: '줄 (resultant wave)', color: '#b08a5a' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
