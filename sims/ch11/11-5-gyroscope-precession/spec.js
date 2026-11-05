// 11.9 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c11에서 확인했다 (gyroscope, precession, precession rate, spin, moment arm, support).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '11-5',
  course: '일반물리 I',
  chapter: 11,
  chapterTitle: 'Rolling, Torque, and Angular Momentum',
  module: '11.9',
  title: '자이로스코프의 세차 (Precession of a Gyroscope)',
  headerNote: '교재 Principles of Physics 12e · Module 11.9',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: '받침점 위에서 세차하는 자이로스코프',

  assumptions: () => [
    '바퀴는 고른 원판이다 (<i>I</i> = ½<i>MR</i><sub>w</sub>²). 축의 질량은 무시한다',
    '축은 수평이고 받침점 O는 움직이지 않는다',
    '자전이 충분히 빨라 세차에 따른 각운동량은 무시한다 (<i>ω</i> ≫ <i>Ω</i>)',
    `<i>g</i> = ${M.G} m/s²`,
  ],

  equations: () => [
    { tex: '\\tau = Mgr', no: '11.9.2' },
    { tex: 'L = I\\omega', no: '11.9.3' },
    { tex: 'd\\vec L = \\vec\\tau\\,dt', no: '11.9.4' },
    { tex: '\\Omega = \\dfrac{Mgr}{I\\omega}', no: '11.9.6' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'L', label: '자전 각운동량', value: (o, q, f) => `<i>L</i> = ${f(o.L)} kg·m²/s` },
      { id: 'tau', label: '돌림힘 (torque)', value: (o, q, f) => `<i>τ</i> = ${f(o.tau)} N·m` },
      { id: 'Om', label: '세차 각속도 (precession rate)', value: show((o, q, f) => `<i>Ω</i> = ${f(o.Om)} rad/s`) },
      { id: 'T', label: '세차 한 바퀴 시간', value: show((o, q, f) => `${f(o.T)} s`) },
      { id: 'phi', label: '세차한 각', value: show((o, q, f) => `<i>ϕ</i> = ${f(o.phi * 180 / Math.PI, z)}°`) },
    ];
  },

  belowNote: '초록 화살표는 자전 각운동량 <i>L</i>, 주황 화살표는 바퀴 중심의 중력 <i>Mg</i>와 받침점 O에 대한 돌림힘 <i>τ</i>다. 돌림힘은 확인 뒤에 보인다. 바퀴의 자전은 보이도록 실제보다 30배 느리게 그렸고 세차는 실제 빠르기다. 확인 뒤에는 <i>L</i>의 머리가 지나는 원을 점선으로 그린다.',

  objectives: '교재 Principles of Physics 12e, Chapter 11 Rolling, Torque, and Angular Momentum, Module 11.9 Precession of a Gyroscope, Learning Objective 11.9.1–11.9.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
