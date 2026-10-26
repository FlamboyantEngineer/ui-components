import type { ReactNode } from 'react';
import type { TableColumn } from './table-rows.js';
/** What the reader changes about the columns: their order and which ones are hidden. */
export interface TableColumnLayout {
    /** Column ids in display order; columns it does not list follow in their declared order. */
    order?: readonly string[] | undefined;
    /** The ids of the hidden columns. */
    hidden?: readonly string[] | undefined;
}
/** A header above several columns. */
export interface TableColumnGroup {
    /** The group's id, unique among the groups. */
    id: string;
    /** The group header's content, which names it. */
    header: ReactNode;
    /** The ids of the columns under the header. */
    columns: readonly string[];
}
/** A column move: the column `id` lands before or after the column `targetId`. */
export interface TableColumnMove {
    id: string;
    targetId: string;
    position: 'before' | 'after';
}
/** One cell of the group header row: a group over a run of columns, or a gap over ungrouped ones. */
export interface TableGroupCell {
    key: string;
    group: TableColumnGroup | null;
    span: number;
}
type PinnedColumn = Pick<TableColumn<unknown>, 'id' | 'pin'>;
/** The columns in `order`: the listed ones first, then the others in their declared order. */
export declare function orderColumns<C extends PinnedColumn>(columns: readonly C[], order: readonly string[] | undefined): C[];
/**
 * The columns a table draws, in display order: the layout's order, without its hidden columns, with
 * the columns pinned to the start first and those pinned to the end last.
 */
export declare function arrangeColumns<C extends PinnedColumn>(columns: readonly C[], layout: TableColumnLayout): C[];
/** The full column order after a move, or null when the columns are pinned to different edges. */
export declare function applyColumnMove(columns: readonly PinnedColumn[], layout: TableColumnLayout, move: TableColumnMove): string[] | null;
/**
 * The move of `id` one step towards the end (`1`) or the start (`-1`) among the drawn columns, or
 * null at the edge of its pinned group.
 */
export declare function stepColumnMove(columns: readonly PinnedColumn[], id: string, step: -1 | 1): TableColumnMove | null;
/** The usable part of a stored layout: arrays of known column ids, each listed once. */
export declare function readColumnLayout(source: unknown, columns: readonly PinnedColumn[]): TableColumnLayout;
/**
 * The cells of the group header row over the drawn columns: one per run of neighbouring columns of
 * the same group, and gaps over ungrouped columns and the `leading` and `trailing` fixed columns.
 */
export declare function groupColumnCells(columns: readonly PinnedColumn[], groups: readonly TableColumnGroup[], edges: {
    leading: number;
    trailing: number;
}): TableGroupCell[];
export {};
//# sourceMappingURL=table-columns.d.ts.map