import { describe, expect, it } from 'vitest';
import { getWeekDays } from './calendar-days.js';
import {
  countVisibleLanes,
  findColumnSegments,
  layoutDay,
  layoutWeek,
  readEvents,
} from './calendar-layout.js';
import type { CalendarViewEvent } from './calendar-view.js';

const day = (text: string) => text;
const ids = (segments: ReturnType<typeof layoutWeek>['segments']) =>
  segments.map((segment) => [segment.placed.event.id, segment.column, segment.span, segment.lane]);

const rounded = (value: number) => Math.round(value * 1000) / 1000;

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

  it('UIC-CALENDAR-VIEW-2.3 judges bars by wall-clock days on days the clocks change', () => {
    const timeZone = 'America/New_York';
    const placed = readEvents(
      [
        // 23 elapsed hours: the clocks go forward on 8 March.
        { id: 'spring', title: 'Spring', start: '2026-03-08T00:00', end: '2026-03-09T00:00' },
        // 25 elapsed hours, but short of the next day's midnight: the clocks go back on 1 November.
        { id: 'fall', title: 'Fall', start: '2026-11-01T00:00', end: '2026-11-01T23:30' },
        { id: 'autumn', title: 'Autumn', start: '2026-11-01T00:00', end: '2026-11-02T00:00' },
      ],
      timeZone,
    );
    const [spring, fall, autumn] = placed;
    expect((spring?.end ?? 0) - (spring?.start ?? 0)).toBe(23 * 3_600_000);
    expect(spring?.isSpan).toBe(true);
    expect((fall?.end ?? 0) - (fall?.start ?? 0)).toBe(24.5 * 3_600_000);
    expect(fall?.isSpan).toBe(false);
    expect(autumn?.isSpan).toBe(true);
    const bars = layoutWeek(getWeekDays('2026-03-08', 'en-US'), placed.slice(0, 1), {
      spansOnly: true,
    });
    expect(bars.segments.map((segment) => [segment.placed.event.id, segment.span])).toEqual([
      ['spring', 1],
    ]);
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
    expect(layoutWeek([], placed, { spansOnly: false })).toEqual({
      segments: [],
      laneCount: 0,
      previews: [],
    });
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
    const blocks = layoutDay(day('2026-03-18'), placed, { timeZone: 'UTC', minMinutes: 0 });
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
    const next = layoutDay(day('2026-03-19'), placed, { timeZone: 'UTC', minMinutes: 0 });
    expect(next.map((block) => [block.placed.event.id, block.top, block.height])).toEqual([
      ['c', 0, 12.5],
    ]);
    expect(next[0]?.continuesBefore).toBe(true);
  });

  it('UIC-CALENDAR-VIEW-6.2 draws a preview first and over the others, packed with nothing', () => {
    const [review, trip, ...rest] = readEvents(
      [
        { id: 'review', title: 'Review', start: '2026-03-18T09:00', end: '2026-03-18T11:00' },
        { id: 'trip', title: 'Trip', start: '2026-03-17', end: '2026-03-19' },
        { id: 'call', title: 'Call', start: '2026-03-18T10:00', end: '2026-03-18T12:00' },
        { id: 'fair', title: 'Fair', start: '2026-03-16', end: '2026-03-18' },
      ],
      'UTC',
    );
    const preview = (placed: typeof review) => (placed ? [{ ...placed, isPreview: true }] : []);
    const settled = [review, trip, ...rest].flatMap((placed) => (placed ? [placed] : []));
    const days = getWeekDays(day('2026-03-18'), 'en-US');
    const week = layoutWeek(days, settled, { spansOnly: true });
    const dragging = layoutWeek(days, [...settled, ...preview(trip)], { spansOnly: true });
    expect(ids(dragging.segments)).toEqual(ids(week.segments));
    expect(dragging.laneCount).toBe(week.laneCount);
    expect(ids(dragging.previews)).toEqual([['trip', 2, 3, 0]]);
    const at = (blocks: ReturnType<typeof layoutDay>) =>
      blocks.map((block) => [
        block.placed.event.id,
        block.placed.isPreview,
        block.left,
        block.width,
      ]);
    const options = { timeZone: 'UTC', minMinutes: 0 };
    const blocks = layoutDay(day('2026-03-18'), [...settled, ...preview(review)], options);
    expect(at(blocks)).toEqual([
      ...at(layoutDay(day('2026-03-18'), settled, options)),
      ['review', true, 0, 100],
    ]);
  });

  it('UIC-CALENDAR-VIEW-2.5 draws short events at least the least length and packs what is drawn', () => {
    const placed = readEvents(
      [
        { id: 'first', title: 'First', start: '2026-03-02T09:00', end: '2026-03-02T09:10' },
        { id: 'second', title: 'Second', start: '2026-03-02T09:10', end: '2026-03-02T09:20' },
        { id: 'third', title: 'Third', start: '2026-03-02T09:20', end: '2026-03-02T09:30' },
        { id: 'point', title: 'Point', start: '2026-03-02T12:00', end: '2026-03-02T12:00' },
        { id: 'long', title: 'Long', start: '2026-03-02T14:00', end: '2026-03-02T15:00' },
        { id: 'late', title: 'Late', start: '2026-03-02T23:50', end: '2026-03-03T00:00' },
      ],
      'UTC',
    );
    const blocks = layoutDay(day('2026-03-02'), placed, { timeZone: 'UTC', minMinutes: 30 });
    expect(
      blocks.map((block) => [
        block.placed.event.id,
        ...[block.top, block.height, block.left, block.width].map(rounded),
      ]),
    ).toEqual([
      ['first', 37.5, 2.083, 0, 33.333],
      ['second', 38.194, 2.083, 33.333, 33.333],
      ['third', 38.889, 2.083, 66.667, 33.333],
      ['point', 50, 2.083, 0, 100],
      ['long', 58.333, 4.167, 0, 100],
      ['late', 99.306, 0.694, 0, 100],
    ]);
    const exact = layoutDay(day('2026-03-02'), placed, { timeZone: 'UTC', minMinutes: 0 });
    expect(exact.slice(0, 3).map((block) => block.width)).toEqual([100, 100, 100]);
    expect(exact[3]?.height).toBe(0);
  });

  it('UIC-CALENDAR-VIEW-2.5 places events at their wall-clock time on a day that skips an hour', () => {
    // New York moves its clocks forward at 2 AM on 8 March 2026: the day lasts 23 hours.
    const timeZone = 'America/New_York';
    const placed = readEvents(
      [
        { id: 'noon', title: 'Noon', start: '2026-03-08T12:00', end: '2026-03-08T13:00' },
        { id: 'gap', title: 'Gap', start: '2026-03-08T01:30', end: '2026-03-08T03:30' },
        { id: 'next', title: 'Next', start: '2026-03-09T12:00', end: '2026-03-09T13:00' },
      ],
      timeZone,
    );
    const blocks = layoutDay(day('2026-03-08'), placed, { timeZone, minMinutes: 0 });
    expect(
      blocks.map((block) => [block.placed.event.id, rounded(block.top), rounded(block.height)]),
    ).toEqual([
      // One elapsed hour across the skipped hour spans 1:30 to 3:30 on the ruler.
      ['gap', 6.25, 8.333],
      ['noon', 50, 4.167],
    ]);
    // Noon sits where the hour labels and the next, ordinary day put it.
    const [next] = layoutDay(day('2026-03-09'), placed, { timeZone, minMinutes: 0 });
    expect([next?.top, rounded(next?.height ?? 0)]).toEqual([50, 4.167]);
  });

  it('UIC-CALENDAR-VIEW-2.5 packs the passes of a repeated hour by their place on the ruler', () => {
    const timeZone = 'America/New_York';
    const event = (id: string, start: string, end: string): CalendarViewEvent => ({
      id,
      title: id,
      start: `2026-11-01T${start}`,
      end: `2026-11-01T${end}`,
    });
    const lanes = (events: CalendarViewEvent[]) =>
      layoutDay(day('2026-11-01'), readEvents(events, timeZone), { timeZone, minMinutes: 0 }).map(
        (block) => [block.placed.event.id, rounded(block.left), rounded(block.width)],
      );
    // Early and Late share 1:30 to 1:45 on the ruler, an hour apart: each takes its own lane.
    expect(
      lanes([
        event('early', '01:30-04:00', '01:45-04:00'),
        event('middle', '01:50-04:00', '01:55-04:00'),
        event('late', '01:30-05:00', '01:45-05:00'),
      ]),
    ).toEqual([
      ['early', 0, 50],
      ['late', 50, 50],
      ['middle', 0, 100],
    ]);
    // A longer event across both passes: the three share the hour's place, in three lanes.
    expect(
      lanes([
        event('bridge', '01:00-04:00', '01:20-05:00'),
        event('late', '01:05-05:00', '01:15-05:00'),
        event('early', '01:05-04:00', '01:15-04:00'),
      ]),
    ).toEqual([
      ['bridge', 0, 33.333],
      ['early', 33.333, 33.333],
      ['late', 66.667, 33.333],
    ]);
  });

  it('UIC-CALENDAR-VIEW-2.5 shares a repeated hour between its passes and clips a 25-hour day', () => {
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
          id: 'back',
          title: 'Back',
          start: '2026-11-01T01:40-04:00',
          end: '2026-11-01T01:10-05:00',
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
    const blocks = layoutDay('2026-11-01', placed, { timeZone, minMinutes: 0 });
    expect(
      blocks.map((block) => [
        block.placed.event.id,
        rounded(block.top),
        rounded(block.height),
        rounded(block.left),
      ]),
    ).toEqual([
      ['before', 0, 4.167, 0],
      ['early', 6.25, 1.042, 0],
      ['late', 6.25, 1.042, 33.333],
      // It ends at an earlier wall-clock time than it starts, so it keeps its 30 elapsed minutes.
      ['back', 6.944, 2.083, 66.667],
      ['zero', 95.833, 0, 0],
      ['after', 97.917, 2.083, 0],
    ]);
    expect(blocks[0]?.continuesBefore).toBe(true);
    expect(blocks.at(-1)?.continuesAfter).toBe(true);
  });

  it('UIC-CALENDAR-VIEW-2.5 follows a half-hour clock change', () => {
    // Lord Howe Island moves its clocks forward half an hour at 2 AM on 4 October 2026.
    const timeZone = 'Australia/Lord_Howe';
    const placed = readEvents(
      [{ id: 'ten', title: 'Ten', start: '2026-10-04T10:00', end: '2026-10-04T11:00' }],
      timeZone,
    );
    const [block] = layoutDay('2026-10-04', placed, { timeZone, minMinutes: 0 });
    expect([rounded(block?.top ?? 0), rounded(block?.height ?? 0)]).toEqual([41.667, 4.167]);
  });
});
