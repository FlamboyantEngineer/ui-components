import { describe, expect, it } from 'vitest';
import {
  currentDateValue,
  findBoundIssue,
  formatDateValue,
  fromDateTimeValue,
  fromTimeValue,
  toCalendarDateValue,
  toDateTimeValue,
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
    expect(formatDateValue('2026-04-13', 'date', 'en-US')).toBe('Apr 13, 2026');
    expect(plain(formatDateValue('13:45', 'time', 'en-US'))).toBe('1:45 PM');
    expect(
      plain(formatDateValue(new Date(2026, 3, 13, 13, 45).toISOString(), 'date-time', 'en-US')),
    ).toBe('Apr 13, 2026, 1:45 PM');
    expect(
      plain(formatDateValue({ start: '2026-04-01', end: '2026-04-03' }, 'date-range', 'en-US')),
    ).toBe('Apr 1 – 3, 2026');
    expect(formatDateValue({ start: '2026-04-01', end: 'later' }, 'date-range', 'en-US')).toBe(
      '2026-04-01 – later',
    );
    expect(formatDateValue('someday', 'date', 'en-US')).toBe('someday');
  });
});
