// 7.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c07에서 확인했다 (work, kinetic energy, net work, work–kinetic energy theorem, displacement,
// constant force, unit-vector notation, frictionless).
import { fmt } from '../../../core/format.js';
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '7-1',
  course: '일반물리 I',
  chapter: 7,
  chapterTitle: 'Kinetic Energy and Work',
  module: '7.2',
  title: '일과 운동에너지 (Work and Kinetic Energy)',
  headerNote: '교재 Principles of Physics 12e · Module 7.2',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'wind' ? '단위 벡터로 구하는 일' : '두 힘이 하는 알짜 일'),

  assumptions: p => [
    '바닥에 마찰이 없다 (frictionless)',
    '힘의 크기와 방향은 움직이는 동안 그대로다',
    '상자를 입자로 본다',
    p.activity === 'wind' ? '상자는 처음에 +<i>x</i> 방향으로 미끄러지고 있다' : '상자는 처음에 정지해 있다',
    '+<i>x</i>는 오른쪽, +<i>y</i>는 위쪽이다',
    `<i>g</i> = ${M.G} m/s²`,
  ],

  equations: p => [
    { tex: 'K = \\tfrac{1}{2}mv^2', no: '7.1.1' },
    p.activity === 'wind' ? { tex: 'W = \\vec F\\cdot\\vec d', no: '7.2.6' } : { tex: 'W = Fd\\cos\\phi', no: '7.2.5' },
    { tex: '\\Delta K = K_f - K_i = W', no: '7.2.8' },
    { tex: 'K_f = K_i + W', no: '7.2.9' },
  ],

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (p.activity === 'wind') {
      return [
        { id: 'Ki', label: '처음 운동에너지', value: (o, q, f) => `<i>K</i><sub>i</sub> = ${f(o.Ki)} J` },
        { id: 'W', label: '지금까지 한 일 (work)', value: show((o, q, f) => `<i>W</i> = ${f(o.Wsofar, z)} J`) },
        { id: 'K', label: '운동에너지 (kinetic energy)', value: show((o, q, f) => `<i>K</i> = ${f(o.K, z)} J`) },
        { id: 'x', label: '움직인 거리', value: (o, q, f) => `<i>x</i> = ${f(o.x, z)} m` },
      ];
    }
    return [
      { id: 'W1', label: '<i>F</i><sub>1</sub>이 한 일', value: show((o, q, f) => `<i>W</i><sub>1</sub> = ${f(o.Fx === 0 ? 0 : o.W1 * o.x / q.d, z)} J`) },
      { id: 'W2', label: '<i>F</i><sub>2</sub>가 한 일', value: show((o, q, f) => `<i>W</i><sub>2</sub> = ${f(o.Fx === 0 ? 0 : o.W2 * o.x / q.d, z)} J`) },
      { id: 'W', label: '알짜 일 (net work)', value: show((o, q, f) => `<i>W</i> = ${f(o.Wsofar, z)} J<br><small><i>W</i><sub>g</sub> = <i>W</i><sub>N</sub> = 0</small>`) },
      { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
    ];
  },

  belowNote: p => `검은 화살표는 변위 (displacement) <i>d</i>이고 주황 화살표는 힘이다. 중력과 수직항력은 변위에 수직이라 일을 하지 않는다. 뒤 그래프 판은 상자가 간 거리 <i>x</i>에 따른 운동에너지 <i>K</i>다. 처음 값에서 늘거나 준 만큼이 힘이 한 일이다. 힘 화살표는 1 m = ${fmt(1 / forceScale(p))} N이다.`,

  objectives: '교재 Principles of Physics 12e, Chapter 7 Kinetic Energy and Work, Module 7.2 Work and Kinetic Energy, Learning Objective 7.2.1–7.2.4. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};

// Force arrows: the largest force (weight included) is 1.6 m long.
export function forceScale(p) {
  const s = M.solve(p);
  const forces = p.activity === 'wind' ? [Math.hypot(p.Fx, p.Fy), p.m * M.G, s.FN] : [p.F1, p.F2, p.m * M.G, s.FN];
  return 1.6 / Math.max(...forces, 1e-9);
}
