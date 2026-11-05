// 9.1–9.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c09에서 확인했다 (center of mass, system of particles, external force, total mass).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';

export const spec = {
  id: '9-1',
  course: '일반물리 I',
  chapter: 9,
  chapterTitle: 'Center of Mass and Linear Momentum',
  module: '9.1–9.2',
  title: '질량중심 (Center of Mass)',
  headerNote: '교재 Principles of Physics 12e · Module 9.1, 9.2',
  dt: 1 / 240,
  runIf: p => p.activity === 'explode',
  timeIf: p => p.activity === 'explode',
  sceneTitle: p => (p.activity === 'explode' ? '쪼개지는 포탄의 질량중심' : '세 입자의 질량중심 (center of mass)'),

  assumptions: p => (p.activity === 'explode' ? [
    '공기 저항이 없다',
    '포탄은 경로 꼭대기에서 두 조각으로 쪼개진다',
    '조각 1은 쪼개진 순간 정지해 곧장 떨어진다',
    '쪼개질 때 생기는 힘은 내력이라 질량중심의 운동을 바꾸지 않는다',
    `<i>g</i> = ${M.G} m/s²`,
  ] : [
    '세 입자는 한 변이 <i>a</i>인 정삼각형의 꼭짓점에 있다',
    '입자 1이 원점, 입자 2가 +<i>x</i>축 위에 있다',
    '입자를 잇는 막대는 질량이 없다',
  ]),

  equations: p => (p.activity === 'explode' ? [
    { tex: '\\vec F_{\\text{net}} = M\\vec a_{\\text{com}}', no: '9.2.1' },
    { tex: 'x_{\\text{com}} = \\dfrac{m_1x_1 + m_2x_2}{m_1 + m_2}', no: '9.1.2' },
  ] : [
    { tex: 'x_{\\text{com}} = \\dfrac{1}{M}\\sum_{i=1}^{n} m_i x_i', no: '9.1.5' },
    { tex: 'y_{\\text{com}} = \\dfrac{1}{M}\\sum_{i=1}^{n} m_i y_i', no: '9.1.5' },
  ]),

  readouts: p => {
    if (p.activity === 'explode') {
      return [
        { id: 't', label: '시간 (time)', value: (o, q, f) => `<i>t</i> = ${f(o.t, { zero: 1e-9 })} s` },
        { id: 'c', label: '질량중심 (center of mass)', value: (o, q, f) => `<i>x</i><sub>com</sub> = ${f(o.com[0], { zero: 1e-9 })} m` },
        { id: 'x1', label: '조각 1', value: (o, q, f) => `<i>x</i><sub>1</sub> = ${f(o.one[0], { zero: 1e-9 })} m` },
        { id: 'x2', label: '조각 2', value: (o, q, f) => (ui.revealed || !o.split ? `<i>x</i><sub>2</sub> = ${f(o.two[0], { zero: 1e-9 })} m` : hidden) },
      ];
    }
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'M', label: '전체 질량 (total mass)', value: (o, q, f) => `<i>M</i> = ${f(o.c.M)} kg` },
      { id: 'x', label: '질량중심 x', value: show((o, q, f) => `<i>x</i><sub>com</sub> = ${f(o.c.x)} m`) },
      { id: 'y', label: '질량중심 y', value: show((o, q, f) => `<i>y</i><sub>com</sub> = ${f(o.c.y)} m`) },
    ];
  },

  belowNote: p => (p.activity === 'explode'
    ? '점선 고리는 질량중심이다. 포탄이 쪼개진 뒤에도 질량중심은 쪼개지지 않았을 때의 포물선을 그대로 따라간다. 질량중심은 두 조각을 잇는 선 위에서 질량에 반비례하는 거리로 나눈 점에 있다. 포탄과 조각 크기는 실제 비율이 아니다.'
    : '뒤 판의 눈금은 0.2 m 간격이다. 공의 크기는 질량에 따라 커지지만 실제 비율은 아니다. 확인하면 질량중심에 표시를 단다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 9 Center of Mass and Linear Momentum, Module 9.1 Center of Mass, Module 9.2 Newton’s Second Law for a System of Particles, Learning Objective 9.1.1–9.1.3, 9.2.1–9.2.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
