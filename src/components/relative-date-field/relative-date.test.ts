import { describe, expect, it } from 'vitest';
import {
  describeRelativeDate,
  formatRelativePreset,
  resolveRelativePreset,
} from './relative-date.js';

const now = new Date(2026, 4, 23, 10, 30, 0);
const options = { now, locale: 'en-US', fallbackAfterDays: 7 };
const at = (...parts: [number, number, number, number, number, number?]) =>
  new Date(...parts).toISOString();

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

  it('UIC-RELATIVE-DATE-FIELD-1.2 reads instants within a day in seconds, minutes and hours', () => {
    const plain = (text: string | undefined) => text?.replace(/\s/g, ' ');
    expect(describeRelativeDate(at(2026, 4, 23, 10, 29, 50), options)?.relative).toBe(
      '10 seconds ago',
    );
    expect(describeRelativeDate(at(2026, 4, 23, 10, 25), options)?.relative).toBe('5 minutes ago');
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
});
