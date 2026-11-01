'use client';

import { useEffect, useRef, type DOMAttributes } from 'react';
import { useLocale, useMove } from '../../primitives/index.js';
import { isFreeEditKey } from '../../utils/is-free-edit-key.js';
import { useLatest } from '../../utils/use-latest.js';
import type { DashboardGridItem } from './dashboard-layout.js';

/** `move` shifts a tile; `resize` changes its span from its bottom end corner. */
export type TileMoveKind = 'move' | 'resize';

/** The pixels one column and one row step across, gaps included. */
export interface CellStep {
  column: number;
  row: number;
}

interface TileMoveOptions {
  item: DashboardGridItem;
  kind: TileMoveKind;
  /** The grid's columns, which a resize never reaches past. */
  columns: number;
  /** The narrowest and shortest a resize may make the tile. */
  minColumnSpan: number;
  minRowSpan: number;
  /** Reads the cell step when a pointer move starts. */
  measureStep: () => CellStep;
  /** Starts a gesture session and returns it; a session the grid ends never previews again. */
  onStart: () => number;
  /** Shows where the tile would go, from the tile as it was when the gesture started. */
  onPreview: (next: DashboardGridItem, origin: DashboardGridItem, session: number) => void;
  /** Keeps the session's last preview; `isKeyboard` for a move made with the arrow keys. */
  onCommit: (session: number, isKeyboard: boolean) => void;
  /** Ends the session without keeping it: the handle unmounted mid-gesture. */
  onAbandon: (session: number) => void;
}

interface Cells {
  x: number;
  y: number;
}

interface MoveStart {
  session: number;
  origin: DashboardGridItem;
  step: CellStep;
  deltaX: number;
  deltaY: number;
  /** The cells of the last preview, `null` before the first. */
  cells: Cells | null;
}

/**
 * The tile an accumulated move of `cells` makes from `origin`. A resize keeps the tile's start, so
 * it never spans past the last column.
 */
function resolveMovedItem(
  { origin, cells }: { origin: DashboardGridItem; cells: Cells },
  {
    kind,
    columns,
    minColumnSpan,
    minRowSpan,
  }: Pick<TileMoveOptions, 'kind' | 'columns' | 'minColumnSpan' | 'minRowSpan'>,
): DashboardGridItem {
  if (kind === 'move') return { ...origin, x: origin.x + cells.x, y: origin.y + cells.y };
  return {
    ...origin,
    w: Math.min(columns - origin.x, Math.max(minColumnSpan, origin.w + cells.x)),
    h: Math.max(minRowSpan, origin.h + cells.y),
  };
}

/**
 * Pointer drags and arrow keys that move or resize a tile by whole cells. A pointer move snaps to
 * the nearest cell, and previews again only when it reaches another cell; each arrow key press
 * moves one cell, toward the inline end for the right arrow in left-to-right text and the left
 * arrow in right-to-left text.
 */
export function useTileMove(options: TileMoveOptions): DOMAttributes<HTMLButtonElement> {
  const { direction } = useLocale();
  const start = useRef<MoveStart | null>(null);
  const sign = direction === 'rtl' ? -1 : 1;
  const { moveProps } = useMove({
    onMoveStart: () => {
      start.current = {
        session: options.onStart(),
        origin: options.item,
        step: options.measureStep(),
        deltaX: 0,
        deltaY: 0,
        cells: null,
      };
    },
    onMove: (event) => {
      const active = start.current;
      if (!active) return;
      active.deltaX += sign * event.deltaX;
      active.deltaY += event.deltaY;
      const isKeyboard = event.pointerType === 'keyboard';
      const cells = {
        x: isKeyboard ? active.deltaX : Math.round(active.deltaX / active.step.column),
        y: isKeyboard ? active.deltaY : Math.round(active.deltaY / active.step.row),
      };
      if (active.cells?.x === cells.x && active.cells.y === cells.y) return;
      active.cells = cells;
      const next = resolveMovedItem({ origin: active.origin, cells }, options);
      options.onPreview(next, active.origin, active.session);
    },
    onMoveEnd: (event) => {
      const active = start.current;
      start.current = null;
      if (active) options.onCommit(active.session, event.pointerType === 'keyboard');
    },
  });
  // A handle that unmounts mid-gesture ends it: its pointer can never commit afterwards.
  const latestAbandon = useLatest(options.onAbandon);
  useEffect(
    () => () => {
      const active = start.current;
      start.current = null;
      if (active) latestAbandon.current(active.session);
    },
    [latestAbandon],
  );
  // Only plain arrows move or resize; modified, composing and already handled keys pass by.
  const { onKeyDown } = moveProps;
  return {
    ...moveProps,
    onKeyDown: (event) => {
      if (isFreeEditKey(event.nativeEvent) && !event.shiftKey) onKeyDown?.(event);
    },
  };
}
