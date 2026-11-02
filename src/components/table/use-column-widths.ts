'use client';

import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { usePersistentState } from '../../core/provider.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import {
  pickColumnWidths,
  type TableColumnSizing,
  type TableColumnWidths,
} from './column-sizing.js';
import { storedColumnsCodec } from './table-columns.js';

interface ColumnWidthsOptions {
  columns: readonly TableColumnSizing[];
  /** Storage key for the widths a resize leaves; without it they last while the table is mounted. */
  persistKey?: string | undefined;
  onColumnWidthsChange?: ((widths: TableColumnWidths) => void) | undefined;
}

interface ColumnWidths {
  /** Widths set by resizing, by column id: live during a gesture, then the stored ones. */
  widths: TableColumnWidths;
  onResize: (widths: Map<Key, unknown>) => void;
  onResizeEnd: (widths: Map<Key, unknown>) => void;
  /** Previews one data column at a pixel width while a static table's column is resized. */
  resizeColumn: (id: string, width: number) => void;
  /** Keeps a data column's resized width and reports the data columns' widths once. */
  endColumnResize: (id: string, width: number) => void;
}

function restoreColumnKeys(widths: Map<Key, unknown>): Map<Key, unknown> {
  return new Map([...widths].map(([key, value]) => [fromCollectionKey(key), value]));
}

/**
 * Column widths for a resizable table: previewed live while a column is being resized, then kept
 * (and persisted under `persistKey`) and reported once when the gesture ends.
 */
export function useColumnWidths(options: ColumnWidthsOptions): ColumnWidths {
  const { columns, persistKey, onColumnWidthsChange } = options;
  const [stored, setStored] = usePersistentState<unknown>(
    persistKey,
    {},
    {
      codec: storedColumnsCodec,
    },
  );
  const [live, setLive] = useState<TableColumnWidths | null>(null);

  const onResizeEnd = (widths: Map<Key, unknown>) => {
    const next = pickColumnWidths(restoreColumnKeys(widths), columns);
    setStored(next);
    setLive(null);
    onColumnWidthsChange?.(next);
  };

  const kept = pickColumnWidths(stored, columns);
  /** Every data column's width with one resized: kept, else declared; content stays unstored. */
  const withResized = (id: string, width: number) =>
    pickColumnWidths(
      new Map<unknown, unknown>([
        ...columns.map((column) => [column.id, column.width ?? '1fr'] as const),
        ...Object.entries(kept),
        [id, width],
      ]),
      columns,
    );
  return {
    widths: live ?? kept,
    onResize: (widths) => setLive(pickColumnWidths(restoreColumnKeys(widths), columns)),
    onResizeEnd,
    resizeColumn: (id, width) => setLive(withResized(id, width)),
    endColumnResize: (id, width) => {
      const next = withResized(id, width);
      setStored(next);
      setLive(null);
      onColumnWidthsChange?.(next);
    },
  };
}
