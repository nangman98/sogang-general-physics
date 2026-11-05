// 18.5 3D view. Left: a gas in a glass cylinder with a loaded piston on a thermal reservoir (Fig. 18.5.1); piston
// height is proportional to V. Middle: a p–V graph board; the reference path iaf is a grey dashed line, the asked path
// (or the cycle) a black line with arrowheads, and a black dot marks the state. After the check: the area under each
// segment fills (#E69F00 where V grows, #56B4E9 where it shrinks, the sign colours of core/area3d.js), the heat arrow
// (#D55E00, heat shares the thermal-energy colour) points into or out of the gas as dQ is positive or negative, and an
// energy bar board shows the running Q and W (outline only, as transfers) and ΔE_int (#F0E442, stored energy).
import { texNum as N, fmt } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { barBoard, BAR } from '../../../core/bars3d.js';
import { FILL_POS, FILL_NEG, stepCurve } from '../../../core/area3d.js';
import * as M from './model.js';
import { ui, pathName } from './spec.js';

const HEAT = 0xd55e00;
const RTOP = 0.5, R = 0.55, KV = 0.42, CYL = 2.45;       // reservoir top, cylinder radius, units per L, cylinder height
const PV = { origin: [1.05, 0.05, -0.4], width: 5.4, height: 4.1, t: [0, 6], tStep: 1, y: [0, 500], yStep: 100, tTitle: '<i>V</i> (L)', yTitle: '<i>p</i> (kPa)' };
const BARS = { origin: [6.65, 0.05, -0.4], width: 2.5, height: 4.1 };
const minus = (a, b) => (b < 0 ? `${N(a)} + ${N(-b)}` : `${N(a)} - ${N(b)}`);
const plus = (a, b) => (b < 0 ? `${N(a)} - ${N(-b)}` : `${N(a)} + ${N(b)}`);

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // Fill under each segment of a path up to the playback fraction s (both directions of travel). Segments where V grows
  // fill one mesh (#E69F00), segments where V shrinks another (#56B4E9) drawn in front and less transparent, so in a
  // cycle the overlap reads as cancelled and the enclosed area stays orange (or blue for a negative net work).
  function pvArea(gb, pts) {
    const n = pts.length - 1;
    const sheet = (color, opacity, dz, order) => {
      const pos = new Float32Array(n * 18), geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      m.frustumCulled = false; m.renderOrder = order; gb.group.add(m);
      return { m, geo, pos, z: gb.Z + dz, n: 0 };
    };
    const up = sheet(FILL_POS, 0.5, 0.006, 1), down = sheet(FILL_NEG, 0.72, 0.009, 2);
    const lpos = new Float32Array(n * 24), lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
    const outline = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: 0x000000 }));
    outline.frustumCulled = false; outline.renderOrder = 3; gb.group.add(outline);
    const glyphs = pts.slice(1).map((q, k) => {
      const a = pts[k], dV = q[0] - a[0];
      return Math.abs(dV) < 1e-9 ? null : stage.label(dV > 0 ? '+' : '−', gb.at((a[0] + q[0]) / 2, Math.min(a[1], q[1]) / 2), 'axis', { dy: 0, priority: 1 });
    });
    function update(s) {
      let nl = 0;
      up.n = down.n = 0;
      for (let k = 0; k < n; k++) {
        const [V0, p0] = pts[k], [V1, p1] = pts[k + 1], u = Math.min(Math.max(s * n - k, 0), 1);
        if (glyphs[k]) glyphs[k].node.dataset.off = u > 0 ? '' : '1';
        if (u <= 0 || Math.abs(V1 - V0) < 1e-9) continue;
        const Ve = V0 + u * (V1 - V0), pe = p0 + u * (p1 - p0), sh = V1 > V0 ? up : down;
        const P = (V, p) => [gb.X(V), gb.Y(p), sh.z];
        const A = P(V0, 0), B = P(Ve, 0), C = P(Ve, pe), D = P(V0, p0);
        for (const v of [A, B, C, A, C, D]) { sh.pos.set(v, sh.n * 3); sh.n++; }
        for (const v of [A, B, B, C, C, D, D, A]) { lpos.set([v[0], v[1], gb.Z + 0.012], nl * 3); nl++; }
      }
      for (const sh of [up, down]) { sh.geo.setDrawRange(0, sh.n); sh.geo.attributes.position.needsUpdate = true; }
      lgeo.setDrawRange(0, nl); lgeo.attributes.position.needsUpdate = true;
    }
    return { update, set visible(v) { up.m.visible = down.m.visible = outline.visible = v; } };
  }

  // Arrowheads (one instanced mesh) at the middle of each segment, pointing along the travel.
  function heads(gb, pts) {
    const segs = pts.slice(1).map((q, k) => [pts[k], q]).filter(([a, q]) => Math.hypot(q[0] - a[0], q[1] - a[1]) > 1e-9);
    const m = new THREE.InstancedMesh(new THREE.ConeGeometry(0.13, 0.34, 16), stage.flat(0x000000), Math.max(segs.length, 1));
    const M4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
    segs.forEach(([a, b], k) => {
      const A = new THREE.Vector3(...gb.at(...a)), B = new THREE.Vector3(...gb.at(...b));
      q4.setFromUnitVectors(up, B.clone().sub(A).normalize());
      m.setMatrixAt(k, M4.compose(A.add(B).multiplyScalar(0.5), q4, one));
    });
    m.count = segs.length; gb.group.add(m);
  }

  function apparatus() {
    stage.floorPlane(0);
    stage.mesh(stage.group, new THREE.BoxGeometry(1.7, RTOP, 1.5), stage.lit(0x3a4a58, 0.3, 0.5), [0, RTOP / 2, 0]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.11, 0.11, 0.12, 24), stage.lit(0xc8d0d8, 0.6, 0.3), [0.55, RTOP / 2, 0.8], [Math.PI / 2, 0, 0]);
    stage.label('열저장체', [0, RTOP / 2, 0.95], 'station', { dy: 0, priority: 1 });
    const glass = stage.mesh(stage.group, new THREE.CylinderGeometry(R, R, CYL, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.22, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }), [0, RTOP + CYL / 2, 0]);
    glass.castShadow = false;
    const gas = stage.mesh(stage.group, new THREE.CylinderGeometry(R - 0.02, R - 0.02, 1, 48), new THREE.MeshStandardMaterial({ color: 0xa9bccb, transparent: true, opacity: 0.4, roughness: 0.6, depthWrite: false }));
    gas.castShadow = false;
    const piston = new THREE.Group(); stage.group.add(piston);
    stage.mesh(piston, new THREE.CylinderGeometry(R - 0.01, R - 0.01, 0.1, 48), stage.lit(0x6f8091, 0.6, 0.35), [0, 0.05, 0]);
    stage.mesh(piston, new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12), stage.lit(0x6f8091, 0.6, 0.35), [0, 0.25, 0]);
    stage.mesh(piston, new THREE.BoxGeometry(0.55, 0.22, 0.55), stage.lit(0x4a5560, 0.5, 0.5), [0, 0.51, 0]);
    const heat = vecArrow(stage, HEAT, { radius: 0.04 }), lq = stage.label(tex('Q'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const tag = stage.label('', [0, 0, 0], 'tag', { dy: 0, priority: 3 });
    return {
      set(o) {
        const h = o.V * KV;
        gas.scale.set(1, h, 1); gas.position.set(0, RTOP + h / 2, 0);
        piston.position.set(0, RTOP + h, 0);
        tag.set(`<i>p</i> = ${fmt(o.p)} kPa`); tag.move([0, RTOP + h + 1.05, 0]);
        const on = ui.revealed && o.s > 0 && o.s < 1 && Math.abs(o.rate) > 1e-6;
        if (on && o.rate > 0) heat.update([-0.05, RTOP - 0.3, R + 0.12], [0, 1, 0], 0.75);
        else if (on) heat.update([-0.05, RTOP + 0.45, R + 0.12], [0, -1, 0], 0.75);
        else heat.update([0, 0, 0], [0, 1, 0], 0);
        lq.node.dataset.off = on ? '' : '1'; lq.move([0.28, RTOP + 0.05, R + 0.12]);
      },
    };
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측'), s = M.problem(p), cycle = p.activity === 'cycle';
      const app = apparatus();
      const gb = graphBoard(stage, PV);
      const c = M.corners(p), Vc = (p.Vi + p.Vf) / 2, pc = (p.pi + p.pf) / 2;
      for (const k of cycle ? ['i', 'a', 'f', 'b'] : ['i', 'a', 'b', 'f']) {
        const [V, pp] = c[k], dx = V === Vc ? -0.3 : Math.sign(V - Vc) * 0.32, dy = pp === pc ? 0.3 : Math.sign(pp - pc) * 0.3;
        const w = gb.at(V, pp);
        stage.label(`<i>${k}</i>`, [w[0] + dx, w[1] + dy, w[2]], 'axis', { dy: 0, priority: 2 });
      }
      if (!cycle) stage.line(M.pathPoints('iaf', p).map(q => { const w = gb.at(...q); w[2] += 0.012; return w; }), 0x7a8795, { dashed: true, parent: gb.group, dash: 0.16, gap: 0.11 });
      stepCurve(stage, gb, s.pts, 0x000000, 0.05);
      heads(gb, s.pts);
      const dot = stage.mesh(gb.group, new THREE.SphereGeometry(0.13, 20, 14), stage.flat(0x000000), gb.at(...s.pts[0]), [0, 0, 0], false);
      const area = pvArea(gb, s.pts); area.visible = false;
      const hold = stage.label('확인 뒤에 에너지 막대를 그린다', [BARS.origin[0] + BARS.width / 2, BARS.origin[1] + BARS.height / 2, -0.4], 'station', { dy: 0, priority: 1 });
      let bars = null;

      const state = q => tex(`p = ${q[1]}\\ \\mathrm{kPa},\\ V = ${N(q[0])}\\ \\mathrm{L}`);
      let check;
      if (!cycle) {
        const name = pathName(p);
        box.text(`기체를 상태 i (${state(c.i)})에서 상태 f (${state(c.f)})로 바꾼다. 기준 경로 iaf (압력 일정, 그다음 부피 일정)로 가면 기체가 받는 열은 ${tex(`Q_{iaf} = ${N(s.ref.Q)}\\ \\mathrm{J}`)}이다. 재생하기 전에 경로 ${name}에 대해 구해 보자.`);
        box.text(`① 경로 ${name}에서 기체가 한 일 ${tex('W')}`, 'pred');
        const wi = box.answer({ label: '기체가 한 일', unit: 'J', placeholder: '예 400', onEnter: () => check() });
        box.text(`② 경로 ${name}에서 기체가 받은 열 ${tex('Q')} <small>잃으면 음수로 적는다</small>`, 'pred');
        const qi = box.answer({ label: '기체가 받은 열', unit: 'J', placeholder: '예 500', onEnter: () => check() });
        check = () => {
          const r = M.checkPath(p, { WText: wi.value, QText: qi.value });
          if (r.WReason === 'unreadable' || r.QReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 450'); return; }
          const hw = { sign: '부피가 늘면 기체가 한 일은 양수, 줄면 음수다.', refW: '그 값은 기준 경로 iaf의 일이다. 일은 경로마다 다르다 (path dependent).', rect: '직선 아래는 사다리꼴이다. 두 압력의 평균에 부피 변화를 곱하자.', units: `${tex('1\\ \\mathrm{kPa\\cdot L} = 1\\ \\mathrm{J}')}이다.`, value: `${tex('W = \\int p\\,dV')} (18.5.2)는 경로 아래 넓이다.` }[r.WReason] ?? '';
          const hq = { pathIndep: `열도 경로마다 다르다. 경로와 관계없는 것은 ${tex('Q - W')}다.`, signW: `${tex('\\Delta E_{\\text{int}} = Q - W')} (18.5.3)에서 ${tex('Q = \\Delta E_{\\text{int}} + W')}다.`, refSign: `기준 경로에서 ${tex('\\Delta E_{\\text{int}} = Q_{iaf} - W_{iaf}')}다. 부호를 확인하자.`, noE: `내부 에너지 변화가 0이 아니다. 기준 경로에서 ${tex('\\Delta E_{\\text{int}}')}를 먼저 구하자.`, units: `${tex('1\\ \\mathrm{kPa\\cdot L} = 1\\ \\mathrm{J}')}이다.`, value: `기준 경로에서 ${tex('\\Delta E_{\\text{int}}')}를 구하고 ${tex('Q = \\Delta E_{\\text{int}} + W')}를 쓰자.` }[r.QReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [hw, hq].filter(Boolean).join(' ')}<br>${tex(`\\Delta E_{\\text{int}} = Q_{iaf} - W_{iaf} = ${minus(s.ref.Q, s.ref.W)} = ${N(s.dE)}\\ \\mathrm{J}`)}<br>${tex(`W = ${N(s.W)}\\ \\mathrm{J},\\ Q = \\Delta E_{\\text{int}} + W = ${plus(s.dE, s.W)} = ${N(s.Q)}\\ \\mathrm{J}`)}`);
          reveal();
        };
      } else {
        box.text(`기체가 ${pathName(p)} 순서로 한 바퀴 돈다. 꼭짓점은 i (${state(c.i)}), a (${state(c.a)}), f (${state(c.f)}), b (${state(c.b)})다. 재생하기 전에 구해 보자.`);
        box.text(`① 한 바퀴 동안 기체가 한 알짜 일 ${tex('W')}`, 'pred');
        const wi = box.answer({ label: '알짜 일', unit: 'J', placeholder: '예 400', onEnter: () => check() });
        box.text(`② 한 바퀴 동안 기체가 받은 알짜 열 ${tex('Q')}`, 'pred');
        const qi = box.answer({ label: '알짜 열', unit: 'J', placeholder: '예 400', onEnter: () => check() });
        check = () => {
          const r = M.checkCycle(p, { WText: wi.value, QText: qi.value });
          if (r.WReason === 'unreadable' || r.QReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 450'); return; }
          const hw = { sign: '도는 방향을 보자. p–V 그림에서 시계 방향이면 알짜 일이 양수, 시계 반대 방향이면 음수다.', oneSide: '부피가 느는 구간의 일(+)과 주는 구간의 일(−)을 모두 더하자.', sumAbs: '부피가 주는 구간의 일은 음수다. 크기가 아니라 부호대로 더하자.', value: '알짜 일은 순환이 둘러싼 넓이다.' }[r.WReason] ?? '';
          const hq = { zero: `한 바퀴 돌면 ${tex('\\Delta E_{\\text{int}} = 0')}이지만 ${tex('Q')}는 0이 아니다.`, sign: `${tex('\\Delta E_{\\text{int}} = 0')}이므로 ${tex('Q = W')}다.`, value: `${tex('Q = W')} (18.5.7)다.` }[r.QReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [hw, hq].filter(Boolean).join(' ')}<br>${tex(`W = ${plus(s.pos, s.neg)} = ${N(s.W)}\\ \\mathrm{J}`)}<br>${tex(`\\Delta E_{\\text{int}} = 0,\\ Q = W = ${N(s.Q)}\\ \\mathrm{J}`)}`);
          reveal();
        };
      }
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      function reveal() {
        ui.revealed = true; area.visible = true; hold.node.dataset.off = '1';
        if (!bars) {
          let lo = 0, hi = 0;
          for (let k = 0; k <= 200; k++) { const q = M.alongAt(s.pts, k / 200); lo = Math.min(lo, q.Q, q.W, q.dE); hi = Math.max(hi, q.Q, q.W, q.dE); }
          const yr = niceRange(lo * 1.1, hi * 1.1, { target: 4, minSpan: 10 });
          bars = barBoard(stage, { ...BARS, range: [yr.min, yr.max], unit: 'J', title: '에너지 (J)',
            bars: [{ label: '<i>Q</i>', fill: null }, { label: '<i>W</i>', fill: null }, { label: 'Δ<i>E</i><sub>int</sub>', fill: BAR.Eth }] });
        }
        ctx.refresh();
      }

      cur = {
        render(o) {
          app.set(o);
          dot.position.set(...gb.at(o.V, o.p));
          gb.setTime(o.V);
          area.update(o.s);
          if (bars) bars.set([o.Q, o.W, o.dE]);
        },
      };
      stage.setHome({ target: [3.95, 2.0, 0], direction: [0.06, 0.2, 1], distance: 11.6, minDistance: 3, maxDistance: 35 });
      return { legend: [{ label: '열 (heat)', color: '#d55e00' }, { label: '일 + (work)', color: '#e69f00' }, { label: '일 −', color: '#56b4e9' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
