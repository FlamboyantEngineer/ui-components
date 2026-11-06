import { describe, expect, it } from 'vitest';
import { getMinimalWeekDays, getWeekNumber } from './week-numbers.js';

describe('week numbers', () => {
  it('UIC-DATE-TIME-FIELD-3.6 numbers ISO weeks across the turn of the year', () => {
    expect(getWeekNumber('2025-12-29', 4)).toBe(1);
    expect(getWeekNumber('2026-01-05', 4)).toBe(2);
    expect(getWeekNumber('2026-12-28', 4)).toBe(53);
    expect(getWeekNumber('2027-01-04', 4)).toBe(1);
    expect(getWeekNumber('2020-12-28', 4)).toBe(53);
    expect(getWeekNumber('2021-12-27', 4)).toBe(52);
    expect(getWeekNumber('2022-01-03', 4)).toBe(1);
  });

  it('UIC-DATE-TIME-FIELD-3.6 numbers weeks holding 1 January as week 1 by a one-day rule', () => {
    // Weeks from Sunday: the week of Sunday 28 December 2025 holds 1 January 2026.
    expect(getWeekNumber('2025-12-28', 1)).toBe(1);
    expect(getWeekNumber('2026-01-04', 1)).toBe(2);
    expect(getWeekNumber('2026-12-27', 1)).toBe(1);
    expect(getWeekNumber('2026-12-20', 1)).toBe(52);
  });

  it('UIC-DATE-TIME-FIELD-3.6 numbers weeks that start on another weekday', () => {
    // Weeks from Saturday with the four-day rule: 3 January 2026 starts week 1.
    expect(getWeekNumber('2026-01-03', 4)).toBe(1);
    expect(getWeekNumber('2025-12-27', 4)).toBe(52);
  });

  it('UIC-DATE-TIME-FIELD-3.6 reads the first-week rule from the locale', () => {
    expect(getMinimalWeekDays('iso', 'en-US')).toBe(4);
    expect(getMinimalWeekDays('locale', 'en-US')).toBe(1);
    expect(getMinimalWeekDays('locale', 'de-DE')).toBe(4);
    expect(getMinimalWeekDays('locale', 'fr')).toBe(4);
    expect(getMinimalWeekDays('locale', 'ja-JP')).toBe(1);
  });
});
