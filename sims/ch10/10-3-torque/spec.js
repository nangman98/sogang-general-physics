// 10.6–10.7 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c10에서 확인했다 (torque, moment arm, line of action, rotation axis, Newton's second law for
// rotation, rotational inertia).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '10-3',
  course: '일반물리 I',
  chapter: 10,
  chapterTitle: 'Rotation',
  module: '10.6–10.7',
  title: '돌림힘과 회전의 제2법칙 (Torque, Newton’s Second Law for Rotation)',
  headerNote: '교재 Principles of Physics 12e · Module 10.6, 10.7',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'pulley' ? '도르래에 감긴 줄과 매단 블록' : '원판에 가한 힘의 돌림힘 (torque)'),

  assumptions: p => (p.activity === 'pulley' ? [
    '도르래는 고른 원판이고 축 마찰이 없다',
    '줄은 가볍고 늘어나지 않으며 도르래에서 미끄러지지 않는다',
    '블록은 정지 상태에서 내려가기 시작한다',
    `<i>g</i> = ${M.G} m/s²`,
  ] : [
    '고른 원판이 고정된 축을 중심으로 돈다. 축 마찰은 없다',
    '힘은 원판에 붙어 함께 돈다 (원판에 대한 크기와 방향이 그대로다)',
    '시계 반대 방향 돌림힘이 +다',
  ]),

  equations: p => (p.activity === 'pulley' ? [
    { tex: 'mg - T = ma' },
    { tex: 'TR = I\\alpha,\\ I = \\tfrac{1}{2}MR^2', no: '10.7.4' },
    { tex: 'a = \\alpha R', no: '10.3.6' },
  ] : [
    { tex: '\\tau = rF\\sin\\phi', no: '10.6.1' },
    { tex: '\\tau = r_\\perp F', no: '10.6.3' },
    { tex: '\\tau_{\\text{net}} = I\\alpha', no: '10.7.4' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (p.activity === 'pulley') {
      return [
        { id: 'a', label: '블록 가속도', value: show((o, q, f) => `<i>a</i> = ${f(o.a)} m/s²`) },
        { id: 'T', label: '줄의 장력 (tension)', value: show((o, q, f) => `<i>T</i> = ${f(o.T)} N`) },
        { id: 'v', label: '블록 속력', value: (o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
        { id: 'w', label: '도르래 각속도', value: (o, q, f) => `<i>ω</i> = ${f(o.w, z)} rad/s` },
      ];
    }
    return [
      { id: 'tau', label: '돌림힘 (torque)', value: show((o, q, f) => `<i>τ</i> = ${f(o.tau, z)} N·m`) },
      { id: 'I', label: '관성모멘트', value: (o, q, f) => `<i>I</i> = ${f(o.I)} kg·m²` },
      { id: 'al', label: '각가속도', value: show((o, q, f) => `<i>α</i> = ${f(o.alpha, z)} rad/s²`) },
      { id: 'w', label: '각속도', value: (o, q, f) => `<i>ω</i> = ${f(o.w, z)} rad/s` },
    ];
  },

  belowNote: p => (p.activity === 'pulley'
    ? '블록의 주황 화살표는 장력 <i>T</i>와 중력, 분홍 화살표는 가속도다. 도르래의 흰 선은 돌아간 각을 보여 준다.'
    : '흰 막대가 축에서 힘이 작용하는 점까지의 <i>r</i>이다. 회색 점선은 힘의 작용선 (line of action), 검은 점선은 축에서 작용선까지의 수직 거리 <i>r</i><sub>⊥</sub> (moment arm)다. 확인 전에는 돌림힘과 각가속도 값을 가린다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 10 Rotation, Module 10.6 Torque, Module 10.7 Newton’s Second Law for Rotation, Learning Objective 10.6.1–10.6.5, 10.7.1. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
