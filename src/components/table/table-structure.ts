import type { CSSProperties } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import type { TableCellWrap, TableColumn, TableColumnPin } from './table-rows.js';

/** Which columns a table draws around its data columns, and how they behave. */
export interface TableStructure<T> {
  /** The drawn data columns, in display order. */
  columns: readonly TableColumn<T>[];
  hasSelection: boolean;
  hasActions: boolean;
  actionsColumnWidth: number;
  /** How cells wrap their text unless their column says otherwise. */
  cellWrap: TableCellWrap;
  /** The data column that holds the expand buttons of nested and detail rows, if any. */
  treeColumn: string | null;
  /** The table renders only the rows in view and positions every cell itself, so pins nothing. */
  isVirtualized: boolean;
}

/** The keys of the selection and actions columns. */
export const selectionColumnId = 'ui-table-selection';
export const actionsColumnId = 'ui-table-actions';

/** The columns that name a row: those marked `isRowHeader`, else the first. */
export function getRowHeaderColumns<T>(
  columns: readonly TableColumn<T>[],
): readonly TableColumn<T>[] {
  const marked = columns.filter((column) => column.isRowHeader);
  return marked.length > 0 ? marked : columns.slice(0, 1);
}

/** How a data column's cells wrap their text: the column's own mode, else the table's. */
export function getCellWrap<T>(
  structure: TableStructure<T>,
  column: TableColumn<T>,
): TableCellWrap {
  return column.cellWrap ?? structure.cellWrap;
}

/** The number of columns a row spans: data columns plus the selection and actions columns. */
export function countTableColumns<T>(structure: TableStructure<T>): number {
  return structure.columns.length + Number(structure.hasSelection) + Number(structure.hasActions);
}

/**
 * The edge a column is pinned to. The selection column pins with the start columns and the actions
 * column with the end columns, so they stay beside the rows they act on.
 */
export function getColumnPin<T>(
  structure: TableStructure<T>,
  column: TableColumn<T> | 'selection' | 'actions',
): TableColumnPin | undefined {
  if (structure.isVirtualized) return undefined;
  if (typeof column === 'object') return column.pin;
  const edge = column === 'selection' ? 'start' : 'end';
  return structure.columns.some((candidate) => candidate.pin === edge) ? edge : undefined;
}

/** The inline style of a pinned header or cell: its measured distance from its edge. */
export function getPinStyle(
  pin: TableColumnPin | undefined,
  offset: number | undefined,
): CSSProperties | undefined {
  return pin ? (measuredProperty('table-pin-offset', offset ?? 0) as CSSProperties) : undefined;
}
