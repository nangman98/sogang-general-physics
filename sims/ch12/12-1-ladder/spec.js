// 12.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c12에서 확인했다 (static equilibrium, balance of forces, balance of torques, moment arm,
// line of action, frictionless wall, static frictional force, normal force).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isC = p => p.activity === 'climb';

export const spec = {
  id: '12-1',
  course: '일반물리 I',
  chapter: 12,
  chapterTitle: 'Equilibrium and Elasticity',
  module: '12.2',
  title: '벽에 기댄 사다리 (Some Examples of Static Equilibrium)',
  headerNote: '교재 Principles of Physics 12e · Module 12.2',
  dt: 1 / 240,
  speed: 1,
  runIf: isC,
  timeIf: isC,
  sceneTitle: p => (isC(p) ? '사다리를 오르는 사람과 바닥의 마찰' : '사다리에 작용하는 힘과 돌림힘 팔'),

  assumptions: p => [
    '벽은 마찰이 없다. 벽의 힘 <i>F</i><sub>w</sub>는 수평이다',
    '사다리는 고르다 (질량중심이 가운데). 사람의 무게는 사다리를 따라 <i>d</i>인 점의 연직선 위에 작용한다',
    isC(p) ? `사람은 바닥에서 사다리를 따라 ${M.CLIMB} m/s로 오른다. 필요한 마찰력이 <i>μ</i><sub>s</sub><i>F</i><sub>py</sub>에 닿으면 멈춘다` : '사다리와 사람은 정지해 있다 (정적 평형)',
    `돌림힘은 사다리 아래 끝 O를 축으로 구하고 시계 반대 방향이 +다. <i>g</i> = ${M.G} m/s²`,
  ],

  equations: p => [
    { tex: 'F_{\\text{net},x} = 0,\\ F_{\\text{net},y} = 0', no: '12.1.7, 12.1.8' },
    { tex: '\\tau_{\\text{net},z} = 0', no: '12.1.9' },
    { tex: '-hF_w + (d\\cos\\theta)Mg + (\\tfrac{L}{2}\\cos\\theta)mg = 0' },
    ...(isC(p) ? [{ tex: 'f_{s,\\max} = \\mu_s F_{py}', no: '6.1.1' }] : []),
  ],

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isC(p)) {
      return [
        { id: 'd', label: '사람의 위치', value: show((o, q, f) => `<i>d</i> = ${f(o.d, z)} m`) },
        { id: 'f', label: '필요한 정지 마찰력', value: (o, q, f) => `<i>F</i><sub>px</sub> = ${f(o.Fpx)} N` },
        { id: 'fm', label: '최대 정지 마찰력', value: (o, q, f) => `<i>μ</i><sub>s</sub><i>F</i><sub>py</sub> = ${f(o.fmax)} N` },
        { id: 's', label: '상태', value: o => (o.slip ? '미끄러지기 시작' : '정지 (평형)') },
      ];
    }
    return [
      { id: 'w', label: '벽의 힘', value: show((o, q, f) => `<i>F</i><sub>w</sub> = ${f(o.Fw)} N`) },
      { id: 'px', label: '바닥의 마찰력', value: show((o, q, f) => `<i>F</i><sub>px</sub> = ${f(o.Fpx)} N`) },
      { id: 'py', label: '바닥의 수직항력', value: show((o, q, f) => `<i>F</i><sub>py</sub> = ${f(o.Fpy)} N`) },
      { id: 'h', label: '높이와 밑변', value: (o, q, f) => `<i>h</i> = ${f(o.h)} m, <i>a</i> = ${f(o.a)} m` },
    ];
  },

  belowNote: p => (isC(p)
    ? '주황 화살표가 힘이다. 사람이 오를수록 벽의 힘과 바닥의 마찰력이 커진다. 확인 뒤 오른쪽 그래프 판에 필요한 마찰력(실선)과 최대 정지 마찰력(점선)을 사람의 위치 <i>d</i>에 따라 그린다.'
    : '주황 화살표가 힘이고 구할 힘은 확인 전까지 회색 "= ?"로 그린다. 회색 점선은 힘의 작용선, 검은 점선은 O에서 작용선까지의 돌림힘 팔 (moment arm)이다. 바닥의 두 힘은 O에 작용해 돌림힘 팔이 0이다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 12 Equilibrium and Elasticity, Module 12.2 Some Examples of Static Equilibrium, Learning Objective 12.2.1–12.2.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
