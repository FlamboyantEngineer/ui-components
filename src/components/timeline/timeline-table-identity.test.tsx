import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type * as TableModule from '../table/table.js';
import { Timeline, type TimelineItem, type TimelineRow } from './timeline.js';

const tableProps = vi.hoisted(() => [] as Array<Record<string, unknown>>);

// Records the props each render hands the Table, to compare their identities.
vi.mock('../table/table.js', async (importOriginal) => {
  const actual = await importOriginal<typeof TableModule>();
  return {
    ...actual,
    Table: (props: Parameters<typeof actual.Table>[0]) => {
      tableProps.push(props as unknown as Record<string, unknown>);
      return createElement(actual.Table, props);
    },
  };
});

const rows: TimelineRow[] = [
  { id: 'survey', label: 'Survey' },
  { id: 'build', label: 'Build' },
];
const items: TimelineItem[] = [
  { id: 'walls', rowId: 'build', label: 'Raise walls', start: '2026-03-16', end: '2026-03-20' },
  {
    id: 'measure',
    rowId: 'survey',
    label: 'Measure rooms',
    start: '2026-03-02',
    end: '2026-03-06',
    progress: 0.4,
  },
];

describe('Timeline table identity', () => {
  it('UIC-TIMELINE-3.2 keeps the columns and rows it hands the table across a selection change', () => {
    const tree = (selected: string[]) => (
      <Timeline
        aria-label="Plan"
        view="table"
        rows={rows}
        items={items}
        selectionMode="multiple"
        selectedKeys={selected}
      />
    );
    const { rerender } = render(tree([]));
    const first = tableProps.at(-1);
    rerender(tree(['walls']));
    const last = tableProps.at(-1);
    expect(last?.selectedKeys).not.toBe(first?.selectedKeys);
    expect(last?.columns).toBe(first?.columns);
    expect(last?.rows).toBe(first?.rows);
    expect((last?.rows as Array<{ id: string }>).map((row) => row.id)).toEqual([
      'measure',
      'walls',
    ]);
  });
});
