/** A run of indices, `start` included and `end` excluded. */
export interface MatrixSpan {
    start: number;
    end: number;
}
export interface MatrixSpanOptions {
    /** How far the items are scrolled under the pinned headers, in pixels. */
    offset: number;
    /** The length of the axis in view, in pixels. */
    extent: number;
    /** The fixed length of one item along the axis, in pixels. */
    size: number;
    /** The number of items on the axis. */
    count: number;
    /** Items rendered beyond each end of the view. */
    overscan: number;
}
/** The column tracks of a row: a CSS grid template and the grid line each rendered column starts on. */
export interface MatrixColumnTracks {
    template: string;
    lines: ReadonlyMap<number, number>;
}
export interface MatrixColumnTracksOptions {
    /** The rendered column indices, ascending. */
    indices: readonly number[];
    /** The number of columns. */
    count: number;
    /** The width of every column, in pixels. */
    width: number;
}
/** The items of one axis in view of a viewport scrolled by `offset`, with `overscan` more on each side. */
export declare function resolveMatrixSpan({ offset, extent, size, count, overscan, }: MatrixSpanOptions): MatrixSpan;
/** The indices of `span`, plus `extra` (the focused index) when it lies outside, ascending. */
export declare function listMatrixIndices(span: MatrixSpan, extra: number): number[];
/**
 * The grid template of a row holding the row header and the rendered columns: an `auto` track for
 * the row header, a fixed track per rendered column and one track per gap standing in for the
 * columns left out, so every rendered column sits where it would in the whole matrix.
 */
export declare function resolveMatrixColumnTracks({ indices, count, width, }: MatrixColumnTracksOptions): MatrixColumnTracks;
//# sourceMappingURL=matrix-window.d.ts.map