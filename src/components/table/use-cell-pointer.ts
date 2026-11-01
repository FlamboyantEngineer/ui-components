'use client';

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { listenPointerRelease } from '../../utils/pointer-drag.js';
import {
  createBoundsRange,
  createCellRange,
  findDataCell,
  isSameCellRange,
  locateCell,
  readCellPosition,
  type CellBounds,
  type CellGrid,
  type TableCellPosition,
  type TableCellRange,
  type TableCellSelectionMode,
} from './table-cell-range.js';
import { planFill, resolveFillTarget, type CellWrite } from './table-cell-writes.js';
import type { TableRow } from './table-rows.js';
import { useLatest } from '../../utils/use-latest.js';
import { isElement } from '../../utils/is-element.js';
import { isInteractiveTarget } from '../../utils/is-interactive-target.js';

interface CellPointerOptions<T> {
  mode: TableCellSelectionMode;
  grid: CellGrid<T>;
  range: TableCellRange | null;
  bounds: CellBounds | null;
  setRange: (range: TableCellRange | null) => void;
  /** Writes the cells a fill covers. */
  write: (writes: readonly CellWrite<T>[]) => void;
}

interface CellPointer {
  /** The cells a dragged fill handle would fill, while it drags. */
  fillBounds: CellBounds | null;
  /**
   * Whether focus reaching `cell` comes from a press a control inside it kept, which React Aria
   * answers by focusing the cell: that focus must not select the cell.
   */
  isControlPress: (cell: EventTarget) => boolean;
  rootProps: {
    onPointerDownCapture: (event: PointerEvent<HTMLElement>) => void;
    onPointerOver: (event: PointerEvent<HTMLElement>) => void;
  };
}

type DragKind = 'select' | 'fill';

/** What a gesture started from; a change to any of them ends it. */
interface DragOrigin<T> {
  kind: DragKind;
  /** The pointer that pressed; only it extends, ends or cancels the gesture. */
  pointerId: number;
  mode: TableCellSelectionMode;
  grid: CellGrid<T>;
  range: TableCellRange | null;
}

/** Whether the table still is as the gesture found it: same mode and grid, and for a fill, same source. */
function isOriginKept<T>(origin: DragOrigin<T>, options: CellPointerOptions<T>): boolean {
  if (origin.mode !== options.mode || origin.grid !== options.grid) return false;
  return origin.kind !== 'fill' || isSameCellRange(origin.range, options.range);
}

/**
 * The selection or fill gesture, including its live target and document-level ending. A gesture
 * whose mode, rows or columns change, or whose fill source is replaced, ends without writing.
 */
function useCellDrag<T extends TableRow>(options: CellPointerOptions<T>) {
  const [fillBounds, setFillBounds] = useState<CellBounds | null>(null);
  const drag = useRef<DragOrigin<T> | null>(null);
  const fillTarget = useRef<CellBounds | null>(null);
  const stop = useRef<(() => void) | null>(null);
  const latestRef = useLatest(options);
  useEffect(() => () => stop.current?.(), []);
  const finish = (shouldCommit: boolean) => {
    const { bounds, grid, write, setRange } = latestRef.current;
    const target = fillTarget.current;
    if (shouldCommit && drag.current?.kind === 'fill' && bounds && target) {
      write(planFill(grid, bounds, target));
      setRange(createBoundsRange(grid, target));
    }
    drag.current = null;
    fillTarget.current = null;
    setFillBounds(null);
  };
  useLayoutEffect(() => {
    const origin = drag.current;
    if (!origin || isOriginKept(origin, options)) return;
    stop.current?.();
    stop.current = null;
    finish(false);
  });
  const begin = (kind: DragKind, event: PointerEvent<HTMLElement>) => {
    stop.current?.();
    const { mode, grid, range } = latestRef.current;
    drag.current = { kind, pointerId: event.pointerId, mode, grid, range };
    const end = (shouldCommit: boolean) => {
      stop.current = null;
      finish(shouldCommit);
    };
    stop.current = listenPointerRelease({
      element: event.currentTarget,
      pointerId: event.pointerId,
      onRelease: () => end(true),
      onCancel: () => end(false),
    });
  };
  const extend = (position: TableCellPosition, pointerId: number) => {
    const { grid, range, bounds, setRange } = latestRef.current;
    if (drag.current?.pointerId !== pointerId || !range) return;
    if (drag.current.kind === 'select') {
      setRange({ anchor: range.anchor, focus: position });
      return;
    }
    const at = locateCell(grid, position);
    fillTarget.current = bounds && at ? resolveFillTarget(bounds, at) : null;
    setFillBounds(fillTarget.current);
  };
  return { fillBounds, begin, extend };
}

/**
 * Selecting cells by pointer in spreadsheet mode: a press selects a cell and focuses it, Shift
 * with a press extends the range to the pressed cell, dragging extends it to the cell under the
 * pointer, and dragging the fill handle fills the cells it reaches when the pointer is released.
 * Presses on data cells select cells rather than rows; controls inside cells keep their presses.
 */
export function useCellPointer<T extends TableRow>(options: CellPointerOptions<T>): CellPointer {
  const { mode, grid, range, setRange } = options;
  const drag = useCellDrag(options);
  const controlCell = useRef<HTMLElement | null>(null);
  const press = (
    cell: HTMLElement,
    position: TableCellPosition,
    event: PointerEvent<HTMLElement>,
  ) => {
    if (event.shiftKey && mode === 'range' && range) {
      setRange({ anchor: range.anchor, focus: position });
      return;
    }
    setRange(createCellRange(position));
    cell.focus();
    if (mode === 'range') drag.begin('select', event);
  };
  const onPointerDownCapture = (event: PointerEvent<HTMLElement>) => {
    if (
      mode === 'none' ||
      event.button !== 0 ||
      event.isPrimary === false ||
      !isElement(event.target)
    )
      return;
    if (event.target.closest('.ui-table__fill-handle')) {
      event.preventDefault();
      event.stopPropagation();
      drag.begin('fill', event);
      return;
    }
    const cell = findDataCell(event.target, event.currentTarget);
    controlCell.current = null;
    if (!cell) return;
    // Controls and editable content in the cell, and presses they handled, keep their gesture.
    if (event.defaultPrevented || isInteractiveTarget(event.target, cell)) {
      controlCell.current = cell;
      return;
    }
    if (cell.dataset['editing']) return;
    const position = readCellPosition(grid, cell);
    if (!position) return;
    // The press is the table's: no row selection, no text selection.
    event.preventDefault();
    event.stopPropagation();
    press(cell, position, event);
  };
  const onPointerOver = (event: PointerEvent<HTMLElement>) => {
    const cell = findDataCell(event.target, event.currentTarget);
    const position = cell ? readCellPosition(grid, cell) : null;
    if (position) drag.extend(position, event.pointerId);
  };
  return {
    fillBounds: drag.fillBounds,
    isControlPress: (cell) => cell === controlCell.current,
    rootProps: { onPointerDownCapture, onPointerOver },
  };
}
