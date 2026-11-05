// 9.4 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c09에서 확인했다 (impulse, collision, average force, linear momentum, impulse–linear momentum
// theorem).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';

export const spec = {
  id: '9-2',
  course: '일반물리 I',
  chapter: 9,
  chapterTitle: 'Center of Mass and Linear Momentum',
  module: '9.4',
  title: '충돌과 충격량 (Collision and Impulse)',
  headerNote: '교재 Principles of Physics 12e · Module 9.4',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'cushion' ? '같은 충격량, 다른 접촉 시간' : '벽이 공에 주는 힘 펄스'),

  assumptions: p => [
    '공은 벽 쪽으로 곧게 날아와 곧게 튀어 나간다 (1차원)',
    '+<i>x</i>는 벽에서 멀어지는 쪽이다',
    '접촉하는 동안 벽이 주는 힘 말고 다른 힘은 무시한다',
    p.activity === 'cushion' ? '공은 벽에 멈춘다. 힘 펄스는 삼각형이다' : '접촉하는 몇 ms를 화면에서는 2.4 s로 늘여 보인다',
  ],

  equations: () => [
    { tex: '\\vec J = \\int_{t_i}^{t_f}\\vec F(t)\\,dt', no: '9.4.3' },
    { tex: '\\vec p_f - \\vec p_i = \\Delta\\vec p = \\vec J', no: '9.4.4' },
    { tex: 'J = F_{\\text{avg}}\\,\\Delta t', no: '9.4.8' },
  ],

  readouts: p => [
    { id: 't', label: '물리 시간', value: (o, q, f) => (o.phase === 'contact' ? `${f(o.tPhys * 1000, { zero: 1e-9 })} ms<br><small>접촉 중</small>` : o.phase === 'approach' ? '<small>접촉 전</small>' : '<small>접촉 뒤</small>') },
    { id: 'v', label: '속도 (velocity)', value: (o, q, f) => `<i>v</i> = ${f(o.v, { zero: 1e-9 })} m/s` },
    { id: 'F', label: '벽이 주는 힘', value: (o, q, f) => `<i>F</i> = ${f(o.F, { zero: 1e-9 })} N` },
    { id: 'J', label: '충격량 (impulse)', value: (o, q, f) => (ui.revealed ? `<i>J</i> = ${f(o.J, { zero: 1e-9 })} N·s` : hidden) },
  ],

  belowNote: p => `뒤 그래프 판은 접촉하는 동안의 힘 <i>F</i>–시간 <i>t</i>(ms)다. 칠한 넓이가 지금까지의 충격량이다. 공은 힘을 받는 동안 찌그러져 보인다(과장). 파란 화살표는 속도(1 m/s당 0.15 m), 주황 화살표는 벽이 주는 힘이다.${p.activity === 'cushion' ? ' 접촉 시간을 바꿔도 충격량은 <i>mv</i>로 같다. 평균 힘이 어떻게 바뀌는지 보자.' : ''}`,

  objectives: '교재 Principles of Physics 12e, Chapter 9 Center of Mass and Linear Momentum, Module 9.4 Collision and Impulse, Learning Objective 9.4.1–9.4.6. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
