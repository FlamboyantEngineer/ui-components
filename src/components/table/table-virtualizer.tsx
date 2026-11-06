'use client';

import { type ReactNode, type Ref, useImperativeHandle, useState } from 'react';
import {
  type ITableCollection,
  type Key,
  type Layout,
  LayoutInfo,
  Rect,
  Size,
  TableLayout,
  Virtualizer,
} from '../../primitives/index.js';
import type { RevealLayout } from '../../utils/use-collection-handle.js';

/** The collection React Aria's table layout lays out. */
type TableCollection = ITableCollection<unknown>;

/** A layout info of the summary row, kept while its place and size stay the same. */
function placeInfo(
  previous: ReadonlyMap<Key, LayoutInfo>,
  info: { type: string; key: Key; parentKey: Key; rect: Rect },
) {
  const kept = previous.get(info.key);
  if (kept && kept.parentKey === info.parentKey && kept.rect.equals(info.rect)) return kept;
  const placed = new LayoutInfo(info.type, info.key, info.rect);
  placed.parentKey = info.parentKey;
  placed.allowOverflow = true;
  placed.zIndex = info.type === 'cell' ? 1 : 0;
  return placed;
}

interface SummaryQuery {
  layout: TableLayout<unknown>;
  collection: TableCollection;
  /** What React Aria's layout returned for the visible rectangle. */
  infos: readonly LayoutInfo[];
  rowSize: number;
  previous: ReadonlyMap<Key, LayoutInfo>;
}

/** The cells of one summary row, placed under their columns from the column headers' layout. */
function summaryCells(query: SummaryQuery, row: { key: Key; rect: Rect }) {
  const { layout, collection, previous } = query;
  const cells: LayoutInfo[] = [];
  for (const cell of collection.getChildren?.(row.key) ?? []) {
    if (cell.type !== 'cell') continue;
    const first = cell.colIndex ?? cell.index;
    const spanned = collection.columns.slice(first, first + (cell.colSpan ?? 1));
    const columns = spanned.flatMap((column) => layout.getLayoutInfo(column.key) ?? []);
    const start = columns[0]?.rect.x ?? row.rect.x;
    const width = columns.reduce((sum, column) => sum + column.rect.width, 0);
    const rect = new Rect(start, row.rect.y, width, row.rect.height);
    cells.push(placeInfo(previous, { type: 'cell', key: cell.key, parentKey: row.key, rect }));
  }
  return cells;
}

/**
 * The summary rows React Aria's layout left out of the visible rectangle, placed where its footer
 * row group reserves them. React Aria lays out only the rows in view, so without them the summary
 * row would leave the document, and assistive technology, while the reader scrolls (UIC-TABLE-12.1).
 */
function summaryInfos(query: SummaryQuery) {
  const { collection, infos, rowSize, previous } = query;
  const footer = [...collection].find((node) => node.type === 'tablefooter');
  const group = footer && infos.find((info) => info.key === footer.key);
  const header = infos.find((info) => info.type === 'header');
  if (!footer || !group || !header) return [];
  const shown = new Set(infos.map((info) => info.key));
  const placed: LayoutInfo[] = [];
  let y = group.rect.y;
  for (const row of collection.getChildren?.(footer.key) ?? []) {
    if (!shown.has(row.key)) {
      const rect = new Rect(group.rect.x, y, header.rect.width, rowSize);
      const info = placeInfo(previous, { type: 'row', key: row.key, parentKey: footer.key, rect });
      placed.push(info, ...summaryCells(query, info));
    }
    y += rowSize;
  }
  return placed;
}

type VisibleRect = Parameters<TableLayout<unknown>['getVisibleLayoutInfos']>[0];
type InvalidationContext = Parameters<TableLayout<unknown>['update']>[0];
type DropTargetInfoQuery = Parameters<TableLayout<unknown>['getDropTargetLayoutInfo']>[0];

/**
 * The options a virtualized table lays out with: React Aria's table layout options, and the height
 * of the group header row above the column headers.
 */
interface TableLayoutOptions {
  /** A fixed row height, or none to measure rows from `estimatedRowHeight`. */
  rowHeight?: number | undefined;
  /** The height a measured row takes until it is measured. */
  estimatedRowHeight?: number | undefined;
  headingHeight: number;
  /** The group header row's height above the column headers; 0 draws none. */
  groupRowHeight: number;
}

/** The layout a virtualized table hands React Aria's `Virtualizer`. */
type TableVirtualLayout = Pick<
  TableLayout<unknown>,
  keyof Layout | 'getDropTargetFromPoint' | 'getDropTargetLayoutInfo' | 'useLayoutOptions'
>;

function readOptions(options: object | undefined) {
  const { groupRowHeight, rowHeight, estimatedRowHeight }: Partial<TableLayoutOptions> =
    options ?? {};
  return {
    shift: groupRowHeight ?? 0,
    rowSize: rowHeight ?? estimatedRowHeight ?? 0,
  };
}

/**
 * A layout info moved below the group header row: the table header grows by the row's height to
 * hold it above the column rows, and everything else moves down by it. Copies are kept per info.
 */
function moveBelowHeader({
  info,
  shift,
  moved,
}: {
  info: LayoutInfo;
  shift: number;
  moved: WeakMap<LayoutInfo, LayoutInfo>;
}) {
  if (shift === 0) return info;
  const kept = moved.get(info);
  if (kept) {
    kept.estimatedSize = info.estimatedSize;
    return kept;
  }
  const copy = info.copy();
  if (info.type === 'header') copy.rect.height += shift;
  else copy.rect.y += shift;
  moved.set(info, copy);
  return copy;
}

/**
 * React Aria's virtualized table layout, composed through its public `Layout` API alone: it keeps
 * the summary row in the document wherever the reader scrolls, and lowers everything below the
 * table header's top by the group header row's height. React Aria lays out the column headers and
 * rows; this layout adds the summary rows it left out and moves what it returns, so no protected
 * member of the layout is read or replaced (UIC-TABLE-7.3, UIC-TABLE-8.7, UIC-TABLE-12.1).
 */
function createTableLayout(): TableVirtualLayout {
  const layout = new TableLayout<unknown>();
  let { shift, rowSize } = readOptions(undefined);
  let moved = new WeakMap<LayoutInfo, LayoutInfo>();
  let summaries = new Map<Key, LayoutInfo>();
  const move = (info: LayoutInfo) => moveBelowHeader({ info, shift, moved });
  const collection = () => layout.virtualizer?.collection as TableCollection | undefined;
  const table: TableVirtualLayout = {
    get virtualizer() {
      return layout.virtualizer;
    },
    set virtualizer(virtualizer) {
      layout.virtualizer = virtualizer;
    },
    useLayoutOptions: () => layout.useLayoutOptions(),
    update(context: InvalidationContext) {
      const next = readOptions(context.layoutOptions);
      if (next.shift !== shift) moved = new WeakMap();
      ({ shift, rowSize } = next);
      layout.update(context);
    },
    shouldInvalidate: (next, previous) => layout.shouldInvalidate(next, previous),
    shouldInvalidateLayoutOptions: (next, previous) =>
      readOptions(next).shift !== readOptions(previous).shift ||
      layout.shouldInvalidateLayoutOptions(next, previous),
    getVisibleLayoutInfos(rect: VisibleRect) {
      // React Aria's layout rounds the rectangle it is given in place, so it gets its own.
      const query = new Rect(rect.x, rect.y - shift, rect.width, rect.height);
      const infos = layout.getVisibleLayoutInfos(query);
      const rows = collection();
      const added = rows
        ? summaryInfos({ layout, collection: rows, infos, rowSize, previous: summaries })
        : [];
      summaries = new Map(added.map((info) => [info.key, info]));
      return [...infos, ...added].map(move);
    },
    getLayoutInfo(key: Key) {
      const summary = summaries.get(key);
      if (summary) return move(summary);
      const info = layout.getLayoutInfo(key);
      return info && move(info);
    },
    getContentSize() {
      const size = layout.getContentSize();
      return shift === 0 ? size : new Size(size.width, size.height + shift);
    },
    // Only cells take measured heights: column headers keep the heading height, and the summary
    // rows this layout places keep their row height until React Aria lays them out itself.
    updateItemSize: (key, size) =>
      !summaries.has(key) &&
      layout.getLayoutInfo(key)?.type === 'cell' &&
      layout.updateItemSize(key, size),
    getItemRect: (key) => table.getLayoutInfo(key)?.rect ?? null,
    getVisibleRect: () => layout.getVisibleRect(),
    getDropTargetFromPoint: (x, y, isValidDropTarget) =>
      layout.getDropTargetFromPoint(x, y - shift, isValidDropTarget),
    getDropTargetLayoutInfo: (target: DropTargetInfoQuery) =>
      move(layout.getDropTargetLayoutInfo(target)),
  };
  return table;
}

/**
 * The virtualizer of a virtualized table: React Aria's table layout at a fixed row height, or
 * measuring each row from `rowHeight` as its estimate, keeping the summary row in the document and,
 * with column groups, a group header row of `rowHeight` above the column headers.
 */
export function TableVirtualizer({
  layoutRef,
  rowHeight,
  measuresRows,
  hasGroupRow,
  children,
}: {
  /** Receives the table's layout, which its handle reads. */
  layoutRef: Ref<RevealLayout>;
  rowHeight: number;
  measuresRows: boolean;
  hasGroupRow: boolean;
  children: ReactNode;
}) {
  // React Aria's layout keeps a fixed row height once given one, so each mode has its own layout.
  const [mode, setMode] = useState(() => ({ measuresRows, layout: createTableLayout() }));
  if (mode.measuresRows !== measuresRows) setMode({ measuresRows, layout: createTableLayout() });
  const { layout } = mode;
  useImperativeHandle(layoutRef, () => layout, [layout]);
  const layoutOptions: TableLayoutOptions = {
    ...(measuresRows ? { estimatedRowHeight: rowHeight } : { rowHeight }),
    headingHeight: rowHeight,
    groupRowHeight: hasGroupRow ? rowHeight : 0,
  };
  return (
    <Virtualizer layout={layout} layoutOptions={layoutOptions} shouldObserveItemSize={measuresRows}>
      {children}
    </Virtualizer>
  );
}
