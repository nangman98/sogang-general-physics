// 5.1–5.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c05에서 확인했다 (net force, free-body diagram, gravitational force, normal force,
// frictional force, tension, frictionless, particle, speed, velocity, Newton's First Law).
import { tex } from '../../../core/math.js';
import { fmt } from '../../../core/format.js';
import * as M from './model.js';

// Prediction state shared with view.js. Net force, normal force and acceleration stay hidden until "확인".
export const ui = { revealed: false, activity: 'sum' };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '5-1',
  course: '일반물리 I',
  chapter: 5,
  chapterTitle: 'Force and Motion—I',
  module: '5.1–5.2',
  title: '알짜힘과 자유물체도 (Newton’s First and Second Laws · Some Particular Forces)',
  headerNote: '교재 Principles of Physics 12e · Module 5.1, 5.2',
  dt: 1 / 240,
  sceneTitle: p => ({ sum: '수평 힘의 합 (net force)', fbd: '줄로 끄는 상자와 자유물체도 (free-body diagram)' }[p.activity]),

  assumptions: p => (p.activity === 'sum'
    ? [
      '마찰 없는 수평면 (frictionless surface)',
      '상자는 입자 (particle)로 보고 힘의 꼬리를 상자 가운데에 둔다',
      '상자는 처음에 정지해 있다',
      `${tex('\\vec F_1')}, ${tex('\\vec F_2')}, ${tex('\\vec F_3')}는 수평이고 일정하다`,
      `${tex('\\vec F_g')}와 ${tex('\\vec F_N')}은 연직이고 서로 비긴다. 둘은 자유물체도에 그렸다`,
    ]
    : [
      `상자는 +<i>x</i> 방향으로 미끄러지는 중이다. 처음 속도 <i>v</i><sub>0</sub> = ${M.V0.toFixed(2)} m/s`,
      `마찰력 (frictional force) ${tex('\\vec f')}는 면에 나란하고 미끄러짐 반대 방향이다. 크기는 일정하다`,
      '상자는 바닥에서 뜨지 않는다 (<i>a<sub>y</sub></i> = 0)',
      '상자는 입자 (particle)로 본다',
      `<i>g</i> = ${M.G} m/s²`,
      '상자가 멈추면 재생이 끝난다',
    ]),

  equations: p => {
    if (p.activity === 'sum') {
      const q = M.problemOf(p), three = q.forces.length === 3;
      return [
        { tex: '\\vec F_{\\mathrm{net}} = m\\vec a', no: '5.1.1' },
        three ? { tex: '\\vec F_1 + \\vec F_2 + \\vec F_3 = m\\vec a', no: '5.1.6' } : { tex: '\\vec F_1 + \\vec F_2 = m\\vec a' },
        { tex: '\\begin{aligned}F_{\\mathrm{net},x} &= ma_x\\\\ F_{\\mathrm{net},y} &= ma_y\\\\ F_{\\mathrm{net},z} &= ma_z\\end{aligned}', no: '5.1.2' },
        { tex: 'F_N = mg', no: '5.2.7' },
      ];
    }
    return [
      { tex: 'F_g = mg', no: '5.2.1' },
      { tex: '\\begin{aligned}F_{\\mathrm{net},x} &= ma_x\\\\ F_{\\mathrm{net},y} &= ma_y\\end{aligned}', no: '5.1.2' },
      { tex: 'T\\cos\\theta - f = ma_x' },
      { tex: 'F_N + T\\sin\\theta - F_g = m(0)' },
    ];
  },

  readouts: p => {
    if (p.activity === 'sum') {
      return [
        { id: 'm', label: '질량 (mass)', value: (o, q, f) => `<i>m</i> = ${f(M.problemOf(q).m)} kg` },
        { id: 'Fnet', label: '알짜힘 (net force)', value: (o, q, f) => (ui.revealed ? `<i>F</i><sub>net</sub> = ${f(M.problemOf(q).FnetMag, z)} N` : hidden) },
        { id: 'a', label: '가속도 (acceleration)', value: (o, q, f) => (ui.revealed ? `<i>a</i> = ${f(M.problemOf(q).aMag, z)} m/s²` : hidden) },
        { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.speed, z)} m/s` },
      ];
    }
    return [
      { id: 'Fg', label: '중력 (gravitational force)', value: (o, q, f) => `<i>F<sub>g</sub></i> = ${f(M.pulled(q).Fg)} N` },
      { id: 'FN', label: '수직항력 (normal force)', value: (o, q, f) => (ui.revealed ? `<i>F<sub>N</sub></i> = ${f(M.pulled(q).FN, z)} N` : hidden) },
      { id: 'a', label: '가속도 (acceleration)', value: (o, q, f) => (ui.revealed ? `<i>a<sub>x</sub></i> = ${f(o.a[0], z)} m/s²` : hidden) },
      { id: 'v', label: '속도 (velocity)와 위치 (position)', value: (o, q, f) => `<i>v<sub>x</sub></i> = ${f(o.v[0], z)} m/s<br><i>x</i> = ${f(o.r[0], z)} m` },
    ];
  },

  belowNote: p => ({
    sum: '회색 화살표를 돌려 가속도 방향을 고르고 크기를 적은 뒤 확인한다. 확인하면 힘을 꼬리에서 머리로 이은 합과 알짜힘 (net force), 가속도가 나타난다. 화살표 길이는 힘 1 m = 4 N (자유물체도는 1 m = 8 N), 가속도 1 m = 8 m/s²이다. 재생하면 멈출 때까지 움직이고, 상자는 가운데에 두고 바닥 격자가 흐른다.',
    fbd: `오른쪽 위 자유물체도 (free-body diagram)는 상자를 점으로 보고 상자에 작용하는 힘만 그렸다. 점선은 ${tex('\\vec T')}의 <i>x</i>, <i>y</i> 성분이다. 확인 전에는 구할 힘 ${tex('\\vec F_N')}을 회색 고정 길이로 그린다. 화살표 길이는 힘 1 m = ${fmt(1 / M.fbdScales(p).F)} N, 가속도 1 m = ${fmt(1 / M.fbdScales(p).a)} m/s²이다. 재생하면 멈출 때까지 움직이고, 상자는 제자리에 두고 측정대 눈금이 흐른다.`,
  }[p.activity]),

  objectives: '교재 Principles of Physics 12e, Chapter 5 Force and Motion—I. Module 5.1 (Learning Objectives 5.1.1, 5.1.2, 5.1.3, 5.1.6), Module 5.2 (5.2.1, 5.2.4, 5.2.5, 5.2.6). 식 번호는 교재 번호다. 화면의 문제는 교재 문제를 옮기지 않았다.',
};
