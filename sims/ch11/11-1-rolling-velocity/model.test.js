// node --test sims/ch11/11-1-rolling-velocity/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('rolling = translation + rotation: bottom at rest, center v_com, top 2v_com (Eq. 11.1.2)', () => {
  const v = 1.5, R = 0.6;
  close(Math.hypot(...M.rimVelocity(v, R, 0)), 0, 1e-12);
  const top = M.rimVelocity(v, R, 180); close(top[0], 2 * v); close(top[1], 0, 1e-12);
  const front = M.rimVelocity(v, R, 90); close(front[0], v); close(front[1], -v);
  for (const b of [0, 30, 90, 135, 180, 250]) close(Math.hypot(...M.rimVelocity(v, R, b)), M.pointSpeed(v, b), 1e-12);
});

test('the marked point traces a cycloid: its velocity is the time derivative of its position, touching down every 2πR', () => {
  const p = { v: 1.2, R: 0.5 };
  for (const t of [0.3, 1.1, 2.4]) {
    const h = 1e-6, s = M.stateAt(t, p), a = M.stateAt(t + h, p), b = M.stateAt(t - h, p);
    close((a.mark[0] - b.mark[0]) / (2 * h), s.vmark[0], 1e-6); close((a.mark[1] - b.mark[1]) / (2 * h), s.vmark[1], 1e-6);
  }
  const T = 2 * Math.PI * 0.5 / 1.2, s = M.stateAt(T, p);
  close(s.mark[1], 0, 1e-9); close(s.mark[0], 2 * Math.PI * 0.5, 1e-9);   // one turn rolls 2πR
});

test('grading with the named mistakes', () => {
  assert.equal(M.check({ v: 1.5, R: 0.6, pt: 'top' }, { sText: '3' }).ok, true);
  assert.equal(M.check({ v: 1.5, R: 0.6, pt: 'top' }, { sText: '1.5' }).reason, 'com');
  assert.equal(M.check({ v: 1.5, R: 0.6, pt: 'bottom' }, { sText: '0' }).ok, true);
  assert.equal(M.check({ v: 1.5, R: 0.6, pt: 'front' }, { sText: '2.12' }).ok, true);
  assert.equal(M.check({ v: 1.5, R: 0.6, pt: 'front' }, { sText: '3' }).reason, 'sumScalar');
  assert.equal(M.check({ v: 1.5, R: 0.6, pt: 'upperFront' }, { sText: '0' }).reason, 'zero');
});
