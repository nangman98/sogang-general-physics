// 11.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c11에서 확인했다 (smooth rolling, rolling down a ramp, static frictional force, kinetic energy of
// rolling, rotational inertia).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '11-2',
  course: '일반물리 I',
  chapter: 11,
  chapterTitle: 'Rolling, Torque, and Angular Momentum',
  module: '11.2',
  title: '빗면 굴림 (Forces and Kinetic Energy of Rolling)',
  headerNote: '교재 Principles of Physics 12e · Module 11.2',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'single' ? '굴러 내려가는 물체에 작용하는 힘' : '빗면 굴림 경주'),

  assumptions: () => [
    `물체는 빗면 위 ${M.LEN} m를 정지 상태에서 미끄러지지 않고 굴러 내려간다`,
    '상자는 마찰 없이 미끄러진다 (비교용)',
    '공기 저항과 구름 저항은 없다',
    `<i>g</i> = ${M.G} m/s²`,
  ],

  equations: () => [
    { tex: 'K = \\tfrac{1}{2}I_{\\text{com}}\\omega^2 + \\tfrac{1}{2}Mv_{\\text{com}}^2', no: '11.2.3' },
    { tex: 'a_{\\text{com},x} = -\\dfrac{g\\sin\\theta}{1 + I_{\\text{com}}/MR^2}', no: '11.2.8' },
    { tex: 'f_s = -I_{\\text{com}}\\dfrac{a_{\\text{com},x}}{R^2}', no: '11.2.7' },
  ],

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (p.activity === 'single') {
      const r = () => M.roll(p.A, p.theta, p.M);
      return [
        { id: 'a', label: '질량중심 가속도', value: show((o, q, f) => `<i>a</i><sub>com</sub> = ${f(r().a)} m/s²`) },
        { id: 'f', label: '정지 마찰력 (static friction)', value: show((o, q, f) => `<i>f</i><sub>s</sub> = ${f(r().fs, z)} N`) },
        { id: 'v', label: '속력', value: (o, q, f) => `<i>v</i> = ${f(o.list[0].v, z)} m/s` },
      ];
    }
    return [
      { id: 'vA', label: 'A의 속력', value: (o, q, f) => `<i>v</i><sub>A</sub> = ${f(o.list[0].v, z)} m/s` },
      { id: 'vB', label: 'B의 속력', value: (o, q, f) => `<i>v</i><sub>B</sub> = ${f(o.list[1].v, z)} m/s` },
      { id: 'tA', label: 'A가 내려온 시간', value: (o, q, f) => (o.list[0].done ? `${f(o.list[0].t)} s` : '<small>내려가는 중</small>') },
      { id: 'tB', label: 'B가 내려온 시간', value: (o, q, f) => (o.list[1].done ? `${f(o.list[1].t)} s` : '<small>내려가는 중</small>') },
    ];
  },

  belowNote: p => (p.activity === 'single'
    ? '주황 화살표는 중력, 수직항력, 빗면 위쪽을 향한 정지 마찰력이다. 확인하면 분홍 가속도 화살표를 그린다. 정지 마찰력이 돌림힘을 주어 물체가 돈다.'
    : '질량이 축에서 멀리 퍼진 물체일수록 관성모멘트가 커서 같은 높이를 내려와도 회전에 쓰는 에너지가 많고 느리다. 물체 크기는 결과와 상관없어 같은 크기로 그렸다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 11 Rolling, Torque, and Angular Momentum, Module 11.2 Forces and Kinetic Energy of Rolling, Learning Objective 11.2.1–11.2.6. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
