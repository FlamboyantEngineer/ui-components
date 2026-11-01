'use client';

import { useEffect, useRef, type DOMAttributes, type PointerEvent } from 'react';
import { useLocale, useMove } from '../../primitives/index.js';
import { isFreeEditKey } from '../../utils/is-free-edit-key.js';
import { useLatest } from '../../utils/use-latest.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
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
 * Whether the pointer that pressed the handle ended by a cancellation (`pointercancel`, such as a
 * touch the browser takes over for scrolling) rather than a release. React Aria ends a move the
 * same way for both, so the handle listens for its pointer's end before React Aria does.
 */
function usePointerCancellation() {
  const cancelled = useRef(false);
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    cancelled.current = false;
    const { pointerId } = event;
    const owner = getOwnerWindow(event.currentTarget);
    const onEnd = (end: globalThis.PointerEvent) => {
      if (end.pointerId !== pointerId) return;
      cancelled.current = end.type === 'pointercancel';
      owner.removeEventListener('pointerup', onEnd, true);
      owner.removeEventListener('pointercancel', onEnd, true);
    };
    owner.addEventListener('pointerup', onEnd, true);
    owner.addEventListener('pointercancel', onEnd, true);
  };
  /** Whether the last pointer was cancelled, forgetting it. */
  const take = () => {
    const wasCancelled = cancelled.current;
    cancelled.current = false;
    return wasCancelled;
  };
  return { onPointerDown, take };
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
  const cancellation = usePointerCancellation();
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
      if (!active) return;
      // A cancelled pointer keeps nothing: the tile goes back to its committed cells.
      if (cancellation.take()) options.onAbandon(active.session);
      else options.onCommit(active.session, event.pointerType === 'keyboard');
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
    onPointerDown: (event) => {
      cancellation.onPointerDown(event);
      moveProps.onPointerDown?.(event);
    },
  };
}
