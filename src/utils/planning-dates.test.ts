import { describe, expect, it } from 'vitest';
import { isPlanningDate, planningDateRange, toPlanningDate } from './planning-dates.js';

describe('planning dates', () => {
  it('UIC-CALENDAR-VIEW-1.6 UIC-TIMELINE-1.2 accepts real days inside the supported range', () => {
    expect(planningDateRange).toEqual({ start: '0002-01-01', end: '9998-12-31' });
    expect(['0002-01-01', '2026-03-18', '9998-12-31'].map(isPlanningDate)).toEqual([
      true,
      true,
      true,
    ]);
    expect(
      ['0001-12-31', '9999-01-01', '2026-02-30', '2026-3-18', '', undefined].map(isPlanningDate),
    ).toEqual([false, false, false, false, false, false]);
  });

  it('UIC-CALENDAR-VIEW-1.6 moves a real day into the supported range', () => {
    expect(toPlanningDate('0001-01-01')).toBe('0002-01-01');
    expect(toPlanningDate('9999-12-31')).toBe('9998-12-31');
    expect(toPlanningDate('2026-03-18')).toBe('2026-03-18');
    expect(toPlanningDate('2026-02-30')).toBeNull();
    expect(toPlanningDate(null)).toBeNull();
  });
});
