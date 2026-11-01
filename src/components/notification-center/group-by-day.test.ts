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

  it('UIC-NOTIFICATION-CENTER-1.2 reads instants in the given time zone, whatever the device zone', () => {
    const dayOf = (time: string, timeZone: string, now: Date | null = null) =>
      groupByDay([{ time }], { ...options, now, timeZone })[0];
    // Near midnight: UTC, an offset and a named zone all convert to the given zone.
    expect(dayOf('2026-11-01T23:30:00Z', 'Asia/Tokyo')?.day).toBe('2026-11-02');
    expect(dayOf('2026-11-01T10:00:00-05:00', 'Asia/Tokyo')?.day).toBe('2026-11-02');
    expect(dayOf('2026-11-01T08:30:00[America/Los_Angeles]', 'Asia/Tokyo')?.day).toBe('2026-11-02');
    expect(dayOf('2026-11-01T23:30:00Z', 'Pacific/Honolulu')?.day).toBe('2026-11-01');
    // Floating and date-only values read as written, in every zone.
    expect(dayOf('2026-11-01T23:30:00', 'Asia/Tokyo')?.day).toBe('2026-11-01');
    expect(dayOf('2026-11-01', 'Pacific/Kiritimati')?.day).toBe('2026-11-01');
    // Across the end of daylight saving time in New York (06:00 UTC on 1 November 2026).
    expect(dayOf('2026-11-01T03:59:00Z', 'America/New_York')?.day).toBe('2026-10-31');
    expect(dayOf('2026-11-01T05:30:00Z', 'America/New_York')?.day).toBe('2026-11-01');
    expect(dayOf('2026-11-02T04:30:00Z', 'America/New_York')?.day).toBe('2026-11-01');
    // Today is read in the same zone: 23:30 UTC on 31 October is today in Tokyo at 07:00 UTC.
    const tokyoNow = new Date('2026-11-01T07:00:00Z');
    expect(dayOf('2026-10-31T23:30:00Z', 'Asia/Tokyo', tokyoNow)?.label).toBe('Today');
  });
});
