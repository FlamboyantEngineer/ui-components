import { describe, expect, it } from 'vitest';
import { listPage, readPeriod, toFormatDate, toPage, writePeriod } from './period-values.js';

describe('period values', () => {
  it('UIC-PERIOD-FIELD-1.1 reads and writes months and years without a day', () => {
    expect(readPeriod('2026-03', 'month')).toBe(2026 * 12 + 2);
    expect(writePeriod(2026 * 12 + 2, 'month')).toBe('2026-03');
    expect(readPeriod('2026', 'year')).toBe(2026);
    expect(writePeriod(2026, 'year')).toBe('2026');
    expect(writePeriod(5 * 12, 'month')).toBe('0005-01');
    for (const text of ['2026-13', '2026-3', '2026-03-01', '26', '2026-00']) {
      expect(readPeriod(text, 'month')).toBeNull();
    }
    expect(readPeriod('2026-03', 'year')).toBeNull();
  });

  it('UIC-PERIOD-FIELD-1.3 pages twelve months by year and twelve years at a time', () => {
    const march = readPeriod('2026-03', 'month') ?? 0;
    expect(listPage(toPage(march)).map((index) => writePeriod(index, 'month'))).toEqual(
      Array.from({ length: 12 }, (_, month) => `2026-${String(month + 1).padStart(2, '0')}`),
    );
    expect(listPage(toPage(2026)).map((index) => writePeriod(index, 'year'))[0]).toBe('2016');
    expect(toFormatDate(march, 'month').toISOString()).toBe('2026-03-01T12:00:00.000Z');
    expect(toFormatDate(5, 'year').getUTCFullYear()).toBe(5);
  });
});
