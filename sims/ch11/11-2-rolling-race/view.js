// 11.2 3D view. A ramp descending to the right, two lanes (race) or one (single). Each body rolls along its lane
// and turns by s/R; the block slides. Force arrows on the single body.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const rad = d => d * Math.PI / 180;
const RB = 0.3;

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function make(shape, color) {
    const g = new THREE.Group(), mat = stage.lit(color, 0.35, 0.4);
    if (shape === 'hoop') stage.mesh(g, new THREE.TorusGeometry(RB - 0.03, 0.03, 10, 48), mat);
    else if (shape === 'disk') stage.mesh(g, new THREE.CylinderGeometry(RB, RB, 0.12, 48), mat, [0, 0, 0], [Math.PI / 2, 0, 0]);
    else if (shape === 'sphere') stage.mesh(g, new THREE.SphereGeometry(RB, 36, 24), mat);
    else if (shape === 'shell') { const m = stage.mesh(g, new THREE.SphereGeometry(RB, 36, 24), stage.lit(color, 0.2, 0.3)); m.material.transparent = true; m.material.opacity = 0.5; }
    else stage.mesh(g, new THREE.BoxGeometry(0.5, 0.5, 0.4), mat);
    if (shape !== 'block') stage.mesh(g, new THREE.BoxGeometry(RB * 1.9, 0.03, 0.14), stage.flat(0x33475b), [0, 0, 0], [0, 0, 0], false);
    stage.group.add(g); return g;
  }

  return {
    build(p) {
      ui.revealed = false;
      const th = rad(p.theta), xR = 2.5, xL = xR - M.LEN * Math.cos(th), h = M.LEN * Math.sin(th);
      const u = [Math.cos(th), -Math.sin(th)], n = [Math.sin(th), Math.cos(th)];
      stage.board(stage.group, xL - 1.6, xR + 4.6, 2.6, 0);
      stage.floorPlane(-1.45);
      for (const x of [xL - 0.7, xR + 3.7]) for (const z of [-0.7, 0.7]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
      const sh = new THREE.Shape(); sh.moveTo(xL - 0.05, 0); sh.lineTo(xR, 0); sh.lineTo(xL, h); sh.lineTo(xL - 0.05, h); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: false }); geo.translate(0, 0, -0.9);
      stage.mesh(stage.group, geo, stage.lit(0xa9b8c4, 0.25, 0.5));
      stage.label(`<i>θ</i> = ${p.theta}°`, [xR - 1.1, 0.25, 0.95], 'tag', { dy: 0, priority: 1 });
      const race = p.activity === 'race', shapes = race ? [p.A, p.B] : [p.A], lanes = race ? [-0.45, 0.45] : [0];
      const objs = shapes.map((s, i) => make(s, [0xa9bccb, 0x8aa0b4][i]));
      const tags = shapes.map((s, i) => stage.label(race ? `${['A', 'B'][i]} ${M.SHAPES[s].label}` : M.SHAPES[s].label, [0, 0, 0], 'tag', { dy: -28, priority: 1 }));
      stage.mesh(stage.group, new THREE.BoxGeometry(0.05, 0.02, 1.8), stage.flat(0xffffff), [xR + 0.05, 0.012, 0], [0, 0, 0], false);
      const place = (s, i, shape) => {
        const top = [xL, h], r = shape === 'block' ? 0.25 : RB;
        const c = [top[0] + u[0] * (s + 0.4) + n[0] * r, top[1] + u[1] * (s + 0.4) + n[1] * r];
        if (s + 0.4 > M.LEN) { c[0] = xR + (s + 0.4 - M.LEN); c[1] = r; }
        return [c[0], c[1], lanes[i]];
      };
      // Force arrows for the single activity.
      const forces = race ? [] : ['\\vec F_g', '\\vec F_N', '\\vec f_s', '\\vec a'].map((t, i) => ({ a: vecArrow(stage, i === 3 ? 0xcc79a7 : 0xd55e00, { radius: 0.035 }), l: stage.label(tex(t), [0, 0, 0], 'qty', { dy: 0, priority: 2 }) }));
      const box = quizBox(ctx.panel, '예측');
      let check;
      if (race) {
        const rA = M.roll(p.A, p.theta);
        box.text(`두 물체를 빗면 꼭대기에서 함께 놓는다. 재생하기 전에 예측해 보자.`);
        const pick = box.choices('① 먼저 바닥에 닿는 것', [{ value: 'A', html: 'A' }, { value: 'B', html: 'B' }, { value: 'same', html: '같이 닿는다' }]);
        box.text(`② 바닥에서 A의 속력 ${tex('v_A')}`, 'pred');
        const vi = box.answer({ label: 'A의 속력', unit: 'm/s', placeholder: '예 3.5', onEnter: () => check() });
        check = () => {
          const r = M.checkRace(p, { pick: pick(), vText: vi.value });
          if (r.pickReason === 'empty') { box.feedback(null, '① 하나를 고르자.'); return; }
          if (r.vReason === 'unreadable') { box.feedback(false, '②를 숫자로 적자. 예 3.5'); return; }
          const h1 = r.pickOk ? '' : `${tex('I_{\\text{com}}/MR^2')}이 작은 물체가 빨리 내려간다. 질량과 반지름은 상관없다.`;
          const h2 = { noRotation: '회전 운동에너지를 빠뜨렸다. 미끄러지는 상자의 값이다.', half: `${tex('\\tfrac{1}{2}Mv^2(1 + I_{\\text{com}}/MR^2) = Mgh')}이다.`, value: `${tex('v = \\sqrt{2gh/(1 + I_{\\text{com}}/MR^2)}')}, ${tex(`h = ${N(rA.h)}\\ \\mathrm{m}`)}이다.` }[r.vReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [h1, h2].filter(Boolean).join(' ')}<br>${tex(`v_A = \\sqrt{\\dfrac{2gh}{1 + ${N(rA.k, 2)}}} = ${N(rA.v)}\\ \\mathrm{m/s}`)}`);
          ui.revealed = true; ctx.refresh();
        };
      } else {
        const r1 = M.roll(p.A, p.theta, p.M);
        box.text(`질량 ${tex(`M = ${N(p.M)}\\ \\mathrm{kg}`)}의 ${M.SHAPES[p.A].label}가 ${tex(`\\theta = ${p.theta}^\\circ`)} 빗면을 굴러 내려간다. 재생하기 전에 구해 보자.`);
        box.text(`① 질량중심 가속도의 크기 ${tex('a_{\\text{com}}')}`, 'pred');
        const ai = box.answer({ label: '가속도 크기', unit: 'm/s²', placeholder: '예 2.5', onEnter: () => check() });
        box.text(`② 정지 마찰력의 크기 ${tex('f_s')}`, 'pred');
        const fi = box.answer({ label: '정지 마찰력', unit: 'N', placeholder: '예 3', onEnter: () => check() });
        check = () => {
          const r = M.checkSingle(p, { aText: ai.value, fText: fi.value });
          if (r.aReason === 'unreadable' || r.fReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 2.5'); return; }
          const ha = { noRotation: `${tex('g\\sin\\theta')}는 미끄러지는 상자의 값이다. 굴러가면 회전 때문에 더 작다.`, value: `${tex('a = g\\sin\\theta/(1 + I_{\\text{com}}/MR^2)')} (11.2.8)이다.` }[r.aReason] ?? '';
          const hf = { gravityComponent: `그 값은 중력의 빗면 성분이다. ${tex('f_s = I_{\\text{com}}a/R^2')}이다.`, zero: '마찰력이 없으면 물체가 돌지 못하고 미끄러진다.', value: `${tex('f_s = I_{\\text{com}}a/R^2')} (11.2.7)이다.` }[r.fReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [ha, hf].filter(Boolean).join(' ')}<br>${tex(`a_{\\text{com}} = ${N(r1.a)}\\ \\mathrm{m/s^2},\\ f_s = ${N(r1.fs)}\\ \\mathrm{N}`)}`);
          ui.revealed = true; ctx.refresh();
        };
      }
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          o.list.forEach((b, i) => {
            const P = place(b.s, i, b.shape);
            objs[i].position.set(...P); objs[i].rotation.z = b.shape === 'block' ? (b.s + 0.4 <= M.LEN ? -th : 0) : -(b.s / RB);
            tags[i].move([P[0], P[1] + RB + 0.1, P[2]]);
          });
          if (!race) {
            const r1 = M.roll(p.A, p.theta, p.M), b = o.list[0], P = place(b.s, 0, b.shape), S = 1.2 / (p.M * M.G);
            const onRamp = b.s + 0.4 <= M.LEN;
            const vecs = [[[0, -1, 0], p.M * M.G], [[n[0], n[1], 0], onRamp ? p.M * M.G * Math.cos(th) : p.M * M.G], [[-u[0], -u[1], 0], onRamp ? r1.fs : 0], [[u[0], u[1], 0], onRamp && ui.revealed ? r1.a * 0.3 / S : 0]];
            forces.forEach((f, i) => {
              const L = vecs[i][1] * S, d = vecs[i][0], at = i === 2 ? [P[0] - n[0] * RB, P[1] - n[1] * RB, P[2] + 0.3] : [P[0], P[1], P[2] + 0.3];
              f.a.update(at, d, L); f.l.node.dataset.off = L > 0.02 ? '' : '1'; f.l.move(at.map((x, k) => x + d[k] * (L + 0.25)));
            });
          }
        },
      };
      stage.setHome({ target: [(xL + xR + 3) / 2, h / 2 + 0.4, 0], direction: [0.15, 0.25, 1], distance: 3.5 + (xR + 4.6 - xL) * 0.72, minDistance: 4, maxDistance: 30 });
      return { legend: race ? [] : [{ label: '힘 (force)', color: '#d55e00' }, { label: '가속도 (acceleration)', color: '#cc79a7' }] };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
