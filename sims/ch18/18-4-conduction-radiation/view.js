// 18.6 3D view. Static screen.
// slab (scene unit = 10 cm for the thickness): a hot reservoir block, layer 2, layer 1 and a cold reservoir block along x
// (Fig. 18.6.2 order). Heat arrows (#D55E00, heat shares the thermal-energy colour) run from the hot block to the cold
// one through the slab. A graph board shows T against the position x in the slab; the profile appears after the check.
// rad (scene unit = 10 cm): a sphere on a thin stand. Emitted arrows point out of the surface, absorbed ones (fainter)
// point in. Before the check both sets are grey and of one length; after it their lengths follow P_rad and P_abs.
import { texNum as N, fmt } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, GREY } from '../../../core/forces3d.js';
import { graphBoard, niceRange, niceStep } from '../../../core/graph3d.js';
import { stepCurve } from '../../../core/area3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const HEAT = 0xd55e00;
const MCOLOR = { steel: 0x9aa5b0, lead: 0x7d8590, iron: 0x6f7780, brass: 0xc9a64a, aluminum: 0xc4ccd4, copper: 0xb8734a, silver: 0xd3d8dc,
  air: 0xe6eef4, helium: 0xe6eef4, hydrogen: 0xe6eef4, foam: 0xece9dc, rockwool: 0xb5aa98, fiberglass: 0xe3d3a8, pine: 0xc9a26b, glass: 0xbfdde8 };
const GAS = new Set(['air', 'helium', 'hydrogen']);
const degTex = T => `${T}\\ ^\\circ\\mathrm{C}`;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측');
      return p.activity === 'rad' ? buildRad(p, box) : buildSlab(p, box);
    },
    render(o) { if (cur) cur.render(o); },
  };

  // ---------------- composite slab ----------------
  function buildSlab(p, box) {
    const s = M.slab(p), H = 1.8, D = 1.8, l2 = p.L2 / 10, l1 = p.L1 / 10, Lt = l2 + l1, x0 = -Lt / 2, B = 0.85, y0 = 0.05;
    stage.floorPlane(0);
    const block = (x, w, color) => stage.mesh(stage.group, new THREE.BoxGeometry(w, H + 0.2, D + 0.2), stage.lit(color, 0.2, 0.6), [x + w / 2, y0 + (H + 0.2) / 2, 0]);
    block(x0 - B, B, 0xb48a7a); block(x0 + Lt, B, 0x8aa3b8);
    const layer = (x, w, m) => {
      const gas = GAS.has(m) || m === 'glass';
      const mat = new THREE.MeshStandardMaterial({ color: MCOLOR[m], roughness: 0.6, metalness: ['steel', 'lead', 'iron', 'brass', 'aluminum', 'copper', 'silver'].includes(m) ? 0.5 : 0.05, transparent: gas, opacity: gas ? 0.45 : 1, depthWrite: !gas });
      const mm = stage.mesh(stage.group, new THREE.BoxGeometry(w, H, D), mat, [x + w / 2, y0 + 0.1 + H / 2, 0]);
      mm.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, H, D)), new THREE.LineBasicMaterial({ color: 0x55606b })));
    };
    layer(x0, l2, p.m2); layer(x0 + l2, l1, p.m1);
    const top = y0 + 0.1 + H;
    stage.label(`<i>T</i><sub>H</sub> = ${p.TH} °C`, [x0 - B / 2, top + 0.35, 0], 'tag', { dy: 0, priority: 3 });
    stage.label(`<i>T</i><sub>C</sub> = ${p.TC} °C`, [x0 + Lt + B / 2, top + 0.35, 0], 'tag', { dy: 0, priority: 3 });
    stage.label('층 2', [x0 + l2 / 2, y0 + 0.25, D / 2 + 0.25], 'gtick', { dy: 0 });
    stage.label('층 1', [x0 + l2 + l1 / 2, y0 + 0.25, D / 2 + 0.25], 'gtick', { dy: 0 });
    const tX = stage.label('', [x0 + l2, top + 0.85, 0], 'tag', { dy: 0, priority: 4 });
    const arrows = [0.45, 1.0, 1.55].map(y => { const a = vecArrow(stage, HEAT, { radius: 0.045 }); a.update([x0 - 0.6, y0 + 0.1 + y, D / 2 + 0.05], [1, 0, 0], Lt + 1.2); return a; });
    const lp = stage.label(tex('P_{\\text{cond}}'), [x0 + Lt + 0.75, y0 + 0.1 + 1.55, D / 2 + 0.05], 'qty', { dy: -18, priority: 2 });

    // Graph board: T against x (cm) from the hot face.
    const xr = { max: p.L1 + p.L2 }, yr = niceRange(p.TC, p.TH, { target: 4 });
    const gx = x0 + Lt + B + 0.7;
    const gb = graphBoard(stage, { origin: [gx, 0.05, -0.6], width: 5.0, height: 3.4, t: [0, xr.max], tStep: niceStep(xr.max, 4), y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>x</i> (cm)', yTitle: '<i>T</i> (°C)' });
    // Layer boundary on the board (always shown), the profile and the T_X ring after the check.
    const zb = gb.Z + 0.01;
    stage.line([[gb.X(p.L2), gb.Y(yr.min), zb], [gb.X(p.L2), gb.Y(yr.max), zb]], 0x7d94a8, { dashed: true, parent: gb.group, dash: 0.14, gap: 0.1 });
    const xTag = stage.label('', gb.at(p.L2, s.TX), 'gval', { dy: -16, priority: 2 }); xTag.node.dataset.off = '1';
    let profile = false;

    box.text(`넓이 ${tex(`A = ${N(p.A)}\\ \\mathrm{m^2}`)}인 판이 두 층으로 되어 있다. 뜨거운 쪽 층 2는 ${M.MATERIALS[p.m2].label} (${tex(`k_2 = ${s.k2}\\ \\mathrm{W/m\\cdot K}`)}, ${tex(`L_2 = ${N(p.L2)}\\ \\mathrm{cm}`)}), 차가운 쪽 층 1은 ${M.MATERIALS[p.m1].label} (${tex(`k_1 = ${s.k1}\\ \\mathrm{W/m\\cdot K}`)}, ${tex(`L_1 = ${N(p.L1)}\\ \\mathrm{cm}`)})이다. 두 면은 ${tex(`T_H = ${degTex(p.TH)}`)}, ${tex(`T_C = ${degTex(p.TC)}`)}에 있다. 확인하기 전에 구해 보자.`);
    box.text(`① 판을 지나는 전도 전달률 ${tex('P_{\\text{cond}}')}`, 'pred');
    const pi = box.answer({ label: '전도 전달률', unit: 'W', placeholder: '예 100', onEnter: () => check() });
    box.text(`② 두 층의 경계면 온도 ${tex('T_X')}`, 'pred');
    const ti = box.answer({ label: '경계면 온도', unit: '°C', placeholder: '예 15', onEnter: () => check() });
    const check = () => {
      const r = M.checkSlab(p, { PText: pi.value, TText: ti.value });
      if (r.PReason === 'unreadable' || r.TReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 95.5'); return; }
      const hp = { oneLayer: '한 층만 넣었다. 열은 두 층을 차례로 지난다.', addK: `두 층의 ${tex('k')}를 더하지 않는다. 층마다 ${tex('L/k')}를 더한다 (18.6.5).`, units: `두께를 m로 바꾸자. ${tex('1\\ \\mathrm{cm} = 0.01\\ \\mathrm{m}')}다.`, value: `${tex('P_{\\text{cond}} = A(T_H - T_C)/(L_1/k_1 + L_2/k_2)')} (18.6.5)이다.` }[r.PReason] ?? '';
      const ht = { midpoint: '경계면 온도는 두 온도의 가운데가 아니다. 열저항이 큰 층에서 온도가 더 많이 떨어진다.', swap: '두 층을 바꿨다. 층 2가 뜨거운 쪽이다.', kelvin: '°C로 적자.', value: `두 층의 전달률이 같다는 식 (18.6.3)에서 ${tex('T_X')}를 구하자.` }[r.TReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hp, ht].filter(Boolean).join(' ')}<br>${tex(`R_2 = L_2/k_2 = ${N(s.R2)},\\ R_1 = L_1/k_1 = ${N(s.R1)}\\ \\mathrm{m^2\\cdot K/W}`)}<br>${tex(`P_{\\text{cond}} = \\dfrac{A(T_H - T_C)}{R_1 + R_2} = ${N(s.P)}\\ \\mathrm{W}`)}<br>${tex(`T_X = T_H - \\dfrac{P_{\\text{cond}}R_2}{A} = ${N(s.TX)}\\ ^\\circ\\mathrm{C}`)}`);
      ui.revealed = true;
      if (!profile) {
        profile = true;
        stepCurve(stage, gb, [[0, p.TH], [p.L2, s.TX], [p.L2 + p.L1, p.TC]], 0x000000, 0.045);
        gb.mark(p.L2, s.TX, 0x000000);
        xTag.move(gb.at(p.L2, s.TX).map((v, i) => v + (i === 0 ? 0.25 : 0))); xTag.set(`${tex('T_X')} = ${fmt(s.TX)} °C`); xTag.node.dataset.off = '';
      }
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        tX.set(ui.revealed ? `<i>T</i><sub>X</sub> = ${fmt(o.TX)} °C` : '<i>T</i><sub>X</sub> = ?');
        lp.set(ui.revealed ? `${tex('P_{\\text{cond}}')} <span class="val">${fmt(o.P)} W</span>` : tex('P_{\\text{cond}}'));
      },
    };
    const left = x0 - B - 0.3, right = gx + 5.0, W = right - left;
    stage.setHome({ target: [(left + right) / 2, 1.45, 0], direction: [0.12, 0.28, 1], distance: 1.0 * W + 1.6, minDistance: 2, maxDistance: 40 });
    return { legend: [{ label: '열 (heat)', color: '#d55e00' }] };
  }

  // ---------------- radiation ----------------
  function buildRad(p, box) {
    const s = M.radiation(p), rr = p.r / 10, Lm = 0.7 + 0.5 * rr, gap = 0.08;
    const cy = rr + Lm + gap + 0.5;
    stage.floorPlane(0);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.035, 0.05, cy - rr, 12), stage.lit(0x6f8091, 0.5, 0.4), [0, (cy - rr) / 2, 0]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.4, 0.45, 0.06, 32), stage.lit(0x4a5560, 0.4, 0.5), [0, 0.03, 0]);
    stage.ball([0, cy, 0], rr, 0x8d7f73);
    const C = [0, cy, 0], dir = a => [Math.cos(a), Math.sin(a), 0];
    const out = [], inn = [];
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3, b = a + Math.PI / 6;
      out.push({ d: dir(a), arrow: vecArrow(stage, GREY, { radius: 0.03 + 0.008 * rr }) });
      inn.push({ d: dir(b), arrow: vecArrow(stage, GREY, { radius: 0.03 + 0.008 * rr, opacity: 0.6 }) });
    }
    const lr = stage.label('', [0, 0, 0], 'qty', { dy: 0, priority: 3 }), la = stage.label('', [0, 0, 0], 'qty', { dy: 0, priority: 3 });
    stage.label(`공 <i>T</i> = ${p.T} °C`, [rr * 0.95 + 0.5, cy - rr - 0.35, rr * 0.3], 'tag', { dy: 0, priority: 2 });
    stage.label(`주위 <i>T</i><sub>env</sub> = ${p.Tenv} °C`, [-(rr + Lm + 1.0), cy + rr + Lm * 0.6, 0], 'tag', { dy: 0, priority: 2 });

    box.text(`반지름 ${tex(`r = ${N(p.r)}\\ \\mathrm{cm}`)}, 방사율 ${tex(`\\varepsilon = ${N(p.eps, 2)}`)}인 공의 표면 온도가 ${tex(`T = ${degTex(p.T)}`)}이고 주위 온도는 ${tex(`T_{\\text{env}} = ${degTex(p.Tenv)}`)}이다. 겉넓이는 ${tex('A = 4\\pi r^2')}이다. 확인하기 전에 구해 보자.`);
    box.text(`① 공이 열복사로 내보내는 일률 ${tex('P_{\\text{rad}}')}`, 'pred');
    const ri = box.answer({ label: '내보내는 일률', unit: 'W', placeholder: '예 50', onEnter: () => check() });
    box.text(`② 알짜 일률 ${tex('P_{\\text{net}}')} <small>공이 에너지를 잃으면 음수로 적는다</small>`, 'pred');
    const ni = box.answer({ label: '알짜 일률', unit: 'W', placeholder: '예 −20', onEnter: () => check() });
    const check = () => {
      const r = M.checkRad(p, { RText: ri.value, NText: ni.value });
      if (r.RReason === 'unreadable' || r.NReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 −35.5'); return; }
      const hr = { celsius: '온도를 켈빈으로 바꾸자. 0 K에서만 복사가 없다.', noEps: `방사율 ${tex('\\varepsilon')}를 곱하자.`, disk: `공의 겉넓이는 ${tex('4\\pi r^2')}이다.`, value: `${tex('P_{\\text{rad}} = \\sigma\\varepsilon AT^4')} (18.6.7)이다.` }[r.RReason] ?? '';
      const hn = { sign: `${tex('P_{\\text{net}} = P_{\\text{abs}} - P_{\\text{rad}}')}다. 잃으면 음수다.`, emitOnly: `주위에서 흡수하는 ${tex('P_{\\text{abs}} = \\sigma\\varepsilon AT_{\\text{env}}^4')}도 넣자.`, celsius: '온도를 켈빈으로 바꾸자.', diff4: `온도 차의 네제곱이 아니라 네제곱의 차 ${tex('T_{\\text{env}}^4 - T^4')}다.`, value: `${tex('P_{\\text{net}} = \\sigma\\varepsilon A(T_{\\text{env}}^4 - T^4)')} (18.6.9)이다.` }[r.NReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hr, hn].filter(Boolean).join(' ')}<br>${tex(`A = 4\\pi r^2 = ${N(s.A)}\\ \\mathrm{m^2},\\ T = ${N(s.TK, 5)}\\ \\mathrm{K}`)}<br>${tex(`P_{\\text{rad}} = \\sigma\\varepsilon AT^4 = ${N(s.Prad)}\\ \\mathrm{W}`)}<br>${tex(`P_{\\text{net}} = ${N(s.Pabs)} - ${N(s.Prad)} = ${N(s.Pnet)}\\ \\mathrm{W}`)}`);
      ui.revealed = true;
      for (const it of [...out, ...inn]) it.arrow.mat.color.setHex(HEAT);
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render() {
        const big = Math.max(s.Prad, s.Pabs, 1e-12);
        const Lo = ui.revealed ? Lm * s.Prad / big : 0.7 * Lm, Li = ui.revealed ? Lm * s.Pabs / big : 0.7 * Lm;
        for (const it of out) it.arrow.update(C.map((c, i) => c + it.d[i] * (rr + gap)), it.d, Lo);
        for (const it of inn) it.arrow.update(C.map((c, i) => c + it.d[i] * (rr + gap + Li)), it.d.map(v => -v), Li);
        const q = ui.revealed;
        lr.set(`${tex('P_{\\text{rad}}')} <span class="val">${q ? `${fmt(s.Prad)} W` : '= ?'}</span>`); lr.move(C.map((c, i) => c + out[0].d[i] * (rr + gap + Lo + 0.45)));
        la.set(`${tex('P_{\\text{abs}}')} <span class="val">${q ? `${fmt(s.Pabs)} W` : '= ?'}</span>`); la.move(C.map((c, i) => c + inn[2].d[i] * (rr + gap + Li + 0.4)));
      },
    };
    const span = rr + Lm + 1.6;
    stage.setHome({ target: [-0.3, cy, 0], direction: [0, 0.12, 1], distance: 2.9 * span + 1.0, minDistance: 1, maxDistance: 40 });
    return { legend: [{ label: '열 (heat)', color: '#d55e00' }] };
  }
}
