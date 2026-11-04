// 2.4 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c02에서 확인했다 (initial position, initial velocity, displacement, Missing Quantity).
import { texNum as N } from '../../../core/format.js';
import { tex } from '../../../core/math.js';
import * as M from './model.js';

const P = x => `(${N(x)})`;
const lines = (...r) => `\\begin{aligned}${r[0]}${r.slice(1).map(x => `\\\\ &= ${x}`).join('')}\\end{aligned}`;

export const spec = {
  id: '2-2',
  course: '일반물리 I',
  chapter: 2,
  chapterTitle: 'Motion Along a Straight Line',
  module: '2.4',
  title: '등가속도 운동 (Constant Acceleration)',
  headerNote: '교재 Principles of Physics 12e · Module 2.4',
  dt: 1 / 120,
  runIf: p => p.activity !== 'missing',
  timeIf: p => p.activity !== 'missing',
  sceneTitle: p => ({ graphs: '<i>x</i>–<i>t</i>, <i>v</i>–<i>t</i>, <i>a</i>–<i>t</i> 그래프', missing: '빠진 양 (missing quantity)', meet: '두 자동차' }[p.activity]),

  assumptions: p => (p.activity === 'missing'
    ? ['처음 위치 <i>x</i><sub>0</sub> = 0', '가속도는 일정하다 (constant acceleration)', 'Table 2.4.1의 식은 가속도가 일정할 때만 쓴다']
    : [
      '가속도는 일정하다 (constant acceleration)',
      '자동차는 입자 (particle)로 본다. 위치 <i>x</i>는 자동차 가운데다',
      '+<i>x</i> 방향은 오른쪽이다',
      ...(p.activity === 'meet' ? ['두 자동차는 서로 다른 차로를 달린다'] : []),
      '자동차 크기는 실제 비율이 아니다',
    ]),

  equations: p => {
    if (p.activity === 'missing') {
      return M.EQUATIONS.map(e => ({ html: `${tex(e.tex)}<small class="missing">빠진 양 ${tex(M.QTEX[e.missing])}</small>`, no: e.no }));
    }
    if (p.activity === 'meet') {
      return [
        { tex: 'x = x_0 + v_0 t + \\tfrac{1}{2}at^2', no: '2.4.5' },
        { tex: 'v = v_0 + at', no: '2.4.1' },
        { tex: 'x_{\\mathrm{A}}(t) = x_{\\mathrm{B}}(t)' },
      ];
    }
    return [
      { no: '2.4.1', tex: 'v = v_0 + at', live: (o, q) => lines('v &= v_0 + at', `${N(q.v0)} + ${P(q.a)}${P(o.t)}`, `${N(o.v)}\\ \\mathrm{m/s}`) },
      { no: '2.4.5', tex: 'x - x_0 = v_0 t + \\tfrac{1}{2}at^2', live: (o, q) => lines('x - x_0 &= v_0 t + \\tfrac{1}{2}at^2', `${P(q.v0)}${P(o.t)} + \\tfrac{1}{2}${P(q.a)}${P(o.t)}^2`, `${N(o.dx)}\\ \\mathrm{m}`) },
      { no: '2.4.6', tex: 'v^2 = v_0^2 + 2a(x - x_0)', live: (o, q) => lines('v^2 &= v_0^2 + 2a(x - x_0)', `${P(q.v0)}^2 + 2${P(q.a)}${P(o.dx)}`, `${N(o.v * o.v)}\\ \\mathrm{m^2/s^2}`) },
    ];
  },

  readouts: p => {
    if (p.activity === 'missing') return [];
    const z = { zero: 1e-9 };
    if (p.activity === 'meet') {
      return [
        { id: 'xA', label: 'A의 위치 (position)', value: (o, _, f) => `<i>x</i><sub>A</sub> = ${f(o.x, z)} m` },
        { id: 'xB', label: 'B의 위치 (position)', value: (o, _, f) => `<i>x</i><sub>B</sub> = ${f(o.B.x, z)} m` },
        { id: 'gap', label: '두 자동차 사이', value: (o, _, f) => `<i>x</i><sub>B</sub> − <i>x</i><sub>A</sub> = ${f(o.gap, z)} m` },
        { id: 'vAB', label: '속도 (velocity)', value: (o, _, f) => `<i>v</i><sub>A</sub> = ${f(o.v, z)} m/s<br><i>v</i><sub>B</sub> = ${f(o.B.v, z)} m/s` },
      ];
    }
    return [
      { id: 'x', label: '위치 (position)', value: (o, _, f) => `<i>x</i> = ${f(o.x, z)} m` },
      { id: 'v', label: '속도 (velocity)', value: (o, _, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
      { id: 'a', label: '가속도 (acceleration)', value: (o, _, f) => `<i>a</i> = ${f(o.a, z)} m/s²` },
      { id: 'dx', label: '변위 (displacement)', value: (o, _, f) => `<i>x</i> − <i>x</i><sub>0</sub> = ${f(o.dx, z)} m` },
    ];
  },

  belowNote: p => ({
    graphs: '<i>x</i>–<i>t</i> 그래프의 기울기가 그 시각의 <i>v</i>이다. <i>v</i>–<i>t</i> 그래프의 기울기는 <i>a</i>이다. <i>a</i>가 일정하므로 <i>v</i>–<i>t</i>는 직선이고 <i>x</i>–<i>t</i>는 포물선이다.',
    missing: '문제에 주어지지 않은 양이 빠진 양이다. 빠진 양이 들어 있지 않은 식을 고르면 모르는 양이 구할 양 하나만 남는다.',
    meet: '<i>x</i>–<i>t</i> 판에서 두 곡선이 만나는 점이 두 자동차가 같은 시각에 같은 위치에 있는 순간이다. B는 점선이다.',
  }[p.activity]),

  objectives: '교재 Principles of Physics 12e, Chapter 2 Motion Along a Straight Line, Module 2.4 Constant Acceleration, Learning Objective 2.4.1. 식 번호와 Table 2.4.1은 교재 번호다. 화면의 문제는 교재 문제를 옮기지 않았다.',
};
