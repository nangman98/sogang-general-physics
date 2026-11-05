// 7.6 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c07에서 확인했다 (power, average power, instantaneous power, watt, rate of doing work).
import { fmt } from '../../../core/format.js';
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '7-3',
  course: '일반물리 I',
  chapter: 7,
  chapterTitle: 'Kinetic Energy and Work',
  module: '7.6',
  title: '일률 (Power)',
  headerNote: '교재 Principles of Physics 12e · Module 7.6',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'two' ? '두 힘의 일률과 알짜 일률' : '힘이 일을 하는 빠르기'),

  assumptions: p => [
    '바닥에 마찰이 없다',
    '힘의 크기와 방향은 그대로다',
    '상자는 +<i>x</i> 방향으로 움직인다',
    p.activity === 'two' ? '<i>F</i><sub>1</sub>은 운동과 반대 방향 (<i>φ</i><sub>1</sub> = 180°)이다' : `${M.RUN} s 동안 재생한다`,
    '상자가 멈추면 재생을 끝낸다',
  ],

  equations: () => [
    { tex: 'P_{\\text{avg}} = \\dfrac{W}{\\Delta t}', no: '7.6.1' },
    { tex: 'P = \\dfrac{dW}{dt}', no: '7.6.2' },
    { tex: 'P = Fv\\cos\\phi', no: '7.6.6' },
    { tex: 'P = \\vec F\\cdot\\vec v', no: '7.6.7' },
  ],

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (p.activity === 'two') {
      return [
        { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
        { id: 'P1', label: '<i>F</i><sub>1</sub>의 일률', value: show((o, q, f) => `<i>P</i><sub>1</sub> = ${f(o.P1, z)} W`) },
        { id: 'P2', label: '<i>F</i><sub>2</sub>의 일률', value: show((o, q, f) => `<i>P</i><sub>2</sub> = ${f(o.P2, z)} W`) },
        { id: 'Pn', label: '알짜 일률', value: show((o, q, f) => `<i>P</i><sub>net</sub> = ${f(o.Pnet, { zero: 1e-6 })} W`) },
      ];
    }
    return [
      { id: 't', label: '시간 (time)', value: (o, q, f) => `<i>t</i> = ${f(o.t, z)} s` },
      { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
      { id: 'P', label: '일률 (power)', value: show((o, q, f) => `<i>P</i> = ${f(o.P, z)} W`) },
      { id: 'W', label: '지금까지 한 일 (work)', value: show((o, q, f) => `<i>W</i> = ${f(o.W, z)} J`) },
    ];
  },

  belowNote: p => `카메라가 상자를 따라간다. 바닥 눈금은 1 m 간격이다. 뒤 왼쪽 그래프 판은 힘이 한 일 <i>W</i>–<i>t</i>, 오른쪽은 일률 <i>P</i>–<i>t</i>다. <i>P</i>는 <i>W</i>–<i>t</i> 곡선의 기울기다. 힘 화살표는 1 m = ${fmt(1 / forceScale(p))} N, 속도 화살표는 1 m/s당 0.4 m다.`,

  objectives: '교재 Principles of Physics 12e, Chapter 7 Kinetic Energy and Work, Module 7.6 Power, Learning Objective 7.6.1–7.6.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};

// Force arrows: the largest force (weight included) is 1.6 m long.
export function forceScale(p) {
  const s = M.setup(p);
  const forces = p.activity === 'two' ? [p.F1, p.F2, p.m * M.G, s.FN] : [p.F, p.m * M.G, s.FN];
  return 1.6 / Math.max(...forces, 1e-9);
}
