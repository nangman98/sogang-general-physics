// 4.5 Uniform Circular Motion — 3D view. A car (core/models3d.js) goes around a circular track on the
// measuring board of the approved 4-2 scene (board, legs, lighting, fixed-size HTML labels).
// Velocity and acceleration arrows are on by default here because the vectors are the topic (README).
import { fmt, fmtFixed, texNum as N } from '../../../core/format.js';
import { car } from '../../../core/models3d.js';
import { quizBox } from '../../../core/quiz.js';
import * as M from './model.js';
import { ui, SCALE, sizeState } from './spec.js';

// Choice arrows lie over the dark board, so they use a light slate (not a quantity colour).
const COL = { r: 0x000000, v: 0x0072b2, a: 0xcc79a7, choice: 0xc6d0db, sense: 0xd8e5ee };
const NUM = ['①', '②', '③', '④'];
const H = 2.1;                                   // m, arrows start above the car roof
const ROAD = 1.8;                                // m, half width of the road
const MSG_V = {
  null: '맞다. 속도는 원의 접선 방향이고 자동차가 가는 쪽을 향한다.',
  backward: '접선 방향은 맞지만 반대쪽이다. 자동차가 도는 방향을 보자.',
  inward: '그 화살표는 원의 중심을 향한다. 속도는 반지름에 수직인 접선 방향이다.',
  outward: '그 화살표는 중심에서 멀어지는 방향이다. 속도는 반지름에 수직인 접선 방향이다.',
};
const MSG_A = {
  null: '맞다. 구심 가속도 (centripetal acceleration)는 늘 원의 중심을 향한다. 도는 방향과 상관없다.',
  forward: '그 화살표는 속도 방향이다. 속력이 일정하므로 접선 방향 가속도는 없다. 속도의 방향이 중심 쪽으로 바뀐다.',
  backward: '속력이 줄지 않으므로 속도와 반대 방향 가속도는 없다. 가속도는 중심을 향한다.',
  outward: '바깥쪽이 아니다. 속도의 방향이 중심 쪽으로 바뀌므로 가속도는 중심을 향한다.',
};

export function view(stage, ctx) {
  const { THREE, v3 } = stage;
  const tex = ctx.tex;
  let cur = null, dIndex = 0, sIndex = 0, sFeedback = null;

  // ---------- scene: board, circular road, centre post ----------
  function scene(r) {
    const g = stage.group, half = r + 3;
    stage.board(g, -half, half, 2 * half, 0);
    stage.floorPlane(-1.45);
    for (const x of [-half + 2.5, half - 2.5]) for (const z of [-half + 2.5, half - 2.5]) stage.mesh(g, new THREE.CylinderGeometry(0.6, 0.75, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
    const step = half > 30 ? 10 : 5, grid = [], ticks = [];
    for (let k = Math.ceil(-half / step); k * step <= half - 1; k++) {
      const s = k * step;
      grid.push([s, 0.012, -half + 1], [s, 0.012, half - 1], [-half + 1, 0.012, s], [half - 1, 0.012, s]);
      ticks.push([s, 0.014, half - 0.4], [s, 0.014, half - 1.1]);
      stage.label(`${fmtFixed(s, 0)} m`, [s, 0.1, half - 0.15], 'measure');
    }
    const seg = (pts, color, opacity = 1) => g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(v3)), new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })));
    seg(grid, 0xc2d5e2, 0.2); seg(ticks, 0xd8e5ee);
    // Road: a flat ring with light edge lines and a dashed centre line on the radius r.
    const road = stage.mesh(g, new THREE.RingGeometry(r - ROAD, r + ROAD, 160, 1), stage.lit(0x5d6e7e, 0.1, 0.85), [0, 0.02, 0], [-Math.PI / 2, 0, 0]);
    road.castShadow = false;
    const circle = (rad, n = 160) => Array.from({ length: n + 1 }, (_, i) => [rad * Math.cos(2 * Math.PI * i / n), 0.03, -rad * Math.sin(2 * Math.PI * i / n)]);
    stage.line(circle(r - ROAD + 0.15), 0xd8e5ee); stage.line(circle(r + ROAD - 0.15), 0xd8e5ee);
    stage.line(circle(r), 0xeef1f5, { dashed: true, dash: 1.2, gap: 1.0, opacity: 0.8 });
    // Centre post.
    stage.mesh(g, new THREE.CylinderGeometry(0.22, 0.3, 1.4, 24), stage.lit(0x8c9ca9, 0.6, 0.3), [0, 0.7, 0]);
    stage.mesh(g, new THREE.SphereGeometry(0.34, 24, 16), stage.lit(0xf4f8fc, 0.3, 0.3), [0, 1.5, 0]);
    stage.label('원의 중심 (center)', [0, 2.3, 0], 'station', { priority: -1 });
    const body = car(stage, { length: 4.2 }); g.add(body);
    const radius = stage.line([[0, 0.12, 0], [r, 0.12, 0]], COL.r);
    radius.frustumCulled = false;
    const rTag = stage.label('<i>r</i>', [r / 2, 0.4, 0], 'axis', { dy: 0, priority: -1 });
    return {
      half,
      place(s) {
        const [x, , zz] = s.position;
        body.position.set(x, 0, zz);
        body.rotation.y = Math.atan2(-s.velocity[2], s.velocity[0]);
        const pos = radius.geometry.attributes.position;
        pos.setXYZ(1, x, 0.12, zz); pos.needsUpdate = true;
        rTag.move([x / 2, 0.45, zz / 2]);
      },
    };
  }

  // Arrow with a KaTeX name past its head.
  function named(color, radius, html, priority = 1) {
    const a = stage.arrow(color, { radius });
    a.visible = false;
    const l = stage.label(html, [0, 0, 0], 'tag', { dy: 0, priority });
    l.node.dataset.off = '1';
    return {
      set(origin, vec, len, on = true) {
        if (!on || !(len > 0.05)) { a.visible = false; l.node.dataset.off = '1'; return; }
        a.update(origin, vec, len);
        const n = Math.hypot(...vec);
        l.node.dataset.off = '';
        l.move(origin.map((c, i) => c + vec[i] / n * (len + 1.0)));
      },
    };
  }
  // Right-angle mark where v and a meet: a small square in the track plane.
  function rightAngle() {
    const l = stage.line([[0, 0, 0], [0, 0, 0], [0, 0, 0]], 0x1a1a1a);
    l.frustumCulled = false;
    return {
      set(origin, v, a, on = true) {
        l.visible = on; if (!on) return;
        const s = 1.2, u = v.map(c => c / Math.hypot(...v) * s), w = a.map(c => c / Math.hypot(...a) * s);
        const pos = l.geometry.attributes.position;
        pos.setXYZ(0, ...origin.map((c, i) => c + u[i])); pos.setXYZ(1, ...origin.map((c, i) => c + u[i] + w[i])); pos.setXYZ(2, ...origin.map((c, i) => c + w[i]));
        pos.needsUpdate = true;
      },
    };
  }
  // Curved arrow around the centre showing the turning sense.
  function turnSense(dir, rad = 5.5) {
    const n = 64, a0 = 0.3, a1 = 0.3 + 1.6 * Math.PI;
    const pts = Array.from({ length: n + 1 }, (_, i) => { const t = a0 + (a1 - a0) * i / n; return [rad * Math.cos(t), 0.4, -rad * Math.sin(t)]; });
    if (dir < 0) pts.reverse();
    stage.line(pts, COL.sense);
    const end = pts[n], before = pts[n - 2];
    const head = stage.mesh(stage.group, new THREE.ConeGeometry(0.45, 1.2, 18), stage.flat(COL.sense), end, [0, 0, 0], false);
    head.quaternion.setFromUnitVectors(v3([0, 1, 0]), v3(end.map((c, i) => c - before[i])).normalize());
    stage.label('도는 방향', [0, 0.6, rad + 1.2], 'station', { priority: -1 });
  }
  function home(r, elev = 1.0) {
    // Aim a little in front of the centre so the near board edge and its ticks stay above the legend. The view comes
    // from the front right, so the car at (r, 0, 0) shows its side at t = 0 instead of its back.
    const d = 3.05 * (r + 3);
    stage.setHome({ target: [0, 0, 0.2 * (r + 3)], direction: [0.75, elev, 1], distance: d, minDistance: d * 0.25, maxDistance: d * 2.5 });
  }

  // ---------- watch ----------
  function buildWatch(p) {
    const parts = scene(p.r);
    // Magnitudes beside the names (constant in uniform circular motion); the prediction activities keep them hidden.
    const val = t => ` <span class="val">${t}</span>`;
    const vA = named(COL.v, 0.13, tex('\\vec v') + val(`${fmt(p.v)} m/s`), 3), aA = named(COL.a, 0.13, tex('\\vec a') + val(`${fmt(M.centripetal(p.v, p.r))} m/s²`), 3), mark = rightAngle();
    cur = {
      render(o, q) {
        parts.place(o);
        const base = [o.position[0], H, o.position[2]];
        vA.set(base, o.velocity, o.v * SCALE.v, q.arrows);
        aA.set(base, o.acceleration, o.a * SCALE.a, q.arrows);
        mark.set(base, o.velocity, o.acceleration, q.arrows);
      },
    };
    home(p.r);
    return { legend: legend() };
  }
  const legend = (extra = []) => [...extra, { label: '속도 (velocity)', color: '#0072b2' }, { label: '구심 가속도 (centripetal acceleration)', color: '#cc79a7' }];

  // ---------- direction prediction (graded) ----------
  function buildDirection() {
    const q = M.dirQuestion(dIndex);
    ui.dq = q; ui.dshown = { v: false, a: false };
    const parts = scene(M.DIR_R);
    parts.place(q.state);
    turnSense(q.dir);
    const base = [q.state.position[0], H, q.state.position[2]], L = 6;
    const picks = NUM.map(n => named(COL.choice, 0.1, n, 4));
    const show = kind => q.choices[kind].forEach((c, i) => picks[i].set(base, c.dir, L));
    show('v');
    const vA = named(COL.v, 0.13, tex('\\vec v'), 3), aA = named(COL.a, 0.13, tex('\\vec a'), 3), mark = rightAngle();
    mark.set(base, [1, 0, 0], [0, 0, 1], false);

    let phase = 'v', vNote = '';
    const box = quizBox(ctx.panel, `문제 ${q.index + 1} / ${M.DCOUNT}`);
    box.text(`자동차가 ${q.dir > 0 ? '시계 반대 방향' : '시계 방향'}으로 일정한 속력으로 돈다. 이 순간의 속도 ${tex('\\vec v')}는 어느 화살표 방향인가?`);
    const getV = box.choices('① 속도 (velocity)의 방향', NUM.map((n, i) => ({ value: String(i + 1), html: `${n}번 화살표` })));
    const getA = box.choices('② 구심 가속도 (centripetal acceleration)의 방향', NUM.map((n, i) => ({ value: String(i + 1), html: `${n}번 화살표` })));
    const sets = box.box.querySelectorAll('fieldset');
    sets[1].hidden = true;
    const check = () => {
      if (phase === 'done') return;
      const kind = phase, no = kind === 'v' ? getV() : getA();
      if (!no) { box.feedback(null, '먼저 화살표 번호를 고르자.'); return; }
      const r = M.checkDirection(q, kind, no), msg = (kind === 'v' ? MSG_V : MSG_A)[String(r.reason)];
      const tail = r.ok ? '' : ` 정답은 ${NUM[+r.answer - 1]}번이다.`;
      if (kind === 'v') {
        ui.dshown.v = true;
        vA.set(base, q.state.velocity, M.DIR_V * SCALE.v * 1.6);
        vNote = r.ok ? `① 속도는 맞혔다 (${NUM[+r.answer - 1]}번).` : `① 속도의 정답은 ${NUM[+r.answer - 1]}번이었다.`;
        box.feedback(r.ok, `${msg}${tail}<br>이제 구심 가속도 ${tex('\\vec a')}의 방향을 고르자. 회색 화살표가 바뀌었다.`);
        show('a'); sets[1].hidden = false; sets[0].disabled = true; phase = 'a';
      } else {
        ui.dshown.a = true;
        aA.set(base, q.state.acceleration, q.state.a * SCALE.a * 1.6);
        mark.set(base, q.state.velocity, q.state.acceleration, true);
        picks.forEach(pk => pk.set(base, [1, 0, 0], 0));
        box.feedback(r.ok, `② ${msg}${tail}<br>${vNote} 파란 화살표 ${tex('\\vec v')}와 분홍 화살표 ${tex('\\vec a')}는 서로 수직이다.`);
        sets[1].disabled = true; phase = 'done';
      }
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }, { label: '새 문제', onClick: () => { dIndex += 1; ctx.rebuild(); } }]);
    cur = { render() {} };
    home(M.DIR_R);
    return { legend: legend([{ label: '고를 화살표', color: '#c6d0db' }]) };
  }

  // ---------- size prediction (graded) ----------
  function buildSize() {
    const q = M.sizeQuestion(sIndex);
    if (ui.sq?.index !== q.index) { ui.sq = q; ui.sphase = 'before'; ui.sdone = false; sFeedback = null; }
    const s = sizeState(), parts = scene(s.r);
    const vA = named(COL.v, 0.13, tex('\\vec v'), 3), aA = named(COL.a, 0.13, tex('\\vec a'), 3), mark = rightAngle();
    const T = (x, u) => `${N(x)}\\ \\mathrm{${u}}`;
    const box = quizBox(ctx.panel, `문제 ${q.index + 1} / ${M.SCOUNT}`);
    const b = q.before;
    let get;
    if (q.type === 'ratio') {
      const changed = q.after.r !== b.r ? `반지름을 ${tex(T(q.after.r, 'm'))}로` : `속력을 ${tex(T(q.after.v, 'm/s'))}로`;
      const keep = q.givenT ? '주기 <i>T</i>는 그대로 두고' : q.after.r !== b.r ? '속력 <i>v</i>는 그대로 두고' : '반지름 <i>r</i>은 그대로 두고';
      const now = q.givenT ? `${tex(`r = ${T(b.r, 'm')},\\ T = ${T(b.T, 's')}`)}` : `${tex(`r = ${T(b.r, 'm')},\\ v = ${T(b.v, 'm/s')}`)}`;
      box.text(`지금 ${now}로 돈다. ${keep} ${changed} 바꾸면 구심 가속도 <i>a</i>는 몇 배가 되나?`);
      get = box.choices('배수', M.RATIOS.map(x => ({ value: String(x), html: `${{ 0.25: '¼', 0.5: '½', 1: '1', 2: '2', 4: '4' }[x]}배` })));
    } else {
      const given = q.givenT ? tex(`r = ${T(b.r, 'm')},\\ T = ${T(b.T, 's')}`) : tex(`r = ${T(b.r, 'm')},\\ v = ${T(b.v, 'm/s')}`);
      const ask = q.ask === 'a' ? '구심 가속도 <i>a</i>는?' : '한 바퀴 도는 시간, 주기 (period) <i>T</i>는?';
      box.text(`${given}로 등속 원운동을 한다. ${ask}`);
      const input = box.answer({ label: q.ask === 'a' ? '구심 가속도' : '주기', unit: q.ask === 'a' ? 'm/s²' : 's', placeholder: '예 3.25', onEnter: () => check() });
      get = () => input.value;
    }
    const check = () => {
      if (ui.sdone) return;
      const value = get();
      if (q.type === 'ratio' && !value) { box.feedback(null, '먼저 배수를 고르자.'); return; }
      const r = M.checkSize(q, value);
      if (r.reason === 'unreadable') { box.feedback(false, '숫자로 적자. 예 3.25'); return; }
      const a0 = b.a, sol = q.type === 'ratio'
        ? `처음 ${tex(`a = ${T(a0, 'm/s^2')}`)}, 바꾼 뒤 ${tex(`a = ${T(q.after.a, 'm/s^2')}`)}로 ${{ 0.25: '¼', 0.5: '½', 1: '1', 2: '2', 4: '4' }[q.answer]}배다.`
        : q.ask === 'a'
          ? (q.givenT ? tex(`a = \\dfrac{4\\pi^2 r}{T^2} = \\dfrac{4\\pi^2(${T(b.r, 'm')})}{(${T(b.T, 's')})^2} = ${T(q.answer, 'm/s^2')}`) : tex(`a = \\dfrac{v^2}{r} = \\dfrac{(${T(b.v, 'm/s')})^2}{${T(b.r, 'm')}} = ${T(q.answer, 'm/s^2')}`))
          : tex(`T = \\dfrac{2\\pi r}{v} = \\dfrac{2\\pi(${T(b.r, 'm')})}{${T(b.v, 'm/s')}} = ${T(q.answer, 's')}`);
      const why = {
        null: '맞다.',
        nosquare: '속력을 제곱하지 않았다. 구심 가속도는 <i>v</i>²/<i>r</i>이다.',
        linear: '<i>a</i>는 <i>v</i>에 비례하지 않고 <i>v</i>²에 비례한다.',
        inverse: q.givenT ? '주기가 같으면 반지름이 두 배일 때 속력도 두 배다. <i>a</i> = 4π²<i>r</i>/<i>T</i>²는 <i>r</i>에 비례한다.' : '반지름은 <i>v</i>²/<i>r</i>의 분모에 있다. 반지름이 커지면 <i>a</i>는 작아진다.',
        value: q.type === 'ratio' ? '식 (4.5.1)에 바뀐 값을 넣어 보자.' : `식 (${q.ask === 'a' ? '4.5.1' : '4.5.2'})로 다시 계산해 보자.`,
      }[String(r.reason)];
      sFeedback = { ok: r.ok, html: `${why}<br>${sol}${q.type === 'ratio' ? '<br>장면이 바꾼 조건으로 바뀌었다. 재생해 보자.' : '<br>재생해 보자.'}` };
      ui.sdone = true;
      if (q.type === 'ratio') { ui.sphase = 'after'; ctx.rebuild(); } else { box.feedback(sFeedback.ok, sFeedback.html); ctx.refresh(); }
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }, { label: '새 문제', onClick: () => { sIndex += 1; ctx.rebuild(); } }]);
    if (sFeedback) box.feedback(sFeedback.ok, sFeedback.html);
    cur = {
      render(o, p) {
        const st = M.circular(s.r, s.v, s.v / s.r * o.t, 1);
        parts.place(st);
        const base = [st.position[0], H, st.position[2]];
        vA.set(base, st.velocity, s.v * SCALE.v, p.arrows);
        aA.set(base, st.acceleration, st.a * SCALE.a, p.arrows);
        mark.set(base, st.velocity, st.acceleration, p.arrows);
      },
    };
    home(s.r);
    return { legend: legend() };
  }

  return {
    build(p) {
      cur = null;
      return p.activity === 'direction' ? buildDirection() : p.activity === 'size' ? buildSize() : buildWatch(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
