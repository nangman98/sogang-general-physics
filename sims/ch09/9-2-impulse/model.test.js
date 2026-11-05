// node --test sims/ch09/9-2-impulse/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 9.4.1: header, 0.400 kg from 65 km/h to 20 km/h back, J = 9.4 kg·m/s; head 1.8 m/s, 17.1g', () => {
  const vin = 65 / 3.6, vout = 20 / 3.6, J = 0.400 * (vout + vin);
  close(+J.toFixed(3), 9.444);
  // The same impulse as a triangular pulse over 11 ms gives the textbook final velocity.
  const p = { activity: 'pulse', shape: 'triangle', m: 0.400, vin, Fmax: 2 * J / 0.011, dt: 11 };
  const s = M.setup(p);
  close(s.J, J); close(s.vf, vout); close(s.Favg, J / 0.011);
  const vHead = J / 5.11, aHead = vHead / 0.011;
  close(+vHead.toFixed(3), 1.848); close(aHead, 167.8, 2e-3); close(+(aHead / 9.8).toFixed(1), 17.1);   // textbook prints 167.8, 1.848/0.011 = 168.0
});

test('impulse is the area under F(t) (Eq. 9.4.3): closed forms match numerical integration', () => {
  for (const shape of ['triangle', 'sine']) {
    const s = M.pulseShape(shape, 1200, 0.008);
    let A = 0; const n = 4000, h = 0.008 / n;
    for (let i = 0; i < n; i++) A += h / 6 * (s.f(i * h) + 4 * s.f((i + 0.5) * h) + s.f((i + 1) * h));
    close(A, s.total, 1e-9);
    for (const u of [0.001, 0.004, 0.0065]) {
      let a = 0; const m = 2000, k = u / m;
      for (let i = 0; i < m; i++) a += k / 6 * (s.f(i * k) + 4 * s.f((i + 0.5) * k) + s.f((i + 1) * k));
      close(a, s.J(u), 1e-6);                                         // Simpson across the kink of the triangle
    }
  }
  close(M.pulseShape('triangle', 1000, 0.01).total, 5);
  close(M.pulseShape('sine', 1000, 0.01).total, 2 / Math.PI * 10);
});

test('Δp = J through the contact; F_avg Δt = J (Eq. 9.4.8)', () => {
  const p = { activity: 'pulse', shape: 'sine', m: 0.4, vin: 10, Fmax: 1000, dt: 10 };
  const s = M.setup(p);
  for (const tau of [M.APPROACH + 0.3, M.APPROACH + 1.2, M.APPROACH + M.CONTACT_SHOW]) { const o = M.stateAt(tau, p); close(p.m * (o.v + p.vin), o.J, 1e-9); }
  close(M.stateAt(M.APPROACH + M.CONTACT_SHOW + 0.1, p).v, s.vf); close(s.Favg * s.dt, s.J);
  const c = M.setup({ activity: 'cushion', m: 0.4, vin: 10, dtc: 20 });
  close(c.J, 4); close(c.Favg, 200); close(c.Fmax, 400); close(c.vf, 0);
  const o = M.stateAt(M.APPROACH + M.CONTACT_SHOW, { activity: 'cushion', m: 0.4, vin: 10, dtc: 20 });
  close(o.v, 0, 1e-12);
});

test('grading with the named mistakes', () => {
  const p = { activity: 'pulse', shape: 'triangle', m: 0.4, vin: 10, Fmax: 1000, dt: 10 };   // J = 5 N·s, v_f = +2.5 m/s
  assert.equal(M.checkPulse(p, { JText: '5', vText: '2.5' }).ok, true);
  assert.equal(M.checkPulse(p, { JText: '10', vText: '2.5' }).JReason, 'rectangle');
  assert.equal(M.checkPulse(p, { JText: '5000', vText: '2.5' }).JReason, 'ms');
  assert.equal(M.checkPulse(p, { JText: '5', vText: '22.5' }).vReason, 'noSign');
  assert.equal(M.checkPulse(p, { JText: '5', vText: '-2.5' }).vReason, 'sign');
  assert.equal(M.checkPulse(p, { JText: '5', vText: '12.5' }).vReason, 'noVi');
  const c = { activity: 'cushion', m: 0.4, vin: 10, dtc: 20 };                          // F_avg = 200 N
  assert.equal(M.checkCushion(c, { FText: '200' }).ok, true);
  assert.equal(M.checkCushion(c, { FText: '400' }).reason, 'peak');
  assert.equal(M.checkCushion(c, { FText: '0.2' }).reason, 'ms');
  assert.equal(M.checkCushion(c, { FText: '4' }).reason, 'noTime');
});

test('every slider setting gives finite values through the run', () => {
  const byId = Object.fromEntries(M.params.map(c => [c.id, c]));
  const pick = (c, u) => c.min + Math.round(u * (c.max - c.min) / c.step) * c.step;
  let seed = 29;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 300; k++) {
    const p = { activity: k % 2 ? 'cushion' : 'pulse', shape: rnd() < 0.5 ? 'triangle' : 'sine' };
    for (const id of ['m', 'vin', 'Fmax', 'dt', 'dtc']) p[id] = pick(byId[id], rnd());
    const T = M.duration(p);
    for (const t of [0, 0.3 * T, 0.5 * T, T]) for (const [key, val] of Object.entries(M.stateAt(t, p))) if (typeof val === 'number') assert.ok(Number.isFinite(val), key);
    assert.ok(M.stateAt(T, p).x >= 0);
  }
});
