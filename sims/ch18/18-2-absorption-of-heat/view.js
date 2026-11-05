// 18.4 3D view. Scene unit = 10 cm; the containers are not to scale with the masses.
// curve: a glass beaker on a hot plate holds an ice block that shrinks as it melts; the water column grows, and steam
// puffs rise while it boils. The heat arrow (#D55E00, heat shares the thermal-energy colour) points from the plate into
// the beaker. After the check a graph board shows T against the heat supplied Q (the heating curve).
// mix: a hot solid sits in water inside a foam cup; heat arrows point from the solid into the water. After the check a
// graph board shows the solid's temperature (solid line) and the water's (dotted) against the heat moved Q.
import { texNum as N, fmt } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const HEAT = 0xd55e00;
const PLATE = 0.16;                        // hot plate top
const BOARD = { origin: [1.45, 0.15, -0.5], width: 5.6, height: 3.7 };
const SOLID_COLOR = { lead: 0x7d8590, tungsten: 0x8e9499, silver: 0xd3d8dc, copper: 0xb8734a, aluminum: 0xc4ccd4, brass: 0xc9a64a, granite: 0x9a8f87, glass: 0xa9d3e6 };
const degTex = T => `${T}\\ ^\\circ\\mathrm{C}`;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function hotPlate() {
    stage.floorPlane(0);
    stage.mesh(stage.group, new THREE.BoxGeometry(2.1, PLATE - 0.02, 2.1), stage.lit(0xd0d6dc, 0.4, 0.4), [0, (PLATE - 0.02) / 2, 0]);
    stage.mesh(stage.group, new THREE.CylinderGeometry(0.92, 0.92, 0.02, 48), stage.lit(0x2c3740, 0.3, 0.5), [0, PLATE - 0.01, 0]);
  }
  // Open glass container standing on y0 (radius r, height h).
  function container(y0, r, h, { color = 0xdfe8ef, opacity = 0.2 } = {}) {
    const m = stage.mesh(stage.group, new THREE.CylinderGeometry(r, r, h, 48, 1, true), new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.15, side: THREE.DoubleSide, depthWrite: false }), [0, y0 + h / 2, 0]);
    m.castShadow = false;
    stage.mesh(stage.group, new THREE.CylinderGeometry(r, r, 0.03, 48), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: opacity + 0.15, roughness: 0.15 }), [0, y0 + 0.015, 0]);
  }
  const waterMat = () => new THREE.MeshStandardMaterial({ color: 0x56b4e9, transparent: true, opacity: 0.42, roughness: 0.3, depthWrite: false });
  // Placeholder text where the graph board appears after the check (the board's axes would show the answer).
  function placeholder() {
    const { origin: [x, y], width, height } = BOARD;
    return stage.label('확인 뒤에 그래프를 그린다', [x + width / 2, y + height / 2, -0.5], 'station', { dy: 0, priority: 1 });
  }

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측');
      const out = p.activity === 'mix' ? buildMix(p, box) : buildCurve(p, box);
      stage.setHome({ target: [3.0, 1.75, 0], direction: [0.04, 0.2, 1], distance: 10.1, minDistance: 3, maxDistance: 30 });
      return out;
    },
    render(o) { if (cur) cur.render(o); },
  };

  // ---------------- heating curve ----------------
  function buildCurve(p, box) {
    const c = M.curve(p), R = 0.8, H = 2.1, base = PLATE + 0.03, kg0 = 0.5;
    hotPlate(); container(PLATE, R, H);
    const water = stage.mesh(stage.group, new THREE.CylinderGeometry(R - 0.03, R - 0.03, 1, 48), waterMat());
    water.castShadow = false;
    const ice = stage.mesh(stage.group, new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xd9ebf3, transparent: true, opacity: 0.9, roughness: 0.25 }));
    ice.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x7a8795 })));
    // Steam puffs as one instanced mesh.
    const NP = 7, puffs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.9, depthWrite: false }), NP);
    puffs.castShadow = false; stage.group.add(puffs);
    const Mx = new THREE.Matrix4();
    const heat = vecArrow(stage, HEAT, { radius: 0.035 }), lq = stage.label(tex('Q'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    heat.update([R + 0.3, PLATE + 0.05, 0.3], [0, 1, 0], 0.8); lq.move([R + 0.55, PLATE + 0.6, 0.3]);
    const Ttag = stage.label('', [-0.05, PLATE + H + 0.35, 0], 'tag', { dy: 0, priority: 3 });
    const hold = placeholder();
    let gb = null;

    const stepHtml = { ice: '얼음 데우기', melt: '녹이기 (melting)', water: '물 데우기', boil: '끓이기 (vaporizing)' };
    box.text(`${tex(`T_i = ${degTex(p.Ti)}`)}인 얼음 ${tex(`m = ${N(p.m)}\\ \\mathrm{g}`)}을 데워 ${p.boil ? '100 °C에서 모두 끓인다' : `${tex(`T_f = ${degTex(p.Tf)}`)}인 물로 만든다`}. ${tex('c_{\\text{ice}} = 2220\\ \\mathrm{J/kg\\cdot K}')}, ${tex('c_{\\text{water}} = 4187\\ \\mathrm{J/kg\\cdot K}')} (Table 18.4.1)이다. 재생하기 전에 구해 보자.`);
    box.text(`① 필요한 열의 합 ${tex('Q')}`, 'pred');
    const qi = box.answer({ label: '필요한 열', unit: 'kJ', placeholder: '예 120', onEnter: () => check() });
    box.text('② 열이 가장 많이 드는 단계', 'pred');
    const mi = box.choices('하나 고르기', c.steps.map(s => ({ value: s.id, html: stepHtml[s.id] })));
    const check = () => {
      const r = M.checkCurve(p, { QText: qi.value, most: mi() });
      if (r.QReason === 'unreadable') { box.feedback(false, '①을 숫자로 적자. 예 125.5'); return; }
      if (r.mostReason === 'none') { box.feedback(false, '②에서 하나를 고르자.'); return; }
      const hq = { noLatent: `녹는 동안 온도는 그대로지만 열 ${tex('Q = L_Fm')} (18.4.5)이 든다.`, noVapor: `끓는 동안에도 열 ${tex('Q = L_Vm')}이 든다.`, noIce: `먼저 얼음을 0 °C까지 데우는 열 ${tex('c_{\\text{ice}}m\\,\\Delta T')}가 든다.`, oneC: '얼음을 데울 때는 얼음의 비열을 쓴다.', swapL: `녹일 때는 융해열 ${tex('L_F')}를 쓴다. ${tex('L_V')}는 끓일 때 쓴다.`, units: 'kJ로 적자. 1 kJ = 1000 J다.', value: '단계마다 열을 구해 더하자 (LO 18.4.9).' }[r.QReason] ?? '';
      const hm = r.mostOk ? '' : '단계마다 구한 열을 비교하자.';
      const sol = c.steps.map(s => N(s.Q / 1000)).join(' + ');
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hq, hm].filter(Boolean).join(' ')}<br>${tex(`Q = ${sol} = ${N(c.Q / 1000)}\\ \\mathrm{kJ}`)}<br>가장 큰 단계는 ${stepHtml[c.most]}다.`);
      ui.revealed = true; hold.node.dataset.off = '1';
      if (!gb) {
        const yr = niceRange(p.Ti, c.Tend, { target: 5 }), xr = niceRange(0, c.Q / 1000, { target: 5 });
        gb = graphBoard(stage, { ...BOARD, t: [0, xr.max], tStep: xr.step, y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>Q</i> (kJ)', yTitle: '<i>T</i> (°C)' });
        gb.curve(q => M.curveAt(q * 1000, p).T, { color: 0x000000, samples: 600, tag: v => `${fmt(v, { zero: 1e-9 })} °C` });
        const s2 = c.steps[1], s4 = c.steps[3];
        stage.label('녹음', gb.at((s2.Q0 + s2.Q1) / 2000, 0), 'gtick', { dy: 16, priority: 2 });
        if (s4) stage.label('끓음', gb.at((s4.Q0 + s4.Q1) / 2000, 100), 'gtick', { dy: 16, priority: 2 });
      }
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        const hw = Math.max(1.3 * o.water / kg0, 1e-4);
        water.scale.set(1, hw, 1); water.position.set(0, base + hw / 2, 0); water.visible = o.water > 1e-6;
        const s = 0.95 * Math.cbrt(o.ice / kg0);
        ice.visible = o.ice > 1e-6; ice.scale.set(s, s, s);
        ice.position.set(0, Math.max(base + s / 2, base + hw - 0.4 * s), 0);
        const on = o.step === 'boil' || o.steam > 0;
        puffs.visible = on;
        if (on) for (let k = 0; k < NP; k++) {
          const ph = (o.u * 6 + k / NP) % 1, a = k * 2.4;
          Mx.makeTranslation(0.4 * Math.cos(a), base + hw + 0.15 + ph * 1.3, 0.4 * Math.sin(a)); puffs.setMatrixAt(k, Mx);
        }
        puffs.instanceMatrix.needsUpdate = true;
        Ttag.set(`<i>T</i> = ${fmt(o.T, { zero: 1e-9 })} °C`);
        if (gb) gb.setTime(o.Q / 1000);
      },
    };
    return { legend: [{ label: '열 (heat)', color: '#d55e00' }] };
  }

  // ---------------- thermal equilibrium ----------------
  function buildMix(p, box) {
    const s = M.mix(p), R = 0.85, H = 1.85, base = 0.03;
    stage.floorPlane(0);
    container(0, R, H, { color: 0xf4f4f0, opacity: 0.32 });
    const hw = 0.7 + 0.95 * p.mw / 600;
    const water = stage.mesh(stage.group, new THREE.CylinderGeometry(R - 0.04, R - 0.04, hw, 48), waterMat(), [0, base + hw / 2, 0]);
    water.castShadow = false;
    const rs = 0.28 * Math.cbrt(p.ms / 200);
    stage.mesh(stage.group, new THREE.CylinderGeometry(rs, rs, rs * 1.6, 32), stage.lit(SOLID_COLOR[p.solid], 0.5, 0.4), [0, base + rs * 0.8, 0]);
    const cy = base + rs * 0.8;
    for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0]]) {
      const a = vecArrow(stage, HEAT, { radius: 0.028 });
      a.update(d.map((v, i) => [0, cy, 0][i] + v * (rs + 0.05)), d, 0.38);
    }
    stage.label(tex('Q'), [0.3, cy + rs + 0.55, 0], 'qty', { dy: 0, priority: 2 });
    const tS = stage.label('', [0.7, cy - 0.15, 0.8], 'tag', { dy: 0, priority: 3 });
    const tW = stage.label('', [-0.2, base + hw + 0.45, 0], 'tag', { dy: 0, priority: 3 });
    const hold = placeholder();
    let gb = null;

    box.text(`${tex(`T_s = ${degTex(p.Ts)}`)}인 ${M.SOLIDS[p.solid].label} ${tex(`m_s = ${N(p.ms)}\\ \\mathrm{g}`)}을 ${tex(`T_w = ${degTex(p.Tw)}`)}인 물 ${tex(`m_w = ${N(p.mw)}\\ \\mathrm{g}`)}에 넣는다. ${tex(`c_s = ${s.cs}\\ \\mathrm{J/kg\\cdot K}`)}, ${tex('c_w = 4187\\ \\mathrm{J/kg\\cdot K}')} (Table 18.4.1)이다. 재생하기 전에 구해 보자.`);
    box.text(`① 열평형 (thermal equilibrium) 온도 ${tex('T_f')}`, 'pred');
    const ti = box.answer({ label: '나중 온도', unit: '°C', placeholder: '예 30', onEnter: () => check() });
    box.text(`② 물이 얻은 열 ${tex('Q')}`, 'pred');
    const qi = box.answer({ label: '물이 얻은 열', unit: 'kJ', placeholder: '예 15', onEnter: () => check() });
    const check = () => {
      const r = M.checkMix(p, { TText: ti.value, QText: qi.value });
      if (r.TReason === 'unreadable' || r.QReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 32.5'); return; }
      const ht = { average: '두 온도의 평균이 아니다. 비열과 질량이 다르다.', massOnly: '질량만이 아니라 비열도 넣자. 열용량 cm이 무게를 정한다.', noMass: '비열만이 아니라 질량도 넣자.', swapC: '고체에는 고체의 비열, 물에는 물의 비열을 쓴다.', kelvin: '°C로 적자.', value: `${tex('c_sm_s(T_f - T_s) + c_wm_w(T_f - T_w) = 0')}을 풀자.` }[r.TReason] ?? '';
      const hq = { sign: '물은 열을 얻으므로 양수다.', solidAll: '고체는 물의 처음 온도까지 식지 않는다. 나중 온도까지만 식는다.', units: 'kJ로 적자. 1 kJ = 1000 J다.', value: `${tex('Q = c_wm_w(T_f - T_w)')}이다.` }[r.QReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [ht, hq].filter(Boolean).join(' ')}<br>${tex(`T_f = \\dfrac{c_sm_sT_s + c_wm_wT_w}{c_sm_s + c_wm_w} = ${N(s.Tf)}\\ ^\\circ\\mathrm{C}`)}<br>${tex(`Q = c_wm_w(T_f - T_w) = ${N(s.Qw / 1000)}\\ \\mathrm{kJ}`)}`);
      ui.revealed = true; hold.node.dataset.off = '1';
      if (!gb) {
        const yr = niceRange(p.Tw, p.Ts, { target: 5, includeZero: false }), xr = niceRange(0, s.Qw / 1000, { target: 5 });
        gb = graphBoard(stage, { ...BOARD, t: [0, xr.max], tStep: xr.step, y: [yr.min, yr.max], yStep: yr.step, tTitle: '<i>Q</i> (kJ)', yTitle: '<i>T</i> (°C)' });
        gb.curve(q => M.mixAt(q * 1000, p).Ts, { color: 0x000000, samples: 120, tag: v => `고체 ${fmt(v)} °C` });
        gb.curve(q => M.mixAt(q * 1000, p).Tw, { color: 0x000000, samples: 120, dotted: true, tag: v => `물 ${fmt(v)} °C` });
      }
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        tS.set(ui.revealed ? `고체 <i>T</i><sub>s</sub> = ${fmt(o.Ts)} °C` : `고체 <i>T</i><sub>s</sub> = ?`);
        tW.set(ui.revealed ? `물 <i>T</i><sub>w</sub> = ${fmt(o.Tw)} °C` : `물 <i>T</i><sub>w</sub> = ?`);
        if (gb) gb.setTime(o.Q / 1000);
      },
    };
    return { legend: [{ label: '열 (heat)', color: '#d55e00' }] };
  }
}
