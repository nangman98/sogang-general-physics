// 4.2–4.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c04에서 확인했다 (path, time interval, displacement, average velocity, instantaneous velocity,
// average acceleration, instantaneous acceleration, change in velocity, tangent, constant acceleration, particle).
import { unitVec, texNum as N } from '../../../core/format.js';
import { tex } from '../../../core/math.js';

// Shared with view.js: what the prediction activity has revealed so far (readouts hide v and a until then).
export const ui = { q: null, shown: { v: false, a: false } };

export const SCALE = { v: 1.0, a: 1.5 };          // arrow length per m/s (s) and per m/s² (s²)

const z = { zero: 1e-9 };
const vec = (s, sub = '') => tex(`\\vec ${s}${sub}`);
const T3 = v => `(${v.map(x => N(x)).join(',\\ ')})`;
const lines = (...r) => `\\begin{aligned}${r[0]}${r.slice(1).map(x => `\\\\ &= ${x}`).join('')}\\end{aligned}`;
const deg = (a, f) => `${f(a, { sig: 3, zero: 1e-6 })}°`;

export const spec = {
  id: '4-1',
  course: '일반물리 I',
  chapter: 4,
  chapterTitle: 'Motion in Two and Three Dimensions',
  module: '4.2–4.3',
  title: '평균·순간 속도와 가속도 (Average Velocity and Instantaneous Velocity · Average Acceleration and Instantaneous Acceleration)',
  headerNote: '교재 Principles of Physics 12e · Module 4.2, 4.3',
  dt: 1 / 120,
  runIf: p => p.activity !== 'predict',
  timeIf: p => p.activity !== 'predict',
  sceneTitle: p => ({ vel: '평균 속도에서 순간 속도로', acc: '평균 가속도에서 순간 가속도로', predict: '속도와 가속도의 방향' }[p.activity]),

  assumptions: p => (p.activity === 'predict'
    ? ['드론은 입자 (particle)로 본다', '고르기 전에는 속도·가속도 화살표를 그리지 않는다', '회색 화살표 넷 가운데 하나가 정답이다']
    : [
      '드론은 입자 (particle)로 본다. 위치는 드론 가운데다',
      `경로 (path)는 시간의 식 ${tex('\\vec r(t)')}로 정해져 있고 ${vec('v')}와 ${vec('a')}는 그 식의 도함수다`,
      `화살표 길이는 속도 1 m/s당 ${SCALE.v} m, 가속도 1 m/s²당 ${SCALE.a} m다`,
      '드론 크기는 실제 비율이 아니다',
    ]),

  equations: p => {
    if (p.activity === 'acc') {
      return [
        { no: '4.3.1', tex: '\\vec a_{\\mathrm{avg}} = \\dfrac{\\vec v_2 - \\vec v_1}{\\Delta t} = \\dfrac{\\Delta \\vec v}{\\Delta t}',
          live: (o, q) => lines('\\vec a_{\\mathrm{avg}} &= \\dfrac{\\Delta \\vec v}{\\Delta t}', `\\dfrac{${T3(o.dv)}\\ \\mathrm{m/s}}{${N(q.dt)}\\ \\mathrm{s}}`, `${T3(o.aavg)}\\ \\mathrm{m/s^2}`) },
        { no: '4.3.2', tex: '\\vec a = \\dfrac{d\\vec v}{dt}' },
        { no: '4.3.3', tex: '\\vec a = a_x\\hat{\\mathrm i} + a_y\\hat{\\mathrm j} + a_z\\hat{\\mathrm k}' },
      ];
    }
    const base = [
      { no: '4.2.3', tex: '\\vec v = \\dfrac{d\\vec r}{dt}' },
      { no: '4.2.4', tex: '\\vec v = v_x\\hat{\\mathrm i} + v_y\\hat{\\mathrm j} + v_z\\hat{\\mathrm k}' },
    ];
    if (p.activity === 'predict') return [...base, { no: '4.3.2', tex: '\\vec a = \\dfrac{d\\vec v}{dt}' }];
    return [
      { no: '4.1.2', tex: '\\Delta \\vec r = \\vec r_2 - \\vec r_1' },
      { no: '4.2.1', tex: '\\vec v_{\\mathrm{avg}} = \\dfrac{\\Delta \\vec r}{\\Delta t}',
        live: (o, q) => lines('\\vec v_{\\mathrm{avg}} &= \\dfrac{\\Delta \\vec r}{\\Delta t}', `\\dfrac{${T3(o.dr)}\\ \\mathrm{m}}{${N(q.dt)}\\ \\mathrm{s}}`, `${T3(o.vavg)}\\ \\mathrm{m/s}`) },
      ...base,
    ];
  },

  readouts: p => {
    if (p.activity === 'predict') {
      const hidden = '<span class="wait">고른 뒤 보인다</span>';
      return [
        { id: 'pt', label: '점 P의 시각 (time)', value: (o, _, f) => `<i>t</i> = ${f(ui.q?.t ?? 0)} s` },
        { id: 'pr', label: '점 P의 위치 (position)', value: (o, _, f) => `${vec('r')} =<br>${unitVec(ui.q?.r ?? [0, 0, 0], 'm', z)}` },
        { id: 'pv', label: '속도 (velocity)', value: (o, _, f) => (ui.shown.v ? `${vec('v')} =<br>${unitVec(ui.q.v, 'm/s', z)}` : hidden) },
        { id: 'pa', label: '가속도 (acceleration)', value: (o, _, f) => (ui.shown.a ? `${vec('a')} =<br>${unitVec(ui.q.a, 'm/s²', z)}` : hidden) },
      ];
    }
    if (p.activity === 'acc') {
      return [
        { id: 'dv', label: '속도 변화 (change in velocity)', value: o => `${tex('\\Delta\\vec v')} =<br>${unitVec(o.dv, 'm/s', z)}` },
        { id: 'aavg', label: '평균 가속도 (average acceleration)', value: o => `${vec('a', '_{\\mathrm{avg}}')} =<br>${unitVec(o.aavg, 'm/s²', z)}` },
        { id: 'a', label: '순간 가속도 (instantaneous acceleration)', value: o => `${vec('a')} =<br>${unitVec(o.a1, 'm/s²', z)}` },
        { id: 'ang', label: `${vec('a', '_{\\mathrm{avg}}')}와 ${vec('a')} 사이 각`, value: (o, _, f) => (Number.isFinite(o.angleA) ? deg(o.angleA, f) : '0°') },
      ];
    }
    return [
      { id: 'dr', label: '변위 (displacement)', value: o => `${tex('\\Delta\\vec r')} =<br>${unitVec(o.dr, 'm', z)}` },
      { id: 'vavg', label: '평균 속도 (average velocity)', value: o => `${vec('v', '_{\\mathrm{avg}}')} =<br>${unitVec(o.vavg, 'm/s', z)}` },
      { id: 'v', label: '순간 속도 (instantaneous velocity)', value: o => `${vec('v')} =<br>${unitVec(o.v1, 'm/s', z)}` },
      { id: 'ang', label: `${vec('v', '_{\\mathrm{avg}}')}와 ${vec('v')} 사이 각`, value: (o, _, f) => deg(o.angleV, f) },
    ];
  },

  belowNote: p => ({
    vel: `점 1은 시각 <i>t</i>, 점 2는 <i>t</i> + Δ<i>t</i>의 위치다. 평균 속도는 변위 ${tex('\\Delta\\vec r')}와 방향이 같다. Δ<i>t</i>를 줄이면 점 2가 점 1로 다가가고 평균 속도는 경로의 접선 (tangent) 방향인 순간 속도가 된다.`,
    acc: `점 1과 점 2의 속도를 꼬리끼리 모아 빼면 속도 변화 ${tex('\\Delta\\vec v')}다. 평균 가속도는 ${tex('\\Delta\\vec v')}와 방향이 같다. 속력이 같아도 방향이 바뀌면 가속도가 있다.`,
    predict: '회색 화살표 ①–④는 점 P에서 나온다. 장면을 돌려 보며 고른다. 속도를 확인하면 가속도 문제가 이어진다.',
  }[p.activity]),

  objectives: '교재 Principles of Physics 12e, Chapter 4 Motion in Two and Three Dimensions, Module 4.2 Average Velocity and Instantaneous Velocity (Learning Objectives 4.2.1–4.2.3)와 Module 4.3 Average Acceleration and Instantaneous Acceleration (Learning Objectives 4.3.1–4.3.3). 식 번호는 교재 번호다. 경로는 화면에서 정한 것이고 교재 문제를 옮기지 않았다.',
};
