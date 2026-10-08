import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCountdown, parseCsv, parseDate } from '../countdown.js';

test('today is separate; weekends and absences are excluded', () => {
  const result = calculateCountdown(new Date(2026, 9, 7, 10, 30), ['2026-10-09'], '2026-10-12');
  assert.equal(result.calendarDays, 5);
  assert.equal(result.workdays, 2);
  assert.equal(result.secondsToday, 6 * 3600);
});

test('work time is clamped before and after the working hours', () => {
  assert.equal(calculateCountdown(new Date(2026, 9, 7, 7), []).secondsToday, 8 * 3600);
  assert.equal(calculateCountdown(new Date(2026, 9, 7, 17), []).secondsToday, 0);
  assert.equal(calculateCountdown(new Date(2026, 9, 7, 12), ['2026-10-07']).secondsToday, 0);
  assert.equal(calculateCountdown(new Date(2026, 9, 10, 12), []).secondsToday, 0);
});

test('target day includes remaining time; past target has no remaining time', () => {
  assert.equal(calculateCountdown(new Date(2026, 11, 31, 12), []).secondsToday, 16200);
  assert.deepEqual(calculateCountdown(new Date(2027, 0, 1), []), {
    calendarDays: 0, workdays: 0, secondsToday: 0, finished: true,
  });
});

test('calendar days are independent of daylight saving transitions', () => {
  assert.equal(calculateCountdown(new Date(2026, 9, 24, 12), [], '2026-10-26').calendarDays, 2);
});

test('CSV supports comments, single-digit dates and deduplication', () => {
  assert.deepEqual(parseCsv('# Urlaub\r\n7.9.2026\r\n07.09.2026\n\n9.10.2026'), ['2026-09-07', '2026-10-09']);
  assert.throws(() => parseCsv('31.2.2026'), /Zeile 1/);
  assert.throws(() => parseCsv('Datum\n7.9.2026'), /Zeile 1/);
  assert.throws(() => parseDate('2026-02-31'));
});