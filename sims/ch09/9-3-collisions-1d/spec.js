// 9.6–9.7 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c09에서 확인했다 (elastic collision, inelastic collision, completely inelastic collision,
// linear momentum, kinetic energy, center of mass, closed isolated system).
export const ui = { revealed: false };
const z = { zero: 1e-9 };

export const spec = {
  id: '9-3',
  course: '일반물리 I',
  chapter: 9,
  chapterTitle: 'Center of Mass and Linear Momentum',
  module: '9.6–9.7',
  title: '1차원 충돌 (Collisions in One Dimension)',
  headerNote: '교재 Principles of Physics 12e · Module 9.6, 9.7',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'inelastic' ? '완전 비탄성 충돌 (completely inelastic collision)' : '탄성 충돌 (elastic collision)'),

  assumptions: p => [
    '공기 트랙이라 마찰이 없다 (닫힌 고립계)',
    '+<i>x</i>는 오른쪽이다',
    p.activity === 'inelastic' ? '두 수레는 부딪히면 붙어서 함께 움직인다' : '부딪혀도 운동에너지가 그대로다',
    '수레 1이 수레 2를 따라잡는다 (<i>v</i><sub>1i</sub> > <i>v</i><sub>2i</sub>)',
  ],

  equations: p => (p.activity === 'inelastic' ? [
    { tex: 'm_1v_{1i} + m_2v_{2i} = m_1v_{1f} + m_2v_{2f}', no: '9.6.2' },
    { tex: 'v_{1f} = v_{2f} = V' },
    { tex: '\\vec P = M\\vec v_{\\text{com}}', no: '9.6.6' },
  ] : [
    { tex: 'v_{1f} = \\dfrac{m_1 - m_2}{m_1 + m_2}v_{1i} + \\dfrac{2m_2}{m_1 + m_2}v_{2i}', no: '9.7.14' },
    { tex: 'v_{2f} = \\dfrac{2m_1}{m_1 + m_2}v_{1i} + \\dfrac{m_2 - m_1}{m_1 + m_2}v_{2i}', no: '9.7.15' },
    { tex: '\\vec P = M\\vec v_{\\text{com}}', no: '9.6.6' },
  ]),

  readouts: () => [
    { id: 'v1', label: '수레 1 속도', value: (o, q, f) => `<i>v</i><sub>1</sub> = ${f(o.v1, z)} m/s` },
    { id: 'v2', label: '수레 2 속도', value: (o, q, f) => `<i>v</i><sub>2</sub> = ${f(o.v2, z)} m/s` },
    { id: 'P', label: '전체 운동량 (linear momentum)', value: (o, q, f) => `<i>P</i> = ${f(o.P, z)} kg·m/s` },
    { id: 'K', label: '전체 운동에너지', value: (o, q, f) => `<i>K</i> = ${f(o.K, z)} J` },
  ],

  belowNote: () => '뒤 그래프 판은 위치 <i>x</i>–시간 <i>t</i>이다. 실선은 수레 1, 점선은 수레 2, 회색 점선은 질량중심이다. 질량중심은 충돌 전후로 같은 속도로 곧게 간다. 트랙 위 검은 표시(⊕)가 질량중심이고 파란 화살표는 속도(1 m/s당 0.5 m)다.',

  objectives: '교재 Principles of Physics 12e, Chapter 9 Center of Mass and Linear Momentum, Module 9.6 Momentum and Kinetic Energy in Collisions, Module 9.7 Elastic Collisions in One Dimension, Learning Objective 9.6.1–9.6.4, 9.7.1. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
