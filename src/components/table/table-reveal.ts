'use client';

import { type Ref, useMemo, useRef } from 'react';
import type { CollectionHandle, CollectionRevealMiss } from '../../core/events.js';
import type { Key } from '../../core/props.js';
import { type RevealLayout, useCollectionHandle } from '../../utils/use-collection-handle.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { walkTree } from '../../utils/walk-tree.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableRow } from './table-rows.js';
import type { TableChildRows, TableNode } from './table-tree.js';
import type { TableGrid } from './use-table-grid.js';

export interface TableRevealOptions {
  /** The data column whose cell is revealed or focused, rather than the whole row. */
  columnId?: Key | undefined;
}

/** Reveals and focuses a table's rows, or one cell of them, by row id (UIC-TABLE-19.1). */
export type TableHandle = CollectionHandle<TableRevealOptions>;

const readChildren = <T>(node: TableNode<T>) => node.children;

function hasNode<T>(nodes: readonly TableNode<T>[], key: Key): boolean {
  for (const node of walkTree(nodes, readChildren)) if (node.id === key) return true;
  return false;
}

/**
 * Why the table does not show a row now: no row or nested row has the id, the filter hides it, it
 * is on another page, or a collapsed parent or group holds it.
 */
function locateTableRow<T extends TableRow>(
  key: Key,
  {
    visibleKeys,
    rows,
    getChildRows,
    grid,
  }: TableHandleOptions<T> & {
    visibleKeys: ReadonlySet<Key> | null;
  },
): CollectionRevealMiss | null {
  if (visibleKeys?.has(key)) return null;
  if (hasNode(grid.view.presentedNodes, key)) {
    return hasNode(grid.view.nodes, key) ? 'collapsed' : 'paged';
  }
  const children = (row: T) => getChildRows?.(row) ?? undefined;
  for (const row of walkTree(rows, children)) if (row.id === key) return 'filtered';
  return 'missing';
}

/** The data cell of `columnId` in a drawn row; the row itself without a column or such a cell. */
function findCell(row: HTMLElement, options: TableRevealOptions | undefined): HTMLElement | null {
  if (options?.columnId === undefined) return null;
  const column = String(options.columnId);
  return (
    [...row.querySelectorAll<HTMLElement>('[data-kind="data"][data-column]')].find(
      (cell) => cell.dataset.column === column,
    ) ?? null
  );
}

interface TableHandleOptions<T extends TableRow> {
  rows: readonly T[];
  getChildRows?: TableChildRows<T>;
  grid: TableGrid<T>;
  virtualized?: boolean | undefined;
  /** The caller's ref to the table's root. */
  ref?: Ref<HTMLDivElement> | undefined;
}

/**
 * The table's handle on `handleRef`, revealing rows by id whether or not they are drawn. It
 * returns the ref for the table's root, merged with the caller's, and the ref that receives the
 * layout a virtualized table draws with, which places the rows it has not drawn.
 */
export function useTableHandle<T extends TableRow>(
  handleRef: Ref<TableHandle> | undefined,
  { rows, getChildRows, grid, virtualized, ref }: TableHandleOptions<T>,
): { ref: Ref<HTMLDivElement>; layoutRef: Ref<RevealLayout> } {
  const rootRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<RevealLayout>(null);
  const { visibleRows } = grid;
  const isEnabled = handleRef != null;
  const visibleKeys = useMemo(
    () => (isEnabled ? new Set(visibleRows.map((row) => row.id)) : null),
    [isEnabled, visibleRows],
  );
  useCollectionHandle(handleRef, {
    locate: (key) => locateTableRow(key, { visibleKeys, rows, getChildRows, grid }),
    getRoot: () => rootRef.current,
    virtual: virtualized
      ? {
          getLayout: () => layoutRef.current,
          getScroller: () =>
            rootRef.current?.querySelector<HTMLElement>(`.${hooks.slotClass('scroll')}`) ?? null,
        }
      : null,
    findTarget: findCell,
  });
  return { ref: useMergedRefs(ref, rootRef), layoutRef };
}
