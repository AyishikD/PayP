const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseAmount, parseId, parseDateOnly, isValidPin } = require('../utils/validation');

test('parseAmount accepts positive amounts with up to 2 decimals', () => {
  assert.equal(parseAmount(100), 100);
  assert.equal(parseAmount('49.99'), 49.99);
  assert.equal(parseAmount(0.5), 0.5);
});

test('parseAmount rejects negative, zero, non-numeric and over-precise amounts', () => {
  for (const value of [-5000, 0, '0', '-1', 'abc', '1e3', 1.234, NaN, Infinity, null, undefined, {}, '', 2000000]) {
    assert.throws(() => parseAmount(value), { status: 400 }, `expected ${String(value)} to be rejected`);
  }
});

test('parseId accepts positive integers and digit strings only', () => {
  assert.equal(parseId(7), 7);
  assert.equal(parseId('42'), 42);
  for (const value of [0, -1, 1.5, '1.5', 'abc', '', null, undefined]) {
    assert.throws(() => parseId(value), { status: 400 });
  }
});

test('parseDateOnly rejects malformed and impossible dates', () => {
  assert.equal(parseDateOnly('2026-02-28', 'd'), '2026-02-28');
  for (const value of ['2026-02-30', '2026-13-01', '26-01-01', 'today', 20260101]) {
    assert.throws(() => parseDateOnly(value, 'd'), { status: 400 });
  }
});

test('isValidPin requires exactly 5 digits as a string', () => {
  assert.equal(isValidPin('01234'), true);
  assert.equal(isValidPin('1234'), false);
  assert.equal(isValidPin(12345), false);
  assert.equal(isValidPin('12a45'), false);
});
