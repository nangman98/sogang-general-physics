// 15.4 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c15에서 확인했다 (simple pendulum, physical pendulum, bob, angular amplitude, restoring torque,
// restoring force, center of oscillation, reference particle, reference circle, projection, angular speed, phase constant).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isC = p => p.activity === 'circle';
const deg = r => r * 180 / Math.PI;

export const spec = {
  id: '15-2',
  course: '일반물리 I',
  chapter: 15,
  chapterTitle: 'Oscillations',
  module: '15.4',
  title: '진자와 원운동 (Pendulums, Circular Motion)',
  headerNote: '교재 Principles of Physics 12e · Module 15.4',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (isC(p) ? '돌림판 위 기준 입자 P′과 x축 위 투영 P' : p.kind === 'rod' ? '한쪽 끝을 축으로 흔들리는 막대 진자' : '줄에 매단 추의 흔들림'),

  assumptions: p => (isC(p) ? [
    'P′은 반지름 <i>x</i><sub>m</sub>인 기준 원 위를 각속력 <i>ω</i>로 돈다. 위에서 보면 시계 반대 방향이다',
    'P는 P′을 <i>x</i>축에 수직으로 내린 점이다',
    '<i>ϕ</i>는 <i>t</i> = 0일 때 P′의 각 위치이고 +<i>x</i>축에서 잰다',
  ] : [
    p.kind === 'rod' ? '막대는 고르고 한쪽 끝을 축으로 돈다. 질량중심까지 거리 <i>h</i> = <i>L</i>/2다' : '추를 입자로 보고 줄은 늘어나지 않으며 질량이 없다',
    '받침점 마찰과 공기 저항이 없다. <i>θ</i><sub>m</sub>에서 가만히 놓는다',
    '실제 주기는 sin <i>θ</i>를 그대로 둔 운동 방정식을 수치로 풀어 구했다 (교재 밖 값)',
    `재생은 ${M.RUN} s 동안이다. <i>g</i> = ${M.G} m/s²`,
  ]),

  equations: p => (isC(p) ? [
    { tex: 'x(t) = x_m\\cos(\\omega t + \\phi)', no: '15.4.13' },
    { tex: 'v(t) = -\\omega x_m\\sin(\\omega t + \\phi)', no: '15.4.14' },
    { tex: 'a(t) = -\\omega^2x_m\\cos(\\omega t + \\phi)', no: '15.4.15' },
    { tex: 'v = \\omega r', no: '10.3.2' },
    { tex: 'a_r = \\omega^2 r', no: '10.3.7' },
  ] : p.kind === 'rod' ? [
    { tex: '-h(mg\\sin\\theta) = I\\alpha' },
    { tex: 'I = \\tfrac{1}{3}mL^2', no: '15.4.7' },
    { tex: 'T = 2\\pi\\sqrt{I/mgh}', no: '15.4.6' },
    { tex: 'T = 2\\pi\\sqrt{2L/3g}', no: '15.4.10' },
  ] : [
    { tex: '\\tau = -L(F_g\\sin\\theta)', no: '15.4.1' },
    { tex: '-L(mg\\sin\\theta) = I\\alpha', no: '15.4.2' },
    { tex: 'T = 2\\pi\\sqrt{L/g}', no: '15.4.5' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isC(p)) {
      return [
        { id: 'ph', label: 'P′의 각 위치', value: (o, q, f) => `<i>ωt</i> + <i>ϕ</i> = ${f(((deg(o.phase) % 360) + 360) % 360, z)}°` },
        { id: 'x', label: 'P의 위치 (position)', value: (o, q, f) => `<i>x</i> = ${f(o.x * 100, z)} cm` },
        { id: 'v', label: 'P의 속도 (velocity)', value: show((o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s`) },
        { id: 'a', label: 'P의 가속도 (acceleration)', value: show((o, q, f) => `<i>a</i> = ${f(o.a, z)} m/s²`) },
      ];
    }
    return [
      { id: 'th', label: '각 (angle)', value: (o, q, f) => `<i>θ</i> = ${f(deg(o.theta), z)}°` },
      { id: 'om', label: '각의 변화율', value: (o, q, f) => `d<i>θ</i>/d<i>t</i> = ${f(o.omega, z)} rad/s` },
      { id: 'T0', label: '작은 각 근사 주기 (period)', value: show((o, q, f) => `<i>T</i> = ${f(o.T0)} s`) },
      { id: 'T', label: '실제 주기 (수치 풀이)', value: show((o, q, f) => `${f(o.T)} s`) },
    ];
  },

  belowNote: p => (isC(p)
    ? '파란 화살표는 속도, 분홍 화살표는 가속도다. 확인 뒤 P에도 두 화살표(P′ 화살표의 <i>x</i> 성분)를 그리고 뒤쪽 판에 P의 <i>x</i>–<i>t</i> 그래프를 그린다. 시점을 돌려 돌림판을 앞에서 수평으로 보면 P′이 P와 같은 <i>x</i>에서 움직인다.'
    : '주황 화살표는 중력의 접선 성분, 곧 되돌리는 힘 (restoring force) <i>F</i><sub>g</sub> sin <i>θ</i>다. 확인 뒤 같은 길이의 작은 각 근사 진자(반투명)를 함께 흔들고 오른쪽 판에 <i>θ</i>–<i>t</i> 그래프를 그린다. 실선은 실제 운동, 점선은 작은 각 근사다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 15 Oscillations, Module 15.4 Pendulums, Circular Motion, Learning Objective 15.4.1–15.4.7, 15.4.10–15.4.11. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
