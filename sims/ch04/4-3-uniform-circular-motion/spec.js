// 4.5 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c04에서 확인했다 (uniform circular motion, centripetal acceleration, period, radius, speed,
// center, counterclockwise, clockwise, particle).
import { unitVec, texNum as N } from '../../../core/format.js';
import { tex } from '../../../core/math.js';

// Shared with view.js: the current questions and what has been revealed (readouts read this).
export const ui = { dq: null, dshown: { v: false, a: false }, sq: null, sphase: 'before', sdone: false };

export const SCALE = { v: 0.5, a: 0.5 };          // arrow length per m/s (s) and per m/s² (s²)

const z = { zero: 1e-9 };
const vec = s => tex(`\\vec ${s}`);
const lines = (...r) => `\\begin{aligned}${r[0]}${r.slice(1).map(x => `\\\\ &= ${x}`).join('')}\\end{aligned}`;
const hidden = '<span class="wait">고른 뒤 보인다</span>';

// Size-question state now shown on the stage: before the answer, or after for a ratio question.
export const sizeState = () => (ui.sq ? (ui.sphase === 'after' && ui.sq.after ? ui.sq.after : ui.sq.before) : null);

export const spec = {
  id: '4-3',
  course: '일반물리 I',
  chapter: 4,
  chapterTitle: 'Motion in Two and Three Dimensions',
  module: '4.5',
  title: '등속 원운동 (Uniform Circular Motion)',
  headerNote: '교재 Principles of Physics 12e · Module 4.5',
  dt: 1 / 120,
  runIf: p => p.activity !== 'direction',
  timeIf: p => p.activity !== 'direction',
  sceneTitle: p => ({ watch: '속도와 구심 가속도', direction: '속도와 가속도의 방향', size: '구심 가속도의 크기' }[p.activity]),

  assumptions: p => ({
    watch: [
      '자동차는 입자 (particle)로 본다. 위치는 자동차 가운데다',
      '속력 (speed)이 일정한 등속 원운동 (uniform circular motion)이다',
      '위에서 보아 시계 반대 방향 (counterclockwise)으로 돈다',
      `화살표 길이는 속도 1 m/s당 ${SCALE.v} m, 가속도 1 m/s²당 ${SCALE.a} m다`,
      '가속도를 만드는 힘은 다루지 않는다',
    ],
    direction: ['자동차는 속력이 일정하게 원을 돈다', '회색 화살표 넷은 트랙 면 위에 있다', '자동차 앞쪽과 가운데 곡선 화살표가 도는 방향이다'],
    size: ['속력이 일정한 등속 원운동이다', '값은 2% 안이면 맞다', '배수는 ¼, ½, 1, 2, 4 가운데 고른다'],
  }[p.activity]),

  equations: p => {
    if (p.activity === 'watch') {
      return [
        { no: '4.5.1', tex: 'a = \\dfrac{v^2}{r}', live: o => lines('a &= \\dfrac{v^2}{r}', `\\dfrac{(${N(o.v)}\\ \\mathrm{m/s})^2}{${N(o.r)}\\ \\mathrm{m}}`, `${N(o.a)}\\ \\mathrm{m/s^2}`) },
        { no: '4.5.2', tex: 'T = \\dfrac{2\\pi r}{v}', live: o => lines('T &= \\dfrac{2\\pi r}{v}', `\\dfrac{2\\pi(${N(o.r)}\\ \\mathrm{m})}{${N(o.v)}\\ \\mathrm{m/s}}`, `${N(o.T)}\\ \\mathrm{s}`) },
      ];
    }
    const eqs = [{ no: '4.5.1', tex: 'a = \\dfrac{v^2}{r}' }, { no: '4.5.2', tex: 'T = \\dfrac{2\\pi r}{v}' }];
    if (p.activity === 'size') eqs.push({ tex: 'a = \\dfrac{2\\pi v}{T} = \\dfrac{4\\pi^2 r}{T^2}' });
    return eqs;
  },

  readouts: p => {
    if (p.activity === 'direction') {
      return [
        { id: 'dpos', label: '위치 (position)', value: () => (ui.dq ? `${vec('r')} =<br>${unitVec(ui.dq.state.position, 'm', z)}` : '') },
        { id: 'ddir', label: '도는 방향', value: () => (ui.dq ? (ui.dq.dir > 0 ? '시계 반대 방향 (counterclockwise)' : '시계 방향 (clockwise)') : '') },
        { id: 'dv', label: '속도 (velocity)', value: () => (ui.dshown.v ? `${vec('v')} =<br>${unitVec(ui.dq.state.velocity, 'm/s', z)}` : hidden) },
        { id: 'da', label: '구심 가속도 (centripetal acceleration)', value: () => (ui.dshown.a ? `${vec('a')} =<br>${unitVec(ui.dq.state.acceleration, 'm/s²', z)}` : hidden) },
      ];
    }
    if (p.activity === 'size') {
      const q = () => ui.sq, s = () => sizeState();
      // Before the answer, hide the asked quantity and, for a period-given question, the speed.
      const showA = () => ui.sdone || (q() && (q().type === 'ratio' || q().ask !== 'a'));
      const showT = () => ui.sdone || (q() && !(q().type === 'value' && q().ask === 'T'));
      return [
        { id: 'sr', label: '반지름 (radius)', value: (o, _, f) => (s() ? `<i>r</i> = ${f(s().r)} m` : '') },
        { id: 'sv', label: '속력 (speed)', value: (o, _, f) => (s() ? (q().givenT && !ui.sdone ? hidden : `<i>v</i> = ${f(s().v)} m/s`) : '') },
        { id: 'sa', label: '구심 가속도 (centripetal acceleration)', value: (o, _, f) => (s() ? (showA() ? `<i>a</i> = ${f(s().a)} m/s²` : hidden) : '') },
        { id: 'sT', label: '주기 (period)', value: (o, _, f) => (s() ? (showT() ? `<i>T</i> = ${f(s().T)} s` : hidden) : '') },
      ];
    }
    return [
      { id: 'v', label: '속도 (velocity)', value: (o, _, f) => `${vec('v')} =<br>${unitVec(o.velocity, 'm/s', z)}` },
      { id: 'a', label: '구심 가속도 (centripetal acceleration)', value: (o, _, f) => `${vec('a')} =<br>${unitVec(o.acceleration, 'm/s²', z)}` },
      { id: 'ang', label: `${vec('v')}와 ${vec('a')} 사이 각`, value: (o, _, f) => `${f(o.angle)}°<br><small><i>v</i> = ${f(o.v)} m/s, <i>a</i> = ${f(o.a)} m/s²</small>` },
      { id: 'T', label: '주기 (period)', value: (o, _, f) => `<i>T</i> = ${f(o.T)} s` },
    ];
  },

  belowNote: p => ({
    watch: `속도는 늘 원의 접선 방향이고 구심 가속도는 늘 원의 중심 (center)을 향한다. 둘의 크기는 변하지 않고 방향만 바뀐다. 속력이 일정해도 속도의 방향이 바뀌므로 가속도가 있다.`,
    direction: '회색 화살표 ①–④는 자동차 위에서 나온다. 속도를 확인하면 가속도 문제가 이어진다.',
    size: '값 문제는 숫자를 넣고, 배수 문제는 고른다. 확인하면 장면이 바꾼 조건으로 달린다.',
  }[p.activity]),

  objectives: '교재 Principles of Physics 12e, Chapter 4 Motion in Two and Three Dimensions, Module 4.5 Uniform Circular Motion, Learning Objectives 4.5.1–4.5.2. 식 번호는 교재 번호다. 화면의 문제는 교재 문제를 옮기지 않았다.',
};
