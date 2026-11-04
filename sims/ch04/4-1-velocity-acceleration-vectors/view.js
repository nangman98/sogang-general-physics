// 4.2–4.3 3D view. A drone flies a curved path above the measuring board of the approved 4-2 scene
// (board, legs, lighting, fixed-size HTML labels). Position vectors start at the origin O on the board.
// Velocity and acceleration arrows are on by default here because the vectors are the topic (README).
import { fmt, fmtFixed } from '../../../core/format.js';
import { quizBox } from '../../../core/quiz.js';
import { drone } from './objects3d.js';
import * as M from './model.js';
import { ui, SCALE } from './spec.js';

const COL = { r: 0x000000, v: 0x0072b2, a: 0xcc79a7, choice: 0xc9d3dc, path: 0x6c8194 };
const X0 = -10, X1 = 10, WIDTH = 14;
const NUM = ['①', '②', '③', '④'];
const MSG_V = {
  null: '맞다. 순간 속도는 그 점에서 경로에 접하는 방향, 곧 접선 (tangent) 방향이고 드론이 가는 쪽을 향한다.',
  backward: '방향이 반대다. 접선 위에 있지만 순간 속도는 드론이 가는 쪽을 향한다.',
  chord: '그 화살표는 3 s 뒤의 위치를 향한다. 긴 Δ<i>t</i>의 평균 속도 방향이고 Δ<i>t</i> → 0이면 접선 방향이 된다.',
  position: '그 화살표는 원점 O에서 그은 위치 벡터의 방향이다. 속도는 위치가 바뀌는 방향이므로 경로의 접선을 따른다.',
  accel: '그 화살표는 가속도의 방향이다. 속도는 경로의 접선을 따른다.',
  up: '위쪽이 아니다. 속도는 경로의 접선을 따른다.',
};
const MSG_A = {
  null: '맞다. 가속도는 속도가 바뀌는 쪽을 향하고, 경로가 휘는 안쪽을 가리키는 성분이 있다.',
  alongV: '그 화살표는 속도의 방향이다. 가속도는 속도가 아니라 속도가 바뀌는 방향을 향한다.',
  outward: '반대다. 경로가 휘는 안쪽을 보자. 속도의 방향이 그쪽으로 바뀐다.',
  down: '아래쪽이 아니다. 가속도가 늘 아래인 것은 포물체 운동 (projectile motion)이다. 여기서는 속도가 바뀌는 쪽이 가속도다.',
  backward: '그 화살표는 속도와 반대 방향이다. 경로가 휘므로 가속도에는 휘는 안쪽 성분도 있다.',
  toOrigin: '원점 O 쪽이다. 가속도는 원점의 자리와 상관없이 속도가 바뀌는 쪽을 향한다.',
};

export function view(stage, ctx) {
  const { THREE, v3 } = stage;
  const tex = ctx.tex;
  let cur = null, qIndex = 0, anim = 0;

  // ---------- scene shared by every activity ----------
  function scene(P, T) {
    const g = stage.group, half = WIDTH / 2;
    stage.board(g, X0, X1, WIDTH, 0);
    stage.floorPlane(-1.45);
    for (const x of [X0 + 2, X1 - 2]) for (const z of [-half + 1.2, half - 1.2]) stage.mesh(g, new THREE.CylinderGeometry(0.45, 0.55, 0.55, 32), stage.lit(0x273846, 0.4, 0.4), [x, -1.12, z]);
    const seg = (pts, color, opacity = 1) => g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(v3)), new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })));
    // Grid every 2 m, lines through O a little stronger, x ticks on the front edge. One draw call each.
    const grid = [], axes = [], ticks = [];
    for (let x = -8; x <= 8; x += 2) (x === 0 ? axes : grid).push([x, 0.012, -half + 0.6], [x, 0.012, half - 0.6]);
    for (let z = -6; z <= 6; z += 2) (z === 0 ? axes : grid).push([X0 + 0.6, 0.012, z], [X1 - 0.6, 0.012, z]);
    seg(grid, 0xc2d5e2, 0.22); seg(axes, 0xc2d5e2, 0.55);
    for (let x = -8; x <= 8; x += 2) {
      ticks.push([x, 0.014, half - 0.35], [x, 0.014, half - 0.75]);
      stage.label(`${fmtFixed(x, 0)} m`, [x, 0.1, half - 0.1], 'measure');
    }
    seg(ticks, 0xd8e5ee);
    // Origin O and the x, y, z axes. Readouts use these components.
    for (const [d, n] of [[[1, 0, 0], 'x'], [[0, 1, 0], 'y'], [[0, 0, 1], 'z']]) {
      stage.arrow(0x56687a, { radius: 0.04 }).update([0, 0.02, 0], d, 2.2);
      stage.label(`<i>${n}</i>`, d.map(c => c * 2.65), 'axis', { dy: 0 });
    }
    stage.label('O', [-0.4, 0.05, 0.4], 'axis', { dy: 0 });
    // Path as a thin tube, its shadow line on the board.
    const pts = Array.from({ length: 241 }, (_, i) => P.pos(T * i / 240));
    const tube = stage.mesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v3)), 240, 0.05, 8, false), stage.lit(COL.path, 0.12, 0.5));
    tube.castShadow = false;
    stage.line(pts.map(([x, , z]) => [x, 0.02, z]), 0x9aa9b5, { opacity: 0.6 });
    // Drone with a dashed drop line and a ring on the board below it.
    const body = drone(stage); g.add(body);
    const drop = stage.line([[0, 0, 0], [0, 0.02, 0]], 0x7d94a8, { dashed: true, dash: 0.3, gap: 0.22 });
    drop.frustumCulled = false;
    const ring = stage.ring(g, [0, 0.03, 0], 0.4, 0x40546a, 0.03);
    const up = new THREE.Vector3(0, 1, 0), qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
    return {
      // Drone at r, nose along the horizontal velocity, body tilted toward a − g as a real quadcopter is.
      place(r, v, a, spin = 0) {
        body.position.set(...r);
        qa.setFromAxisAngle(up, Math.atan2(-v[2], v[0]));
        qb.setFromUnitVectors(up, v3([a[0], a[1] + 9.8, a[2]]).normalize());
        body.quaternion.copy(qb).multiply(qa);
        body.spin(spin);
        const pos = drop.geometry.attributes.position;
        pos.setXYZ(0, r[0], r[1] - 0.3, r[2]); pos.setXYZ(1, r[0], 0.02, r[2]); pos.needsUpdate = true;
        drop.computeLineDistances();
        ring.position.set(r[0], 0.03, r[2]);
      },
    };
  }

  // Arrow with a KaTeX name at its tip. Hidden when off or too short to see.
  // The name sits past the head (f = null) or at fraction f of the length, raised by up (m).
  // Position vectors end at the drone and Δr shares its line with v_avg, so their names sit elsewhere.
  function named(color, radius, html, { opacity = 1, priority = 1, f = null, up = 0 } = {}) {
    const a = stage.arrow(color, { radius });
    a.visible = false;
    if (opacity < 1) Object.assign(a.children[0].material, { transparent: true, opacity, depthWrite: false });
    const l = html ? stage.label(html, [0, 0, 0], 'tag', { dy: 0, priority }) : null;
    if (l) l.node.dataset.off = '1';
    return {
      label: l,
      set(origin, vec, len, on = true) {
        if (!on || !(len > 0.03)) { a.visible = false; if (l) l.node.dataset.off = '1'; return; }
        a.update(origin, vec, len);
        if (!l) return;
        const u = M.unit(vec);
        l.node.dataset.off = '';
        l.move(origin.map((o, i) => o + (f === null ? u[i] * (len + 0.55) : u[i] * len * f) + (i === 1 ? up : 0)));
      },
    };
  }
  function tangentLine() {
    const l = stage.line([[0, 0, 0], [1, 0, 0]], 0x7d94a8, { dashed: true, dash: 0.25, gap: 0.18 });
    l.frustumCulled = false;
    return {
      set(r, v, on = true) {
        l.visible = on; if (!on) return;
        const u = M.unit(v), pos = l.geometry.attributes.position;
        pos.setXYZ(0, ...r.map((c, i) => c - u[i] * 5)); pos.setXYZ(1, ...r.map((c, i) => c + u[i] * 5)); pos.needsUpdate = true;
        l.computeLineDistances();
      },
    };
  }
  function home(target, distance) {
    stage.setHome({ target, direction: [-0.18, 0.42, 1], distance, minDistance: distance * 0.35, maxDistance: distance * 2.6 });
  }

  // ---------- average velocity and average acceleration ----------
  function buildAverage(p) {
    const P = M.pathOf(p), kind = p.activity, parts = scene(P, P.T);
    const marker2 = stage.mesh(stage.group, new THREE.SphereGeometry(0.17, 24, 16), stage.lit(0x9aa9b5, 0.3, 0.4));
    const tag1 = stage.label('1', [0, 0, 0], 'tag', { dy: 16, priority: 2 }), tag2 = stage.label('2', [0, 0, 0], 'tag', { dy: 0, priority: 2 });
    const tan = tangentLine();
    const A = kind === 'vel'
      ? {
        r1: named(COL.r, 0.03, tex('\\vec r_1'), { f: 0.4, up: -0.4 }), r2: named(COL.r, 0.03, tex('\\vec r_2'), { f: 0.4, up: 0.4 }),
        dr: named(COL.r, 0.045, tex('\\Delta\\vec r'), { priority: 2, f: 1, up: 0.6 }),
        vavg: named(COL.v, 0.06, tex('\\vec v_{\\mathrm{avg}}'), { priority: 3 }), v: named(COL.v, 0.085, tex('\\vec v'), { priority: 3 }),
      }
      : {
        v1: named(COL.v, 0.065, tex('\\vec v_1'), { priority: 2 }), v2: named(COL.v, 0.065, tex('\\vec v_2'), { priority: 2 }),
        v2c: named(COL.v, 0.05, '', { opacity: 0.4 }), dv: named(COL.v, 0.04, tex('\\Delta\\vec v'), { priority: 2 }),
        aavg: named(COL.a, 0.06, tex('\\vec a_{\\mathrm{avg}}'), { priority: 3 }), a: named(COL.a, 0.085, tex('\\vec a'), { priority: 3 }),
      };

    // Δt → 0 panel: a table for the current t and a button that shrinks Δt.
    const box = quizBox(ctx.panel, 'Δ<i>t</i> → 0');
    box.text(kind === 'vel' ? `Δ<i>t</i>를 줄이면 ${tex('\\vec v_{\\mathrm{avg}}')}가 ${tex('\\vec v')}에 다가간다.` : `Δ<i>t</i>를 줄이면 ${tex('\\vec a_{\\mathrm{avg}}')}가 ${tex('\\vec a')}에 다가간다.`, 'lead');
    const table = box.text('', 'shrink');
    box.buttons([{ label: 'Δt 줄이기', primary: true, onClick: () => shrink(0.05) }, { label: 'Δt = 2 s', onClick: () => shrink(2, 600) }]);
    let lastT = null;
    function fillTable(t) {
      const rows = M.shrinkTable(P, t, kind), sym = kind === 'vel' ? ['v', 'm/s'] : ['a', 'm/s²'];
      const head = `<tr><th>Δ<i>t</i> (s)</th><th>${tex(`|\\vec ${sym[0]}_{\\mathrm{avg}}|`)} (${sym[1]})</th><th>사이 각</th></tr>`;
      const body = rows.map(r => `<tr><td>${fmtFixed(r.dt, 2)}</td><td>${fmt(r.size, { zero: 1e-9 })}</td><td>${fmt(r.angle, { zero: 1e-6 })}°</td></tr>`).join('');
      const last = `<tr class="limit"><td>→ 0</td><td>${fmt(rows[0].exact, { zero: 1e-9 })}</td><td>0°</td></tr>`;
      table.innerHTML = `<table>${head}${body}${last}</table><small>같은 시각 <i>t</i> = ${fmt(t, { zero: 1e-9 })} s에서 잰 값이다. 마지막 줄은 ${tex(`|\\vec ${sym[0]}|`)}이다.</small>`;
    }

    cur = {
      render(o, q) {
        const on = q.arrows;
        parts.place(o.r1, o.v1, o.a1, o.t * 40);
        marker2.position.set(...o.r2);
        tag1.move([o.r1[0], o.r1[1] - 0.7, o.r1[2]]); tag2.move([o.r2[0] + 0.55, o.r2[1] - 0.35, o.r2[2]]);
        tan.set(o.r1, o.v1, kind === 'vel');
        if (kind === 'vel') {
          A.r1.set([0, 0, 0], o.r1, M.norm(o.r1)); A.r2.set([0, 0, 0], o.r2, M.norm(o.r2));
          A.dr.set(o.r1, o.dr, M.norm(o.dr));
          A.vavg.set(o.r1, o.vavg, M.norm(o.vavg) * SCALE.v, on);
          A.v.set(o.r1, o.v1, M.norm(o.v1) * SCALE.v, on);
        } else {
          const tip1 = o.r1.map((c, i) => c + o.v1[i] * SCALE.v);
          A.v1.set(o.r1, o.v1, M.norm(o.v1) * SCALE.v, on);
          A.v2.set(o.r2, o.v2, M.norm(o.v2) * SCALE.v, on);
          A.v2c.set(o.r1, o.v2, M.norm(o.v2) * SCALE.v, on);
          A.dv.set(tip1, o.dv, M.norm(o.dv) * SCALE.v, on);
          A.aavg.set(o.r1, o.aavg, M.norm(o.aavg) * SCALE.a, on);
          A.a.set(o.r1, o.a1, M.norm(o.a1) * SCALE.a, on);
        }
        if (lastT !== o.t) { lastT = o.t; fillTable(o.t); }
      },
    };
    home([0, 1.2, 0], 27);
    const legend = [{ label: '경로 (path)', color: '#6c8194' }];
    if (kind === 'vel') legend.push({ label: '위치·변위 (position, displacement)', color: '#000000' }, { label: '속도 (velocity)', color: '#0072b2' });
    else legend.push({ label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' });
    return { legend };
  }

  // Animate the Δt slider in log steps without rebuilding the scene.
  function shrink(to, ms = 2200) {
    cancelAnimationFrame(anim);
    const from = ctx.params.dt, start = performance.now();
    const step = now => {
      const u = Math.min(1, (now - start) / ms);
      ctx.setParam('dt', from * (to / from) ** u);
      ctx.refresh();
      if (u < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // ---------- direction prediction (graded) ----------
  function buildPredict() {
    const q = M.question(qIndex), P = M.PATHS[q.path];
    ui.q = q; ui.shown = { v: false, a: false };
    const parts = scene(P, P.T);
    parts.place(q.r, q.v, q.a);
    stage.label('P', [q.r[0], q.r[1] - 0.8, q.r[2]], 'tag', { dy: 16, priority: 0 });
    // Four grey choice arrows with their circled numbers at the tips (set() moves the label there).
    const L = 2.3, picks = NUM.map(n => named(COL.choice, 0.055, n, { priority: 4 }));
    const showChoices = kind => q.choices[kind].forEach((c, i) => picks[i].set(q.r, c.dir, L));
    const vA = named(COL.v, 0.085, tex('\\vec v'), { priority: 3 }), aA = named(COL.a, 0.085, tex('\\vec a'), { priority: 3 });
    const tan = tangentLine();
    tan.set(q.r, q.v, false);
    showChoices('v');

    let phase = 'v', vNote = '';
    const box = quizBox(ctx.panel, `문제 ${q.index + 1} / ${M.QCOUNT}`);
    box.text(`드론이 점 P를 지나는 순간이다. 이 순간의 속도 ${tex('\\vec v')}는 어느 화살표 방향인가?`);
    const getV = box.choices('① 속도 (velocity)의 방향', NUM.map((n, i) => ({ value: String(i + 1), html: `${n}번 화살표` })));
    const getA = box.choices('② 가속도 (acceleration)의 방향', NUM.map((n, i) => ({ value: String(i + 1), html: `${n}번 화살표` })));
    const sets = box.box.querySelectorAll('fieldset');
    sets[1].hidden = true;
    const check = () => {
      if (phase === 'done') return;
      const kind = phase, no = kind === 'v' ? getV() : getA();
      if (!no) { box.feedback(null, '먼저 화살표 번호를 고르자.'); return; }
      const r = M.checkDirection(q, kind, no), msg = (kind === 'v' ? MSG_V : MSG_A)[String(r.reason)];
      const tail = r.ok ? '' : ` 정답은 ${NUM[+r.answer - 1]}번이다.`;
      if (kind === 'v') {
        ui.shown.v = true;
        vA.set(q.r, q.v, M.norm(q.v) * SCALE.v); tan.set(q.r, q.v, true);
        vNote = r.ok ? `① 속도는 맞혔다 (${NUM[+r.answer - 1]}번).` : `① 속도의 정답은 ${NUM[+r.answer - 1]}번이었다.`;
        box.feedback(r.ok, `${msg}${tail}<br>이제 가속도 ${tex('\\vec a')}의 방향을 고르자. 회색 화살표가 바뀌었다.`);
        showChoices('a'); sets[1].hidden = false; sets[0].disabled = true;
        phase = 'a';
      } else {
        ui.shown.a = true;
        aA.set(q.r, q.a, M.norm(q.a) * SCALE.a);
        picks.forEach(pk => pk.set(q.r, [1, 0, 0], 0));
        box.feedback(r.ok, `② ${msg}${tail}<br>${vNote} 파란 화살표가 ${tex('\\vec v')}, 분홍 화살표가 ${tex('\\vec a')}다.`);
        sets[1].disabled = true; phase = 'done';
      }
      ctx.refresh();
    };
    box.buttons([{ label: '확인', primary: true, onClick: check }, { label: '새 문제', onClick: () => { qIndex += 1; ctx.rebuild(); } }]);
    cur = { render() {} };
    // Raise the aim with P so the arrow tips stay inside the stage, keep x and z centred so the board edge stays above the legend.
    home([0, Math.max(1.2, 0.45 * q.r[1]), 0], 27);
    return { legend: [{ label: '경로 (path)', color: '#6c8194' }, { label: '고를 화살표', color: '#a9b6c2' }, { label: '속도 (velocity)', color: '#0072b2' }, { label: '가속도 (acceleration)', color: '#cc79a7' }] };
  }

  return {
    build(p) {
      cur = null;
      cancelAnimationFrame(anim);
      return p.activity === 'predict' ? buildPredict() : buildAverage(p);
    },
    render(o, p) { if (cur) cur.render(o, p); },
  };
}
