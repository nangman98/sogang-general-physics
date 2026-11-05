// 18.6 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c18에서 확인했다 (conduction, thermal conductivity, conduction rate, thermal resistance, R-value,
// composite slab, steady state, interface, thermal radiation, emissivity, Stefan–Boltzmann constant, Table 18.6.1 재료 이름).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const isR = p => p.activity === 'rad';

export const spec = {
  id: '18-4',
  course: '일반물리 I',
  chapter: 18,
  chapterTitle: 'Temperature, Heat, and the First Law of Thermodynamics',
  module: '18.6',
  title: '전도와 복사 (Heat Transfer Mechanisms)',
  headerNote: '교재 Principles of Physics 12e · Module 18.6',
  sceneTitle: p => (isR(p) ? '공의 열복사 (thermal radiation)' : '두 겹 판 (composite slab)'),

  assumptions: p => (isR(p) ? [
    'σ = 5.6704 × 10⁻⁸ W/m²·K⁴ (Stefan–Boltzmann constant)이고 온도는 켈빈으로 바꿔 쓴다 (<i>T</i> = <i>T</i><sub>C</sub> + 273.15)',
    '공의 표면 온도는 고르고 주위는 온도 <i>T</i><sub>env</sub>로 고르다',
    '방사율 <i>ε</i>는 내보낼 때와 흡수할 때 같다. 교재에 방사율 표가 없어 0.05–1.00에서 고른다',
    '전도와 대류로 오가는 열은 다루지 않는다',
  ] : [
    '열의 흐름은 정상 상태 (steady state)다. 온도와 전달률이 시간에 따라 바뀌지 않는다',
    '열은 판 면에 수직으로만 흐르고 옆으로 새지 않는다',
    '열전도율 (thermal conductivity) <i>k</i>는 Table 18.6.1 값이다',
    '판 두께는 1 단위 = 10 cm 축척으로 그렸고 넓이 <i>A</i>는 그림 크기와 관계없다',
  ]),

  equations: p => (isR(p) ? [
    { tex: 'P_{\\text{rad}} = \\sigma\\varepsilon AT^4', no: '18.6.7' },
    { tex: 'P_{\\text{abs}} = \\sigma\\varepsilon AT_{\\text{env}}^4', no: '18.6.8' },
    { tex: 'P_{\\text{net}} = \\sigma\\varepsilon A(T_{\\text{env}}^4 - T^4)', no: '18.6.9' },
  ] : [
    { tex: 'P_{\\text{cond}} = kA\\dfrac{T_H - T_C}{L}', no: '18.6.1' },
    { tex: 'R = \\dfrac{L}{k}', no: '18.6.2' },
    { tex: 'T_X = \\dfrac{k_1L_2T_C + k_2L_1T_H}{k_1L_2 + k_2L_1}', no: '18.6.4' },
    { tex: 'P_{\\text{cond}} = \\dfrac{A(T_H - T_C)}{L_1/k_1 + L_2/k_2}', no: '18.6.5' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isR(p)) {
      return [
        { id: 'A', label: '겉넓이', value: (o, q, f) => `<i>A</i> = ${f(o.A)} m²` },
        { id: 'Prad', label: '내보내는 일률', value: show((o, q, f) => `<i>P</i><sub>rad</sub> = ${f(o.Prad)} W`) },
        { id: 'Pabs', label: '흡수하는 일률', value: show((o, q, f) => `<i>P</i><sub>abs</sub> = ${f(o.Pabs)} W`) },
        { id: 'Pnet', label: '알짜 일률', value: show((o, q, f) => `<i>P</i><sub>net</sub> = ${f(o.Pnet)} W`) },
      ];
    }
    return [
      { id: 'dT', label: '두 면의 온도 차', value: (o, q, f) => `<i>T</i><sub>H</sub> − <i>T</i><sub>C</sub> = ${f(q.TH - q.TC)} K` },
      { id: 'R', label: '열저항 (R-value)', value: show((o, q, f) => `<i>R</i><sub>2</sub> = ${f(o.R2)}, <i>R</i><sub>1</sub> = ${f(o.R1)} m²·K/W`) },
      { id: 'P', label: '전도 전달률 (conduction rate)', value: show((o, q, f) => `<i>P</i><sub>cond</sub> = ${f(o.P)} W`) },
      { id: 'TX', label: '경계면 온도 (interface)', value: show((o, q, f) => `<i>T</i><sub>X</sub> = ${f(o.TX)} °C`) },
    ];
  },

  belowNote: p => (isR(p)
    ? '주황 화살표 가운데 공에서 나가는 것이 내보내는 복사, 공으로 들어오는 흐린 것이 흡수하는 복사다. 확인 전에는 같은 길이의 회색으로 그리고 확인 뒤 일률에 비례하는 길이로 그린다. 공은 1 단위 = 10 cm 축척이다.'
    : '주황 화살표는 판을 지나는 열의 흐름이다. 오른쪽 판은 판 안의 위치 <i>x</i>에 따른 온도이고 세로 점선이 두 층의 경계다. 확인 뒤 온도 분포와 경계면 온도를 그린다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 18 Temperature, Heat, and the First Law of Thermodynamics, Module 18.6 Heat Transfer Mechanisms, Learning Objective 18.6.1–18.6.3, 18.6.5–18.6.7. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
