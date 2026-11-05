// 9.6–9.7 3D view. Two carts on an air track standing on the measuring board, velocity arrows, the center of mass
// mark above the track, and an x–t board behind (cart 1 solid, cart 2 dotted, center of mass dashed).
import { fmt, texNum as N } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { graphBoard, niceRange } from '../../../core/graph3d.js';
import { vecArrow } from '../../../core/forces3d.js';
import * as M from './model.js';
import { ui } from './spec.js';

const LEGEND = [{ label: '위치 (position)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' }];

export function view(stage, ctx) {
  const { THREE } = stage;
  const tex = ctx.tex;
  let cur = null;

  function cart(m, color) {
    const g = new THREE.Group(), h = 0.18 + 0.1 * Math.cbrt(m), w = 0.5;
    stage.mesh(g, new THREE.BoxGeometry(M.LEN, h, w), stage.lit(color, 0.35, 0.45), [0, h / 2 + 0.06, 0]);
    stage.mesh(g, new THREE.BoxGeometry(M.LEN * 0.9, 0.06, w * 1.2), stage.lit(0x56687a, 0.5, 0.4), [0, 0.03, 0]);
    for (const s of [-1, 1]) stage.mesh(g, new THREE.BoxGeometry(0.03, h * 0.6, w * 0.6), stage.lit(0x33475b, 0.3, 0.6), [s * M.LEN / 2, h / 2 + 0.06, 0]);
    stage.group.add(g); g.h = h; return g;
  }

  return {
    build(p) {
      ui.revealed = false;
      const T = M.duration(p), s = M.solve(p), tc = M.collisionTime(p);
      stage.board(stage.group, -7.4, 7.4, 2.0, 0);
      stage.floorPlane(-1.45);
      for (const x of [-6.5, 6.5]) for (const z of [-0.5, 0.5]) stage.mesh(stage.group, new THREE.CylinderGeometry(0.36, 0.45, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
      stage.mesh(stage.group, new THREE.BoxGeometry(2 * M.END + 0.4, 0.12, 0.4), stage.lit(0x8c9ca9, 0.65, 0.3), [0, 0.06, 0]);
      for (const x of [-M.END - 0.1, M.END + 0.1]) stage.mesh(stage.group, new THREE.BoxGeometry(0.12, 0.5, 0.6), stage.lit(0x33475b, 0.4, 0.4), [x, 0.25, 0]);
      const tick = [];
      for (let x = -6; x <= 6; x++) tick.push([x, 0.012, 0.6], [x, 0.012, 0.75]);
      stage.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tick.map(stage.v3)), new THREE.LineBasicMaterial({ color: 0xd8e5ee })));
      for (let x = -6; x <= 6; x += 2) stage.label(`${x} m`, [x, 0.05, 0.95], 'measure');
      const c1 = cart(p.m1, 0xa9bccb), c2 = cart(p.m2, 0x8aa0b4);
      const t1 = stage.label('수레 1', [0, 0, 0], 'tag', { dy: 0, priority: -1 }), t2 = stage.label('수레 2', [0, 0, 0], 'tag', { dy: 0, priority: -1 });
      const V1 = vecArrow(stage, 0x0072b2, { radius: 0.035 }), V2 = vecArrow(stage, 0x0072b2, { radius: 0.035 });
      const mark = new THREE.Group(); stage.group.add(mark);
      stage.mesh(mark, new THREE.TorusGeometry(0.12, 0.022, 10, 40), stage.flat(0x000000), [0, 0, 0], [0, 0, 0], false);
      for (const r of [0, Math.PI / 2]) stage.mesh(mark, new THREE.BoxGeometry(0.3, 0.02, 0.02), stage.flat(0x000000), [0, 0, 0], [0, 0, r], false);
      const markLab = stage.label('질량중심', [0, 0, 0], 'gtick', { dy: -16, priority: 0 });

      const xs = Array.from({ length: 81 }, (_, i) => M.stateAt(T * i / 80, p)).flatMap(o => [o.x1, o.x2]);
      const yr = niceRange(Math.min(...xs) - 0.3, Math.max(...xs) + 0.3, { includeZero: false, target: 4 });
      const gb = graphBoard(stage, { origin: [-7.2, 1.1, -1.6], width: 14.4, height: 3.6, t: [0, T], y: [yr.min, yr.max], yStep: yr.step, yTitle: '<i>x</i> (m)' });
      gb.curve(t => M.stateAt(t, p).x1, { color: 0x000000, samples: 240, tag: () => '수레 1' });
      gb.curve(t => M.stateAt(t, p).x2, { color: 0x000000, samples: 240, dotted: true, tag: () => '수레 2' });
      const s0 = M.stateAt(0, p);
      stage.line([gb.at(0, s0.xcom), gb.at(T, s0.xcom + s0.vcom * T)].map(q => [q[0], q[1], q[2] + 0.02]), 0x7a8795, { dashed: true, dash: 0.2, gap: 0.12 });
      stage.line([gb.at(tc, yr.min), gb.at(tc, yr.max)].map(q => [q[0], q[1], q[2] + 0.015]), 0xc6d0db);
      stage.label('충돌', gb.at(tc, yr.max - 0.12 * (yr.max - yr.min)), 'gtick', { dy: 0, priority: 1 });

      const box = quizBox(ctx.panel, '예측');
      const P0 = p.m1 * p.v1i + p.m2 * p.v2i;
      box.text(`${tex(`m_1 = ${N(p.m1)},\\ m_2 = ${N(p.m2)}\\ \\mathrm{kg}`)}, ${tex(`v_{1i} = ${N(p.v1i)},\\ v_{2i} = ${N(p.v2i)}\\ \\mathrm{m/s}`)}. 재생하기 전에 구해 보자.`);
      let check;
      if (p.activity === 'inelastic') {
        box.text(`① 붙은 뒤 속도 ${tex('V')}`, 'pred');
        const a = box.answer({ label: '붙은 뒤 속도', unit: 'm/s', placeholder: '예 0.8', onEnter: () => check() });
        box.text(`② 줄어든 운동에너지 ${tex('K_i - K_f')}`, 'pred');
        const b = box.answer({ label: '줄어든 운동에너지', unit: 'J', placeholder: '예 1.2', onEnter: () => check() });
        check = () => {
          const r = M.checkInelastic(p, { VText: a.value, lossText: b.value });
          if (r.VReason === 'unreadable' || r.LReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 0.8'); return; }
          const hV = { noV2: `수레 2의 처음 운동량 ${tex('m_2v_{2i}')}도 넣자.`, average: '두 속도의 단순 평균이 아니라 질량으로 가중한 평균이다.', value: `${tex('(m_1 + m_2)V = m_1v_{1i} + m_2v_{2i}')}이다.` }[r.VReason] ?? '';
          const hL = { zero: '붙는 충돌에서는 운동에너지가 줄어든다. 운동량만 보존된다.', sign: '줄어든 양을 양수로 적자.', value: `${tex('K_i - K_f = \\tfrac{1}{2}m_1v_{1i}^2 + \\tfrac{1}{2}m_2v_{2i}^2 - \\tfrac{1}{2}(m_1 + m_2)V^2')}이다.` }[r.LReason] ?? '';
          box.feedback(r.ok, `${r.ok ? '맞다.' : [hV, hL].filter(Boolean).join(' ')}<br>${tex(`V = \\dfrac{${N(P0)}}{${N(p.m1 + p.m2)}} = ${N(s.V)}\\ \\mathrm{m/s}`)}<br>${tex(`K_i - K_f = ${N(r.loss)}\\ \\mathrm{J}`)}`);
          ui.revealed = true;
        };
      } else {
        box.text(`① 충돌 뒤 수레 1의 속도 ${tex('v_{1f}')}`, 'pred');
        const a = box.answer({ label: '수레 1 나중 속도', unit: 'm/s', placeholder: '예 -0.5', onEnter: () => check() });
        box.text(`② 충돌 뒤 수레 2의 속도 ${tex('v_{2f}')}`, 'pred');
        const b = box.answer({ label: '수레 2 나중 속도', unit: 'm/s', placeholder: '예 1.5', onEnter: () => check() });
        check = () => {
          const r = M.checkElastic(p, { aText: a.value, bText: b.value });
          if (r.aReason === 'unreadable' || r.bReason === 'unreadable') { box.feedback(false, '①과 ②를 숫자로 적자. 예 -0.5'); return; }
          const h = { sign: '방향(부호)을 보자. 가벼운 수레가 무거운 수레에 부딪히면 튀어 돌아온다.', swap: '두 질량이 같을 때만 속도를 서로 바꾼다.', stick: '그 값은 두 수레가 붙을 때의 속도다. 탄성 충돌은 운동에너지도 보존한다.', value: '운동량 보존과 운동에너지 보존을 함께 풀자 (식 9.7.14, 9.7.15).' };
          const msg = [h[r.aReason], h[r.bReason]].filter(Boolean).filter((v, i, x) => x.indexOf(v) === i).join(' ');
          box.feedback(r.ok, `${r.ok ? '맞다.' : msg}<br>${tex(`v_{1f} = ${N(s.v1f)}\\ \\mathrm{m/s},\\ v_{2f} = ${N(s.v2f)}\\ \\mathrm{m/s}`)}`);
          ui.revealed = true;
        };
      }
      box.buttons([{ label: '확인', primary: true, onClick: () => check() }]);

      cur = {
        render(o) {
          c1.position.set(o.x1, 0.12, 0); c2.position.set(o.x2, 0.12, 0);
          t1.move([o.x1, c1.h + 0.65, 0.3]); t2.move([o.x2, c2.h + 0.65, 0.3]);
          const L1 = Math.abs(o.v1) * 0.5, L2 = Math.abs(o.v2) * 0.5;
          V1.update([o.x1, c1.h + 0.32, 0], [Math.sign(o.v1) || 1, 0, 0], L1);
          V2.update([o.x2, c2.h + 0.32, 0], [Math.sign(o.v2) || 1, 0, 0], L2);
          mark.position.set(o.xcom, 1.15, 0.2); markLab.move([o.xcom, 1.15, 0.2]);
          gb.setTime(o.t);
        },
      };
      stage.setHome({ target: [0, 2.0, -0.5], direction: [0, 0.2, 1], distance: 15.5, minDistance: 5, maxDistance: 35 });
      return { legend: LEGEND };
    },
    render(o) { if (cur) cur.render(o); },
  };
}
