// 16.7 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c16에서 확인했다 (standing wave, node, antinode, resonance, resonant frequency, oscillation mode,
// fundamental mode, first harmonic, harmonic series, harmonic number, loop, oscillator, linear density, tension).
import * as M from './model.js';
import { fmt } from '../../../core/format.js';

// timeScale follows the current mode so one period lasts about M.TVIS on the screen (set by the view when it builds).
export const ui = { revealed: false, timeScale: 1 };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isN = p => p.activity === 'nodes';
const slow = p => { const k = 1 / M.playScale(p); return k > 1.0001 ? `재생은 실제보다 ${fmt(k)}배 느리다 (한 주기가 ${M.TVIS} s로 보인다)` : '재생은 실제 빠르기다'; };

export const spec = {
  id: '16-3',
  course: '일반물리 I',
  chapter: 16,
  chapterTitle: 'Waves–I',
  module: '16.7',
  title: '정상파와 공명 (Standing Waves and Resonance)',
  headerNote: '교재 Principles of Physics 12e · Module 16.7',
  dt: 1e-4,
  speed: 1,
  get timeScale() { return ui.timeScale; },
  sceneTitle: p => (isN(p) ? '반대로 가는 두 파가 정상파를 만든다' : '양 끝이 고정된 줄의 공명'),

  assumptions: p => (isN(p) ? [
    `줄은 길이 <i>L</i> = ${M.FIXED.L.toFixed(2)} m, 장력 <i>τ</i> = ${M.FIXED.tau.toFixed(1)} N, 선밀도 <i>μ</i> = ${M.FIXED.mu} g/m이고 양 끝이 고정되어 있다`,
    '두 진행파는 진폭과 파장이 같고 서로 반대 방향으로 간다',
    slow(p),
  ] : [
    '줄은 양 끝이 고정된 이상적인 줄이다. 왼쪽 끝을 흔드는 진동자 (oscillator)의 진폭은 무시한다',
    '진동자가 <i>n</i>번째 공명 진동수로 흔들어 정상파가 이미 생겼다',
    '배의 진폭은 공명 진동수와 관계없어 그림에서 정했다 (0.20 m 또는 <i>λ</i>/8 중 작은 값)',
    slow(p),
  ]),

  equations: p => (isN(p) ? [
    { tex: 'y_1 = y_m\\sin(kx - \\omega t)', no: '16.7.1' },
    { tex: 'y_2 = y_m\\sin(kx + \\omega t)', no: '16.7.2' },
    { tex: "y' = [2y_m\\sin kx]\\cos\\omega t", no: '16.7.3' },
    { tex: "u = \\dfrac{\\partial y'}{\\partial t} = -[2y_m\\sin kx]\\,\\omega\\sin\\omega t" },
  ] : [
    { tex: 'v = \\sqrt{\\dfrac{\\tau}{\\mu}}', no: '16.2.5' },
    { tex: '\\lambda = \\dfrac{2L}{n}', no: '16.7.8' },
    { tex: 'f = \\dfrac{v}{\\lambda} = n\\dfrac{v}{2L}', no: '16.7.9' },
    { tex: 'x = n\\dfrac{\\lambda}{2}\\ (\\text{nodes})', no: '16.7.5' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isN(p)) {
      return [
        { id: 'f', label: '진동수 (frequency)', value: (o, q, f) => `<i>f</i> = ${f(M.system(q).f)} Hz` },
        { id: 'y', label: `<i>x</i> = ${p.xP} cm의 변위`, value: (o, q, f) => `<i>y′</i> = ${f(o.yP * 100, z)} cm` },
        { id: 'A', label: `<i>x</i> = ${p.xP} cm의 진폭`, value: show((o, q, f) => `${f(M.probe(q).A * 100, z)} cm`) },
        { id: 'u', label: '가로 속도 (transverse velocity)', value: show((o, q, f) => `<i>u</i> = ${f(o.uP, z)} m/s`) },
      ];
    }
    return [
      { id: 'nodes', label: '마디 (node)와 배 (antinode)', value: (o, q) => `마디 ${q.n + 1}개, 배 ${q.n}개` },
      { id: 'v', label: '파동 속력 (wave speed)', value: show((o, q, f) => `<i>v</i> = ${f(M.resonance(q).v)} m/s`) },
      { id: 'l', label: '파장 (wavelength)', value: show((o, q, f) => `<i>λ</i> = ${f(M.resonance(q).lam)} m`) },
      { id: 'f', label: '공명 진동수 (resonant frequency)', value: show((o, q, f) => `<i>f</i> = ${f(M.resonance(q).f)} Hz`) },
    ];
  },

  belowNote: p => (isN(p)
    ? '가는 실선은 오른쪽으로 가는 파 <i>y</i><sub>1</sub>, 점선은 왼쪽으로 가는 파 <i>y</i><sub>2</sub>, 갈색 줄은 둘의 합이다. 검은 구슬이 위치 <i>x</i>의 줄 요소다. 확인 뒤 정상파의 진폭 곡선 (회색 점선), 마디, 구슬의 진폭과 가로 속도 (파랑)를 그린다.'
    : '진동자가 왼쪽 끝에서 줄을 흔든다. 확인 뒤 바닥 눈금, 마디의 검은 점, 파장을 그린다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 16 Waves–I, Module 16.7 Standing Waves and Resonance, Learning Objective 16.7.1–16.7.4, 16.7.6–16.7.8. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
