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
import { isElement } from '../../utils/is-element.js';
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
import type { MenuEntry } from '../menu/menu.js';
import {
  useGridMenus,
  type DashboardTileMenuEntry,
  type DashboardTileMenuOptions,
} from './dashboard-grid-menu.js';
import { isSameCells, readGap, useTileMoves } from './use-tile-moves.js';

export type { DashboardGridItem } from './dashboard-layout.js';
export type { DashboardTileAction, DashboardTileMenuEntry } from './dashboard-grid-menu.js';

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
  /**
   * Each tile's context menu: the built-in `move`, `resize` and `remove` by name (offered in edit
   * mode only) and any menu entries, or a function of the tile's layout item that returns them.
   * Keep it stable, as each new value draws every tile again. Defaults to no menu.
   */
  tileMenu?:
    | readonly DashboardTileMenuEntry[]
    | ((item: DashboardGridItem) => readonly DashboardTileMenuEntry[])
    | undefined;
  /** Called with the chosen tile menu entry and the tile's item, after a built-in action ran. */
  onTileAction?: ((key: Key, item: DashboardGridItem) => void) | undefined;
  /** The context menu of the grid's empty space, such as an action that adds a tile there. */
  spaceMenu?: readonly MenuEntry[] | undefined;
  /** Called with the chosen empty space entry and the cell the menu opened on, from 0. */
  onSpaceAction?: ((key: Key, cell: { x: number; y: number }) => void) | undefined;
  /** Renders the tile of a layout item, usually a `DashboardTile`. */
  children: (item: DashboardGridItem) => ReactNode;
}

/** What every tile reads from its grid: the same object while the grid's options are. */
interface DashboardGridShared {
  columns: number;
  isEditing: boolean;
  /** The tile menu's entries and the host's action callback, or `null` for no menu. */
  menu: DashboardTileMenuOptions | null;
  /** Takes a tile out of the layout, as the tile menu's Remove does. */
  remove: (id: Key) => void;
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

const tileSelector = `.${dashboardGridHooks.slotClass('tile')}`;

/** Whether a target sits in a tile, its own or a nested grid's. */
function isInTile(target: EventTarget): boolean {
  return isElement(target) && target.closest(tileSelector) !== null;
}

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

/**
 * The layout shown (reflowed onto fewer columns, else the preview, else the committed layout) and
 * the tiles' reading order: that of the settled layout shown, so the document and keyboard order
 * follow a reflow, while a pointer preview never reorders the tiles mid-drag.
 */
function useShownLayout(
  committed: DashboardGridItem[],
  preview: DashboardGridItem[] | undefined,
  { columns, shownColumns }: { columns: number; shownColumns: number },
) {
  const reflowed = useMemo(
    () =>
      shownColumns < columns
        ? reflowDashboardLayout(committed, { from: columns, to: shownColumns })
        : null,
    [committed, columns, shownColumns],
  );
  const order = useMemo(
    () => [...(reflowed ?? committed)].sort((a, b) => a.y - b.y || a.x - b.x),
    [reflowed, committed],
  );
  return { shown: reflowed ?? preview ?? committed, order };
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
 * What the tiles share (the same object while the grid's options are) with the tile menu and
 * Remove, and the grid root's ref and empty space menu.
 */
function useGridShared(
  options: Parameters<typeof useGridMenus>[0],
  grid: {
    element: HTMLDivElement | null;
    setElement: (element: HTMLDivElement | null) => void;
    ref: DashboardGridProps['ref'];
    committed: Parameters<typeof useGridMenus>[1]['committed'];
    handlers: Omit<DashboardGridShared, 'columns' | 'isEditing' | 'announce' | 'menu' | 'remove'>;
    columns: number;
    shownColumns: number;
    editable: boolean;
    setMessage: (message: string) => void;
  },
) {
  const { handlers, columns, editable, setMessage, ref, setElement } = grid;
  const menus = useGridMenus(options, {
    element: grid.element,
    committed: grid.committed,
    columns: grid.shownColumns,
    measureStep: handlers.measureStep,
    isInTile,
  });
  const { menu, remove } = menus;
  const shared = useMemo(
    () => ({ ...handlers, columns, isEditing: editable, announce: setMessage, menu, remove }),
    [handlers, columns, editable, setMessage, menu, remove],
  );
  const { ref: spaceRef, ...spaceProps } = menus.targetProps;
  const rootRef = useMemo(
    () => mergeRefs<HTMLDivElement>(ref, setElement, spaceRef),
    [ref, setElement, spaceRef],
  );
  return { shared, rootRef, spaceProps, spaceMenu: menus.spaceMenu };
}

/** The tiles in reading order, each placed where the shown layout puts it. */
function DashboardGridCells({
  order,
  shown,
  moving,
  ...cell
}: Pick<DashboardGridCellProps, 'shared' | 'render'> & {
  order: readonly DashboardGridItem[];
  shown: readonly DashboardGridItem[];
  moving: { id: Key; kind: TileMoveKind } | null | undefined;
}) {
  const positions = new Map(shown.map((item) => [item.id, item]));
  return order.map((entry) => {
    const item = positions.get(entry.id) ?? entry;
    return (
      <DashboardGridCell
        {...cell}
        key={toKeyIdentity(item.id)}
        item={item}
        moving={moving?.id === item.id ? moving.kind : null}
      />
    );
  });
}

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
  tileMenu,
  onTileAction,
  spaceMenu: spaceEntries,
  onSpaceAction,
  children,
  className,
  ref,
  ...rest
}: DashboardGridProps) {
  const columns = toColumnCount(columnsProp);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
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
  const { shown, order } = useShownLayout(committed.layout, previewLayout, {
    columns,
    shownColumns,
  });
  const rows = findMaximum(shown, (item) => item.y + item.h, 1);
  const { shared, rootRef, spaceProps, spaceMenu } = useGridShared(
    { tileMenu, onTileAction, spaceMenu: spaceEntries, onSpaceAction },
    { element, setElement, ref, committed, handlers, columns, shownColumns, editable, setMessage },
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
      {...spaceProps}
      ref={rootRef}
      role="group"
      style={style}
    >
      <DashboardGridCells
        order={order}
        shown={shown}
        shared={shared}
        moving={moving}
        render={children}
      />
      {spaceMenu}
      <VisuallyHidden>
        <div {...dashboardGridHooks.slot('status')} role="status">
          {message}
        </div>
      </VisuallyHidden>
    </div>
  );
}
