// 14.5 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c14에서 확인했다 (Archimedes' principle, buoyant force, displaced fluid, floating,
// apparent weight, actual weight).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isW = p => p.activity === 'weigh';

export const spec = {
  id: '14-2',
  course: '일반물리 I',
  chapter: 14,
  chapterTitle: 'Fluids',
  module: '14.5',
  title: '아르키메데스 원리 (Archimedes’ Principle)',
  headerNote: '교재 Principles of Physics 12e · Module 14.5',
  dt: 1 / 240,
  speed: 1,
  timeScale: 0.25,
  sceneTitle: p => (isW(p) ? '용수철저울에 매단 물체를 물에 담근다' : '잠긴 채 놓은 블록이 떠오른다'),

  assumptions: p => (isW(p) ? [
    '물체 밀도는 철이 교재 Table 14.1.1, 알루미늄·유리·콘크리트가 Table 12.3.1 값이다',
    '수조가 넓어 물체를 담가도 수면 높이는 그대로다',
    '물체를 천천히 내려 언제나 평형이다. 재생은 실제보다 4배 느리다',
    `<i>g</i> = ${M.G} m/s²`,
  ] : [
    '블록은 밀도가 고른 정육면체이고 액체 밀도는 Table 14.1.1 값이다',
    '블록 윗면이 수면에 닿도록 잡았다가 놓는다. 물의 끌림과 수면 높이 변화는 무시한다',
    '블록이 액체 밖으로 완전히 튀어나오지 않도록 밀도를 액체의 0.5–0.95배로 제한했다',
    '재생은 실제보다 4배 느리다',
  ]),

  equations: p => (isW(p) ? [
    { tex: 'F_b = m_fg = \\rho_fVg', no: '14.5.1' },
    { tex: '\\text{weight}_{\\text{app}} = \\text{weight} - F_b', no: '14.5.4' },
  ] : [
    { tex: 'F_b = m_fg', no: '14.5.1' },
    { tex: 'F_b = F_g\\ (\\text{floating})', no: '14.5.2' },
    { tex: 'F_b - F_g = ma' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isW(p)) {
      return [
        { id: 'W', label: '실제 무게', value: (o, q, f) => `${f(o.W)} N` },
        { id: 'frac', label: '잠긴 비율', value: (o, q, f) => `${f(o.frac * 100, z)} %` },
        { id: 'Fb', label: '부력 (buoyant force)', value: show((o, q, f) => `<i>F</i><sub>b</sub> = ${f(o.Fb, z)} N`) },
        { id: 'r', label: '저울 눈금 (겉보기 무게)', value: show((o, q, f) => `${f(o.reading)} N`) },
      ];
    }
    return [
      { id: 'sub', label: '잠긴 깊이', value: show((o, q, f) => `${f(o.sub * 100, z)} cm`) },
      { id: 'Fb', label: '부력', value: show((o, q, f) => `<i>F</i><sub>b</sub> = ${f(o.Fb)} N`) },
      { id: 'Fg', label: '중력', value: (o, q, f) => `<i>F</i><sub>g</sub> = ${f(o.Fg)} N` },
      { id: 'a', label: '가속도 (위가 +)', value: show((o, q, f) => `<i>a</i> = ${f(o.a, z)} m/s²`) },
    ];
  },

  belowNote: p => (isW(p)
    ? '주황 화살표는 물체에 작용하는 힘(줄의 장력, 중력, 부력)이다. 장력의 크기가 저울 눈금이다. 확인 전에는 부력 화살표를 회색 "= ?"로 그린다.'
    : '주황 화살표는 중력과 부력이다. 부력은 잠긴 부분의 중심에 그렸다. 확인 뒤 뜨는 깊이에 점선을 긋고 가속도(분홍)를 그린다. 블록은 그 깊이를 가운데로 위아래로 흔들린다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 14 Fluids, Module 14.5 Archimedes’ Principle, Learning Objective 14.5.1–14.5.6. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
