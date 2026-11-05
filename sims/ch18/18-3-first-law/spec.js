// 18.5 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c18에서 확인했다 (first law of thermodynamics, work, heat, internal energy, p-V diagram,
// thermal reservoir, constant-volume process, cyclical process, closed cycle, path dependent).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isC = p => p.activity === 'cycle';
export const pathName = p => (isC(p) ? p.dir.split('').join(' → ') : p.path === 'line' ? 'if (직선)' : 'ibf');

export const spec = {
  id: '18-3',
  course: '일반물리 I',
  chapter: 18,
  chapterTitle: 'Temperature, Heat, and the First Law of Thermodynamics',
  module: '18.5',
  title: '열역학 제1법칙 (The First Law of Thermodynamics)',
  headerNote: '교재 Principles of Physics 12e · Module 18.5',
  dt: 1 / 240,
  speed: 1,
  timeIf: () => false,
  sceneTitle: p => (isC(p) ? '닫힌 순환 (closed cycle)' : `기준 경로 iaf와 경로 ${pathName(p)}`),

  assumptions: () => [
    '실린더 속 기체는 단원자 이상 기체이고 과정은 느려서 기체가 늘 평형이다',
    '벽은 단열되어 있고 열은 바닥의 열저장체 (thermal reservoir)와만 주고받는다',
    '압력은 kPa, 부피는 L로 쓴다. 1 kPa·L = 1 J이다',
    '<i>W</i>는 기체가 한 일, <i>Q</i>는 기체가 받은 열이다. 기체가 열을 잃으면 <i>Q</i> &lt; 0이다',
    '재생은 상태가 경로를 따라가는 순서만 보여 주고 실제 시간이 아니다',
  ],

  equations: p => (isC(p) ? [
    { tex: 'W = \\int p\\,dV', no: '18.5.2' },
    { tex: '\\Delta E_{\\text{int}} = Q - W', no: '18.5.3' },
    { tex: '\\Delta E_{\\text{int}} = 0,\\ Q = W', no: '18.5.7' },
  ] : [
    { tex: 'W = \\int_{V_i}^{V_f} p\\,dV', no: '18.5.2' },
    { tex: '\\Delta E_{\\text{int}} = Q - W', no: '18.5.3' },
    { tex: '\\Delta E_{\\text{int}} = Q\\ \\ (W = 0)', no: '18.5.6' },
  ]),

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'pV', label: '압력과 부피 (pressure, volume)', value: (o, q, f) => `<i>p</i> = ${f(o.p)} kPa, <i>V</i> = ${f(o.V)} L` },
      { id: 'W', label: '기체가 한 일 (work)', value: show((o, q, f) => `<i>W</i> = ${f(o.W, z)} J`) },
      { id: 'Q', label: '기체가 받은 열 (heat)', value: show((o, q, f) => `<i>Q</i> = ${f(o.Q, z)} J`) },
      { id: 'dE', label: '내부 에너지 변화 (internal energy)', value: show((o, q, f) => `Δ<i>E</i><sub>int</sub> = ${f(o.dE, z)} J`) },
    ];
  },

  belowNote: p => (isC(p)
    ? '오른쪽 판은 <i>p</i>–<i>V</i> 그림 (p-V diagram)이고 검은 화살촉이 도는 방향이다. 확인 뒤 구간마다 아래 넓이를 칠한다. 부피가 느는 구간은 주황(+), 주는 구간은 하늘색(−)이다. 두 넓이가 겹친 부분은 서로 지워지고 겹치지 않은 넓이가 알짜 일이다. 주황 화살표는 열저장체와 기체 사이의 열이다. 에너지 막대에서 <i>Q</i>와 <i>W</i>는 테두리만, Δ<i>E</i><sub>int</sub>는 노랑으로 그린다.'
    : '오른쪽 판은 <i>p</i>–<i>V</i> 그림 (p-V diagram)이다. 회색 점선이 기준 경로 iaf, 검은 실선이 구할 경로다. 확인 뒤 경로 아래 넓이(기체가 한 일)를 칠한다. 부피가 늘면 주황(+), 줄면 하늘색(−)이다. 주황 화살표는 열저장체와 기체 사이의 열이다. 에너지 막대에서 <i>Q</i>와 <i>W</i>는 테두리만, Δ<i>E</i><sub>int</sub>는 노랑으로 그린다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 18 Temperature, Heat, and the First Law of Thermodynamics, Module 18.5 The First Law of Thermodynamics, Learning Objective 18.5.1–18.5.7, 18.5.9–18.5.10. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
