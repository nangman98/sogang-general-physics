// 3.1–3.2 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c03에서 확인했다 (unit-vector notation, magnitude, angle, counterclockwise, vector sum, head to tail,
// commutative law, vector subtraction, displacement, right-handed coordinate system, rotate the axes, quadrant).
// 식 번호는 교재 번호다. (3.2.1)은 교재 KEY IDEAS와 Review & Summary의 3차원 꼴이다.
import { fmt, texNum as N } from '../../../core/format.js';
import { tex } from '../../../core/math.js';
import { unitVectorTex } from './vectors3d.js';
import * as M from './model.js';

const deg = x => `${fmt(x, { zero: 1e-9 })}°`;
const only2d = '<small class="missing">xy 평면 위 벡터 (<i>a<sub>z</sub></i> = 0)</small>';
const lines = (...r) => `\\begin{aligned}${r.join('\\\\')}\\end{aligned}`;

export const spec = {
  id: '3-1',
  course: '일반물리 I',
  chapter: 3,
  chapterTitle: 'Vectors',
  module: '3.1–3.2',
  title: '성분 분해와 벡터 덧셈 (Vectors and Their Components · Unit Vectors, Adding Vectors by Components)',
  headerNote: '교재 Principles of Physics 12e · Module 3.1, 3.2',
  dt: 1 / 120,
  runIf: p => p.activity === 'add',
  timeIf: () => false,
  sceneTitle: p => ({ components: '성분 분해 (resolving the vector)', add: '머리–꼬리 덧셈 (head to tail)', practice: '성분 계산' }[p.activity]),

  assumptions: p => ({
    components: [
      '눈금 한 칸은 1 m다',
      '<i>θ</i>는 +<i>x</i> 방향에서 시계 반대 방향 (counterclockwise)으로 잰 각이다',
      '오른손 좌표계 (right-handed coordinate system)다',
    ],
    add: [
      '길이와 방향을 바꾸지 않으면 벡터를 옮겨도 같은 벡터다',
      '드론은 입자로 본다. 위치는 몸체 가운데다',
      '드론 크기는 실제 비율이 아니다',
    ],
    practice: [
      '각은 +<i>x</i> 방향에서 잰다. 210°와 −150°는 같은 각이다',
      '답은 유효숫자 2–3자리로 적는다',
    ],
  }[p.activity]),

  equations: p => {
    if (p.activity === 'add') {
      return [
        { tex: '\\vec s = \\vec a + \\vec b', no: '3.1.1' },
        { html: `${tex('\\vec a + \\vec b = \\vec b + \\vec a')}<small class="missing">교환 법칙 (commutative law)</small>`, no: '3.1.2' },
        { html: `${tex('\\vec d = \\vec a - \\vec b = \\vec a + (-\\vec b)')}<small class="missing">벡터 뺄셈 (vector subtraction)</small>`, no: '3.1.4' },
      ];
    }
    const common = [
      { html: tex('a_x = a\\cos\\theta,\\quad a_y = a\\sin\\theta') + only2d, no: '3.1.5' },
      { html: tex('\\begin{aligned}a &= \\sqrt{a_x^2 + a_y^2}\\\\ \\tan\\theta &= \\frac{a_y}{a_x}\\end{aligned}') + only2d, no: '3.1.6' },
    ];
    if (p.activity === 'practice') {
      return [
        ...common,
        { tex: lines('r_x = a_x + b_x', 'r_y = a_y + b_y', 'r_z = a_z + b_z'), no: '3.2.4–3.2.6' },
        { tex: lines('d_x = a_x - b_x', 'd_y = a_y - b_y', 'd_z = a_z - b_z'), no: '3.2.7' },
        { html: `${tex('a = \\sqrt{a_x^2 + a_y^2 + a_z^2}')}<small class="missing">피타고라스 정리를 두 번 쓴 값</small>` },
      ];
    }
    const list = [
      { tex: '\\vec a = a_x\\hat{\\mathrm{i}} + a_y\\hat{\\mathrm{j}} + a_z\\hat{\\mathrm{k}}', no: '3.2.1' },
      ...common,
      { tex: 'a = \\sqrt{a_x^2 + a_y^2 + a_z^2}', live: o => lines(`a &= \\sqrt{a_x^2 + a_y^2 + a_z^2}`, `&= \\sqrt{(${N(o.a[0])})^2 + (${N(o.a[1])})^2 + (${N(o.a[2])})^2}`, `&= ${N(o.mag)}\\ \\mathrm{m}`) },
    ];
    if (p.phi > 0) {
      list.push({ tex: "a = \\sqrt{a_x^2 + a_y^2} = \\sqrt{a_x^{\\prime 2} + a_y^{\\prime 2}}", no: '3.2.8' });
      list.push({ tex: "\\theta = \\theta' + \\phi", no: '3.2.9' });
    }
    return list;
  },

  readouts: p => {
    if (p.activity === 'practice') return [];
    const vecA = { id: 'va', label: '단위 벡터 표기 (unit-vector notation)', value: o => tex(`\\vec a = ${unitVectorTex(o.a, N, 'm')}`) };
    if (p.activity === 'add') {
      const list = [
        vecA,
        { id: 'vb', label: '단위 벡터 표기 (unit-vector notation)', value: o => tex(`\\vec b = ${unitVectorTex(o.b, N, 'm')}`) },
        { id: 'drone', label: '드론의 변위 (displacement)', value: o => tex(unitVectorTex(o.drone, N, 'm')) },
        { id: 'vs', label: '벡터 합 (vector sum)', value: o => (o.done ? tex(`\\vec s = ${unitVectorTex(o.s, N, 'm')}`) : '<small>재생이 끝나면 보인다</small>') },
      ];
      if (p.diff) list.push({ id: 'vd', label: '차 벡터 (difference vector)', value: o => tex(`\\vec d = ${unitVectorTex(o.d, N, 'm')}`) });
      return list;
    }
    const list = [
      vecA,
      { id: 'mag', label: '크기 (magnitude)', value: o => `<i>a</i> = ${fmt(o.mag, { zero: 1e-9 })} m` },
      { id: 'theta', label: 'xy 평면에서 각 (angle)', value: o => (Number.isNaN(o.theta) ? '<i>θ</i> 정의 안 됨' : `<i>θ</i> = ${deg(o.theta)}<br><small>= ${fmt(o.theta * M.DEG, { zero: 1e-9 })} rad</small>`) },
    ];
    if (p.phi > 0) list.push({ id: 'prime', label: '돌린 축의 성분 (components)', value: o => `<i>a′<sub>x</sub></i> = ${fmt(o.aPrime[0], { zero: 1e-9 })} m<br><i>a′<sub>y</sub></i> = ${fmt(o.aPrime[1], { zero: 1e-9 })} m` });
    return list;
  },

  belowNote: p => {
    if (p.activity === 'add') return `재생 전에 ①–③ 가운데 ${tex('\\vec s = \\vec a + \\vec b')}를 고른다. 드론은 ${tex('\\vec a')}만큼 날아간 뒤 ${tex('\\vec b')}만큼 날아간다. 출발점에서 도착점으로 그은 화살표가 벡터 합이다.`;
    if (p.activity === 'practice') return '주어진 양으로 성분, 크기와 각, 성분별 합을 구한다. 확인하면 장면에 답이 그려진다.';
    const a = M.vectorA(p), t = M.angleOf(a[0], a[1]), c = M.calculatorAngle(a[0], a[1]);
    const shadow = Math.abs(a[2]) > 1e-9 ? ` ${tex('a_z \\ne 0')}이면 <i>θ</i>는 ${tex('\\vec a')}를 xy 평면에 내린 그림자 ${tex('a_x\\hat{\\mathrm{i}} + a_y\\hat{\\mathrm{j}}')}의 방향이다.` : '';
    if (a[0] < 0 && Number.isFinite(c)) return `${tex('a_x < 0')}이므로 계산기의 ${tex('\\tan^{-1}(a_y/a_x)')} = ${deg(c)}는 <i>θ</i>가 아니다. 180°를 더하거나 빼서 <i>θ</i> = ${deg(t)}를 얻는다.${shadow}`;
    return `성분의 부호는 그 축의 어느 쪽을 가리키는지 나타낸다.${shadow}`;
  },

  objectives: '교재 Principles of Physics 12e, Chapter 3 Vectors, Module 3.1 Vectors and Their Components, Module 3.2 Unit Vectors, Adding Vectors by Components. Learning Objective 3.1.1 (교환 법칙까지, 결합 법칙은 다루지 않는다), 3.1.2–3.1.5, 3.2.1–3.2.3. 식 번호는 교재 번호다. 화면의 문제는 교재 문제를 옮기지 않았다.',
};
