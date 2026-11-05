// 20.4 3D view. Left: a glass box split into two halves by a dashed frame, with the molecules (grey balls, one
// instanced mesh) and the counts n1, n2 above each half. Right: a graph board.
// count:  the board is a histogram drawn after the check. Light blue bars (#56B4E9, black outline) are the fraction of
//         snapshots so far with each n1. Black bars are the probability W/2^N. The chosen configuration is marked.
// expand: a partition holds the molecules on the left until T_OPEN. After the check the board shows S(t) = k ln W(n1(t))
//         in 10⁻²³ J/K (black line) and S_f of (N/2, N/2) (black dotted line). Entropy has no colour in
//         05_디자인_기준.md and no other quantity is drawn here, so it uses black.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { dashLine } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const BX = -4.4, BY = 0.25, FILL = 0x56b4e9;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function box(Nm, r) {
    const { L, H, D } = M.BOX, cx = BX + L / 2, cy = BY + H / 2;
    stage.floorPlane(0);
    stage.mesh(stage.group, new THREE.BoxGeometry(L + 0.3, BY, D + 0.3), stage.lit(0x40546a, 0.3, 0.5), [cx, BY / 2, 0]);
    stage.mesh(stage.group, new THREE.BoxGeometry(L, H, D), new THREE.MeshStandardMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.2, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide }), [cx, cy, 0], [0, 0, 0], false);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, D)), new THREE.LineBasicMaterial({ color: 0x40546a }));
    edges.position.set(cx, cy, 0); stage.group.add(edges);
    const xm = BX + L / 2;
    for (const [a, b] of [[[xm, BY, D / 2], [xm, BY + H, D / 2]], [[xm, BY + H, D / 2], [xm, BY + H, -D / 2]], [[xm, BY, -D / 2], [xm, BY + H, -D / 2]]]) dashLine(stage, a, b, 0x40546a, { dash: 0.1, gap: 0.08, overlay: false });
    const mols = new THREE.InstancedMesh(new THREE.SphereGeometry(r, Nm > 100 ? 8 : 14, Nm > 100 ? 6 : 10), stage.lit(0x33475b, 0.2, 0.45), Nm);
    mols.frustumCulled = false; stage.group.add(mols);
    const lab1 = stage.label('', [BX + 0.2 * L, BY + H + 0.42, 0], 'axis', { dy: 0, priority: 2 });
    const lab2 = stage.label('', [BX + 0.8 * L, BY + H + 0.42, 0], 'axis', { dy: 0, priority: 2 });
    const mtx = new THREE.Matrix4();
    return {
      set(o) {
        o.mol.forEach((m, i) => mols.setMatrixAt(i, mtx.makeTranslation(BX + m[0], BY + m[1], m[2] - D / 2)));
        mols.count = o.mol.length; mols.instanceMatrix.needsUpdate = true;
        lab1.set(tex(`n_1 = ${o.n1}`)); lab2.set(tex(`n_2 = ${o.n2}`));
      },
    };
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const quiz = quizBox(ctx.panel, '예측');
      stage.setHome({ target: [0.35, 1.9, 0], direction: [0.05, 0.18, 1], distance: 12, minDistance: 4, maxDistance: 40 });
      return p.activity === 'expand' ? buildExpand(p, quiz) : buildCount(p, quiz);
    },
    render(o) { if (cur) cur.render(o); },
  };

  // ---------------- count ----------------
  function buildCount(p, quiz) {
    const Nn = p.N, n1 = p.n1, W = M.multiplicity(n1, Nn), P = 100 * W / 2 ** Nn;
    const bx = box(M.NMAX_COUNT, M.rm(Nn));
    const pmax = Math.max(...Array.from({ length: Nn + 1 }, (_, n) => M.probability(n, Nn))) * 100;
    const yr = niceRange(0, pmax * 1.4, { target: 4 });
    const gb = graphBoard(stage, { origin: [-0.4, 0.2, -0.6], width: 5.6, height: 3.6, t: [-0.6, Nn + 0.6], tStep: 1, y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>n</i><sub>1</sub>', yTitle: '비율과 확률 (%)' });
    const half = Math.min(0.32, 0.32 * 12 / Math.max(Nn, 6)), zf = gb.Z + 0.01;
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.02), stage.flat(FILL, { transparent: true, opacity: 0.85 }), Nn + 1);
    const opos = new Float32Array((Nn + 1) * 24), ogeo = new THREE.BufferGeometry();
    ogeo.setAttribute('position', new THREE.BufferAttribute(opos, 3));
    const outline = new THREE.LineSegments(ogeo, new THREE.LineBasicMaterial({ color: 0x000000 }));
    const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.03), stage.flat(0x000000), Nn + 1);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), P3 = new THREE.Vector3(), S3 = new THREE.Vector3();
    for (let n = 0; n <= Nn; n++) {
      const x0 = gb.X(n - half), x1 = gb.X(n + half), y = gb.Y(Math.min(M.probability(n, Nn) * 100, yr.max));
      marks.setMatrixAt(n, mtx.compose(P3.set((x0 + x1) / 2, y, zf + 0.02), q, S3.set(x1 - x0 + 0.12, 0.06, 1)));
    }
    for (const m of [bars, outline, marks]) { m.frustumCulled = false; m.visible = false; gb.group.add(m); }
    const pick = stage.label('고른 배열', [gb.X(n1), gb.Y(Math.min(P, yr.max)) + 0.35, zf], 'tag', { dy: 0, priority: 1 });
    pick.node.dataset.off = '1';
    const hit = stage.label('고른 배열이 나왔다', [BX + M.BOX.L / 2, BY - 0.05, M.BOX.D / 2 + 0.2], 'station', { dy: 12, priority: 2 });

    quiz.text(`구별되지 않는 분자 ${tex(`N = ${Nn}`)}개가 상자의 왼쪽 반이나 오른쪽 반에 있다. 재생하면 미시 상태 (microstate)를 찍은 스냅샷을 차례로 보인다. 재생하기 전에 구해 보자.`);
    quiz.text(`① 배열 ${tex(`(n_1, n_2) = (${n1}, ${Nn - n1})`)}의 배치 수 ${tex('W')}`, 'pred');
    const wi = quiz.answer({ label: '배치 수', placeholder: '예 10', onEnter: () => check() });
    quiz.text(`② 이 배열이 나올 확률`, 'pred');
    const pi = quiz.answer({ label: '확률', unit: '%', placeholder: '예 15', onEnter: () => check() });
    const check = () => {
      const r = M.checkCount(p, { wText: wi.value, pText: pi.value });
      if (r.wReason === 'unreadable' || r.pReason === 'unreadable') { quiz.feedback(false, '①과 ②를 숫자로 적자. 예 12.5'); return; }
      const hw = { oneFactorial: `${tex('n_1!')}과 ${tex('n_2!')} 둘 다로 나눈다.`, noDivide: `분자는 구별되지 않으므로 ${tex('n_1!\\,n_2!')}로 나눈다.`, total: `그 값은 모든 미시 상태의 수 ${tex('2^N')}이다.`, value: `${tex('W = N!/(n_1!\\,n_2!)')} (20.4.1)이다.` }[r.wReason] ?? '';
      const hp = { equalConfig: '배열마다 확률이 같지는 않다. 미시 상태마다 확률이 같다.', oneMicro: `그 값은 미시 상태 하나의 확률이다. 이 배열에는 미시 상태가 ${tex('W')}개 있다.`, value: `미시 상태 ${tex('2^N')}개가 모두 같은 확률이므로 ${tex('W/2^N')}이다.` }[r.pReason] ?? '';
      quiz.feedback(r.ok, `${r.ok ? '맞다.' : [hw, hp].filter(Boolean).join(' ')}<br>${tex(`W = \\dfrac{${Nn}!}{${n1}!\\,${Nn - n1}!} = ${W}`)}<br>${tex(`P = \\dfrac{W}{2^{${Nn}}} = \\dfrac{${W}}{${2 ** Nn}} = ${N(P)}\\%`)}`);
      if (!ui.revealed) { for (const m of [bars, outline, marks]) m.visible = true; pick.node.dataset.off = ''; }
      ui.revealed = true; ctx.refresh();
    };
    quiz.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        bx.set(o);
        hit.node.dataset.off = o.n1 === n1 ? '' : '1';
        if (!ui.revealed) return;
        for (let n = 0; n <= Nn; n++) {
          const v = Math.min(o.hist[n] / o.seen * 100, yr.max), x0 = gb.X(n - half), x1 = gb.X(n + half), y0 = gb.Y(0), y1 = gb.Y(v), h = Math.max(y1 - y0, 1e-4);
          bars.setMatrixAt(n, mtx.compose(P3.set((x0 + x1) / 2, (y0 + y1) / 2, zf), q, S3.set(x1 - x0, h, 1)));
          opos.set([x0, y0, zf + 0.012, x1, y0, zf + 0.012, x1, y0, zf + 0.012, x1, y1, zf + 0.012, x1, y1, zf + 0.012, x0, y1, zf + 0.012, x0, y1, zf + 0.012, x0, y0, zf + 0.012], n * 24);
        }
        bars.instanceMatrix.needsUpdate = true; ogeo.attributes.position.needsUpdate = true;
      },
    };
    return { legend: [] };
  }

  // ---------------- expand ----------------
  function buildExpand(p, quiz) {
    const Nn = p.NB, Smax = M.S23(Nn / 2, Nn), Sst = M.K_B * Nn * Math.LN2 / 1e-23;
    const bx = box(Nn, M.rm(Nn));
    const wall = stage.mesh(stage.group, new THREE.BoxGeometry(0.06, M.BOX.H, M.BOX.D), new THREE.MeshStandardMaterial({ color: 0x7a8795, transparent: true, opacity: 0.75, roughness: 0.5 }), [BX + M.BOX.L / 2, BY + M.BOX.H / 2, 0], [0, 0, 0], false);
    const yr = niceRange(0, Smax * 1.2, { target: 4 });
    const gb = graphBoard(stage, { origin: [-0.4, 0.2, -0.6], width: 5.6, height: 3.6, t: [0, M.RUN_EXPAND], tStep: 1, y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>t</i> (s)', yTitle: '<i>S</i> (10⁻²³ J/K)' });

    quiz.text(`구별되지 않는 분자 ${tex(`N = ${Nn}`)}개가 처음에 상자의 왼쪽 반에만 있다. 칸막이를 치우면 분자가 상자 전체로 퍼진다. 재생하기 전에 구해 보자.`);
    quiz.text(`① 배열이 ${tex('(N, 0)')}에서 ${tex('(N/2, N/2)')}가 될 때 엔트로피 변화 ${tex('S_f - S_i')}`, 'pred');
    const si = quiz.answer({ label: '엔트로피 변화', unit: '× 10⁻²³ J/K', placeholder: '예 30', onEnter: () => check() });
    const check = () => {
      const r = M.checkExpand(p, { sText: si.value });
      if (r.reason === 'unreadable') { quiz.feedback(false, '①을 숫자로 적자. 예 30.5'); return; }
      const hint = { stirling: `Stirling 근사 (Stirling’s approximation)로 구한 ${tex('Nk\\ln 2')}는 ${tex('N')}이 클 때 맞다. 이 ${tex('N')}에서는 ${tex('W')}를 그대로 계산하자.`, log10: `자연로그 ${tex('\\ln')}을 쓴다.`, noK: `볼츠만 상수 ${tex('k')}를 곱하자.`, units: `답은 ${tex('10^{-23}\\ \\mathrm{J/K}')} 단위로 적는다.`, value: `${tex('S = k\\ln W')} (20.4.2)이고 처음 배열의 ${tex('W_i = 1')}이다.` }[r.reason] ?? '';
      quiz.feedback(r.ok, `${r.ok ? '맞다.' : hint}<br>${tex(`S_f - S_i = k\\ln\\dfrac{N!}{(N/2)!\\,(N/2)!} - k\\ln 1 = ${N(Smax)}\\times10^{-23}\\ \\mathrm{J/K}`)}<br>Stirling 근사 ${tex(`Nk\\ln 2 = ${N(Sst)}\\times10^{-23}\\ \\mathrm{J/K}`)} (차이 ${N(100 * (Sst - Smax) / Smax, 2)}%)`);
      if (!ui.revealed) {
        gb.curve(t => M.S23(M.spread(t, Nn).n1, Nn), { color: 0x000000, samples: 240, tag: v => `${tex('S')} ${fmt(v, { zero: 1e-9 })}` });
        gb.curve(() => Smax, { color: 0x000000, dotted: true, dot: false });
        stage.label(tex('S_f'), [gb.X(M.RUN_EXPAND) + 0.35, gb.Y(Smax), gb.Z], 'gtitle', { dy: 0, priority: 2 });
      }
      ui.revealed = true; ctx.refresh();
    };
    quiz.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        bx.set(o);
        wall.visible = o.t <= M.T_OPEN;
        gb.setTime(o.t);
      },
    };
    return { legend: [] };
  }
}
