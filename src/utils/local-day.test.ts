import { describe, expect, it } from 'vitest';
import { toLocalDay } from './local-day.js';

describe('toLocalDay', () => {
  it('UIC-TABLE-2.9 reads a date as its local four-digit day', () => {
    expect(toLocalDay(new Date(2024, 4, 1, 23, 30))).toBe('2024-05-01');
    const early = new Date(2024, 0, 1);
    early.setFullYear(999);
    expect(toLocalDay(early)).toBe('0999-01-01');
  });

  it('UIC-TABLE-2.9 gives no day for an invalid date or a year outside 1 to 9999', () => {
    expect(toLocalDay(new Date(Number.NaN))).toBeNull();
    for (const year of [0, -1, 10000]) {
      const date = new Date(2024, 0, 1);
      date.setFullYear(year);
      expect(toLocalDay(date)).toBeNull();
    }
  });
});
