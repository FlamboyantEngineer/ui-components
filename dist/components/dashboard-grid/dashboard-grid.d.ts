import { type ReactNode, type Ref, type RefObject } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { type DashboardGridItem } from './dashboard-layout.js';
import type { CellStep, TileMoveKind } from './use-tile-move.js';
export type { DashboardGridItem } from './dashboard-layout.js';
export interface DashboardGridProps extends BaseProps, AriaLabellingProps {
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
    /** The root element. */
    ref?: Ref<HTMLDivElement> | undefined;
}
/** What a tile reads from its grid. */
export interface DashboardGridTileState {
    item: DashboardGridItem;
    columns: number;
    isEditing: boolean;
    /** The tile being moved or resized, and how. */
    moving: {
        id: Key;
        kind: TileMoveKind;
    } | null;
    /** The handle to focus again after a keyboard move, once the tiles have rendered. */
    refocus: RefObject<{
        id: Key;
        kind: TileMoveKind;
    } | null>;
    measureStep: () => CellStep;
    preview: (next: DashboardGridItem, kind: TileMoveKind) => void;
    /** Keeps the previewed layout and returns the moved tile, if a preview changed the layout. */
    commit: (isKeyboard: boolean) => DashboardGridItem | undefined;
    announce: (message: string) => void;
}
export declare const dashboardGridHooks: import("../../core/hooks.js").ComponentHooks<"move" | "resize" | "status" | "tile" | "tile-content">;
export declare const DashboardGridContext: import("react").Context<DashboardGridTileState | null>;
/** The grid a `DashboardTile` sits in; `null` outside one. */
export declare function useDashboardGridTile(): DashboardGridTileState | null;
/**
 * A grid of tiles on whole columns and rows, each placed by plain `{ id, x, y, w, h }` data. In
 * edit mode every tile shows a move handle and a resize handle that work by pointer drag and by
 * the arrow keys; a tile moved or grown onto others pushes them down. Below `minColumnWidth` per
 * column the grid reflows its tiles onto fewer columns, read only.
 */
export declare function DashboardGrid({ layout, defaultLayout, onLayoutChange, persistKey, columns: columnsProp, minColumnWidth, rowHeight, isEditing, children, className, ref, ...rest }: DashboardGridProps): import("react").JSX.Element;
//# sourceMappingURL=dashboard-grid.d.ts.map