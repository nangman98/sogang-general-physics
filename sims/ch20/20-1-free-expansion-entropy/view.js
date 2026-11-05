// 20.1 3D view. Left: insulated box for the free expansion, with N_MOL molecules and a partition removed at T_OPEN.
// Right: cylinder on a thermal reservoir. The piston carries lead shot (count drawn in proportion to the pressure) and
// rises from V_i to V_f. Behind the box: p–V graph board with the reversible isotherm from i to f. After the check the
// area under the path (= W = Q) fills (#E69F00, black outline). Heat Q from the reservoir is #D55E00 (thermal energy
// shares the force colour, 05_디자인_기준.md) and grey "= ?" before the check. Both containers are drawn with the same
// size at V_f, so the initial chamber or gas column is 1/r of it.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, GREY, UNKNOWN_LENGTH } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const HEAT = 0xd55e00, FILL = 0xe69f00;
const BX = -4.8, BY = 0.25;                      // free-expansion box: left end and bottom (z centred on 0)
const CX = 1.3, RES = 0.5, CR = 0.7, HF = 3.2;   // cylinder axis x, reservoir top, radius, gas height at V_f
const SHOT = 30, SR = 0.085;

// Lead shot spots on the piston top, centre first, so removing from the end of the list takes the outer ones first.
const SPOTS = (() => {
  const s = [[0, 0]];
  for (const [rr, k] of [[0.2, 6], [0.4, 12], [0.58, 11]]) for (let i = 0; i < k; i++) s.push([rr * Math.cos(2 * Math.PI * i / k), rr * Math.sin(2 * Math.PI * i / k)]);
  return s.slice(0, SHOT);
})();

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // Tube through board points (x increasing), drawn solid up to upTo(x) and faint after, like core/graph3d.js curves.
  function pathTube(board, pts, color) {
    const W = ([x, y]) => new THREE.Vector3(...board.at(x, y));
    const path = new THREE.CurvePath();
    for (let i = 1; i < pts.length; i++) path.add(new THREE.LineCurve3(W(pts[i - 1]), W(pts[i])));
    const tubular = pts.length * 2, radial = 8;
    const geo = new THREE.TubeGeometry(path, tubular, 0.045, radial, false);
    stage.mesh(board.group, geo, stage.flat(color), [0, 0, 0], [0, 0, 0], false);
    stage.mesh(board.group, new THREE.TubeGeometry(path, tubular, 0.036, radial, false), stage.flat(color, { transparent: true, opacity: 0.22, depthWrite: false }), [0, 0, 0], [0, 0, 0], false);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + W(pts[i]).distanceTo(W(pts[i - 1])));
    const total = cum[cum.length - 1] || 1;
    return {
      upTo(x) {
        let i = 0;
        while (i < pts.length - 2 && pts[i + 1][0] <= x) i++;
        const f = Math.min(Math.max((x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]), 0), 1), len = cum[i] + (cum[i + 1] - cum[i]) * f;
        geo.setDrawRange(0, Math.round(len / total * tubular) * radial * 6);
      },
    };
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const g = M.gas(p), box = quizBox(ctx.panel, '예측'), Li = M.BOX.L / p.r;
      stage.floorPlane(0);

      // ---------- free-expansion box ----------
      const cxBox = BX + M.BOX.L / 2, cyBox = BY + M.BOX.H / 2;
      stage.mesh(stage.group, new THREE.BoxGeometry(M.BOX.L + 0.3, BY, M.BOX.D + 0.3), stage.lit(0x40546a, 0.3, 0.5), [cxBox, BY / 2, 0]);
      const glass = new THREE.MeshStandardMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.2, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
      stage.mesh(stage.group, new THREE.BoxGeometry(M.BOX.L, M.BOX.H, M.BOX.D), glass, [cxBox, cyBox, 0], [0, 0, 0], false);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(M.BOX.L, M.BOX.H, M.BOX.D)), new THREE.LineBasicMaterial({ color: 0x40546a }));
      edges.position.set(cxBox, cyBox, 0); stage.group.add(edges);
      const wall = stage.mesh(stage.group, new THREE.BoxGeometry(0.06, M.BOX.H, M.BOX.D), new THREE.MeshStandardMaterial({ color: 0x7a8795, transparent: true, opacity: 0.75, roughness: 0.5 }), [BX + Li, cyBox, 0], [0, 0, 0], false);
      const mols = new THREE.InstancedMesh(new THREE.SphereGeometry(M.RM, 12, 8), stage.lit(0x33475b, 0.2, 0.45), M.N_MOL);
      mols.frustumCulled = false; stage.group.add(mols);
      const vac = stage.label('진공 (vacuum)', [BX + (Li + M.BOX.L) / 2, cyBox, M.BOX.D / 2], 'tag', { dy: 0, priority: 1 });
      stage.label(`자유 팽창 · ${tex('Q = 0,\\ W = 0')}`, [cxBox, BY + M.BOX.H + 0.35, 0], 'station', { dy: 0, priority: 2 });

      // ---------- cylinder on the reservoir ----------
      stage.mesh(stage.group, new THREE.BoxGeometry(2.0, RES, 2.0), stage.lit(0x8a5a44, 0.1, 0.6), [CX, RES / 2, 0]);
      stage.label(`열 저장고 ${tex(`T = ${N(p.T)}\\ \\mathrm{K}`)}`, [CX, RES / 2, 1.05], 'station', { dy: 0, priority: 2 });
      stage.mesh(stage.group, new THREE.CylinderGeometry(CR + 0.04, CR + 0.04, 0.06, 40), stage.lit(0x6f8091, 0.5, 0.4), [CX, RES + 0.03, 0]);
      stage.mesh(stage.group, new THREE.CylinderGeometry(CR + 0.03, CR + 0.03, HF + 0.6, 40, 1, true), glass, [CX, RES + (HF + 0.6) / 2, 0], [0, 0, 0], false);
      const gasCol = stage.mesh(stage.group, new THREE.CylinderGeometry(CR, CR, 1, 40), new THREE.MeshStandardMaterial({ color: 0x9fb6cc, transparent: true, opacity: 0.35, depthWrite: false }), [CX, 0, 0], [0, 0, 0], false);
      const piston = stage.mesh(stage.group, new THREE.CylinderGeometry(CR, CR, 0.14, 40), stage.lit(0x6f8091, 0.55, 0.35), [CX, 0, 0]);
      const shot = new THREE.InstancedMesh(new THREE.SphereGeometry(SR, 14, 10), stage.lit(0x5a6570, 0.6, 0.35), SHOT);
      shot.castShadow = true; stage.group.add(shot);
      const mtx = new THREE.Matrix4();
      stage.label('등온 팽창', [CX, RES + HF + 1.05, 0], 'station', { dy: 0, priority: 2 });
      const heat = vecArrow(stage, GREY, { radius: 0.05 });
      const lq = stage.label(`${tex('Q')} <span class="val">= ?</span>`, [0, 0, 0], 'qty', { dy: 0, priority: 3 });

      // ---------- p–V board ----------
      const xr = niceRange(0, g.Vf, { target: 5 }), yr = niceRange(0, g.pi, { target: 4 });
      const gb = graphBoard(stage, { origin: [-5.0, 2.15, -1.0], width: 4.9, height: 3.4, t: [xr.min, xr.max], tStep: xr.step, y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>V</i> (L)', yTitle: '<i>p</i> (kPa)' });
      const K = 80, iso = Array.from({ length: K + 1 }, (_, k) => { const V = p.Vi + (g.Vf - p.Vi) * k / K; return [V, p.n * M.R * p.T / V]; });
      const tube = pathTube(gb, iso, 0x000000);
      const dotMat = stage.flat(0x000000);
      for (const [V, pp, name, off] of [[p.Vi, g.pi, 'i', [-0.28, -0.12, 0]], [g.Vf, g.pf, 'f', [-0.3, -0.3, 0]]]) {
        stage.mesh(gb.group, new THREE.SphereGeometry(0.09, 16, 12), dotMat, gb.at(V, pp), [0, 0, 0], false);
        stage.label(name, gb.at(V, pp).map((c, i) => c + off[i]), 'axis', { dy: 0, priority: 3 });
      }
      const state = stage.mesh(gb.group, new THREE.SphereGeometry(0.12, 18, 12), stage.flat(0x40546a), gb.at(p.Vi, g.pi), [0, 0, 0], false);
      // Area under the path from V_i to the current V: K strips (6 vertices each) and a black outline.
      const fpos = new Float32Array(K * 18), fgeo = new THREE.BufferGeometry();
      fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
      const fill = new THREE.Mesh(fgeo, new THREE.MeshBasicMaterial({ color: FILL, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      const opos = new Float32Array((K + 4) * 3), ogeo = new THREE.BufferGeometry();
      ogeo.setAttribute('position', new THREE.BufferAttribute(opos, 3));
      const outline = new THREE.Line(ogeo, new THREE.LineBasicMaterial({ color: 0x000000 }));
      for (const m of [fill, outline]) { m.frustumCulled = false; m.visible = false; gb.group.add(m); }
      const areaTag = stage.label(tex('W = Q'), [0, 0, 0], 'tag', { dy: 0, priority: 1 });
      areaTag.node.dataset.off = '1';
      function area(V) {
        const zf = gb.Z + 0.006, P = (v, q) => { const a = gb.at(v, q); return [a[0], a[1], zf]; };
        const pts = Array.from({ length: K + 1 }, (_, k) => { const v = p.Vi + (V - p.Vi) * k / K; return P(v, p.n * M.R * p.T / v); });
        for (let k = 0; k < K; k++) {
          const b0 = P(p.Vi + (V - p.Vi) * k / K, 0), b1 = P(p.Vi + (V - p.Vi) * (k + 1) / K, 0);
          [b0, pts[k], pts[k + 1], b0, pts[k + 1], b1].forEach((v, j) => fpos.set(v, (k * 6 + j) * 3));
        }
        fgeo.attributes.position.needsUpdate = true;
        [P(p.Vi, 0), ...pts, P(V, 0), P(p.Vi, 0)].forEach((v, j) => opos.set([v[0], v[1], zf + 0.002], j * 3));
        ogeo.setDrawRange(0, K + 4); ogeo.attributes.position.needsUpdate = true;
        const mid = p.Vi + 0.4 * (V - p.Vi);
        areaTag.move(gb.at(mid, p.n * M.R * p.T / mid * 0.45));
      }

      // ---------- prediction ----------
      box.text(`${tex(`n = ${N(p.n)}\\ \\mathrm{mol}`)}인 이상 기체가 ${tex(`T = ${N(p.T)}\\ \\mathrm{K}`)}에서 부피 ${tex(`V_i = ${N(p.Vi)}\\ \\mathrm{L}`)}에서 ${tex(`V_f = ${N(g.Vf)}\\ \\mathrm{L}`)}로 팽창한다. 왼쪽은 자유 팽창, 오른쪽은 같은 처음·나중 상태를 잇는 가역 등온 팽창이다. 재생하기 전에 구해 보자.`);
      box.text(`① 등온 팽창에서 기체가 저장고에서 받는 열 ${tex('Q')}`, 'pred');
      const qi = box.answer({ label: '등온 팽창의 열', unit: 'J', placeholder: '예 3000', onEnter: () => check() });
      box.text(`② 자유 팽창에서 기체의 엔트로피 변화 ${tex('\\Delta S')}`, 'pred');
      const si = box.answer({ label: '자유 팽창의 엔트로피 변화', unit: 'J/K', placeholder: '예 10', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { QText: qi.value, SText: si.value });
        if (r.QReason === 'unreadable' || r.SReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 2.5e3'); return; }
        const hq = {
          zero: `온도가 일정해도 열은 들어온다. ${tex('\\Delta E_{\\text{int}} = 0')}이라 ${tex('Q = W')}다.`,
          log10: `자연로그 ${tex('\\ln')}을 쓴다.`,
          isobaric: `압력이 줄어들므로 ${tex('W = p_i\\Delta V')}가 아니다. ${tex('W = \\int p\\,dV')}다.`,
          noN: `몰수 ${tex('n')}을 곱하자.`,
          value: `${tex('Q = W = nRT\\ln(V_f/V_i)')} (19.2.10)이다.`,
        }[r.QReason] ?? '';
        const hs = {
          zero: `자유 팽창은 비가역 과정이라 ${tex('Q = 0')}을 식 (20.1.1)에 바로 넣을 수 없다. 같은 처음·나중 상태를 잇는 가역 과정의 ${tex('\\Delta S')}를 쓴다.`,
          noT: `열 ${tex('Q')}를 온도 ${tex('T')}로 나누자.`,
          sign: '기체가 열을 받는 가역 과정과 같으므로 엔트로피는 늘어난다.',
          log10: `자연로그 ${tex('\\ln')}을 쓴다.`,
          value: `엔트로피는 상태 함수 (state function)다. 등온 팽창의 ${tex('\\Delta S = Q/T')}와 같다.`,
        }[r.SReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hq, hs].filter(Boolean).join(' ')}<br>${tex(`Q = nRT\\ln\\dfrac{V_f}{V_i} = ${N(g.Q)}\\ \\mathrm{J}`)}<br>${tex(`\\Delta S = \\dfrac{Q}{T} = nR\\ln\\dfrac{V_f}{V_i} = ${N(g.dS)}\\ \\mathrm{J/K}`)} (두 과정 모두)`);
        if (!ui.revealed) { heat.mat.color.setHex(HEAT); lq.set(tex('Q')); fill.visible = outline.visible = true; }
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          // Free expansion.
          o.mol.forEach((m, i) => mols.setMatrixAt(i, mtx.makeTranslation(BX + m[0], BY + m[1], m[2] - M.BOX.D / 2)));
          mols.instanceMatrix.needsUpdate = true;
          wall.visible = !o.open; vac.node.dataset.off = o.open ? '1' : '';
          // Isothermal expansion.
          const h = HF * o.V / g.Vf;
          gasCol.scale.set(1, h, 1); gasCol.position.set(CX, RES + 0.06 + h / 2, 0);
          const top = RES + 0.06 + h;
          piston.position.set(CX, top + 0.07, 0);
          const n = Math.max(1, Math.round(SHOT * o.p / g.pi));
          for (let i = 0; i < n; i++) shot.setMatrixAt(i, mtx.makeTranslation(CX + SPOTS[i][0], top + 0.14 + SR, SPOTS[i][1]));
          shot.count = n; shot.instanceMatrix.needsUpdate = true;
          const L = ui.revealed ? (o.Q > 1e-9 ? 0.25 + 1.25 * o.Q / g.Q : 0) : (o.s > 0 ? UNKNOWN_LENGTH : 0);
          heat.update([CX + 0.35, 0.3, CR + 0.2], [0, 1, 0], L);
          lq.node.dataset.off = L > 0.02 ? '' : '1';
          if (ui.revealed) lq.set(`${tex('Q')} <span class="val">${fmt(o.Q)} J</span>`);
          lq.move([CX + 0.35, 0.3 + L + 0.3, CR + 0.2]);
          // p–V board.
          tube.upTo(o.V);
          state.position.set(...gb.at(o.V, o.p));
          if (ui.revealed) area(o.V);
          areaTag.node.dataset.off = ui.revealed && o.s > 0.3 ? '' : '1';
        },
      };
      stage.setHome({ target: [-1.35, 2.75, 0], direction: [0.06, 0.16, 1], distance: 11, minDistance: 4, maxDistance: 40 });
      return { legend: [{ label: '열 (heat)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
