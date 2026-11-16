import test from 'node:test';
import assert from 'node:assert/strict';
import { QUANTITIES as Q, prefixed, nearest, log10Of } from './sizes.js';

test('textbook table rows and values (Tables 1.1.3, 1.2.1, 1.3.1)', () => {
  assert.equal(Q.length.items.length, 10);
  assert.equal(Q.time.items.length, 10);
  assert.equal(Q.mass.items.length, 14);
  const get = (q, name) => Q[q].items.find(r => r[0] === name).slice(1);
  assert.deepEqual(get('length', '지구 반지름'), [6, 6]);
  assert.deepEqual(get('length', '양성자 반지름'), [1, -15]);
  assert.deepEqual(get('time', '하루의 길이'), [9, 4]);
  assert.deepEqual(get('time', '플랑크 시간'), [1, -43]);
  assert.deepEqual(get('mass', '코끼리'), [5, 3]);
  assert.deepEqual(get('mass', '전자'), [9, -31]);
});

test('slider range covers every table row', () => {
  for (const q of Object.values(Q)) {
    for (const r of q.items) assert.ok(log10Of(r) >= q.min && log10Of(r) <= q.max + 1, r[0]);
  }
});

test('prefix form', () => {
  assert.deepEqual(prefixed(Q.length, 0), { coef: 1, symbol: 'm', reading: '미터' });
  assert.deepEqual(prefixed(Q.length, 6), { coef: 1, symbol: 'Mm', reading: '메가미터' });
  assert.deepEqual(prefixed(Q.length, -1), { coef: 10, symbol: 'cm', reading: '센티미터' });
  assert.deepEqual(prefixed(Q.length, 26), { coef: 100, symbol: 'Ym', reading: '요타미터' });
  assert.deepEqual(prefixed(Q.time, -9), { coef: 1, symbol: 'ns', reading: '나노초' });
  assert.deepEqual(prefixed(Q.mass, 0), { coef: 1, symbol: 'kg', reading: '킬로그램' });
  assert.deepEqual(prefixed(Q.mass, -3), { coef: 1, symbol: 'g', reading: '그램' });
  assert.deepEqual(prefixed(Q.mass, -27), { coef: 1, symbol: 'yg', reading: '욕토그램' });
  assert.equal(prefixed(Q.time, 40), null);
  assert.equal(prefixed(Q.time, -43), null);
  assert.equal(prefixed(Q.mass, 24), null);
});

test('nearest textbook example', () => {
  assert.equal(nearest(Q.length, 6)[0], '지구 반지름');
  assert.equal(nearest(Q.length, 0)[0], '에베레스트산 높이');
  assert.equal(nearest(Q.time, 0)[0], '심장 박동 사이 시간');
  assert.equal(nearest(Q.mass, 0)[0], '포도알');
});
