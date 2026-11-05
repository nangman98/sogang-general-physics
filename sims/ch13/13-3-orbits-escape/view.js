// 13.5–13.7 3D view.
// orbit: Earth at the origin, scene unit 1000 km. The orbit lies in the horizontal plane; model (x, y) maps to scene
// (x, 0, −y) so the satellite goes counterclockwise seen from above. Dashed grey circle: the circular orbit before
// firing. The trail grows as the satellite moves; after the check the whole ellipse, perigee, apogee and two
// equal-time sectors (1/10 of T, from the perigee and from the apogee) are drawn.
// escape: the body has radius 1; the projectile goes straight up from the top. After the check a dashed ring marks
// r_max and a second projectile leaves at exactly the escape speed.
import { texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const U = 1e6;                 // m per scene unit in the orbit activity
const VEL = 0x0072b2;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function planet(radius, color) {
    stage.mesh(stage.group, new THREE.SphereGeometry(radius, 64, 40), stage.lit(color, 0.05, 0.75));
    stage.line(Array.from({ length: 129 }, (_, i) => { const a = 2 * Math.PI * i / 128; return [radius * 1.003 * Math.cos(a), 0, radius * 1.003 * Math.sin(a)]; }), 0x40546a);
  }
  function wedge(points, color) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); for (const q of points) shape.lineTo(q[0], q[1]); shape.lineTo(0, 0);
    // Drawn over the Earth (no depth test) so the part of each sector inside the Earth stays visible.
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 15; stage.group.add(m);
    const edge = stage.line([[0, 0, 0], ...points.map(q => [q[0], 0, -q[1]]), [0, 0, 0]], 0x000000);
    edge.material.depthTest = false; edge.renderOrder = 16;
    return [m, edge];
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측');
      if (p.activity === 'escape') return buildEscape(p, box);
      const o = M.orbit(p), R = M.EARTH.R / U;
      planet(R, 0x5b8db8);
      stage.line(Array.from({ length: 181 }, (_, i) => { const a = 2 * Math.PI * i / 180; return [o.r0 / U * Math.cos(a), 0, -o.r0 / U * Math.sin(a)]; }), 0x8a98a6, { dashed: true, dash: 0.6, gap: 0.4 });
      stage.label('P', [o.r0 / U + 0.9, 0, 0.6], 'qty', { dy: 0, priority: 2 });
      // Trail of the new orbit: full geometry, draw range follows the time.
      const N0 = 720, ptsAll = Array.from({ length: N0 + 1 }, (_, i) => { const s = M.orbitAt(o.T * i / N0, p); return [s.x / U, 0, -s.y / U]; });
      const trail = stage.line(ptsAll, 0x000000); trail.geometry.setDrawRange(0, 1);
      const full = stage.line(ptsAll, 0x000000, { dashed: true, dash: 0.5, gap: 0.35, opacity: 0.45 }); full.visible = false;
      const extra = [];
      const sat = new THREE.Group(); stage.group.add(sat);
      stage.mesh(sat, new THREE.BoxGeometry(0.45, 0.45, 0.45), stage.lit(0xd0d6dc, 0.6, 0.35));
      stage.mesh(sat, new THREE.BoxGeometry(1.6, 0.04, 0.4), stage.lit(0x2c4a6e, 0.3, 0.5));
      const V = vecArrow(stage, VEL, { radius: 0.12 }), lv = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const VS = 0.55;                                               // scene units per km/s

      box.text(`높이 ${tex(`h = ${N(p.h)}\\ \\mathrm{km}`)}의 원 궤도를 도는 위성이 점 P에서 점화해 속력을 원 궤도 속력의 ${tex(`f = ${N(p.f, 2)}`)}배로 바꾼다. 재생하기 전에 구해 보자.`);
      box.text(`① 새 궤도의 주기 ${tex('T')}`, 'pred');
      const ti = box.answer({ label: '새 궤도의 주기', unit: 'min', placeholder: '예 120', onEnter: () => check() });
      box.text(`② 궤도에서 P의 반대편 끝의 높이 (지표에서)`, 'pred');
      const hi = box.answer({ label: '반대편 끝의 높이', unit: 'km', placeholder: '예 3000', onEnter: () => check() });
      const check = () => {
        const r = M.checkOrbit(p, { TText: ti.value, hText: hi.value });
        if (r.TReason === 'unreadable' || r.hReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 150'); return; }
        const hT = { oldT: '그 값은 점화 전 원 궤도의 주기다. 점화로 에너지가 바뀌면 긴반지름이 바뀐다.', seconds: '분(min)으로 적자.', otherR: `반대편 끝의 거리가 아니라 긴반지름 ${tex('a')}를 쓴다.`, value: `${tex('E = \\tfrac{1}{2}mv^2 - GMm/r = -GMm/2a')}로 ${tex('a')}를 구하고 식 (13.6.5)에 넣자.` }[r.TReason] ?? '';
        const hh = { radius: `지구 중심에서 잰 거리다. ${tex('R')}을 빼자.`, semimajor: `그 값은 ${tex('a - R')}이다. 반대편 끝은 ${tex('2a - r')}에 있다.`, value: `${tex('r_a + r_p = 2a')}다.` }[r.hReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hT, hh].filter(Boolean).join(' ')}<br>${tex(`a = -\\dfrac{GMm}{2E} = ${N(o.a / 1e3)}\\ \\mathrm{km},\\ T = 2\\pi\\sqrt{a^3/GM} = ${N(o.T / 60)}\\ \\mathrm{min}`)}<br>${tex(`2a - r = ${N(o.other / 1e3)}\\ \\mathrm{km}`)}, 지표에서 ${tex(`${N((o.other - M.EARTH.R) / 1e3)}\\ \\mathrm{km}`)} (${o.peri ? 'P가 근지점' : 'P가 원지점'})`);
        if (!extra.length) {
          full.visible = true;
          const dt = o.T / 10;
          for (const [from, col] of [[0, 0x56b4e9], [Math.PI, 0xe69f00]]) {
            const pts = M.sectorAngles(p, from, dt).map(q => [q.r * Math.cos(q.phi) / U, q.r * Math.sin(q.phi) / U]);
            extra.push(...wedge(pts, col));
          }
          const pe = [o.rp / U * Math.cos(0), 0], ap = [o.ra / U * Math.cos(Math.PI), 0];
          extra.push(stage.label('근지점 (perigee)', [pe[0] + 1.6, 0, 1.6], 'tag', { dy: 0, priority: 1 }));
          extra.push(stage.label('원지점 (apogee)', [ap[0] - 1.6, 0, 1.6], 'tag', { dy: 0, priority: 1 }));
        }
        ui.revealed = true; ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(s) {
          const P = [s.x / U, 0, -s.y / U];
          sat.position.set(...P); sat.rotation.y = s.phi;
          const k = Math.round(Math.min(s.t / o.T, 1) * N0) + 1; trail.geometry.setDrawRange(0, Math.max(k, 1));
          // Velocity direction from a short step ahead along the orbit.
          const s2 = M.orbitAt(s.t + o.T * 1e-4, p), d = [s2.x - s.x, 0, -(s2.y - s.y)], n = Math.hypot(...d) || 1;
          const u = d.map(c => c / n);
          V.update(P, u, s.v / 1e3 * VS); lv.move(P.map((c, i) => c + u[i] * (s.v / 1e3 * VS + 1.0)));
        },
      };
      const cx = -(o.ra - o.rp) / 2 / U, span = 2 * o.a / U;
      stage.setHome({ target: [cx, 0, 0], direction: [0, 1, 0.3], distance: 1.25 * span + 10, minDistance: 8, maxDistance: 300 });
      return { legend: [{ label: '속도 (velocity)', color: '#0072b2' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };

  function buildEscape(p, box) {
    const s = M.escape(p), b = M.BODIES[p.body];
    planet(1, p.body === 'jupiter' ? 0xc29a6b : p.body === 'earth' ? 0x5b8db8 : 0x9a9a9a);
    const ball = stage.mesh(stage.group, new THREE.SphereGeometry(0.08, 20, 14), stage.lit(0x40546a, 0.3, 0.5));
    const ghost = stage.mesh(stage.group, new THREE.SphereGeometry(0.08, 20, 14), new THREE.MeshBasicMaterial({ color: 0x56b4e9, toneMapped: false }));
    ghost.visible = false;
    const top = s.rmax / s.R;
    const ring = stage.line(Array.from({ length: 65 }, (_, i) => { const a = 2 * Math.PI * i / 64; return [0.6 * Math.cos(a), top, 0.6 * Math.sin(a)]; }), 0x000000, { dashed: true, dash: 0.12, gap: 0.08 });
    ring.visible = false;
    const ringTag = stage.label('', [1.6, top, 0], 'tag', { dy: 0, priority: 1 }); ringTag.node.dataset.off = '1';
    // Height above the surface on the left: ticks every R from the surface (y = 1).
    stage.line([[-0.9, 1, 0], [-0.9, 6.4, 0]], 0x8a98a6);
    for (let k = 0; k <= 5; k++) stage.label(k === 0 ? '0' : k === 1 ? '<i>R</i>' : `${k}<i>R</i>`, [-1.25, 1 + k, 0], 'gtick', { dy: 0, priority: 0 });
    stage.label('표면에서 높이', [-1.0, 6.8, 0], 'gtick', { dy: 0, priority: 0 });
    const V = vecArrow(stage, VEL, { radius: 0.035 }), lv = stage.label(tex('\\vec v'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });

    box.text(`${b.label} (${tex(`M = ${N(b.M)}\\ \\mathrm{kg}`)}, ${tex(`R = ${N(b.R)}\\ \\mathrm{m}`)}) 표면에서 물체를 탈출 속력의 ${tex(`f = ${N(p.f, 2)}`)}배로 곧게 위로 쏜다. 재생하기 전에 구해 보자.`);
    box.text(`① 이 천체의 탈출 속력 ${tex('v')}`, 'pred');
    const vi = box.answer({ label: '탈출 속력', unit: 'km/s', placeholder: '예 5', onEnter: () => check() });
    box.text(`② 가장 높이 올라간 높이 ${tex('h_{\\max}')} (표면에서, ${tex('R')} 단위)`, 'pred');
    const hi = box.answer({ label: '가장 높은 높이', unit: '× R', placeholder: '예 0.8', onEnter: () => check() });
    const check = () => {
      const r = M.checkEscape(p, { vText: vi.value, hText: hi.value });
      if (r.vReason === 'unreadable' || r.hReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 2.4'); return; }
      const hv = { noTwo: `${tex('\\tfrac{1}{2}mv^2 = GMm/R')}에서 2가 남는다.`, units: 'km/s로 적자.', value: `${tex('\\tfrac{1}{2}mv^2 - GMm/R = 0')} (13.5.8)이다.` }[r.vReason] ?? '';
      const hh = { uniformG: `높이 올라가면 중력이 약해진다. ${tex('v^2/2g')}는 쓸 수 없다.`, fromCenter: `그 값은 중심에서 잰 ${tex('r_{\\max}/R')}다. 1을 빼자.`, value: `${tex('\\tfrac{1}{2}mv^2 - GMm/R = -GMm/r_{\\max}')}이다.` }[r.hReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hv, hh].filter(Boolean).join(' ')}<br>${tex(`v = \\sqrt{2GM/R} = ${N(s.vesc / 1e3)}\\ \\mathrm{km/s}`)} (교재 표 ${b.vTable} km/s)<br>${tex(`r_{\\max} = \\dfrac{R}{1 - f^2},\\ h_{\\max} = ${N(s.hmax / s.R)}R = ${N(s.hmax / 1e3)}\\ \\mathrm{km}`)}`);
      ring.visible = true; ringTag.node.dataset.off = ''; ringTag.set(`가장 높은 곳 ${N(s.hmax / s.R)}<i>R</i>`);
      ui.revealed = true; ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
    cur = {
      render(o) {
        const y = o.r / s.R; ball.position.set(0, y, 0);
        const L = Math.abs(o.vr) / s.vesc * 1.6;
        V.update([0.18, y, 0], [0, Math.sign(o.vr) || 1, 0], L); lv.move([0.45, y + Math.sign(o.vr) * L / 2, 0]);
        ghost.visible = ui.revealed && o.rEsc / s.R < 7.5; ghost.position.set(0.35, o.rEsc / s.R, 0);
      },
    };
    stage.setHome({ target: [0, 2.6, 0], direction: [0.25, 0.1, 1], distance: 12.5, minDistance: 3, maxDistance: 60 });
    return { legend: [{ label: '속도 (velocity)', color: '#0072b2' }] };
  }
}
