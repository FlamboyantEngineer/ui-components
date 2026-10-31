'use client';

import { findMaximum } from '../../utils/find-maximum.js';
import {
  createContext,
  useContext,
  useMemo,
  useRef,
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
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  dashboardLayoutCodec,
  normalizeDashboardLayout,
  placeDashboardItem,
  reflowDashboardLayout,
  toColumnCount,
  type DashboardGridItem,
} from './dashboard-layout.js';
import type { CellStep, TileMoveKind } from './use-tile-move.js';
import { getOwnerWindow } from '../../utils/owner-window.js';

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

/** What a tile reads from its grid. */
export interface DashboardGridTileState {
  item: DashboardGridItem;
  columns: number;
  isEditing: boolean;
  /** The tile being moved or resized, and how. */
  moving: { id: Key; kind: TileMoveKind } | null;
  /** The handle to focus again after a keyboard move, once the tiles have rendered. */
  refocus: RefObject<{ id: Key; kind: TileMoveKind } | null>;
  measureStep: () => CellStep;
  /** Shows where a gesture that started from `origin` would put the tile. */
  preview: (gesture: TileGesture) => void;
  /** Keeps the previewed layout and returns the moved tile, if a preview changed the layout. */
  commit: (isKeyboard: boolean) => DashboardGridItem | undefined;
  announce: (message: string) => void;
}

/** A move or resize in progress: the tile as it started, where it is asked to go, and how. */
export interface TileGesture {
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

function readGap(element: Element, property: 'columnGap' | 'rowGap'): number {
  const value = Number.parseFloat(getOwnerWindow(element).getComputedStyle(element)[property]);
  return Number.isFinite(value) ? value : 0;
}

function isSameCells(a: DashboardGridItem, b: DashboardGridItem): boolean {
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
  const layout = normalizeDashboardLayout(props.layout ?? own, columns);
  const commit = (next: DashboardGridItem[]) => {
    if (props.layout === undefined) setOwn(next);
    props.onLayoutChange?.(next);
  };
  return { layout, commit };
}

/** How many columns fit: the layout's own, or fewer below `minColumnWidth` per column. */
function useShownColumns(element: Element | null, columns: number, minColumnWidth?: number) {
  const width = useElementSize(element, { enabled: minColumnWidth !== undefined })?.width ?? 0;
  if (minColumnWidth === undefined || !(minColumnWidth > 0) || width <= 0) return columns;
  return Math.min(columns, Math.max(1, Math.floor(width / minColumnWidth)));
}

/** The preview of a tile being moved and the handlers its handles call. */
function useTileMoves({
  element,
  committed,
  columns,
  rowHeight,
  isEditing,
}: {
  element: HTMLDivElement | null;
  committed: ReturnType<typeof useDashboardLayout>;
  columns: number;
  rowHeight: number;
  isEditing: boolean;
}) {
  const [gesture, setGesture] = useState<TileGesture | null>(null);
  const latest = useRef<TileGesture | null>(null);
  const refocus = useRef<{ id: Key; kind: TileMoveKind } | null>(null);
  const shown = gesture && resolveGesture(gesture, committed.layout, columns);
  if (gesture && (!isEditing || !shown)) {
    latest.current = null;
    setGesture(null);
  }
  return {
    previewLayout: shown?.layout,
    refocus,
    moving: gesture && shown ? { id: gesture.origin.id, kind: gesture.kind } : null,
    measureStep: (): CellStep => {
      if (!element) return { column: 1, row: 1 };
      const width = element.getBoundingClientRect().width;
      const column = (width + readGap(element, 'columnGap')) / columns;
      const row = rowHeight + readGap(element, 'rowGap');
      return { column: Math.max(1, column), row: Math.max(1, row) };
    },
    preview: (next: TileGesture) => {
      latest.current = next;
      setGesture(next);
    },
    commit: (isKeyboard: boolean) => {
      const last = latest.current;
      latest.current = null;
      setGesture(null);
      const result = last && resolveGesture(last, committed.layout, columns);
      if (!last || !result || isSameLayout(result.layout, committed.layout)) return undefined;
      if (isKeyboard) refocus.current = { id: result.item.id, kind: last.kind };
      committed.commit(result.layout);
      return result.item;
    },
  };
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
  const { previewLayout, ...moves } = useTileMoves({
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
  const order = [...committed.layout].sort((a, b) => a.y - b.y || a.x - b.x);
  const positions = new Map(shown.map((item) => [item.id, item]));
  const rows = findMaximum(shown, (item) => item.y + item.h, 1);
  const state = { ...moves, columns, isEditing: editable, announce: setMessage };
  const style = {
    gridTemplateColumns: `repeat(${shownColumns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, ${rowHeight}px)`,
  } satisfies CSSProperties;
  return (
    <div
      {...rest}
      {...dashboardGridHooks.root({
        className,
        data: { editing: state.isEditing, reflowed: isReflowed },
      })}
      ref={rootRef}
      role="group"
      style={style}
    >
      {order.map((entry) => {
        const item = positions.get(entry.id) ?? entry;
        return (
          <DashboardGridContext key={toKeyIdentity(item.id)} value={{ ...state, item }}>
            {children(item)}
          </DashboardGridContext>
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
