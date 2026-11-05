// 6.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c06에서 확인했다 (uniform circular motion, centripetal force, centripetal acceleration,
// normal force, frictional force, radial axis). 경사진 커브 (banked curve)는 교재 6장 문제 44의 배치다.
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '6-3',
  course: '일반물리 I',
  chapter: 6,
  chapterTitle: 'Force and Motion—II',
  module: '6.3',
  title: '원운동의 구심력 (Uniform Circular Motion)',
  headerNote: '교재 Principles of Physics 12e · Module 6.3',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => ({ flat: '평평한 커브와 마찰력', banked: '경사진 커브 (banked curve)', loop: '연직 고리의 꼭대기' }[p.activity]),

  assumptions: p => [
    ...({
      flat: [`자동차 질량 ${M.MASS} kg, 속력 일정`, '도로가 차에 주는 정지 마찰력이 중심을 향한다', '더 빠르면 최대 정지 마찰력으로 가장 작게 도는 원을 그린다'],
      banked: [`자동차 질량 ${M.MASS} kg, 속력 일정`, '도로에 마찰이 없다', '차는 이 경사각에 맞는 속력으로 돈다'],
      loop: ['수레를 입자로 본다', '꼭대기 근처는 속력이 일정한 원운동으로 본다 (교재 Sample Problem 6.3.1과 같다)', '트랙은 수레를 중심 쪽으로 밀기만 하고 당기지 못한다'],
    }[p.activity]),
    `<i>g</i> = ${M.G} m/s²`,
  ],

  equations: p => {
    const base = [{ tex: 'a = \\dfrac{v^2}{R}', no: '6.3.1' }, { tex: 'F = m\\dfrac{v^2}{R}', no: '6.3.2' }];
    if (p.activity === 'flat') return [...base, { tex: 'f_{s,\\max} = \\mu_s F_N', no: '6.1.1' }];
    if (p.activity === 'banked') return [...base, { tex: 'F_N\\cos\\theta - mg = 0' }, { tex: 'F_N\\sin\\theta = m\\dfrac{v^2}{R}' }];
    return [...base, { tex: '-F_N - F_g = m\\left(-\\dfrac{v^2}{R}\\right)', no: '6.3.3' }];
  },

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (p.activity === 'flat') {
      return [
        { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(q.v)} m/s` },
        { id: 'fmax', label: '최대 정지 마찰력', value: (o, q, f) => `<i>f</i><sub>s,max</sub> = ${f(o.fmax)} N` },
        { id: 'f', label: '마찰력 (frictional force)', value: show((o, q, f) => `<i>f</i> = ${f(o.f)} N`) },
        { id: 'r', label: '도는 원의 반지름', value: show((o, q, f) => `${f(o.rPath)} m<br><small>${o.onRoad ? '커브를 따라 돈다' : '도로 밖으로 나간다'}</small>`) },
      ];
    }
    if (p.activity === 'banked') {
      return [
        { id: 'Fg', label: '중력 (gravitational force)', value: (o, q, f) => `<i>F</i><sub>g</sub> = ${f(M.MASS * M.G)} N` },
        { id: 'FN', label: '수직항력 (normal force)', value: show((o, q, f) => `<i>F</i><sub>N</sub> = ${f(o.FN)} N`) },
        { id: 'v', label: '속력 (speed)', value: show((o, q, f) => `<i>v</i> = ${f(o.v)} m/s`) },
        { id: 'a', label: '구심 가속도', value: show((o, q, f) => `<i>a</i> = ${f(o.a)} m/s²`) },
      ];
    }
    return [
      { id: 'v', label: '꼭대기 속력', value: (o, q, f) => `<i>v</i> = ${f(q.vl)} m/s` },
      { id: 'phi', label: '꼭대기에서 잰 각', value: (o, q, f) => (o.contact ? `${f(o.phi, z)}°` : '<small>트랙에서 떨어졌다</small>') },
      { id: 'FN', label: '수직항력 (normal force)', value: show((o, q, f) => `<i>F</i><sub>N</sub> = ${f(o.FN, z)} N`) },
      { id: 'a', label: '꼭대기에서 필요한 구심 가속도', value: (o, q, f) => `<i>v</i>²/<i>R</i> = ${f(o.top.a)} m/s²` },
    ];
  },

  belowNote: p => ({
    flat: '구심력 (centripetal force)은 새로운 힘이 아니라 중심을 향하는 알짜힘이다. 평평한 커브에서는 도로가 타이어에 주는 정지 마찰력이 그 역할을 한다. 파란 화살표는 속도(1 m/s당 0.5 m), 주황 화살표는 마찰력, 확인 뒤 보이는 분홍 화살표는 구심 가속도(1 m/s²당 0.5 m)다.',
    banked: '경사진 도로의 수직항력은 중심 쪽으로 기울어 있다. 그 수평 성분이 구심력이다. 확인하면 차 위의 수직항력을 수평 성분 <i>F</i><sub>N</sub> sin <i>θ</i>와 연직 성분 <i>F</i><sub>N</sub> cos <i>θ</i>로 나눠 점선으로 그린다.',
    loop: '꼭대기에서는 중력과 트랙의 수직항력이 모두 아래, 곧 원의 중심을 향한다. 속력이 느리면 트랙을 누르지 못하고 떨어진다. 트랙에서 떨어진 뒤의 경로는 포물선이다.',
  }[p.activity]),

  objectives: '교재 Principles of Physics 12e, Chapter 6 Force and Motion—II, Module 6.3 Uniform Circular Motion, Learning Objective 6.3.1–6.3.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};

// Force arrows (m per N), per activity.
export function forceScale(p) {
  if (p.activity === 'loop') { const q = M.lp(p), s = M.loopTop(q); return 0.6 * q.R / Math.max(q.m * M.G, s.FN); }
  // Roads: the largest force is 0.3 R long so it reads at the scale of the curve.
  if (p.activity === 'banked') return 0.3 * p.R / M.banked(p).FN;
  return 0.3 * p.R / (M.MASS * M.G);
}
