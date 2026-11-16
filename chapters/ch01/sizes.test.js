import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUANTITIES as Q, prefixed, nearest, log10Of, sourceOf } from './sizes.js';

test('textbook table rows and values (Tables 1.1.3, 1.2.1, 1.3.1)', () => {
  const table = q => Q[q].items.filter(r => r[3] === undefined).length;
  assert.equal(table('length'), 10);
  assert.equal(table('time'), 10);
  assert.equal(table('mass'), 14);
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
  assert.equal(nearest(Q.length, 0)[0], '사람의 키');
  assert.equal(nearest(Q.length, -2)[0], '킬로그램 원기의 높이');
  assert.equal(nearest(Q.time, 0)[0], '심장 박동 사이 시간');
  assert.equal(nearest(Q.mass, 0)[0], '킬로그램 원기');
  assert.equal(nearest(Q.time, 3)[0], '한 시간');
});

test('sources and pictures', () => {
  assert.equal(sourceOf(Q.length, Q.length.items[0]), '교재 표 1.1.3');
  assert.equal(sourceOf(Q.mass, Q.mass.items.find(r => r[0] === '킬로그램 원기')), '교재 1.3');
  const credits = JSON.parse(readFileSync(new URL('./img/credits.json', import.meta.url)));
  for (const q of Object.values(Q)) for (const r of q.items) {
    const c = credits[r[0]];
    assert.ok(c, `no picture for ${r[0]}`);
    assert.match(c.license, /^(Public domain|CC0)$/, `${r[0]}: ${c.license}`);
  }
});
