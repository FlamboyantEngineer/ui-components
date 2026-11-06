import { describe, expect, it } from 'vitest';
import {
  compareDays,
  getDayOf,
  getDayStart,
  getMonthWeeks,
  getWallHours,
  getWeekDays,
  isRepeatedTime,
  isSameMonth,
  moveFocusedDay,
  shiftDay,
  shiftPeriod,
} from './calendar-days.js';
import type { CalendarViewMode } from './calendar-view.js';

const day = (text: string) => text;

describe('calendar days', () => {
  it('UIC-CALENDAR-VIEW-1.1 UIC-CALENDAR-VIEW-1.5 lists the weeks of a month from the locale first day', () => {
    const weeks = getMonthWeeks(day('2026-03-18'), 'en-US');
    expect(weeks).toHaveLength(5);
    expect(weeks[0]?.[0]).toBe('2026-03-01');
    expect(weeks.at(-1)?.at(-1)).toBe('2026-04-04');
    const french = getMonthWeeks(day('2026-03-18'), 'fr-FR');
    expect(french[0]?.[0]).toBe('2026-02-23');
    expect(french).toHaveLength(6);
  });

  it('UIC-CALENDAR-VIEW-1.2 lists the days of a week', () => {
    expect(getWeekDays(day('2026-03-18'), 'en-US')).toEqual([
      '2026-03-15',
      '2026-03-16',
      '2026-03-17',
      '2026-03-18',
      '2026-03-19',
      '2026-03-20',
      '2026-03-21',
    ]);
  });

  it('UIC-CALENDAR-VIEW-4.2 moves the focused day by key', () => {
    const date = day('2026-03-18');
    const move = (key: string, mode: CalendarViewMode = 'month', isRightToLeft = false) =>
      moveFocusedDay(date, { key, mode, isRightToLeft, locale: 'en-US' });
    expect(move('ArrowLeft')).toBe('2026-03-17');
    expect(move('ArrowRight')).toBe('2026-03-19');
    expect(move('ArrowRight', 'month', true)).toBe('2026-03-17');
    expect(move('ArrowLeft', 'month', true)).toBe('2026-03-19');
    expect(move('ArrowUp')).toBe('2026-03-11');
    expect(move('ArrowDown')).toBe('2026-03-25');
    expect(move('Home')).toBe('2026-03-15');
    expect(move('End')).toBe('2026-03-21');
    expect(move('PageUp')).toBe('2026-02-18');
    expect(move('PageDown')).toBe('2026-04-18');
    expect(move('PageDown', 'week')).toBe('2026-03-25');
    expect(move('PageDown', 'day')).toBe('2026-03-19');
    expect(move('PageUp', 'day')).toBe('2026-03-17');
    expect(move('ArrowDown', 'day')).toBe('2026-03-25');
    expect(move('Enter')).toBeNull();
  });

  it('UIC-CALENDAR-VIEW-1.3 shifts by the period of each view', () => {
    expect(shiftPeriod('2026-03-18', 'month', 1)).toBe('2026-04-18');
    expect(shiftPeriod('2026-03-18', 'week', -1)).toBe('2026-03-11');
    expect(shiftPeriod('2026-03-18', 'day', 1)).toBe('2026-03-19');
    expect(shiftPeriod('2026-03-18', 'agenda', 1)).toBe('2026-03-25');
  });

  it('UIC-CALENDAR-VIEW-1.5 reads days in a time zone and shifts them', () => {
    expect(getDayOf(Date.UTC(2026, 2, 18, 2), 'America/New_York')).toBe('2026-03-17');
    expect(getDayStart('2026-03-18', 'UTC')).toBe(Date.UTC(2026, 2, 18));
    expect(shiftDay('2026-01-31', { months: 1 })).toBe('2026-02-28');
    expect(shiftDay('2026-03-18', { weeks: -1, days: 2 })).toBe('2026-03-13');
    expect(compareDays('2026-03-18', '2026-03-19')).toBe(-1);
    expect(compareDays('2026-03-18', '2026-03-18')).toBe(0);
    expect(isSameMonth('2026-03-01', '2026-03-31')).toBe(true);
    expect(isSameMonth('2026-03-31', '2026-04-01')).toBe(false);
    expect(() => shiftDay('soon', { days: 1 })).toThrow(RangeError);
  });

  it('UIC-CALENDAR-VIEW-2.5 reads wall-clock times and repeated times across clock changes', () => {
    const timeZone = 'America/New_York';
    const at = (text: string) => new Date(text).getTime();
    expect(getWallHours(at('2026-03-08T03:30-04:00'), timeZone)).toBe(3.5);
    expect(getWallHours(at('2026-11-01T01:30-04:00'), timeZone)).toBe(1.5);
    expect(getWallHours(at('2026-11-01T01:30-05:00'), timeZone)).toBe(1.5);
    expect(isRepeatedTime(at('2026-11-01T01:30-04:00'), timeZone)).toBe(true);
    expect(isRepeatedTime(at('2026-11-01T01:30-05:00'), timeZone)).toBe(true);
    expect(isRepeatedTime(at('2026-11-01T02:30-05:00'), timeZone)).toBe(false);
    expect(isRepeatedTime(at('2026-03-08T01:30-05:00'), timeZone)).toBe(false);
    expect(isRepeatedTime(at('2026-04-05T01:45+10:30'), 'Australia/Lord_Howe')).toBe(true);
  });
});
