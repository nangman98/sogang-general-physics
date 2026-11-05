// 12.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c12에서 확인했다 (stress, strain, Young's modulus, tension, compression, yield strength,
// ultimate strength, linear (elastic) range, stress–strain curve).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const e6 = v => v / 1e6;

export const spec = {
  id: '12-2',
  course: '일반물리 I',
  chapter: 12,
  chapterTitle: 'Equilibrium and Elasticity',
  module: '12.3',
  title: '응력과 변형률, 영률 (Elasticity)',
  headerNote: '교재 Principles of Physics 12e · Module 12.3',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (M.MATERIALS[p.mat]?.mode !== 'compression' ? '당겨서 늘어나는 막대 (tension)' : '눌러서 줄어드는 막대 (compression)'),

  assumptions: p => [
    '막대 한쪽 끝은 고정되어 있고 다른 끝면 전체에 힘이 수직으로 고르게 작용한다',
    `<i>E</i>, 항복 강도 <i>S</i><sub>y</sub>, 극한 강도 <i>S</i><sub>u</sub>는 교재 Table 12.3.1 값이다${M.MATERIALS[p.mat].mode === 'compression' ? '. 이 재료의 강도는 압축 값이라 막대를 누른다' : ''}`,
    `응력이 선형 구간에 머물도록 힘의 최댓값을 ${M.MATERIALS[p.mat].Sy ? '항복 강도' : '극한 강도'}에 맞췄다`,
    `재생하면 힘이 0에서 <i>F</i>까지 ${M.RUN} s 동안 고르게 커진다`,
  ],

  equations: () => [
    { tex: '\\text{stress} = \\text{modulus} \\times \\text{strain}', no: '12.3.1' },
    { tex: '\\dfrac{F}{A} = E\\,\\dfrac{\\Delta L}{L}', no: '12.3.2' },
    { tex: 'A = \\pi R^2' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'F', label: '지금 힘', value: (o, q, f) => `<i>F</i> = ${f(o.Fnow, z)} kN` },
      { id: 's', label: '응력 (stress)', value: show((o, q, f) => `<i>F</i>/<i>A</i> = ${f(e6(o.stress), z)} × 10⁶ N/m²`) },
      { id: 'e', label: '변형률 (strain)', value: show((o, q, f) => `Δ<i>L</i>/<i>L</i> = ${f(o.strain * 1e3, z)} × 10⁻³`) },
      { id: 'd', label: '길이 변화', value: show((o, q, f) => `Δ<i>L</i> = ${f(o.dL * 1e3, z)} mm`) },
    ];
  },

  belowNote: p => {
    const k = Math.round(0.3 / (M.limit(p.mat) / (M.MATERIALS[p.mat].E * 1e9)));
    return `길이 변화는 ${k}배, 막대 굵기는 6배로 키워 그렸다. 주황 화살표가 끝면에 작용하는 힘이다. 뒤 그래프 판은 응력–변형률 그래프이고 점선은 교재 표의 항복 강도와 극한 강도다. 확인 뒤 선형 구간의 직선이 그려지고 기울기가 영률 <i>E</i>다.`;
  },

  objectives: '교재 Principles of Physics 12e, Chapter 12 Equilibrium and Elasticity, Module 12.3 Elasticity, Learning Objective 12.3.2–12.3.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
