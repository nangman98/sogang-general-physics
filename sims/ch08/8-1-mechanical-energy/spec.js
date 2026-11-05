// 8.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c08에서 확인했다 (mechanical energy, potential energy, kinetic energy, conservation of mechanical
// energy, isolated system, conservative force, gravitational potential energy).
import * as M from './model.js';

const z = { zero: 1e-9 };

export const spec = {
  id: '8-1',
  course: '일반물리 I',
  chapter: 8,
  chapterTitle: 'Potential Energy and Conservation of Energy',
  module: '8.2',
  title: '역학적 에너지 보존 (Conservation of Mechanical Energy)',
  headerNote: '교재 Principles of Physics 12e · Module 8.2',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'pendulum' ? '진자의 운동에너지와 퍼텐셜 에너지' : '트랙 위 수레의 에너지'),

  assumptions: p => (p.activity === 'pendulum' ? [
    '공기 저항과 받침점 마찰이 없다',
    '줄은 늘어나지 않고 질량이 없다',
    '추는 처음에 정지해 있다',
    '<i>U</i> = 0은 추가 가장 낮은 곳에 있을 때다',
    `<i>g</i> = ${M.G} m/s²`,
  ] : [
    '트랙에 마찰이 없고 공기 저항도 없다',
    '수레를 입자로 본다',
    '수레 바퀴가 레일 위아래를 잡아 레일을 벗어나지 않는다',
    '<i>U</i> = 0은 측정대 윗면 높이 (<i>y</i> = 0)다',
    `<i>g</i> = ${M.G} m/s²`,
  ]),

  equations: p => [
    { tex: 'E_{\\text{mec}} = K + U', no: '8.2.1' },
    { tex: 'K_2 + U_2 = K_1 + U_1', no: '8.2.6' },
    p.activity === 'pendulum' ? { tex: 'U = mgL(1 - \\cos\\theta)' } : { tex: 'U(y) = mgy', no: '8.1.9' },
  ],

  readouts: p => (p.activity === 'pendulum' ? [
    { id: 'th', label: '각 (angle)', value: (o, q, f) => `<i>θ</i> = ${f(o.theta * 180 / Math.PI, z)}°` },
    { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
    { id: 'K', label: '운동에너지 (kinetic energy)', value: (o, q, f) => `<i>K</i> = ${f(o.K, z)} J` },
    { id: 'U', label: '퍼텐셜 에너지 (potential energy)', value: (o, q, f) => `<i>U</i> = ${f(o.U, z)} J` },
  ] : [
    { id: 'y', label: '높이', value: (o, q, f) => `<i>y</i> = ${f(o.y, z)} m` },
    { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
    { id: 'K', label: '운동에너지 (kinetic energy)', value: (o, q, f) => `<i>K</i> = ${f(o.K, z)} J` },
    { id: 'U', label: '퍼텐셜 에너지 (potential energy)', value: (o, q, f) => `<i>U</i> = ${f(o.U, z)} J` },
  ]),

  belowNote: p => `오른쪽 에너지 막대는 운동에너지 <i>K</i>(하늘색), 퍼텐셜 에너지 <i>U</i>(주황), 역학적 에너지 <i>E</i><sub>mec</sub> = <i>K</i> + <i>U</i>(테두리만)다. 마찰이 없으면 <i>E</i><sub>mec</sub> 막대 높이가 그대로이고 <i>K</i>와 <i>U</i>가 서로 바뀐다.${p.activity === 'track' ? ' 트랙 모양을 바꿔 끝 속력을 비교해 보자.' : ''}`,

  objectives: '교재 Principles of Physics 12e, Chapter 8 Potential Energy and Conservation of Energy, Module 8.2 Conservation of Mechanical Energy, Learning Objective 8.2.1–8.2.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
