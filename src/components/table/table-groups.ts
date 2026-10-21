import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import type { ReactNode } from 'react';
import type { Key, SortDescriptor, SortDirection } from '../../core/props.js';
import { getColumnText } from './table-column.js';
import {
  compareCellValues,
  getCellValue,
  type TableCellValue,
  type TableColumn,
  type TableRow,
} from './table-rows.js';
import type { TableNode } from './table-tree.js';

/** A grouping by a computed value: its id, its name in group headers and each row's value. */
export interface TableGrouping<T> {
  /** Unique among the groupings and the columns. */
  id: string;
  /** The grouping's name in group headers. */
  label: string;
  /** The value the row is grouped by. */
  getValue: (row: T) => TableCellValue;
}

/** One level of grouping: a column id, grouping by the column's values, or a computed grouping. */
export type TableGroupBy<T> = string | TableGrouping<T>;

/** A group of rows that share a value, as its header row shows it. */
export interface TableGroup<T> {
  /** Unique in the table; it names the group in `collapsedGroups`. */
  key: string;
  /** The id of the column or computed grouping the rows are grouped by. */
  groupingId: string;
  /** The name of the column or computed grouping. */
  label: string;
  /** The value the group's rows share. */
  value: TableCellValue;
  /** The group's rows, from every group nested in it. */
  rows: readonly T[];
  /** The group's nesting level, from 1. */
  level: number;
}

/** A built-in aggregate of a column's values in a group, or the caller's from the group's rows. */
export type TableAggregate<T> =
  | 'sum'
  | 'count'
  | 'min'
  | 'max'
  | ((rows: readonly T[]) => ReactNode);

/** A group header row and the groups or rows under it. */
export interface TableGroupNode<T> {
  id: string;
  group: TableGroup<T>;
  children: readonly TableBodyNode<T>[];
}

/** What the table body draws: rows with their child rows, under group header rows when grouped. */
export type TableBodyNode<T> = TableNode<T> | TableGroupNode<T>;

/** A grouping level resolved against the columns, with the direction its groups are ordered in. */
export interface ResolvedGrouping<T> extends TableGrouping<T> {
  direction: SortDirection;
}

/** The key prefix of group header rows, kept out of row actions, selection and moves. */
export const groupKeyPrefix = 'ui-table-group:';

/** Whether a node is a group header row. */
export function isGroupNode<T>(node: TableBodyNode<T>): node is TableGroupNode<T> {
  return 'group' in node;
}

/** Whether a key names a group header row. */
export function isGroupKey(key: Key): boolean {
  return String(key).startsWith(groupKeyPrefix);
}

/** Whether a value counts as no value: absent, null or empty text. */
export function isEmptyCellValue(value: TableCellValue): boolean {
  return value === null || value === undefined || value === '';
}

/** A value as the text of a group key or a group header: dates as their `YYYY-MM-DD` day. */
export function formatGroupValue(value: TableCellValue): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return isEmptyCellValue(value) ? '' : String(value);
}

/**
 * The groupings `groupBy` names: columns by id, read with their values and names, and computed
 * groupings as given. Unknown column ids are skipped. Groups follow the sort direction of their
 * column, ascending unless the table sorts that column descending.
 */
export function resolveGroupings<T extends TableRow>(
  groupBy: readonly TableGroupBy<T>[],
  columns: readonly TableColumn<T>[],
  sort: readonly SortDescriptor[],
): ResolvedGrouping<T>[] {
  const directionOf = (id: string): SortDirection =>
    sort.find((descriptor) => String(descriptor.column) === id)?.direction ?? 'ascending';
  return groupBy.flatMap((entry): ResolvedGrouping<T>[] => {
    if (typeof entry !== 'string') return [{ ...entry, direction: directionOf(entry.id) }];
    const column = columns.find((candidate) => candidate.id === entry);
    if (!column) return [];
    return [
      {
        id: column.id,
        label: getColumnText(column),
        getValue: (row) => getCellValue(row, column),
        direction: directionOf(column.id),
      },
    ];
  });
}

/** Orders two group values in a direction, keeping groups without a value last. */
function compareGroupValues(left: TableCellValue, right: TableCellValue, direction: SortDirection) {
  const isLeftEmpty = isEmptyCellValue(left);
  if (isLeftEmpty !== isEmptyCellValue(right)) return isLeftEmpty ? 1 : -1;
  const order = compareCellValues(left, right);
  return direction === 'descending' ? -order : order;
}

interface GroupLevel {
  prefix: string;
  level: number;
}

function groupLevel<T>(
  nodes: readonly TableNode<T>[],
  groupings: readonly ResolvedGrouping<T>[],
  at: GroupLevel,
): readonly TableBodyNode<T>[] {
  const [grouping, ...rest] = groupings;
  if (!grouping) return nodes;
  const buckets = new Map<string, { value: TableCellValue; nodes: TableNode<T>[] }>();
  for (const node of nodes) {
    const value = grouping.getValue(node.row);
    const valueKey = formatGroupValue(value);
    const bucket = buckets.get(valueKey) ?? { value, nodes: [] };
    bucket.nodes.push(node);
    buckets.set(valueKey, bucket);
  }
  const ordered = [...buckets].sort(([, left], [, right]) =>
    compareGroupValues(left.value, right.value, grouping.direction),
  );
  return ordered.map(([valueKey, bucket]) => {
    const key = `${at.prefix}${grouping.id}=${valueKey}`;
    return {
      id: key,
      group: {
        key,
        groupingId: grouping.id,
        label: grouping.label,
        value: bucket.value,
        rows: bucket.nodes.map((node) => node.row),
        level: at.level,
      },
      children: groupLevel(bucket.nodes, rest, { prefix: `${key}/`, level: at.level + 1 }),
    };
  });
}

/**
 * The nodes under one group header row per value of the first grouping, each holding the groups
 * of the next grouping, and so on. Rows keep their order inside a group; groups are ordered by
 * value, those without one last. Group keys are unique paths of grouping ids and values.
 */
export function groupTableNodes<T>(
  nodes: readonly TableNode<T>[],
  groupings: readonly ResolvedGrouping<T>[],
): readonly TableBodyNode<T>[] {
  return groupLevel(nodes, groupings, { prefix: groupKeyPrefix, level: 1 });
}

/** The keys of every group header row, nested ones included. */
export function listGroupKeys<T>(nodes: readonly TableBodyNode<T>[]): string[] {
  return nodes.flatMap((node) =>
    isGroupNode(node) ? [node.id, ...listGroupKeys(node.children)] : [],
  );
}

/** The data rows a reader sees, in order: inside expanded groups and under expanded rows. */
export function listVisibleRows<T>(
  nodes: readonly TableBodyNode<T>[],
  expandedKeys: ReadonlySet<Key>,
): T[] {
  return nodes.flatMap((node) => {
    const children = expandedKeys.has(node.id) ? listVisibleRows(node.children, expandedKeys) : [];
    return isGroupNode(node) ? children : [node.row, ...children];
  });
}

/**
 * A built-in aggregate of cell values: `count` counts the values that are not empty; `sum`, `min`
 * and `max` take the finite numbers, and are null without any.
 */
export function aggregateCellValues(
  values: readonly TableCellValue[],
  kind: Exclude<TableAggregate<never>, (rows: readonly never[]) => ReactNode>,
): number | null {
  if (kind === 'count') return values.filter((value) => !isEmptyCellValue(value)).length;
  const summary = summarizeNumbers(values);
  return summary.count === 0 ? null : summary[kind];
}
