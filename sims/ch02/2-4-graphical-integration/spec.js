// 2.6 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 괄호 영어는 교재 c02에서 확인했다 (graphical integration, area, change in velocity, displacement, total distance,
// average speed, average velocity, acceleration, velocity, position, particle).
import { texNum as N } from '../../../core/format.js';
import { tex } from '../../../core/math.js';
import * as M from './model.js';

const P = x => (x < 0 ? `(${N(x)})` : N(x));
const lines = (...r) => `\\begin{aligned}${r[0]}${r.slice(1).map(x => `\\\\ &= ${x}`).join('')}\\end{aligned}`;
const z = { zero: 1e-9 };
// Step terms (a_k)(Δt_k) up to time t, the a–t area of each step that has started.
const terms = (q, t) => M.steps(q).filter(g => t > g.t0 + 1e-9).map(g => `${P(g.f0)}(${N(Math.min(t, g.t1) - g.t0)})`).join(' + ') || '0';

export const spec = {
  id: '2-4',
  course: '일반물리 I',
  chapter: 2,
  chapterTitle: 'Motion Along a Straight Line',
  module: '2.6',
  title: '그래프 적분 (Graphical Integration in Motion Analysis)',
  headerNote: '교재 Principles of Physics 12e · Module 2.6',
  dt: 1 / 120,
  sceneTitle: p => ({ dv: '<i>a</i>–<i>t</i> 넓이 (area)와 속도 변화', dx: '<i>v</i>–<i>t</i> 넓이 (area)와 변위', stop: '정지선에 멈추기' }[p.activity]),

  assumptions: [
    '<i>v</i><sub>0</sub> = 0, <i>x</i><sub>0</sub> = 0이다',
    '구간마다 가속도는 일정하고 구간 경계에서 바로 바뀐다',
    '자동차는 입자 (particle)로 본다. 위치 <i>x</i>는 자동차 가운데다',
    '+<i>x</i> 방향은 오른쪽이다',
    '자동차 크기는 실제 비율이 아니다',
  ],

  equations: p => {
    const a = [
      { no: '2.6.1', tex: 'v_1 - v_0 = \\int_{t_0}^{t_1} a\\,dt', live: (o, q) => lines('v - v_0 &= \\int_0^{t} a\\,dt', terms(q, o.t), `${N(o.v)}\\ \\mathrm{m/s}`) },
      { no: '2.6.2', html: `${tex('\\int_{t_0}^{t_1} a\\,dt')} = (<i>a</i>–<i>t</i> 곡선과 시간축 사이 넓이)` },
      { tex: '(1\\ \\mathrm{m/s^2})(1\\ \\mathrm{s}) = 1\\ \\mathrm{m/s}' },
    ];
    const x = [
      { no: '2.6.3', tex: 'x_1 - x_0 = \\int_{t_0}^{t_1} v\\,dt', live: o => lines('x - x_0 &= \\int_0^{t} v\\,dt', `${N(o.x)}\\ \\mathrm{m}`) },
      { no: '2.6.4', html: `${tex('\\int_{t_0}^{t_1} v\\,dt')} = (<i>v</i>–<i>t</i> 곡선과 시간축 사이 넓이)` },
      { tex: '(1\\ \\mathrm{m/s})(1\\ \\mathrm{s}) = 1\\ \\mathrm{m}' },
    ];
    if (p.activity === 'dv') return a;
    if (p.activity === 'dx') return [...x, { no: '2.1.3', tex: 's_{\\mathrm{avg}} = \\frac{\\text{total distance}}{\\Delta t}', live: o => (o.t > 1e-9 ? lines('s_{\\mathrm{avg}} &= \\frac{\\text{total distance}}{\\Delta t}', `\\frac{${N(o.dist)}\\ \\mathrm{m}}{${N(o.t)}\\ \\mathrm{s}}`, `${N(o.sAvg)}\\ \\mathrm{m/s}`) : 's_{\\mathrm{avg}} = \\frac{\\text{total distance}}{\\Delta t}') }];
    return [a[0], x[0]];
  },

  readouts: p => {
    if (p.activity === 'dx') {
      return [
        { id: 'v', label: '속도 (velocity)', value: (o, _, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
        { id: 'dx', label: '변위 (displacement)', value: (o, _, f) => `<i>x</i> − <i>x</i><sub>0</sub> = ${f(o.dx, z)} m` },
        { id: 'dist', label: '전체 거리 (total distance)', value: (o, _, f) => `${f(o.dist, z)} m` },
        { id: 'avg', label: '평균 속력 (average speed)', value: (o, _, f) => `<i>s</i><sub>avg</sub> = ${f(o.sAvg, z)} m/s<br><small>평균 속도 <i>v</i><sub>avg</sub> = ${f(o.vAvg, z)} m/s</small>` },
      ];
    }
    if (p.activity === 'stop') {
      return [
        { id: 'x', label: '위치 (position)', value: (o, _, f) => `<i>x</i> = ${f(o.x, z)} m` },
        { id: 'v', label: '속도 (velocity)', value: (o, _, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
        { id: 'a', label: '가속도 (acceleration)', value: (o, _, f) => `<i>a</i> = ${f(o.a, z)} m/s²` },
        { id: 'gap', label: '정지선까지', value: (o, q, f) => `${f(M.goalX(q) - o.x, z)} m` },
      ];
    }
    return [
      { id: 'a', label: '가속도 (acceleration)', value: (o, _, f) => `<i>a</i> = ${f(o.a, z)} m/s²` },
      { id: 'dv', label: '속도 변화 (change in velocity)', value: (o, _, f) => `<i>v</i> − <i>v</i><sub>0</sub> = ${f(o.dv, z)} m/s` },
      { id: 'v', label: '속도 (velocity)', value: (o, _, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
      { id: 'x', label: '위치 (position)', value: (o, _, f) => `<i>x</i> = ${f(o.x, z)} m` },
    ];
  },

  belowNote: p => ({
    dv: '<i>a</i>–<i>t</i> 판에서 곡선과 시간축 사이 넓이가 그동안의 속도 변화다. 시간축 위 넓이는 양(+), 아래 넓이는 음(−)이다. 재생하면 넓이가 쌓이며 <i>v</i>–<i>t</i> 곡선이 그려진다.',
    dx: '<i>v</i>–<i>t</i> 판의 넓이가 변위다. 축 아래 넓이만큼 자동차는 되돌아간다. 넓이의 크기를 부호 없이 모두 더하면 전체 거리 (total distance)다.',
    stop: '<i>t</i> = 8.00 s에 <i>v</i> = 0이려면 <i>a</i>–<i>t</i> 넓이의 합이 0이어야 한다. 그때 멈춘 위치는 <i>v</i>–<i>t</i> 넓이의 합이다.',
  }[p.activity]),

  objectives: '교재 Principles of Physics 12e, Chapter 2 Motion Along a Straight Line, Module 2.6 Graphical Integration in Motion Analysis, Learning Objectives 2.6.1–2.6.2. 평균 속력은 Module 2.1의 식 (2.1.3)을 쓴다. 식 번호는 교재 번호다. 화면의 문제는 교재 문제를 옮기지 않았다.',
};
