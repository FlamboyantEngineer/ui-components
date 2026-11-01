'use client';

import { findMaximum } from '../../utils/find-maximum.js';
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { usePersistentState } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useLatest } from '../../utils/use-latest.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  dashboardLayoutCodec,
  fitColumns,
  normalizeDashboardLayout,
  reflowDashboardLayout,
  toColumnCount,
  type DashboardGridItem,
} from './dashboard-layout.js';
import type { CellStep, TileMoveKind } from './use-tile-move.js';
import { isSameCells, readGap, useTileMoves } from './use-tile-moves.js';

export type { DashboardGridItem } from './dashboard-layout.js';

export interface DashboardGridProps
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** Where each tile sits, controlled. Overlapping tiles are pushed down. */
  layout?: readonly DashboardGridItem[] | undefined;
  /** Where each tile sits at first, uncontrolled. */
  defaultLayout?: readonly DashboardGridItem[] | undefined;
  /** Called with the whole layout after the reader moves or resizes a tile. */
  onLayoutChange?: ((layout: DashboardGridItem[]) => void) | undefined;
  /** Remembers the uncontrolled layout through the provider storage under this key. */
  persistKey?: string | undefined;
  /** The columns the layout is laid out on. Defaults to 12. */
  columns?: number | undefined;
  /** Below this width per column, in pixels, the grid shows fewer columns, read only. */
  minColumnWidth?: number | undefined;
  /** The height of one row, in pixels. Defaults to 80. */
  rowHeight?: number | undefined;
  /** Shows each tile's move and resize handles. */
  isEditing?: boolean | undefined;
  /** Renders the tile of a layout item, usually a `DashboardTile`. */
  children: (item: DashboardGridItem) => ReactNode;
}

/** What every tile reads from its grid: the same object while the grid's options are. */
interface DashboardGridShared {
  columns: number;
  isEditing: boolean;
  /** The handle to focus again after a keyboard move, once the tiles have rendered. */
  refocus: RefObject<{ id: Key; kind: TileMoveKind } | null>;
  measureStep: () => CellStep;
  /** Starts a gesture session, ending any other: only the latest session previews and commits. */
  begin: () => number;
  /** Shows where a gesture that started from `origin` would put the tile. */
  preview: (gesture: TileGesture) => void;
  /**
   * Keeps the session's previewed layout and returns the moved tile, if a preview changed the
   * layout; nothing for a session the grid ended.
   */
  commit: (session: number, isKeyboard: boolean) => DashboardGridItem | undefined;
  /** Ends a session without keeping it, such as when its handle unmounts mid-gesture. */
  abandon: (session: number) => void;
  announce: (message: string) => void;
}

/** What a tile reads from its grid: the shared state, its layout item and how it is moving. */
export interface DashboardGridTileState extends DashboardGridShared {
  item: DashboardGridItem;
  /** How the tile is being moved or resized, if it is. */
  moving: TileMoveKind | null;
}

/** A move or resize in progress: the tile as it started, where it is asked to go, and how. */
export interface TileGesture {
  /** The session `begin` started for the gesture. */
  session: number;
  origin: DashboardGridItem;
  next: DashboardGridItem;
  kind: TileMoveKind;
}

export const dashboardGridHooks = createHooks('dashboard-grid', [
  'tile',
  'tile-content',
  'move',
  'resize',
  'status',
]);

const DashboardGridContext = createContext<DashboardGridTileState | null>(null);

/** The grid a `DashboardTile` sits in; `null` outside one. */
export function useDashboardGridTile(): DashboardGridTileState | null {
  return useContext(DashboardGridContext);
}

/** The layout shown: the committed one, or the preview while a tile moves. */
function useDashboardLayout(
  props: Pick<DashboardGridProps, 'layout' | 'defaultLayout' | 'onLayoutChange' | 'persistKey'>,
  columns: number,
) {
  const [own, setOwn] = usePersistentState<DashboardGridItem[]>(
    props.layout === undefined ? props.persistKey : undefined,
    () => [...(props.defaultLayout ?? [])],
    { codec: dashboardLayoutCodec },
  );
  const source = props.layout ?? own;
  const layout = useMemo(() => normalizeDashboardLayout(source, columns), [source, columns]);
  const latest = useLatest(props);
  // Who the layout belongs to: a gesture started under one owner never writes to another.
  const owner = props.layout === undefined ? `own:${props.persistKey ?? ''}` : 'controlled';
  const commit = useCallback(
    (next: DashboardGridItem[]) => {
      if (latest.current.layout === undefined) setOwn(next);
      latest.current.onLayoutChange?.(next);
    },
    [latest, setOwn],
  );
  return { layout, commit, owner };
}

/**
 * How many columns fit: the layout's own, or fewer below `minColumnWidth` per column once the gaps
 * between them are counted.
 */
function useShownColumns(element: Element | null, columns: number, minColumnWidth?: number) {
  // The content box: the grid's padding and border hold no column.
  const width = useElementSize(element, { enabled: minColumnWidth !== undefined })?.width ?? 0;
  if (minColumnWidth === undefined || !(minColumnWidth > 0) || width <= 0 || !element) {
    return columns;
  }
  return Math.min(columns, fitColumns(width, minColumnWidth, readGap(element, 'columnGap')));
}

interface DashboardGridCellProps {
  shared: DashboardGridShared;
  item: DashboardGridItem;
  moving: TileMoveKind | null;
  render: (item: DashboardGridItem) => ReactNode;
}

/**
 * One tile's place in the grid. It renders again only when its own cells, its move or the grid's
 * shared state change, so a preview leaves the tiles it does not move alone.
 */
const DashboardGridCell = memo(
  function DashboardGridCell({ shared, item, moving, render }: DashboardGridCellProps) {
    const value = useMemo(() => ({ ...shared, item, moving }), [shared, item, moving]);
    return <DashboardGridContext value={value}>{render(item)}</DashboardGridContext>;
  },
  (before, after) =>
    before.shared === after.shared &&
    before.moving === after.moving &&
    before.render === after.render &&
    before.item.id === after.item.id &&
    isSameCells(before.item, after.item),
);

/**
 * A grid of tiles on whole columns and rows, each placed by plain `{ id, x, y, w, h }` data. In
 * edit mode every tile shows a move handle and a resize handle that work by pointer drag and by
 * the arrow keys; a tile moved or grown onto others pushes them down. Below `minColumnWidth` per
 * column the grid reflows its tiles onto fewer columns, read only.
 */
export function DashboardGrid({
  layout,
  defaultLayout,
  onLayoutChange,
  persistKey,
  columns: columnsProp = 12,
  minColumnWidth,
  rowHeight = 80,
  isEditing = false,
  children,
  className,
  ref,
  ...rest
}: DashboardGridProps) {
  const columns = toColumnCount(columnsProp);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const rootRef = useMemo(() => mergeRefs(ref, setElement), [ref]);
  const committed = useDashboardLayout(
    { layout, defaultLayout, onLayoutChange, persistKey },
    columns,
  );
  const shownColumns = useShownColumns(element, columns, minColumnWidth);
  const isReflowed = shownColumns < columns;
  const editable = isEditing && !isReflowed;
  const { previewLayout, moving, handlers } = useTileMoves({
    element,
    committed,
    columns,
    rowHeight,
    isEditing: editable,
  });
  const [message, setMessage] = useState('');
  const shown = isReflowed
    ? reflowDashboardLayout(committed.layout, { from: columns, to: shownColumns })
    : (previewLayout ?? committed.layout);
  const order = useMemo(
    () => [...committed.layout].sort((a, b) => a.y - b.y || a.x - b.x),
    [committed.layout],
  );
  const positions = new Map(shown.map((item) => [item.id, item]));
  const rows = findMaximum(shown, (item) => item.y + item.h, 1);
  const shared = useMemo(
    () => ({ ...handlers, columns, isEditing: editable, announce: setMessage }),
    [handlers, columns, editable],
  );
  const style = {
    gridTemplateColumns: `repeat(${shownColumns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, ${rowHeight}px)`,
  } satisfies CSSProperties;
  return (
    <div
      {...rest}
      {...dashboardGridHooks.root({
        className,
        data: { editing: editable, reflowed: isReflowed },
      })}
      ref={rootRef}
      role="group"
      style={style}
    >
      {order.map((entry) => {
        const item = positions.get(entry.id) ?? entry;
        return (
          <DashboardGridCell
            key={toKeyIdentity(item.id)}
            shared={shared}
            item={item}
            moving={moving?.id === item.id ? moving.kind : null}
            render={children}
          />
        );
      })}
      <VisuallyHidden>
        <div {...dashboardGridHooks.slot('status')} role="status">
          {message}
        </div>
      </VisuallyHidden>
    </div>
  );
}
