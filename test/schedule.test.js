const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextDueDate, endOfDay } = require('../utils/schedule');

const iso = (date) => date.toISOString();

test('nextDueDate advances by the mandate frequency', () => {
  const start = new Date('2026-01-15T00:00:00Z');
  assert.equal(iso(nextDueDate(start, '2min')), '2026-01-15T00:02:00.000Z');
  assert.equal(iso(nextDueDate(start, 'daily')), '2026-01-16T00:00:00.000Z');
  assert.equal(iso(nextDueDate(start, 'weekly')), '2026-01-22T00:00:00.000Z');
  assert.equal(iso(nextDueDate(start, 'monthly')), '2026-02-15T00:00:00.000Z');
  assert.equal(iso(nextDueDate(start, 'yearly')), '2027-01-15T00:00:00.000Z');
  assert.equal(nextDueDate(start, 'asNeeded'), null);
});

test('monthly schedule clamps to the end of shorter months', () => {
  assert.equal(iso(nextDueDate(new Date('2026-01-31T00:00:00Z'), 'monthly')), '2026-02-28T00:00:00.000Z');
  assert.equal(iso(nextDueDate(new Date('2028-01-31T00:00:00Z'), 'monthly')), '2028-02-29T00:00:00.000Z');
});

test('endOfDay covers the whole end date', () => {
  assert.equal(iso(endOfDay('2026-03-01')), '2026-03-01T23:59:59.999Z');
});
