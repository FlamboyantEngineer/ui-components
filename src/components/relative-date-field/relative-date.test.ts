import { describe, expect, it } from 'vitest';
import {
  describeRelativeDate,
  describeRelativeRange,
  findRelativeBoundIssue,
  formatRelativePeriod,
  formatRelativePreset,
  resolvePickedDate,
  resolveRelativePreset,
  resolveRelativeRange,
} from './relative-date.js';

const now = new Date(2026, 4, 23, 10, 30, 0);
const options = { now, locale: 'en-US', fallbackAfterDays: 7 };
const pad = (part: number) => String(part).padStart(2, '0');
/** A local date and time as a floating ISO text, with seconds when given. */
const at = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second?: number,
) =>
  `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}${second === undefined ? '' : `:${pad(second)}`}`;

describe('relative date', () => {
  it('UIC-RELATIVE-DATE-FIELD-1.2 reads dates in calendar days and falls back to the absolute date', () => {
    expect(describeRelativeDate('2026-05-23', options)).toMatchObject({
      relative: 'Today',
      relation: 'present',
    });
    expect(describeRelativeDate('2026-05-24', options)).toMatchObject({
      relative: 'Tomorrow',
      relation: 'future',
    });
    expect(describeRelativeDate('2026-05-22', options)?.relative).toBe('Yesterday');
    expect(describeRelativeDate('2026-05-26', options)?.relative).toBe('In 3 days');
    expect(describeRelativeDate('2026-05-19', options)).toMatchObject({
      relative: '4 days ago',
      relation: 'past',
    });
    expect(describeRelativeDate('2026-06-23', options)).toMatchObject({
      relative: 'Jun 23, 2026',
      absolute: 'Jun 23, 2026',
    });
    expect(describeRelativeDate('2026-05-26', { ...options, fallbackAfterDays: 2 })?.relative).toBe(
      'May 26, 2026',
    );
    expect(describeRelativeDate('2026-02-30', options)).toBeNull();
    expect(describeRelativeDate('whenever', options)).toBeNull();
  });

  it('UIC-RELATIVE-DATE-FIELD-1.2 reads date-times within a day in seconds, minutes and hours', () => {
    const plain = (text: string | undefined) => text?.replace(/\s/g, ' ');
    expect(describeRelativeDate(at(2026, 4, 23, 10, 29, 50), options)?.relative).toBe(
      '10 seconds ago',
    );
    expect(describeRelativeDate(at(2026, 4, 23, 10, 25), options)?.relative).toBe('5 minutes ago');
    const instant = new Date(2026, 4, 23, 10, 25).toISOString();
    expect(describeRelativeDate(instant, options)?.relative).toBe('5 minutes ago');
    expect(describeRelativeDate(at(2026, 4, 23, 12, 30), options)).toMatchObject({
      relative: 'In 2 hours',
      relation: 'future',
    });
    expect(describeRelativeDate(at(2026, 4, 23, 10, 30), options)?.relative).toBe('Now');
    expect(describeRelativeDate(at(2026, 4, 21, 9, 0), options)?.relative).toBe('2 days ago');
    expect(plain(describeRelativeDate(at(2026, 4, 21, 9, 0), options)?.absolute)).toBe(
      'May 21, 2026, 9:00 AM',
    );
  });

  it('UIC-RELATIVE-DATE-FIELD-1.3 labels presets in the locale and resolves them from now', () => {
    expect(formatRelativePreset({ amount: 0, unit: 'day' }, 'en-US')).toBe('Today');
    expect(formatRelativePreset({ amount: -1, unit: 'week' }, 'en-US')).toBe('Last week');
    expect(formatRelativePreset({ amount: 3, unit: 'day' }, 'en-US')).toBe('In 3 days');
    expect(formatRelativePreset({ amount: 1, unit: 'day' }, 'fr-FR')).toBe('Demain');
    const kind = 'date' as const;
    expect(resolveRelativePreset({ amount: 1, unit: 'day' }, { now, kind })).toBe('2026-05-24');
    expect(resolveRelativePreset({ amount: -2, unit: 'week' }, { now, kind })).toBe('2026-05-09');
    expect(resolveRelativePreset({ amount: 1, unit: 'month' }, { now, kind })).toBe('2026-06-23');
    expect(resolveRelativePreset({ amount: 1, unit: 'year' }, { now, kind })).toBe('2027-05-23');
    expect(resolveRelativePreset({ amount: 1, unit: 'day' }, { now, kind: 'date-time' })).toBe(
      at(2026, 4, 24, 10, 30),
    );
  });

  it('UIC-RELATIVE-DATE-FIELD-2.2 prefers a preset label to the generated one', () => {
    expect(formatRelativePreset({ amount: 2, unit: 'week', label: 'Soon' }, 'en-US')).toBe('Soon');
  });

  it('UIC-RELATIVE-DATE-FIELD-2.3 resolves, counts and describes relative ranges', () => {
    expect(resolveRelativeRange({ amount: -7, unit: 'day' }, now)).toEqual({
      start: '2026-05-16',
      end: '2026-05-23',
    });
    expect(resolveRelativeRange({ amount: 1, unit: 'month' }, now)).toEqual({
      start: '2026-05-23',
      end: '2026-06-23',
    });
    expect(formatRelativePeriod({ amount: -30, unit: 'day' }, 'en-US')).toBe('30 days');
    expect(formatRelativePeriod({ amount: 2, unit: 'week' }, 'en-US')).toBe('2 weeks');
    expect(
      describeRelativeRange({ start: '2026-05-16', end: '2026-05-23' }, options),
    ).toMatchObject({ relative: 'May 16, 2026 – Today', relation: 'present' });
    expect(
      describeRelativeRange({ start: '2026-05-20', end: '2026-05-23' }, options),
    ).toMatchObject({
      relative: '3 days ago – Today',
      absolute: expect.stringMatching(/^May 20\s–\s23, 2026$/),
    });
    expect(
      describeRelativeRange({ start: '2026-05-25', end: '2026-05-26' }, options),
    ).toMatchObject({ relative: 'In 2 days – In 3 days', relation: 'future' });
    expect(
      describeRelativeRange({ start: '2026-05-01', end: '2026-05-02' }, options)?.relation,
    ).toBe('past');
    expect(describeRelativeRange({ start: 'soon', end: '2026-05-02' }, options)).toBeNull();
    expect(resolvePickedDate('2026-05-30', { now, kind: 'date' })).toBe('2026-05-30');
    expect(resolvePickedDate('2026-05-30', { now, kind: 'date-time' })).toBe(
      at(2026, 4, 30, 10, 30),
    );
  });

  it('UIC-RELATIVE-DATE-FIELD-2.4 finds the bound a value or a range end breaks', () => {
    const bounds = { minValue: '2026-05-01', maxValue: '2026-05-31' };
    expect(findRelativeBoundIssue('2026-05-15', bounds)).toBeNull();
    expect(findRelativeBoundIssue('2026-04-30', bounds)).toEqual({
      bound: 'min',
      limit: '2026-05-01',
    });
    expect(findRelativeBoundIssue(at(2026, 5, 1, 9, 0), bounds)).toEqual({
      bound: 'max',
      limit: '2026-05-31',
    });
    expect(findRelativeBoundIssue({ start: '2026-05-20', end: '2026-06-02' }, bounds)?.bound).toBe(
      'max',
    );
    expect(findRelativeBoundIssue(null, bounds)).toBeNull();
  });
});
