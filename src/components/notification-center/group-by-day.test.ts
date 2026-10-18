import { describe, expect, it } from 'vitest';
import { groupByDay } from './group-by-day.js';

const options = {
  getDate: (item: { time: string }) => item.time,
  now: new Date(2026, 0, 2, 9, 0),
  locale: 'en-US',
  unknownLabel: 'Earlier',
};

describe('groupByDay', () => {
  it('UIC-NOTIFICATION-CENTER-1.2 groups by local day in the order of first appearance', () => {
    const entries = [
      { id: 1, time: new Date(2026, 0, 2, 8, 0).toISOString() },
      { id: 2, time: 'not a date' },
      { id: 3, time: '2026-01-01' },
      { id: 4, time: new Date(2026, 0, 2, 7, 0).toISOString() },
      { id: 5, time: '2025-12-28T23:30' },
      { id: 6, time: '2025-12-28' },
    ];
    expect(groupByDay(entries, options)).toEqual([
      { day: '2026-01-02', label: 'Today', items: [entries[0], entries[3]] },
      { day: '', label: 'Earlier', items: [entries[1]] },
      { day: '2026-01-01', label: 'Yesterday', items: [entries[2]] },
      { day: '2025-12-28', label: 'Sunday, December 28, 2025', items: [entries[4], entries[5]] },
    ]);
  });

  it('UIC-NOTIFICATION-CENTER-1.2 labels days in the locale and drops the current year', () => {
    const french = { ...options, locale: 'fr-FR' };
    expect(groupByDay([{ time: '2026-01-02' }], french)[0]?.label).toBe('Aujourd’hui');
    expect(groupByDay([{ time: '2026-01-01' }], french)[0]?.label).toBe('Hier');
    expect(groupByDay([{ time: '2026-03-04' }], options)[0]?.label).toBe('Wednesday, March 4');
    expect(groupByDay([], options)).toEqual([]);
  });
});
