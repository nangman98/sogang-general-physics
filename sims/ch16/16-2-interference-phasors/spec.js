// 16.5–16.6 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c16에서 확인했다 (principle of superposition, resultant wave, interference, phase difference,
// phase constant, fully constructive interference, fully destructive interference, intermediate interference,
// phasor, phasor diagram, lead, lag, amplitude, wavelength).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isP = p => p.activity === 'phasor';

export const spec = {
  id: '16-2',
  course: '일반물리 I',
  chapter: 16,
  chapterTitle: 'Waves–I',
  module: '16.5–16.6',
  title: '파동의 간섭과 phasor (Interference of Waves, Phasors)',
  headerNote: '교재 Principles of Physics 12e · Module 16.5, 16.6',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (isP(p) ? '두 phasor를 벡터로 더한다' : '같은 진폭의 두 파가 겹친다'),

  assumptions: p => [
    '두 파는 같은 줄에서 같은 방향 (+<i>x</i>)으로 가고 파장과 진동수가 같다',
    `그림은 <i>λ</i> = ${M.LAM.toFixed(1)} cm, <i>T</i> = ${M.TP.toFixed(1)} s로 그렸다. 결과 파의 진폭과 위상 상수는 <i>λ</i>, <i>T</i>와 관계없다`,
    'phasor는 시계 방향으로 <i>ω</i>로 돈다. 세로축 위 투영이 <i>x</i> = 0에서 그 파의 변위다',
    isP(p) ? '각은 phasor 1에서 시계 반대 방향으로 잰다' : '확인 전에는 두 파만 그리고 실제 줄 (결과 파)은 확인 뒤에 그린다',
  ],

  equations: p => (isP(p) ? [
    { tex: 'y_1 = y_{m1}\\sin(kx - \\omega t)', no: '16.6.1' },
    { tex: 'y_2 = y_{m2}\\sin(kx - \\omega t + \\phi)', no: '16.6.2' },
    { tex: "y' = y'_m\\sin(kx - \\omega t + \\beta)", no: '16.6.3' },
    { tex: "y'_{mh} = y_{m1} + y_{m2}\\cos\\phi,\\ y'_{mv} = y_{m2}\\sin\\phi" },
  ] : [
    { tex: "y'(x,t) = y_1(x,t) + y_2(x,t)", no: '16.5.1' },
    { tex: 'y_2 = y_m\\sin(kx - \\omega t + \\phi)', no: '16.5.3' },
    { tex: "y' = [2y_m\\cos\\tfrac{1}{2}\\phi]\\sin(kx - \\omega t + \\tfrac{1}{2}\\phi)", no: '16.5.6' },
    { tex: "y'_m = |2y_m\\cos\\tfrac{1}{2}\\phi|", no: '16.5.7' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    const both = { id: 'y12', label: '<i>x</i> = 0에서 두 파의 변위', value: (o, q, f) => `<i>y</i><sub>1</sub> = ${f(o.p1, z)}, <i>y</i><sub>2</sub> = ${f(o.p2, z)} mm` };
    if (isP(p)) {
      return [
        { id: 'phi', label: '위상 상수 (phase constant)', value: (o, q, f) => `<i>ϕ</i> = ${q.phiP}° = ${f(q.phiP * Math.PI / 180, z)} rad` },
        both,
        { id: 'R', label: '결과 파의 진폭', value: show((o, q, f) => `<i>y′</i><sub>m</sub> = ${f(o.R, z)} mm`) },
        { id: 'b', label: '결과 파의 위상 상수', value: show((o, q, f) => (o.R < 1e-9 ? '결과 파 없음' : `<i>β</i> = ${f(o.beta, z)}°`)) },
      ];
    }
    return [
      { id: 'phi', label: '위상차 (phase difference)', value: (o, q, f) => `<i>ϕ</i> = ${q.phi}° = ${f(q.phi / 360, z)} 파장` },
      both,
      { id: 'yR', label: '<i>x</i> = 0에서 줄의 변위', value: show((o, q, f) => `<i>y′</i> = ${f(o.pR, z)} mm`) },
      { id: 'R', label: '결과 파의 진폭', value: show((o, q, f) => `<i>y′</i><sub>m</sub> = ${f(o.R, z)} mm`) },
    ];
  },

  belowNote: p => (isP(p)
    ? '왼쪽은 <i>x</i> = 0의 phasor 그림이다. 검은 화살표가 phasor이고 회색 점선이 세로축 위 투영을 줄의 <i>x</i> = 0까지 잇는다. 가는 실선은 파동 1, 점선은 파동 2다. 확인 뒤 phasor 2를 phasor 1의 머리로 옮긴 흐린 화살표, 합 phasor, 각 <i>β</i>, 그리고 실제 줄 (갈색)을 그린다.'
    : '왼쪽은 <i>x</i> = 0의 phasor 그림이다. 가는 실선은 파동 1, 점선은 파동 2이고 회색 점선이 phasor의 투영을 줄의 <i>x</i> = 0까지 잇는다. 확인 뒤 실제 줄 (갈색, 결과 파)과 합 phasor를 그린다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 16 Waves–I, Module 16.5 Interference of Waves, Module 16.6 Phasors, Learning Objective 16.5.1–16.5.4, 16.6.1–16.6.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
