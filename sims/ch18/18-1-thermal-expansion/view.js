// 18.3 3D view. A lab board with a dark heating plate on top.
// rod (scene unit = 1 m): a rod pressed against a wall block at x = 0 grows to the right, drawn with its strain 50 times
// larger (M.MAG). A dashed black line marks the first end. Behind it a square plate of the same material with a hole
// grows about its center. After the check: a black ΔL arrow (length change, the displacement colour) and a dashed black
// circle at the first hole edge.
// cube (scene unit = 10 cm): a cube grows about its bottom center; a dashed black box keeps the first size.
import { texNum as N, fmt } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow, dashLine } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const COLOR = { lead: 0x7d8590, aluminum: 0xc4ccd4, brass: 0xc9a64a, copper: 0xb8734a, concrete: 0xb9b3a6, steel: 0x8d99a6,
  glass: 0xa9d3e6, pyrex: 0xbfe0ea, diamond: 0xdff3fa, invar: 0x9aa3ab, quartz: 0xe3eaee };
const TOP = 0.03;              // heating plate top (scene units)
const alphaTex = a => `${+(a * 1e6).toFixed(1)}\\times10^{-6}/\\mathrm{C}^\\circ`;
const degTex = T => `${T}\\ ^\\circ\\mathrm{C}`;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // Light floor and a ceramic heating plate, so the dashed black marks stay visible on it.
  function bench(x0, x1, z0, z1) {
    stage.floorPlane(0);
    const hp = stage.mesh(stage.group, new THREE.BoxGeometry(x1 - x0, TOP, z1 - z0), stage.lit(0xd8cfc2, 0.05, 0.75), [(x0 + x1) / 2, TOP / 2, (z0 + z1) / 2]);
    hp.castShadow = false;
  }
  const mat = m => stage.lit(COLOR[m], m === 'copper' || m === 'brass' || m === 'aluminum' || m === 'steel' || m === 'lead' || m === 'invar' ? 0.55 : 0.1, 0.4);

  return {
    build(p) {
      ui.revealed = false; cur = null;
      const box = quizBox(ctx.panel, '예측');
      return p.activity === 'cube' ? buildCube(p, box) : buildRod(p, box);
    },
    render(o) { if (cur) cur.render(o); },
  };

  // ---------------- rod and plate ----------------
  function buildRod(p, box) {
    const s = M.rod(p), zr = 0.3, zp = -0.38, PS = 0.5, R = 0.04;
    const xmax = Math.max(p.L * (1 + M.MAG * 29e-6 * 220), 1.2);
    bench(-0.3, xmax + 0.25, -0.75, 0.55);
    stage.mesh(stage.group, new THREE.BoxGeometry(0.1, 0.22, 0.26), stage.lit(0x56687a, 0.5, 0.4), [-0.05, TOP + 0.11, zr]);
    const geo = new THREE.CylinderGeometry(R, R, 1, 28); geo.rotateZ(-Math.PI / 2); geo.translate(0.5, 0, 0);
    const rod = stage.mesh(stage.group, geo, mat(p.mat), [0, TOP + R, zr]);
    // First end of the rod (always shown) and the ΔL arrow (after the check).
    dashLine(stage, [p.L, TOP, zr], [p.L, TOP + 0.3, zr], 0x000000, { dash: 0.03, gap: 0.025 });
    stage.label('처음 끝', [p.L, TOP + 0.38, zr], 'gtick', { dy: 0 });
    const dL = vecArrow(stage, 0x000000, { radius: 0.01 }), dLTag = stage.label('', [0, 0, 0], 'tag', { dy: 0, priority: 2 });
    dLTag.node.dataset.off = '1';
    // Square plate with a round hole, flat on the heating plate; it grows about its own center.
    const shape = new THREE.Shape();
    shape.moveTo(-PS / 2, -PS / 2); shape.lineTo(PS / 2, -PS / 2); shape.lineTo(PS / 2, PS / 2); shape.lineTo(-PS / 2, PS / 2); shape.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, M.HOLE / 2, 0, Math.PI * 2, true); shape.holes.push(hole);
    const pg = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false, curveSegments: 48 }); pg.rotateX(-Math.PI / 2);
    const px = Math.max(p.L / 2, 0.45);
    const plate = stage.mesh(stage.group, pg, mat(p.mat), [px, TOP, zp]);
    const ring = stage.line(Array.from({ length: 97 }, (_, i) => [px + M.HOLE / 2 * Math.cos(i * Math.PI / 48), TOP + 0.022, zp + M.HOLE / 2 * Math.sin(i * Math.PI / 48)]), 0x000000, { dashed: true, dash: 0.025, gap: 0.02 });
    ring.visible = false;
    stage.label(`구멍 지름 ${fmt(M.HOLE * 100)} cm`, [px, TOP + 0.05, zp - PS / 2 - 0.12], 'tag', { dy: 0, priority: 1 });
    const Ttag = stage.label('', [0.3, TOP + 0.55, zr], 'tag', { dy: 0, priority: 3 });

    box.text(`${M.MATERIALS[p.mat].label} 막대 (${tex(`L = ${N(p.L)}\\ \\mathrm{m}`)})와 같은 재료로 만든 판의 온도를 ${tex(`T_i = ${degTex(p.Ti)}`)}에서 ${tex(`T_f = ${degTex(p.Tf)}`)}로 바꾼다. Table 18.3.1에서 ${tex(`\\alpha = ${alphaTex(s.alpha)}`)}이다. 판에는 지름 ${fmt(M.HOLE * 100)} cm인 구멍이 있다. 재생하기 전에 예측해 보자.`);
    box.text(`① 막대 길이의 변화 ${tex('\\Delta L')} <small>줄어들면 음수로 적는다</small>`, 'pred');
    const li = box.answer({ label: '길이 변화', unit: 'mm', placeholder: '예 1.2', onEnter: () => check() });
    box.text('② 판에 뚫린 구멍의 지름은', 'pred');
    const hi = box.choices('하나 고르기', [
      { value: 'grow', html: '커진다' },
      { value: 'same', html: '그대로다' },
      { value: 'shrink', html: '작아진다' },
    ]);
    const check = () => {
      const r = M.checkRod(p, { dLText: li.value, hole: hi() });
      if (r.dLReason === 'unreadable') { box.feedback(false, '①을 숫자로 적자. 예 1.25'); return; }
      if (r.holeReason === 'none') { box.feedback(false, '②에서 하나를 고르자.'); return; }
      const hl = { sign: `온도가 내려가면 막대가 줄어든다. ${tex('\\Delta L')}은 음수다.`, beta: `선팽창에는 ${tex('\\alpha')}를 쓴다. ${tex('3\\alpha')}는 부피 팽창 계수 ${tex('\\beta')}다.`, final: `나중 온도가 아니라 온도 변화 ${tex('\\Delta T = T_f - T_i')}를 곱한다.`, units: `단위를 확인하자. ${tex('10^{-6}')}과 ${tex('1\\ \\mathrm{m} = 1000\\ \\mathrm{mm}')}를 챙기자.`, value: `${tex('\\Delta L = L\\alpha\\,\\Delta T')} (18.3.1)이다.` }[r.dLReason] ?? '';
      const hh = r.holeOk ? '' : '판의 모든 길이가 같은 비율로 바뀐다 (Fig. 18.3.3). 구멍의 지름도 그 길이 가운데 하나다.';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [hl, hh].filter(Boolean).join(' ')}<br>${tex(`\\Delta L = L\\alpha\\,\\Delta T = (${N(p.L)}\\ \\mathrm{m})(${alphaTex(s.alpha)})(${N(s.dT)}\\ \\mathrm{K}) = ${N(s.dLmm)}\\ \\mathrm{mm}`)}<br>구멍 지름 ${tex(`\\Delta D = D\\alpha\\,\\Delta T = ${N(s.dD * 1000)}\\ \\mathrm{mm}`)}`);
      ui.revealed = true; ring.visible = true; dLTag.node.dataset.off = '';
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        const f = 1 + M.MAG * o.strain, len = p.L * f;
        rod.scale.set(len, 1, 1);
        plate.scale.set(f, 1, f);
        Ttag.set(`<i>T</i> = ${fmt(o.T, { zero: 1e-9 })} °C`);
        const d = len - p.L, show = ui.revealed && Math.abs(d) > 0.004;
        dL.update([p.L, TOP + 0.2, zr], [Math.sign(d) || 1, 0, 0], show ? Math.abs(d) : 0);
        dLTag.node.dataset.off = ui.revealed ? '' : '1';
        dLTag.set(`Δ<i>L</i> = ${fmt(o.dLmm, { zero: 1e-9 })} mm`);
        dLTag.move([p.L + d / 2, TOP + 0.6, zr]);
      },
    };
    const W = xmax + 0.85;
    stage.setHome({ target: [W / 2 - 0.35, 0.05, -0.08], direction: [0, 0.78, 1], distance: 0.95 * W + 0.2, minDistance: 0.6, maxDistance: 20 });
    return { legend: [{ label: '길이 변화 (length change)', color: '#000000' }] };
  }

  // ---------------- cube ----------------
  function buildCube(p, box) {
    const s = M.cube(p), K = 0.1, a = p.side * K;                    // scene units per cm
    const amax = 20 * K * (1 + M.MAG * 29e-6 * 220), span = Math.max(a * 1.8, 1.4);
    bench(-span, span, -span, span);
    const cube = stage.mesh(stage.group, new THREE.BoxGeometry(1, 1, 1), mat(p.mat));
    // First size as a dashed black box.
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(a, a, a)), new THREE.LineDashedMaterial({ color: 0x000000, dashSize: a * 0.06, gapSize: a * 0.04, depthTest: false, transparent: true }));
    edges.position.set(0, TOP + a / 2, 0); edges.computeLineDistances(); edges.renderOrder = 19; stage.group.add(edges);
    stage.label(`<i>a</i> = ${p.side} cm`, [0, TOP + 0.02, a / 2 + 0.2], 'tag', { dy: 0, priority: 1 });
    const Ttag = stage.label('', [-span + 0.3, TOP + Math.max(a, 0.6) + 0.3, 0], 'tag', { dy: 0, priority: 3 });
    const Atag = stage.label('', [0, 0, 0], 'tag', { dy: 0, priority: 2 }), Vtag = stage.label('', [0, 0, 0], 'tag', { dy: 0, priority: 2 });
    Atag.node.dataset.off = Vtag.node.dataset.off = '1';

    box.text(`한 변이 ${tex(`a = ${N(p.side)}\\ \\mathrm{cm}`)}인 ${M.MATERIALS[p.mat].label} 정육면체의 온도를 ${tex(`T_i = ${degTex(p.Ti)}`)}에서 ${tex(`T_f = ${degTex(p.Tf)}`)}로 바꾼다. Table 18.3.1에서 ${tex(`\\alpha = ${alphaTex(s.alpha)}`)}이다. 재생하기 전에 구해 보자.`);
    box.text(`① 한 면의 넓이 변화 ${tex('\\Delta A')} <small>줄어들면 음수로 적는다</small>`, 'pred');
    const ai = box.answer({ label: '넓이 변화', unit: 'mm²', placeholder: '예 15', onEnter: () => check() });
    box.text(`② 부피 변화 ${tex('\\Delta V')}`, 'pred');
    const vi = box.answer({ label: '부피 변화', unit: 'cm³', placeholder: '예 2', onEnter: () => check() });
    const check = () => {
      const r = M.checkCube(p, { AText: ai.value, VText: vi.value });
      if (r.AReason === 'unreadable' || r.VReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 12.5'); return; }
      const ha = { sign: '온도가 내려가면 넓이도 줄어든다.', alpha: `넓이는 두 방향으로 늘어난다. ${tex('2\\alpha')}를 쓰자.`, beta: `${tex('3\\alpha')}는 부피에 쓴다. 넓이는 ${tex('2\\alpha')}다.`, units: `${tex('1\\ \\mathrm{cm^2} = 100\\ \\mathrm{mm^2}')}다.`, value: `${tex('\\Delta A = A(2\\alpha)\\,\\Delta T')}이다.` }[r.AReason] ?? '';
      const hv = { sign: '온도가 내려가면 부피도 줄어든다.', alpha: `부피는 세 방향으로 늘어난다. ${tex('\\beta = 3\\alpha')} (18.3.3)다.`, area: `${tex('2\\alpha')}는 넓이에 쓴다. 부피는 ${tex('3\\alpha')}다.`, units: `cm³로 적자. ${tex('1\\ \\mathrm{cm^3} = 1000\\ \\mathrm{mm^3}')}다.`, value: `${tex('\\Delta V = V\\beta\\,\\Delta T')} (18.3.2)이다.` }[r.VReason] ?? '';
      box.feedback(r.ok, `${r.ok ? '맞다.' : [ha, hv].filter(Boolean).join(' ')}<br>${tex(`\\Delta A = a^2(2\\alpha)\\,\\Delta T = ${N(s.dA)}\\ \\mathrm{mm^2}`)}<br>${tex(`\\Delta V = a^3(3\\alpha)\\,\\Delta T = ${N(s.dV)}\\ \\mathrm{cm^3}`)}`);
      ui.revealed = true; Atag.node.dataset.off = Vtag.node.dataset.off = '';
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

    cur = {
      render(o) {
        const b = a * (1 + M.MAG * o.strain);
        cube.scale.set(b, b, b); cube.position.set(0, TOP + b / 2, 0);
        Ttag.set(`<i>T</i> = ${fmt(o.T, { zero: 1e-9 })} °C`);
        Atag.set(`Δ<i>A</i> = ${fmt(o.dA, { zero: 1e-9 })} mm²`); Atag.move([0, TOP + b + 0.12, 0]);
        Vtag.set(`Δ<i>V</i> = ${fmt(o.dV, { zero: 1e-9 })} cm³`); Vtag.move([b / 2 + 0.55, TOP + b / 2, 0]);
      },
    };
    const H = Math.max(amax, 0.8);
    stage.setHome({ target: [0, Math.min(a, H) * 0.55, 0], direction: [0.75, 0.6, 1], distance: 2.6 * Math.max(a * 1.25, 0.7) + 1.2, minDistance: 0.8, maxDistance: 20 });
    return { legend: [] };
  }
}
