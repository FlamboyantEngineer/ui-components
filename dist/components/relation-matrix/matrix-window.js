// The geometry of a windowed matrix: which rows and columns are in view, and the column tracks
// that place the rendered ones.
function clampIndex(value, count) {
    return Math.min(Math.max(value, 0), count);
}
/** The items of one axis in view of a viewport scrolled by `offset`, with `overscan` more on each side. */
export function resolveMatrixSpan({ offset, extent, size, count, overscan, }) {
    if (size <= 0)
        return { start: 0, end: count };
    const start = clampIndex(Math.floor(offset / size) - overscan, count);
    const end = clampIndex(Math.ceil((offset + extent) / size) + overscan, count);
    return { start, end: Math.max(start, end) };
}
/** The indices of `span`, plus `extra` (the focused index) when it lies outside, ascending. */
export function listMatrixIndices(span, extra) {
    const indices = [];
    if (extra >= 0 && extra < span.start)
        indices.push(extra);
    for (let index = span.start; index < span.end; index += 1)
        indices.push(index);
    if (extra >= span.end)
        indices.push(extra);
    return indices;
}
/**
 * The grid template of a row holding the row header and the rendered columns: an `auto` track for
 * the row header, a fixed track per rendered column and one track per gap standing in for the
 * columns left out, so every rendered column sits where it would in the whole matrix.
 */
export function resolveMatrixColumnTracks({ indices, count, width, }) {
    const tracks = ['auto'];
    const lines = new Map();
    let next = 0;
    for (const index of indices) {
        if (index > next)
            tracks.push(`${(index - next) * width}px`);
        tracks.push(`${width}px`);
        lines.set(index, tracks.length);
        next = index + 1;
    }
    if (next < count)
        tracks.push(`${(count - next) * width}px`);
    return { template: tracks.join(' '), lines };
}
//# sourceMappingURL=matrix-window.js.map