// 14.5 3D view. Scene unit = 10 cm. A wide glass tank cut by the camera plane; the liquid surface is at y = SURF.
// float: the cube bobs; F⃗g at its center and F⃗b at the center of the submerged part (#D55E00); after the check a
// dashed ring marks the floating depth and the acceleration arrow (#CC79A7) appears.
// weigh: a spring scale above the tank holds the block on a cord; arrows for tension, weight and buoyant force.
import { texNum as N, fmt } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, dashLine, GREY, UNKNOWN_LENGTH } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const K = 10;                  // scene units per m
const SURF = 3.0, FORCE = 0xd55e00;
const LIQ = { water: 0x56b4e9, seawater: 0x56b4e9, mercury: 0xa9b3bc };

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function tank(fluid) {
    const W = 7, D = 3, Hh = SURF + 1.2;
    stage.floorPlane(-0.02);
    stage.mesh(stage.group, new THREE.BoxGeometry(W + 0.1, Hh, D + 0.1), new THREE.MeshStandardMaterial({ color: 0xdfe8ef, transparent: true, opacity: 0.16, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide }), [0, Hh / 2, 0]);
    const liq = stage.mesh(stage.group, new THREE.BoxGeometry(W, SURF, D), new THREE.MeshStandardMaterial({ color: LIQ[fluid], transparent: true, opacity: 0.38, roughness: 0.4, depthWrite: false }), [0, SURF / 2, 0]);
    liq.castShadow = false;
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측');
      tank(p.fluid);
      if (p.activity === 'weigh') return buildWeigh(p, box);
      const s = M.floatBlock(p), Hs = s.Hm * K;
      const blk = stage.mesh(stage.group, new THREE.BoxGeometry(Hs, Hs, Hs), stage.lit(0xb08a5a, 0.05, 0.7));
      const Fg = vecArrow(stage, FORCE, { radius: 0.05 }), Fb = vecArrow(stage, FORCE, { radius: 0.05 }), Aa = vecArrow(stage, 0xcc79a7, { radius: 0.045 });
      const lg = stage.label(tex('\\vec F_g'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lb = stage.label(tex('\\vec F_b'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), la = stage.label(tex('\\vec a'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
      const S = 1.3 / M.floatAt(0, p).Fg;
      const ring = dashLine(stage, [-Hs / 2 - 0.25, 0, Hs / 2 + 0.01], [Hs / 2 + 0.25, 0, Hs / 2 + 0.01], 0x000000, { dash: 0.08, gap: 0.06 });
      ring.visible = false;
      const hTag = stage.label('', [0, 0, 0], 'tag', { dy: 0, priority: 1 }); hTag.node.dataset.off = '1';

      box.text(`밀도 ${tex(`\\rho = ${N(p.rho)}\\ \\mathrm{kg/m^3}`)}, 한 변 ${tex(`H = ${N(p.H)}\\ \\mathrm{cm}`)}인 정육면체 블록이 ${M.FLUIDS[p.fluid].label} (${tex(`\\rho_f = ${N(s.rf)}\\ \\mathrm{kg/m^3}`)}) 위에 뜬다. 재생하기 전에 구해 보자.`);
      box.text(`① 떠 있을 때 잠기는 깊이 ${tex('h')}`, 'pred');
      const hi = box.answer({ label: '잠기는 깊이', unit: 'cm', placeholder: '예 7', onEnter: () => check() });
      box.text(`② 완전히 잠긴 채 놓은 직후 가속도의 크기 ${tex('a')}`, 'pred');
      const ai = box.answer({ label: '놓은 직후 가속도', unit: 'm/s²', placeholder: '예 3', onEnter: () => check() });
      const check = () => {
        const r = M.checkFloat(p, { hText: hi.value, aText: ai.value });
        if (r.hReason === 'unreadable' || r.aReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 7.5'); return; }
        const hh = { above: '그 값은 수면 위로 나온 높이다.', inverse: `밀도 비를 거꾸로 썼다. ${tex('h = (\\rho/\\rho_f)H')}다.`, value: `${tex('\\rho_f LWhg = \\rho LWHg')}에서 ${tex('h')}를 구하자.` }[r.hReason] ?? '';
        const ha = { g: '중력만이 아니라 부력도 작용한다.', noWeight: `부력에서 중력을 빼야 한다. ${tex('ma = F_b - F_g')}다.`, value: `${tex('\\rho LWH a = \\rho_f LWHg - \\rho LWHg')}다.` }[r.aReason] ?? '';
        box.feedback(r.ok, `${r.ok ? '맞다.' : [hh, ha].filter(Boolean).join(' ')}<br>${tex(`h = \\dfrac{\\rho}{\\rho_f}H = ${N(s.h * 100)}\\ \\mathrm{cm}`)}<br>${tex(`a = \\left(\\dfrac{\\rho_f}{\\rho} - 1\\right)g = ${N(s.a0)}\\ \\mathrm{m/s^2}`)} (위로)`);
        ui.revealed = true; ring.visible = true; hTag.node.dataset.off = ''; hTag.set(`뜨는 깊이 <i>h</i> = ${fmt(s.h * 100)} cm`);
        ctx.refresh();
      };
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
      cur = {
        render(o) {
          const bottom = SURF - o.sub * K, cy = bottom + Hs / 2;
          blk.position.set(0, cy, 0);
          Fg.update([0.12, cy, Hs / 2 + 0.05], [0, -1, 0], o.Fg * S); lg.move([0.45, cy - o.Fg * S - 0.2, Hs / 2 + 0.05]);
          const cb = bottom + o.sub * K / 2;
          Fb.update([-0.12, cb, Hs / 2 + 0.05], [0, 1, 0], o.Fb * S); lb.move([-0.5, cb + o.Fb * S + 0.2, Hs / 2 + 0.05]);
          const La = ui.revealed ? Math.abs(o.a) / M.G * 1.3 : 0, dir = o.a >= 0 ? 1 : -1;
          Aa.update([Hs / 2 + 0.5, cy, 0], [0, dir, 0], La); la.node.dataset.off = La > 0.03 ? '' : '1'; la.move([Hs / 2 + 0.85, cy + dir * La / 2, 0]);
          const yr = bottom + s.h * K; ring.set([-Hs / 2 - 0.25, yr, Hs / 2 + 0.02], [Hs / 2 + 0.25, yr, Hs / 2 + 0.02]);
          hTag.move([-Hs / 2 - 1.6, yr, Hs / 2]);
        },
      };
      stage.setHome({ target: [0, 2.6, 0], direction: [0.1, 0.15, 1], distance: 12, minDistance: 3, maxDistance: 40 });
      return { legend: [{ label: '힘 (force)', color: '#d55e00' }, { label: '가속도 (acceleration)', color: '#cc79a7' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };

  function buildWeigh(p, box) {
    const s = M.weigh(p), a = s.side * K, top = SURF + 3.4;
    const steel = stage.lit(0x6f8091, 0.6, 0.35);
    // Stand behind the tank: post from the floor, arm over the tank.
    stage.mesh(stage.group, new THREE.BoxGeometry(0.1, top + 0.95, 0.1), steel, [-4.0, (top + 0.95) / 2, -1.9]);
    stage.mesh(stage.group, new THREE.BoxGeometry(4.1, 0.1, 0.1), steel, [-2.0, top + 0.9, -1.9]);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.1, 0.1, 1.95), steel, [0, top + 0.9, -0.95]);
    const scale = stage.mesh(stage.group, new THREE.BoxGeometry(0.5, 0.9, 0.3), stage.lit(0xd0d6dc, 0.5, 0.35), [0, top + 0.4, 0]);
    const dial = stage.label('', [0.75, top + 0.45, 0.2], 'tag', { dy: 0, priority: 3 });
    const cord = stage.mesh(stage.group, new THREE.CylinderGeometry(0.015, 0.015, 1, 8), stage.lit(0xd9c49a, 0, 0.9), [0, 0, 0], [0, 0, 0], false);
    const blk = stage.mesh(stage.group, new THREE.BoxGeometry(a, a, a), stage.lit(p.solid === 'iron' ? 0x6f7780 : p.solid === 'aluminum' ? 0xc4ccd4 : p.solid === 'glass' ? 0xa9d3e6 : 0xb9b3a6, 0.4, 0.45));
    const T = vecArrow(stage, FORCE, { radius: 0.045 }), W = vecArrow(stage, FORCE, { radius: 0.045 });
    const B = vecArrow(stage, GREY, { radius: 0.045 });
    const lT = stage.label(tex('\\vec T'), [0, 0, 0], 'qty', { dy: 0, priority: 2 }), lW = stage.label(tex('\\vec F_g'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const lB = stage.label(`${tex('\\vec F_b')} <span class="val">= ?</span>`, [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const S = 1.4 / s.W;

    box.text(`${M.SOLIDS[p.solid].label} 물체 (${tex(`\\rho = ${N(s.rs)}\\ \\mathrm{kg/m^3}`)}, ${tex(`V = ${N(p.V)}\\ \\mathrm{cm^3}`)})를 용수철저울에 매달아 ${M.FLUIDS[p.fluid].label} (${tex(`\\rho_f = ${N(s.rf)}\\ \\mathrm{kg/m^3}`)})에 완전히 담근다. 재생하기 전에 구해 보자.`);
    box.text(`① 완전히 잠겼을 때 부력 ${tex('F_b')}`, 'pred');
    const bi = box.answer({ label: '부력', unit: 'N', placeholder: '예 5', onEnter: () => check() });
    box.text('② 그때 저울 눈금 (겉보기 무게)', 'pred');
    const wi = box.answer({ label: '겉보기 무게', unit: 'N', placeholder: '예 8', onEnter: () => check() });
    const check = () => {
      const r = M.checkWeigh(p, { bText: bi.value, wText: wi.value });
      if (r.bReason === 'unreadable' || r.wReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 4.9'); return; }
      const hb = { blockRho: '물체의 밀도가 아니라 밀려난 액체의 밀도를 쓴다.', units: `${tex('1\\ \\mathrm{cm^3} = 10^{-6}\\ \\mathrm{m^3}')}다.`, value: `${tex('F_b = \\rho_f Vg')} (14.5.1)이다.` }[r.bReason] ?? '';
      const hw = { weight: '부력만큼 저울 눈금이 줄어든다.', sum: '부력은 위로 작용하므로 빼야 한다.', value: `${tex('\\text{weight}_{\\text{app}} = \\text{weight} - F_b')} (14.5.4)다.` }[r.wReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hb, hw].filter(Boolean).join(' ')}<br>${tex(`F_b = \\rho_fVg = ${N(s.Fb)}\\ \\mathrm{N}`)}<br>${tex(`\\text{weight}_{\\text{app}} = \\rho Vg - F_b = ${N(s.W)} - ${N(s.Fb)} = ${N(s.app)}\\ \\mathrm{N}`)}`);
      B.mat.color.setHex(FORCE); lB.set(tex('\\vec F_b'));
      ui.revealed = true; ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);
    cur = {
      render(o) {
        const f = o.f;
        const bottom = f < 0.25 ? SURF + (0.25 - f) / 0.25 * 0.8 : f < 0.85 ? SURF - o.frac * a : SURF - a - (f - 0.85) / 0.15 * 0.25;
        const cy = bottom + a / 2; blk.position.set(0, cy, 0);
        const L = top - 0.05 - (cy + a / 2); cord.scale.set(1, L, 1); cord.position.set(0, cy + a / 2 + L / 2, 0);
        dial.set(ui.revealed ? `${fmt(o.reading)} N` : '눈금 = ?');
        T.update([0.1, cy + a / 2, a / 2 + 0.05], [0, 1, 0], o.reading * S); lT.move([0.45, cy + a / 2 + o.reading * S * 0.7, a / 2 + 0.05]);
        W.update([0.1, cy, a / 2 + 0.05], [0, -1, 0], s.W * S); lW.move([0.45, cy - s.W * S - 0.2, a / 2 + 0.05]);
        const LB = ui.revealed ? o.Fb * S : (o.frac > 0 ? UNKNOWN_LENGTH * 0.6 : 0);
        B.update([-0.15, cy, a / 2 + 0.05], [0, 1, 0], LB); lB.node.dataset.off = LB > 0.02 ? '' : '1'; lB.move([-0.7, cy + LB + 0.2, a / 2 + 0.05]);
      },
    };
    stage.setHome({ target: [-0.6, 3.9, 0], direction: [0.12, 0.12, 1], distance: 17, minDistance: 3, maxDistance: 40 });
    return { legend: [{ label: '힘 (force)', color: '#d55e00' }] };
  }
}
