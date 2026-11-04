// 4.4 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
import { tuple } from '../../../core/format.js';

export const spec = {
  id: '4-2',
  course: '일반물리 I',
  chapter: 4,
  chapterTitle: 'Motion in Two and Three Dimensions',
  module: '4.4',
  title: '포물체 운동 (Projectile Motion)',
  sceneTitle: '포물체 운동',
  dt: 1 / 240,
  assumptions: [
    '공기 저항 없음',
    '자유 낙하 가속도 (free-fall acceleration) <i>g</i> = 9.8 m/s², 아래 방향',
    '발사점과 도달점의 높이가 같음, <i>y</i><sub>0</sub> = 0',
    '공은 중심에 놓인 입자로 본다',
  ],
  equations: [
    { html: '<i>x</i> − <i>x</i><sub>0</sub> = (<i>v</i><sub>0</sub> cos <i>θ</i><sub>0</sub>)<i>t</i>', no: '4.4.3' },
    { html: '<i>y</i> − <i>y</i><sub>0</sub> = (<i>v</i><sub>0</sub> sin <i>θ</i><sub>0</sub>)<i>t</i> − ½<i>gt</i>²', no: '4.4.4' },
    { html: '<i>v<sub>y</sub></i> = <i>v</i><sub>0</sub> sin <i>θ</i><sub>0</sub> − <i>gt</i>', no: '4.4.5' },
    { html: '<i>R</i> = (<i>v</i><sub>0</sub>²/<i>g</i>) sin 2<i>θ</i><sub>0</sub>', no: '4.4.8' },
  ],
  readouts: [
    { id: 'pos', label: '위치 (position)', value: o => `(<i>x</i>, <i>y</i>, <i>z</i>) = ${tuple(o.position_m, { zero: 1e-9 })} m` },
    { id: 'vel', label: '속도 (velocity)', value: o => `(<i>v<sub>x</sub></i>, <i>v<sub>y</sub></i>, <i>v<sub>z</sub></i>) = ${tuple(o.velocity_m_s, { zero: 1e-9 })} m/s` },
    { id: 'range', label: '수평 사거리 (horizontal range)', value: (o, p, f) => `<i>R</i> = ${f(o.range_m)} m` },
    { id: 'flight', label: '비행 시간 (flight time)', value: (o, p, f) => `${f(o.flightTime_s)} s` },
  ],
  belowNote: '<i>y</i>축은 위쪽이므로 <i>y</i>는 발사점에서 잰 높이다. 발사면을 돌리면(<i>φ</i> ≠ 0) 식 4.4.3의 <i>x</i> − <i>x</i><sub>0</sub>는 발사 방향의 수평 거리가 된다.',
  objectives: '교재 Principles of Physics 12e, Module 4.4 Projectile Motion, Learning Objectives 4.4.1–4.4.3. 화면의 식 번호는 교재 번호다.',
};
