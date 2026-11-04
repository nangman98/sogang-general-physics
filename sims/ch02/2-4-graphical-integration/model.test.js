// node --test sims/ch02/2-4-graphical-integration/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const defaults = Object.fromEntries(M.params.map(c => [c.id, c.value]));
const withSteps = (a1, a2, a3, a4) => ({ ...defaults, a1, a2, a3, a4 });

// Composite Simpson rule, an independent numerical integral for the exact areas.
function simpson(f, a, b, n = 4000) {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3;
}

test('Sample Problem 2.6.1: torso a(t) areas A = 0, B = 1.5 m/s, C = 0.50 m/s, v1 = 2.0 m/s', () => {
  const torso = [{ t0: 0, t1: 0.040, f0: 0, f1: 0 }, { t0: 0.040, t1: 0.100, f0: 0, f1: 50 }, { t0: 0.100, t1: 0.110, f0: 50, f1: 50 }];
  const rs = M.regions(torso);
  close(rs[0].area, 0); close(rs[1].area, 1.5); close(rs[2].area, 0.50);
  const v1 = 0 + M.totalArea(rs);                                     // (2.6.5)
  close(v1, 2.0); close(+(v1 * 3.6).toFixed(1), 7.2);
  close(M.integralTo(torso, 0.110), 2.0);
});

test('Sample Problem 2.2.1, Eq. 2.2.3: area under v(t) from 3 s to 8 s is +20 m', () => {
  const v = [{ t0: 0, t1: 1, f0: 0, f1: 0 }, { t0: 1, t1: 3, f0: 0, f1: 4 }, { t0: 3, t1: 8, f0: 4, f1: 4 }, { t0: 8, t1: 9, f0: 4, f1: 0 }];
  close(M.integralTo(v, 8) - M.integralTo(v, 3), 20);
});

test('Sample Problem 2.1.1: total distance 16.0 km over 1.25 h gives s_avg = 12.8 km/h', () => {
  const v = [{ t0: 0, t1: 0.25, f0: 40, f1: 40 }, { t0: 0.25, t1: 0.75, f0: 6, f1: 6 }, { t0: 0.75, t1: 1.25, f0: -6, f1: -6 }];
  const rs = M.regions(v);
  close(M.absArea(rs), 16.0); close(M.totalArea(rs), 10.0);
  close(+M.sAvg(M.absArea(rs), 1.25).toFixed(1), 12.8);              // (2.1.3)
});

test('exact step integrals agree with numerical integration', () => {
  for (const p of [defaults, withSteps(3, -3, 3, -3), withSteps(-2.5, 1, 0, 2), withSteps(0.5, 0.5, -0.5, -0.5)]) {
    const a = M.steps(p), vs = M.velocitySegs(p);
    for (const t of [1.3, 4, 5.7, 8]) {
      close(M.kin(p, t).v, simpson(s => M.valueAt(a, s), 0, t), 1e-2);
      close(M.kin(p, t).x, simpson(s => M.valueAt(vs, s), 0, t), 1e-6);
    }
    close(M.totalArea(M.regions(a)), M.kin(p, M.T).v);                // (2.6.1) area = Δv
    close(M.totalArea(M.regions(vs)), M.kin(p, M.T).x);               // (2.6.3) area = Δx
  }
});

test('default steps: v crosses zero at 16/3 s, displacement 11 m, total distance 18.3 m', () => {
  const rs = M.regions(M.velocitySegs(defaults));
  assert.ok(rs.some(r => Math.abs(r.t1 - 16 / 3) < 1e-12));
  for (const r of rs) assert.ok(r.f0 * r.f1 >= -1e-12, 'one sign per region');
  close(M.kin(defaults, 8).v, -1); close(M.kin(defaults, 8).x, 11);
  close(M.distance(defaults, 8), 4 + 8 + 8 / 3 + 2 / 3 + 3);
  const o = M.observe(M.at(8), defaults);
  close(o.sAvg, (4 + 8 + 8 / 3 + 2 / 3 + 3) / 8); close(o.vAvg, 11 / 8);
});

test('a–t area grading: sign ignored, Δt forgotten, sign flipped', () => {
  assert.equal(M.checkDv(defaults, '-1').ok, true);
  assert.equal(M.checkDv(defaults, '−1.0').ok, true);
  assert.equal(M.checkDv(defaults, '11').reason, 'abs');
  assert.equal(M.checkDv(defaults, '-0.5').reason, 'heights');
  assert.equal(M.checkDv(defaults, '1').reason, 'sign');
  assert.equal(M.checkDv(defaults, 'x').reason, 'unreadable');
});

test('v–t area grading: total distance given for displacement, v(T)·T, sign', () => {
  assert.equal(M.checkDx(defaults, '11').ok, true);
  assert.equal(M.checkDx(defaults, '18.3').reason, 'distance');
  assert.equal(M.checkDx(defaults, '-8').reason, 'final-v');
  assert.equal(M.checkDx(defaults, '-11').reason, 'sign');
});

test('every stop line can be reached with the slider steps, and grading works', () => {
  const s = M.params.find(c => c.unit === 'm/s²');                    // the four step sliders share one range
  const grid = Array.from({ length: Math.round((s.max - s.min) / s.step) + 1 }, (_, i) => s.min + s.step * i);
  for (const X of M.TARGETS) {
    let found = null;
    for (const a1 of grid) for (const a2 of grid) for (const a3 of grid) for (const a4 of grid) {
      if (!found && M.checkStop(withSteps(a1, a2, a3, a4), X).ok) found = [a1, a2, a3, a4];
    }
    assert.ok(found, `stop line ${X} m`);
  }
  const r = M.checkStop(withSteps(1, 0, 0, -1), 12);                  // 0 → 2 m/s, coast, brake
  assert.equal(r.ok, true); close(r.x, 12);
  assert.equal(M.checkStop(withSteps(1, 0, 0, 0), 12).vOk, false);
  assert.equal(M.checkStop(withSteps(1, -1, 0, 0), 12).xOk, false);   // stops at 4 m
});
