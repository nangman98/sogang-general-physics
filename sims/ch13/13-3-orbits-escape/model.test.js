// node --test sims/ch13/13-3-orbits-escape/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('Table 13.5.1 escape speeds from Eq. 13.5.8', () => {
  for (const [k, b] of Object.entries(M.BODIES)) {
    const v = M.escape({ body: k, f: 0.5 }).vesc / 1e3;
    assert.ok(Math.abs(v - b.vTable) <= 0.01 * b.vTable + 0.005, `${k} ${v}`);
  }
});

test('Sample Problem 13.7.1: 7.20 kg at 350 km → E = −214 MJ; on the pad −451 MJ', () => {
  const GM = M.G * M.EARTH.M, r = M.EARTH.R + 350e3;
  assert.equal((-GM * 7.2 / (2 * r) / 1e6).toFixed(0), '-214');
  assert.equal((-GM * 7.2 / M.EARTH.R / 1e6).toFixed(0), '-451');
  // The model's E for a circular orbit (f = 1) is −GMm/2r.
  const o = M.orbit({ h: 350, f: 1 }); close(o.E, -GM * M.MSAT / (2 * r)); close(o.a, r, 1e-12);
});

test('Sample Problem 13.7.2: r = 8.00 × 10⁶ m, speed cut to 96% → a = 7.418 × 10⁶ m, T = 106 min', () => {
  const h = (8.00e6 - M.EARTH.R) / 1e3, o = M.orbit({ h, f: 0.96 });
  // The textbook takes v0 from 2πr/T0 with T0 = 7.119 × 10³ s; √(GM/r) differs from it by 0.004%.
  assert.ok(Math.abs(o.a - 7.418e6) <= 0.003e6, `${o.a}`);
  assert.equal(Math.round(o.T / 60), 106);
  assert.equal(o.peri, false); close(o.ra, 8.00e6, 1e-12);            // the firing point becomes the apogee
});

test('energy, Kepler’s second law and r_a + r_p = 2a along the orbit', () => {
  const p = { h: 1000, f: 1.1 }, o = M.orbit(p);
  close(o.rp + o.ra, 2 * o.a); close(o.E, -o.GM * M.MSAT / (2 * o.a));
  for (const t of [0, 0.13 * o.T, 0.5 * o.T, 0.81 * o.T]) { const s = M.orbitAt(t, p); close(s.K + s.U, o.E, 1e-9); }
  close(M.orbitAt(0, p).r, o.r0); close(M.orbitAt(0.5 * o.T, p).r, o.ra);
  // Equal areas in equal times: sectors after perigee and after apogee.
  const area = pts => { let A = 0; for (let i = 1; i < pts.length; i++) A += 0.25 * (pts[i].r ** 2 + pts[i - 1].r ** 2) * (pts[i].phi - pts[i - 1].phi); return A; };
  const a1 = area(M.sectorAngles(p, 0, o.T / 10, 4000)), a2 = area(M.sectorAngles(p, Math.PI, o.T / 10, 4000));
  close(a1, a2, 1e-6);
  const l = o.r0 * o.v; close(a1, 0.5 * l * o.T / 10, 1e-6);            // dA/dt = L/2m (Eq. 13.6.3)
});

test('escape: r_max = R/(1 − f²); the time to the top and back matches the radial equation of motion', () => {
  const p = { body: 'earth', f: 0.7 }, s = M.escape(p);
  close(s.rmax, M.EARTH.R / (1 - 0.49));
  close(M.escapeAt(s.tUp, p).r, s.rmax, 1e-9); close(M.escapeAt(s.tFlight, p).r, M.EARTH.R, 1e-9);
  // d²r/dt² = −GM/r² checked with a central difference.
  const t = 0.4 * s.tUp, hh = 1, r = q => M.escapeAt(q, p).r;
  close((r(t + hh) - 2 * r(t) + r(t - hh)) / (hh * hh), -s.GM / r(t) ** 2, 1e-4);
  close(0.5 * s.v ** 2 - s.GM / s.R, -s.GM / s.rmax);                // energy
});

test('grading with the named mistakes', () => {
  const p = { activity: 'orbit', h: 1000, f: 1.1 }, o = M.orbit(p), Tm = o.T / 60, Hk = (o.other - M.EARTH.R) / 1e3;
  assert.equal(M.checkOrbit(p, { TText: Tm.toFixed(1), hText: Hk.toFixed(0) }).ok, true);
  assert.equal(M.checkOrbit(p, { TText: (o.T0 / 60).toFixed(1), hText: Hk.toFixed(0) }).TReason, 'oldT');
  assert.equal(M.checkOrbit(p, { TText: o.T.toFixed(0), hText: Hk.toFixed(0) }).TReason, 'seconds');
  assert.equal(M.checkOrbit(p, { TText: Tm.toFixed(1), hText: (o.other / 1e3).toFixed(0) }).hReason, 'radius');
  const e = { activity: 'escape', body: 'earth', f: 0.7 }, s = M.escape(e);
  assert.equal(M.checkEscape(e, { vText: (s.vesc / 1e3).toFixed(2), hText: (s.hmax / s.R).toFixed(3) }).ok, true);
  assert.equal(M.checkEscape(e, { vText: (Math.sqrt(s.GM / s.R) / 1e3).toFixed(2), hText: '0.961' }).vReason, 'noTwo');
  assert.equal(M.checkEscape(e, { vText: '11.2', hText: (0.49).toFixed(2) }).hReason, 'uniformG');
  assert.equal(M.checkEscape(e, { vText: '11.2', hText: (s.rmax / s.R).toFixed(3) }).hReason, 'fromCenter');
});
