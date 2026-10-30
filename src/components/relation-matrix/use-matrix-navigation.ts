'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useFocusWithin, useLocale } from '../../primitives/index.js';
import { mergeProps } from '../../utils/merge-props.js';
import { clampMatrixPosition, moveMatrixFocus, type MatrixPosition } from './matrix-navigation.js';

interface MatrixNavigationOptions {
  root: RefObject<HTMLDivElement | null>;
  rowCount: number;
  columnCount: number;
  /** Called when Enter or Space is pressed on a body cell. */
  onCellAction: (position: MatrixPosition) => void;
}

/** A matrix grid's focused cell (its single tab stop) and the props that move it. */
interface MatrixNavigation {
  focus: MatrixPosition;
  isFocusWithin: boolean;
  gridProps: {
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
    onFocus: (event: FocusEvent<HTMLDivElement>) => void;
    onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  };
}

const actionKeys = new Set(['Enter', ' ']);
/** Rows a page holds where nothing is measured. */
const defaultPage = 10;

/** The selector of the cell at `position`, through the grid's row and column indices. */
function selectMatrixCell({ row, column }: MatrixPosition): string {
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
function readPosition(target: EventTarget): MatrixPosition | null {
  if (!(target instanceof Element)) return null;
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
  const view = root.getBoundingClientRect();
  const box = cell.getBoundingClientRect();
  const corner = root
    .querySelector(selectMatrixCell({ row: -1, column: -1 }))
    ?.getBoundingClientRect();
  if (position.row >= 0) {
    const top = view.top + root.clientTop + (corner?.height ?? 0);
    const bottom = view.top + root.clientTop + root.clientHeight;
    if (box.top < top) root.scrollTop -= top - box.top;
    else if (box.bottom > bottom) root.scrollTop += box.bottom - bottom;
  }
  if (position.column >= 0) {
    const isRightToLeft = getComputedStyle(root).direction === 'rtl';
    const inset = corner?.width ?? 0;
    const left = view.left + root.clientLeft + (isRightToLeft ? 0 : inset);
    const right = view.left + root.clientLeft + root.clientWidth - (isRightToLeft ? inset : 0);
    if (box.left < left) root.scrollLeft -= left - box.left;
    else if (box.right > right) root.scrollLeft += box.right - right;
  }
}

/**
 * Grid keyboard navigation over a matrix with a header row and a row header column: arrow keys,
 * PageUp, PageDown, Home and End (with Control or Command, Home and End reach the corners) move
 * the focused cell, which holds the grid's only tab stop and scrolls into view; focus landing on a
 * cell by pointer makes it the focused cell.
 */
export function useMatrixNavigation({
  root,
  rowCount,
  columnCount,
  onCellAction,
}: MatrixNavigationOptions): MatrixNavigation {
  const { direction } = useLocale();
  const [own, setOwn] = useState<MatrixPosition>({ row: 0, column: 0 });
  const [isFocusWithin, setFocusWithin] = useState(false);
  const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setFocusWithin });
  const shouldFocus = useRef(false);
  const focus = clampMatrixPosition(own, rowCount, columnCount);
  useLayoutEffect(() => {
    if (!shouldFocus.current || !root.current) return;
    shouldFocus.current = false;
    const cell = root.current.querySelector<HTMLElement>(selectMatrixCell(focus));
    if (!cell) return;
    cell.focus({ preventScroll: true });
    revealCell(root.current, cell, focus);
  });
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || readPosition(event.target) === null) return;
    const pageSize = measurePage(event.currentTarget, event.target as Element);
    if (actionKeys.has(event.key) && focus.row >= 0 && focus.column >= 0) {
      event.preventDefault();
      onCellAction(focus);
      return;
    }
    const next = moveMatrixFocus(focus, {
      ...{ key: event.key, isPrimaryModifier: event.ctrlKey || event.metaKey },
      ...{ isRightToLeft: direction === 'rtl', rowCount, columnCount, pageSize },
    });
    if (!next) return;
    event.preventDefault();
    shouldFocus.current = true;
    setOwn(next);
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const position = readPosition(event.target);
    if (position && (position.row !== focus.row || position.column !== focus.column))
      setOwn(position);
  };
  return {
    focus,
    isFocusWithin,
    gridProps: mergeProps(focusWithinProps, {
      onKeyDown,
      onFocus,
    }) as MatrixNavigation['gridProps'],
  };
}
