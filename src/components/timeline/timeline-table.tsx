'use client';

import { useMemo } from 'react';
import { useDateFormatter, useNumberFormatter } from '../../primitives/index.js';
import type { Key, Selection, SelectionMode } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { AvatarGroup } from '../avatar-group/avatar-group.js';
import { Link } from '../link/link.js';
import { Table, type TableProps } from '../table/table.js';
import { readTimelineItem, readTimelineProgress, type TimelineItem } from './timeline-geometry.js';
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
  href: string | undefined;
  assignees: TimelineItem['assignees'];
}

function toEntries(rows: readonly TimelineRow[], items: readonly TimelineItem[]): TableEntry[] {
  const rowOrder = flattenTimelineRows(rows);
  const rowIndex = new Map(rowOrder.map((entry, index) => [entry.row.id, index]));
  return items
    .flatMap((item) => {
      const read = readTimelineItem(item);
      const index = rowIndex.get(item.rowId);
      if (!read || index === undefined) return [];
      const progress = readTimelineProgress(item);
      const entry = {
        id: item.id,
        name: item.label,
        row: requireDefined(rowOrder[index]).row.label,
        progress,
        href: item.href,
        assignees: item.assignees,
      };
      return [
        { index, entry: { ...entry, start: read.start, end: read.kind === 'bar' ? read.end : '' } },
      ];
    })
    .sort((a, b) => a.index - b.index || a.entry.start.localeCompare(b.entry.start))
    .map(({ entry }) => entry);
}

const percentFormat: Intl.NumberFormatOptions = { style: 'percent' };

/** An entry's assignees as avatars named together, or the unassigned text. */
function AssigneesCell({ entry, unassigned }: { entry: TableEntry; unassigned: string }) {
  if (!entry.assignees?.length) return unassigned;
  const people = entry.assignees.map((person) => ({ ...person, id: toKeyIdentity(person.id) }));
  return <AvatarGroup people={people} size="xs" maxVisible={3} />;
}

type TableColumns = TableProps<TableEntry>['columns'];

/** The assignees column, sorted by the names, when any item has assignees. */
function assigneesColumn(header: string, unassigned: string): TableColumns[number] {
  return {
    id: 'assignees',
    header,
    allowsSorting: true,
    getValue: (entry) => entry.assignees?.map((person) => person.name).join(', ') ?? '',
    renderCell: (entry) => <AssigneesCell entry={entry} unassigned={unassigned} />,
  };
}

function useColumns(hasAssignees: boolean): TableColumns {
  const strings = useUiStrings();
  const days = useDateFormatter({ dateStyle: 'medium', timeZone: 'UTC' });
  const percent = useNumberFormatter(percentFormat);
  return useMemo(() => {
    const day = (date: string) => (date ? days.format(new Date(date)) : '');
    const assignees = hasAssignees
      ? [assigneesColumn(strings.timelineAssigneesColumn, strings.timelineUnassigned)]
      : [];
    return [
      {
        id: 'name',
        header: strings.timelineItemColumn,
        isRowHeader: true,
        allowsSorting: true,
        renderCell: (entry) =>
          entry.href ? <Link href={entry.href}>{entry.name}</Link> : entry.name,
      },
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
        renderCell: (entry) => (entry.progress === undefined ? '' : percent.format(entry.progress)),
      },
      ...assignees,
    ];
  }, [strings, days, percent, hasAssignees]);
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
  const columns = useColumns(items.some((item) => item.assignees?.length));
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
