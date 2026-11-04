// 2.1–2.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 괄호 영어는 교재 c02에서 확인했다 (average velocity, instantaneous velocity, speed, acceleration, average acceleration,
// displacement, time interval, slope, change in velocity, particle, motion). 접선·할선은 c02에 영어가 없어 붙이지 않는다.
import { texNum as N } from '../../../core/format.js';
import * as M from './model.js';

const P = x => (x < 0 ? `(${N(x)})` : N(x));
const lines = (...r) => `\\begin{aligned}${r[0]}${r.slice(1).map(x => `\\\\ &= ${x}`).join('')}\\end{aligned}`;
const sub = (s, k) => `${s}<sub>${k}</sub>`;
const VAVG = `<i>v</i><sub>avg</sub>`, AAVG = `<i>a</i><sub>avg</sub>`;
const z = { zero: 1e-9 };

export const spec = {
  id: '2-1',
  course: '일반물리 I',
  chapter: 2,
  chapterTitle: 'Motion Along a Straight Line',
  module: '2.1–2.3',
  title: '순간 속도와 가속도 (Position, Displacement, and Average Velocity · Instantaneous Velocity and Speed · Acceleration)',
  headerNote: '교재 Principles of Physics 12e · Module 2.1, 2.2, 2.3',
  dt: 1 / 120,
  runIf: p => p.activity !== 'secant',
  timeIf: p => p.activity !== 'secant',
  sceneTitle: p => ({
    secant: p.board === 'v' ? '할선에서 접선으로, <i>v</i>–<i>t</i> 판' : '할선에서 접선으로, <i>x</i>–<i>t</i> 판',
    slope: '기울기 읽기, <i>x</i>–<i>t</i> → <i>v</i> → <i>a</i>',
    speed: '속력 (speed)이 커지는가',
  }[p.activity]),

  assumptions: p => [
    '자동차는 입자 (particle)로 본다. 위치 <i>x</i>는 자동차 가운데다',
    '+<i>x</i> 방향은 오른쪽이다',
    ...(p.activity === 'secant' ? ['Δ<i>t</i> > 0이고 <i>t</i><sub>2</sub> = <i>t</i><sub>1</sub> + Δ<i>t</i>이다'] : []),
    '식의 <i>x</i>는 m, <i>t</i>는 s 단위다',
    '자동차 크기는 실제 비율이 아니다',
  ],

  equations: p => {
    const m = M.motionOf(p);
    if (p.activity === 'secant' && p.board === 'v') {
      return [
        { tex: `v = ${m.vTex}` },
        { no: '2.3.1', tex: 'a_{\\mathrm{avg}} = \\frac{v_2 - v_1}{t_2 - t_1} = \\frac{\\Delta v}{\\Delta t}', live: o => lines('a_{\\mathrm{avg}} &= \\frac{\\Delta v}{\\Delta t}', `\\frac{${N(o.sec.dy)}\\ \\mathrm{m/s}}{${N(o.sec.dt)}\\ \\mathrm{s}}`, `${N(o.sec.slope)}\\ \\mathrm{m/s^2}`) },
        { no: '2.3.2', tex: 'a = \\frac{dv}{dt}' },
      ];
    }
    if (p.activity === 'secant') {
      return [
        { tex: m.xTex },
        { no: '2.1.1', tex: '\\Delta x = x_2 - x_1', live: o => lines('\\Delta x &= x_2 - x_1', `${P(o.sec.y2)} - ${P(o.sec.y1)}`, `${N(o.sec.dy)}\\ \\mathrm{m}`) },
        { no: '2.1.2', tex: 'v_{\\mathrm{avg}} = \\frac{\\Delta x}{\\Delta t} = \\frac{x_2 - x_1}{t_2 - t_1}', live: o => lines('v_{\\mathrm{avg}} &= \\frac{\\Delta x}{\\Delta t}', `\\frac{${N(o.sec.dy)}\\ \\mathrm{m}}{${N(o.sec.dt)}\\ \\mathrm{s}}`, `${N(o.sec.slope)}\\ \\mathrm{m/s}`) },
        { no: '2.2.1', tex: 'v = \\lim_{\\Delta t \\to 0} \\frac{\\Delta x}{\\Delta t} = \\frac{dx}{dt}' },
      ];
    }
    return [
      { tex: m.xTex },
      { no: '2.2.1', tex: `v = \\frac{dx}{dt} = ${m.vTex}`, live: o => lines(`v &= \\frac{dx}{dt} = ${m.vTex}`, `${N(o.v)}\\ \\mathrm{m/s}`) },
      { no: '2.3.2', tex: `a = \\frac{dv}{dt} = ${m.aTex}`, live: o => lines(`a &= \\frac{dv}{dt} = ${m.aTex}`, `${N(o.a)}\\ \\mathrm{m/s^2}`) },
      { no: '2.3.3', tex: 'a = \\frac{d^2x}{dt^2}' },
    ];
  },

  readouts: p => {
    if (p.activity === 'secant' && p.board === 'v') {
      return [
        { id: 'v12', label: '속도 (velocity)', value: (o, _, f) => `${sub('<i>v</i>', 1)} = ${f(o.sec.y1, z)} m/s<br>${sub('<i>v</i>', 2)} = ${f(o.sec.y2, z)} m/s` },
        { id: 'dv', label: '속도 변화 (change in velocity)', value: (o, _, f) => `Δ<i>v</i> = ${f(o.sec.dy, z)} m/s` },
        { id: 'dt', label: '시간 간격 (time interval)', value: (o, _, f) => `Δ<i>t</i> = ${f(o.sec.dt)} s` },
        { id: 'aavg', label: '평균 가속도 (average acceleration)', value: (o, _, f) => `${AAVG} = ${f(o.sec.slope, z)} m/s²` },
      ];
    }
    if (p.activity === 'secant') {
      return [
        { id: 'x12', label: '위치 (position)', value: (o, _, f) => `${sub('<i>x</i>', 1)} = ${f(o.sec.y1, z)} m<br>${sub('<i>x</i>', 2)} = ${f(o.sec.y2, z)} m` },
        { id: 'dx', label: '변위 (displacement)', value: (o, _, f) => `Δ<i>x</i> = ${f(o.sec.dy, z)} m` },
        { id: 'dt', label: '시간 간격 (time interval)', value: (o, _, f) => `Δ<i>t</i> = ${f(o.sec.dt)} s` },
        { id: 'vavg', label: '평균 속도 (average velocity)', value: (o, _, f) => `${VAVG} = ${f(o.sec.slope, z)} m/s` },
      ];
    }
    return [
      { id: 'x', label: '위치 (position)', value: (o, _, f) => `<i>x</i> = ${f(o.x, z)} m` },
      { id: 'v', label: '속도 (velocity)', value: (o, _, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
      { id: 'speed', label: '속력 (speed)', value: (o, _, f) => `|<i>v</i>| = ${f(o.speed, z)} m/s` },
      { id: 'a', label: '가속도 (acceleration)', value: (o, _, f) => `<i>a</i> = ${f(o.a, z)} m/s²` },
    ];
  },

  belowNote: p => {
    if (p.activity === 'secant') {
      const [y, s, q] = p.board === 'v' ? ['<i>v</i>', AAVG, '<i>a</i>'] : ['<i>x</i>', VAVG, '<i>v</i>'];
      return `P와 Q를 잇는 할선의 기울기 (slope)가 ${s} = Δ${y}/Δ<i>t</i>이다. Δ<i>t</i>를 줄이면 Q가 P로 다가가고 할선은 P에서의 접선에 가까워진다. 그 극한값이 <i>t</i><sub>1</sub>에서의 ${q}이다.`;
    }
    if (p.activity === 'slope') return '<i>x</i>–<i>t</i> 판에서 접선의 기울기가 그 시각의 <i>v</i>이고 <i>v</i>–<i>t</i> 판에 점으로 찍힌다. <i>v</i>–<i>t</i> 판에서 접선의 기울기는 그 시각의 <i>a</i>이다. 시간을 옮기면 <i>v</i>–<i>t</i> 곡선이 그려진다.';
    return '표시한 네 시각에서 <i>v</i>와 <i>a</i>의 부호를 보고 속력 |<i>v</i>|가 커지는지 고른다. 재생하거나 시간을 옮겨 속력 측정값으로 확인한다.';
  },

  objectives: '교재 Principles of Physics 12e, Chapter 2 Motion Along a Straight Line. Module 2.1 (Learning Objectives 2.1.4, 2.1.6), Module 2.2 (2.2.1–2.2.3), Module 2.3 (2.3.1–2.3.3). 식 번호는 교재 번호다. 운동 다섯 가지와 문제는 교재 문제를 옮기지 않았다.',
};
