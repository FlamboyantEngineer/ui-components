'use client';

import { useMemo } from 'react';
import { useDateFormatter, useNumberFormatter } from '../../primitives/index.js';
import type { Key, Selection, SelectionMode } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Table, type TableProps } from '../table/table.js';
import { readTimelineItem, type TimelineItem } from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import { flattenTimelineRows, type TimelineRow } from './timeline-rows.js';

interface TimelineTableProps {
  label: string | undefined;
  labelledBy: string | undefined;
  rows: readonly TimelineRow[];
  items: readonly TimelineItem[];
  selectionMode: SelectionMode;
  selectedKeys: ReadonlySet<Key>;
  onSelectionChange: (keys: Selection) => void;
}

/** An item as a table row: its name, row, days and progress. */
interface TableEntry {
  id: Key;
  name: string;
  row: string;
  start: string;
  end: string;
  progress: number | undefined;
}

function toEntries(rows: readonly TimelineRow[], items: readonly TimelineItem[]): TableEntry[] {
  const rowOrder = flattenTimelineRows(rows);
  const rowIndex = new Map(rowOrder.map((entry, index) => [entry.row.id, index]));
  return items
    .flatMap((item) => {
      const read = readTimelineItem(item);
      const index = rowIndex.get(item.rowId);
      if (!read || index === undefined) return [];
      const progress = read.kind === 'bar' ? item.progress : undefined;
      const entry = {
        id: item.id,
        name: item.label,
        row: requireDefined(rowOrder[index]).row.label,
        progress,
      };
      return [
        { index, entry: { ...entry, start: read.start, end: read.kind === 'bar' ? read.end : '' } },
      ];
    })
    .sort((a, b) => a.index - b.index || a.entry.start.localeCompare(b.entry.start))
    .map(({ entry }) => entry);
}

const percentFormat: Intl.NumberFormatOptions = { style: 'percent' };

function useColumns(): TableProps<TableEntry>['columns'] {
  const strings = useUiStrings();
  const days = useDateFormatter({ dateStyle: 'medium', timeZone: 'UTC' });
  const percent = useNumberFormatter(percentFormat);
  return useMemo(() => {
    const day = (date: string) => (date ? days.format(new Date(date)) : '');
    return [
      { id: 'name', header: strings.timelineItemColumn, isRowHeader: true, allowsSorting: true },
      { id: 'row', header: strings.timelineRowColumn, allowsSorting: true },
      {
        id: 'start',
        header: strings.timelineStartColumn,
        allowsSorting: true,
        renderCell: (entry) => day(entry.start),
      },
      {
        id: 'end',
        header: strings.timelineEndColumn,
        allowsSorting: true,
        renderCell: (entry) => day(entry.end),
      },
      {
        id: 'progress',
        header: strings.timelineProgressColumn,
        align: 'end',
        getValue: (entry) => entry.progress ?? null,
        renderCell: (entry) =>
          entry.progress === undefined ? '' : percent.format(clamp(entry.progress, 0, 1)),
      },
    ];
  }, [strings, days, percent]);
}

/**
 * The table view of a timeline's items, in row order and then by first day: the same items and
 * selection as the chart, read as a sortable table.
 */
export function TimelineTable({
  label,
  labelledBy,
  rows,
  items,
  selectionMode,
  selectedKeys,
  onSelectionChange,
}: TimelineTableProps) {
  const columns = useColumns();
  const entries = useMemo(() => toEntries(rows, items), [rows, items]);
  return (
    <Table
      className={hooks.slotClass('table')}
      aria-label={label}
      aria-labelledby={labelledBy}
      columns={columns}
      rows={entries}
      selectionMode={selectionMode}
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
    />
  );
}
