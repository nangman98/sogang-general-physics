// 6.2 3D view. The camera falls with the ball: the ball stays at y = 0 and a measuring pole with 1 m ticks
// slides up past it (a treadmill of tick marks, so a fall of hundreds of metres fits the stage). Drag D and
// gravitational force Fg are drawn on the ball. A v–t graph board stands to the right.
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui, scaleOf } from './spec.js';

const COL = { force: 0xd55e00, vel: 0x0072b2 };
const LEGEND = [{ label: '힘 (force)', color: '#d55e00' }, { label: '속도 (velocity)', color: '#0072b2' }];
const WINDOW = 4;                                     // m of pole shown above and below the ball
const LABEL_EVERY = 5;                                // m between distance labels on the pole

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  // One falling lane: pole with sliding ticks, a ball, and its two force arrows.
  function lane(x, b, name, S, rv) {
    const g = stage.group;
    stage.mesh(g, new THREE.BoxGeometry(0.42, 2 * WINDOW + 0.8, 0.22), stage.lit(0x304756, 0.2, 0.52), [x - 1.05, 0, -0.25]);
    const minor = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.035, 0.05), stage.lit(0xd8e5ee, 0.2, 0.5), 2 * WINDOW + 2);
    const major = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.07, 0.06), stage.lit(0xf4f8fc, 0.2, 0.4), 3);
    minor.frustumCulled = major.frustumCulled = false;
    g.add(minor, major);
    const labels = [0, 1, 2].map(() => stage.label('', [x - 1.75, 0, 0], 'measure', { dy: 0 }));
    const ball = stage.ball([x, 0, 0], rv, 0xe8edf2);
    const tag = stage.label(name, [x + rv + 0.55, 0.25, 0.3], 'tag', { dy: 0, priority: -1 });
    const D = vecArrow(stage, COL.force, { radius: 0.05 }), F = vecArrow(stage, COL.force, { radius: 0.05 });
    const dl = stage.label(tex('\\vec D'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const fl = stage.label(tex('\\vec F_g'), [0, 0, 0], 'qty', { dy: 0, priority: 2 });
    const Mx = new THREE.Matrix4(), hide = new THREE.Matrix4().makeScale(0, 0, 0);
    return {
      tag,
      update(o) {
        const s = o.s, base = Math.floor(s);
        let k = 0, j = 0;
        for (let d = base - WINDOW; d <= base + WINDOW + 1; d++) {
          const y = s - d;                                   // tick for distance d sits above the ball once passed
          const show = Math.abs(y) <= WINDOW + 0.3 && d >= 0;
          if (show && d % LABEL_EVERY === 0 && j < 3) {
            major.setMatrixAt(j, Mx.makeTranslation(x - 1.05, y, -0.08));
            labels[j].move([x - 1.85, y, 0]); labels[j].set(`${d} m`); labels[j].node.dataset.off = Math.abs(y) < WINDOW - 0.4 ? '' : '1';
            j++;
          }
          minor.setMatrixAt(k++, show ? Mx.makeTranslation(x - 1.05, y, -0.1) : hide);
        }
        for (; j < 3; j++) { major.setMatrixAt(j, hide); labels[j].node.dataset.off = '1'; }
        minor.instanceMatrix.needsUpdate = major.instanceMatrix.needsUpdate = true;
        const Ld = o.D * S, Lf = o.Fg * S;
        D.update([x, rv * 0.2, 0.05], [0, 1, 0], Ld); F.update([x, -rv * 0.2, 0.05], [0, -1, 0], Lf);
        dl.move([x - 0.42, rv * 0.2 + Math.max(Ld, 0.15) + 0.3, 0.05]); dl.node.dataset.off = Ld > 0.05 ? '' : '1';
        fl.move([x - 0.45, -rv * 0.2 - Lf - 0.3, 0.05]);
      },
    };
  }

  function predict(p) {
    const box = quizBox(ctx.panel, '예측');
    let grade;
    if (p.activity === 'compare') {
      box.text(`물체 2의 질량은 물체 1의 ${p.km}배, 단면 넓이는 ${p.kA}배다. 재생하기 전에 종단 속력의 비를 구해 보자.`);
      box.text(`① ${tex('v_{t2}/v_{t1}')}`, 'pred');
      const rIn = box.answer({ label: '종단 속력의 비', placeholder: '예 1.2', onEnter: () => check() });
      grade = () => {
        const r = M.checkCompare(p, { rText: rIn.value });
        if (r.reason === 'unreadable') return { ok: false, msg: '①을 숫자로 적자. 예 0.85' };
        const hint = {
          linear: `식 (6.2.3)에서 ${tex('v_t')}는 ${tex('m/A')}의 제곱근에 비례한다.`,
          inverse: '분자와 분모가 바뀌었다. 질량이 크면 빨라지고 넓이가 크면 느려진다.',
          areaOnly: '질량 배율도 넣자.', massOnly: '넓이 배율도 넣자.',
          value: `${tex('C')}, ${tex('\\rho')}는 같으므로 ${tex('v_{t2}/v_{t1} = \\sqrt{(m_2/m_1)(A_1/A_2)}')}이다.`,
        }[r.reason] ?? '';
        return { ok: r.ok, msg: `${r.ok ? '맞다.' : hint}<br>${tex(`\\dfrac{v_{t2}}{v_{t1}} = \\sqrt{\\dfrac{${p.km}}{${p.kA}}} = ${N(M.ratio(p))}`)}` };
      };
    } else {
      const V = M.terminal(M.bodies(p)[0]);
      box.text('재생하기 전에 종단 속력과 그때의 가속도를 구해 보자.');
      box.text(`① 종단 속력 (terminal speed) ${tex('v_t')}`, 'pred');
      const vIn = box.answer({ label: '종단 속력', unit: 'm/s', placeholder: '예 25', onEnter: () => check() });
      const acc = box.choices('② 종단 속력에 이른 뒤의 가속도', [{ value: 'zero', html: '0' }, { value: 'g', html: `아래로 ${tex('g')}` }, { value: 'up', html: `위쪽 (${tex('D')}가 ${tex('F_g')}보다 커져서)` }]);
      grade = () => {
        const r = M.checkFall(p, { vText: vIn.value, accel: acc() });
        if (r.aReason === 'empty') return { ok: null, msg: '② 가속도를 고르자.', stop: true };
        if (r.vReason === 'unreadable') return { ok: false, msg: '①을 숫자로 적자. 예 25.3', stop: true };
        const hintV = {
          noHalf: `식 (6.2.1)의 ${tex('\\tfrac{1}{2}')}를 빠뜨렸다.`, noRoot: '제곱근을 빠뜨렸다.',
          cm: `반지름을 m로 바꾸자. ${tex(`r = ${p.r}\\ \\mathrm{cm} = ${N(p.r / 100)}\\ \\mathrm{m}`)}`,
          area: `단면 넓이는 ${tex('A = \\pi r^2')}이다.`, value: `${tex('D = F_g')}로 놓고 ${tex('v')}를 풀자.`,
        }[r.vReason] ?? '';
        const hintA = { g: '종단 속력에서는 항력과 중력이 같아 알짜힘이 0이다.', up: `떨어지기 시작한 공에서는 ${tex('D')}가 ${tex('F_g')}를 넘지 않는다. 같아지면 더 빨라지지 않는다.` }[r.aReason] ?? '';
        const A = M.area(p.r);
        return { ok: r.ok, msg: `${r.ok ? '맞다.' : [hintV, hintA].filter(Boolean).join(' ')}<br>${tex(`A = \\pi r^2 = ${N(A)}\\ \\mathrm{m^2}`)}<br>${tex(`v_t = \\sqrt{\\dfrac{2mg}{C\\rho A}} = ${N(V)}\\ \\mathrm{m/s}`)}<br>${tex('a = 0')}` };
      };
    }
    let onReveal = () => {};
    const check = () => {
      const r = grade();
      box.feedback(r.ok, r.msg);
      if (r.stop) return;
      ui.revealed = true; onReveal(); ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }]);
    return { set onReveal(f) { onReveal = f; } };
  }

  return {
    build(p) {
      ui.revealed = false;
      const bs = M.bodies(p), S = scaleOf(p), T = M.duration(p);
      const two = bs.length === 2;
      const rv1 = 0.24 + 0.03 * p.r;
      const xs = two ? [-2.5, 0.5] : [0];
      const lanes = bs.map((b, i) => lane(xs[i], b, two ? `물체 ${i + 1}` : '공', S, i === 0 ? rv1 : rv1 * Math.sqrt(p.kA)));
      const Vs = bs.map(b => M.terminal(b)), Vmax = Math.max(...Vs);
      const yr = niceRange(0, Vmax * 1.12, { target: 4 });
      const x0 = xs[xs.length - 1] + 1.6;
      const gb = graphBoard(stage, { origin: [x0, -2.7, -0.4], width: 8.4, height: 5.4, t: [0, T], y: [yr.min, yr.max], yStep: yr.step, yTitle: '<i>v</i> (m/s)' });
      bs.forEach((b, i) => gb.curve(t => M.fallAt(t, b).v, { color: COL.vel, dotted: i === 1, tag: v => `<i>v</i>${two ? `<sub>${i + 1}</sub>` : ''} = ${fmt(v, { zero: 1e-9 })} m/s` }));
      const guides = Vs.map((V, i) => {
        const l = stage.line([gb.at(0, V), gb.at(T, V)].map(q => [q[0], q[1], q[2] + 0.02]), 0x40546a, { dashed: true, dash: 0.22, gap: 0.14 });
        const lab = stage.label(`${tex(two ? `v_{t${i + 1}}` : 'v_t')} = ${fmt(V)} m/s`, [gb.at(T, V)[0] - 1.3, gb.at(T, V)[1] + 0.28, gb.Z], 'gval', { dy: i ? 18 : -2, priority: 4 });
        l.visible = false; lab.node.dataset.off = '1';
        return { l, lab };
      });
      const pr = predict(p);
      pr.onReveal = () => { for (const g of guides) { g.l.visible = true; g.lab.node.dataset.off = ''; } };
      cur = { render(o) { o.list.forEach((s, i) => lanes[i].update(s)); gb.setTime(o.t); } };
      const left = xs[0] - 2.4, right = x0 + 8.6;
      stage.setHome({ target: [(left + right) / 2, 0, 0], direction: [0, 0.08, 1], distance: 3 + (right - left) * 1.1, minDistance: 5, maxDistance: 45 });
      return { legend: LEGEND };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
