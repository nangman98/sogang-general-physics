// 11.8 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c11에서 확인했다 (conservation of angular momentum, rotational inertia, angular speed,
// merry-go-round, isolated system).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '11-4',
  course: '일반물리 I',
  chapter: 11,
  chapterTitle: 'Rolling, Torque, and Angular Momentum',
  module: '11.8',
  title: '각운동량 보존 (Conservation of Angular Momentum)',
  headerNote: '교재 Principles of Physics 12e · Module 11.8',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: '회전 원판 위를 기어가는 물체',

  assumptions: () => [
    '원판은 고른 원판이고 중심축에 마찰 없이 꽂혀 있다 (<i>I</i><sub>d</sub> = ½<i>MR</i>²)',
    '움직이는 물체는 질점이다 (<i>I</i> = <i>mr</i>²)',
    `물체는 ${M.T1} s 동안 <i>r</i><sub>i</sub>에 있다가 ${M.TC} s 동안 지름을 따라 <i>r</i><sub>f</sub>로 기어간다`,
    '축에 대한 외부 돌림힘이 없다. 위에서 볼 때 시계 반대 방향 회전이 +다',
  ],

  equations: () => [
    { tex: 'L = I\\omega', no: '11.7.6' },
    { tex: 'I_i\\omega_i = I_f\\omega_f', no: '11.8.3' },
    { tex: 'I = \\tfrac{1}{2}MR^2 + mr^2' },
    { tex: 'K = \\tfrac{1}{2}I\\omega^2', no: '10.4.4' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'r', label: '물체의 거리', value: (o, q, f) => `<i>r</i> = ${f(o.r, z)} m` },
      { id: 'I', label: '관성모멘트', value: (o, q, f) => `<i>I</i> = ${f(o.I)} kg·m²` },
      { id: 'w', label: '각속도', value: show((o, q, f) => `<i>ω</i> = ${f(o.w)} rad/s`) },
      { id: 'L', label: '각운동량 (angular momentum)', value: (o, q, f) => `<i>L</i> = ${f(o.L)} kg·m²/s` },
      { id: 'K', label: '회전 운동에너지', value: show((o, q, f) => `<i>K</i> = ${f(o.K)} J`) },
    ];
  },

  belowNote: '초록 화살표가 계의 각운동량 <i>L</i>이다. 물체가 움직여도 길이가 그대로다. 원판의 흰 선은 돌아간 각을 보여 주고 어두운 홈은 물체가 기어가는 지름이다. 뒤 그래프 판에는 확인 뒤 각속도 <i>ω</i>(<i>t</i>)가 그려진다.',

  objectives: '교재 Principles of Physics 12e, Chapter 11 Rolling, Torque, and Angular Momentum, Module 11.8 Conservation of Angular Momentum, Learning Objective 11.8.1. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
