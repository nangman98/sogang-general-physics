// 14.2–14.4 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c14에서 확인했다 (fluid at rest, hydrostatic pressure, gauge pressure, absolute pressure,
// Pascal's principle, hydraulic lever, input piston, output piston).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isH = p => p.activity === 'hydraulic';

export const spec = {
  id: '14-1',
  course: '일반물리 I',
  chapter: 14,
  chapterTitle: 'Fluids',
  module: '14.2–14.4',
  title: '깊이에 따른 압력과 파스칼 원리 (Fluids at Rest, Pascal’s Principle)',
  headerNote: '교재 Principles of Physics 12e · Module 14.2, 14.3, 14.4',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (isH(p) ? '유압 지렛대 (hydraulic lever)' : '열린 수조에 내리는 압력 탐침'),

  assumptions: p => (isH(p) ? [
    '액체는 압축되지 않고 피스톤의 무게와 마찰은 무시한다',
    '두 피스톤은 같은 높이에 있고 천천히 움직인다 (평형)',
    `재생하면 입력 피스톤이 ${M.RUN} s 동안 <i>d</i><sub>i</sub>만큼 고르게 내려간다`,
  ] : [
    `액체 밀도는 교재 Table 14.1.1 값이고 수면의 대기압은 <i>p</i><sub>0</sub> = 1 atm = ${M.P0} Pa다`,
    '액체는 정지해 있다',
    `<i>g</i> = ${M.G} m/s²`,
  ]),

  equations: p => (isH(p) ? [
    { tex: '\\Delta p = \\Delta p_{\\text{ext}}', no: '14.4.2' },
    { tex: 'F_o = F_i\\dfrac{A_o}{A_i}', no: '14.4.3' },
    { tex: 'd_o = d_i\\dfrac{A_i}{A_o}', no: '14.4.4' },
    { tex: 'W = F_od_o = F_id_i', no: '14.4.5' },
  ] : [
    { tex: 'p = p_0 + \\rho gh', no: '14.2.4' },
    { tex: 'p_{\\text{gauge}} = p - p_0 = \\rho gh' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isH(p)) {
      return [
        { id: 'di', label: '입력 피스톤이 내려간 거리', value: (o, q, f) => `${f(o.di, z)} cm` },
        { id: 'do', label: '출력 피스톤이 올라간 거리', value: show((o, q, f) => `${f(o.do, z)} cm`) },
        { id: 'Fo', label: '출력 힘', value: show((o, q, f) => `<i>F</i><sub>o</sub> = ${f(o.Fo)} N`) },
        { id: 'dp', label: '압력 변화', value: (o, q, f) => `Δ<i>p</i> = ${f(o.dp / 1e3)} kPa` },
      ];
    }
    return [
      { id: 'y', label: '탐침의 깊이', value: (o, q, f) => `${f(o.y, z)} m` },
      { id: 'g', label: '계기 압력 (gauge)', value: show((o, q, f) => `${f(o.gauge / 1e3, z)} kPa`) },
      { id: 'p', label: '절대 압력 (absolute)', value: show((o, q, f) => `${f(o.p / 1e3)} kPa`) },
    ];
  },

  belowNote: p => (isH(p)
    ? '왼쪽 좁은 관이 입력 피스톤, 오른쪽 넓은 관이 출력 피스톤이다. 두 힘의 비가 100배까지 커서 화살표 길이는 크기에 비례하지 않게 같은 길이로 그렸다. 값은 확인 뒤 화살표 옆에 적는다.'
    : '탐침 둘레의 주황 화살표는 액체가 탐침 면을 미는 힘이다. 같은 깊이에서는 모든 방향으로 크기가 같다. 확인 뒤 오른쪽 그래프 판에 깊이에 따른 절대 압력을 그린다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 14 Fluids, Module 14.2 Fluids at Rest, Module 14.3 Measuring Pressure, Module 14.4 Pascal’s Principle, Learning Objective 14.2.1–14.2.2, 14.4.1–14.4.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
