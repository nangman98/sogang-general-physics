// 5.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c05에서 확인했다 (Atwood's machine, sliding block, hanging block, inclined plane, tension,
// gravitational force, normal force, massless, frictionless pulley, free-body diagram).
import { tex } from '../../../core/math.js';
import { fmt } from '../../../core/format.js';
import * as M from './model.js';

// Prediction state shared with view.js. Acceleration and tension stay hidden until "확인".
export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '5-2',
  course: '일반물리 I',
  chapter: 5,
  chapterTitle: 'Force and Motion—I',
  module: '5.3',
  title: '연결된 물체 (Applying Newton’s Laws)',
  headerNote: '교재 Principles of Physics 12e · Module 5.3',
  dt: 1 / 240,
  // Connected blocks reach the end of the stand in a few seconds, so this screen starts at physical time (1×).
  speed: 1,
  sceneTitle: p => ({ atwood: '애트우드 기계 (Atwood’s machine)', incline: '마찰 없는 빗면 (inclined plane)과 매단 블록' }[p.activity]),

  assumptions: p => [
    '줄은 질량이 없고 (massless) 늘어나지 않는다',
    '도르래는 질량과 마찰이 없다 (massless, frictionless pulley)',
    ...(p.activity === 'incline' ? ['빗면은 마찰이 없다 (frictionless)'] : []),
    '두 블록의 가속도 크기 <i>a</i>는 같다',
    '블록은 처음에 정지해 있다',
    `<i>g</i> = ${M.G} m/s²`,
    p.activity === 'incline' ? '+<i>x</i>는 빗면 위쪽, 매단 블록의 +<i>y</i>는 위쪽이다' : '+<i>y</i>는 위쪽이다',
  ],

  equations: p => {
    const row = (t, note) => ({ html: `${tex(t)}<small class="missing">${note}</small>` });
    if (p.activity === 'incline') {
      return [
        { tex: '\\begin{aligned}F_{\\mathrm{net},x} &= Ma_x\\\\ F_{\\mathrm{net},y} &= Ma_y\\\\ F_{\\mathrm{net},z} &= Ma_z\\end{aligned}', no: '5.3.2' },
        row('T - Mg\\sin\\theta = Ma', '미끄러지는 블록 S, 빗면 방향'),
        row('F_N - Mg\\cos\\theta = 0', '미끄러지는 블록 S, 빗면에 수직'),
        { html: `${tex('T - mg = -ma')}<small class="missing">매단 블록 H</small>`, no: '5.3.6' },
      ];
    }
    return [
      { tex: '\\begin{aligned}F_{\\mathrm{net},x} &= ma_x\\\\ F_{\\mathrm{net},y} &= ma_y\\\\ F_{\\mathrm{net},z} &= ma_z\\end{aligned}', no: '5.1.2' },
      row('T - m_1 g = m_1 a', '블록 1'),
      row('T - m_2 g = -m_2 a', '블록 2'),
    ];
  },

  readouts: p => {
    const show = (fn) => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    const weights = p.activity === 'incline'
      ? { id: 'Fg', label: '중력 (gravitational force)', value: (o, q, f) => `<i>F</i><sub>gS</sub> = ${f(q.M * M.G)} N<br><i>F</i><sub>gH</sub> = ${f(q.m * M.G)} N` }
      : { id: 'Fg', label: '중력 (gravitational force)', value: (o, q, f) => `<i>F</i><sub>g1</sub> = ${f(q.m1 * M.G)} N<br><i>F</i><sub>g2</sub> = ${f(q.m2 * M.G)} N` };
    return [
      weights,
      { id: 'a', label: '가속도 (acceleration)', value: show((o, q, f) => `<i>a</i> = ${f(o.a, z)} m/s²`) },
      { id: 'T', label: '장력 (tension)', value: show((o, q, f) => `<i>T</i> = ${f(o.T)} N`) },
      { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.speed, z)} m/s` },
    ];
  },

  belowNote: p => {
    const sc = M.scales(p), scale = `확인 전에는 구할 힘 ${tex('\\vec T')}를 회색 고정 길이로 그린다. 화살표 길이는 힘 1 m = ${fmt(1 / sc.F)} N, 가속도 1 m = ${fmt(1 / sc.a)} m/s²이다.`;
    return {
      atwood: `두 블록은 줄로 이어져 같은 크기의 가속도로 움직인다. 양옆의 자유물체도 (free-body diagram)는 각 블록에 작용하는 힘만 그렸다. <i>a</i>는 블록 2가 내려가는 쪽을 양(+)으로 잰다. ${scale}`,
      incline: `자유물체도 (free-body diagram)의 점선은 중력의 빗면 방향 성분 <i>Mg</i> sin <i>θ</i>와 수직 성분 <i>Mg</i> cos <i>θ</i>이다. <i>a</i>는 미끄러지는 블록이 빗면 위로 가는 쪽을 양(+)으로 잰다. ${scale}`,
    }[p.activity];
  },

  objectives: '교재 Principles of Physics 12e, Chapter 5 Force and Motion—I, Module 5.3 Applying Newton’s Laws, Learning Objective 5.3.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
