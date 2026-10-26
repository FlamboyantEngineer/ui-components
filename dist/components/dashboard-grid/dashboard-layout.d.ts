import type { Key } from '../../core/props.js';
/** Where a tile sits on the grid, in whole columns and rows counted from 0. */
export interface DashboardGridItem {
    /** Identifies the tile. */
    id: Key;
    /** The first column it covers. */
    x: number;
    /** The first row it covers. */
    y: number;
    /** How many columns it spans. */
    w: number;
    /** How many rows it spans. */
    h: number;
}
/** The column count made whole and at least 1. */
export declare function toColumnCount(columns: number): number;
/**
 * A layout every tile of which fits `columns` with whole coordinates, and in which no two tiles
 * overlap: where tiles overlap, the lower one (or the later in reading order) moves down. The
 * first item with a repeated id wins; the order of the items is kept.
 */
export declare function normalizeDashboardLayout(layout: readonly DashboardGridItem[], columns: number): DashboardGridItem[];
/**
 * The layout with one tile moved or resized to `next`, kept inside `columns`; tiles it now
 * overlaps move down out of its way, pushing the tiles below them in turn. The order of the
 * items is kept.
 */
export declare function placeDashboardItem(layout: readonly DashboardGridItem[], next: DashboardGridItem, columns: number): DashboardGridItem[];
/**
 * The layout for a narrower grid of `to` columns instead of `from`: each tile's column and span
 * scale in proportion (spanning at least one column), and tiles then settle in reading order.
 */
export declare function reflowDashboardLayout(layout: readonly DashboardGridItem[], { from, to }: {
    from: number;
    to: number;
}): DashboardGridItem[];
//# sourceMappingURL=dashboard-layout.d.ts.map