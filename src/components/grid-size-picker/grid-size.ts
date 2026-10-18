// The pure model of a grid size picker: where a key moves the previewed size, and how far the grid
// grows to show it.

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

function limit(value: number, max: number): number {
  return Math.max(1, Math.min(max, value));
}

/**
 * The size a navigation key moves `size` to inside `max`, or `null` for any other key. Left and
 * right follow the reading `direction`; Home and End reach the row's ends, and with Ctrl or Cmd the
 * grid's corners.
 */
export function moveGridSize(
  size: GridSize,
  { key, isRtl, isCorner, max }: { key: string; isRtl: boolean; isCorner: boolean; max: GridSize },
): GridSize | null {
  const forward = isRtl ? -1 : 1;
  const steps: Readonly<Record<string, GridSize>> = {
    ArrowUp: { rows: size.rows - 1, columns: size.columns },
    ArrowDown: { rows: size.rows + 1, columns: size.columns },
    ArrowLeft: { rows: size.rows, columns: size.columns - forward },
    ArrowRight: { rows: size.rows, columns: size.columns + forward },
    Home: { rows: isCorner ? 1 : size.rows, columns: 1 },
    End: { rows: isCorner ? max.rows : size.rows, columns: max.columns },
  };
  const next = steps[key];
  return next
    ? { rows: limit(next.rows, max.rows), columns: limit(next.columns, max.columns) }
    : null;
}

/** The rows and columns shown: one past `size` each way, at least `min` and at most `max`. */
export function getShownGridSize(size: GridSize, { min, max }: GridSizeBounds): GridSize {
  return {
    rows: Math.min(max.rows, Math.max(min.rows, size.rows + 1)),
    columns: Math.min(max.columns, Math.max(min.columns, size.columns + 1)),
  };
}
