import { describe, expect, it } from 'vitest';
import {
  createTimelineAxis,
  isDependencyConflict,
  readTimelineItem,
  resolveConnectorPath,
  resolveDragChange,
  resolveItemSpan,
  resolveKeyboardChange,
  resolveScaleCells,
  resolveTimelineRange,
  type ReadItem,
  type TimelineItem,
} from './timeline-geometry.js';

const bar: ReadItem = { id: 'a', kind: 'bar', start: '2026-03-02', end: '2026-03-06' };
const milestone: ReadItem = { id: 'm', kind: 'milestone', start: '2026-03-20', end: '2026-03-20' };
const items: TimelineItem[] = [
  { id: 'a', rowId: 'r', label: 'Survey', start: '2026-03-04', end: '2026-03-10' },
  { id: 'b', rowId: 'r', label: 'Launch', start: '2026-04-15', kind: 'milestone' },
];

describe('timeline geometry', () => {
  it('UIC-TIMELINE-1.5 UIC-TIMELINE-1.6 reads items with a last day never before the first', () => {
    expect(readTimelineItem(items[0]!)).toEqual({
      id: 'a',
      kind: 'bar',
      start: '2026-03-04',
      end: '2026-03-10',
    });
    expect(readTimelineItem(items[1]!)).toMatchObject({ kind: 'milestone', end: '2026-04-15' });
    const backwards = { ...items[0]!, end: '2026-03-01' };
    expect(readTimelineItem(backwards)?.end).toBe('2026-03-04');
    expect(readTimelineItem({ ...items[0]!, end: undefined })?.end).toBe('2026-03-04');
    expect(readTimelineItem({ ...items[0]!, start: 'soon' })).toBeNull();
  });

  it('UIC-TIMELINE-1.2 keeps a readable range and otherwise pads the items to whole units', () => {
    const base = { items, today: '2026-03-10', locale: 'en-US' };
    const range = { start: '2026-03-01', end: '2026-03-31' };
    expect(resolveTimelineRange({ ...base, range, scale: 'week' })).toBe(range);
    const backwards = { start: '2026-03-31', end: '2026-03-01' };
    expect(resolveTimelineRange({ ...base, range: backwards, scale: 'month' })).toEqual({
      start: '2026-02-01',
      end: '2026-05-31',
    });
    expect(resolveTimelineRange({ ...base, range: undefined, scale: 'week' })).toEqual({
      start: '2026-02-22',
      end: '2026-04-25',
    });
    expect(resolveTimelineRange({ ...base, range: undefined, scale: 'quarter' })).toEqual({
      start: '2025-10-01',
      end: '2026-09-30',
    });
    expect(resolveTimelineRange({ ...base, items: [], range: undefined, scale: 'day' })).toEqual({
      start: '2026-03-09',
      end: '2026-03-11',
    });
  });

  it('UIC-TIMELINE-1.3 sizes the axis by the scale and cuts header cells at the range ends', () => {
    const axis = createTimelineAxis({ start: '2026-03-04', end: '2026-04-10' }, 'week', 'en-US');
    expect(axis.dayWidth).toBe(16);
    expect(axis.width).toBe(38 * 16);
    expect(axis.until).toBe('2026-04-11');
    expect(axis.scale.map('2026-03-05')).toBe(16);
    const months = resolveScaleCells(axis, 'month');
    expect(months).toEqual([
      { start: '2026-03-04', left: 0, width: 28 * 16 },
      { start: '2026-04-01', left: 28 * 16, width: 10 * 16 },
    ]);
    const weeks = resolveScaleCells(axis, 'week');
    expect(weeks[0]).toEqual({ start: '2026-03-04', left: 0, width: 4 * 16 });
    expect(weeks[1]).toEqual({ start: '2026-03-08', left: 4 * 16, width: 7 * 16 });
    expect(weeks.at(-1)).toEqual({ start: '2026-04-05', left: 32 * 16, width: 6 * 16 });
    const quarters = createTimelineAxis(
      { start: '2026-01-01', end: '2026-12-31' },
      'quarter',
      'en-US',
    );
    expect(quarters.dayWidth).toBe(1.5);
    expect(resolveScaleCells(quarters, 'quarter').map((cell) => cell.start)).toEqual([
      '2026-01-01',
      '2026-04-01',
      '2026-07-01',
      '2026-10-01',
    ]);
    expect(
      createTimelineAxis({ start: '2026-03-01', end: '2026-03-01' }, 'day', 'en-US').width,
    ).toBe(32);
    expect(
      createTimelineAxis({ start: '2026-03-01', end: '2026-03-31' }, 'month', 'en-US').width,
    ).toBe(124);
  });

  it('UIC-TIMELINE-1.5 UIC-TIMELINE-1.6 spans bars over whole days and centres milestones', () => {
    const axis = createTimelineAxis({ start: '2026-03-01', end: '2026-03-31' }, 'day', 'en-US');
    expect(resolveItemSpan(axis, bar)).toEqual({ left: 32, right: 6 * 32 });
    expect(resolveItemSpan(axis, milestone)).toEqual({ left: 19 * 32 + 16, right: 19 * 32 + 16 });
  });

  it('UIC-TIMELINE-2.2 steps by the scale unit and resizes the last day with Shift', () => {
    const right = { key: 'ArrowRight', shiftKey: false };
    const left = { key: 'ArrowLeft', shiftKey: false };
    expect(resolveKeyboardChange(bar, right, 'day')).toEqual({
      id: 'a',
      start: '2026-03-03',
      end: '2026-03-07',
    });
    expect(resolveKeyboardChange(bar, left, 'week')).toMatchObject({
      start: '2026-02-23',
      end: '2026-02-27',
    });
    const january: ReadItem = { id: 'j', kind: 'bar', start: '2026-01-31', end: '2026-02-03' };
    expect(resolveKeyboardChange(january, right, 'month')).toMatchObject({
      start: '2026-02-28',
      end: '2026-03-03',
    });
    expect(resolveKeyboardChange(bar, right, 'quarter')).toMatchObject({ start: '2026-06-02' });
    expect(resolveKeyboardChange(bar, { key: 'ArrowRight', shiftKey: true }, 'week')).toEqual({
      id: 'a',
      start: '2026-03-02',
      end: '2026-03-13',
    });
    expect(resolveKeyboardChange(bar, { key: 'ArrowLeft', shiftKey: true }, 'week')).toMatchObject({
      end: '2026-03-02',
    });
    expect(
      resolveKeyboardChange(milestone, { key: 'ArrowRight', shiftKey: true }, 'day'),
    ).toBeNull();
    expect(resolveKeyboardChange(milestone, right, 'day')).toMatchObject({
      start: '2026-03-21',
      end: '2026-03-21',
    });
    expect(resolveKeyboardChange(bar, { key: 'ArrowUp', shiftKey: false }, 'day')).toBeNull();
  });

  it('UIC-TIMELINE-2.1 moves an item or one end of a bar by whole days', () => {
    expect(resolveDragChange(bar, 'move', 3)).toEqual({
      id: 'a',
      start: '2026-03-05',
      end: '2026-03-09',
    });
    expect(resolveDragChange(bar, 'start', -2)).toMatchObject({
      start: '2026-02-28',
      end: '2026-03-06',
    });
    expect(resolveDragChange(bar, 'start', 9)).toMatchObject({ start: '2026-03-06' });
    expect(resolveDragChange(bar, 'end', 2)).toMatchObject({
      start: '2026-03-02',
      end: '2026-03-08',
    });
    expect(resolveDragChange(bar, 'end', -9)).toMatchObject({ end: '2026-03-02' });
  });

  it('UIC-TIMELINE-1.7 flags a follower that starts before its predecessor ends', () => {
    const next: ReadItem = { id: 'b', kind: 'bar', start: '2026-03-06', end: '2026-03-09' };
    expect(isDependencyConflict(bar, next)).toBe(false);
    expect(isDependencyConflict(bar, { ...next, start: '2026-03-05' })).toBe(true);
    expect(isDependencyConflict(milestone, { ...next, start: '2026-03-19' })).toBe(true);
  });

  it('UIC-TIMELINE-1.7 routes connectors forward, along a row, or back around the target', () => {
    expect(resolveConnectorPath({ x1: 10, y1: 18, x2: 100, y2: 54, rowHeight: 36 })).toBe(
      'M10,18H18V54H100M96,50L100,54L96,58',
    );
    expect(resolveConnectorPath({ x1: 10, y1: 18, x2: 100, y2: 18, rowHeight: 36 })).toBe(
      'M10,18H100M96,14L100,18L96,22',
    );
    expect(resolveConnectorPath({ x1: 100, y1: 18, x2: 60, y2: 90, rowHeight: 36 })).toBe(
      'M100,18H108V72H52V90H60M56,86L60,90L56,94',
    );
    expect(resolveConnectorPath({ x1: 100, y1: 90, x2: 60, y2: 18, rowHeight: 36 })).toBe(
      'M100,90H108V36H52V18H60M56,14L60,18L56,22',
    );
  });
});
