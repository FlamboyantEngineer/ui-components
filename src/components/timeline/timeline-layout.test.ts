import { describe, expect, it } from 'vitest';
import { createTimelineAxis, type TimelineItem } from './timeline-geometry.js';
import { layoutTimeline, resolveTimelineLayout } from './timeline-layout.js';
import { flattenTimelineRows } from './timeline-rows.js';

const rows = flattenTimelineRows([
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
]);
const items: TimelineItem[] = [
  { id: 'a', rowId: 'one', label: 'Survey', start: '2026-03-02', end: '2026-03-03' },
  { id: 'b', rowId: 'two', label: 'Build', start: '2026-03-03', end: '2026-03-05' },
  { id: 'c', rowId: 'gone', label: 'Hidden', start: '2026-03-01', end: '2026-03-08' },
  { id: 'd', rowId: 'two', label: 'Broken', start: 'soon' },
];
const axis = createTimelineAxis({ start: '2026-03-01', end: '2026-03-31' }, 'day', 'en-US');

describe('timeline layout', () => {
  it('UIC-TIMELINE-1.5 places drawable items in their visible rows', () => {
    const { rowItems } = resolveTimelineLayout({
      axis,
      rows,
      items,
      dependencies: [],
      rowHeight: 36,
    });
    expect(rowItems.get('one')?.map((entry) => [entry.item.id, entry.left, entry.right])).toEqual([
      ['a', 32, 96],
    ]);
    expect(rowItems.get('two')?.map((entry) => [entry.item.id, entry.rowIndex])).toEqual([
      ['b', 1],
    ]);
  });

  it('UIC-TIMELINE-1.7 connects visible items and keeps every predecessor for descriptions', () => {
    const { connectors, predecessors } = resolveTimelineLayout({
      axis,
      rows,
      items,
      dependencies: [
        { from: 'a', to: 'b' },
        { from: 'c', to: 'b' },
        { from: 'missing', to: 'b' },
      ],
      rowHeight: 36,
    });
    expect(connectors).toEqual([
      {
        key: '["[\\"string\\",\\"a\\"]","[\\"string\\",\\"b\\"]"]',
        path: 'M96,18H104V36H56V54H64M60,50L64,54L60,58',
        hasConflict: false,
      },
    ]);
    expect(predecessors.get('b')).toEqual({ names: ['Survey', 'Hidden'], hasConflict: true });
  });

  it('UIC-TIMELINE-1.7 gives typed and delimiter-bearing dependency endpoints distinct connector identities', () => {
    const keys = [1, '1', 2, '2', 'a>b', 'a', 'b>c', 'c'];
    const dependencies = [
      { from: 1, to: 2 },
      { from: '1', to: '2' },
      { from: 'a>b', to: 'c' },
      { from: 'a', to: 'b>c' },
    ];
    const { connectors } = resolveTimelineLayout({
      axis,
      rows,
      rowHeight: 36,
      dependencies,
      items: keys.map((id) => ({ id, rowId: 'one', label: String(id), start: '2026-03-02' })),
    });
    expect(connectors).toHaveLength(4);
    expect(new Set(connectors.map((connector) => connector.key)).size).toBe(4);
  });

  it('UIC-TIMELINE-1.7 reads an item’s dates once across many dependencies', () => {
    let reads = 0;
    const related = items.slice(0, 2).map((item) => ({
      ...item,
      get start() {
        reads += 1;
        return item.start;
      },
    }));
    const dependencies = Array.from({ length: 1_000 }, () => ({ from: 'a', to: 'b' }));
    const { connectors, predecessors } = resolveTimelineLayout({
      axis,
      rows,
      items: related,
      dependencies,
      rowHeight: 36,
    });
    expect(connectors).toHaveLength(dependencies.length);
    expect(predecessors.get('b')?.names).toHaveLength(dependencies.length);
    expect(predecessors.get('b')?.hasConflict).toBe(false);
    expect(reads).toBeLessThanOrEqual(related.length * 4);
  });

  it('UIC-TIMELINE-1.2 UIC-TIMELINE-2.1 shows a draft without moving the range', () => {
    const { axis: drafted, layout } = layoutTimeline({
      rows,
      items: items.slice(0, 2),
      draft: { id: 'a', start: '2026-03-20', end: '2026-03-21' },
      dependencies: [],
      range: undefined,
      scale: 'day',
      today: '2026-03-01',
      locale: 'en-US',
      rowHeight: 36,
    });
    expect(drafted.range).toEqual({ start: '2026-03-01', end: '2026-03-06' });
    expect(layout.rowItems.get('one')?.[0]?.read.start).toBe('2026-03-20');
  });
});
