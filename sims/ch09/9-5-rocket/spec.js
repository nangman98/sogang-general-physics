// 9.9 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c09에서 확인했다 (rocket, thrust, rate of fuel consumption, relative speed of the exhaust,
// first rocket equation, second rocket equation).
import * as M from './model.js';

export const ui = { revealed: false };
const z = { zero: 1e-9 };

export const spec = {
  id: '9-5',
  course: '일반물리 I',
  chapter: 9,
  chapterTitle: 'Center of Mass and Linear Momentum',
  module: '9.9',
  title: '로켓 (Systems with Varying Mass – A Rocket)',
  headerNote: '교재 Principles of Physics 12e · Module 9.9',
  dt: 1 / 240,
  speed: 1,
  // Burns last tens of seconds; the screen runs 10 s of physical time per second (the readouts show physical time).
  timeScale: 10,
  sceneTitle: () => '연료를 태우며 빨라지는 로켓',

  assumptions: () => [
    '중력과 공기 저항이 없는 우주 공간이다',
    '로켓은 정지 상태에서 출발한다',
    `연료 소모율 <i>R</i>과 배기 속력 <i>v</i><sub>rel</sub>은 일정하다`,
    `화면은 물리 시간 10 s를 1 s로 보인다 (재생 속도 1×)`,
  ],

  equations: () => [
    { tex: 'Rv_{\\text{rel}} = Ma', no: '9.9.6' },
    { tex: 'v_f - v_i = v_{\\text{rel}}\\ln\\dfrac{M_i}{M_f}', no: '9.9.7' },
  ],

  readouts: () => [
    { id: 't', label: '시간 (time)', value: (o, q, f) => `<i>t</i> = ${f(o.t, z)} s<br><small>${o.burning ? '연소 중' : '연소 끝'}</small>` },
    { id: 'M', label: '로켓 질량', value: (o, q, f) => `<i>M</i> = ${f(o.M)} kg` },
    { id: 'a', label: '가속도 (acceleration)', value: (o, q, f) => `<i>a</i> = ${f(o.a, z)} m/s²` },
    { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
  ],

  belowNote: p => `추력 (thrust) <i>T</i> = <i>Rv</i><sub>rel</sub> = ${Math.round(M.thrust(p))} N이 연소 내내 같다. 질량이 줄어 가속도는 커진다. 뒤 왼쪽 그래프 판은 속력 <i>v</i>–<i>t</i>, 오른쪽은 질량 <i>M</i>–<i>t</i>다. 연료 통 안 막대 높이는 남은 연료다.`,

  objectives: '교재 Principles of Physics 12e, Chapter 9 Center of Mass and Linear Momentum, Module 9.9 Systems with Varying Mass – A Rocket, Learning Objective 9.9.1–9.9.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
