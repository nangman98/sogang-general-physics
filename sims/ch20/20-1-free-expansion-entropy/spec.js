// 20.1 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c19, c20에서 확인했다 (free expansion, isothermal expansion, thermal reservoir, lead shot,
// entropy change, state function, irreversible process, reversible process, number of moles, initial volume).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '20-1',
  course: '일반물리 I',
  chapter: 20,
  chapterTitle: 'Entropy and the Second Law of Thermodynamics',
  module: '20.1',
  title: '자유 팽창과 등온 팽창의 엔트로피 (Entropy)',
  headerNote: '교재 Principles of Physics 12e · Module 20.1',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: '같은 i와 f를 잇는 두 과정',

  assumptions: () => [
    `기체는 이상 기체다. <i>R</i> = ${M.R} J/mol·K`,
    '자유 팽창 상자는 단열되어 있다. 기체는 진공으로 퍼지며 일을 하지 않고 처음과 나중 온도가 같다',
    '등온 팽창은 온도 <i>T</i>인 열 저장고 위에서 납 알갱이를 천천히 덜어 내는 가역 과정이다',
    `재생 시간은 과정의 순서만 보인다. 자유 팽창 상자의 분자 ${M.N_MOL}개는 서로 부딪치지 않는 그림이다`,
  ],

  equations: () => [
    { tex: '\\Delta S = S_f - S_i = \\int_i^f \\dfrac{dQ}{T}', no: '20.1.1' },
    { tex: '\\Delta S = \\dfrac{Q}{T}\\ (\\text{isothermal})', no: '20.1.2' },
    { tex: 'Q = W = nRT\\ln\\dfrac{V_f}{V_i}', no: '19.2.10' },
    { tex: '\\Delta S = nR\\ln\\dfrac{V_f}{V_i} + nC_V\\ln\\dfrac{T_f}{T_i}', no: '20.1.4' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'V', label: '등온 팽창의 부피', value: (o, q, f) => `<i>V</i> = ${f(o.V)} L` },
      { id: 'Q', label: '저장고에서 받은 열 (heat)', value: show((o, q, f) => `<i>Q</i> = ${f(o.Q, z)} J`) },
      { id: 'Si', label: '등온 팽창의 엔트로피 변화', value: show((o, q, f) => `Δ<i>S</i> = ${f(o.dS, z)} J/K`) },
      { id: 'Sf', label: '자유 팽창의 엔트로피 변화', value: show((o, q, f) => (o.eq ? `Δ<i>S</i> = ${f(o.dStot)} J/K` : o.open ? '<small>중간 상태는 평형이 아니다</small>' : 'Δ<i>S</i> = 0 J/K')) },
    ];
  },

  belowNote: '왼쪽은 단열 상자의 자유 팽창 (free expansion)이다. 칸막이를 치우면 분자가 진공 쪽으로 퍼진다. 오른쪽은 열 저장고 위 실린더에서 납 알갱이 (lead shot)를 덜어 내는 가역 등온 팽창 (isothermal expansion)이다. 두 용기 모두 나중 부피를 같은 크기로 그렸다. <i>p</i>–<i>V</i> 그래프 판에는 등온 팽창의 경로를 그린다. 자유 팽창의 중간 상태는 평형 상태가 아니어서 그래프에 점 i와 f만 있다. 주황 화살표는 저장고에서 기체로 들어간 열이고 확인 전에는 회색 "= ?"로 그린다. 확인 뒤 경로 아래 넓이를 채운다.',

  objectives: '교재 Principles of Physics 12e, Chapter 20 Entropy and the Second Law of Thermodynamics, Module 20.1 Entropy, Learning Objective 20.1.2, 20.1.3, 20.1.6, 20.1.7. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
