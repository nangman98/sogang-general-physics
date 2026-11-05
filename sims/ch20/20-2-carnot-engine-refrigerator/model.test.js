// node --test sims/ch20/20-2-carnot-engine-refrigerator/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const defaults = activity => ({ ...Object.fromEntries(M.params.map(q => [q.id, q.value])), activity });

test('Sample Problem 20.2.1: T_H = 850 K, T_L = 300 K, W = 1200 J → ε = 0.647, |Q_H| = 1855 J, |Q_L| = 655 J, ΔS = ±2.18 J/K', () => {
  // W = nR(T_H − T_L) ln r for the model cycle; pick n = 1 mol and the r that gives 1200 J per cycle.
  const p = { activity: 'engine', TH: 850, TL: 300, n: 1, r: Math.exp(1200 / (M.R * 550)) }, c = M.cycle(p);
  close(c.W, 1200, 1e-12);
  assert.equal(c.eps.toFixed(3), '0.647');
  assert.equal(Math.round(c.QH), 1855); assert.equal(Math.round(c.QL), 655);
  assert.equal(c.dSH.toFixed(2), '2.18'); assert.equal(c.dSL.toFixed(2), '-2.18');
  assert.equal((1200 / 0.25 / 1000).toFixed(1), '4.8');            // average power W/t in kW, part (b)
});

test('Sample Problem 20.2.2: between the boiling and freezing points of water ε_C = 0.268 < 0.75', () => {
  const c = M.cycle({ activity: 'engine', TH: 373, TL: 273, n: 1, r: 2 });
  assert.equal(c.eps.toFixed(3), '0.268'); assert.ok(c.eps < 0.75);
});

test('the cycle: adiabats keep TV^(γ−1) and pV^γ (Eqs. 19.9.1, 19.9.4), heats, ε = 1 − T_L/T_H, ΔS = 0 per cycle', () => {
  for (const [TH, TL, n, r] of [[500, 300, 1, 2], [800, 250, 2, 3], [410, 380, 0.5, 1.5]]) {
    const p = { activity: 'engine', TH, TL, n, r }, c = M.cycle(p), g = M.GAMMA;
    close(c.T.b * c.V.b ** (g - 1), c.T.c * c.V.c ** (g - 1)); close(c.T.d * c.V.d ** (g - 1), c.T.a * c.V.a ** (g - 1));
    close(c.P.b * c.V.b ** g, c.P.c * c.V.c ** g); close(c.P.d * c.V.d ** g, c.P.a * c.V.a ** g);
    close(c.V.c / c.V.d, c.V.b / c.V.a);
    close(c.eps, 1 - TL / TH); close(c.QH / TH, c.QL / TL); close(c.dSH + c.dSL, 0, 1e-12);
    close(c.W, n * M.R * (TH - TL) * Math.log(r));
  }
});

test('playback: ∮p dV over one cycle = W = |Q_H| − |Q_L|, the first law holds stroke by stroke, and the gas returns to a', () => {
  for (const activity of ['engine', 'fridge']) {
    const p = defaults(activity), c = M.cycle(p), D = M.duration(), N = 200000;
    let W = 0, prev = M.stateAt(0, p);
    for (let i = 1; i <= N; i++) {                                    // trapezoid ∫p dV along the timeline (kPa·L = J)
      const s = M.stateAt(D * i / N, p); W += (s.p + prev.p) / 2 * (s.V - prev.V); prev = s;
    }
    close(W, activity === 'engine' ? c.W : -c.W, 1e-5);
    const end = M.stateAt(D, p);
    close(end.V, c.V.a); close(end.T, c.TH); close(end.S, 0, 1e-9); close(end.Wby, activity === 'engine' ? c.W : -c.W, 1e-9);
    close(end.x, M.STATION[M.strokes(p)[0][3]]);
    // First law per instant: ΔE_int = nC_V(T − T_H) = Q − W with Q the heat taken in so far.
    for (const t of [0.3, 1.7, 2.9, 4.4, 6.1, 7.7]) {
      const s = M.stateAt(t, p);
      close(p.n * M.CV * (s.T - c.TH), s.Qhot + s.Qcold - s.Wby, 1e-9);
      assert.ok(s.p > 0 && s.V >= c.V.a - 1e-9 && s.V <= c.V.c + 1e-9);
    }
  }
});

test('refrigerator: same states run backward, heat in at T_L and out at T_H, K = T_L/(T_H − T_L) = |Q_L|/|W| (Eqs. 20.3.1–20.3.3)', () => {
  const p = defaults('fridge'), c = M.cycle(p);
  assert.deepEqual(M.strokes(p).map(s => s[0] + s[1]).join(' '), 'ad dc cb ba');
  close(c.K, c.TL / (c.TH - c.TL)); close(c.K, c.QL / (c.QH - c.QL)); close(c.K, (1 - c.eps) / c.eps);
  const mid = M.stateAt(M.T_ADI + M.T_MOVE + M.T_ISO / 2, p);       // halfway through the isothermal expansion dc
  assert.equal(mid.heatAt, 'cold'); assert.ok(mid.Qcold > 0);
  const end = M.stateAt(M.duration(), p);
  close(end.Qcold, c.QL); close(end.Qhot, -c.QH);
});

test('the cylinder never jumps between stations', () => {
  const p = defaults('engine'), D = M.duration();
  let prev = M.stateAt(0, p).x;
  for (let i = 1; i <= 2000; i++) { const x = M.stateAt(D * i / 2000, p).x; assert.ok(Math.abs(x - prev) < 0.05); prev = x; }
});

test('grading with the named mistakes, distinct from the answer at the default values', () => {
  const e = defaults('engine'), c = M.cycle(e), Q = c.QL.toFixed(1), E = c.eps.toFixed(3);
  assert.equal(M.checkEngine(e, { eText: E, qText: Q }).ok, true);
  assert.equal(M.checkEngine(e, { eText: (c.eps * 100).toFixed(1), qText: Q }).ok, true);   // in %
  assert.equal(M.checkEngine(e, { eText: (c.TL / c.TH).toFixed(3), qText: Q }).eReason, 'ratio');
  assert.equal(M.checkEngine(e, { eText: ((c.TH - c.TL) / c.TL).toFixed(3), qText: Q }).eReason, 'overL');
  assert.equal(M.checkEngine(e, { eText: (1 - c.TH / c.TL).toFixed(3), qText: Q }).eReason, 'flip');
  assert.equal(M.checkEngine(e, { eText: E, qText: '0' }).qReason, 'zero');
  assert.equal(M.checkEngine(e, { eText: E, qText: c.QH.toFixed(1) }).qReason, 'same');
  assert.equal(M.checkEngine(e, { eText: E, qText: (c.QH * c.TH / c.TL).toFixed(1) }).qReason, 'inverse');
  assert.equal(M.checkEngine(e, { eText: E, qText: c.W.toFixed(1) }).qReason, 'work');
  const f = defaults('fridge'), d = M.cycle(f), K = d.K.toFixed(3), W = d.W.toFixed(2);
  assert.equal(M.checkFridge(f, { kText: K, wText: W }).ok, true);
  assert.equal(M.checkFridge(f, { kText: (d.TH / (d.TH - d.TL)).toFixed(3), wText: W }).kReason, 'hot');
  assert.equal(M.checkFridge(f, { kText: (d.TL / d.TH).toFixed(3), wText: W }).kReason, 'ratio');
  assert.equal(M.checkFridge(f, { kText: (1 - d.TL / d.TH).toFixed(3), wText: W }).kReason, 'engine');
  assert.equal(M.checkFridge(f, { kText: ((d.TH - d.TL) / d.TL).toFixed(3), wText: W }).kReason, 'inverse');
  assert.equal(M.checkFridge(f, { kText: K, wText: '0' }).wReason, 'zero');
  assert.equal(M.checkFridge(f, { kText: K, wText: (d.QL * d.K).toFixed(1) }).wReason, 'times');
  assert.equal(M.checkFridge(f, { kText: K, wText: d.QL.toFixed(1) }).wReason, 'same');
  assert.equal(M.checkFridge(f, { kText: K, wText: d.QH.toFixed(1) }).wReason, 'hot');
  assert.equal(M.checkFridge(f, { kText: 'x', wText: W }).kReason, 'unreadable');
  const far = (x, y) => assert.ok(Math.abs(x - y) > 0.02 * Math.abs(y), `${x} too close to ${y}`);
  for (const x of [c.TL / c.TH, (c.TH - c.TL) / c.TL]) far(x, c.eps);
  for (const x of [c.QH, c.QH * c.TH / c.TL, c.W]) far(x, c.QL);
  for (const x of [d.TH / (d.TH - d.TL), d.TL / d.TH, 1 - d.TL / d.TH, (d.TH - d.TL) / d.TL]) far(x, d.K);
  for (const x of [d.QL * d.K, d.QL, d.QH]) far(x, d.W);
});
