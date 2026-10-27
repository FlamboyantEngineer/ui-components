import { describe, expect, it } from 'vitest';
import {
  capitalizeText,
  describeRelativeTime,
  formatAbsoluteTime,
  getRelativeFormat,
} from './relative-time.js';

const now = new Date(2026, 4, 23, 10, 30, 0);
const options = { now, locale: 'en-US', fallbackAfterDays: 7 };
const seconds = { ...options, precision: 'second' as const };
const minute = 60_000;
const hour = 60 * minute;
/** A local moment as a UTC ISO text, as a server would send it. */
const at = (hours: number, minutes: number, seconds = 0) =>
  new Date(2026, 4, 23, hours, minutes, seconds).toISOString();
const plain = (text: string | undefined) => text?.replace(/\s/g, ' ');

describe('describeRelativeTime', () => {
  it('UIC-RELATIVE-TIME-2.1 words instants within a day in seconds and says when the words change', () => {
    expect(describeRelativeTime(at(10, 29, 50), seconds)).toMatchObject({
      relative: '10 seconds ago',
      relation: 'past',
      isRelative: true,
      nextChange: 501,
    });
    expect(describeRelativeTime(at(10, 25), seconds)).toMatchObject({
      relative: '5 minutes ago',
      nextChange: 30 * 1000 + 1,
    });
    expect(describeRelativeTime(at(10, 30), seconds)).toMatchObject({
      relative: 'now',
      relation: 'present',
    });
    expect(describeRelativeTime('2026-05-23T12:30', seconds)).toMatchObject({
      relative: 'in 2 hours',
      relation: 'future',
      nextChange: 30 * minute + 1,
    });
    // 23.4 hours ago reads in hours until its rounded hours would reach 24.
    const late = new Date(now.getTime() - 23.4 * hour).toISOString();
    expect(describeRelativeTime(late, seconds)).toMatchObject({
      relative: '23 hours ago',
      nextChange: 0.1 * hour + 1,
    });
  });

  it('UIC-RELATIVE-TIME-1.2 moves to the next unit when the rounded second count reaches it', () => {
    const offset = (milliseconds: number) => new Date(now.getTime() + milliseconds).toISOString();
    expect(describeRelativeTime(offset(-59_700), seconds)?.relative).toBe('1 minute ago');
    expect(describeRelativeTime(offset(-(59 * minute + 40_000)), seconds)?.relative).toBe(
      '1 hour ago',
    );
    expect(describeRelativeTime(offset(-23.7 * hour), seconds)).toMatchObject({
      relative: 'yesterday',
      nextChange: 13.5 * hour,
    });
    // A future instant says when it comes near enough to read in the smaller unit.
    expect(describeRelativeTime(offset(90_000), seconds)).toMatchObject({
      relative: 'in 2 minutes',
      nextChange: 1,
    });
    expect(describeRelativeTime(offset(80_000), seconds)).toMatchObject({
      relative: 'in 1 minute',
      nextChange: 20_500 + 1,
    });
    expect(describeRelativeTime(offset(59_000), seconds)?.relative).toBe('in 59 seconds');
    expect(describeRelativeTime(offset(23.7 * hour), seconds)).toMatchObject({
      relative: 'tomorrow',
      nextChange: 0.2 * hour + 1,
    });
  });

  it('UIC-RELATIVE-TIME-1.2 reads Now for the first minute, then whole minutes, by default', () => {
    const offset = (milliseconds: number) => new Date(now.getTime() + milliseconds).toISOString();
    expect(describeRelativeTime(at(10, 29, 50), options)).toMatchObject({
      relative: 'now',
      relation: 'present',
      isRelative: true,
      nextChange: 50_000,
    });
    expect(describeRelativeTime(offset(-59_999), options)?.relative).toBe('now');
    expect(describeRelativeTime(offset(-minute), options)).toMatchObject({
      relative: '1 minute ago',
      relation: 'past',
      nextChange: minute,
    });
    expect(describeRelativeTime(offset(-(59 * minute + 59_000)), options)).toMatchObject({
      relative: '59 minutes ago',
      nextChange: 1000,
    });
    expect(describeRelativeTime(offset(-hour), options)?.relative).toBe('1 hour ago');
    expect(describeRelativeTime(offset(-(hour + 29 * minute)), options)?.relative).toBe(
      '1 hour ago',
    );
    // A future instant counts the whole minutes left, then reads now for its last minute.
    expect(describeRelativeTime(offset(90_000), options)).toMatchObject({
      relative: 'in 1 minute',
      relation: 'future',
      nextChange: 30_000 + 1,
    });
    expect(describeRelativeTime(offset(30_000), options)).toMatchObject({
      relative: 'now',
      nextChange: 90_000,
    });
    expect(describeRelativeTime(offset(hour + minute), options)).toMatchObject({
      relative: 'in 1 hour',
      nextChange: minute + 1,
    });
  });

  it('UIC-RELATIVE-TIME-1.2 spells units in the unit style', () => {
    const value = at(10, 25);
    expect(describeRelativeTime(value, { ...options, unitStyle: 'short' })?.relative).toBe(
      '5 min. ago',
    );
    expect(describeRelativeTime(value, { ...options, unitStyle: 'narrow' })?.relative).toBe(
      '5m ago',
    );
    expect(describeRelativeTime(at(10, 29, 55), { ...seconds, unitStyle: 'short' })?.relative).toBe(
      '5 sec. ago',
    );
    expect(describeRelativeTime(at(10, 29, 55), { ...options, unitStyle: 'short' })?.relative).toBe(
      'now',
    );
  });

  it('UIC-RELATIVE-TIME-2.1 counts calendar days until midnight, then falls back to the date', () => {
    const untilMidnight = 13.5 * hour;
    expect(describeRelativeTime('2026-05-23', options)).toMatchObject({
      relative: 'today',
      relation: 'present',
      nextChange: untilMidnight,
    });
    expect(describeRelativeTime('2026-05-22', options)?.relative).toBe('yesterday');
    expect(describeRelativeTime('2026-05-26', options)?.relative).toBe('in 3 days');
    expect(describeRelativeTime('2026-05-20T09:00', options)).toMatchObject({
      relative: '3 days ago',
      nextChange: untilMidnight,
    });
    expect(describeRelativeTime('2026-06-23', options)).toMatchObject({
      relative: 'Jun 23, 2026',
      absolute: 'Jun 23, 2026',
      relation: 'future',
      isRelative: false,
      nextChange: untilMidnight,
    });
    expect(describeRelativeTime('2026-04-01', options)).toMatchObject({
      relative: 'Apr 1, 2026',
      isRelative: false,
      nextChange: null,
    });
    expect(describeRelativeTime('2026-05-26', { ...options, fallbackAfterDays: 3 })).toMatchObject({
      isRelative: false,
    });
  });

  it('UIC-RELATIVE-TIME-1.3 formats the absolute text with the date and time styles', () => {
    expect(plain(describeRelativeTime('2026-05-21T09:00', options)?.absolute)).toBe(
      'May 21, 2026, 9:00 AM',
    );
    const styled = { ...options, dateStyle: 'long', timeStyle: 'medium' } as const;
    expect(plain(describeRelativeTime('2026-05-21T09:00', styled)?.absolute)).toBe(
      'May 21, 2026 at 9:00:00 AM',
    );
    expect(describeRelativeTime('2026-05-21', styled)?.absolute).toBe('May 21, 2026');
    expect(describeRelativeTime('2026-05-22', { ...options, locale: 'fr-FR' })?.relative).toBe(
      'hier',
    );
  });

  it('UIC-RELATIVE-TIME-2.1 returns null for values that are not dates', () => {
    expect(describeRelativeTime('2026-02-30', options)).toBeNull();
    expect(describeRelativeTime('soon', options)).toBeNull();
  });

  it('UIC-RELATIVE-TIME-1.2 capitalizes the first letter in the locale', () => {
    expect(capitalizeText('yesterday', 'en-US')).toBe('Yesterday');
    expect(capitalizeText('il y a 5 minutes', 'fr-FR')).toBe('Il y a 5 minutes');
    expect(capitalizeText('', 'en-US')).toBe('');
  });
});

describe('formatAbsoluteTime', () => {
  it('UIC-RELATIVE-TIME-1.3 formats the absolute text alone, without reading the clock', () => {
    expect(plain(formatAbsoluteTime('2026-05-21T09:00', 'en-US') ?? undefined)).toBe(
      'May 21, 2026, 9:00 AM',
    );
    expect(formatAbsoluteTime('2026-05-21', 'en-US', { dateStyle: 'long' })).toBe('May 21, 2026');
    expect(formatAbsoluteTime('soon', 'en-US')).toBeNull();
  });
});

describe('getRelativeFormat', () => {
  it('UIC-RELATIVE-TIME-1.2 shares one formatter per locale and unit style', () => {
    expect(getRelativeFormat('en-US')).toBe(getRelativeFormat('en-US', 'long'));
    expect(getRelativeFormat('en-US', 'short')).not.toBe(getRelativeFormat('en-US'));
    expect(getRelativeFormat('fr-FR').format(-1, 'day')).toBe('hier');
  });
});
