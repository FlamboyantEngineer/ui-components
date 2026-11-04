import { describe, expect, it } from 'vitest';
import {
  createTimelineAxis,
  type ReadItem,
  readTimelineItem,
  resolveDragChange,
  resolveItemSpan,
  resolveKeyboardChange,
  resolveTimelineRange,
} from './timeline-geometry.js';

const item = (start: string, end = start) => ({ id: 'a', rowId: 'r', label: 'Plan', start, end });
const base = { today: '2026-03-10', locale: 'en-US' };

describe('timeline planning range', () => {
  it('UIC-TIMELINE-1.2 leaves out items and ranges outside the supported planning range', () => {
    expect(readTimelineItem(item('9999-12-31'))).toBeNull();
    expect(readTimelineItem(item('0001-01-01'))).toBeNull();
    expect(readTimelineItem(item('9998-12-30', '9999-01-02'))?.end).toBe('9998-12-30');
    const outside = { start: '9999-12-29', end: '9999-12-31' };
    expect(
      resolveTimelineRange({ ...base, items: [item('2026-03-04')], range: outside, scale: 'day' }),
    ).toEqual({ start: '2026-03-03', end: '2026-03-05' });
  });

  it('UIC-TIMELINE-1.2 UIC-TIMELINE-1.5 draws the last and first supported days in full', () => {
    const range = { start: '9998-12-29', end: '9998-12-31' };
    const axis = createTimelineAxis(range, 'day', 'en-US');
    expect(axis.width).toBe(96);
    const last = readTimelineItem(item('9998-12-31'));
    if (!last) throw new Error('The last supported day is not read.');
    expect(resolveItemSpan(axis, last)).toEqual({ left: 64, right: 96 });
    for (const scale of ['day', 'week', 'month', 'quarter'] as const) {
      const first = resolveTimelineRange({ ...base, items: [item('0002-01-01')], range, scale });
      expect(first).toEqual(range);
      const around = resolveTimelineRange({
        ...base,
        items: [item('0002-01-01'), item('9998-12-31')],
        range: undefined,
        scale,
      });
      expect(around && around.start <= '0002-01-01' && around.end >= '9998-12-31').toBe(true);
      expect(around?.start.startsWith('0001-')).toBe(true);
      expect(around?.end.startsWith('9999-')).toBe(true);
    }
  });

  it('UIC-TIMELINE-2.1 UIC-TIMELINE-2.2 stops moves and resizes at the ends of the range', () => {
    const last: ReadItem = { id: 'a', kind: 'bar', start: '9998-12-28', end: '9998-12-30' };
    const first: ReadItem = { id: 'a', kind: 'bar', start: '0002-01-02', end: '0002-01-04' };
    expect(resolveDragChange(last, 'move', 5)).toEqual({
      id: 'a',
      start: '9998-12-29',
      end: '9998-12-31',
    });
    expect(resolveDragChange(last, 'end', 5).end).toBe('9998-12-31');
    expect(resolveDragChange(first, 'move', -5)).toEqual({
      id: 'a',
      start: '0002-01-01',
      end: '0002-01-03',
    });
    expect(resolveDragChange(first, 'start', -400).start).toBe('0002-01-01');
    expect(resolveKeyboardChange(last, { key: 'ArrowRight', shiftKey: false }, 'week')).toBeNull();
    expect(resolveKeyboardChange(last, { key: 'ArrowRight', shiftKey: true }, 'week')).toBeNull();
    expect(resolveKeyboardChange(last, { key: 'ArrowRight', shiftKey: false }, 'day')).toEqual({
      id: 'a',
      start: '9998-12-29',
      end: '9998-12-31',
    });
    expect(resolveKeyboardChange(first, { key: 'ArrowLeft', shiftKey: false }, 'day')).toEqual({
      id: 'a',
      start: '0002-01-01',
      end: '0002-01-03',
    });
    expect(resolveKeyboardChange(first, { key: 'ArrowLeft', shiftKey: false }, 'month')).toBeNull();
  });
});
