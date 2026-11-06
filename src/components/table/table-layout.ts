'use client';

import {
  type Key,
  type Layout,
  type LayoutInfo,
  Rect,
  Size,
  TableLayout,
} from '../../primitives/index.js';
import { summaryInfos, type TableCollection } from './table-summary-layout.js';

type VisibleRect = Parameters<TableLayout<unknown>['getVisibleLayoutInfos']>[0];
type InvalidationContext = Parameters<TableLayout<unknown>['update']>[0];
type DropTargetInfoQuery = Parameters<TableLayout<unknown>['getDropTargetLayoutInfo']>[0];

/**
 * The options a virtualized table lays out with: React Aria's table layout options, and the height
 * of the group header row above the column headers.
 */
export interface TableLayoutOptions {
  /** A fixed row height, or none to measure rows from `estimatedRowHeight`. */
  rowHeight?: number | undefined;
  /** The height a measured row takes until it is measured. */
  estimatedRowHeight?: number | undefined;
  headingHeight: number;
  /** The group header row's height above the column headers; 0 draws none. */
  groupRowHeight: number;
}

/** The layout a virtualized table hands React Aria's `Virtualizer`. */
export type TableVirtualLayout = Pick<
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
export function createTableLayout(): TableVirtualLayout {
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
