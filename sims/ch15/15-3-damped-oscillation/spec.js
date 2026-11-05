// 15.5 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c15에서 확인했다 (damped simple harmonic motion, damping force, damping constant, vane, rigid support,
// amplitude, angular frequency, mechanical energy, thermal energy).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '15-3',
  course: '일반물리 I',
  chapter: 15,
  chapterTitle: 'Oscillations',
  module: '15.5',
  title: '감쇠 단순 조화 운동 (Damped Simple Harmonic Motion)',
  headerNote: '교재 Principles of Physics 12e · Module 15.5',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: '액체 속 날개가 달린 용수철–블록 진동자',

  assumptions: () => [
    '감쇠력은 속도에 비례한다. 막대와 날개 (vane)의 질량은 무시한다',
    '교재처럼 블록의 중력은 무시하고 <i>x</i>는 평형 위치에서 잰다. 위가 +다',
    '블록은 <i>t</i> = 0에 <i>x</i> = <i>x</i><sub>m</sub>에 있다 (<i>ϕ</i> = 0)',
    '감쇠 상수 범위에서 <i>k</i>/<i>m</i> > <i>b</i>²/4<i>m</i>²라 식 (15.5.5)의 <i>ω</i>′가 실수다',
    `재생은 ${M.RUN} s 동안이다`,
  ],

  equations: () => [
    { tex: 'F_d = -bv', no: '15.5.1' },
    { tex: '-bv - kx = ma', no: '15.5.2' },
    { tex: 'x(t) = x_me^{-bt/2m}\\cos(\\omega\' t + \\phi)', no: '15.5.4' },
    { tex: '\\omega\' = \\sqrt{\\dfrac{k}{m} - \\dfrac{b^2}{4m^2}}', no: '15.5.5' },
    { tex: 'E(t) \\approx \\tfrac{1}{2}kx_m^2e^{-bt/m}', no: '15.5.6' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'x', label: '위치 (position)', value: (o, q, f) => `<i>x</i> = ${f(o.x * 100, z)} cm` },
      { id: 'A', label: '진폭 (amplitude)', value: show((o, q, f) => `<i>x</i><sub>m</sub><i>e</i><sup>−<i>bt</i>/2<i>m</i></sup> = ${f(o.amp * 100)} cm`) },
      { id: 'E', label: '역학적 에너지 (mechanical energy)', value: show((o, q, f) => `<i>K</i> + <i>U</i> = ${f(o.E, z)} J`) },
      { id: 'w', label: '감쇠 진동자의 각진동수 (angular frequency)', value: (o, q, f) => `<i>ω</i>′ = ${f(o.wd)} rad/s` },
    ];
  },

  belowNote: '파란 화살표는 블록의 속도, 주황 화살표는 액체가 날개에 작용하는 감쇠력 (damping force) <i>F</i><sub>d</sub> = −<i>bv</i>다. 감쇠력은 언제나 속도와 반대 방향이다. 확인 뒤 오른쪽 위 판에 <i>x</i>–<i>t</i> 그래프와 진폭 ±<i>x</i><sub>m</sub><i>e</i><sup>−<i>bt</i>/2<i>m</i></sup>(점선)을 그린다. 아래 에너지 막대는 운동에너지 <i>K</i>(하늘색), 퍼텐셜 에너지 <i>U</i>(주황), 늘어난 열에너지 Δ<i>E</i><sub>th</sub>(노랑), 그 합(테두리만)이다.',

  objectives: '교재 Principles of Physics 12e, Chapter 15 Oscillations, Module 15.5 Damped Simple Harmonic Motion, Learning Objective 15.5.1–15.5.5. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
