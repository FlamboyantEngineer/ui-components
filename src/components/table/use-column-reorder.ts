'use client';

import { isFocused } from '../../utils/focus-target.js';
import { useId, useLayoutEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import { useLocale } from '../../primitives/index.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { stepColumnMove, type TableColumnMove } from './table-columns.js';
import type { TableColumn } from './table-rows.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { isElement } from '../../utils/is-element.js';

/** What every reorderable header of one table shares for dragging columns (`useColumnDrag`). */
export interface TableColumnDrag {
  /** The table's own drag type, so columns land only in their table. */
  dragType: string;
  /** The id of the column being dragged, while one is. */
  dragging: RefObject<string | null>;
  isRtl: boolean;
  moveColumn: (move: TableColumnMove) => void;
}

export interface ColumnReorder {
  /** What the reorderable headers share for dragging, or null while no column reorders. */
  drag: TableColumnDrag | null;
  /** Handlers for the table root: Alt+ArrowLeft/Right on a focused header. */
  rootProps: {
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
  };
}

interface ColumnReorderOptions<T> {
  /** The drawn columns, in display order. */
  columns: readonly TableColumn<T>[];
  moveColumn: (move: TableColumnMove) => void;
}

const stepKeys: Readonly<Record<string, -1 | 1>> = { ArrowLeft: -1, ArrowRight: 1 };

/** The data column headers of the table whose root is `root`. */
function listHeaders(root: Element): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[role="columnheader"][data-column]')].filter(
    (header) => header.closest('.ui-table') === root,
  );
}

/** The id of the data column whose header, in the table whose root is `root`, holds `target`. */
function findColumnId(target: EventTarget, root: Element): string | undefined {
  if (isEditableTarget(target)) return undefined;
  const header = isElement(target) ? target.closest('[role="columnheader"]') : null;
  return listHeaders(root).find((candidate) => candidate === header)?.dataset['column'];
}

/**
 * Column reordering: Alt+ArrowLeft or Alt+ArrowRight on a focused header moves its column one
 * step, among the columns pinned to the same edge, and the moved header keeps focus. Headers drag
 * through `useColumnDrag` with the shared `drag`.
 */
export function useColumnReorder<T>({
  columns,
  moveColumn,
}: ColumnReorderOptions<T>): ColumnReorder {
  const { direction } = useLocale();
  const isRtl = direction === 'rtl';
  const dragType = `application/x-ui-table-column-${useId()}`;
  const dragging = useRef<string | null>(null);
  const refocus = useRef<{ id: string; root: HTMLElement } | null>(null);
  const isReorderable = (id: string | undefined) =>
    columns.some((column) => column.id === id && column.allowsReordering);

  // Moving a header moves its element, which drops focus; give it back once the move renders.
  useLayoutEffect(() => {
    const pending = refocus.current;
    refocus.current = null;
    if (!pending) return;
    const header = listHeaders(pending.root).find((item) => item.dataset['column'] === pending.id);
    if (header && !isFocused(header)) header.focus();
  });

  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    const step = stepKeys[event.key];
    const id = findColumnId(event.target, event.currentTarget);
    if (!step || !isMoveChord(event) || id === undefined || !isReorderable(id)) return;
    const move = stepColumnMove(columns, id, isRtl ? (-step as -1 | 1) : step);
    if (move) {
      refocus.current = { id, root: event.currentTarget };
      moveColumn(move);
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const drag = columns.some((column) => column.allowsReordering)
    ? { dragType, dragging, isRtl, moveColumn }
    : null;
  return { drag, rootProps: { onKeyDownCapture } };
}
