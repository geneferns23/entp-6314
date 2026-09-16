import assert from 'node:assert';
import {
  getNextRenewalDate,
  getDaysAway,
  getRenewalStatus,
  getCancelByInfo,
} from '../calculations.js';

// Small runner: no framework, just plain assertions. If anything throws,
// npm test exits non-zero and prints the failure.
function test(name, fn) {
  fn();
  console.log(`ok - ${name}`);
}

const today = { year: 2026, month: 9, day: 15 };

test('monthly, anchor 2026-08-15 -> 2026-09-15, 0 days', () => {
  const anchor = { year: 2026, month: 8, day: 15 };
  const next = getNextRenewalDate(anchor, 'monthly', today);
  assert.deepStrictEqual(next, { year: 2026, month: 9, day: 15 });
  assert.strictEqual(getDaysAway(next, today), 0);
});

test('monthly, anchor 2026-08-14 -> 2026-10-14, 29 days', () => {
  const anchor = { year: 2026, month: 8, day: 14 };
  const next = getNextRenewalDate(anchor, 'monthly', today);
  assert.deepStrictEqual(next, { year: 2026, month: 10, day: 14 });
  assert.strictEqual(getDaysAway(next, today), 29);
});

test('monthly, anchor 2026-01-31 -> 2026-09-30, 15 days', () => {
  const anchor = { year: 2026, month: 1, day: 31 };
  const next = getNextRenewalDate(anchor, 'monthly', today);
  assert.deepStrictEqual(next, { year: 2026, month: 9, day: 30 });
  assert.strictEqual(getDaysAway(next, today), 15);
});

test('quarterly, anchor 2026-05-31 -> 2026-11-30, 76 days', () => {
  const anchor = { year: 2026, month: 5, day: 31 };
  const next = getNextRenewalDate(anchor, 'quarterly', today);
  assert.deepStrictEqual(next, { year: 2026, month: 11, day: 30 });
  assert.strictEqual(getDaysAway(next, today), 76);
});

test('annual, anchor 2024-02-29 -> 2027-02-28, 166 days', () => {
  const anchor = { year: 2024, month: 2, day: 29 };
  const next = getNextRenewalDate(anchor, 'annual', today);
  assert.deepStrictEqual(next, { year: 2027, month: 2, day: 28 });
  assert.strictEqual(getDaysAway(next, today), 166);
});

test('status bucket boundaries: 0-7 soon, 8-30 coming up, 31+ later', () => {
  assert.strictEqual(getRenewalStatus(0), 'Renewing soon');
  assert.strictEqual(getRenewalStatus(7), 'Renewing soon');
  assert.strictEqual(getRenewalStatus(8), 'Coming up');
  assert.strictEqual(getRenewalStatus(30), 'Coming up');
  assert.strictEqual(getRenewalStatus(31), 'Later');
});

test('renewal 2026-09-29 with 7 days notice -> cancel by 2026-09-22', () => {
  const renewal = { year: 2026, month: 9, day: 29 };
  const result = getCancelByInfo(renewal, 7, today);
  assert.deepStrictEqual(result.date, { year: 2026, month: 9, day: 22 });
  assert.strictEqual(result.deadlinePassed, false);
});

test('renewal 2026-09-20 with 10 days notice -> deadline passed', () => {
  const renewal = { year: 2026, month: 9, day: 20 };
  const result = getCancelByInfo(renewal, 10, today);
  assert.strictEqual(result.deadlinePassed, true);
  assert.strictEqual(result.date, null);
});

console.log('All tests passed.');
