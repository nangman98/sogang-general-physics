// 18.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c18에서 확인했다 (thermal expansion, linear expansion, coefficient of linear expansion,
// volume expansion, coefficient of volume expansion, Table 18.3.1 재료 이름).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isC = p => p.activity === 'cube';

export const spec = {
  id: '18-1',
  course: '일반물리 I',
  chapter: 18,
  chapterTitle: 'Temperature, Heat, and the First Law of Thermodynamics',
  module: '18.3',
  title: '선팽창과 부피 팽창 (Thermal Expansion)',
  headerNote: '교재 Principles of Physics 12e · Module 18.3',
  dt: 1 / 240,
  speed: 1,
  timeIf: () => false,
  sceneTitle: p => (isC(p) ? '가열판 위에서 데우는 정육면체' : '가열판 위의 막대와 구멍 뚫린 판'),

  assumptions: p => [
    '<i>α</i>는 Table 18.3.1의 상온 값이고 슬라이더 범위의 온도에서 일정하다고 둔다',
    isC(p) ? '정육면체는 모든 방향으로 같은 비율로 늘어난다' : '막대 왼쪽 끝은 벽에 닿아 있고 오른쪽 끝이 자유롭게 움직인다. 판은 막대와 같은 재료다',
    '물체 전체의 온도가 고르게 바뀐다. 온도 변화 1 C°는 1 K와 같다',
    '재생은 온도를 처음 온도에서 나중 온도까지 고르게 바꾸는 그림이고 실제 가열 시간이 아니다',
  ],

  equations: p => (isC(p) ? [
    { tex: '\\Delta V = V\\beta\\,\\Delta T', no: '18.3.2' },
    { tex: '\\beta = 3\\alpha', no: '18.3.3' },
    { tex: '\\Delta A = A(2\\alpha)\\,\\Delta T' },
  ] : [
    { tex: '\\Delta L = L\\alpha\\,\\Delta T', no: '18.3.1' },
    { tex: '\\Delta T = T_f - T_i' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    const common = [
      { id: 'T', label: '온도 (temperature)', value: (o, q, f) => `<i>T</i> = ${f(o.T, z)} °C` },
      { id: 'dT', label: '온도 변화', value: (o, q, f) => `Δ<i>T</i> = ${f(o.dT, z)} K` },
    ];
    if (isC(p)) {
      return [...common,
        { id: 'dA', label: '한 면의 넓이 변화', value: show((o, q, f) => `Δ<i>A</i> = ${f(o.dA, z)} mm²`) },
        { id: 'dV', label: '부피 변화 (volume change)', value: show((o, q, f) => `Δ<i>V</i> = ${f(o.dV, z)} cm³`) },
      ];
    }
    return [...common,
      { id: 'dL', label: '길이 변화 (length change)', value: show((o, q, f) => `Δ<i>L</i> = ${f(o.dLmm, z)} mm`) },
      { id: 'dD', label: '구멍 지름 변화', value: show((o, q, f) => `Δ<i>D</i> = ${f(o.dDmm, z)} mm`) },
    ];
  },

  belowNote: p => (isC(p)
    ? `늘어난 길이는 실제의 ${M.MAG}배로 그렸다. 검은 점선 상자가 처음 크기다. 확인 뒤 넓이와 부피의 변화를 값으로 나타낸다.`
    : `늘어난 길이는 실제의 ${M.MAG}배로 그렸다. 막대 끝의 검은 점선이 처음 길이다. 확인 뒤 길이 변화 Δ<i>L</i>을 검은 화살표로, 처음 구멍 둘레를 검은 점선 원으로 그린다.`),

  objectives: '교재 Principles of Physics 12e, Chapter 18 Temperature, Heat, and the First Law of Thermodynamics, Module 18.3 Thermal Expansion, Learning Objective 18.3.1–18.3.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
