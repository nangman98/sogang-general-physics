// 13.4 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c13에서 확인했다 (shell theorem, uniform shell, uniform solid sphere, inside mass, capsule,
// tunnel, Hooke's law).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '13-2',
  course: '일반물리 I',
  chapter: 13,
  chapterTitle: 'Gravitation',
  module: '13.4',
  title: '지구 속의 중력과 관통 터널 (Gravitation Inside Earth)',
  headerNote: '교재 Principles of Physics 12e · Module 13.4',
  dt: 1,
  speed: 1,
  timeScale: 600,
  sceneTitle: '남극에서 북극까지 지구를 뚫은 터널 속 캡슐',

  assumptions: () => [
    `지구는 밀도가 고른 구이고 돌지 않는다. <i>M</i> = ${M.EARTH.M} kg, <i>R</i> = ${M.EARTH.R / 1e3} km`,
    '터널은 지구 중심을 지나고 마찰과 공기 저항이 없다',
    '캡슐은 남극에서 정지 상태로 떨어지고 한 번 왕복한다',
    '재생은 실제 시간의 600배 빠르기다',
  ],

  equations: () => [
    { tex: 'M_{\\text{ins}} = \\dfrac{M}{R^3}r^3', no: '13.4.2' },
    { tex: 'F = \\dfrac{GmM}{R^3}r', no: '13.4.3' },
    { tex: '\\vec F = -K\\vec r', no: '13.4.4' },
    { tex: 'W_s = \\tfrac{1}{2}kx_i^2 - \\tfrac{1}{2}kx_f^2', no: '7.4.6' },
  ],

  readouts: () => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    return [
      { id: 'r', label: '중심에서 거리', value: (o, q, f) => `<i>r</i> = ${f(o.r / 1e3, z)} km` },
      { id: 'Mi', label: '안쪽 질량', value: (o, q, f) => `<i>M</i><sub>ins</sub>/<i>M</i> = ${f(o.Mins / M.EARTH.M, z)}` },
      { id: 'F', label: '캡슐에 작용하는 중력', value: show((o, q, f) => `<i>F</i> = ${f(o.F, z)} N`) },
      { id: 'v', label: '캡슐 속력', value: show((o, q, f) => `<i>v</i> = ${f(Math.abs(o.vy) / 1e3, z)} km/s`) },
    ];
  },

  belowNote: '반투명한 지구 안의 주황 구가 캡슐보다 안쪽에 있는 질량 <i>M</i><sub>ins</sub>다. 바깥 껍질은 캡슐에 알짜 중력을 작용하지 않는다. 주황 화살표는 중력, 파란 화살표는 속도다. 확인 뒤 오른쪽 그래프 판에 중심에서 거리에 따른 중력을 그린다(안은 직선, 밖은 거리 제곱에 반비례).',

  objectives: '교재 Principles of Physics 12e, Chapter 13 Gravitation, Module 13.4 Gravitation Inside Earth, Learning Objective 13.4.1–13.4.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
