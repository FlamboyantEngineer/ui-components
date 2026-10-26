/** A number of rows and columns, from 1. */
export interface GridSize {
    rows: number;
    columns: number;
}
/** The bounds a grid size picker keeps to. */
export interface GridSizeBounds {
    /** The rows and columns shown before the grid grows. */
    min: GridSize;
    /** The most rows and columns the grid grows to. */
    max: GridSize;
}
/**
 * The size a navigation key moves `size` to inside `max`, or `null` for any other key. Left and
 * right follow the reading `direction`; Home and End reach the row's ends, and with Ctrl or Cmd the
 * grid's corners.
 */
export declare function moveGridSize(size: GridSize, { key, isRtl, isCorner, max }: {
    key: string;
    isRtl: boolean;
    isCorner: boolean;
    max: GridSize;
}): GridSize | null;
/** The rows and columns shown: one past `size` each way, at least `min` and at most `max`. */
export declare function getShownGridSize(size: GridSize, { min, max }: GridSizeBounds): GridSize;
//# sourceMappingURL=grid-size.d.ts.map