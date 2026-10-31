'use client';

import { useMemo } from 'react';
import { usePersistentState } from '../../core/provider.js';
import {
  applyColumnMove,
  arrangeColumns,
  readColumnLayout,
  storedColumnsCodec,
  type TableColumnLayout,
  type TableColumnMove,
} from './table-columns.js';
import type { TableColumn } from './table-rows.js';

interface ColumnLayoutOptions<T> {
  columns: readonly TableColumn<T>[];
  /** Controlled layout. */
  columnLayout?: TableColumnLayout | undefined;
  /** Initial layout while the table owns it and nothing is stored. */
  defaultColumnLayout?: TableColumnLayout | undefined;
  onColumnLayoutChange?: ((layout: TableColumnLayout) => void) | undefined;
  /** The table's storage key; the layout persists under `<key>:layout`. */
  persistKey?: string | undefined;
}

export interface ColumnLayout<T> {
  layout: TableColumnLayout;
  /** The columns the table draws, in display order. */
  visibleColumns: readonly TableColumn<T>[];
  /** Shows only the given hideable columns; the others stay as they are. */
  setHidden: (hidden: readonly string[]) => void;
  /** Moves a column; moves between columns pinned to different edges do nothing. */
  moveColumn: (move: TableColumnMove) => void;
}

/**
 * The order and visibility of a table's columns: the caller's when controlled, else the table's
 * own, persisted under `<persistKey>:layout` and restored on mount.
 */
export function useColumnLayout<T>(options: ColumnLayoutOptions<T>): ColumnLayout<T> {
  const { columns, columnLayout, onColumnLayoutChange, persistKey } = options;
  const key = persistKey === undefined ? undefined : `${persistKey}:layout`;
  const [stored, setStored] = usePersistentState<unknown>(key, options.defaultColumnLayout ?? {}, {
    codec: storedColumnsCodec,
  });
  const layout = useMemo(
    () => columnLayout ?? readColumnLayout(stored, columns),
    [columnLayout, stored, columns],
  );
  const visibleColumns = useMemo(() => arrangeColumns(columns, layout), [columns, layout]);

  const setLayout = (next: TableColumnLayout) => {
    if (columnLayout === undefined) setStored(next);
    onColumnLayoutChange?.(next);
  };

  return {
    layout,
    visibleColumns,
    setHidden: (hidden) => setLayout({ ...layout, hidden: [...hidden] }),
    moveColumn: (move) => {
      const order = applyColumnMove(columns, layout, move);
      if (order) setLayout({ ...layout, order });
    },
  };
}
