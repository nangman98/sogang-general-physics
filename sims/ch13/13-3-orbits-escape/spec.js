// 13.5–13.7 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c13에서 확인했다 (escape speed, law of orbits, law of areas, law of periods, semimajor axis,
// eccentricity, perigee, apogee, mechanical energy, circular orbit, elliptical orbit).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isE = p => p.activity === 'escape';

export const spec = {
  id: '13-3',
  course: '일반물리 I',
  chapter: 13,
  chapterTitle: 'Gravitation',
  module: '13.5–13.7',
  title: '궤도와 탈출 속력 (Kepler’s Laws, Orbits and Energy)',
  headerNote: '교재 Principles of Physics 12e · Module 13.5, 13.6, 13.7',
  dt: 1,
  speed: 1,
  timeScale: 600,
  sceneTitle: p => (isE(p) ? '곧게 위로 쏜 물체와 탈출 속력' : '점화로 바뀐 인공위성의 궤도'),

  assumptions: p => (isE(p) ? [
    '천체는 고른 구이고 돌지 않는다. 공기 저항은 없다',
    `천체의 질량과 반지름은 교재 Table 13.5.1 값이다. <i>G</i> = ${M.G} N·m²/kg²`,
    '물체는 표면에서 곧게 위로 쏜다',
    '재생은 실제 시간의 600배 빠르기다',
  ] : [
    `지구는 <i>M</i> = ${M.EARTH.M} kg, <i>R</i> = ${M.EARTH.R / 1e3} km인 고른 구다. 공기 저항은 없다`,
    `위성 질량 <i>m</i> = ${M.MSAT} kg. 점 P에서 순간적으로 점화해 속력만 바꾼다 (방향은 그대로)`,
    '점화 뒤 위성은 위에서 볼 때 시계 반대 방향으로 한 바퀴 돈다',
    '재생은 실제 시간의 600배 빠르기다. 지구와 위성의 크기는 축척과 다르다',
  ]),

  equations: p => (isE(p) ? [
    { tex: 'K_f + U_f = K_i + U_i', no: '13.5.9' },
    { tex: 'U = -\\dfrac{GMm}{r}', no: '13.5.1' },
    { tex: 'v = \\sqrt{\\dfrac{2GM}{R}}', no: '13.5.8' },
  ] : [
    { tex: 'U = -\\dfrac{GMm}{r}', no: '13.5.1' },
    { tex: 'E = -\\dfrac{GMm}{2a}', no: '13.7.6' },
    { tex: 'T^2 = \\left(\\dfrac{4\\pi^2}{GM}\\right)a^3', no: '13.6.5' },
    { tex: '\\dfrac{dA}{dt} = \\dfrac{L}{2m}', no: '13.6.3' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isE(p)) {
      return [
        { id: 'h', label: '표면에서 높이', value: (o, q, f) => `<i>h</i> = ${f((o.r - M.BODIES[q.body].R) / 1e3, z)} km` },
        { id: 'hR', label: '반지름 단위 높이', value: show((o, q, f) => `<i>h</i>/<i>R</i> = ${f((o.r - M.BODIES[q.body].R) / M.BODIES[q.body].R, z)}`) },
        { id: 'v', label: '속도 (위가 +)', value: (o, q, f) => `<i>v</i> = ${f(o.vr / 1e3, z)} km/s` },
        { id: 'vesc', label: '탈출 속력', value: show((o, q, f) => `${f(M.escape(q).vesc / 1e3)} km/s`) },
      ];
    }
    return [
      { id: 'r', label: '지구 중심에서 거리', value: (o, q, f) => `<i>r</i> = ${f(o.r / 1e3)} km` },
      { id: 'v', label: '속력', value: (o, q, f) => `<i>v</i> = ${f(o.v / 1e3)} km/s` },
      { id: 'K', label: '운동에너지', value: show((o, q, f) => `<i>K</i> = ${f(o.K / 1e6)} MJ`) },
      { id: 'U', label: '퍼텐셜 에너지', value: show((o, q, f) => `<i>U</i> = ${f(o.U / 1e6)} MJ`) },
      { id: 'E', label: '역학적 에너지', value: show((o, q, f) => `<i>E</i> = ${f(o.E / 1e6)} MJ`) },
      { id: 'T', label: '새 궤도의 주기', value: show((o, q, f) => `<i>T</i> = ${f(M.orbit(q).T / 60)} min`) },
    ];
  },

  belowNote: p => (isE(p)
    ? '파란 화살표는 속도다. 확인 뒤 가장 높은 곳에 점선 고리를 그리고 탈출 속력으로 쏜 물체(하늘색)를 함께 띄운다. 그 물체는 돌아오지 않는다. 천체 반지름을 1로 그렸다.'
    : '회색 점선 원이 점화 전 원 궤도다. 파란 화살표는 속도다. 확인 뒤 새 타원 궤도 전체와 근지점, 원지점, 그리고 같은 시간(주기의 1/10) 동안 위성과 지구를 잇는 선이 쓸고 간 두 넓이(하늘색, 주황)를 그린다. 두 넓이는 같다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 13 Gravitation, Module 13.5 Gravitational Potential Energy, Module 13.6 Planets and Satellites: Kepler’s Laws, Module 13.7 Satellites: Orbits and Energy, Learning Objective 13.5.4–13.5.6, 13.6.1–13.6.5, 13.7.1–13.7.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
