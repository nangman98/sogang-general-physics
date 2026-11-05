// 6.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c06에서 확인했다 (drag force, terminal speed, drag coefficient, effective cross-sectional
// area, air density, gravitational force).
import { fmt } from '../../../core/format.js';
import { tex } from '../../../core/math.js';
import * as M from './model.js';

export const ui = { revealed: false };
const z = { zero: 1e-9 };

export const spec = {
  id: '6-2',
  course: '일반물리 I',
  chapter: 6,
  chapterTitle: 'Force and Motion—II',
  module: '6.2',
  title: '항력과 종단 속력 (The Drag Force and Terminal Speed)',
  headerNote: '교재 Principles of Physics 12e · Module 6.2',
  dt: 1 / 240,
  sceneTitle: p => (p.activity === 'compare' ? '두 물체의 종단 속력' : '공기 속에서 떨어지는 공'),

  assumptions: p => [
    '공은 정지 상태에서 떨어지기 시작한다',
    `공기 밀도 <i>ρ</i> = ${M.RHO} kg/m³ (20 °C, 1 atm, 교재 Table 14.1.1)`,
    '<i>A</i>는 공의 단면 넓이 π<i>r</i>²이다',
    '항력 계수 <i>C</i>는 속력과 상관없다',
    `<i>g</i> = ${M.G} m/s²`,
    '+<i>y</i>는 위쪽이다',
    ...(p.activity === 'compare' ? ['두 물체의 <i>C</i>는 같다'] : []),
  ],

  equations: () => [
    { tex: 'D = \\tfrac{1}{2}C\\rho A v^2', no: '6.2.1' },
    { tex: 'D - F_g = ma', no: '6.2.2' },
    { tex: 'v_t = \\sqrt{\\dfrac{2F_g}{C\\rho A}}', no: '6.2.3' },
  ],

  readouts: p => {
    if (p.activity === 'compare') {
      return [
        { id: 'v1', label: '물체 1 속력 (speed)', value: (o, q, f) => `<i>v</i><sub>1</sub> = ${f(o.list[0].v, z)} m/s` },
        { id: 'v2', label: '물체 2 속력', value: (o, q, f) => `<i>v</i><sub>2</sub> = ${f(o.list[1].v, z)} m/s` },
        { id: 'D1', label: '물체 1 항력 (drag force)', value: (o, q, f) => `<i>D</i><sub>1</sub> = ${f(o.list[0].D, z)} N` },
        { id: 'D2', label: '물체 2 항력', value: (o, q, f) => `<i>D</i><sub>2</sub> = ${f(o.list[1].D, z)} N` },
      ];
    }
    return [
      { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.list[0].v, z)} m/s` },
      { id: 'D', label: '항력 (drag force)', value: (o, q, f) => `<i>D</i> = ${f(o.list[0].D, z)} N<br><small><i>F</i><sub>g</sub> = ${f(o.list[0].Fg)} N</small>` },
      { id: 'a', label: '가속도 (acceleration)', value: (o, q, f) => `<i>a</i> = ${f(o.list[0].ay, { zero: 1e-6 })} m/s²` },
      { id: 's', label: '떨어진 거리', value: (o, q, f) => `${f(o.list[0].s, z)} m` },
    ];
  },

  belowNote: p => `카메라가 공을 따라 내려간다. 왼쪽 눈금 막대는 1 m 간격이고 출발점에서 떨어진 거리를 5 m마다 적었다. 공의 크기는 실제 비율이 아니다. 오른쪽 그래프 판은 속력 <i>v</i>–시간 <i>t</i>이고${p.activity === 'compare' ? ' 실선이 물체 1, 점선이 물체 2다' : ''}, 확인하면 종단 속력 (terminal speed) <i>v</i><sub>t</sub>를 점선으로 긋는다. 항력 (drag force) ${tex('\\vec D')}와 중력 ${tex('\\vec F_g')}의 화살표는 같은 축척으로 1 m = ${fmt(1 / scaleOf(p))} N이다.`,

  objectives: '교재 Principles of Physics 12e, Chapter 6 Force and Motion—II, Module 6.2 The Drag Force and Terminal Speed, Learning Objective 6.2.1–6.2.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};

// Force arrows: the largest gravitational force in the activity is 1.5 m long.
export function scaleOf(p) {
  return 1.5 / Math.max(...M.bodies(p).map(b => b.m * M.G));
}
