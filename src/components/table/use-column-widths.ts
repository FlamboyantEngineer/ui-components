'use client';

import { useMemo, useRef, useState } from 'react';
import type { Key } from '../../core/props.js';
import { usePersistentState, useUiStorage } from '../../core/provider.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { useLatest } from '../../utils/use-latest.js';
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

/** The widths a resize previews, with the owner whose widths it resizes. */
interface LiveWidths {
  owner: object;
  widths: TableColumnWidths;
}

interface ColumnWidths {
  /** Widths set by resizing, by column id: live during a gesture, then the stored ones. */
  widths: TableColumnWidths;
  /**
   * Who keeps the widths: it changes with the storage adapter or `persistKey`, and a resize begun
   * for another owner is dropped rather than kept by this one.
   */
  owner: object;
  onResize: (widths: Map<Key, unknown>) => void;
  onResizeEnd: (widths: Map<Key, unknown>) => void;
  /** Previews one data column at a pixel width while a static table's column is resized. */
  resizeColumn: (id: string, width: number) => void;
  /** Keeps a data column's resized width and reports the data columns' widths once. */
  endColumnResize: (id: string, width: number) => void;
  /** Drops a resize's preview without keeping or reporting anything. */
  cancelColumnResize: () => void;
}

function restoreColumnKeys(widths: Map<Key, unknown>): Map<Key, unknown> {
  return new Map([...widths].map(([key, value]) => [fromCollectionKey(key), value]));
}

/**
 * The widths the reader set: those kept before and those a resize moved off their declared width.
 * A declared width stays unstored, so a later change to it shows.
 */
function keepReaderWidths(
  next: TableColumnWidths,
  { columns, kept }: { columns: readonly TableColumnSizing[]; kept: TableColumnWidths },
): TableColumnWidths {
  const readerSet = columns.filter(
    (column) =>
      Object.hasOwn(kept, column.id) ||
      (Object.hasOwn(next, column.id) && next[column.id] !== (column.width ?? '1fr')),
  );
  return pickColumnWidths(
    new Map(readerSet.map((column) => [column.id, next[column.id]] as const)),
    columns,
  );
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
  const storage = useUiStorage();
  // A fresh identity whenever the widths change hands.
  const owner = useMemo(() => ({ storage, persistKey }), [storage, persistKey]);
  const [live, setLiveState] = useState<LiveWidths | null>(null);
  // The resize under way as last set, which a resize begun and ended in one event has not drawn.
  const begun = useRef<LiveWidths | null>(null);
  const latestOwner = useLatest(owner);
  const setLive = (next: LiveWidths | null) => {
    begun.current = next;
    setLiveState(next);
  };
  const current = live?.owner === owner ? live.widths : null;
  /** Keeps and reports widths from a resize begun for this owner; any other is dropped. */
  const keep = (next: TableColumnWidths) => {
    const resize = begun.current;
    setLive(null);
    if (resize?.owner !== latestOwner.current) return;
    setStored(keepReaderWidths(next, { columns, kept }));
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
    widths: current ?? kept,
    owner,
    onResize: (widths) =>
      setLive({ owner, widths: pickColumnWidths(restoreColumnKeys(widths), columns) }),
    onResizeEnd: (widths) => keep(pickColumnWidths(restoreColumnKeys(widths), columns)),
    resizeColumn: (id, width) => setLive({ owner, widths: withResized(id, width) }),
    endColumnResize: (id, width) => keep(withResized(id, width)),
    cancelColumnResize: () => setLive(null),
  };
}
