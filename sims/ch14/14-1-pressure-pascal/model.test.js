// node --test sims/ch14/14-1-pressure-pascal/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Table 14.1.1 densities and Eq. 14.2.4', () => {
  assert.deepEqual(Object.values(M.LIQUIDS).map(l => l.rho), [998, 1024, 13600]);
  const s = M.depth({ liquid: 'water', h: 10 });
  close(s.gauge, 998 * 9.8 * 10); close(s.p, 1.01e5 + s.gauge);
  // 10 m of water adds about one atmosphere; 0.76 m of mercury holds one atmosphere (760 torr).
  assert.ok(Math.abs(s.gauge / 1.01e5 - 1) < 0.04);
  assert.ok(Math.abs(M.depth({ liquid: 'mercury', h: 0.76 }).gauge / 1.01e5 - 1) < 0.01);
});

test('Eqs. 14.4.3–14.4.5: force gain, volume conservation and equal work', () => {
  const p = { Ai: 10, Ao: 200, Fi: 100, di: 20 }, s = M.hydraulic(p);
  close(s.Fo, 2000); close(s.do, 1); close(p.Ai * p.di, p.Ao * s.do); close(s.Fo * s.do / 100, s.W);
  close(s.Fo / (p.Ao * 1e-4), s.dp);                                  // the same pressure change at both pistons (Eq. 14.4.2)
  const half = M.stateAt(M.RUN / 2, { activity: 'hydraulic', ...p }); close(half.di, 10); close(half.do, 0.5);
});

test('grading with the named mistakes', () => {
  const d = { activity: 'depth', liquid: 'seawater', h: 6 }, s = M.depth(d);
  assert.equal(M.checkDepth(d, { gText: (s.gauge / 1e3).toFixed(2), pText: (s.p / 1e3).toFixed(1) }).ok, true);
  assert.equal(M.checkDepth(d, { gText: (s.gauge / 1e3).toFixed(2), pText: (s.gauge / 1e3).toFixed(2) }).pReason, 'noP0');
  assert.equal(M.checkDepth(d, { gText: (s.p / 1e3).toFixed(1), pText: (s.p / 1e3).toFixed(1) }).gReason, 'absolute');
  assert.equal(M.checkDepth(d, { gText: (1024 * 6 / 1e3).toFixed(3), pText: (s.p / 1e3).toFixed(1) }).gReason, 'noG');
  const h = { activity: 'hydraulic', Ai: 10, Ao: 200, Fi: 100, di: 20 };
  assert.equal(M.checkHydraulic(h, { FText: '2000', dText: '1' }).ok, true);
  assert.equal(M.checkHydraulic(h, { FText: '5', dText: '1' }).FReason, 'inverse');
  assert.equal(M.checkHydraulic(h, { FText: '2000', dText: '20' }).dReason, 'same');
  assert.equal(M.checkHydraulic(h, { FText: '2000', dText: '400' }).dReason, 'inverse');
});
