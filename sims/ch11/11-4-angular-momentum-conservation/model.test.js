// node --test sims/ch11/11-4-angular-momentum-conservation/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 11.8.2: disk 6.00m, the body crawls from 0.800R to R, ωi = 1.50 rad/s → ωf = 1.37 rad/s', () => {
  const p = { M: 6, m: 1, R: 1, ri: 0.8, rf: 1, w0: 1.5 }, s = M.system(p);
  close(s.Id, 3.00); close(s.Ii, 3.64); close(s.If, 4.00);           // in units of mR²
  close(s.wf, 1.365);                                                 // the textbook rounds to 1.37
});

test('L = Iω is the same at every instant; disk and body share it', () => {
  const p = { M: 6, m: 1.5, R: 1, ri: 0.9, rf: 0.2, w0: 1.5 }, s = M.system(p);
  for (const t of [0, 1, 1.5, 2.2, 3, 4.4, 4.5, 5.9, 6]) {
    const o = M.stateAt(t, p);
    close(o.L, s.L); close(o.Ld + o.Lm, s.L);
  }
  close(M.stateAt(M.RUN, p).w, s.wf);
  close(s.Kf / s.Ki, s.Ii / s.If);                                     // K = L²/2I
});

test('the turned angle is the time integral of ω (closed form against the trapezoid rule)', () => {
  for (const p of [{ M: 6, m: 1.5, R: 1, ri: 0.9, rf: 0.2, w0: 1.5 }, { M: 3, m: 2, R: 1.2, ri: 0, rf: 1.2, w0: 2 }, { M: 6, m: 1, R: 1, ri: 0.5, rf: 0.5, w0: 1 }]) {
    let th = 0; const n = 60000, h = M.RUN / n;
    for (let i = 0; i < n; i++) th += 0.5 * h * (M.stateAt(i * h, p).w + M.stateAt((i + 1) * h, p).w);
    close(M.stateAt(M.RUN, p).th, th, 1e-8);
  }
});

test('grading with the named mistakes', () => {
  const p = { M: 6, m: 1.5, R: 1, ri: 0.9, rf: 0.2, w0: 1.5 }, s = M.system(p), k = s.Ii / s.If;
  assert.equal(M.check(p, { wText: s.wf.toFixed(3), kText: k.toFixed(3) }).ok, true);
  assert.equal(M.check(p, { wText: (1.5 * s.If / s.Ii).toFixed(3), kText: k.toFixed(3) }).wReason, 'inverse');
  assert.equal(M.check(p, { wText: '1.5', kText: k.toFixed(3) }).wReason, 'same');
  assert.equal(M.check(p, { wText: (1.5 * 0.81 / 0.04).toFixed(2), kText: k.toFixed(3) }).wReason, 'bodyOnly');
  assert.equal(M.check(p, { wText: s.wf.toFixed(3), kText: '1' }).kReason, 'conserved');
  assert.equal(M.check(p, { wText: s.wf.toFixed(3), kText: (1 / k).toFixed(3) }).kReason, 'inverse');
  assert.equal(M.check(p, { wText: s.wf.toFixed(3), kText: (k * k).toFixed(3) }).kReason, 'square');
  const h = M.check(p, { wText: (1.5 * (6 + 1.5 * 0.81) / (6 + 1.5 * 0.04)).toFixed(3), kText: k.toFixed(3) });
  assert.equal(h.wReason, 'hoopI');
});
