// 8.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c08에서 확인했다 (potential energy curve, turning point, equilibrium point, stable equilibrium,
// unstable equilibrium, neutral equilibrium, mechanical energy, conservative force).
import * as M from './model.js';

export const ui = { revealed: false };
const z = { zero: 1e-6 };

export const spec = {
  id: '8-2',
  course: '일반물리 I',
  chapter: 8,
  chapterTitle: 'Potential Energy and Conservation of Energy',
  module: '8.3',
  title: '퍼텐셜 에너지 곡선 읽기 (Reading a Potential Energy Curve)',
  headerNote: '교재 Principles of Physics 12e · Module 8.3',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'equilibrium' ? '평형점 (equilibrium point)' : '에너지 선과 반환점 (turning point)'),

  assumptions: p => [
    `입자 질량 <i>m</i> = ${M.MASS} kg`,
    '보존력만 일을 한다',
    '입자는 <i>x</i>축을 따라서만 움직인다',
    p.activity === 'equilibrium' ? `출발점에서 +<i>x</i> 방향으로 ${M.PUSH} m/s만큼 살짝 민다` : '입자는 우물 바닥 (<i>x</i> = 2.5 m)에서 +<i>x</i> 방향으로 출발한다',
  ],

  equations: () => [
    { tex: 'F(x) = -\\dfrac{dU(x)}{dx}', no: '8.3.2' },
    { tex: 'U(x) + K(x) = E_{\\text{mec}}', no: '8.3.3' },
    { tex: 'K(x) = E_{\\text{mec}} - U(x)', no: '8.3.4' },
  ],

  readouts: () => [
    { id: 'x', label: '위치 (position)', value: (o, q, f) => `<i>x</i> = ${f(o.x, z)} m` },
    { id: 'U', label: '퍼텐셜 에너지', value: (o, q, f) => `<i>U</i> = ${f(o.U, z)} J` },
    { id: 'K', label: '운동에너지', value: (o, q, f) => `<i>K</i> = ${f(o.K, z)} J` },
    { id: 'F', label: '힘 (force)', value: (o, q, f) => `<i>F</i> = ${f(o.F, z)} N` },
  ],

  belowNote: p => `뒤 그래프 판의 가로축은 앞 측정대의 <i>x</i>와 같은 위치·같은 축척이다. 검은 곡선은 <i>U</i>(<i>x</i>), 파란 점선은 역학적 에너지 <i>E</i><sub>mec</sub>이다. 입자에 그린 주황 화살표는 힘 <i>F</i> = −d<i>U</i>/d<i>x</i>이고 길이는 1 N당 0.08 m다.${p.activity === 'energy' ? ' 확인하면 <i>K</i> = <i>E</i><sub>mec</sub> − <i>U</i>인 구간을 하늘색으로 칠하고 반환점을 표시한다.' : ''}`,

  objectives: '교재 Principles of Physics 12e, Chapter 8 Potential Energy and Conservation of Energy, Module 8.3 Reading a Potential Energy Curve, Learning Objective 8.3.1–8.3.6. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
