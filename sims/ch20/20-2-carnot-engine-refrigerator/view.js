// 20.2–20.3 3D view. Front row: high-temperature reservoir (left), insulating slab (middle), low-temperature reservoir
// (right) and a cylinder with a weighted piston that moves between them. Heat per cycle (#D55E00, the thermal-energy
// colour shared with force) is drawn as two arrows at the reservoirs with lengths in proportion to |Q|; the arrow of the
// reservoir in use is solid and the other faint. The asked heat is grey "= ?" before the check.
// Back row: p–V board with the cycle (black path, arrowheads for the running direction, a, b, c, d, current state) and
// T–S board. After the check the area inside the p–V cycle (= W) fills #E69F00, and the T–S board shows the rectangle
// with W (#E69F00) above |Q_L| (#56B4E9), both with black outlines.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, GREY, UNKNOWN_LENGTH } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const HEAT = 0xd55e00, FILL_W = 0xe69f00, FILL_Q = 0x56b4e9;
const SX = 3.2;                                   // world x of a station: STATION × SX
const CR = 0.55, HG = 2.4;                        // cylinder radius, gas height at the largest volume
const topOf = x => 0.25 + 0.35 * Math.min(Math.abs(x), 1);   // reservoir top 0.6, slab top 0.25

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // Tube through a list of board points (one draw call per tube).
  function tube(board, pts, color, radius = 0.045) {
    const path = new THREE.CurvePath();
    const W = q => new THREE.Vector3(...board.at(...q));
    for (let i = 1; i < pts.length; i++) path.add(new THREE.LineCurve3(W(pts[i - 1]), W(pts[i])));
    return stage.mesh(board.group, new THREE.TubeGeometry(path, pts.length * 2, radius, 8, false), stage.flat(color), [0, 0, 0], [0, 0, 0], false);
  }
  // Filled band between lower(x) and upper(x) for x in [x0, x1], with a black outline when outline is true.
  function band(board, x0, x1, lower, upper, color, outline = false, K = 120) {
    const zf = board.Z + 0.006, P = (x, y) => { const a = board.at(x, y); return [a[0], a[1], zf]; };
    const pos = [];
    for (let k = 0; k < K; k++) {
      const a = x0 + (x1 - x0) * k / K, b = x0 + (x1 - x0) * (k + 1) / K;
      pos.push(...P(a, lower(a)), ...P(a, upper(a)), ...P(b, upper(b)), ...P(a, lower(a)), ...P(b, upper(b)), ...P(b, lower(b)));
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.frustumCulled = false; board.group.add(m);
    if (outline) {
      const pts = [P(x0, lower(x0)), P(x0, upper(x0)), P(x1, upper(x1)), P(x1, lower(x1)), P(x0, lower(x0))].map(q => new THREE.Vector3(q[0], q[1], zf + 0.002));
      board.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x000000 })));
    }
    return m;
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const engine = p.activity !== 'fridge', c = M.cycle(p), list = M.strokes(p), box = quizBox(ctx.panel, '예측');
      stage.floorPlane(0);

      // ---------- reservoirs, slab, cylinder ----------
      stage.mesh(stage.group, new THREE.BoxGeometry(2.1, 0.6, 1.8), stage.lit(0x9c5a44, 0.1, 0.6), [-SX, 0.3, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(1.7, 0.25, 1.6), stage.lit(0xd8d2c4, 0, 0.85), [0, 0.125, 0]);
      stage.mesh(stage.group, new THREE.BoxGeometry(2.1, 0.6, 1.8), stage.lit(0x5f7486, 0.1, 0.6), [SX, 0.3, 0]);
      // Short names so the labels do not cover the reservoirs on a 390 px screen; the panel text names them in full.
      stage.label(tex(`T_H = ${N(c.TH)}\\ \\mathrm{K}`), [-SX, 0.32, 0.95], 'station', { dy: 0, priority: 2 });
      stage.label('단열판', [0, 0.12, 0.85], 'station', { dy: 6, priority: 2 });
      stage.label(tex(`T_L = ${N(c.TL)}\\ \\mathrm{K}`), [SX, 0.32, 0.95], 'station', { dy: 0, priority: 2 });

      const cyl = new THREE.Group(); stage.group.add(cyl);
      const glass = new THREE.MeshStandardMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
      stage.mesh(cyl, new THREE.CylinderGeometry(CR + 0.06, CR + 0.06, 0.08, 40), stage.lit(0x6f8091, 0.5, 0.4), [0, 0.04, 0]);
      stage.mesh(cyl, new THREE.CylinderGeometry(CR + 0.03, CR + 0.03, HG + 0.5, 40, 1, true), glass, [0, 0.08 + (HG + 0.5) / 2, 0], [0, 0, 0], false);
      const gasCol = stage.mesh(cyl, new THREE.CylinderGeometry(CR, CR, 1, 40), new THREE.MeshStandardMaterial({ color: 0x9fb6cc, transparent: true, opacity: 0.4, depthWrite: false }), [0, 0, 0], [0, 0, 0], false);
      const piston = new THREE.Group(); cyl.add(piston);
      stage.mesh(piston, new THREE.CylinderGeometry(CR, CR, 0.12, 40), stage.lit(0x6f8091, 0.55, 0.35), [0, 0.06, 0]);
      stage.mesh(piston, new THREE.BoxGeometry(0.62, 0.34, 0.62), stage.lit(0x3d4a57, 0.4, 0.45), [0, 0.29, 0]);
      const Hof = V => HG * V / c.V.c;

      // Heat arrows: at the hot reservoir and at the cold one, into the gas or out of it.
      const S = 1.9 / c.QH;
      const askedH = !engine, askedL = engine;      // engine asks |Q_L|, refrigerator asks |Q_H| (through |W|)
      const mk = (asked, name, val) => {
        const a = vecArrow(stage, asked ? GREY : HEAT, { radius: 0.06 });
        const l = stage.label(`${tex(name)} <span class="val">${asked ? '= ?' : `${fmt(val)} J`}</span>`, [0, 0, 0], 'qty', { dy: 0, priority: 3 });
        return { a, l, asked, name, val };
      };
      const hH = mk(askedH, '|Q_H|', c.QH), hL = mk(askedL, '|Q_L|', c.QL);
      const into = engine ? { hot: true, cold: false } : { hot: false, cold: true };   // heat flows into the gas?
      function placeHeat(h, x, inGas) {
        const L = h.asked && !ui.revealed ? UNKNOWN_LENGTH : h.val * S, x0 = x + Math.sign(x) * 0.7, y0 = 0.62;
        if (inGas) h.a.update([x0, y0, 0.6], [0, 1, 0], L); else h.a.update([x0, y0 + L, 0.6], [0, -1, 0], L);
        h.l.move([x0, y0 + L + 0.3, 0.6]);
      }
      placeHeat(hH, -SX, into.hot); placeHeat(hL, SX, into.cold);

      // ---------- p–V board ----------
      // Axes start near the cycle, not at 0, so the enclosed area fills the plot (only the enclosed area matters here).
      const dV = c.V.c - c.V.a, dP = c.P.a - c.P.c;
      const vr = niceRange(Math.max(0, c.V.a - 0.15 * dV), c.V.c, { target: 5, includeZero: false }), pr = niceRange(c.P.c, c.P.a + 0.12 * dP, { target: 5, includeZero: false });
      const pv = graphBoard(stage, { origin: [-5.8, 4.2, -1.4], width: 5.5, height: 3.6, t: [vr.min, vr.max], tStep: vr.step, y: [pr.min, pr.max], yStep: pr.step, tTitle: '<i>V</i> (L)', yTitle: '<i>p</i> (kPa)' });
      const pts = [], mids = [];
      for (const s of list) {
        const K = 40;
        for (let k = 0; k <= K; k++) {
          const f = k / K, V = c.V[s[0]] * (c.V[s[1]] / c.V[s[0]]) ** f;
          const T = s[2] === 'iso' ? c.T[s[0]] : c.T[s[0]] * (c.V[s[0]] / V) ** (M.GAMMA - 1);
          pts.push([V, p.n * M.R * T / V]);
        }
        mids.push(pts.length - 1 - 20);
      }
      tube(pv, pts, 0x000000, 0.04);
      // Arrowheads at the middle of each stroke, pointing the running way.
      const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(0.11, 0.3, 16), stage.flat(0x000000), 4), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      mids.forEach((i, k) => {
        const A = new THREE.Vector3(...pv.at(...pts[i - 1])), B = new THREE.Vector3(...pv.at(...pts[i + 1]));
        q.setFromUnitVectors(up, B.clone().sub(A).normalize());
        cones.setMatrixAt(k, mtx.compose(new THREE.Vector3(...pv.at(...pts[i])), q, new THREE.Vector3(1, 1, 1)));
      });
      cones.frustumCulled = false; pv.group.add(cones);
      for (const [s, dx, dy] of [['a', -0.22, 0.18], ['b', 0.24, 0.22], ['c', 0.26, -0.18], ['d', -0.24, -0.22]]) {
        const at = pv.at(c.V[s], c.P[s]);
        stage.label(s, [at[0] + dx, at[1] + dy, at[2]], 'axis', { dy: 0, priority: 1 });
      }
      const dotPV = stage.mesh(pv.group, new THREE.SphereGeometry(0.13, 18, 12), stage.flat(0x40546a), pv.at(c.V.a, c.P.a), [0, 0, 0], false);
      const upper = V => (V <= c.V.b ? p.n * M.R * c.TH / V : c.P.b * (c.V.b / V) ** M.GAMMA);
      const lower = V => (V <= c.V.d ? c.P.a * (c.V.a / V) ** M.GAMMA : p.n * M.R * c.TL / V);

      // ---------- T–S board (cycle drawn after the check) ----------
      const sr = niceRange(0, c.dSH, { target: 4 }), tr = niceRange(0, c.TH, { target: 4 });
      const ts = graphBoard(stage, { origin: [0.5, 4.2, -1.4], width: 5.3, height: 3.6, t: [sr.min, sr.max], tStep: sr.step, y: [tr.min, tr.max], yStep: tr.step, tTitle: '<i>S</i> (J/K)', yTitle: '<i>T</i> (K)' });
      let dotTS = null;
      function revealBoards() {
        band(pv, c.V.a, c.V.c, lower, upper, FILL_W);
        // Name of the shaded area in the empty upper right of the plot, clear of the corner names.
        stage.label(`넓이 = ${engine ? tex('W') : tex('|W|')}`, pv.at(vr.max - 0.22 * (vr.max - vr.min), pr.max - 0.2 * (pr.max - pr.min)), 'tag', { dy: 0, priority: 1 });
        band(ts, 0, c.dSH, () => c.TL, () => c.TH, FILL_W);
        band(ts, 0, c.dSH, () => 0, () => c.TL, FILL_Q, true);
        tube(ts, [[0, c.TH], [c.dSH, c.TH], [c.dSH, c.TL], [0, c.TL], [0, c.TH]], 0x000000, 0.035);
        stage.label(engine ? tex('W') : tex('|W|'), ts.at(c.dSH / 2, (c.TH + c.TL) / 2), 'tag', { dy: 0, priority: 1 });
        stage.label(tex('|Q_L|'), ts.at(c.dSH / 2, c.TL / 2), 'tag', { dy: 0, priority: 1 });
        for (const [s, x, y, dx, dy] of [['a', 0, c.TH, -0.22, 0.2], ['b', c.dSH, c.TH, 0.22, 0.2], ['c', c.dSH, c.TL, 0.22, -0.2], ['d', 0, c.TL, -0.22, -0.2]]) {
          const at = ts.at(x, y); stage.label(s, [at[0] + dx, at[1] + dy, at[2]], 'axis', { dy: 0, priority: 1 });
        }
        dotTS = stage.mesh(ts.group, new THREE.SphereGeometry(0.13, 18, 12), stage.flat(0x40546a), ts.at(0, c.TH), [0, 0, 0], false);
        for (const h of [hH, hL]) if (h.asked) { h.a.mat.color.setHex(HEAT); h.l.set(`${tex(h.name)} <span class="val">${fmt(h.val)} J</span>`); }
        placeHeat(hH, -SX, into.hot); placeHeat(hL, SX, into.cold);
      }

      // ---------- prediction ----------
      const given = `${tex(`n = ${N(p.n)}\\ \\mathrm{mol}`)}인 단원자 이상 기체가 ${tex(`T_H = ${N(c.TH)}\\ \\mathrm{K}`)}와 ${tex(`T_L = ${N(c.TL)}\\ \\mathrm{K}`)} 사이에서 카르노 순환을 `;
      let check;
      if (engine) {
        box.text(`${given}한다. 한 순환에 고온 저장고에서 열 ${tex(`|Q_H| = ${N(c.QH)}\\ \\mathrm{J}`)}를 받는다. 재생하기 전에 구해 보자.`);
        box.text(`① 효율 ${tex('\\varepsilon')} <small>소수나 %로 적는다</small>`, 'pred');
        const ei = box.answer({ label: '효율', placeholder: '예 0.35', onEnter: () => check() });
        box.text(`② 한 순환에 저온 저장고로 버리는 열 ${tex('|Q_L|')}`, 'pred');
        const qi = box.answer({ label: '저온 저장고로 버리는 열', unit: 'J', placeholder: '예 2000', onEnter: () => check() });
        check = () => {
          const r = M.checkEngine(p, { eText: ei.value, qText: qi.value });
          if (r.eReason === 'unreadable' || r.qReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 0.35'); return; }
          const he = { ratio: `그 값은 ${tex('T_L/T_H')}다.`, overL: `${tex('T_L')}이 아니라 ${tex('T_H')}로 나눈다.`, flip: `${tex('T_H')}와 ${tex('T_L')}을 바꿨다.`, value: `${tex('\\varepsilon_C = 1 - T_L/T_H')} (20.2.6)이다.` }[r.eReason] ?? '';
          const hq = { zero: `${tex('|Q_L| = 0')}인 완전 기관 (perfect engine)은 없다.`, same: '두 열이 같으면 한 순환의 일이 0이다.', inverse: `${tex('|Q_H|/T_H = |Q_L|/T_L')}에서 ${tex('|Q_L| = |Q_H|\\,T_L/T_H')}다.`, work: `그 값은 일 ${tex('W = |Q_H| - |Q_L|')}이다.`, value: `한 순환의 엔트로피 변화가 0이므로 ${tex('|Q_H|/T_H = |Q_L|/T_L')} (20.2.3)이다.` }[r.qReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [he, hq].filter(Boolean).join(' ')}<br>${tex(`\\varepsilon_C = 1 - \\dfrac{T_L}{T_H} = ${N(c.eps)}`)}<br>${tex(`|Q_L| = |Q_H|\\dfrac{T_L}{T_H} = ${N(c.QL)}\\ \\mathrm{J}`)}<br>${tex(`W = |Q_H| - |Q_L| = ${N(c.W)}\\ \\mathrm{J}`)}`);
          if (!ui.revealed) { ui.revealed = true; revealBoards(); }
          ctx.refresh();
        };
      } else {
        box.text(`${given}거꾸로 도는 냉동기다. 한 순환에 냉동실에서 열 ${tex(`|Q_L| = ${N(c.QL)}\\ \\mathrm{J}`)}를 뺏는다. 재생하기 전에 구해 보자.`);
        box.text(`① 성능 계수 ${tex('K')}`, 'pred');
        const ki = box.answer({ label: '성능 계수', placeholder: '예 4', onEnter: () => check() });
        box.text(`② 한 순환에 해 주어야 하는 일 ${tex('|W|')}`, 'pred');
        const wi = box.answer({ label: '한 순환에 해 주는 일', unit: 'J', placeholder: '예 300', onEnter: () => check() });
        check = () => {
          const r = M.checkFridge(p, { kText: ki.value, wText: wi.value });
          if (r.kReason === 'unreadable' || r.wReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 4.5'); return; }
          const hk = { hot: `그 값은 ${tex('|Q_H|/|W|')}다. ${tex('K')}는 냉동실에서 뺏는 열 ${tex('|Q_L|')}을 일로 나눈다.`, ratio: `${tex('T_L/T_H')}가 아니라 ${tex('T_L/(T_H - T_L)')}이다.`, engine: `그 값은 기관의 효율 ${tex('1 - T_L/T_H')}다.`, inverse: '분자와 분모를 바꿨다.', value: `${tex('K_C = T_L/(T_H - T_L)')} (20.3.3)이다.` }[r.kReason] ?? '';
          const hw = { zero: '일 없이 차가운 곳에서 뜨거운 곳으로 열을 옮기는 완전 냉동기 (perfect refrigerator)는 없다.', times: `${tex('|W| = |Q_L|/K')}다. ${tex('K')}로 나눈다.`, same: `일이 ${tex('|Q_L|')}과 같으면 ${tex('K = 1')}이다.`, hot: `그 값은 방으로 내놓는 열 ${tex('|Q_H| = |Q_L| + |W|')}다.`, value: `${tex('K = |Q_L|/|W|')} (20.3.1)에서 구하자.` }[r.wReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [hk, hw].filter(Boolean).join(' ')}<br>${tex(`K_C = \\dfrac{T_L}{T_H - T_L} = ${N(c.K)}`)}<br>${tex(`|W| = \\dfrac{|Q_L|}{K_C} = ${N(c.W)}\\ \\mathrm{J}`)}<br>${tex(`|Q_H| = |Q_L| + |W| = ${N(c.QH)}\\ \\mathrm{J}`)}`);
          if (!ui.revealed) { ui.revealed = true; revealBoards(); }
          ctx.refresh();
        };
      }
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          const x = o.x * SX, base = topOf(o.x), h = Hof(o.V);
          cyl.position.set(x, base, 0);
          gasCol.scale.set(1, h, 1); gasCol.position.set(0, 0.08 + h / 2, 0);
          piston.position.set(0, 0.08 + h, 0);
          for (const [hh, at] of [[hH, 'hot'], [hL, 'cold']]) hh.a.mat.opacity = o.heatAt === at ? 1 : hh.asked && !ui.revealed ? 0.75 : 0.4;
          dotPV.position.set(...pv.at(o.V, o.p));
          if (dotTS) dotTS.position.set(...ts.at(o.S, o.T));
        },
      };
      stage.setHome({ target: [0, 3.85, 0], direction: [0, 0.14, 1], distance: 15.5, minDistance: 4, maxDistance: 45 });
      return { legend: [{ label: '열 (heat)', color: '#d55e00' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
