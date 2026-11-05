// node --test sims/ch06/6-3-centripetal-force/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const rad = d => d * Math.PI / 180;

test('Sample Problem 6.3.1: least speed at the top of a 2.7 m loop is 5.1 m/s (Eq. 6.3.3 with F_N = 0)', () => {
  const p = { R: 2.7, v: Math.sqrt(M.G * 2.7), m: 80 };
  const s = M.loopTop(p);
  close(+s.vmin.toFixed(1), 5.1);
  close(s.FN, 0, 1e-9); assert.equal(s.contact, true);
  // (6.3.3): −F_N − mg = m(−v²/R), independent of the mass.
  for (const m of [50, 80, 200]) { const q = M.loopTop({ R: 2.7, v: 7, m }); close(-q.FN - m * M.G, m * -(49 / 2.7)); }
  close(M.loopTop({ R: 2.7, v: 5, m: 1 }).vmin, M.loopTop({ R: 2.7, v: 5, m: 300 }).vmin);
});

test('Sample Problem 6.3.2: orbit at 520 km and 7.60 km/s gives a = 8.38 m/s², F = 662 N (Eqs. 6.3.1, 6.3.2)', () => {
  const c = M.centripetal(79.0, 7.60e3, 6.37e6 + 0.52e6);
  close(+c.a.toFixed(2), 8.38);
  close(Math.round(c.F), 662);
});

test('flat curve: friction is the centripetal force, at most μs mg, so v_max = √(μs g R)', () => {
  const p = { v: 12, R: 40, mus: 0.5 };
  const s = M.flat(p);
  close(s.vmax, Math.sqrt(0.5 * M.G * 40));
  assert.equal(s.onRoad, true);
  close(s.f, M.MASS * 144 / 40); assert.ok(s.f <= s.fmax);
  // Faster than v_max: the path radius is v²/(μs g), so the largest friction is exactly its centripetal force.
  const q = { v: 20, R: 40, mus: 0.5 }, o = M.flat(q);
  assert.equal(o.onRoad, false);
  close(o.rPath, 400 / (0.5 * M.G)); close(M.MASS * 400 / o.rPath, o.fmax);
  // The wider circle is tangent to the road at the start and leaves the road outward.
  const a0 = M.flatAt(0, q), a1 = M.flatAt(1e-6, q);
  close(a0.x, 40); close(a0.z, 0); close((a1.x - a0.x) / 1e-6, 0, 1e-4); close((a1.z - a0.z) / 1e-6, -20, 1e-4);
  const T = M.duration({ activity: 'flat', ...q }), end = M.flatAt(T, q);
  close(Math.hypot(end.x, end.z), 40 + M.ROAD + 3, 1e-6);
  // On the road the car stays on the circle of radius R.
  for (const t of [0.5, 3, 9]) { const e = M.flatAt(t, p); close(Math.hypot(e.x, e.z), 40); }
});

test('banked curve: F_N cos θ = mg and F_N sin θ = m v²/R give v = √(gR tan θ)', () => {
  for (const [R, theta] of [[20, 5], [40, 20], [80, 40]]) {
    const s = M.banked({ R, theta });
    close(s.FN * Math.cos(rad(theta)), M.MASS * M.G);
    close(s.FN * Math.sin(rad(theta)), M.MASS * s.v * s.v / R);
    assert.ok(s.FN > M.MASS * M.G);
  }
});

test('loop: F_N = m v²/R − mg cos φ while on the track; contact ends where it reaches 0', () => {
  const p = { R: 4, v: 5, m: 100 };                                  // v < √(gR) = 6.26 m/s
  const rel = M.loopRelease(p);
  close(Math.cos(rad(rel)), 25 / (M.G * 4)); assert.ok(rel < 0);
  const tRel = (rel + M.PHI0) * rad(1) * 4 / 5;
  const before = M.loopAt(tRel - 1e-6, p), after = M.loopAt(tRel + 1e-6, p);
  assert.equal(before.contact, true); assert.equal(after.contact, false);
  close(before.FN, 0, 1e-2);                                          // F_N falls at about 940 N/s here
  close(before.x, after.x, 1e-5); close(before.y, after.y, 1e-5);        // the path is continuous at release
  for (const t of [0.01, 0.05]) { const o = M.loopAt(t, p); assert.ok(t < tRel); close(Math.hypot(o.x, o.y), 4); close(o.FN, 100 * 25 / 4 - 100 * M.G * Math.cos(rad(o.phi))); }
  const fast = { R: 4, v: 8, m: 100 };
  assert.equal(M.loopRelease(fast), null);
  const T = M.loopDuration(fast), end = M.loopAt(T, fast);
  close(end.phi, M.PHI0); assert.equal(end.contact, true);
  const Ts = M.loopDuration(p), land = M.loopAt(Ts, p);
  close(land.y, 0, 1e-9);                                            // a slow car drops to the centre height
});

test('grading with the named mistakes', () => {
  const F = { v: 12, R: 40, mus: 0.5 };                              // v_max = 14.0 m/s, need = 3600 N
  assert.equal(M.checkFlat(F, { vText: '14.0', fText: '3600' }).ok, true);
  assert.equal(M.checkFlat(F, { vText: '196', fText: '3600' }).vReason, 'noRoot');
  assert.equal(M.checkFlat(F, { vText: '19.8', fText: '3600' }).vReason, 'noMu');
  assert.equal(M.checkFlat(F, { vText: '14', fText: '4900' }).fReason, 'fmax');
  assert.equal(M.checkFlat(F, { vText: '14', fText: '300' }).fReason, 'noSquare');
  const B = { R: 40, theta: 20 };
  const v = M.banked(B).v;
  assert.equal(M.checkBanked(B, { vText: v.toFixed(2), cmp: 'more' }).ok, true);
  assert.equal(M.checkBanked(B, { vText: v.toFixed(2), cmp: 'equal' }).cmpReason, 'equal');
  assert.equal(M.checkBanked(B, { vText: Math.sqrt(M.G * 40 * Math.sin(rad(20))).toFixed(3), cmp: 'more' }).vReason, 'sin');
  const L = { R: 4, v: 8, m: 120 };                                  // v_min = 6.26 m/s, F_N = 744 N
  assert.equal(M.checkLoop(L, { vText: '6.26', nText: '744' }).ok, true);
  assert.equal(M.checkLoop(L, { vText: '6.26', nText: (120 * 16 + 120 * M.G).toFixed(1) }).nReason, 'plus');
  assert.equal(M.checkLoop(L, { vText: '6.26', nText: '1920' }).nReason, 'noWeight');
  assert.equal(M.checkLoop(L, { vText: '39.2', nText: '744' }).vReason, 'noRoot');
  assert.equal(M.checkLoop({ R: 4, v: 5, m: 120 }, { vText: '6.26', nText: '0' }).ok, true);
  assert.equal(M.checkLoop({ R: 4, v: 5, m: 120 }, { vText: '6.26', nText: '-300' }).nReason, 'noContact');
});

test('every slider setting gives finite runs', () => {
  const ranges = M.params.filter(c => c.min !== undefined);
  const pick = (c, u) => c.min + Math.round(u * (c.max - c.min) / c.step) * c.step;
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 400; k++) {
    for (const activity of ['flat', 'banked', 'loop']) {
      const p = { activity };
      for (const c of ranges) p[c.id] = pick(c, rnd());
      const T = M.duration(p);
      assert.ok(Number.isFinite(T) && T > 0 && T < 120, `${activity} T = ${T}`);
      for (const t of [0, T / 3, T]) {
        const o = M.observe(M.at(t), p);
        for (const [key, val] of Object.entries(o)) if (typeof val === 'number') assert.ok(Number.isFinite(val), `${activity} ${key}`);
      }
    }
  }
});
