import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import { walkTree } from '../../utils/walk-tree.js';
import type { ReactNode } from 'react';
import type { Key, SortDescriptor, SortDirection } from '../../core/props.js';
import { getColumnText } from './table-columns.js';
import {
  compareCellValues,
  getCellValue,
  getTextCollator,
  type TableCellValue,
  type TableColumn,
  type TableRow,
} from './table-rows.js';
import type { TableNode } from './table-tree.js';
import { toLocalDay } from '../../utils/local-day.js';

/** A grouping by a computed value: its id, its name in group headers and each row's value. */
export interface TableGrouping<T> {
  /** Unique among the groupings and the columns. */
  id: string;
  /** The grouping's name in group headers. */
  label: string;
  /** The value the row is grouped by. */
  getValue: (row: T) => TableCellValue;
  /**
   * Orders two groups by their values, for groups the caller orders apart from their values; the
   * group without a value stays last.
   */
  compareValues?: ((left: TableCellValue, right: TableCellValue) => number) | undefined;
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
  'sum' | 'count' | 'min' | 'max' | ((rows: readonly T[]) => ReactNode);

/** A group header row and the groups or rows under it. */
export interface TableGroupNode<T> {
  id: string;
  group: TableGroup<T>;
  children: readonly TableBodyNode<T>[];
}

/** What the table body draws: rows with their child rows, under group header rows when grouped. */
export type TableBodyNode<T> = TableNode<T> | TableGroupNode<T>;

/** A grouping level resolved against the columns, with the direction its groups are ordered in. */
interface ResolvedGrouping<T> extends TableGrouping<T> {
  direction: SortDirection;
}

/** The key prefix of group header rows, kept out of row actions, selection and moves. */
const groupKeyPrefix = 'ui-table-group:';

/** Whether a node is a group header row. */
export function isGroupNode<T>(node: TableBodyNode<T>): node is TableGroupNode<T> {
  return 'group' in node;
}

/** Whether a value counts as no value: absent, null, empty text or an invalid date. */
function isEmptyCellValue(value: TableCellValue): boolean {
  if (value instanceof Date) return Number.isNaN(value.getTime());
  return value === null || value === undefined || value === '';
}

/**
 * A value as the text of a group key or a group header: dates as their local `YYYY-MM-DD` day, as
 * the date filter reads them (a year outside 1 to 9999 as its UTC day in ISO 8601's expanded form).
 */
export function formatGroupValue(value: TableCellValue): string {
  if (isEmptyCellValue(value)) return '';
  if (value instanceof Date) return toLocalDay(value) ?? value.toISOString().split('T')[0] ?? '';
  return String(value);
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

interface GroupOrder {
  direction: SortDirection;
  collator: Intl.Collator;
  compareValues: TableGrouping<unknown>['compareValues'];
}

/**
 * Orders two group values in a direction, or by the grouping's own order, keeping groups without a
 * value last.
 */
function compareGroupValues(left: TableCellValue, right: TableCellValue, order: GroupOrder) {
  const isLeftEmpty = isEmptyCellValue(left);
  if (isLeftEmpty !== isEmptyCellValue(right)) return isLeftEmpty ? 1 : -1;
  if (order.compareValues && !isLeftEmpty) return order.compareValues(left, right);
  const compared = compareCellValues(left, right, order.collator);
  return order.direction === 'descending' ? -compared : compared;
}

interface GroupLevel {
  prefix: string;
  level: number;
  reserved: Set<Key>;
  collator: Intl.Collator;
}

function encodeGroupPart(value: string): string {
  return value.replace(/[%/=:]/g, encodeURIComponent);
}

/** The kinds of group value that never share a group, in the order equal-looking groups follow. */
const groupValueKinds = ['string', 'number', 'boolean', 'date', 'empty'] as const;
type GroupValueKind = (typeof groupValueKinds)[number];

/** A value's kind: every empty value is one kind, and dates group by their day. */
function getGroupValueKind(value: TableCellValue): GroupValueKind {
  if (isEmptyCellValue(value)) return 'empty';
  if (value instanceof Date) return 'date';
  return typeof value as 'string' | 'number' | 'boolean';
}

interface GroupBucket<T> {
  value: TableCellValue;
  kind: GroupValueKind;
  /** The value as key text: values of different kinds can share it. */
  text: string;
  nodes: TableNode<T>[];
}

/** Buckets the nodes by value and kind, so `1`, `"1"`, `true` and `"true"` stay apart. */
function bucketNodes<T>(
  nodes: readonly TableNode<T>[],
  grouping: ResolvedGrouping<T>,
): GroupBucket<T>[] {
  const buckets = new Map<string, GroupBucket<T>>();
  for (const node of nodes) {
    const value = grouping.getValue(node.row);
    const kind = getGroupValueKind(value);
    const text = formatGroupValue(value);
    const identity = `${kind}:${text}`;
    const bucket = buckets.get(identity) ?? { value, kind, text, nodes: [] };
    bucket.nodes.push(node);
    buckets.set(identity, bucket);
  }
  return [...buckets.values()];
}

const compareKinds = (left: GroupValueKind, right: GroupValueKind) =>
  groupValueKinds.indexOf(left) - groupValueKinds.indexOf(right);

/** A typed path independent of peer values, suffixed only to avoid reserved row ids. */
function assignGroupKey<T>(bucket: GroupBucket<T>, groupingId: string, at: GroupLevel): string {
  const kind = bucket.kind === 'string' || bucket.kind === 'empty' ? '' : `:${bucket.kind}`;
  const base = `${at.prefix}${encodeGroupPart(groupingId)}=${encodeGroupPart(bucket.text)}${kind}`;
  let key = base;
  let suffix = 0;
  while (at.reserved.has(key)) key = `${base}:${++suffix}`;
  at.reserved.add(key);
  return key;
}

function groupLevel<T>(
  nodes: readonly TableNode<T>[],
  groupings: readonly ResolvedGrouping<T>[],
  at: GroupLevel,
): readonly TableBodyNode<T>[] {
  const [grouping, ...rest] = groupings;
  if (!grouping) return nodes;
  const { direction, compareValues } = grouping;
  const order = { direction, compareValues, collator: at.collator };
  const ordered = bucketNodes(nodes, grouping).sort(
    (left, right) =>
      compareGroupValues(left.value, right.value, order) || compareKinds(left.kind, right.kind),
  );
  return ordered.map((bucket) => {
    const key = assignGroupKey(bucket, grouping.id, at);
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
      children: groupLevel(bucket.nodes, rest, {
        prefix: `${key}/`,
        level: at.level + 1,
        reserved: at.reserved,
        collator: at.collator,
      }),
    };
  });
}

interface GroupNodesOptions {
  /** The locale whose collation orders text values. */
  locale: string;
  /** Keys group keys must avoid, such as every row id. */
  reservedKeys?: Iterable<Key> | undefined;
}

/**
 * The nodes under one group header row per value of the first grouping, each holding the groups
 * of the next grouping, and so on. Rows keep their order inside a group; groups are ordered by
 * value in `locale`, those without one last. Group keys are unique paths of grouping ids and values.
 */
export function groupTableNodes<T>(
  nodes: readonly TableNode<T>[],
  groupings: readonly ResolvedGrouping<T>[],
  options: GroupNodesOptions,
): readonly TableBodyNode<T>[] {
  if (groupings.length === 0) return nodes;
  const { locale, reservedKeys = [] } = options;
  const reserved = new Set(reservedKeys);
  for (const node of walkTree(nodes, (node) => node.children)) reserved.add(node.id);
  const collator = getTextCollator(locale);
  return groupLevel(nodes, groupings, { prefix: groupKeyPrefix, level: 1, reserved, collator });
}

/** The keys of every group header row, nested ones included. */
export function listGroupKeys<T>(nodes: readonly TableBodyNode<T>[]): string[] {
  const keys: string[] = [];
  for (const node of walkTree(nodes, (node) => (isGroupNode(node) ? node.children : undefined))) {
    if (isGroupNode(node)) keys.push(node.id);
  }
  return keys;
}

/** The data rows a reader sees, in order: inside expanded groups and under expanded rows. */
export function listVisibleRows<T>(
  nodes: readonly TableBodyNode<T>[],
  expandedKeys: ReadonlySet<Key>,
): T[] {
  const rows: T[] = [];
  for (const node of walkTree(nodes, (node) =>
    expandedKeys.has(node.id) ? node.children : undefined,
  )) {
    if (!isGroupNode(node)) rows.push(node.row);
  }
  return rows;
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
