import { describe, expect, it } from 'vitest';
import { type EventTimelineEventInput, layoutEventTimeline } from './event-timeline-layout.js';

const layout = (
  events: EventTimelineEventInput[],
  range?: { start: number; end: number },
  spacing = 0,
) => layoutEventTimeline(events, { range, locale: 'en-US', spacing });

describe('layoutEventTimeline', () => {
  it('UIC-EVENT-TIMELINE-1.2 orders readable events by time, ties in input order, and drops unreadable ones', () => {
    const result = layout([
      { id: 'c', at: 3 },
      { id: 'a', at: 1 },
      { id: 'nan', at: Number.NaN },
      { id: 'b2', at: 2 },
      { id: 'b1', at: 2 },
      { id: 'inf', at: Infinity },
    ]);
    expect(result.events.map((event) => event.id)).toEqual(['a', 'b2', 'b1', 'c']);
    expect(result.placed.map((placed) => placed.order)).toEqual([0, 1, 2, 3]);
  });

  it('UIC-EVENT-TIMELINE-1.2 reads only finite, positive durations as intervals', () => {
    const result = layout(
      [
        { id: 'interval', at: 0, duration: 2 },
        { id: 'zero', at: 1, duration: 0 },
        { id: 'negative', at: 2, duration: -1 },
        { id: 'nan', at: 3, duration: Number.NaN },
        { id: 'marker', at: 4 },
      ],
      { start: 0, end: 10 },
    );
    expect(result.placed.map((placed) => placed.isInterval)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it('UIC-EVENT-TIMELINE-1.3 places events as exact proportions of the given range', () => {
    const result = layout([{ id: 'a', at: 2.5, duration: 5 }], { start: 0, end: 10 });
    expect(result.range).toEqual({ start: 0, end: 10 });
    expect(result.placed[0]).toMatchObject({ offset: 25, width: 50 });
  });

  it('UIC-EVENT-TIMELINE-1.3 keeps sub-microsecond durations proportional', () => {
    const result = layout([{ id: 'pulse', at: 2e-7, duration: 2.5e-7 }], { start: 0, end: 1e-6 });
    expect(result.placed[0]?.offset).toBeCloseTo(20, 10);
    expect(result.placed[0]?.width).toBeCloseTo(25, 10);
    expect(result.ticks.map((tick) => tick.label)).toEqual([
      '0.0000000',
      '0.0000002',
      '0.0000004',
      '0.0000006',
      '0.0000008',
      '0.0000010',
    ]);
  });

  it('UIC-EVENT-TIMELINE-1.3 defaults to the events widened to round values, or 0 to 1 without events', () => {
    expect(
      layout([
        { id: 'a', at: 1.2 },
        { id: 'b', at: 7, duration: 1.6 },
      ]).range,
    ).toEqual({ start: 0, end: 10 });
    expect(layout([]).range).toEqual({ start: 0, end: 1 });
    expect(layout([{ id: 'a', at: 4 }], { start: 5, end: 5 }).range).toEqual({ start: 4, end: 4 });
    expect(layout([{ id: 'a', at: 4 }], { start: 0, end: Number.NaN }).range.start).toBe(4);
  });

  it('UIC-EVENT-TIMELINE-1.3 leaves out events outside the range and cuts intervals at its ends', () => {
    const result = layout(
      [
        { id: 'before', at: -5, duration: 1 },
        { id: 'start', at: -1, duration: 3 },
        { id: 'end', at: 8, duration: 4 },
        { id: 'both', at: -1, duration: 20 },
        { id: 'after', at: 11 },
      ],
      { start: 0, end: 10 },
    );
    expect(result.events).toHaveLength(5);
    expect(result.placed.map(({ event, clip }) => [event.id, clip])).toEqual([
      ['start', 'start'],
      ['both', 'both'],
      ['end', 'end'],
    ]);
    expect(result.placed.map(({ offset, width }) => [offset, width])).toEqual([
      [0, 20],
      [0, 100],
      [80, 20],
    ]);
  });

  it('UIC-EVENT-TIMELINE-1.4 puts coincident and overlapping events in separate lanes', () => {
    const result = layout(
      [
        { id: 'a', at: 1 },
        { id: 'b', at: 1 },
        { id: 'c', at: 1 },
        { id: 'span', at: 2, duration: 4 },
        { id: 'inside', at: 3 },
        { id: 'touching', at: 6 },
        { id: 'later', at: 7 },
      ],
      { start: 0, end: 10 },
    );
    expect(result.placed.map(({ event, lane }) => [event.id, lane])).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
      ['span', 0],
      ['inside', 1],
      ['touching', 1],
      ['later', 0],
    ]);
    expect(result.lanes).toBe(3);
    expect(layout([]).lanes).toBe(1);
  });

  it('UIC-EVENT-TIMELINE-1.4 keeps the spacing share of the range free after each event in its lane', () => {
    const events = [
      { id: 'a', at: 0 },
      { id: 'b', at: 1 },
      { id: 'c', at: 2.5 },
    ];
    expect(layout(events, { start: 0, end: 10 }, 0.2).placed.map(({ lane }) => lane)).toEqual([
      0, 1, 0,
    ]);
    expect(layout(events, { start: 0, end: 10 }).placed.map(({ lane }) => lane)).toEqual([0, 0, 0]);
  });
});
