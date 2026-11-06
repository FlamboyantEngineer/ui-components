import { describe, expect, it } from 'vitest';
import { findDatesIssue, normalizeDates } from './multi-date-values.js';

describe('multi-date values', () => {
  it('UIC-MULTI-DATE-FIELD-1.2 writes each date once, earliest first', () => {
    expect(normalizeDates(['2026-04-20', '2026-04-03', '2026-04-20', '2025-12-31'])).toEqual([
      '2025-12-31',
      '2026-04-03',
      '2026-04-20',
    ]);
    expect(normalizeDates([])).toEqual([]);
  });

  it('UIC-MULTI-DATE-FIELD-1.2 refuses texts that are no calendar dates', () => {
    expect(findDatesIssue(['2026-02-30'], {})).toEqual({ kind: 'unreadable' });
    expect(findDatesIssue(['2026-04-13T10:00'], {})).toEqual({ kind: 'unreadable' });
    expect(findDatesIssue(['2026-04-13'], {})).toBeNull();
  });

  it('UIC-MULTI-DATE-FIELD-1.4 checks bounds, unavailable dates and the most dates', () => {
    const rules = {
      minValue: '2026-04-01',
      maxValue: '2026-04-30',
      isDateUnavailable: (date: string) => date === '2026-04-18',
      maxValues: 2,
    };
    expect(findDatesIssue(['2026-03-31'], rules)).toEqual({
      kind: 'bound',
      bound: 'min',
      limit: '2026-04-01',
    });
    expect(findDatesIssue(['2026-05-01'], rules)).toEqual({
      kind: 'bound',
      bound: 'max',
      limit: '2026-04-30',
    });
    expect(findDatesIssue(['2026-04-18'], rules)).toEqual({ kind: 'unavailable' });
    expect(findDatesIssue(['2026-04-01', '2026-04-02', '2026-04-03'], rules)).toEqual({
      kind: 'too-many',
      maxValues: 2,
    });
    // Repeats count once.
    expect(findDatesIssue(['2026-04-01', '2026-04-01', '2026-04-02'], rules)).toBeNull();
  });
});
