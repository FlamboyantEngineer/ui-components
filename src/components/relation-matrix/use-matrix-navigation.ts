'use client';

import { containsFocus } from '../../utils/focus-target.js';
import {
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useFocusWithin, useLocale } from '../../primitives/index.js';
import {
  adoptMatrixFocus,
  moveMatrixFocus,
  resolveMatrixFocus,
  toMatrixFocus,
  type MatrixFocus,
  type MatrixPosition,
} from './matrix-navigation.js';
import { isElement } from '../../utils/is-element.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';

interface MatrixNavigationOptions {
  root: RefObject<HTMLDivElement | null>;
  /** The identities of the row items, in order. */
  rowIds: readonly string[];
  /** The identities of the column items, in order. */
  columnIds: readonly string[];
  /** Called when Enter or Space is pressed on a body cell. */
  onCellAction: (position: MatrixPosition) => void;
}

/** A matrix grid's focused cell (its single tab stop) and the props that move it. */
interface MatrixNavigation {
  focus: MatrixPosition;
  isFocusWithin: boolean;
  gridProps: {
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    onFocus: (event: FocusEvent<HTMLDivElement>) => void;
    onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  };
}

const actionKeys = new Set(['Enter', ' ']);
/** Rows a page holds where nothing is measured. */
const defaultPage = 10;

/** The selector of the cell at `position`, through the grid's row and column indices. */
export function selectMatrixCell({ row, column }: MatrixPosition): string {
  return `[role="row"][aria-rowindex="${row + 2}"] > [aria-colindex="${column + 2}"]`;
}

/** Rows a page of the scroll container holds, from the height of the focused cell. */
function measurePage(root: HTMLElement, cell: Element | null): number {
  const corner = root.querySelector(selectMatrixCell({ row: -1, column: -1 }));
  const height = cell?.getBoundingClientRect().height ?? 0;
  const view = root.clientHeight - (corner?.getBoundingClientRect().height ?? 0);
  return height > 0 ? Math.max(1, Math.floor(view / height)) : defaultPage;
}

/** The position of the grid cell holding `target`, read from its row and column indices. */
export function readPosition(target: EventTarget): MatrixPosition | null {
  if (!isElement(target)) return null;
  const cell = target.closest('[aria-colindex]');
  const row = cell?.parentElement?.closest('[role="row"]');
  const rowIndex = Number(row?.getAttribute('aria-rowindex'));
  const columnIndex = Number(cell?.getAttribute('aria-colindex'));
  if (!rowIndex || !columnIndex) return null;
  return { row: rowIndex - 2, column: columnIndex - 2 };
}

/**
 * Scrolls `root` so `cell` is in view and clear of the sticky header row and row header column
 * (header cells stay in view on their own axis).
 */
function revealCell(root: HTMLElement, cell: HTMLElement, position: MatrixPosition) {
  const box = measureInScroller(cell, root);
  const cornerCell = root.querySelector(selectMatrixCell({ row: -1, column: -1 }));
  const corner = cornerCell ? measureInScroller(cornerCell, root) : null;
  if (position.row >= 0) {
    const top = root.scrollTop + (corner?.height ?? 0);
    const bottom = root.scrollTop + root.clientHeight;
    if (box.top < top) root.scrollTop -= top - box.top;
    else if (box.top + box.height > bottom) root.scrollTop += box.top + box.height - bottom;
  }
  if (position.column >= 0) {
    const isRightToLeft = getOwnerWindow(root).getComputedStyle(root).direction === 'rtl';
    const inset = corner?.width ?? 0;
    const left = root.scrollLeft + (isRightToLeft ? 0 : inset);
    const right = root.scrollLeft + root.clientWidth - (isRightToLeft ? inset : 0);
    if (box.left < left) root.scrollLeft -= left - box.left;
    else if (box.left + box.width > right) root.scrollLeft += box.left + box.width - right;
  }
}

/**
 * Grid keyboard navigation over a matrix with a header row and a row header column: arrow keys,
 * PageUp, PageDown, Home and End (with Control or Command, Home and End reach the corners) move
 * the focused cell, which holds the grid's only tab stop and scrolls into view; focus landing on a
 * cell by pointer makes it the focused cell. The focused cell follows its row and column items
 * when they reorder; where one goes, the cell now at its place takes focus (`resolveMatrixFocus`).
 * Keys act from the cell that holds focus.
 */
export function useMatrixNavigation({
  root,
  rowIds,
  columnIds,
  onCellAction,
}: MatrixNavigationOptions): MatrixNavigation {
  const { direction } = useLocale();
  const [own, setOwn] = useState<MatrixFocus>(() =>
    toMatrixFocus({ row: 0, column: 0 }, rowIds, columnIds),
  );
  const [isFocusWithin, setFocusWithin] = useState(false);
  const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setFocusWithin });
  const shouldFocus = useRef(false);
  const { position: focus, isLost } = resolveMatrixFocus(own, rowIds, columnIds);
  // A focus taken while the matrix was empty binds to the items at its place once they arrive.
  const adopted = adoptMatrixFocus(own, rowIds, columnIds);
  if (adopted !== own) setOwn(adopted);
  const moveTo = (position: MatrixPosition) => setOwn(toMatrixFocus(position, rowIds, columnIds));
  useLayoutEffect(() => {
    if (!root.current) return;
    if (isLost) {
      // The focused item went: its place takes over, and takes DOM focus if the cell held it.
      const hasDroppedFocus = isFocusWithin && !containsFocus(root.current);
      shouldFocus.current ||= hasDroppedFocus;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- whether the cell held focus is known only once its removal is committed.
      moveTo(focus);
    }
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    const cell = root.current.querySelector<HTMLElement>(selectMatrixCell(focus));
    if (!cell) return;
    cell.focus({ preventScroll: true });
    revealCell(root.current, cell, focus);
  });
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const from = readPosition(event.target);
    if (event.altKey || from === null) return;
    const pageSize = measurePage(event.currentTarget, event.target as Element);
    if (actionKeys.has(event.key) && from.row >= 0 && from.column >= 0) {
      event.preventDefault();
      onCellAction(from);
      return;
    }
    const next = moveMatrixFocus(from, {
      ...{ key: event.key, isPrimaryModifier: event.ctrlKey || event.metaKey },
      ...{ isRightToLeft: direction === 'rtl', pageSize },
      ...{ rowCount: rowIds.length, columnCount: columnIds.length },
    });
    if (!next) return;
    event.preventDefault();
    shouldFocus.current = true;
    moveTo(next);
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const position = readPosition(event.target);
    if (position && (position.row !== focus.row || position.column !== focus.column))
      moveTo(position);
  };
  return {
    focus,
    isFocusWithin,
    gridProps: {
      onKeyDown,
      onFocus: (event) => {
        focusWithinProps.onFocus?.(event);
        onFocus(event);
      },
      onBlur: (event) => focusWithinProps.onBlur?.(event),
    },
  };
}
