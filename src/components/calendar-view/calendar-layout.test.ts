import { describe, expect, it } from 'vitest';
import {
  countVisibleLanes,
  findColumnSegments,
  layoutDay,
  layoutWeek,
  readEvents,
} from './calendar-layout.js';
import { getWeekDays } from './calendar-days.js';
import type { CalendarViewEvent } from './calendar-view.js';

const day = (text: string) => text;
const ids = (segments: ReturnType<typeof layoutWeek>['segments']) =>
  segments.map((segment) => [segment.placed.event.id, segment.column, segment.span, segment.lane]);

describe('calendar layout', () => {
  it('UIC-CALENDAR-VIEW-2.1 UIC-CALENDAR-VIEW-1.5 reads all-day and timed events in a time zone', () => {
    const events: CalendarViewEvent[] = [
      { id: 'trip', title: 'Trip', start: '2026-03-02', end: '2026-03-04' },
      { id: 'due', title: 'Due', start: '2026-03-05' },
      { id: 'call', title: 'Call', start: '2026-03-05T23:30:00Z' },
      { id: 'night', title: 'Night', start: '2026-03-05T22:00', end: '2026-03-06T02:00' },
      { id: 'long', title: 'Long', start: '2026-03-05T09:00', end: '2026-03-06T09:00' },
      { id: 'back', title: 'Back', start: '2026-03-09', end: '2026-03-08' },
      { id: 'bad', title: 'Bad', start: 'soon' },
    ];
    const placed = readEvents(events, 'America/New_York');
    expect(placed.map((entry) => entry.event.id)).toEqual([
      'trip',
      'due',
      'call',
      'night',
      'long',
      'back',
    ]);
    const [trip, due, call, night, long, back] = placed;
    expect([trip?.isAllDay, trip?.isSpan, trip?.startDay, trip?.endDay]).toEqual([
      true,
      true,
      '2026-03-02',
      '2026-03-04',
    ]);
    expect(due?.endDay).toBe('2026-03-05');
    // 23:30 UTC is 18:30 in New York, an hour long by default.
    expect([call?.isAllDay, call?.isSpan, call?.startDay]).toEqual([false, false, '2026-03-05']);
    expect((call?.end ?? 0) - (call?.start ?? 0)).toBe(3_600_000);
    expect([night?.isSpan, night?.endDay]).toEqual([false, '2026-03-06']);
    expect(long?.isSpan).toBe(true);
    expect(back?.endDay).toBe('2026-03-09');
  });

  it('UIC-CALENDAR-VIEW-2.3 packs a week into lanes, bars first and longer first', () => {
    const placed = readEvents(
      [
        { id: 'standup', title: 'Standup', start: '2026-03-16T09:00', end: '2026-03-16T09:15' },
        { id: 'fair', title: 'Fair', start: '2026-03-17', end: '2026-03-18' },
        { id: 'trip', title: 'Trip', start: '2026-03-12', end: '2026-03-16' },
        { id: 'retreat', title: 'Retreat', start: '2026-03-17', end: '2026-03-24' },
        { id: 'lunch', title: 'Lunch', start: '2026-03-19T12:00' },
      ],
      'UTC',
    );
    const days = getWeekDays(day('2026-03-18'), 'en-US');
    const { segments, laneCount } = layoutWeek(days, placed, { spansOnly: false });
    expect(ids(segments)).toEqual([
      ['trip', 0, 2, 0],
      ['retreat', 2, 5, 0],
      ['fair', 2, 2, 1],
      ['standup', 1, 1, 1],
      ['lunch', 4, 1, 1],
    ]);
    expect(laneCount).toBe(2);
    const trip = segments[0];
    expect([trip?.continuesBefore, trip?.continuesAfter]).toEqual([true, false]);
    expect(segments[1]?.continuesAfter).toBe(true);
    const bars = layoutWeek(days, placed, { spansOnly: true });
    expect(ids(bars.segments).map(([id]) => id)).toEqual(['trip', 'retreat', 'fair']);
    expect(findColumnSegments(segments, 3).map((segment) => segment.placed.event.id)).toEqual([
      'retreat',
      'fair',
    ]);
    expect(layoutWeek([], placed, { spansOnly: false })).toEqual({ segments: [], laneCount: 0 });
  });

  it('UIC-CALENDAR-VIEW-2.4 keeps a lane for the hidden count when a day is crowded', () => {
    const many = Array.from({ length: 4 }, (_, index) => ({
      id: `e${index}`,
      title: `Event ${index}`,
      start: '2026-03-18',
    }));
    const days = getWeekDays(day('2026-03-18'), 'en-US');
    const crowded = layoutWeek(days, readEvents(many, 'UTC'), { spansOnly: false }).segments;
    expect(countVisibleLanes(crowded, 3)).toBe(2);
    expect(countVisibleLanes(crowded, 4)).toBe(4);
    expect(countVisibleLanes(crowded.slice(0, 3), 3)).toBe(3);
  });

  it('UIC-CALENDAR-VIEW-2.5 places timed events in a day and shares overlaps', () => {
    const placed = readEvents(
      [
        { id: 'a', title: 'A', start: '2026-03-18T06:00', end: '2026-03-18T12:00' },
        { id: 'b', title: 'B', start: '2026-03-18T09:00', end: '2026-03-18T10:00' },
        { id: 'c', title: 'C', start: '2026-03-18T18:00', end: '2026-03-19T03:00' },
        { id: 'd', title: 'D', start: '2026-03-18T00:00', end: '2026-03-20T00:00' },
      ],
      'UTC',
    );
    const blocks = layoutDay(day('2026-03-18'), placed, 'UTC');
    const rounded = (value: number) => Math.round(value * 1000) / 1000;
    expect(
      blocks.map((block) => [
        block.placed.event.id,
        ...[block.top, block.height, block.left, block.width].map(rounded),
      ]),
    ).toEqual([
      ['a', 25, 25, 0, 50],
      ['b', 37.5, 4.167, 50, 50],
      ['c', 75, 25, 0, 100],
    ]);
    expect(blocks[2]?.continuesAfter).toBe(true);
    const next = layoutDay(day('2026-03-19'), placed, 'UTC');
    expect(next.map((block) => [block.placed.event.id, block.top, block.height])).toEqual([
      ['c', 0, 12.5],
    ]);
    expect(next[0]?.continuesBefore).toBe(true);
  });

  it('UIC-CALENDAR-VIEW-2.5 places events by elapsed time on a day that changes clock time', () => {
    // New York moves its clocks forward on 8 March 2026: the day lasts 23 hours.
    const placed = readEvents(
      [{ id: 'noon', title: 'Noon', start: '2026-03-08T12:00', end: '2026-03-08T13:00' }],
      'America/New_York',
    );
    const [block] = layoutDay(day('2026-03-08'), placed, 'America/New_York');
    expect(block?.top).toBeCloseTo((11 / 23) * 100);
    expect(block?.height).toBeCloseTo((1 / 23) * 100);
  });

  it('UIC-CALENDAR-VIEW-2.5 distinguishes repeated hours and clips a 25-hour day', () => {
    const timeZone = 'America/New_York';
    const placed = readEvents(
      [
        {
          id: 'early',
          title: 'Early',
          start: '2026-11-01T01:30-04:00',
          end: '2026-11-01T01:45-04:00',
        },
        {
          id: 'late',
          title: 'Late',
          start: '2026-11-01T01:30-05:00',
          end: '2026-11-01T01:45-05:00',
        },
        {
          id: 'before',
          title: 'Before',
          start: '2026-10-31T23:30-04:00',
          end: '2026-11-01T01:00-04:00',
        },
        {
          id: 'zero',
          title: 'Zero',
          start: '2026-11-01T23:00-05:00',
          end: '2026-11-01T23:00-05:00',
        },
        {
          id: 'after',
          title: 'After',
          start: '2026-11-01T23:30-05:00',
          end: '2026-11-02T01:00-05:00',
        },
      ],
      timeZone,
    );
    const blocks = layoutDay('2026-11-01', placed, timeZone);
    const rounded = (value: number) => Math.round(value * 1000) / 1000;
    expect(
      blocks.map((block) => [block.placed.event.id, rounded(block.top), rounded(block.height)]),
    ).toEqual([
      ['before', 0, 4],
      ['early', 6, 1],
      ['late', 10, 1],
      ['zero', 96, 0],
      ['after', 98, 2],
    ]);
    expect(blocks[0]?.continuesBefore).toBe(true);
    expect(blocks.at(-1)?.continuesAfter).toBe(true);
  });
});
