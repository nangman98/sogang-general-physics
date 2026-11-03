// node --test sims/ch01/1-1-measurement/model.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const obs = (quantity, n) => M.observe(M.init({ quantity, n }), { quantity, n });

test('Table 1.1.2 has 20 prefixes from 10^24 to 10^-24 with unique symbols', () => {
  assert.equal(M.PREFIXES.length, 20);
  assert.equal(new Set(M.PREFIXES.map(p => p[2])).size, 20);
  assert.deepEqual([M.PREFIXES[0][0], M.PREFIXES.at(-1)[0]], [24, -24]);
});

test('length prefixes', () => {
  assert.equal(obs('length', 3).prefixed, '1 km');
  assert.equal(obs('length', 7).prefixed, '10 Mm');
  assert.equal(obs('length', 2).prefixed, '100 m');
  assert.equal(obs('length', -2).prefixed, '10 mm');
  assert.equal(obs('length', -9).prefixed, '1 nm');
  assert.equal(obs('length', -15).prefixed, '1 fm');
});

test('mass prefixes attach to the gram', () => {
  assert.equal(obs('mass', 0).prefixed, '1 kg');
  assert.equal(obs('mass', -3).prefixed, '1 g');
  assert.equal(obs('mass', 3).prefixed, '1 Mg');
  assert.equal(obs('mass', -30).prefixed, null); // 10^-27 g is below yocto
  assert.match(obs('mass', -3).chain, /\(10³ g \/ 1 kg\)/);
});

test('chain-link conversion text uses unity factors', () => {
  assert.equal(obs('time', -9).chain, '10⁻⁹ s × (1 ns / 10⁻⁹ s) = 1 ns');
  assert.equal(obs('length', 0).chain, '10⁰ m = 1 m');
});

test('closest reference picks the nearest power of ten', () => {
  assert.equal(obs('length', 4).nearest.name, 'Height of Mount Everest');
  assert.equal(obs('time', 5).nearest.name, 'One day');
  assert.equal(obs('mass', 25).nearest.name, 'Earth');
});

test('reference values agree with their sources to 3 significant figures', () => {
  const ref = Object.fromEntries(Object.values(M.QUANTITIES).flatMap(q => q.refs.map(r => [r.name, r.value])));
  const same3 = (a, b) => Number(a.toPrecision(3)) === Number(b.toPrecision(3));
  assert.ok(same3(ref['Proton charge radius'], 0.8414e-15));        // CODATA 2018
  assert.ok(same3(ref['Bohr radius'], 5.29177210903e-11));          // CODATA 2018
  assert.ok(same3(ref['Earth–Sun distance (1 au)'], 149597870700)); // IAU 2012 B2
  assert.ok(same3(ref['Electron'], 9.1093837015e-31));              // CODATA 2018
  assert.ok(same3(ref['Proton'], 1.67262192369e-27));               // CODATA 2018
  assert.ok(same3(ref['Atomic mass unit (1 u)'], 1.66053886e-27));  // textbook Eq. (1.3.1)
  assert.equal(ref['One day'], 86400);
});
