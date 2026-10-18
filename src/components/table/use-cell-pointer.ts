import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import {
  createBoundsRange,
  createCellRange,
  findDataCell,
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

interface CellPointerOptions<T> {
  mode: TableCellSelectionMode;
  grid: CellGrid<T>;
  range: TableCellRange | null;
  bounds: CellBounds | null;
  setRange: (range: TableCellRange | null) => void;
  /** Writes the cells a fill covers. */
  write: (writes: readonly CellWrite<T>[]) => void;
}

export interface CellPointer {
  /** The cells a dragged fill handle would fill, while it drags. */
  fillBounds: CellBounds | null;
  rootProps: {
    onPointerDownCapture: (event: PointerEvent<HTMLElement>) => void;
    onPointerOver: (event: PointerEvent<HTMLElement>) => void;
  };
}

type DragKind = 'select' | 'fill';

/** Controls inside a cell that keep their own presses. */
const interactiveSelector =
  'button, a, input, select, textarea, [role="button"], [role="checkbox"], [contenteditable="true"]';

function isInteractive(target: Element, cell: HTMLElement): boolean {
  const control = target.closest(interactiveSelector);
  return control !== null && control !== cell && cell.contains(control);
}

/**
 * Selecting cells by pointer in spreadsheet mode: a press selects a cell and focuses it, Shift
 * with a press extends the range to the pressed cell, dragging extends it to the cell under the
 * pointer, and dragging the fill handle fills the cells it reaches when the pointer is released.
 * Presses on data cells select cells rather than rows; controls inside cells keep their presses.
 */
export function useCellPointer<T extends TableRow>(options: CellPointerOptions<T>): CellPointer {
  const { mode, grid } = options;
  const [fillBounds, setFillBounds] = useState<CellBounds | null>(null);
  const drag = useRef<DragKind | null>(null);
  // The fill target as the release sees it, which may come before the next render.
  const fillTarget = useRef<CellBounds | null>(null);
  const stop = useRef<(() => void) | null>(null);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  useEffect(() => () => stop.current?.(), []);

  const finish = () => {
    const { bounds, grid: current, write, setRange } = latest.current;
    const target = fillTarget.current;
    if (drag.current === 'fill' && bounds && target) {
      write(planFill(current, bounds, target));
      setRange(createBoundsRange(current, target));
    }
    drag.current = null;
    fillTarget.current = null;
    setFillBounds(null);
  };
  const begin = (kind: DragKind) => {
    drag.current = kind;
    const end = () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      stop.current = null;
      finish();
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    stop.current = end;
  };

  const press = (cell: HTMLElement, position: TableCellPosition, isShift: boolean) => {
    const { range, setRange } = latest.current;
    if (isShift && mode === 'range' && range) {
      setRange({ anchor: range.anchor, focus: position });
      return;
    }
    setRange(createCellRange(position));
    cell.focus();
    if (mode === 'range') begin('select');
  };

  const onPointerDownCapture = (event: PointerEvent<HTMLElement>) => {
    if (mode === 'none' || event.button !== 0 || !(event.target instanceof Element)) return;
    if (event.target.closest('.ui-table__fill-handle')) {
      event.preventDefault();
      event.stopPropagation();
      begin('fill');
      return;
    }
    const cell = findDataCell(event.target, event.currentTarget);
    if (!cell || isInteractive(event.target, cell) || cell.dataset['editing']) return;
    const position = readCellPosition(grid, cell);
    if (!position) return;
    // The press is the table's: no row selection, no text selection.
    event.preventDefault();
    event.stopPropagation();
    press(cell, position, event.shiftKey);
  };

  const onPointerOver = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    const cell = findDataCell(event.target, event.currentTarget);
    const position = cell ? readCellPosition(grid, cell) : null;
    const { range, bounds, setRange } = latest.current;
    if (!position || !range) return;
    if (drag.current === 'select') {
      setRange({ anchor: range.anchor, focus: position });
      return;
    }
    const at = locateCell(grid, position);
    fillTarget.current = bounds && at ? resolveFillTarget(bounds, at) : null;
    setFillBounds(fillTarget.current);
  };

  return { fillBounds, rootProps: { onPointerDownCapture, onPointerOver } };
}
