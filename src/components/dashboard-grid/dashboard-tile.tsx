'use client';

import { type ReactNode, type Ref, type RefObject, useLayoutEffect, useMemo, useRef } from 'react';
import { DragHandleGlyph, ResizeGlyph } from '../../core/glyphs.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { isFocused } from '../../utils/focus-target.js';
import {
  dashboardGridHooks as hooks,
  type DashboardGridTileState,
  useDashboardGridTile,
} from './dashboard-grid.js';
import { useTileMenu } from './dashboard-grid-menu.js';
import { type TileMoveKind, useTileMove } from './use-tile-move.js';

export interface DashboardTileProps extends BaseProps, RefProps<HTMLDivElement> {
  /** Names the tile and its handles, such as the title of the card it holds. */
  label: string;
  /** The tile's content. */
  children?: ReactNode;
  /** The fewest columns a resize leaves the tile. Defaults to 1. */
  minColumnSpan?: number | undefined;
  /** The fewest rows a resize leaves the tile. Defaults to 1. */
  minRowSpan?: number | undefined;
}

interface TileHandleProps {
  grid: DashboardGridTileState;
  handleRef: RefObject<HTMLButtonElement | null>;
  kind: TileMoveKind;
  label: string;
  minColumnSpan: number;
  minRowSpan: number;
}

/** A move or resize handle: a button that drags by pointer and steps by the arrow keys. */
function TileHandle({
  grid,
  handleRef: ref,
  kind,
  label,
  minColumnSpan,
  minRowSpan,
}: TileHandleProps) {
  const strings = useUiStrings();
  const moveProps = useTileMove({
    item: grid.item,
    kind,
    columns: grid.columns,
    minColumnSpan,
    minRowSpan,
    measureStep: grid.measureStep,
    onStart: grid.begin,
    onPreview: (next, origin, session) => grid.preview({ session, origin, next, kind }),
    onAbandon: grid.abandon,
    onCommit: (session, isKeyboard) => {
      const item = grid.commit(session, isKeyboard);
      if (!item) return;
      grid.announce(
        kind === 'move'
          ? strings.tileMoved(label, item.x + 1, item.y + 1)
          : strings.tileResized(label, item.w, item.h),
      );
    },
  });
  // A keyboard move can reorder the tiles, which takes focus from the handle; give it back.
  const { refocus: refocusRef } = grid;
  useLayoutEffect(() => {
    const target = refocusRef.current;
    if (target?.id !== grid.item.id || target.kind !== kind) return;
    refocusRef.current = null;
    if (ref.current && !isFocused(ref.current)) ref.current.focus();
  });
  return (
    <button
      {...moveProps}
      {...hooks.slot(kind)}
      ref={ref}
      type="button"
      aria-label={kind === 'move' ? strings.moveTile(label) : strings.resizeTile(label)}
    >
      <Glyph icon={kind === 'move' ? DragHandleGlyph : ResizeGlyph} />
    </button>
  );
}

const moveSelector = `.${hooks.slotClass('move')}`;

/** The move handle of the tile after `tile`, else of the one before, for focus after a removal. */
function findFallback(tile: HTMLElement): HTMLElement | null {
  for (const sibling of [tile.nextElementSibling, tile.previousElementSibling]) {
    const handle = sibling?.querySelector<HTMLElement>(moveSelector);
    if (handle) return handle;
  }
  return null;
}

/**
 * One tile of a `DashboardGrid`: a named group placed on the grid's cells from its layout item.
 * In edit mode it shows a move handle before its content and a resize handle after it.
 */
export function DashboardTile({
  label,
  children,
  minColumnSpan = 1,
  minRowSpan = 1,
  className,
  ref,
  ...rest
}: DashboardTileProps) {
  const grid = useDashboardGridTile();
  const item = grid?.item;
  const moving = grid?.moving;
  const moveRef = useRef<HTMLButtonElement>(null);
  const resizeRef = useRef<HTMLButtonElement>(null);
  const handles = useMemo(() => ({ move: moveRef, resize: resizeRef }), []);
  const handle = (kind: TileMoveKind) =>
    grid?.isEditing ? (
      <TileHandle
        grid={grid}
        handleRef={handles[kind]}
        kind={kind}
        label={label}
        minColumnSpan={minColumnSpan}
        minRowSpan={minRowSpan}
      />
    ) : null;
  const tileMenu = useTileMenu(grid, label, {
    handles,
    ownRef: ref as Ref<HTMLElement> | undefined,
    findFallback,
  });
  return (
    <div
      {...rest}
      {...tileMenu.targetProps}
      {...hooks.slot(
        'tile',
        { moving: moving === 'move', resizing: moving === 'resize' },
        className,
      )}
      role="group"
      aria-label={label}
      style={
        item
          ? {
              gridColumn: `${item.x + 1} / span ${item.w}`,
              gridRow: `${item.y + 1} / span ${item.h}`,
            }
          : undefined
      }
    >
      {handle('move')}
      <div {...hooks.slot('tile-content')}>{children}</div>
      {handle('resize')}
      {tileMenu.menu}
    </div>
  );
}
