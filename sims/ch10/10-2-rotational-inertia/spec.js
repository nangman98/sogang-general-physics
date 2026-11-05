// 10.5 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c10에서 확인했다 (rotational inertia, parallel-axis theorem, hoop, solid cylinder (or disk),
// solid sphere, thin spherical shell, thin rod, torque).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '10-2',
  course: '일반물리 I',
  chapter: 10,
  chapterTitle: 'Rotation',
  module: '10.5',
  title: '관성모멘트 (Calculating the Rotational Inertia)',
  headerNote: '교재 Principles of Physics 12e · Module 10.5',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'parallel' ? '축을 옮긴 막대 (parallel-axis theorem)' : '같은 돌림힘으로 돌리는 두 물체'),

  assumptions: p => [
    '물체는 정지 상태에서 고정된 연직 축을 중심으로 돈다',
    '축의 마찰은 없다',
    `돌림힘 <i>τ</i>는 ${M.RUN} s 동안 일정하다`,
    p.activity === 'parallel' ? '막대는 가늘고 질량이 고르게 퍼져 있다' : '두 물체의 질량 <i>M</i>과 반지름 <i>R</i>은 같다. 막대는 길이 2<i>R</i>이고 가운데를 지나는 축으로 돈다',
  ],

  equations: p => (p.activity === 'parallel' ? [
    { tex: 'I = I_{\\text{com}} + Mh^2', no: '10.5.2' },
    { tex: 'I_{\\text{com}} = \\tfrac{1}{12}ML^2' },
    { tex: '\\tau_{\\text{net}} = I\\alpha', no: '10.7.4' },
  ] : [
    { tex: 'I = \\sum m_i r_i^2', no: '10.4.3' },
    { tex: '\\tau_{\\text{net}} = I\\alpha', no: '10.7.4' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (p.activity === 'parallel') {
      return [
        { id: 'I', label: '관성모멘트 (rotational inertia)', value: show((o, q, f) => `<i>I</i> = ${f(o.IA)} kg·m²`) },
        { id: 'a', label: '각가속도', value: show((o, q, f) => `<i>α</i> = ${f(o.aA)} rad/s²`) },
        { id: 'w', label: '각속도', value: (o, q, f) => `<i>ω</i> = ${f(o.wA, z)} rad/s` },
      ];
    }
    return [
      { id: 'IA', label: 'A의 관성모멘트', value: show((o, q, f) => `<i>I</i><sub>A</sub> = ${f(o.IA)} kg·m²`) },
      { id: 'IB', label: 'B의 관성모멘트', value: show((o, q, f) => `<i>I</i><sub>B</sub> = ${f(o.IB)} kg·m²`) },
      { id: 'wA', label: 'A의 각속도', value: (o, q, f) => `<i>ω</i><sub>A</sub> = ${f(o.wA, z)} rad/s` },
      { id: 'wB', label: 'B의 각속도', value: (o, q, f) => `<i>ω</i><sub>B</sub> = ${f(o.wB, z)} rad/s` },
    ];
  },

  belowNote: p => `뒤 그래프 판은 각속도 <i>ω</i>–시간 <i>t</i>이고 기울기가 각가속도다.${p.activity === 'race' ? ' 실선이 A, 점선이 B다. 질량이 축에서 멀리 퍼진 물체일수록 관성모멘트가 크다.' : ' 검은 표시(⊕)가 막대의 질량중심, 주황 기둥이 회전축이다.'}`,

  objectives: '교재 Principles of Physics 12e, Chapter 10 Rotation, Module 10.5 Calculating the Rotational Inertia, Learning Objective 10.5.1–10.5.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
