// 7.4–7.5 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c07에서 확인했다 (spring force, spring constant, Hooke's law, relaxed state, applied force,
// variable force, work, area under the curve).
import { fmt } from '../../../core/format.js';
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '7-2',
  course: '일반물리 I',
  chapter: 7,
  chapterTitle: 'Kinetic Energy and Work',
  module: '7.4–7.5',
  title: '변하는 힘이 하는 일 (Work Done by a Variable Force)',
  headerNote: '교재 Principles of Physics 12e · Module 7.4, 7.5',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'graph' ? '<i>F</i>–<i>x</i> 그래프 넓이와 일' : '용수철 힘이 하는 일'),

  assumptions: p => (p.activity === 'graph' ? [
    '바닥에 마찰이 없다',
    '힘은 +<i>x</i> 방향이고 크기는 그래프대로 변한다',
    '블록은 <i>x</i> = 0에서 처음 속력 <i>v</i><sub>i</sub>로 출발한다',
  ] : [
    '바닥에 마찰이 없다',
    '용수철은 질량이 없고 훅 법칙 (Hooke’s law)을 따른다',
    '<i>x</i> = 0은 용수철이 늘지도 줄지도 않은 상태 (relaxed state)다',
    '가한 힘이 블록을 천천히 옮겨 처음과 끝에 블록이 정지해 있다',
  ]),

  equations: p => (p.activity === 'graph' ? [
    { tex: 'W = \\int_{x_i}^{x_f} F(x)\\,dx', no: '7.5.8' },
    { tex: 'K_f = K_i + W', no: '7.2.9' },
  ] : [
    { tex: 'F_x = -kx', no: '7.4.2' },
    { tex: 'W_s = \\tfrac{1}{2}kx_i^2 - \\tfrac{1}{2}kx_f^2', no: '7.4.6' },
    { tex: 'W_a = -W_s', no: '7.4.9' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (p.activity === 'graph') {
      return [
        { id: 'x', label: '위치 (position)', value: (o, q, f) => `<i>x</i> = ${f(o.x, z)} m` },
        { id: 'F', label: '힘 (force)', value: (o, q, f) => `<i>F</i> = ${f(o.F, z)} N` },
        { id: 'W', label: '지금까지 한 일 (work)', value: show((o, q, f) => `<i>W</i> = ${f(o.W, z)} J`) },
        { id: 'K', label: '운동에너지', value: show((o, q, f) => `<i>K</i> = ${f(o.K)} J<br><small><i>v</i> = ${f(o.v)} m/s</small>`) },
      ];
    }
    return [
      { id: 'x', label: '위치 (position)', value: (o, q, f) => `<i>x</i> = ${f(o.x, z)} m` },
      { id: 'Fs', label: '용수철 힘 (spring force)', value: (o, q, f) => `<i>F</i><sub>x</sub> = ${f(o.Fs, z)} N` },
      { id: 'Ws', label: '용수철 힘이 한 일', value: show((o, q, f) => `<i>W</i><sub>s</sub> = ${f(o.Ws, z)} J`) },
      { id: 'Wa', label: '가한 힘이 한 일', value: show((o, q, f) => `<i>W</i><sub>a</sub> = ${f(o.Wa, z)} J`) },
    ];
  },

  belowNote: p => (p.activity === 'graph'
    ? '뒤 그래프 판은 힘 <i>F</i>–위치 <i>x</i>다. 블록이 지나간 구간의 넓이를 칠하고 칸마다 + 부호를 단다. 그 넓이가 힘이 한 일이다.'
    : `뒤 그래프 판은 용수철 힘 <i>F</i><sub>x</sub> = −<i>kx</i>–위치 <i>x</i>다. 블록이 지나간 구간을 칠한다. 주황(+)은 용수철 힘이 양의 일, 하늘색(−)은 음의 일을 한 구간이다. 힘 화살표는 1 m = ${fmt(1 / springScale(p))} N이다.`),

  objectives: '교재 Principles of Physics 12e, Chapter 7 Kinetic Energy and Work, Module 7.4 Work Done by a Spring Force, Module 7.5 Work Done by a General Variable Force, Learning Objective 7.4.1–7.4.5, 7.5.1–7.5.4. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};

// Spring and applied force arrows: the force at |x| = 0.3 m is 1.2 m long.
export const springScale = p => 1.2 / (p.k * 0.3);
