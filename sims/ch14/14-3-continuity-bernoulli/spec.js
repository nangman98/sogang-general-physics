// 14.6–14.7 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c14에서 확인했다 (ideal fluid, steady flow, streamline, tube of flow, equation of continuity,
// volume flow rate, Bernoulli's equation).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';

export const spec = {
  id: '14-3',
  course: '일반물리 I',
  chapter: 14,
  chapterTitle: 'Fluids',
  module: '14.6–14.7',
  title: '연속 방정식과 베르누이 식 (Continuity, Bernoulli’s Equation)',
  headerNote: '교재 Principles of Physics 12e · Module 14.6, 14.7',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: '좁아지며 올라가는 관 속 물의 흐름',

  assumptions: () => [
    `물은 이상 유체 (ideal fluid)다. 압축되지 않고 점성이 없으며 흐름은 정상류다. <i>ρ</i> = ${M.RHO} kg/m³`,
    `넓은 관 ${M.X1} m, 좁아지며 올라가는 구간 ${M.X2 - M.X1} m, 좁은 관 ${M.L - M.X2} m. 높이는 관 중심에서 잰다`,
    '압력은 계기 압력이다. 음수면 대기압보다 낮다',
    `<i>g</i> = ${M.G} m/s². 재생은 한 번 흘러 지나가는 시간마다 되풀이된다`,
  ],

  equations: () => [
    { tex: 'R_V = Av = \\text{a constant}', no: '14.6.4' },
    { tex: 'A_1v_1 = A_2v_2', no: '14.6.3' },
    { tex: 'p + \\tfrac{1}{2}\\rho v^2 + \\rho gy = \\text{a constant}', no: '14.7.2' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'R', label: '부피 흐름률 (volume flow rate)', value: (o, q, f) => `<i>R</i><sub>V</sub> = ${f(o.R * 1e3)} L/s` },
      { id: 'v1', label: '넓은 관의 속력', value: (o, q, f) => `<i>v</i><sub>1</sub> = ${f(q.v1)} m/s` },
      { id: 'v2', label: '좁은 관의 속력', value: show((o, q, f) => `<i>v</i><sub>2</sub> = ${f(o.v2)} m/s`) },
      { id: 'p2', label: '좁은 관의 계기 압력', value: show((o, q, f) => `<i>p</i><sub>2</sub> = ${f(o.p2 / 1e3)} kPa`) },
    ];
  },

  belowNote: '관 지름은 8배로 키워 그렸고 길이와 높이는 실제 축척이다. 회색 점은 물과 함께 흐르는 표지이고 같은 시간 간격으로 들어간다. 파란 화살표는 두 구간의 속도다. 확인 뒤 뒤쪽 그래프 판에 관을 따라 압력을 그린다.',

  objectives: '교재 Principles of Physics 12e, Chapter 14 Fluids, Module 14.6 The Equation of Continuity, Module 14.7 Bernoulli’s Equation, Learning Objective 14.6.1–14.6.4, 14.7.1–14.7.5. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
