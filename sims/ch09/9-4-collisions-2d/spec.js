// 9.8 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c09에서 확인했다 (two-dimensional collision, glancing collision, elastic, linear momentum,
// completely inelastic collision).
export const ui = { revealed: false };
const z = { zero: 1e-9 };
const ang = v => Math.atan2(v[1], v[0]) * 180 / Math.PI;

export const spec = {
  id: '9-4',
  course: '일반물리 I',
  chapter: 9,
  chapterTitle: 'Center of Mass and Linear Momentum',
  module: '9.8',
  title: '2차원 충돌 (Collisions in Two Dimensions)',
  headerNote: '교재 Principles of Physics 12e · Module 9.8',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'stick' ? '수직으로 만나 붙는 두 물체' : '비켜 맞는 탄성 충돌 (glancing collision)'),

  assumptions: p => (p.activity === 'stick' ? [
    '위에서 내려다본 공기 테이블이다. 마찰이 없다',
    'A는 +<i>x</i>, B는 +<i>y</i>로 와서 원점에서 붙는다',
    '두 물체를 입자로 본다',
  ] : [
    '위에서 내려다본 공기 테이블이다. 마찰이 없다',
    `두 퍽은 반지름이 같고 매끄럽다. 미는 힘은 맞닿은 두 중심을 잇는 방향이다`,
    '충돌은 탄성이다. 퍽 2는 처음에 정지해 있다',
    '각은 +<i>x</i>축에서 시계 반대 방향으로 잰다',
  ]),

  equations: p => (p.activity === 'stick' ? [
    { tex: 'm_Av_A = (m_A + m_B)V\\cos\\theta', no: '9.8.6' },
    { tex: 'm_Bv_B = (m_A + m_B)V\\sin\\theta', no: '9.8.7' },
  ] : [
    { tex: 'm_1v_{1i} = m_1v_{1f}\\cos\\theta_1 + m_2v_{2f}\\cos\\theta_2', no: '9.8.3' },
    { tex: '0 = -m_1v_{1f}\\sin\\theta_1 + m_2v_{2f}\\sin\\theta_2', no: '9.8.4' },
    { tex: '\\tfrac{1}{2}m_1v_{1i}^2 = \\tfrac{1}{2}m_1v_{1f}^2 + \\tfrac{1}{2}m_2v_{2f}^2', no: '9.8.5' },
  ]),

  readouts: p => (p.activity === 'stick' ? [
    { id: 'pa', label: 'A의 운동량', value: (o, q, f) => `${f(q.mA * Math.hypot(...o.va), z)} kg·m/s` },
    { id: 'pb', label: 'B의 운동량', value: (o, q, f) => `${f(q.mB * Math.hypot(...o.vb), z)} kg·m/s` },
    { id: 'V', label: '붙은 뒤 속력', value: (o, q, f) => (o.after ? `<i>V</i> = ${f(Math.hypot(...o.va))} m/s` : '<small>충돌 전</small>') },
    { id: 'th', label: '붙은 뒤 방향', value: (o, q, f) => (o.after ? `<i>θ</i> = ${f(ang(o.va))}°` : '<small>충돌 전</small>') },
  ] : [
    { id: 'v1', label: '퍽 1 속력', value: (o, q, f) => `${f(Math.hypot(...o.va), z)} m/s` },
    { id: 'v2', label: '퍽 2 속력', value: (o, q, f) => `${f(Math.hypot(...o.vb), z)} m/s` },
    { id: 't1', label: '퍽 1 방향', value: (o, q, f) => (o.after ? `<i>θ</i><sub>1</sub> = ${f(ang(o.va), z)}°` : '<small>충돌 전</small>') },
    { id: 't2', label: '퍽 2 방향', value: (o, q, f) => (o.after ? `<i>θ</i><sub>2</sub> = ${f(ang(o.vb), z)}°` : '<small>충돌 전</small>') },
  ]),

  belowNote: p => `테이블 오른쪽 위의 초록 화살표는 운동량이다. 충돌 전 운동량과 충돌 뒤 운동량을 머리–꼬리로 이은 합이 같다(1 kg·m/s당 1 m). 파란 화살표는 속도(1 m/s당 0.5 m)다.${p.activity === 'glancing' ? ' 두 퍽의 질량이 같으면 충돌 뒤 두 방향 사이의 각이 90°다.' : ''}`,

  objectives: '교재 Principles of Physics 12e, Chapter 9 Center of Mass and Linear Momentum, Module 9.8 Collisions in Two Dimensions, Learning Objective 9.8.1. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
