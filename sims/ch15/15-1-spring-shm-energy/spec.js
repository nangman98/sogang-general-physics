// 15.1–15.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c15에서 확인했다 (simple harmonic motion, linear oscillator, amplitude, period, frequency,
// angular frequency, phase constant, velocity amplitude, acceleration amplitude, spring constant, restoring force,
// equilibrium position, kinetic energy, potential energy, mechanical energy).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '15-1',
  course: '일반물리 I',
  chapter: 15,
  chapterTitle: 'Oscillations',
  module: '15.1–15.2',
  title: '단순 조화 운동과 에너지 (Simple Harmonic Motion, Energy in SHM)',
  headerNote: '교재 Principles of Physics 12e · Module 15.1, 15.2',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: '마찰 없는 바닥 위 용수철–블록 진동자',

  assumptions: () => [
    '바닥에 마찰이 없고 공기 저항도 없다',
    '용수철은 질량이 없고 블록은 변형되지 않는다 (선형 진동자)',
    '위치 <i>x</i>는 평형 위치에서 재고 오른쪽이 +다',
    `처음 위치를 고르면 위상 상수 <i>ϕ</i>가 정해진다. 재생은 ${M.RUN} s 동안이다`,
  ],

  equations: () => [
    { tex: 'x(t) = x_m\\cos(\\omega t + \\phi)', no: '15.1.3' },
    { tex: 'v(t) = -\\omega x_m\\sin(\\omega t + \\phi)', no: '15.1.6' },
    { tex: 'a(t) = -\\omega^2 x_m\\cos(\\omega t + \\phi)', no: '15.1.7' },
    { tex: 'F = -kx', no: '15.1.10' },
    { tex: '\\omega = \\sqrt{k/m}', no: '15.1.12' },
    { tex: 'T = 2\\pi\\sqrt{m/k}', no: '15.1.13' },
    { tex: 'E = U + K = \\tfrac{1}{2}kx_m^2', no: '15.2.4' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'x', label: '위치 (position)', value: (o, q, f) => `<i>x</i> = ${f(o.x * 100, z)} cm` },
      { id: 'v', label: '속도 (velocity)', value: show((o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s`) },
      { id: 'K', label: '운동에너지 (kinetic energy)', value: show((o, q, f) => `<i>K</i> = ${f(o.K, z)} J`) },
      { id: 'U', label: '퍼텐셜 에너지 (potential energy)', value: (o, q, f) => `<i>U</i> = ${f(o.U, z)} J` },
    ];
  },

  belowNote: '파란 화살표는 속도, 분홍 화살표는 가속도, 주황 화살표는 용수철 힘이다. 가속도와 힘은 언제나 변위와 반대 방향이다. 확인 뒤 뒤쪽 세 판에 위치·속도·가속도 그래프를 그리고 오른쪽에 에너지 막대를 세운다. 막대는 운동에너지 <i>K</i>(하늘색), 퍼텐셜 에너지 <i>U</i>(주황), 역학적 에너지 <i>E</i>(테두리만)다.',

  objectives: '교재 Principles of Physics 12e, Chapter 15 Oscillations, Module 15.1 Simple Harmonic Motion, Module 15.2 Energy in Simple Harmonic Motion, Learning Objective 15.1.2–15.1.15, 15.1.17–15.1.18, 15.2.1–15.2.4. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};

