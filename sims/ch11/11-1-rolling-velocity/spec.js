// 11.1 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c11에서 확인했다 (rolling, smooth rolling, translation, rotation, center of mass).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const NAMES = { top: '꼭대기', front: '앞쪽 끝', bottom: '바닥', upperFront: '앞쪽 위 45°' };

export const spec = {
  id: '11-1',
  course: '일반물리 I',
  chapter: 11,
  chapterTitle: 'Rolling, Torque, and Angular Momentum',
  module: '11.1',
  title: '구르는 바퀴 (Rolling as Translation and Rotation Combined)',
  headerNote: '교재 Principles of Physics 12e · Module 11.1',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: () => '미끄러지지 않고 구르는 바퀴 위 점의 속도',

  assumptions: () => [
    '바퀴는 미끄러지지 않고 매끄럽게 구른다 (smooth rolling)',
    '질량중심 속력 <i>v</i><sub>com</sub>이 일정하다',
    '바퀴는 +<i>x</i>(오른쪽)로 구른다',
  ],

  equations: () => [
    { tex: 'v_{\\text{com}} = \\omega R', no: '11.1.2' },
    { tex: '\\vec v = \\vec v_{\\text{com}} + \\vec v_{\\text{rot}}' },
  ],

  readouts: p => [
    { id: 'v', label: '질량중심 속력', value: (o, q, f) => `<i>v</i><sub>com</sub> = ${f(q.v)} m/s` },
    { id: 'w', label: '각속력 (angular speed)', value: (o, q, f) => `<i>ω</i> = ${f(q.v / q.R)} rad/s` },
    { id: 's', label: `${NAMES[p.pt]} 점의 속력`, value: (o, q, f) => (ui.revealed ? `${f(M.pointSpeed(q.v, M.POINTS[q.pt]), { zero: 1e-9 })} m/s` : hidden) },
  ],

  belowNote: p => `파란 화살표는 지금 꼭대기, 앞쪽, 바닥, 뒤쪽에 있는 점의 속도다 (1 m/s당 0.5 m). 물은 점은 고리로 표시했다.${p.split ? ' 연한 화살표 둘은 병진 속도 <i>v</i><sub>com</sub>과 회전 속도 <i>ωR</i>이고 그 합이 진한 화살표다.' : ''} 주황 점은 바퀴 테의 한 점이다. 확인하면 그 점이 그리는 경로(사이클로이드)를 점선으로 그린다.`,

  objectives: '교재 Principles of Physics 12e, Chapter 11 Rolling, Torque, and Angular Momentum, Module 11.1 Rolling as Translation and Rotation Combined, Learning Objective 11.1.1–11.1.2. 식 번호는 교재 번호다.',
};
