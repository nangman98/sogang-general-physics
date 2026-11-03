// 1-1 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
import { fmt } from '../../../core/format.js';
import * as M from './model.js';

const about = o => (o.approx ? '약 ' : '');
export const texNum = x => {
  if (x !== 0 && (Math.abs(x) >= 1e3 || Math.abs(x) < 1e-2)) {
    let e = Math.floor(Math.log10(Math.abs(x)) + 1e-9), m = (x / 10 ** e).toPrecision(3);
    if (Math.abs(parseFloat(m)) >= 10) { e += 1; m = (x / 10 ** e).toPrecision(3); }
    return `${m}\\times10^{${e}}`;
  }
  return x.toPrecision(3);                       // keeps trailing zeros: 3 significant figures
};
const unitTex = (u, d) => `\\mathrm{${u}}${d > 1 ? `^{${d}}` : ''}`;
const POW = ['', '', '²', '³'];

export const spec = {
  id: '1-1',
  course: '일반물리 I',
  chapter: 1,
  chapterTitle: 'Measurement',
  module: '1.1–1.3',
  title: '길이·시간·질량과 SI 단위 (Measuring Things, Time, Mass)',
  headerNote: '교재 Principles of Physics 12e · Module 1.1, 1.2, 1.3',
  playLabel: '크기 키우며 보기',
  dt: 1 / 60,
  runIf: p => p.activity === 'scale',
  sceneTitle: p => ({ scale: '크기 비교 (order of magnitude)', convert: '단위 변환 (changing units)', density: '밀도 (density)' }[p.activity] ?? '크기 비교 (order of magnitude)'),

  assumptions: p => ({
    scale: [
      'slider의 <i>n</i>이 1 늘면 10배다',
      p.quantity === 'time' ? '시간은 그동안 빛이 가는 거리 <i>ct</i>로 그린다' : p.quantity === 'mass' ? '질량은 같은 질량의 물 정육면체로 그린다' : '공은 지름, 막대는 거리를 나타낸다',
      '“약”이 붙은 값은 대략적인 전형값이다',
    ],
    convert: ['1 m = 100 cm = 1000 mm', '넓이는 길이 인자를 제곱, 부피는 세제곱한다'],
    density: ['물질은 균일하다', `저울은 두 질량 차가 큰 쪽의 ${M.LEVEL_TOLERANCE * 100}% 안이면 수평이다`, '밀도는 20 °C 부근 값이다'],
  }[p.activity]),

  equations: p => ({
    scale: p.quantity === 'time'
      ? [{ tex: 'L = ct' }, { tex: 'c = 299\\,792\\,458\\ \\mathrm{m/s}' }, { tex: '1\\ \\mathrm{ns} = 10^{-9}\\ \\mathrm{s}' }]
      : p.quantity === 'mass'
        ? [{ tex: 'L = (m/\\rho)^{1/3}' }, { tex: '\\rho_{\\text{water}} = 1.00\\ \\mathrm{g/cm^3}' }, { tex: '1\\ \\mathrm{u} = 1.660\\,538\\,86\\times10^{-27}\\ \\mathrm{kg}', no: '1.3.1' }]
        : [{ tex: '1\\ \\mathrm{km} = 10^{3}\\ \\mathrm{m}' }, { tex: '1\\ \\mathrm{nm} = 10^{-9}\\ \\mathrm{m}' }, { html: '1 m = 빛이 진공에서 1/299\u202f792\u202f458 s 동안 가는 거리' }],
    convert: [{ tex: '\\dfrac{100\\ \\mathrm{cm}}{1\\ \\mathrm{m}} = 1' }, { tex: '1\\ \\mathrm{m^2} = (100\\ \\mathrm{cm})^2 = 10^{4}\\ \\mathrm{cm^2}' }, { tex: '1\\ \\mathrm{m^3} = (100\\ \\mathrm{cm})^3 = 10^{6}\\ \\mathrm{cm^3}' }],
    density: [{ tex: '\\rho = \\dfrac{m}{V}', no: '1.3.2' }, { tex: 'V = a^3,\\quad m = \\rho a^3' }],
  }[p.activity]),

  readouts: p => {
    if (p.activity === 'scale') {
      const q = M.QUANTITIES[p.quantity];
      const third = p.quantity === 'time'
        ? { id: 'ct', label: '빛이 가는 거리', value: (o, _, f, tex) => tex(`ct = ${texNum(o.sceneLength_m)}\\ \\mathrm{m}`) }
        : p.quantity === 'mass'
          ? { id: 'cube', label: '같은 질량 물 정육면체의 한 변', value: (o, _, f, tex) => tex(`L = ${texNum(o.sceneLength_m)}\\ \\mathrm{m}`) }
          : { id: 'ratio', label: '가장 가까운 물체와의 비', value: o => `${fmt(o.nearest.value / o.value)}배` };
      return [
        { id: 'size', label: q.label, value: (o, _, f, tex) => tex(`${q.symbol} = ${texNum(o.value)}\\ \\mathrm{${q.unit}}`) },
        { id: 'prefix', label: 'SI 접두어 (prefix)', value: o => (o.prefix ? `${o.prefix.text}${o.prefix.name ? ` <small>(${o.prefix.ko}, ${o.prefix.name})</small>` : ''}` : '표 1.1.2 범위 밖') },
        third,
        { id: 'near', label: '가장 가까운 물체', value: o => `${o.nearest.name}<br><small>${about(o.nearest)}${fmt(o.nearest.value)} ${q.unit}</small>` },
      ];
    }
    if (p.activity === 'convert') {
      const d = Number(p.dim);
      return [
        { id: 'factor', label: '변환 인자 (conversion factor)', value: (o, _, f, tex) => tex(`\\left(\\dfrac{${o.perUnit}\\ \\mathrm{${o.unit}}}{1\\ \\mathrm{m}}\\right)${o.dim > 1 ? `^{${o.dim}}` : ''} = 10^{${o.exp}}`) },
        { id: 'count', label: `1 m${POW[d]} 안의 ${p.unit}${POW[d]} 칸 수`, value: o => `10<sup>${o.exp}</sup>개` },
        { id: 'chain', label: '사슬 변환 (chain-link conversion)', value: (o, _, f, tex) => tex(`1\\ ${unitTex('m', o.dim)} \\times \\left(\\dfrac{${o.perUnit}\\ \\mathrm{${o.unit}}}{1\\ \\mathrm{m}}\\right)${o.dim > 1 ? `^{${o.dim}}` : ''} = 10^{${o.exp}}\\ ${unitTex(o.unit, o.dim)}`) },
      ];
    }
    return [
      { id: 'A', label: '왼쪽', value: (o, _, f, tex) => `${o.A.name}<br>` + tex(`V = ${texNum(o.VA)}\\ \\mathrm{cm^3}`) + '<br>' + tex(`m = ${texNum(o.mA)}\\ \\mathrm{g}`) },
      { id: 'B', label: '오른쪽', value: (o, _, f, tex) => `${o.B.name}<br>` + tex(`V = ${texNum(o.VB)}\\ \\mathrm{cm^3}`) + '<br>' + tex(`m = ${texNum(o.mB)}\\ \\mathrm{g}`) },
      { id: 'dm', label: '질량 차', value: (o, _, f, tex) => tex(`m_B - m_A = ${texNum(o.mB - o.mA)}\\ \\mathrm{g}`) },
      { id: 'ratio', label: '부피 비와 밀도 비', value: (o, _, f, tex) => tex(`V_B/V_A = ${texNum(o.VB / o.VA)}`) + '<br>' + tex(`\\rho_A/\\rho_B = ${texNum(o.A.rho / o.B.rho)}`) },
    ];
  },

  belowNote: p => ({
    scale: '정육면체 한 변은 한 단계마다 10배다. 파란 상자가 지금 크기이고, 크기를 키우면 앞 단계의 상자와 물체가 점처럼 작아진다.',
    convert: '사슬 변환 (chain-link conversion)은 1과 같은 인자를 곱하므로 양은 그대로이고 단위만 바뀐다. 넓이와 부피에서는 길이 인자를 제곱·세제곱한다.',
    density: '두 질량이 같으려면 부피 비 <i>V<sub>B</sub></i>/<i>V<sub>A</sub></i>가 밀도 비 <i>ρ<sub>A</sub></i>/<i>ρ<sub>B</sub></i>와 같아야 한다. 오른쪽 한 변을 바꿔 저울을 수평으로 만들어 보자.',
  }[p.activity]),

  objectives: '교재 Principles of Physics 12e, Chapter 1 Measurement. Module 1.1 (Learning Objectives 1.1.1–1.1.4), Module 1.2 (1.2.1–1.2.2), Module 1.3 (1.3.1–1.3.2). 물체 값과 출처는 화면 폴더의 README에 있다.',
};
