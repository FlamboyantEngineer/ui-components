/** A column width: pixels, a percentage of the table, or a share (`fr`) of the width left over. */
export type TableColumnSize = number | `${number}%` | `${number}fr`;
/** Column widths keyed by column id. */
export type TableColumnWidths = Readonly<Record<string, TableColumnSize>>;
/** What a column declares about its width. */
export interface TableColumnSizing {
    /** The column's id, unique in the table. */
    id: string;
    /** Initial width. Defaults to `1fr`: columns without one share the width the others leave. */
    width?: TableColumnSize | undefined;
    /** Narrowest width in pixels. Without it React Aria's default minimum (75px) applies. */
    minWidth?: number | undefined;
    /** Widest width in pixels. */
    maxWidth?: number | undefined;
}
/** A column's pixel bounds. */
export interface TableColumnBounds {
    /** Narrowest width in pixels. */
    minWidth?: number | undefined;
    /** Widest width in pixels, never below `minWidth`. */
    maxWidth?: number | undefined;
}
/** Whether `value` is a usable width: a positive pixel count, percentage or share. */
export declare function isColumnSize(value: unknown): value is TableColumnSize;
/** The column's bounds, with a maximum never below the minimum. */
export declare function getColumnBounds(column: TableColumnSizing): TableColumnBounds;
/** Keeps a pixel width inside the column's bounds; percentages and shares pass unchanged. */
export declare function clampColumnWidth(width: TableColumnSize, column: TableColumnSizing): TableColumnSize;
/** The width a column renders at: a usable stored width, else its declared width, else `1fr`. */
export declare function resolveColumnWidth(column: TableColumnSizing, stored?: unknown): TableColumnSize;
/**
 * The usable widths of the given columns in `source`, a map (as React Aria reports resizes) or a
 * plain object (as storage returns them), clamped to each column's bounds. Unknown columns and
 * unusable values are dropped.
 */
export declare function pickColumnWidths(source: unknown, columns: readonly TableColumnSizing[]): TableColumnWidths;
//# sourceMappingURL=column-sizing.d.ts.map