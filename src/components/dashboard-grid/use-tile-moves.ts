'use client';

// A tile gesture's lifetime in a dashboard grid: its session, its preview against the layout as it
// now is, and its commit, which only the session the grid still accepts can make.

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Key } from '../../core/props.js';
import { useLatest } from '../../utils/use-latest.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { placeDashboardItem, type DashboardGridItem } from './dashboard-layout.js';
import type { TileGesture } from './dashboard-grid.js';
import type { CellStep, TileMoveKind } from './use-tile-move.js';

/** The committed layout a gesture previews against, how to keep a new one, and who owns it. */
export interface CommittedLayout {
  layout: DashboardGridItem[];
  commit: (next: DashboardGridItem[]) => void;
  /** Who the layout belongs to: a gesture started under one owner never writes to another. */
  owner: string;
}

/** The gesture session the grid accepts, and the layout owner it started under. */
interface GestureSession {
  id: number;
  owner: string;
}

/** A grid gap in pixels, 0 when it cannot be read. */
function readGap(element: Element, property: 'columnGap' | 'rowGap'): number {
  const value = Number.parseFloat(getOwnerWindow(element).getComputedStyle(element)[property]);
  return Number.isFinite(value) ? value : 0;
}

/** The pixels one column and one row of the grid step across, gaps included. */
function measureCellStep({
  element,
  columns,
  rowHeight,
}: {
  element: HTMLDivElement | null;
  columns: number;
  rowHeight: number;
}): CellStep {
  if (!element) return { column: 1, row: 1 };
  const width = element.getBoundingClientRect().width;
  const column = (width + readGap(element, 'columnGap')) / columns;
  const row = rowHeight + readGap(element, 'rowGap');
  return { column: Math.max(1, column), row: Math.max(1, row) };
}

/** Whether two layout items are the same tile on the same cells. */
export function isSameCells(a: DashboardGridItem, b: DashboardGridItem): boolean {
  return a.id === b.id && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

/** Whether two layouts place the same tiles in the same order on the same cells. */
function isSameLayout(a: readonly DashboardGridItem[], b: readonly DashboardGridItem[]): boolean {
  return a.length === b.length && a.every((item, index) => isSameCells(item, b[index] ?? item));
}

/**
 * The layout a gesture makes from the committed `layout`, placed again on whatever the layout now
 * holds, so tiles added, removed or moved meanwhile are kept. `null` once the gesture's own tile
 * was removed or changed under it: the gesture no longer describes the current layout.
 */
function resolveGesture(
  gesture: TileGesture,
  layout: readonly DashboardGridItem[],
  columns: number,
): { layout: DashboardGridItem[]; item: DashboardGridItem } | null {
  const current = layout.find((item) => item.id === gesture.origin.id);
  if (!current || !isSameCells(current, gesture.origin)) return null;
  const placed = placeDashboardItem(layout, gesture.next, columns);
  return { layout: placed, item: placed.find((item) => item.id === current.id) ?? current };
}

/** The preview of a tile being moved and the handlers its handles call. */
export function useTileMoves({
  element,
  committed,
  columns,
  rowHeight,
  isEditing,
}: {
  element: HTMLDivElement | null;
  committed: CommittedLayout;
  columns: number;
  rowHeight: number;
  isEditing: boolean;
}) {
  const [gesture, setGesture] = useState<(TileGesture & { owner: string }) | null>(null);
  // The last session the grid ended; its pointer can never preview or commit again.
  const [ended, setEnded] = useState<number | null>(null);
  const pending = useRef<TileGesture | null>(null);
  const active = useRef<GestureSession | null>(null);
  const sessions = useRef(0);
  const refocus = useRef<{ id: Key; kind: TileMoveKind } | null>(null);
  const shown = gesture && resolveGesture(gesture, committed.layout, columns);
  if (gesture && (!isEditing || !shown || committed.owner !== gesture.owner)) {
    setGesture(null);
    setEnded(gesture.session);
  }
  // A gesture the render dropped leaves nothing for its commit, and its session ends for good.
  useLayoutEffect(() => {
    if (!gesture) pending.current = null;
    if (ended !== null && active.current?.id === ended) active.current = null;
  }, [gesture, ended]);
  // The handlers read the grid as it is when they run, so the tiles keep the same ones.
  const latest = useLatest({ element, committed, columns, rowHeight });
  const handlers = useMemo(() => {
    /** The session if it is still the accepted one, under the owner it started with. */
    const accept = (session: number) => {
      const current = active.current;
      if (current?.id !== session) return null;
      if (current.owner === latest.current.committed.owner) return current;
      active.current = null;
      return null;
    };
    const end = (session: number) => {
      if (active.current?.id === session) active.current = null;
      pending.current = null;
      setGesture((current) => (current?.session === session ? null : current));
    };
    return {
      refocus,
      measureStep: () => measureCellStep(latest.current),
      begin: () => {
        sessions.current += 1;
        active.current = { id: sessions.current, owner: latest.current.committed.owner };
        return sessions.current;
      },
      preview: (next: TileGesture) => {
        const session = accept(next.session);
        if (!session) return end(next.session);
        pending.current = next;
        setGesture({ ...next, owner: session.owner });
      },
      commit: (session: number, isKeyboard: boolean) => {
        const { committed, columns } = latest.current;
        const isAccepted = accept(session) !== null;
        const last = isAccepted && pending.current?.session === session ? pending.current : null;
        end(session);
        const result = last && resolveGesture(last, committed.layout, columns);
        if (!last || !result || isSameLayout(result.layout, committed.layout)) return undefined;
        if (isKeyboard) refocus.current = { id: result.item.id, kind: last.kind };
        committed.commit(result.layout);
        return result.item;
      },
      abandon: end,
    };
  }, [latest]);
  return {
    previewLayout: shown?.layout,
    moving: gesture && shown ? { id: gesture.origin.id, kind: gesture.kind } : null,
    handlers,
  };
}
