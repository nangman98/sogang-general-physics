// 14.6–14.7 3D view. Scene unit = 1 m along the pipe and in height; radii are drawn 8 times larger (RK).
// A translucent pipe (wide part, rising taper, narrow part) with tracer particles moving at the local speed R_V/A,
// spread over three streamlines. Velocity arrows (#0072B2) at the two sections; v⃗2 appears after the check. Pressure
// tags at the sections; after the check a graph board behind the pipe shows p(x).
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const RK = 8;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false;
      const s = M.flow(p), box = quizBox(ctx.panel, '예측'), Y0 = 0.9;
      stage.floorPlane(-0.02);
      const glass = new THREE.MeshStandardMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.25, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
      const water = new THREE.MeshStandardMaterial({ color: 0x56b4e9, transparent: true, opacity: 0.3, roughness: 0.4, depthWrite: false });
      // Pipe as a lathe-like tube built from rings along the axis.
      const N0 = 120, pts = [];
      for (let i = 0; i <= N0; i++) { const x = M.L * i / N0, sh = M.shape(x, p); pts.push({ x, y: Y0 + sh.y, r: sh.r * RK }); }
      const tube = (scale, mat) => {
        const pos = [], idx = [], seg = 32;
        pts.forEach((q, i) => { for (let j = 0; j <= seg; j++) { const a = 2 * Math.PI * j / seg; pos.push(q.x, q.y + q.r * scale * Math.cos(a), q.r * scale * Math.sin(a)); } });
        for (let i = 0; i < N0; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        const m = new THREE.Mesh(g, mat); stage.group.add(m); return m;
      };
      tube(1.04, glass); tube(0.98, water);
      // Supports.
      for (const x of [0.6, M.L - 0.6]) { const sh = M.shape(x, p); stage.mesh(stage.group, new THREE.BoxGeometry(0.12, Y0 + sh.y - sh.r * RK, 0.5), stage.lit(0x6f8091, 0.5, 0.4), [x, (Y0 + sh.y - sh.r * RK) / 2, 0]); }
      // Tracer particles on three streamlines.
      const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 12, 8), stage.lit(0x40546a, 0.2, 0.6), M.NP);
      stage.group.add(dots);
      const mtx = new THREE.Matrix4();
      const V1 = vecArrow(stage, 0x0072b2, { radius: 0.04 }), V2 = vecArrow(stage, 0x0072b2, { radius: 0.04 });
      const VS = 0.45, sh1 = M.shape(1.5, p), sh2 = M.shape(6.5, p);
      V1.update([1.5, Y0 + sh1.r * RK + 0.35, 0], [1, 0, 0], p.v1 * VS);
      stage.label(tex('\\vec v_1'), [1.5 + p.v1 * VS + 0.3, Y0 + sh1.r * RK + 0.35, 0], 'qty', { dy: 0, priority: 2 });
      V2.update([6.5, Y0 + p.dy + sh2.r * RK + 0.35, 0], [1, 0, 0], 0);
      const lv2 = stage.label(tex('\\vec v_2'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }); lv2.node.dataset.off = '1';
      stage.label(`<i>p</i><sub>1</sub> = ${fmt(p.p1)} kPa`, [1.5, Y0 - sh1.r * RK - 0.45, 0], 'tag', { dy: 0, priority: 1 });
      const p2tag = stage.label('<i>p</i><sub>2</sub> = ?', [6.5, Y0 + p.dy - sh2.r * RK - 0.45, 0], 'tag', { dy: 0, priority: 1 });
      if (p.dy > 0) stage.label(`Δ<i>y</i> = ${fmt(p.dy)} m`, [M.L + 0.7, Y0 + p.dy / 2, 0], 'tag', { dy: 0, priority: 0 });
      const all = Array.from({ length: 81 }, (_, i) => M.at_x(M.L * i / 80, p).p / 1e3), lo = Math.min(...all, 0), hi = Math.max(...all);
      const yr = niceRange(lo, hi * 1.05, { target: 4 });
      const gb = graphBoard(stage, { origin: [-0.6, Y0 + p.dy + 1.1, -1.4], width: 9.2, height: 3.4, t: [0, M.L], y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>x</i> (m)', yTitle: '<i>p</i> (kPa)' });
      let curve = null;

      box.text(`넓은 관 (${tex(`A_1 = ${N(p.A1)}\\ \\mathrm{cm^2}`)})에서 물이 ${tex(`v_1 = ${N(p.v1)}\\ \\mathrm{m/s}`)}, 계기 압력 ${tex(`p_1 = ${N(p.p1)}\\ \\mathrm{kPa}`)}로 흐른다. 좁은 관은 ${tex(`A_2 = ${N(p.A2)}\\ \\mathrm{cm^2}`)}이고 ${tex(`\\Delta y = ${N(p.dy)}\\ \\mathrm{m}`)} 높다. 재생하기 전에 구해 보자.`);
      box.text(`① 좁은 관의 속력 ${tex('v_2')}`, 'pred');
      const vi = box.answer({ label: '좁은 관의 속력', unit: 'm/s', placeholder: '예 2.5', onEnter: () => check() });
      box.text(`② 좁은 관의 계기 압력 ${tex('p_2')}`, 'pred');
      const pi = box.answer({ label: '좁은 관의 계기 압력', unit: 'kPa', placeholder: '예 40', onEnter: () => check() });
      const check = () => {
        const r = M.check(p, { vText: vi.value, pText: pi.value });
        if (r.vReason === 'unreadable' || r.pReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 2.5'); return; }
        const hv = { inverse: `넓이 비를 거꾸로 썼다. 좁은 곳에서 더 빠르다.`, same: `${tex('R_V = A_1v_1 = A_2v_2')}가 같으므로 속력이 바뀐다.`, value: `${tex('v_2 = v_1A_1/A_2')} (14.6.3)이다.` }[r.vReason] ?? '';
        const hp = { noHeight: `높이 차의 ${tex('\\rho g\\Delta y')}도 넣자.`, sign: '빠른 곳의 압력이 더 낮다. 부호를 확인하자.', same: '속력과 높이가 바뀌면 압력도 바뀐다.', value: `${tex('p_1 + \\tfrac{1}{2}\\rho v_1^2 = p_2 + \\tfrac{1}{2}\\rho v_2^2 + \\rho g\\Delta y')}다.` }[r.pReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hv, hp].filter(Boolean).join(' ')}<br>${tex(`v_2 = v_1\\dfrac{A_1}{A_2} = ${N(s.v2)}\\ \\mathrm{m/s}`)}<br>${tex(`p_2 = p_1 + \\tfrac{1}{2}\\rho(v_1^2 - v_2^2) - \\rho g\\Delta y = ${N(s.p2 / 1e3)}\\ \\mathrm{kPa}`)}`);
        V2.update([6.5, Y0 + p.dy + sh2.r * RK + 0.35, 0], [1, 0, 0], s.v2 * VS);
        lv2.node.dataset.off = ''; lv2.move([6.5 + s.v2 * VS + 0.3, Y0 + p.dy + sh2.r * RK + 0.35, 0]);
        p2tag.set(`<i>p</i><sub>2</sub> = ${fmt(s.p2 / 1e3)} kPa`);
        if (!curve) curve = gb.curve(x => M.at_x(x, p).p / 1e3, { color: 0x000000, dot: false });
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      const offs = [-0.5, 0, 0.5];
      cur = {
        render(o) {
          o.x.forEach((x, k) => {
            const sh = M.shape(x, p), off = offs[k % 3] * sh.r * RK;
            mtx.makeTranslation(x, Y0 + sh.y + off * 0.6, off); dots.setMatrixAt(k, mtx);
          });
          dots.instanceMatrix.needsUpdate = true;
          if (curve) curve.update(M.L);
        },
      };
      stage.setHome({ target: [4, Y0 + p.dy / 2 + 1.7, 0], direction: [0.05, 0.25, 1], distance: 14.5, minDistance: 3, maxDistance: 40 });
      return { legend: [{ label: '속도 (velocity)', color: '#0072b2' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
