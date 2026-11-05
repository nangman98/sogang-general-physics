// 11.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c11에서 확인했다 (yo-yo, axle, rotational inertia, free-body diagram, tension).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '11-3',
  course: '일반물리 I',
  chapter: 11,
  chapterTitle: 'Rolling, Torque, and Angular Momentum',
  module: '11.3',
  title: '요요 (The Yo-Yo)',
  headerNote: '교재 Principles of Physics 12e · Module 11.3',
  dt: 1 / 240,
  speed: 1,
  timeScale: 0.25,
  sceneTitle: '줄을 따라 내려가는 요요',

  assumptions: () => [
    '요요는 반지름 <i>R</i>인 고른 원판 두 장이다. 축의 질량은 무시한다 (<i>I</i><sub>com</sub> = ½<i>MR</i>²)',
    `줄은 가볍고 늘어나지 않으며 축에서 미끄러지지 않는다. 정지 상태에서 ${M.DROP} m를 내려간다`,
    '줄의 두께와 공기 저항은 무시한다',
    `<i>g</i> = ${M.G} m/s²`,
  ],

  equations: () => [
    { tex: 'a_{\\text{com}} = -\\dfrac{g}{1 + I_{\\text{com}}/MR_0^2}', no: '11.3.1' },
    { tex: 'T - Mg = Ma_{\\text{com}}' },
    { tex: 'v_{\\text{com}} = \\omega R_0' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'a', label: '가속도 크기', value: show((o, q, f) => `|<i>a</i><sub>com</sub>| = ${f(o.a)} m/s²`) },
      { id: 'T', label: '줄의 장력 (tension)', value: show((o, q, f) => `<i>T</i> = ${f(o.T)} N`) },
      { id: 'y', label: '내려간 거리', value: (o, q, f) => `<i>h</i> = ${f(o.y, z)} m` },
      { id: 'v', label: '질량중심 속력', value: (o, q, f) => `<i>v</i><sub>com</sub> = ${f(o.v, z)} m/s` },
      { id: 'w', label: '각속도', value: (o, q, f) => `<i>ω</i> = ${f(o.w, z)} rad/s` },
    ];
  },

  belowNote: '요요는 실제보다 8배 크게 그렸다. 내려간 거리는 실제 축척이다. 회전이 보이도록 1×에서 실제보다 4배 느리게 재생한다. 시간 막대는 실제 시간이다. 주황 화살표는 장력 <i>T</i>와 중력 <i>F</i><sub>g</sub>, 분홍 화살표는 가속도다. 장력은 축의 줄 쪽 가장자리에 작용해 요요를 돌린다. 확인 전에는 가속도와 장력 값을 가린다.',

  objectives: '교재 Principles of Physics 12e, Chapter 11 Rolling, Torque, and Angular Momentum, Module 11.3 The Yo-Yo, Learning Objective 11.3.1–11.3.4. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
