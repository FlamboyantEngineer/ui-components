import { describe, expect, it } from 'vitest';
import { capitalizeText, describeRelativeTime } from './relative-time.js';

const now = new Date(2026, 4, 23, 10, 30, 0);
const options = { now, locale: 'en-US', fallbackAfterDays: 7 };
const minute = 60_000;
const hour = 60 * minute;
/** A local moment as a UTC ISO text, as a server would send it. */
const at = (hours: number, minutes: number, seconds = 0) =>
  new Date(2026, 4, 23, hours, minutes, seconds).toISOString();
const plain = (text: string | undefined) => text?.replace(/\s/g, ' ');

describe('describeRelativeTime', () => {
  it('UIC-RELATIVE-TIME-2.1 words instants within a day and says when the words change', () => {
    expect(describeRelativeTime(at(10, 29, 50), options)).toMatchObject({
      relative: '10 seconds ago',
      relation: 'past',
      isRelative: true,
      nextChange: 501,
    });
    expect(describeRelativeTime(at(10, 25), options)).toMatchObject({
      relative: '5 minutes ago',
      nextChange: 30 * 1000 + 1,
    });
    expect(describeRelativeTime(at(10, 30), options)).toMatchObject({
      relative: 'now',
      relation: 'present',
    });
    expect(describeRelativeTime('2026-05-23T12:30', options)).toMatchObject({
      relative: 'in 2 hours',
      relation: 'future',
      nextChange: 30 * minute + 1,
    });
    // 23.7 hours ago switches to days before its rounded hours change.
    const late = new Date(now.getTime() - 23.7 * hour).toISOString();
    expect(describeRelativeTime(late, options)).toMatchObject({
      relative: '24 hours ago',
      nextChange: 0.3 * hour + 1,
    });
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
