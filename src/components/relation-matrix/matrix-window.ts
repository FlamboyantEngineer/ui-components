// The geometry of a windowed matrix: which rows and columns are in view, and the column tracks
// that place the rendered ones.

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

function clampIndex(value: number, count: number): number {
  return Math.min(Math.max(value, 0), count);
}

/** The items of one axis in view of a viewport scrolled by `offset`, with `overscan` more on each side. */
export function resolveMatrixSpan({
  offset,
  extent,
  size,
  count,
  overscan,
}: MatrixSpanOptions): MatrixSpan {
  if (size <= 0) return { start: 0, end: count };
  const start = clampIndex(Math.floor(offset / size) - overscan, count);
  const end = clampIndex(Math.ceil((offset + extent) / size) + overscan, count);
  return { start, end: Math.max(start, end) };
}

/** The indices of `span`, plus `extra` (the focused index) when it lies outside, ascending. */
export function listMatrixIndices(span: MatrixSpan, extra: number): number[] {
  const indices: number[] = [];
  if (extra >= 0 && extra < span.start) indices.push(extra);
  for (let index = span.start; index < span.end; index += 1) indices.push(index);
  if (extra >= span.end) indices.push(extra);
  return indices;
}

/**
 * The grid template of a row holding the row header and the rendered columns: an `auto` track for
 * the row header, a fixed track per rendered column and one track per gap standing in for the
 * columns left out, so every rendered column sits where it would in the whole matrix.
 */
export function resolveMatrixColumnTracks({
  indices,
  count,
  width,
}: MatrixColumnTracksOptions): MatrixColumnTracks {
  const tracks = ['auto'];
  const lines = new Map<number, number>();
  let next = 0;
  for (const index of indices) {
    if (index > next) tracks.push(`${(index - next) * width}px`);
    tracks.push(`${width}px`);
    lines.set(index, tracks.length);
    next = index + 1;
  }
  if (next < count) tracks.push(`${(count - next) * width}px`);
  return { template: tracks.join(' '), lines };
}
