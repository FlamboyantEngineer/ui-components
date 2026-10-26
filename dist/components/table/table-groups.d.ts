import type { ReactNode } from 'react';
import type { Key, SortDescriptor, SortDirection } from '../../core/props.js';
import { type TableCellValue, type TableColumn, type TableRow } from './table-rows.js';
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
export type TableAggregate<T> = 'sum' | 'count' | 'min' | 'max' | ((rows: readonly T[]) => ReactNode);
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
export declare const groupKeyPrefix = "ui-table-group:";
/** Whether a node is a group header row. */
export declare function isGroupNode<T>(node: TableBodyNode<T>): node is TableGroupNode<T>;
/** Whether a value counts as no value: absent, null or empty text. */
export declare function isEmptyCellValue(value: TableCellValue): boolean;
/** A value as the text of a group key or a group header: dates as their `YYYY-MM-DD` day. */
export declare function formatGroupValue(value: TableCellValue): string;
/**
 * The groupings `groupBy` names: columns by id, read with their values and names, and computed
 * groupings as given. Unknown column ids are skipped. Groups follow the sort direction of their
 * column, ascending unless the table sorts that column descending.
 */
export declare function resolveGroupings<T extends TableRow>(groupBy: readonly TableGroupBy<T>[], columns: readonly TableColumn<T>[], sort: readonly SortDescriptor[]): ResolvedGrouping<T>[];
/**
 * The nodes under one group header row per value of the first grouping, each holding the groups
 * of the next grouping, and so on. Rows keep their order inside a group; groups are ordered by
 * value, those without one last. Group keys are unique paths of grouping ids and values.
 */
export declare function groupTableNodes<T>(nodes: readonly TableNode<T>[], groupings: readonly ResolvedGrouping<T>[], reservedKeys?: Iterable<Key>): readonly TableBodyNode<T>[];
/** The keys of every group header row, nested ones included. */
export declare function listGroupKeys<T>(nodes: readonly TableBodyNode<T>[]): string[];
/** The data rows a reader sees, in order: inside expanded groups and under expanded rows. */
export declare function listVisibleRows<T>(nodes: readonly TableBodyNode<T>[], expandedKeys: ReadonlySet<Key>): T[];
/**
 * A built-in aggregate of cell values: `count` counts the values that are not empty; `sum`, `min`
 * and `max` take the finite numbers, and are null without any.
 */
export declare function aggregateCellValues(values: readonly TableCellValue[], kind: Exclude<TableAggregate<never>, (rows: readonly never[]) => ReactNode>): number | null;
//# sourceMappingURL=table-groups.d.ts.map