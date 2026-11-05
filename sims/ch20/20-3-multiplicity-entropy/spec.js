// 20.4 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c20에서 확인했다 (configuration, microstate, multiplicity, indistinguishable molecules, snapshot,
// Boltzmann's entropy equation, Boltzmann constant, Stirling's approximation, free expansion).
// W는 사용자가 정한 이름 "배치 수"로 부르고 configuration은 "배열"로 쓴다.
import * as M from './model.js';
import { fmt } from '../../../core/format.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const isX = p => p.activity === 'expand';

export const spec = {
  id: '20-3',
  course: '일반물리 I',
  chapter: 20,
  chapterTitle: 'Entropy and the Second Law of Thermodynamics',
  module: '20.4',
  title: '상자 속 분자의 배치 수와 엔트로피 (A Statistical View of Entropy)',
  headerNote: '교재 Principles of Physics 12e · Module 20.4',
  dt: 1 / 240,
  speed: 2,
  sceneTitle: p => (isX(p) ? '칸막이를 치운 뒤 퍼지는 분자' : '분자 배치를 찍은 스냅샷'),

  assumptions: p => (isX(p) ? [
    '분자는 구별되지 않는다. 배열 (configuration)은 왼쪽 반의 분자 수 <i>n</i><sub>1</sub>과 오른쪽 반의 분자 수 <i>n</i><sub>2</sub>로 정한다',
    `처음 배열은 (<i>N</i>, 0)이다. ${M.T_OPEN} s에 칸막이를 치운다`,
    '분자는 서로 부딪치지 않고 벽에서 튕긴다. 처음 위치와 속도는 시드를 고정한 의사난수로 정했다',
    `<i>k</i> = ${fmt(M.K_B)} J/K. 재생 시간은 퍼지는 순서만 보인다`,
  ] : [
    '분자는 구별되지 않는다. 배열 (configuration)은 왼쪽 반의 분자 수 <i>n</i><sub>1</sub>과 오른쪽 반의 분자 수 <i>n</i><sub>2</sub>로 정한다',
    '분자 하나가 왼쪽 반에 있을 확률과 오른쪽 반에 있을 확률은 같다. 미시 상태 (microstate)는 모두 같은 확률로 나온다',
    `스냅샷은 1 s에 ${M.RATE}장, 모두 ${M.SNAPS}장이다. 시드를 고정한 의사난수로 정해 늘 같다`,
  ]),

  equations: p => (isX(p) ? [
    { tex: 'W = \\dfrac{N!}{n_1!\\,n_2!}', no: '20.4.1' },
    { tex: 'S = k\\ln W', no: '20.4.2' },
    { tex: '\\ln N! \\approx N(\\ln N) - N', no: '20.4.3' },
    { tex: 'S_f - S_i = Nk\\ln 2\\ (\\text{large } N)', no: '20.4.5' },
  ] : [
    { tex: 'W = \\dfrac{N!}{n_1!\\,n_2!}', no: '20.4.1' },
    { tex: 'P = W/2^N' },
    { tex: 'S = k\\ln W', no: '20.4.2' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isX(p)) {
      return [
        { id: 'n', label: '지금 배열 (configuration)', value: o => `(<i>n</i><sub>1</sub>, <i>n</i><sub>2</sub>) = (${o.n1}, ${o.n2})` },
        { id: 'W', label: '지금 배열의 배치 수 (multiplicity)', value: show((o, q, f) => `<i>W</i> = ${f(Math.exp(o.lnW))}`) },
        { id: 'S', label: '지금 엔트로피 (처음은 0)', value: show((o, q, f) => `<i>S</i> = ${f(o.S, { zero: 1e-9 })} × 10⁻²³ J/K`) },
        { id: 'Sf', label: '배열 (N/2, N/2)의 엔트로피', value: show((o, q, f) => `<i>S</i><sub>f</sub> = ${f(o.Smax)} × 10⁻²³ J/K`) },
      ];
    }
    return [
      { id: 'n', label: '지금 배열 (configuration)', value: o => `(<i>n</i><sub>1</sub>, <i>n</i><sub>2</sub>) = (${o.n1}, ${o.n2})` },
      { id: 'k', label: '스냅샷 수', value: o => `${o.seen}장` },
      { id: 'W', label: `고른 배열 (${p.n1}, ${p.N - p.n1})의 배치 수`, value: show(o => `<i>W</i> = ${o.W}`) },
      { id: 'P', label: '그 배열의 확률과 나온 비율', value: show((o, q, f) => `${f(o.P * 100)}%, ${f(o.freq * 100, { zero: 1e-9 })}%`) },
    ];
  },

  belowNote: p => (isX(p)
    ? '처음에는 모든 분자가 왼쪽 반에 있다. 칸막이를 치우면 분자가 상자 전체로 퍼지고 왼쪽 분자 수 <i>n</i><sub>1</sub>은 <i>N</i>/2 근처에서 오르내린다. 분자 수가 많을수록 오르내림이 <i>N</i>에 비해 작다. 확인 뒤 그래프 판에 엔트로피 <i>S</i> = <i>k</i> ln <i>W</i>(<i>n</i><sub>1</sub>)를 시간에 따라 그리고(검정 실선) 배열 (<i>N</i>/2, <i>N</i>/2)의 값을 점선으로 긋는다.'
    : '재생하면 스냅샷마다 분자가 각자 왼쪽이나 오른쪽에 놓인다. 가운데 점선이 상자를 두 반으로 나눈다. 확인 뒤 그래프 판에 지금까지 나온 배열의 비율(하늘색 막대)과 확률 <i>W</i>/2<sup><i>N</i></sup>(검은 가로 막대)을 함께 그린다. 고른 배열의 막대 위에 표시를 단다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 20 Entropy and the Second Law of Thermodynamics, Module 20.4 A Statistical View of Entropy, Learning Objective 20.4.1–20.4.4. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
