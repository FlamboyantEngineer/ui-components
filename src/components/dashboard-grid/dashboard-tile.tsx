import { useLayoutEffect, useRef, type ReactNode, type Ref } from 'react';
import { Glyph, useUiStrings } from '../../core/provider.js';
import type { BaseProps } from '../../core/props.js';
import {
  dashboardGridHooks as hooks,
  useDashboardGridTile,
  type DashboardGridTileState,
} from './dashboard-grid.js';
import { useTileMove, type TileMoveKind } from './use-tile-move.js';

export interface DashboardTileProps extends BaseProps {
  /** Names the tile and its handles, such as the title of the card it holds. */
  label: string;
  /** The tile's content. */
  children?: ReactNode;
  /** The fewest columns a resize leaves the tile. Defaults to 1. */
  minColumnSpan?: number | undefined;
  /** The fewest rows a resize leaves the tile. Defaults to 1. */
  minRowSpan?: number | undefined;
  /** The tile element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

interface TileHandleProps {
  grid: DashboardGridTileState;
  kind: TileMoveKind;
  label: string;
  minColumnSpan: number;
  minRowSpan: number;
}

/** A move or resize handle: a button that drags by pointer and steps by the arrow keys. */
function TileHandle({ grid, kind, label, minColumnSpan, minRowSpan }: TileHandleProps) {
  const strings = useUiStrings();
  const ref = useRef<HTMLButtonElement>(null);
  const moveProps = useTileMove({
    item: grid.item,
    kind,
    columns: grid.columns,
    minColumnSpan,
    minRowSpan,
    measureStep: grid.measureStep,
    onPreview: (next) => grid.preview(next, kind),
    onCommit: (isKeyboard) => {
      const item = grid.commit(isKeyboard);
      if (!item) return;
      grid.announce(
        kind === 'move'
          ? strings.tileMoved(label, item.x + 1, item.y + 1)
          : strings.tileResized(label, item.w, item.h),
      );
    },
  });
  // A keyboard move can reorder the tiles, which takes focus from the handle; give it back.
  useLayoutEffect(() => {
    const target = grid.refocus.current;
    if (target?.id !== grid.item.id || target.kind !== kind) return;
    grid.refocus.current = null;
    if (ref.current && ref.current.ownerDocument.activeElement !== ref.current) ref.current.focus();
  });
  return (
    <button
      {...moveProps}
      {...hooks.slot(kind)}
      ref={ref}
      type="button"
      aria-label={kind === 'move' ? strings.moveTile(label) : strings.resizeTile(label)}
    >
      <Glyph name={kind === 'move' ? 'drag-handle' : 'resize'} />
    </button>
  );
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
  ...rest
}: DashboardTileProps) {
  const grid = useDashboardGridTile();
  const item = grid?.item;
  const moving = grid?.moving?.id === item?.id ? grid?.moving?.kind : undefined;
  const handle = (kind: TileMoveKind) =>
    grid?.isEditing ? (
      <TileHandle
        grid={grid}
        kind={kind}
        label={label}
        minColumnSpan={minColumnSpan}
        minRowSpan={minRowSpan}
      />
    ) : null;
  return (
    <div
      {...rest}
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
    </div>
  );
}
