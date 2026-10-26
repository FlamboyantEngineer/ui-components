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
interface TableColumnBounds {
  /** Narrowest width in pixels. */
  minWidth?: number | undefined;
  /** Widest width in pixels, never below `minWidth`. */
  maxWidth?: number | undefined;
}

const relativeSize = /^\d+(?:\.\d+)?(?:%|fr)$/;
const defaultWidth: TableColumnSize = '1fr';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function listEntries(source: unknown): Iterable<[unknown, unknown]> {
  if (source instanceof Map) return source.entries();
  return isRecord(source) ? Object.entries(source) : [];
}

/** Whether `value` is a usable width: a positive pixel count, percentage or share. */
export function isColumnSize(value: unknown): value is TableColumnSize {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return typeof value === 'string' && relativeSize.test(value) && Number.parseFloat(value) > 0;
}

/** The column's bounds, with a maximum never below the minimum. */
export function getColumnBounds(column: TableColumnSizing): TableColumnBounds {
  const { minWidth, maxWidth } = column;
  if (minWidth === undefined || maxWidth === undefined) return { minWidth, maxWidth };
  return { minWidth, maxWidth: Math.max(minWidth, maxWidth) };
}

/** Keeps a pixel width inside the column's bounds; percentages and shares pass unchanged. */
export function clampColumnWidth(
  width: TableColumnSize,
  column: TableColumnSizing,
): TableColumnSize {
  if (typeof width !== 'number') return width;
  const { minWidth = 0, maxWidth = Number.POSITIVE_INFINITY } = getColumnBounds(column);
  return Math.min(Math.max(width, minWidth), maxWidth);
}

/** The width a column renders at: a usable stored width, else its declared width, else `1fr`. */
export function resolveColumnWidth(column: TableColumnSizing, stored?: unknown): TableColumnSize {
  const width = isColumnSize(stored) ? stored : (column.width ?? defaultWidth);
  return clampColumnWidth(width, column);
}

/**
 * The usable widths of the given columns in `source`, a map (as React Aria reports resizes) or a
 * plain object (as storage returns them), clamped to each column's bounds. Unknown columns and
 * unusable values are dropped.
 */
export function pickColumnWidths(
  source: unknown,
  columns: readonly TableColumnSizing[],
): TableColumnWidths {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const widths: Record<string, TableColumnSize> = {};
  for (const [key, value] of listEntries(source)) {
    const column = byId.get(String(key));
    if (column && isColumnSize(value)) widths[column.id] = clampColumnWidth(value, column);
  }
  return widths;
}
