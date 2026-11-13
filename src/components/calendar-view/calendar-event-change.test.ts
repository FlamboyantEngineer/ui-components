import { describe, expect, it } from 'vitest';
import { changeEvent } from './calendar-event-change.js';
import { readEvents } from './calendar-layout.js';
import type { CalendarViewEvent } from './calendar-view.js';

const place = (event: CalendarViewEvent, zone = 'UTC') => {
  const [placed] = readEvents([event], zone);
  if (!placed) throw new Error('unreadable event');
  return placed;
};

const move = (days: number, minutes = 0) => ({
  gesture: 'move' as const,
  shift: { days, minutes },
});
const resize = (days: number, minutes = 0) => ({
  gesture: 'end' as const,
  shift: { days, minutes },
});
const start = (days: number, minutes = 0) => ({
  gesture: 'start' as const,
  shift: { days, minutes },
});

describe('calendar event change', () => {
  it('UIC-CALENDAR-VIEW-6.2 moves an all-day event whole and resizes its last day', () => {
    const trip = place({ id: 'trip', title: 'Trip', start: '2026-03-30', end: '2026-04-02' });
    expect(changeEvent(trip, move(3), 'UTC')).toMatchObject({
      start: '2026-04-02',
      end: '2026-04-05',
    });
    expect(changeEvent(trip, resize(-1), 'UTC')).toMatchObject({ end: '2026-04-01' });
    // A resize never ends it before its first day.
    expect(changeEvent(trip, resize(-9), 'UTC')).toMatchObject({ end: '2026-03-30' });
    const release = place({ id: 'release', title: 'Release', start: '2026-03-20' });
    expect(changeEvent(release, move(-1), 'UTC')).toEqual({
      id: 'release',
      title: 'Release',
      start: '2026-03-19',
    });
    expect(changeEvent(release, move(0), 'UTC')).toBeNull();
    expect(changeEvent(release, resize(-1), 'UTC')).toBeNull();
  });

  it('UIC-CALENDAR-VIEW-6.2 moves a timed event on the wall clock, keeping its length', () => {
    const call = place({
      id: 1,
      title: 'Call',
      start: '2026-03-18T16:00',
      end: '2026-03-18T16:30',
    });
    expect(changeEvent(call, move(1, -45), 'UTC')).toMatchObject({
      start: '2026-03-19T15:15',
      end: '2026-03-19T15:45',
    });
    expect(changeEvent(call, resize(0, 60), 'UTC')).toMatchObject({ end: '2026-03-18T17:30' });
    // A resize leaves at least 15 minutes.
    expect(changeEvent(call, resize(0, -60), 'UTC')).toMatchObject({ end: '2026-03-18T16:15' });
    const open = place({ id: 2, title: 'Open', start: '2026-03-18T23:30' });
    expect(changeEvent(open, move(0, 60), 'UTC')).toEqual({
      id: 2,
      title: 'Open',
      start: '2026-03-19T00:30',
    });
  });

  it('UIC-CALENDAR-VIEW-6.2 keeps the wall-clock start across a change of the clocks', () => {
    const zone = 'America/New_York';
    const standup = place(
      { id: 's', title: 'Standup', start: '2026-10-31T09:00', end: '2026-10-31T09:30' },
      zone,
    );
    expect(changeEvent(standup, move(2), zone)).toMatchObject({
      start: '2026-11-02T09:00',
      end: '2026-11-02T09:30',
    });
    // Eight wall-clock hours across the night the clocks go back last nine: moved, it keeps nine.
    const shift = place(
      { id: 'n', title: 'Night shift', start: '2026-10-31T22:00', end: '2026-11-01T06:00' },
      zone,
    );
    expect(changeEvent(shift, move(1), zone)).toMatchObject({
      start: '2026-11-01T22:00',
      end: '2026-11-02T07:00',
    });
    // A start with an offset or Z comes back with an offset alone, which Date reads.
    const anchored = place({ id: 'a', title: 'Audit', start: '2026-03-07T10:00:00-05:00' }, zone);
    const moved = changeEvent(anchored, move(1), zone)?.start;
    expect(moved).toBe('2026-03-08T10:00:00-04:00');
    expect(Number.isNaN(Date.parse(moved ?? ''))).toBe(false);
    const utc = place({ id: 'u', title: 'Sync', start: '2026-05-04T14:00:00Z' }, zone);
    expect(changeEvent(utc, move(1), zone)?.start).toBe('2026-05-05T10:00:00-04:00');
    // A start that names its zone keeps the name.
    const named = place(
      { id: 'z', title: 'Review', start: '2026-03-07T10:00:00-05:00[America/New_York]' },
      zone,
    );
    expect(changeEvent(named, move(1), zone)?.start).toBe(
      '2026-03-08T10:00:00-04:00[America/New_York]',
    );
  });

  it('UIC-CALENDAR-VIEW-6.2 moves a start alone, never past the end', () => {
    const trip = place({ id: 'trip', title: 'Trip', start: '2026-03-30', end: '2026-04-02' });
    expect(changeEvent(trip, start(-2), 'UTC')).toMatchObject({
      start: '2026-03-28',
      end: '2026-04-02',
    });
    expect(changeEvent(trip, start(9), 'UTC')).toMatchObject({
      start: '2026-04-02',
      end: '2026-04-02',
    });
    // An event without an end is given its own when its start moves earlier.
    const release = place({ id: 'release', title: 'Release', start: '2026-03-20' });
    expect(changeEvent(release, start(-1), 'UTC')).toMatchObject({
      start: '2026-03-19',
      end: '2026-03-20',
    });
    const call = place({
      id: 1,
      title: 'Call',
      start: '2026-03-18T16:00',
      end: '2026-03-18T17:00',
    });
    expect(changeEvent(call, start(0, -30), 'UTC')).toMatchObject({
      start: '2026-03-18T15:30',
      end: '2026-03-18T17:00',
    });
    // It leaves at least 15 minutes.
    expect(changeEvent(call, start(0, 120), 'UTC')).toMatchObject({ start: '2026-03-18T16:45' });
    const open = place({ id: 2, title: 'Open', start: '2026-03-18T09:00' });
    expect(changeEvent(open, start(0, 15), 'UTC')).toEqual({
      id: 2,
      title: 'Open',
      start: '2026-03-18T09:15',
      end: '2026-03-18T10:00',
    });
  });
});
