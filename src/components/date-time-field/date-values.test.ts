import { getDayOfWeek } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import {
  currentDateValue,
  findBoundIssue,
  formatDateValue,
  fromDateTimeValue,
  fromPickerValue,
  fromTimeValue,
  isUnavailableValue,
  toCalendarDateValue,
  toDateTimeValue,
  toPickerValue,
  toRangeValue,
  toTimeValue,
} from './date-values.js';

describe('date values', () => {
  it('UIC-DATE-TIME-FIELD-1.2 reads canonical texts and refuses unreadable ones', () => {
    expect(toCalendarDateValue('2026-04-13')?.toString()).toBe('2026-04-13');
    expect(toCalendarDateValue('2026-02-30')).toBeNull();
    expect(toCalendarDateValue('')).toBeNull();
    expect(toTimeValue('13:45')?.hour).toBe(13);
    expect(toTimeValue('25:00')).toBeNull();
    expect(toRangeValue({ start: '2026-04-01', end: '2026-04-03' })?.end.toString()).toBe(
      '2026-04-03',
    );
    expect(toRangeValue({ start: '2026-04-01', end: 'soon' })).toBeNull();
    expect(toRangeValue(null)).toBeNull();
    expect(toDateTimeValue('not a date')).toBeNull();
  });

  it('UIC-DATE-TIME-FIELD-1.2 edits an instant as local wall time and writes it back in UTC', () => {
    const instant = new Date(2026, 3, 13, 13, 45).toISOString();
    const local = toDateTimeValue(instant);
    expect([local?.year, local?.month, local?.day, local?.hour, local?.minute]).toEqual([
      2026, 4, 13, 13, 45,
    ]);
    expect(local && fromDateTimeValue(local)).toBe(instant);
    expect(fromTimeValue(toTimeValue('07:05')!)).toBe('07:05');
  });

  it('UIC-DATE-TIME-FIELD-2.2 gives the current date and the current minute', () => {
    const today = new Date();
    const pad = (part: number) => String(part).padStart(2, '0');
    expect(currentDateValue('date')).toBe(
      `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    );
    const now = new Date(currentDateValue('date-time'));
    expect(now.getSeconds()).toBe(0);
    expect(Math.abs(now.getTime() - Date.now())).toBeLessThan(61_000);
  });

  it('UIC-DATE-TIME-FIELD-1.4 finds the bound a value breaks and a reversed range', () => {
    const bounds = { minValue: '2026-04-01', maxValue: '2026-04-30' };
    expect(findBoundIssue('2026-04-13', 'date', bounds)).toBeNull();
    expect(findBoundIssue('2026-03-31', 'date', bounds)).toEqual({
      bound: 'min',
      limit: '2026-04-01',
    });
    expect(findBoundIssue('2026-05-01', 'date', bounds)).toEqual({
      bound: 'max',
      limit: '2026-04-30',
    });
    expect(findBoundIssue(null, 'date', bounds)).toBeNull();
    expect(findBoundIssue('08:00', 'time', { minValue: '09:00' })).toEqual({
      bound: 'min',
      limit: '09:00',
    });
    expect(
      findBoundIssue('2026-04-13T08:00:00.000Z', 'date-time', {
        maxValue: '2026-04-13T07:00:00.000Z',
      }),
    ).toEqual({ bound: 'max', limit: '2026-04-13T07:00:00.000Z' });
    expect(findBoundIssue({ start: '2026-04-05', end: '2026-04-02' }, 'date-range', {})).toEqual({
      bound: 'min',
      limit: '2026-04-05',
    });
    expect(
      findBoundIssue({ start: '2026-04-02', end: '2026-05-02' }, 'date-range', bounds),
    ).toEqual({
      bound: 'max',
      limit: '2026-04-30',
    });
  });

  it('UIC-DATE-TIME-FIELD-1.6 formats values for the locale and keeps unreadable text', () => {
    const plain = (text: string) => text.replace(/\s/g, ' ');
    expect(formatDateValue('2026-04-13', 'date', { locale: 'en-US' })).toBe('Apr 13, 2026');
    expect(plain(formatDateValue('13:45', 'time', { locale: 'en-US' }))).toBe('1:45 PM');
    expect(
      plain(
        formatDateValue(new Date(2026, 3, 13, 13, 45).toISOString(), 'date-time', {
          locale: 'en-US',
        }),
      ),
    ).toBe('Apr 13, 2026, 1:45 PM');
    expect(
      plain(
        formatDateValue({ start: '2026-04-01', end: '2026-04-03' }, 'date-range', {
          locale: 'en-US',
        }),
      ),
    ).toBe('Apr 1 – 3, 2026');
    expect(
      formatDateValue({ start: '2026-04-01', end: 'later' }, 'date-range', { locale: 'en-US' }),
    ).toBe('2026-04-01 – later');
    expect(formatDateValue('someday', 'date', { locale: 'en-US' })).toBe('someday');
  });

  it('UIC-DATE-TIME-FIELD-3.1 finds values on unavailable dates, either end of a range included', () => {
    const isDateUnavailable = (date: Parameters<typeof getDayOfWeek>[0]) =>
      getDayOfWeek(date, 'en-US') === 0;
    const options = { isDateUnavailable };
    expect(isUnavailableValue('2026-04-19', 'date', options)).toBe(true);
    expect(isUnavailableValue('2026-04-20', 'date', options)).toBe(false);
    expect(
      isUnavailableValue({ start: '2026-04-13', end: '2026-04-19' }, 'date-range', options),
    ).toBe(true);
    expect(
      isUnavailableValue('2026-04-19T10:00:00.000Z', 'date-time', { ...options, timeZone: 'UTC' }),
    ).toBe(true);
    expect(isUnavailableValue('10:00', 'time', options)).toBe(false);
    expect(isUnavailableValue('2026-04-19', 'date', {})).toBe(false);
    expect(isUnavailableValue(null, 'date', options)).toBe(false);
  });

  it('UIC-DATE-TIME-FIELD-4.1 writes seconds at the second granularity', () => {
    expect(fromTimeValue(toTimeValue('07:05:09')!, 'second')).toBe('07:05:09');
    expect(fromTimeValue(toTimeValue('07:05:09')!, 'hour')).toBe('07:05');
    expect(fromPickerValue(toTimeValue('23:59:01')!, 'time', { granularity: 'second' })).toBe(
      '23:59:01',
    );
    const now = new Date(currentDateValue('date-time', { granularity: 'second' }));
    expect(Math.abs(now.getTime() - Date.now())).toBeLessThan(2_000);
    expect(formatDateValue('13:45:30', 'time', { locale: 'en-US', granularity: 'second' })).toMatch(
      /1:45:30/,
    );
  });

  it('UIC-DATE-TIME-FIELD-4.2 reads and writes instants in a time zone', () => {
    const zoned = toDateTimeValue('2026-04-13T03:00:00.000Z', 'Asia/Tokyo');
    expect(zoned && [zoned.hour, 'timeZone' in zoned ? zoned.timeZone : null]).toEqual([
      12,
      'Asia/Tokyo',
    ]);
    expect(zoned && fromDateTimeValue(zoned)).toBe('2026-04-13T03:00:00.000Z');
    expect(
      toPickerValue('2026-04-13T03:00:00.000Z', 'date-time', { timeZone: 'UTC' })?.toString(),
    ).toBe('2026-04-13T03:00:00+00:00[UTC]');
    expect(
      formatDateValue('2026-04-13T03:00:00.000Z', 'date-time', {
        locale: 'en-US',
        timeZone: 'Asia/Tokyo',
      }).replace(/\s/g, ' '),
    ).toBe('Apr 13, 2026, 12:00 PM');
    expect(currentDateValue('date', { timeZone: 'Pacific/Kiritimati' })).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });

  it('UIC-DATE-TIME-FIELD-4.3 reads, bounds and formats ranges of instants', () => {
    const range = { start: '2026-04-13T09:00:00.000Z', end: '2026-04-13T17:00:00.000Z' };
    const read = toRangeValue(range, 'date-time-range', { timeZone: 'UTC' });
    expect(read?.end.toString()).toBe('2026-04-13T17:00:00+00:00[UTC]');
    expect(toRangeValue({ start: '2026-04-13', end: '2026-04-14' }, 'date-time-range')).toBeNull();
    expect(
      findBoundIssue(range, 'date-time-range', { maxValue: '2026-04-13T12:00:00.000Z' }),
    ).toEqual({ bound: 'max', limit: '2026-04-13T12:00:00.000Z' });
    expect(findBoundIssue({ start: range.end, end: range.start }, 'date-time-range', {})).toEqual({
      bound: 'min',
      limit: range.end,
    });
    expect(formatDateValue(range, 'date-time-range', { locale: 'en-US', timeZone: 'UTC' })).toMatch(
      /Apr 13, 2026/,
    );
  });
});
