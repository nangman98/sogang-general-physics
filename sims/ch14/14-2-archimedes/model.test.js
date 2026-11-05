// node --test sims/ch14/14-2-archimedes/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Sample Problem 14.5.2: ρ = 800, ρ_f = 1200 kg/m³, H = 6.0 cm → h = 4.0 cm, a = 4.9 m/s² when released submerged', () => {
  M.FLUIDS.test = { label: 'test', rho: 1200 };
  const s = M.floatBlock({ fluid: 'test', rho: 800, H: 6 });
  close(s.h * 100, 4.0); close(s.a0, 4.9);
  delete M.FLUIDS.test;
});

test('Sample Problem 14.5.1: F_b = ρ_w V g = 2.509 × 10² N for V = 2.50 × 10⁻² m³ of seawater', () => {
  const s = M.weigh({ solid: 'iron', fluid: 'seawater', V: 2.5e4 });
  assert.equal((s.Fb / 100).toFixed(3), '2.509');
});

test('floating: F_b = F_g at the floating depth; the bobbing satisfies Newton’s second law and stays in the fluid', () => {
  const p = { activity: 'float', fluid: 'water', rho: 800, H: 10 }, s = M.floatBlock(p), m = p.rho * s.Hm ** 3;
  close(M.FLUIDS.water.rho * s.h * s.Hm ** 2 * M.G, m * M.G);       // Eqs. 14.5.2, 14.5.3
  close(M.floatAt(0, p).a, s.a0); close(M.floatAt(0, p).sub, s.Hm);
  const hh = 1e-4, sub = t => M.floatAt(t, p).sub;
  for (const t of [0.1, 0.33, 0.9]) close(-(sub(t + hh) - 2 * sub(t) + sub(t - hh)) / (hh * hh), M.floatAt(t, p).a, 1e-5);
  for (const t of [0, 0.2, 0.4, 1.0, 1.7]) { const q = M.floatAt(t, p).sub; assert.ok(q >= -1e-12 && q <= s.Hm + 1e-12); }
  for (const f of ['water', 'seawater', 'mercury']) {                 // slider bounds keep 2h − H ≥ 0
    const [lo] = M.params.find(q => q.id === 'rho').bounds({ fluid: f });
    assert.ok(2 * M.floatBlock({ fluid: f, rho: lo, H: 10 }).h - 0.1 >= -1e-12);
  }
});

test('apparent weight (Eq. 14.5.4) and the scale reading during lowering', () => {
  const p = { activity: 'weigh', solid: 'aluminum', fluid: 'water', V: 500 }, s = M.weigh(p);
  close(s.app, (2710 - 998) * 500e-6 * 9.8); close(M.weighAt(0, p).reading, s.W); close(M.weighAt(M.RUN_WEIGH, p).reading, s.app);
});

test('grading with the named mistakes', () => {
  const f = { activity: 'float', fluid: 'water', rho: 800, H: 10 }, s = M.floatBlock(f);
  assert.equal(M.checkFloat(f, { hText: (s.h * 100).toFixed(2), aText: s.a0.toFixed(3) }).ok, true);
  assert.equal(M.checkFloat(f, { hText: (10 - s.h * 100).toFixed(2), aText: s.a0.toFixed(3) }).hReason, 'above');
  assert.equal(M.checkFloat(f, { hText: (s.h * 100).toFixed(2), aText: '9.8' }).aReason, 'g');
  const w = { activity: 'weigh', solid: 'aluminum', fluid: 'water', V: 500 }, t = M.weigh(w);
  assert.equal(M.checkWeigh(w, { bText: t.Fb.toFixed(3), wText: t.app.toFixed(3) }).ok, true);
  assert.equal(M.checkWeigh(w, { bText: t.W.toFixed(3), wText: t.app.toFixed(3) }).bReason, 'blockRho');
  assert.equal(M.checkWeigh(w, { bText: t.Fb.toFixed(3), wText: t.W.toFixed(3) }).wReason, 'weight');
});
