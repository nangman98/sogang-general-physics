// node --test sims/ch11/11-2-rolling-race/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 11.2.1: a 6.00 kg ball rolls down 30.0°: v = 4.10 m/s after 1.20 m, a = 3.50 m/s², f_s = 8.40 N', () => {
  const k = 2 / 5, g = M.G, h = 1.20;
  close(+Math.sqrt(2 * g * h / (1 + k)).toFixed(2), 4.10);                 // (11.2.10) solved for v
  const r = M.roll('sphere', 30.0, 6.00);
  close(+r.a.toFixed(2), 3.50); close(+r.fs.toFixed(2), 8.40);
});

test('energy and force pictures agree: v² = 2 a L, ½Mv² + ½Iω² = Mgh, f_s R = I_com α', () => {
  for (const shape of ['hoop', 'disk', 'sphere', 'shell']) {
    const theta = 25, Mm = 3, R = 0.2, r = M.roll(shape, theta, Mm), I = r.k * Mm * R * R;
    close(r.v * r.v, 2 * r.a * M.LEN);
    close(0.5 * Mm * r.v ** 2 + 0.5 * I * (r.v / R) ** 2, Mm * M.G * r.h);
    close(r.fs * R, I * r.a / R);                                         // torque about the center, α = a/R
    close(Mm * M.G * Math.sin(theta * Math.PI / 180) - r.fs, Mm * r.a);   // along the ramp
  }
});

test('order down the ramp: block, sphere, disk, shell, hoop; mass and radius do not matter', () => {
  const t = s => M.roll(s, 20).t;
  assert.ok(t('block') < t('sphere') && t('sphere') < t('disk') && t('disk') < t('shell') && t('shell') < t('hoop'));
  close(M.roll('disk', 20, 1).a, M.roll('disk', 20, 7).a);
  assert.equal(M.winner({ A: 'hoop', B: 'sphere', theta: 20 }), 'B');
  assert.equal(M.winner({ A: 'disk', B: 'disk', theta: 20 }), 'same');
});

test('grading with the named mistakes', () => {
  const p = { activity: 'race', A: 'hoop', B: 'sphere', theta: 20 }, r = M.roll('hoop', 20);
  assert.equal(M.checkRace(p, { pick: 'B', vText: r.v.toFixed(3) }).ok, true);
  assert.equal(M.checkRace(p, { pick: 'A', vText: r.v.toFixed(3) }).pickReason, 'wrong');
  assert.equal(M.checkRace(p, { pick: 'B', vText: Math.sqrt(2 * M.G * r.h).toFixed(3) }).vReason, 'noRotation');
  const q = { activity: 'single', A: 'disk', theta: 20, M: 2 }, s = M.roll('disk', 20, 2);
  assert.equal(M.checkSingle(q, { aText: s.a.toFixed(3), fText: s.fs.toFixed(3) }).ok, true);
  assert.equal(M.checkSingle(q, { aText: (M.G * Math.sin(20 * Math.PI / 180)).toFixed(3), fText: s.fs.toFixed(3) }).aReason, 'noRotation');
  assert.equal(M.checkSingle(q, { aText: s.a.toFixed(3), fText: '0' }).fReason, 'zero');
});
