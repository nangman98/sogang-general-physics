// 16.1–16.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c16에서 확인했다 (transverse wave, traveling wave, amplitude, wavelength, frequency, period,
// angular wave number, wave speed, string element, transverse velocity, linear density, tension, rope, peak).
import * as M from './model.js';

export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const isE = p => p.activity === 'element';

export const spec = {
  id: '16-1',
  course: '일반물리 I',
  chapter: 16,
  chapterTitle: 'Waves–I',
  module: '16.1–16.2',
  title: '진행파와 줄의 파동 속력 (Transverse Waves, Wave Speed on a Stretched String)',
  headerNote: '교재 Principles of Physics 12e · Module 16.1, 16.2',
  dt: 1 / 960,
  speed: 1,
  timeScale: 0.25,
  sceneTitle: p => (isE(p) ? '줄 요소는 위아래로만 움직인다' : '흔들기 시작한 밧줄을 따라 가는 파동'),

  assumptions: p => (isE(p) ? [
    '줄은 마찰이 없는 이상적인 줄이다. 줄이 충분히 길어 사인파가 이미 줄 전체에 퍼져 있다',
    'x = 0의 줄 요소 (string element)를 검은 구슬로 표시했다',
    '재생은 실제보다 4배 느리다',
  ] : [
    `길이 <i>l</i> = ${M.LROPE.toFixed(2)} m인 밧줄 (rope)은 처음에 곧고 정지해 있다. <i>t</i> = 0부터 왼쪽 끝을 <i>y</i> = −<i>y</i><sub>m</sub> sin <i>ωt</i>로 흔든다`,
    '밧줄은 마찰이 없는 이상적인 줄이고 중력에 의한 처짐은 무시한다',
    '파동이 오른쪽 끝에 닿으면 재생을 멈춘다. 끝에서 되돌아오는 파동은 다루지 않는다',
    '재생은 실제보다 4배 느리다',
  ]),

  equations: p => (isE(p) ? [
    { tex: 'y(x,t) = y_m\\sin(kx - \\omega t)', no: '16.1.2' },
    { tex: 'k = \\dfrac{2\\pi}{\\lambda},\\ \\omega = \\dfrac{2\\pi}{T}', no: '16.1.5, 16.1.8' },
    { tex: 'y(0,t) = -y_m\\sin\\omega t', no: '16.1.6' },
    { tex: 'u = \\dfrac{\\partial y}{\\partial t} = -\\omega y_m\\cos(kx - \\omega t)', no: '16.1.20' },
    { tex: 'v = \\dfrac{\\omega}{k} = \\lambda f', no: '16.1.13' },
  ] : [
    { tex: '\\mu = \\dfrac{m}{l}' },
    { tex: 'v = \\sqrt{\\dfrac{\\tau}{\\mu}}', no: '16.2.5' },
    { tex: 'v = \\dfrac{\\lambda}{T} = \\lambda f', no: '16.1.13' },
    { tex: 'y(x,t) = y_m\\sin(kx - \\omega t)', no: '16.1.2' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (isE(p)) {
      return [
        { id: 'y', label: '<i>x</i> = 0의 변위 (displacement)', value: (o, q, f) => `<i>y</i> = ${f(o.y0 * 100, z)} cm` },
        { id: 'u', label: '가로 속도 (transverse velocity)', value: show((o, q, f) => `<i>u</i> = ${f(o.u0, z)} m/s`) },
        { id: 'v', label: '파동 속력 (wave speed)', value: (o, q, f) => `<i>v</i> = ${f(M.wave(q).v)} m/s` },
        { id: 'k', label: '각파수 (angular wave number)', value: (o, q, f) => `<i>k</i> = ${f(M.wave(q).k)} rad/m` },
      ];
    }
    return [
      { id: 'y', label: `<i>x</i> = ${M.D.toFixed(2)} m의 변위`, value: (o, q, f) => `<i>y</i> = ${f(o.yd * 100, z)} cm` },
      { id: 'T', label: '주기 (period)', value: (o, q, f) => `<i>T</i> = ${f(1 / q.f)} s` },
      { id: 'v', label: '파동 속력 (wave speed)', value: show((o, q, f) => `<i>v</i> = ${f(M.rope(q).v)} m/s`) },
      { id: 'l', label: '파장 (wavelength)', value: show((o, q, f) => `<i>λ</i> = ${f(M.rope(q).lam)} m`) },
    ];
  },

  belowNote: p => (isE(p)
    ? '검은 구슬은 x = 0의 줄 요소다. 회색 원뿔은 한 마루 (peak)를 따라가고 파란 화살표는 파형의 속도다. 원뿔이 오른쪽 끝에 가면 한 파장 뒤의 마루로 옮긴다. 확인 뒤 줄 요소의 가로 속도 (파랑)를 그리고 아래 그래프 판에 x = 0의 변위를 시간에 따라 그린다.'
    : `회색 원뿔은 맨 앞 마루 (peak)를 따라가고 검은 구슬은 x = ${M.D.toFixed(2)} m의 줄 요소다. 구슬은 파동이 닿기 전까지 가만히 있다가 위아래로만 움직인다. 확인 뒤 바닥 눈금, 파형의 속도 (파랑), 파장을 그린다.`),

  objectives: '교재 Principles of Physics 12e, Chapter 16 Waves–I, Module 16.1 Transverse Waves, Module 16.2 Wave Speed on a Stretched String, Learning Objective 16.1.3–16.1.4, 16.1.6, 16.1.8–16.1.11, 16.2.1–16.2.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
