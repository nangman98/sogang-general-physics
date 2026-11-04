// 3.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c03에서 확인했다 (scalar product, dot product, vector product, cross product, right-hand rule,
// magnitude, component, angle between, perpendicular, parallel, antiparallel, scalar, vector, unit-vector notation).
// 식 번호는 교재 번호다. 단위 벡터끼리의 곱 î × ĵ = k̂ 등은 교재 본문에 번호 없이 나온다.
import { fmt, texNum as N } from '../../../core/format.js';
import { tex } from '../../../core/math.js';
import { unitVectorTex } from './vectors3d.js';
import * as M from './model.js';

const f = x => fmt(x, { zero: 1e-9 });
const deg = x => (Number.isFinite(x) ? `${f(x)}°` : '정의 안 됨');
const lines = (...r) => `\\begin{aligned}${r.join('\\\\')}\\end{aligned}`;
const P = x => `(${N(x)})`;
export const C_SCALE = 0.5;                    // c = a × b is drawn at half length

export const spec = {
  id: '3-2',
  course: '일반물리 I',
  chapter: 3,
  chapterTitle: 'Vectors',
  module: '3.3',
  title: '내적과 외적 (Multiplying Vectors)',
  headerNote: '교재 Principles of Physics 12e · Module 3.3',
  sceneTitle: p => ({ dot: '스칼라 곱 (scalar product)', cross: '벡터 곱 (vector product)', practice: '곱 계산' }[p.activity]),

  assumptions: p => ({
    dot: [
      '벡터는 단위 없는 수로 둔다',
      '<i>ϕ</i>는 두 벡터의 방향 사이 각이다',
      '스칼라 곱의 결과는 스칼라 (scalar)다',
    ],
    cross: [
      '<i>ϕ</i>는 두 각 가운데 작은 각이다',
      '벡터 곱의 결과는 벡터이고 두 벡터가 이루는 평면에 수직 (perpendicular)이다',
      `${tex('\\vec c')}는 길이를 1/2로 줄여 그렸다`,
    ],
    practice: [
      '벡터는 단위 없는 수로 둔다',
      '스칼라 <i>s</i>를 곱한 벡터의 크기는 |<i>s</i>|배다. <i>s</i> < 0이면 방향이 반대다',
      '답은 유효숫자 2–3자리로 적는다',
    ],
  }[p.activity]),

  equations: p => {
    const dot = [
      { no: '3.3.1', tex: '\\vec a\\cdot\\vec b = ab\\cos\\phi', live: o => (Number.isFinite(o.phi) ? lines('\\vec a\\cdot\\vec b &= ab\\cos\\phi', `&= ${P(o.aMag)}${P(o.bMag)}\\cos ${N(o.phi)}^\\circ`, `&= ${N(o.dot)}`) : '\\vec a\\cdot\\vec b = 0') },
      { no: '3.3.2', tex: '\\vec a\\cdot\\vec b = (a\\cos\\phi)(b) = (a)(b\\cos\\phi)' },
      { no: '3.3.4', tex: '\\vec a\\cdot\\vec b = a_xb_x + a_yb_y + a_zb_z', live: o => lines('\\vec a\\cdot\\vec b &= a_xb_x + a_yb_y + a_zb_z', `&= ${P(o.a[0])}${P(o.b[0])} + ${P(o.a[1])}${P(o.b[1])} + ${P(o.a[2])}${P(o.b[2])}`, `&= ${N(o.dot)}`) },
    ];
    const cross8 = { no: '3.3.8', tex: lines('\\vec a\\times\\vec b &= (a_yb_z - b_ya_z)\\hat{\\mathrm{i}}', '&\\quad + (a_zb_x - b_za_x)\\hat{\\mathrm{j}}', '&\\quad + (a_xb_y - b_xa_y)\\hat{\\mathrm{k}}') };
    if (p.activity === 'dot') return dot;
    if (p.activity === 'cross') {
      return [
        { no: '3.3.5', tex: 'c = ab\\sin\\phi', live: o => (Number.isFinite(o.phi) ? lines('c &= ab\\sin\\phi', `&= ${P(o.aMag)}${P(o.bMag)}\\sin ${N(o.phi)}^\\circ`, `&= ${N(o.cMag)}`) : 'c = 0') },
        { no: '3.3.6', tex: '\\vec b\\times\\vec a = -(\\vec a\\times\\vec b)' },
        cross8,
      ];
    }
    return [
      { no: '3.3.1', tex: '\\vec a\\cdot\\vec b = ab\\cos\\phi' },
      { no: '3.3.4', tex: '\\vec a\\cdot\\vec b = a_xb_x + a_yb_y + a_zb_z' },
      { no: '3.3.5', tex: 'c = ab\\sin\\phi' },
      cross8,
      { tex: '\\hat{\\mathrm{i}}\\times\\hat{\\mathrm{j}} = \\hat{\\mathrm{k}},\\quad \\hat{\\mathrm{i}}\\times\\hat{\\mathrm{i}} = 0' },
    ];
  },

  readouts: p => {
    if (p.activity === 'practice') return [];
    const mags = { id: 'mag', label: '크기 (magnitude)', value: o => `<i>a</i> = ${f(o.aMag)}<br><i>b</i> = ${f(o.bMag)}` };
    const phi = { id: 'phi', label: '사이 각 (angle between)', value: o => `<i>ϕ</i> = ${deg(o.phi)}` };
    if (p.activity === 'dot') {
      const comp = p.proj === 'b'
        ? { id: 'comp', label: '<span class="vsym">a</span> 방향 성분 (component)', value: o => `<i>b</i> cos <i>ϕ</i> = ${Number.isFinite(o.bAlongA) ? f(o.bAlongA) : '—'}` }
        : { id: 'comp', label: '<span class="vsym">b</span> 방향 성분 (component)', value: o => `<i>a</i> cos <i>ϕ</i> = ${Number.isFinite(o.aAlongB) ? f(o.aAlongB) : '—'}` };
      return [mags, phi, { id: 'dot', label: '스칼라 곱 (scalar product)', value: o => tex(`\\vec a\\cdot\\vec b = ${N(o.dot)}`) }, comp];
    }
    return [
      { id: 'va', label: '단위 벡터 표기 (unit-vector notation)', value: o => tex(`\\vec a = ${unitVectorTex(o.a, N)}`) },
      { id: 'vb', label: '단위 벡터 표기 (unit-vector notation)', value: o => tex(`\\vec b = ${unitVectorTex(o.b, N)}`) },
      phi,
      { id: 'c', label: '벡터 곱의 크기 (magnitude)', value: o => `<i>c</i> = ${f(o.cMag)}` },
    ];
  },

  belowNote: p => {
    if (p.activity === 'dot') {
      const a = M.vectorA(p), b = M.vectorB(p), d = M.dot(a, b);
      const sign = Math.abs(d) < 1e-9 ? '두 벡터가 수직 (perpendicular)이라 스칼라 곱이 0이다.' : d > 0 ? '<i>ϕ</i> < 90°라 스칼라 곱이 양수다.' : '<i>ϕ</i> > 90°라 성분이 반대쪽을 향하고 스칼라 곱이 음수다.';
      return `한 벡터의 머리에서 다른 벡터 방향의 직선에 수선을 내리면 그 방향 성분이 남는다. ${sign}`;
    }
    if (p.activity === 'cross') return `오른손 네 손가락을 ${tex('\\vec a')}에서 ${tex('\\vec b')} 쪽으로 작은 각을 따라 감으면 엄지가 ${tex('\\vec c = \\vec a\\times\\vec b')} 방향이다. ①–④ 가운데 하나를 고른 뒤 확인하면 손과 ${tex('\\vec c')}가 나타난다.`;
    return '문제를 풀고 확인하면 장면에 답이 그려진다.';
  },

  objectives: '교재 Principles of Physics 12e, Chapter 3 Vectors, Module 3.3 Multiplying Vectors, Learning Objective 3.3.1–3.3.7. 식 번호는 교재 번호다. 화면의 문제는 교재 문제를 옮기지 않았다.',
};
