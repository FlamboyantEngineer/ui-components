import { describe, expect, it } from 'vitest';
import { applyEdit, convertRange, isOrderedRange, toEventRange } from './calendar-event-range.js';
import { readEvents } from './calendar-layout.js';
import type { CalendarViewEvent } from './calendar-view.js';

const place = (event: CalendarViewEvent, zone = 'UTC') => {
  const [placed] = readEvents([event], zone);
  if (!placed) throw new Error('unreadable event');
  return placed;
};

describe('calendar event range', () => {
  it('UIC-CALENDAR-VIEW-5.2 reads an event as its days or its start and end', () => {
    const trip = place({ id: 'trip', title: 'Trip', start: '2026-03-12', end: '2026-03-17' });
    expect(toEventRange(trip, true, 'UTC')).toEqual({ start: '2026-03-12', end: '2026-03-17' });
    expect(toEventRange(trip, false, 'UTC')).toEqual({
      start: '2026-03-12T09:00',
      end: '2026-03-17T10:00',
    });
    const call = place({ id: 'call', title: 'Call', start: '2026-03-18T16:00' });
    expect(toEventRange(call, false, 'UTC')).toEqual({
      start: '2026-03-18T16:00',
      end: '2026-03-18T17:00:00+00:00[UTC]',
    });
    const night = place({
      id: 'night',
      title: 'Night',
      start: '2026-03-19T22:00',
      end: '2026-03-20T02:00',
    });
    expect(toEventRange(night, true, 'UTC')).toEqual({ start: '2026-03-19', end: '2026-03-20' });
    expect(convertRange({ start: '2026-03-01', end: '2026-03-01' }, false, 'UTC')).toEqual({
      start: '2026-03-01T09:00',
      end: '2026-03-01T10:00',
    });
  });

  it('UIC-CALENDAR-VIEW-5.2 accepts a range that ends no earlier than it starts', () => {
    expect(isOrderedRange({ start: '2026-03-02', end: '2026-03-02' }, true, 'UTC')).toBe(true);
    expect(isOrderedRange({ start: '2026-03-02', end: '2026-03-01' }, true, 'UTC')).toBe(false);
    expect(
      isOrderedRange({ start: '2026-03-02T10:00', end: '2026-03-02T09:00' }, false, 'UTC'),
    ).toBe(false);
    expect(isOrderedRange({ start: '2026-03-02T10:00', end: 'later' }, false, 'UTC')).toBe(false);
    // The repeated 1 AM hour: the second pass (EST) comes after the first (EDT).
    expect(
      isOrderedRange(
        { start: '2026-11-01T01:30-04:00', end: '2026-11-01T01:15-05:00' },
        false,
        'America/New_York',
      ),
    ).toBe(true);
  });

  it('UIC-CALENDAR-VIEW-5.2 writes times in the form of the event start', () => {
    const range = {
      start: '2026-03-16T10:00:00-04:00[America/New_York]',
      end: '2026-03-16T11:30:00-04:00[America/New_York]',
    };
    const wall: CalendarViewEvent = { id: 1, title: 'Planning', start: '2026-03-16T09:00' };
    expect(applyEdit(wall, { title: 'Plan', isAllDay: false, range }, 'America/New_York')).toEqual({
      id: 1,
      title: 'Plan',
      start: '2026-03-16T10:00',
      end: '2026-03-16T11:30',
    });
    const anchored = { ...wall, start: '2026-03-16T13:00:00Z' };
    expect(
      applyEdit(anchored, { title: 'Plan', isAllDay: false, range }, 'America/New_York'),
    ).toEqual({ id: 1, title: 'Plan', ...range });
    expect(
      applyEdit(
        wall,
        { title: 'Plan', isAllDay: true, range: { start: '2026-03-16', end: '2026-03-17' } },
        'UTC',
      ),
    ).toEqual({ id: 1, title: 'Plan', start: '2026-03-16', end: '2026-03-17' });
  });
});
