// 8.4–8.5 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c08에서 확인했다 (thermal energy, kinetic frictional force, external force, work done on a
// system, conservation of energy, isolated system, mechanical energy).
import * as M from './model.js';

const z = { zero: 1e-9 };

export const spec = {
  id: '8-3',
  course: '일반물리 I',
  chapter: 8,
  chapterTitle: 'Potential Energy and Conservation of Energy',
  module: '8.4–8.5',
  title: '마찰과 열에너지 (Work, Friction, and Conservation of Energy)',
  headerNote: '교재 Principles of Physics 12e · Module 8.4, 8.5',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'ramp' ? '경사로에서 미끄러져 바닥에서 멈추는 블록' : '마찰이 있는 바닥에서 끄는 블록'),

  assumptions: p => [
    `블록과 바닥${p.activity === 'ramp' ? ', 경사면' : ''} 사이의 운동 마찰 계수는 <i>μ</i><sub>k</sub>로 같다`,
    '블록을 입자로 보고 공기 저항은 없다',
    p.activity === 'ramp' ? '경사면 아래 끝에서 속력이 그대로 바닥으로 이어진다' : '끄는 힘은 수평이고 크기가 일정하다',
    p.activity === 'ramp' ? `<i>θ</i>는 tan <i>θ</i> > <i>μ</i><sub>k</sub>가 되도록 막았다 (블록이 미끄러지기 시작한다)` : '끄는 힘은 운동 마찰력보다 작지 않다',
    `<i>g</i> = ${M.G} m/s²`,
  ],

  equations: p => (p.activity === 'ramp' ? [
    { tex: '\\Delta E_{\\text{th}} = f_k d', no: '8.4.7' },
    { tex: '\\Delta E_{\\text{mec}} + \\Delta E_{\\text{th}} = 0' },
    { tex: '\\dfrac{d}{H} = \\dfrac{1}{\\mu_k} - \\dfrac{1}{\\tan\\theta}', no: '8.5.8' },
  ] : [
    { tex: 'Fd = \\Delta K + f_k d', no: '8.4.5' },
    { tex: '\\Delta E_{\\text{th}} = f_k d', no: '8.4.7' },
    { tex: 'Fd = \\Delta E_{\\text{mec}} + \\Delta E_{\\text{th}}', no: '8.4.8' },
  ]),

  readouts: p => (p.activity === 'ramp' ? [
    { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
    { id: 'U', label: '퍼텐셜 에너지', value: (o, q, f) => `<i>U</i> = ${f(o.U, z)} J` },
    { id: 'K', label: '운동에너지', value: (o, q, f) => `<i>K</i> = ${f(o.K, z)} J` },
    { id: 'E', label: '열에너지 증가 (thermal energy)', value: (o, q, f) => `Δ<i>E</i><sub>th</sub> = ${f(o.Eth, z)} J` },
  ] : [
    { id: 'x', label: '끈 거리', value: (o, q, f) => `<i>x</i> = ${f(o.x, z)} m` },
    { id: 'W', label: '끄는 힘이 한 일', value: (o, q, f) => `<i>W</i> = ${f(o.W, z)} J` },
    { id: 'K', label: '운동에너지', value: (o, q, f) => `<i>K</i> = ${f(o.K, z)} J` },
    { id: 'E', label: '열에너지 증가 (thermal energy)', value: (o, q, f) => `Δ<i>E</i><sub>th</sub> = ${f(o.Eth, z)} J` },
  ]),

  belowNote: p => (p.activity === 'ramp'
    ? '에너지 막대는 퍼텐셜 에너지 <i>U</i>(주황), 운동에너지 <i>K</i>(하늘), 늘어난 열에너지 Δ<i>E</i><sub>th</sub>(노랑), 그 합(테두리만)이다. 고립계라 합이 처음 <i>mgH</i> 그대로다.'
    : '에너지 막대는 끄는 힘이 한 일 <i>W</i>(테두리만), 운동에너지 변화 Δ<i>K</i>(하늘), 늘어난 열에너지 Δ<i>E</i><sub>th</sub>(노랑)다. <i>W</i> = Δ<i>K</i> + Δ<i>E</i><sub>th</sub>라 두 막대를 쌓으면 <i>W</i> 막대 높이가 된다.'),

  objectives: '교재 Principles of Physics 12e, Chapter 8 Potential Energy and Conservation of Energy, Module 8.4 Work Done on a System by an External Force, Module 8.5 Conservation of Energy, Learning Objective 8.4.1–8.4.2, 8.5.1–8.5.4. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
