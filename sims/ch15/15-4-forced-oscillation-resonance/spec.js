// 15.6 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c15에서 확인했다 (forced oscillations, driven oscillations, resonance, natural angular frequency,
// driving angular frequency, driving force, displacement amplitude, velocity amplitude, damping constant, rigid support).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '15-4',
  course: '일반물리 I',
  chapter: 15,
  chapterTitle: 'Oscillations',
  module: '15.6',
  title: '강제 진동과 공명 (Forced Oscillations and Resonance)',
  headerNote: '교재 Principles of Physics 12e · Module 15.6',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: '지지대를 위아래로 흔드는 감쇠 진동자',

  assumptions: () => [
    '지지대 (rigid support)가 (<i>F</i><sub>m</sub>/<i>k</i>) cos <i>ω</i><sub>d</sub><i>t</i>만큼 오르내려 용수철에 구동력 <i>F</i><sub>m</sub> cos <i>ω</i><sub>d</sub><i>t</i>를 준다',
    '감쇠력은 <i>F</i><sub>d</sub> = −<i>bv</i>다. 교재처럼 블록의 중력은 무시한다',
    '구동을 시작하고 충분히 지나 진폭이 일정해진 뒤의 운동만 보인다 (식 15.6.1)',
    '진폭 식은 운동 방정식에 식 (15.6.1)을 넣어 구했다. 교재 15장 문제 34에 같은 식이 있다',
  ],

  equations: () => [
    { tex: 'm\\dfrac{d^2x}{dt^2} + b\\dfrac{dx}{dt} + kx = F_m\\cos\\omega_d t' },
    { tex: 'x(t) = x_m\\cos(\\omega_d t + \\phi)', no: '15.6.1' },
    { tex: 'x_m = \\dfrac{F_m}{\\sqrt{m^2(\\omega_d^2 - \\omega^2)^2 + b^2\\omega_d^2}}' },
    { tex: '\\omega_d = \\omega\\ \\ (\\text{resonance})', no: '15.6.2' },
    { tex: '\\omega = \\sqrt{k/m}', no: '15.1.12' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'x', label: '위치 (position)', value: (o, q, f) => `<i>x</i> = ${f(o.x * 100, z)} cm` },
      { id: 'r', label: '각진동수의 비 (angular frequency)', value: show((o, q, f) => `<i>ω</i><sub>d</sub>/<i>ω</i> = ${f(o.wd / o.w)}`) },
      { id: 'xm', label: '변위 진폭 (displacement amplitude)', value: show((o, q, f) => `<i>x</i><sub>m</sub> = ${f(o.xm * 100)} cm`) },
      { id: 'vm', label: '속도 진폭 (velocity amplitude)', value: show((o, q, f) => `<i>v</i><sub>m</sub> = ${f(o.vm)} m/s`) },
    ];
  },

  belowNote: '주황 화살표는 지지대가 용수철에 주는 구동력 <i>F</i><sub>m</sub> cos <i>ω</i><sub>d</sub><i>t</i>, 파란 화살표는 블록의 속도다. 확인 뒤 오른쪽 판에 구동 각진동수 <i>ω</i><sub>d</sub>에 따른 변위 진폭 <i>x</i><sub>m</sub>을 그린다. 실선은 지금의 <i>b</i>, 점선은 <i>b</i>를 두 배로 한 경우이고 고리는 지금의 <i>ω</i><sub>d</sub>다. 확인한 뒤 <i>ω</i><sub>d</sub> 슬라이더를 움직여도 예측과 그래프는 그대로 남는다.',

  objectives: '교재 Principles of Physics 12e, Chapter 15 Oscillations, Module 15.6 Forced Oscillations and Resonance, Learning Objective 15.6.1–15.6.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
