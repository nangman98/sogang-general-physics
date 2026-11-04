// 4.6–4.7 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 교재 표기는 c04 PDF 79–83쪽에서 확인했다. 입자 P, 기준틀 A와 B, v⃗_PA = v⃗_PB + v⃗_BA (Eq. 4.7.2).
// 영어 용어 (reference frame, frame A, frame B, relative to the water, relative to the ground, constant velocity,
// particle, upstream)는 c04에 나온다.
import { unitVec, texNum as N } from '../../../core/format.js';
import { tex } from '../../../core/math.js';
import { D } from './model.js';

// Shared with view.js: the current questions and whether they are answered (readouts and the run button read this).
export const ui = { lq: null, ldone: false, aq: null, adone: false };

export const SCALE = { v: 1.5 };                  // arrow length per m/s (s)

const z = { zero: 1e-9 };
const V = s => tex(`\\vec v_{${s}}`);
const hidden = '<span class="wait">확인 뒤 보인다</span>';
const answered = p => p.activity === 'add' || (p.activity === 'land' && ui.ldone) || (p.activity === 'aim' && ui.adone);

export const spec = {
  id: '4-4',
  course: '일반물리 I',
  chapter: 4,
  chapterTitle: 'Motion in Two and Three Dimensions',
  module: '4.6–4.7',
  title: '강을 건너는 배의 상대 운동 (Relative Motion in One Dimension · Relative Motion in Two Dimensions)',
  headerNote: '교재 Principles of Physics 12e · Module 4.6, 4.7',
  dt: 1 / 120,
  runIf: answered,
  timeIf: answered,
  sceneTitle: p => ({ add: p.frame === 'B' ? '강물 (frame B)에서 본 배' : '강가 (frame A)에서 본 배', land: '도착 지점 예측', aim: '바로 맞은편으로' }[p.activity]),

  assumptions: p => {
    const base = [
      '강물은 어디서나 같은 속도 (constant velocity)로 흐른다',
      '배는 강물에 대해 일정한 속도로 간다. 배는 입자 (particle)로 보고 위치는 배 가운데다',
      `건너는 거리 <i>D</i> = ${D} m는 출발점 O에서 건너편 도착선까지다`,
    ];
    if (p.activity === 'land') return [...base, '<i>x</i>는 출발점 바로 맞은편에서 잰다. 하류 쪽이 +다', '시간은 2%, 도착 지점은 3% 또는 0.5 m 안이면 맞다'];
    if (p.activity === 'aim') return [...base, '뱃머리 각 <i>θ</i>는 바로 건너는 방향에서 상류 (upstream) 쪽이 +다', '각은 1° 안이면 맞다'];
    return [...base, '뱃머리 각 <i>θ</i>는 바로 건너는 방향에서 상류 (upstream) 쪽이 +다', `화살표 길이는 1 m/s당 ${SCALE.v} m다`];
  },

  equations: p => {
    const eqs = [
      { no: '4.7.1', tex: '\\vec r_{PA} = \\vec r_{PB} + \\vec r_{BA}' },
      { no: '4.7.2', tex: '\\vec v_{PA} = \\vec v_{PB} + \\vec v_{BA}',
        live: (o, q) => (answered(q)
          ? `\\begin{aligned}v_{PA,x} &= v_{PB,x} + v_{BA} = ${N(o.vPA[0])}\\ \\mathrm{m/s}\\\\ v_{PA,z} &= v_{PB,z} = ${N(o.vPA[2])}\\ \\mathrm{m/s}\\end{aligned}`
          : '\\vec v_{PA} = \\vec v_{PB} + \\vec v_{BA}') },
      { tex: 't = \\dfrac{D}{v_{PB}\\cos\\theta}' },
    ];
    if (p.activity === 'aim') eqs.push({ tex: 'v_{PB}\\sin\\theta = v_{BA}\\ \\ (v_{PA,x} = 0)' });
    return eqs;
  },

  readouts: p => {
    const show = () => answered(p);
    const cells = [
      { id: 'vpb', label: '강물에 대한 배의 속도 (relative to the water)', value: o => (p.activity === 'aim' && !ui.adone ? `<i>v</i><sub><i>PB</i></sub> = ${N(Math.hypot(...o.vPB))} m/s` : `${V('PB')} =<br>${unitVec(o.vPB, 'm/s', z)}`) },
      { id: 'vba', label: '강가에 대한 강물의 속도', value: o => `${V('BA')} =<br>${unitVec(o.vBA, 'm/s', z)}` },
      { id: 'vpa', label: '강가에 대한 배의 속도 (relative to the ground)', value: (o, _, f) => (show() ? `${V('PA')} =<br>${unitVec(o.vPA, 'm/s', z)}<small>|${V('PA')}| = ${f(o.speedPA)} m/s</small>` : hidden) },
    ];
    if (p.activity === 'add') {
      cells.push(p.frame === 'B'
        ? { id: 'pos', label: '강물에서 잰 위치 (position)', value: o => `${tex('\\vec r_{PB}')} =<br>${unitVec(o.rPB, 'm', z)}` }
        : { id: 'pos', label: '강가에서 잰 위치 (position)', value: (o, _, f) => `${tex('\\vec r_{PA}')} =<br>${unitVec(o.rPA, 'm', z)}<small>도착 <i>t</i> = ${f(o.tc)} s, <i>x</i> = ${f(o.xLand, z)} m</small>` });
    } else {
      cells.push({ id: 'land', label: '도착', value: (o, _, f) => (show() ? `<i>t</i> = ${f(o.tc)} s<br><i>x</i> = ${f(o.xLand, z)} m` : hidden) });
    }
    return cells;
  },

  belowNote: p => ({
    add: p.frame === 'B'
      ? `강물 (frame B)에서 보면 물에 뜬 부표가 멈춰 있고 배는 뱃머리 방향 ${V('PB')}로 곧게 간다. 강가는 ${V('AB')} = −${V('BA')}로 움직인다.`
      : `강가 (frame A)에서 보면 배는 뱃머리 방향이 아니라 ${V('PA')} 방향으로 간다. ${V('PB')} 끝에 ${V('BA')}를 이어 붙인 화살표가 ${V('PA')}다. <i>x</i> 성분은 식 (4.6.2)와 같은 꼴이다.`,
    land: '재생하기 전에 건너는 시간과 도착 지점을 적는다. 확인하면 재생 단추가 나온다.',
    aim: '바로 맞은편 (<i>x</i> = 0)에 닿는 뱃머리 각을 적는다. 확인하면 그 각으로 배가 출발한다.',
  }[p.activity]),

  objectives: '교재 Principles of Physics 12e, Chapter 4 Motion in Two and Three Dimensions, Module 4.7 Relative Motion in Two Dimensions (Learning Objective 4.7.1)와 Module 4.6 Relative Motion in One Dimension의 위치·속도 관계 (Eqs. 4.6.1–4.6.2, 흐름 방향 성분). 식 번호는 교재 번호다. 화면의 문제는 교재 문제를 옮기지 않았다.',
};
