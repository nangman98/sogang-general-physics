// 6.1 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c06에서 확인했다 (frictional force, static frictional force, kinetic frictional force,
// coefficient of static friction, coefficient of kinetic friction, normal force, breaks away, applied force).
import { tex } from '../../../core/math.js';
import { fmt } from '../../../core/format.js';
import * as M from './model.js';

// Prediction state shared with view.js. Asked quantities stay hidden until "확인".
export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };
const kindWord = o => (o.kind === 'kinetic' ? '운동 마찰' : '정지 마찰');

export const spec = {
  id: '6-1',
  course: '일반물리 I',
  chapter: 6,
  chapterTitle: 'Force and Motion—II',
  module: '6.1',
  title: '마찰 (Friction)',
  headerNote: '교재 Principles of Physics 12e · Module 6.1',
  dt: 1 / 240,
  // The block slides a few metres in a few seconds, so this screen starts at physical time (1×).
  speed: 1,
  sceneTitle: p => ({
    ramp: '당기는 힘을 늘릴 때의 마찰력',
    angled: '비스듬히 가한 힘과 마찰력',
    incline: '빗면 위 블록과 임계각',
  }[p.activity]),

  assumptions: p => [
    '마른 두 면 사이의 마찰이다',
    '<i>μ</i><sub>k</sub>는 미끄러지는 속력과 상관없다',
    '<i>μ</i><sub>k</sub> ≤ <i>μ</i><sub>s</sub>',
    `<i>g</i> = ${M.G} m/s²`,
    ...({
      ramp: [`수평으로 당기는 힘은 1 s마다 ${M.RATE} N씩 커진다`, '+<i>x</i>는 당기는 쪽이다'],
      angled: ['블록은 처음에 정지해 있다', '+<i>x</i>는 수평 오른쪽, +<i>y</i>는 위쪽이다'],
      incline: ['블록은 처음에 정지해 있다', '+<i>x</i>는 빗면 아래쪽이다'],
    }[p.activity]),
  ],

  equations: p => {
    const row = (t, note, no) => ({ html: `${tex(t)}<small class="missing">${note}</small>`, no });
    const common = [{ tex: 'f_{s,\\max} = \\mu_s F_N', no: '6.1.1' }, { tex: 'f_k = \\mu_k F_N', no: '6.1.2' }];
    if (p.activity === 'ramp') return [...common, row('F - f = ma', '수평 방향'), row('F_N - mg = 0', '연직 방향')];
    if (p.activity === 'angled') {
      return [...common,
        p.dir === 'pull' ? row('F_N + F\\sin\\theta - mg = 0', '연직 방향') : row('F_N - mg - F\\sin\\theta = 0', '연직 방향', '6.1.4'),
        row('F\\cos\\theta - f = ma', '수평 방향')];
    }
    return [...common, row('mg\\sin\\theta - f = ma', '빗면 방향'), row('F_N - mg\\cos\\theta = 0', '빗면에 수직')];
  },

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (p.activity === 'ramp') {
      return [
        { id: 'F', label: '가한 힘 (applied force)', value: (o, q, f) => `<i>F</i> = ${f(o.F, z)} N` },
        { id: 'f', label: '마찰력 (frictional force)', value: (o, q, f) => `<i>f</i> = ${f(o.f, z)} N<br><small>${kindWord(o)}</small>` },
        { id: 'FN', label: '수직항력 (normal force)', value: (o, q, f) => `<i>F</i><sub>N</sub> = ${f(o.FN)} N` },
        { id: 'v', label: '속력 (speed)', value: (o, q, f) => `<i>v</i> = ${f(o.v, z)} m/s` },
      ];
    }
    return [
      { id: 'Fg', label: '중력 (gravitational force)', value: (o, q, f) => `<i>F</i><sub>g</sub> = ${f(q.m * M.G)} N` },
      { id: 'FN', label: '수직항력 (normal force)', value: show((o, q, f) => `<i>F</i><sub>N</sub> = ${f(o.FN)} N`) },
      { id: 'f', label: '마찰력 (frictional force)', value: show((o, q, f) => `<i>f</i> = ${f(o.f, z)} N<br><small>${kindWord(o)}</small>`) },
      { id: 'a', label: '가속도 (acceleration)', value: show((o, q, f) => `<i>a</i> = ${f(o.a, z)} m/s²`) },
    ];
  },

  belowNote: p => {
    const scale = `화살표 길이는 힘 1 m = ${fmt(1 / M.forceScale(p))} N이다.`;
    return {
      ramp: `당기는 힘 <i>F</i>가 커지는 동안 정지 마찰력 (static frictional force)이 같은 크기로 버틴다. 최대 정지 마찰력을 넘으면 블록이 미끄러지기 시작하고 (breaks away) 운동 마찰력 (kinetic frictional force)이 작용한다. 뒤 그래프 판의 점선은 <i>F</i>, 실선은 마찰력 <i>f</i>다. ${scale}`,
      angled: `자유물체도 (free-body diagram)의 점선은 가한 힘의 성분 <i>F</i> cos <i>θ</i>와 <i>F</i> sin <i>θ</i>이다. 확인 전에는 구할 마찰력을 회색 고정 길이로 그린다. ${scale}`,
      incline: `자유물체도의 점선은 중력의 빗면 방향 성분 <i>mg</i> sin <i>θ</i>와 수직 성분 <i>mg</i> cos <i>θ</i>이다. 확인하면 임계각 <i>θ</i><sub>c</sub>의 빗면을 점선으로 겹쳐 그린다. ${scale}`,
    }[p.activity];
  },

  objectives: '교재 Principles of Physics 12e, Chapter 6 Force and Motion—II, Module 6.1 Friction, Learning Objective 6.1.1–6.1.3. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
