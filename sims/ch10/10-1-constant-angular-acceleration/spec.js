// 10.2–10.3 화면 글. 한국어 + 괄호 안 교재 영어 용어, 기호·단위·식은 교재 표기 (05_디자인_기준.md §화면 글).
// 영어 용어는 교재 c10에서 확인했다 (angular velocity, angular acceleration, angular position, reference line,
// tangential component, radial component, radian measure).
export const ui = { revealed: false };
const hidden = '<small>확인 뒤에 보인다</small>';
const z = { zero: 1e-9 };

export const spec = {
  id: '10-1',
  course: '일반물리 I',
  chapter: 10,
  chapterTitle: 'Rotation',
  module: '10.2–10.3',
  title: '등각가속도 회전 (Rotation with Constant Angular Acceleration)',
  headerNote: '교재 Principles of Physics 12e · Module 10.2, 10.3',
  dt: 1 / 240,
  speed: 1,
  sceneTitle: p => (p.activity === 'linear' ? '바퀴 위 점의 선속도와 가속도' : '각가속도가 일정한 바퀴'),

  assumptions: p => [
    '바퀴는 고정된 축을 중심으로 돈다',
    '시계 반대 방향 (counterclockwise)이 + 방향이다',
    `<i>t</i> = 0에 기준선 (reference line)은 수평 (<i>θ</i><sub>0</sub> = 0)이다`,
    '각은 라디안 (radian)으로 잰다',
    ...(p.activity === 'linear' ? ['표시점은 기준선 위 반지름 <i>r</i>에 있다'] : []),
  ],

  equations: p => (p.activity === 'linear' ? [
    { tex: 'v = \\omega r', no: '10.3.2' },
    { tex: 'a_t = \\alpha r', no: '10.3.6' },
    { tex: 'a_r = \\dfrac{v^2}{r} = \\omega^2 r', no: '10.3.7' },
  ] : [
    { tex: '\\omega = \\omega_0 + \\alpha t', no: '10.2.1' },
    { tex: '\\theta - \\theta_0 = \\omega_0 t + \\tfrac{1}{2}\\alpha t^2', no: '10.2.2' },
  ]),

  readouts: p => {
    const show = fn => (o, q, f) => (ui.revealed ? fn(o, q, f) : hidden);
    if (p.activity === 'linear') {
      return [
        { id: 't', label: '시간 (time)', value: (o, q, f) => `<i>t</i> = ${f(o.t, z)} s` },
        { id: 'w', label: '각속도 (angular velocity)', value: (o, q, f) => `<i>ω</i> = ${f(o.w, z)} rad/s` },
        { id: 'v', label: '표시점 속력', value: show((o, q, f) => `<i>v</i> = ${f(Math.abs(o.v), z)} m/s`) },
        { id: 'a', label: '표시점 가속도', value: show((o, q, f) => `<i>a</i><sub>t</sub> = ${f(o.at, z)} m/s²<br><i>a</i><sub>r</sub> = ${f(o.ar, z)} m/s²`) },
      ];
    }
    return [
      { id: 't', label: '시간 (time)', value: (o, q, f) => `<i>t</i> = ${f(o.t, z)} s` },
      { id: 'w', label: '각속도 (angular velocity)', value: show((o, q, f) => `<i>ω</i> = ${f(o.w, z)} rad/s`) },
      { id: 'th', label: '회전각 (angular position)', value: show((o, q, f) => `<i>θ</i> = ${f(o.th, z)} rad<br><small>${f(o.th / (2 * Math.PI), z)} rev</small>`) },
    ];
  },

  belowNote: p => `바퀴의 흰 선이 기준선이다. 뒤 그래프 판은 각속도 <i>ω</i>–시간 <i>t</i>다.${p.activity === 'linear' ? ' 표시점의 파란 화살표는 속도 (1 m/s당 0.8 m), 분홍 화살표는 접선 가속도 <i>a</i><sub>t</sub>와 지름 가속도 <i>a</i><sub>r</sub> (1 m/s²당 0.5 m)다.' : ' 재생은 묻는 시각 <i>t</i><sub>1</sub>에서 멈춘다.'}`,

  objectives: '교재 Principles of Physics 12e, Chapter 10 Rotation, Module 10.2 Rotation with Constant Angular Acceleration, Module 10.3 Relating the Linear and Angular Variables, Learning Objective 10.2.1, 10.3.1–10.3.2. 식 번호는 교재 번호다. 화면의 값과 문제는 교재 문제를 옮기지 않았다.',
};
