// 18.4 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c18에서 확인했다 (heat, specific heat, heat of transformation, heat of fusion, heat of vaporization,
// melting, vaporizing, phase change, thermal equilibrium, isolated system, Table 18.4.1 물질 이름).
// "가열 곡선"은 교재에 영어 용어가 없어 한국어만 쓴다.
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isM = p => p.activity === 'mix';
const STEP = { ice: '얼음 데우기', melt: '녹는 중 (melting)', water: '물 데우기', boil: '끓는 중 (vaporizing)' };
const g = x => `${Math.round(x * 1000)} g`;

export const spec = {
  id: '18-2',
  course: '일반물리 I',
  chapter: 18,
  chapterTitle: 'Temperature, Heat, and the First Law of Thermodynamics',
  module: '18.4',
  title: '비열과 상변화 (Absorption of Heat)',
  headerNote: '교재 Principles of Physics 12e · Module 18.4',
  dt: 1 / 240,
  speed: 1,
  timeIf: () => false,
  sceneTitle: p => (isM(p) ? '단열 컵의 물에 넣은 뜨거운 고체' : '가열판 위 비커 속 얼음'),

  assumptions: p => (isM(p) ? [
    '고체의 비열은 Table 18.4.1 값이고 물은 4187 J/kg·K다',
    '컵은 단열되어 있고 열용량을 무시한다. 고체와 물만 열을 주고받는 고립계 (isolated system)다',
    '슬라이더 범위에서 나중 온도는 100 °C보다 낮아 물이 끓지 않는다',
    '재생은 고체에서 물로 옮겨 간 열을 따라간다. 실제 시간이 아니다',
  ] : [
    '얼음의 비열은 Table 18.4.1의 −10 °C 값 2220 J/kg·K를 −40 °C부터 0 °C까지 쓴다. 물은 4187 J/kg·K다',
    `물은 0 °C에서 녹고 100 °C에서 끓는다. <i>L</i><sub>F</sub> = ${M.LF / 1000} kJ/kg, <i>L</i><sub>V</sub> = ${M.LV / 1000} kJ/kg (Table 18.4.2)`,
    '가열판의 열은 모두 얼음과 물로 들어간다. 비커와 공기로 새는 열은 무시한다',
    '수증기의 비열은 교재에 없어 모두 끓은 뒤로는 데우지 않는다. 재생은 공급한 열을 따라가고 실제 시간이 아니다',
  ]),

  equations: p => (isM(p) ? [
    { tex: 'Q = cm(T_f - T_i)', no: '18.4.3' },
    { tex: 'Q_s + Q_w = 0' },
    { tex: 'T_f = \\dfrac{c_sm_sT_s + c_wm_wT_w}{c_sm_s + c_wm_w}' },
  ] : [
    { tex: 'Q = cm(T_f - T_i)', no: '18.4.3' },
    { tex: 'Q = Lm', no: '18.4.5' },
    ...(p.boil ? [{ tex: 'L_V = 2256\\ \\mathrm{kJ/kg}', no: '18.4.6' }] : []),
    { tex: 'L_F = 333\\ \\mathrm{kJ/kg}', no: '18.4.7' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isM(p)) {
      return [
        { id: 'Ts', label: '고체 온도', value: show((o, q, f) => `<i>T</i><sub>s</sub> = ${f(o.Ts, z)} °C`) },
        { id: 'Tw', label: '물 온도', value: show((o, q, f) => `<i>T</i><sub>w</sub> = ${f(o.Tw, z)} °C`) },
        { id: 'Q', label: '물이 얻은 열 (heat)', value: show((o, q, f) => `<i>Q</i> = ${f(o.Q / 1000, z)} kJ`) },
      ];
    }
    return [
      { id: 'T', label: '온도 (temperature)', value: (o, q, f) => `<i>T</i> = ${f(o.T, z)} °C` },
      { id: 'step', label: '단계', value: o => (o.u >= 1 ? (o.steam > 0 ? '모두 끓었다' : '끝') : STEP[o.step]) },
      { id: 'mass', label: '얼음, 물, 수증기', value: o => `${g(o.ice)}, ${g(o.water)}, ${g(o.steam)}` },
      { id: 'Q', label: '공급한 열 (heat)', value: show((o, q, f) => `<i>Q</i> = ${f(o.Q / 1000, z)} kJ`) },
    ];
  },

  belowNote: p => (isM(p)
    ? '주황 화살표는 고체에서 물로 가는 열이다. 확인 뒤 오른쪽 판에 두 온도를 옮겨 간 열 <i>Q</i>에 따라 그린다. 실선이 고체, 점선이 물이다. 고체 크기는 질량의 세제곱근에 비례하게 그렸다.'
    : '주황 화살표는 가열판이 비커에 주는 열이다. 확인 뒤 오른쪽 판에 온도를 공급한 열 <i>Q</i>에 따라 그린다. 수평 구간은 온도가 그대로인 상변화 (phase change)다. 얼음 크기와 물 높이는 질량에 따라 그렸다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 18 Temperature, Heat, and the First Law of Thermodynamics, Module 18.4 Absorption of Heat, Learning Objective 18.4.5–18.4.9. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
