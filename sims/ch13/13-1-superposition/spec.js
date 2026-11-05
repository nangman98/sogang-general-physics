// 13.1–13.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c13에서 확인했다 (Newton's law of gravitation, gravitational constant, principle of
// superposition, net force, free-body diagram).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';

export const spec = {
  id: '13-1',
  course: '일반물리 I',
  chapter: 13,
  chapterTitle: 'Gravitation',
  module: '13.1–13.2',
  title: '중력의 중첩 (Gravitation and the Principle of Superposition)',
  headerNote: '교재 Principles of Physics 12e · Module 13.1, 13.2',
  sceneTitle: '입자 1에 작용하는 두 중력과 알짜힘',

  assumptions: () => [
    '세 입자는 수평면 위에 놓여 있고 서로의 중력만 생각한다',
    `<i>G</i> = ${M.G} N·m²/kg² (Eq. 13.1.2)`,
    '각은 +<i>x</i>축에서 시계 반대 방향으로 잰다',
  ],

  equations: () => [
    { tex: 'F = G\\dfrac{m_1m_2}{r^2}', no: '13.1.1' },
    { tex: '\\vec F_{1,\\text{net}} = \\vec F_{12} + \\vec F_{13}', no: '13.2.1' },
    { tex: 'F_{1,\\text{net}} = \\sqrt{F_x^2 + F_y^2},\\ \\tan\\theta = F_y/F_x', no: '3.1.6' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'F12', label: '입자 2가 당기는 힘', value: (o, q, f) => `<i>F</i><sub>12</sub> = ${f(o.F12 * 1e6)} × 10⁻⁶ N` },
      { id: 'F13', label: '입자 3이 당기는 힘', value: (o, q, f) => `<i>F</i><sub>13</sub> = ${f(o.F13 * 1e6)} × 10⁻⁶ N` },
      { id: 'F', label: '알짜힘 크기', value: show((o, q, f) => `<i>F</i><sub>1,net</sub> = ${f(o.F * 1e6)} × 10⁻⁶ N`) },
      { id: 'th', label: '알짜힘 방향', value: show((o, q, f) => `<i>θ</i> = ${f(o.angle)}°`) },
    ];
  },

  belowNote: '주황 화살표가 입자 1에 작용하는 힘이고 꼬리를 입자 1에 붙였다. 회색 점선은 입자 1과 다른 입자를 잇는다. 확인 뒤 알짜힘과 머리–꼬리로 이은 힘(흐린 화살표)을 그린다. 힘 화살표 길이는 힘의 크기에 비례하고 위치 축척과는 관계없다.',

  objectives: '교재 Principles of Physics 12e, Chapter 13 Gravitation, Module 13.1 Newton’s Law of Gravitation, Module 13.2 Gravitation and the Principle of Superposition, Learning Objective 13.1.1–13.1.2, 13.2.1–13.2.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
