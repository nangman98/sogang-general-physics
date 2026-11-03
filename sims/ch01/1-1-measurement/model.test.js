// node --test sims/ch01/1-1-measurement/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg}: ${a} vs ${b}`);

test('Table 1.1.2 has 20 prefixes from 10^24 to 10^-24 with unique symbols', () => {
  assert.equal(M.PREFIXES.length, 20);
  assert.equal(new Set(M.PREFIXES.map(p => p[2])).size, 20);
  assert.deepEqual([M.PREFIXES[0][0], M.PREFIXES.at(-1)[0]], [24, -24]);
});

test('prefix form, mass prefixes attach to the gram', () => {
  assert.equal(M.prefixed(1e3, 'length').text, '1.00 km');
  assert.equal(M.prefixed(2.5e7, 'length').text, '25.0 Mm');
  assert.equal(M.prefixed(1e-9, 'time').text, '1.00 ns');
  assert.equal(M.prefixed(1e-3, 'mass').text, '1.00 g');
  assert.equal(M.prefixed(1, 'mass').text, '1.00 kg');
  assert.equal(M.prefixed(1e3, 'mass').text, '1.00 Mg');
  assert.equal(M.prefixed(1e-30, 'mass'), null);              // 10^-27 g is below yocto
});

test('time is shown as the distance light travels, mass as a water cube', () => {
  close(M.sceneLength('time', 1 / M.C), 1, 1e-12, 'light in 1/c seconds travels 1 m');
  close(M.sceneLog('time', 0), Math.log10(299792458), 1e-12, 'log ct');
  close(M.sceneLength('mass', 1), 0.1, 1e-12, '1 kg of water is a 10 cm cube');
  close(M.sceneLength('mass', 1000), 1, 1e-12, '1000 kg of water is a 1 m cube');
  close(10 ** M.sceneLog('mass', 3), 1, 1e-12, 'log form agrees');
});

test('closest object', () => {
  assert.equal(M.nearest('length', 4).name, '에베레스트산 높이');
  assert.equal(M.nearest('time', 4.9).name, '1일');
  assert.equal(M.nearest('mass', 24.8).name, '지구');
});

test('conversion factors for length, area, volume', () => {
  assert.equal(M.conversion('1', 'cm').factor, 100);
  assert.equal(M.conversion('2', 'cm').factor, 1e4);
  assert.equal(M.conversion('3', 'cm').factor, 1e6);
  assert.equal(M.conversion('3', 'mm').factor, 1e9);
});

test('questions and answer check, including the common mistakes', () => {
  const q0 = M.question(0, '3', 'cm');                       // 2.0 m^3 -> cm^3
  assert.equal(q0.answer, 2e6);
  assert.deepEqual(M.check(q0, '2e6'), { ok: true });
  assert.deepEqual(M.check(q0, '2.0×10^6'), { ok: true });
  assert.deepEqual(M.check(q0, '2,000,000'), { ok: true });
  assert.equal(M.check(q0, '200').reason, 'power');           // multiplied by 100 once
  assert.equal(M.check(q0, '2e-6').reason, 'direction');
  assert.equal(M.check(q0, 'abc').reason, 'unreadable');
  const q1 = M.question(1, '2', 'cm');                       // 3.5e4 cm^2 -> m^2
  assert.equal(q1.from, 'cm²');
  close(q1.answer, 3.5, 1e-12, 'back to m^2');
  assert.equal(M.check(q1, '350').reason, 'power');
});

test('balance compares m = rho V', () => {
  const b = M.balance({ matA: 'water', a: 5, matB: 'iron', b: 3 });
  close(b.mA, 125, 1e-12, 'water 5 cm cube 125 g');
  close(b.mB, 7.87 * 27, 1e-12, 'iron 3 cm cube');
  assert.equal(b.side, 'right');
  const edge = 5 * Math.cbrt(1.00 / 7.87);                   // equal mass edge for iron
  assert.equal(M.balance({ matA: 'water', a: 5, matB: 'iron', b: Math.round(edge * 100) / 100 }).level, true);
  assert.equal(M.balance({ matA: 'water', a: 5, matB: 'iron', b: Math.round(edge * 100) / 100 + 0.1 }).level, false);
});

test('reference values agree with their sources to 3 significant figures', () => {
  const ref = Object.fromEntries(Object.values(M.OBJECTS).flatMap(list => list.map(o => [o.name, o.value])));
  const same3 = (a, b) => Number(a.toPrecision(3)) === Number(b.toPrecision(3));
  assert.ok(same3(ref['양성자 지름'], 2 * 0.8414e-15));                  // CODATA 2018 charge radius
  assert.ok(same3(ref['수소 원자 지름'], 2 * 5.29177210903e-11));        // CODATA 2018 Bohr radius
  assert.ok(same3(ref['지구–태양 거리 (1 au)'], 149597870700));          // IAU 2012 B2
  assert.ok(same3(ref['지구 지름'], 2 * 6371.0e3));                        // IUGG mean radius
  assert.ok(same3(ref['태양 지름'], 2 * 695700e3));                        // IAU 2015 B3 nominal radius
  assert.ok(same3(ref['빛이 태양에서 지구까지'], 149597870700 / 299792458));
  assert.ok(same3(ref['빛이 서울–부산 가는 시간'], 325111 / 299792458));
  assert.ok(same3(ref['물 분자'], 18.015 * 1.66053906660e-27));
  assert.ok(same3(ref['전자'], 9.1093837015e-31));                         // CODATA 2018
  for (const list of Object.values(M.OBJECTS)) for (let i = 1; i < list.length; i++) assert.ok(list[i].value > list[i - 1].value, 'sorted');
});
