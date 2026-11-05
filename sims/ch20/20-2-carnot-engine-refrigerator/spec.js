// 20.2–20.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c19, c20에서 확인했다 (Carnot engine, Carnot refrigerator, Carnot cycle, high-temperature reservoir,
// low-temperature reservoir, insulating slab, working substance, efficiency, coefficient of performance, perfect engine,
// perfect refrigerator, isothermal expansion, isothermal compression, adiabatic expansion, adiabatic compression).
import * as M from './model.js';
import { fmt } from '../../../core/format.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const isE = p => p.activity !== 'fridge';
const KIND = { iso: '등온', adi: '단열' };

// Stroke name: expansion when V grows, compression when it shrinks.
export function strokeName(o) {
  const grow = o.c.V[o.to] > o.c.V[o.from];
  if (o.moving) return '<small>실린더를 옮기는 중</small>';
  return `${o.from}${o.to} ${KIND[o.kind]} ${grow ? '팽창' : '압축'}`;
}

export const spec = {
  id: '20-2',
  course: '일반물리 I',
  chapter: 20,
  chapterTitle: 'Entropy and the Second Law of Thermodynamics',
  module: '20.2–20.3',
  title: '카르노 기관과 냉동기 (Entropy in the Real World – Engines · Refrigerators and Real Engines)',
  headerNote: '교재 Principles of Physics 12e · Module 20.2, 20.3',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (isE(p) ? '카르노 기관의 한 순환' : '거꾸로 도는 카르노 순환, 냉동기'),

  assumptions: p => [
    `작동 물질 (working substance)은 단원자 이상 기체다. <i>C<sub>V</sub></i> = (3/2)<i>R</i>, <i>γ</i> = 5/3, <i>R</i> = ${M.R} J/mol·K`,
    `상태 a의 부피는 ${M.VA} L다. 단열 과정에서는 <i>TV</i><sup><i>γ</i>−1</sup>이 일정하다`,
    '모든 과정은 가역 과정이다. 실린더는 저장고나 단열판 위에만 놓인다',
    `재생 시간은 과정의 순서만 보인다. 등온 과정 ${M.T_ISO} s, 단열 과정 ${M.T_ADI} s, 실린더 옮기기 ${M.T_MOVE} s`,
    ...(isE(p) ? [] : ['냉동실은 저온 저장고이고 방은 고온 저장고다']),
  ],

  equations: p => (isE(p) ? [
    { tex: '|Q_H| = nRT_H\\ln\\dfrac{V_b}{V_a}', no: '19.2.10' },
    { tex: 'W = |Q_H| - |Q_L|', no: '20.2.1' },
    { tex: '\\dfrac{|Q_H|}{T_H} = \\dfrac{|Q_L|}{T_L}', no: '20.2.3' },
    { tex: '\\varepsilon = \\dfrac{|W|}{|Q_H|}', no: '20.2.4' },
    { tex: '\\varepsilon_C = 1 - \\dfrac{T_L}{T_H}', no: '20.2.6' },
  ] : [
    { tex: '|Q_L| = nRT_L\\ln\\dfrac{V_c}{V_d}', no: '19.2.10' },
    { tex: 'K = \\dfrac{|Q_L|}{|W|}', no: '20.3.1' },
    { tex: 'K = \\dfrac{|Q_L|}{|Q_H| - |Q_L|}', no: '20.3.2' },
    { tex: 'K_C = \\dfrac{T_L}{T_H - T_L}', no: '20.3.3' },
    { tex: '\\dfrac{|Q_H|}{T_H} = \\dfrac{|Q_L|}{T_L}', no: '20.2.3' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    const common = [
      { id: 'proc', label: '과정 (process)', value: o => strokeName(o) },
      { id: 'st', label: '기체 상태', value: (o, q, f) => `<i>T</i> = ${f(o.T)} K, <i>V</i> = ${f(o.V)} L` },
    ];
    if (isE(p)) {
      return [...common,
        { id: 'QH', label: '고온 저장고에서 받는 열', value: (o, q, f) => `|<i>Q</i><sub>H</sub>| = ${f(o.c.QH)} J` },
        { id: 'QL', label: '저온 저장고로 버리는 열', value: show((o, q, f) => `|<i>Q</i><sub>L</sub>| = ${f(o.c.QL)} J`) },
        { id: 'W', label: '한 순환의 일 (net work)', value: show((o, q, f) => `<i>W</i> = ${f(o.c.W)} J`) },
        { id: 'e', label: '효율 (efficiency)', value: show((o, q, f) => `<i>ε</i> = ${fmt(o.c.eps)} = ${f(o.c.eps * 100)}%`) },
      ];
    }
    return [...common,
      { id: 'QL', label: '냉동실에서 뺏는 열', value: (o, q, f) => `|<i>Q</i><sub>L</sub>| = ${f(o.c.QL)} J` },
      { id: 'QH', label: '방으로 내놓는 열', value: show((o, q, f) => `|<i>Q</i><sub>H</sub>| = ${f(o.c.QH)} J`) },
      { id: 'W', label: '한 순환에 해 주는 일', value: show((o, q, f) => `|<i>W</i>| = ${f(o.c.W)} J`) },
      { id: 'K', label: '성능 계수 (coefficient of performance)', value: show((o, q, f) => `<i>K</i> = ${f(o.c.K)}`) },
    ];
  },

  belowNote: p => (isE(p)
    ? '실린더는 고온 저장고 위에서 등온 팽창(ab), 단열판 (insulating slab) 위에서 단열 팽창(bc), 저온 저장고 위에서 등온 압축(cd), 다시 단열판 위에서 단열 압축(da)을 한다. 주황 화살표는 한 순환에 오가는 열이고 길이는 열의 크기에 비례한다. 지금 열이 오가는 쪽 화살표만 진하게 그린다. 확인 전에는 구할 열을 회색 "= ?"로 그린다. <i>p</i>–<i>V</i> 그래프 판의 화살촉은 순환 방향(시계 방향)이다. 확인 뒤 순환이 둘러싼 넓이(= <i>W</i>)를 채우고 <i>T</i>–<i>S</i> 그래프 판에 순환을 그린다. 엔트로피는 상태 a를 0으로 잡았다.'
    : '냉동기는 기관과 같은 순환을 거꾸로 돈다(시계 반대 방향). 단열 팽창(ad)으로 <i>T</i><sub>L</sub>까지 식은 기체가 냉동실 위에서 등온 팽창(dc)하는 동안 열 |<i>Q</i><sub>L</sub>|을 받는다. 단열 압축(cb)으로 <i>T</i><sub>H</sub>까지 데워진 기체는 방 쪽 저장고 위에서 등온 압축(ba)하는 동안 열 |<i>Q</i><sub>H</sub>|를 내놓는다. 주황 화살표 길이는 열의 크기에 비례하고 확인 전에는 구할 열을 회색 "= ?"로 그린다. 확인 뒤 순환이 둘러싼 넓이(= |<i>W</i>|)를 채우고 <i>T</i>–<i>S</i> 그래프 판에 순환을 그린다. 엔트로피는 상태 a를 0으로 잡았다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 20 Entropy and the Second Law of Thermodynamics, Module 20.2 Entropy in the Real World – Engines, Module 20.3 Refrigerators and Real Engines, Learning Objective 20.2.2–20.2.6, 20.3.2–20.3.4. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
