// 2.5 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 괄호 영어는 교재 c02에서 확인했다 (free-fall acceleration, initial velocity, height, maximum height, highest point,
// ascent, descent, position, velocity, speed, acceleration). 교재는 자유 낙하 식에 따로 번호를 붙이지 않고
// Table 2.4.1의 식을 y와 a = −g로 바꿔 쓴다(Sample Problem 2.5.1). 그래서 식 번호 칸에는 Table 2.4.1 번호를 적는다.
import { fmt, texNum as N } from '../../../core/format.js';
import * as M from './model.js';

const P = x => (x < 0 ? `(${N(x)})` : N(x));
const lines = (...r) => `\\begin{aligned}${r[0]}${r.slice(1).map(x => `\\\\ &= ${x}`).join('')}\\end{aligned}`;
const z = { zero: 1e-9 };
const NOTE = { html: '<small class="missing">Table 2.4.1의 식에서 <i>x</i> → <i>y</i>, <i>a</i> → −<i>g</i>로 바꿔 쓴다</small>' };

export const spec = {
  id: '2-3',
  course: '일반물리 I',
  chapter: 2,
  chapterTitle: 'Motion Along a Straight Line',
  module: '2.5',
  title: '자유 낙하 가속도 (Free-Fall Acceleration)',
  headerNote: '교재 Principles of Physics 12e · Module 2.5',
  dt: 1 / 240,
  sceneTitle: p => ({ throw: '위로 던진 공과 같은 시간 간격 잔상', top: '최고점 (highest point)에서 <i>v</i>와 <i>a</i>', sym: '올라갈 때 (ascent)와 내려올 때 (descent)' }[p.activity]),

  assumptions: [
    '+<i>y</i> 방향은 위다. 던진 점이 <i>y</i> = 0이고 땅은 <i>y</i> = −<i>h</i>다',
    '공기의 영향은 무시한다',
    '<i>a</i> = −<i>g</i>이고 <i>g</i> = 9.8 m/s²이다',
    '공은 옥상 가장자리 바로 바깥에서 던진다',
    '공 크기는 실제 비율이 아니다',
  ],

  equations: p => {
    if (p.activity === 'top') {
      return [
        NOTE,
        { no: '2.4.1', tex: 'v = v_0 - gt' },
        { tex: 'v = 0 \\;\\Rightarrow\\; t = \\frac{v_0}{g}', live: (o, q) => lines('v = 0 \\;\\Rightarrow\\; t &= \\frac{v_0}{g}', `\\frac{${N(q.v0)}}{9.8}`, `${N(o.tTop)}\\ \\mathrm{s}`) },
        { no: '2.4.6', tex: 'v^2 = v_0^2 - 2g(y - y_0)' },
        { tex: 'v = 0 \\;\\Rightarrow\\; y - y_0 = \\frac{v_0^2}{2g}', live: (o, q) => lines('v = 0 \\;\\Rightarrow\\; y - y_0 &= \\frac{v_0^2}{2g}', `\\frac{${P(q.v0)}^2}{2(9.8)}`, `${N(o.yMax)}\\ \\mathrm{m}`) },
      ];
    }
    if (p.activity === 'sym') {
      return [
        NOTE,
        { no: '2.4.5', tex: 'y - y_0 = v_0 t - \\tfrac{1}{2}gt^2' },
        { tex: 't = \\frac{v_0 \\mp \\sqrt{v_0^2 - 2g(y - y_0)}}{g}', live: (o, q) => { const s = M.symmetry(q.v0, q.yp).passes; return s.length === 2 ? `t = ${N(s[0].t)}\\ \\mathrm{s},\\ ${N(s[1].t)}\\ \\mathrm{s}` : `t = ${N(s[0]?.t ?? 0)}\\ \\mathrm{s}`; } },
        { no: '2.4.6', tex: 'v^2 = v_0^2 - 2g(y - y_0)' },
        { tex: 'v = \\pm\\sqrt{v_0^2 - 2g(y - y_0)}', live: (o, q) => { const s = M.symmetry(q.v0, q.yp).passes; return `v = ${s.map(x => N(x.v)).join(',\\ ')}\\ \\mathrm{m/s}`; } },
      ];
    }
    return [
      NOTE,
      { no: '2.4.5', tex: 'y - y_0 = v_0 t - \\tfrac{1}{2}gt^2', live: (o, q) => lines('y - y_0 &= v_0 t - \\tfrac{1}{2}gt^2', `${P(q.v0)}(${N(o.t)}) - \\tfrac{1}{2}(9.8)(${N(o.t)})^2`, `${N(o.y)}\\ \\mathrm{m}`) },
      { no: '2.4.1', tex: 'v = v_0 - gt', live: (o, q) => lines('v &= v_0 - gt', `${N(q.v0)} - (9.8)(${N(o.t)})`, `${N(o.v)}\\ \\mathrm{m/s}`) },
      { no: '2.4.6', tex: 'v^2 = v_0^2 - 2g(y - y_0)', live: (o, q) => lines('v^2 &= v_0^2 - 2g(y - y_0)', `${P(q.v0)}^2 - 2(9.8)(${N(o.y)})`, `${N(o.v * o.v)}\\ \\mathrm{m^2/s^2}`) },
    ];
  },

  readouts: p => [
    { id: 'y', label: '위치 (position)', value: (o, _, f) => `<i>y</i> = ${f(o.y, z)} m` },
    { id: 'v', label: '속도 (velocity)', value: (o, _, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
    p.activity === 'sym'
      ? { id: 'speed', label: '속력 (speed)', value: (o, _, f) => `|<i>v</i>| = ${f(o.speed, z)} m/s` }
      : { id: 'a', label: '가속도 (acceleration)', value: (o, _, f) => `<i>a</i> = ${f(o.a, z)} m/s²` },
    { id: 'top', label: '최고 높이 (maximum height)', value: (o, _, f) => `<i>y</i> = ${f(o.yMax, z)} m` },
  ],

  belowNote: p => {
    if (p.activity === 'top') return '최고점에서 공은 잠깐 멈춘다. 재생하기 전에 그 순간의 <i>v</i>와 <i>a</i>를 고른다. 오른쪽 <i>v</i>–<i>t</i> 판은 재생하는 동안 그려진다.';
    if (p.activity === 'sym') return '공은 같은 높이를 올라가며 한 번, 내려오며 한 번 지난다. 비교할 높이 <i>y</i>를 옮겨 두 순간을 비교한다.';
    const step = M.ghostStep(p.v0);
    return `잔상은 ${fmt(step)} s마다 남긴다. 올라갈 때 잔상은 공, 내려올 때 잔상은 고리 모양이다. ${p.v0 > 0 ? '간격이 줄었다가 최고점을 지나 다시 늘어난다. ' : '아래로 던지면 올라가는 구간이 없다. '}<i>y</i>–<i>t</i> 판의 세로 눈금은 공의 높이와 같은 축척이다.`;
  },

  objectives: '교재 Principles of Physics 12e, Chapter 2 Motion Along a Straight Line, Module 2.5 Free-Fall Acceleration, Learning Objectives 2.5.1–2.5.2. 식은 Table 2.4.1의 식을 <i>y</i>와 <i>a</i> = −<i>g</i>로 바꿔 쓴 것이고 식 번호는 Table 2.4.1의 번호다. 화면의 문제는 교재 문제를 옮기지 않았다.',
};
