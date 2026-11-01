import { clamp } from '../../utils/clamp.js';

/** A column width: pixels, a percentage, a share (`fr`), or its rendered content. */
export type TableColumnSize = number | `${number}%` | `${number}fr` | 'content';

/** Column widths keyed by column id. */
export type TableColumnWidths = Readonly<Record<string, Exclude<TableColumnSize, 'content'>>>;

/** What a column declares about its width. */
export interface TableColumnSizing {
  /** The column's id, unique in the table. */
  id: string;
  /** Initial width, or `content` to fit the rendered header and cells. Defaults to `1fr`. */
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
export function isColumnSize(value: unknown): value is Exclude<TableColumnSize, 'content'> {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return typeof value === 'string' && relativeSize.test(value) && Number.parseFloat(value) > 0;
}

/** The column's bounds, with a maximum never below the minimum. */
export function getColumnBounds(column: TableColumnSizing): TableColumnBounds {
  const { maxWidth } = column;
  const minWidth = column.minWidth ?? (column.width === 'content' ? 75 : undefined);
  if (minWidth === undefined || maxWidth === undefined) return { minWidth, maxWidth };
  return { minWidth, maxWidth: Math.max(minWidth, maxWidth) };
}

/** Keeps a pixel width inside the column's bounds; percentages and shares pass unchanged. */
export function clampColumnWidth(
  width: Exclude<TableColumnSize, 'content'>,
  column: TableColumnSizing,
): Exclude<TableColumnSize, 'content'> {
  if (typeof width !== 'number') return width;
  const { minWidth = 0, maxWidth = Number.POSITIVE_INFINITY } = getColumnBounds(column);
  return clamp(width, minWidth, maxWidth);
}

/** The width a column renders at: a usable stored width, else its declared width, else `1fr`. */
export function resolveColumnWidth(
  column: TableColumnSizing,
  stored?: unknown,
  contentWidth?: number,
): Exclude<TableColumnSize, 'content'> {
  const width = isColumnSize(stored) ? stored : (column.width ?? defaultWidth);
  return clampColumnWidth(width === 'content' ? (contentWidth ?? 75) : width, column);
}

/** The sizing mode of the declared width, or a usable resize that overrides it. */
export function getColumnSizing(
  column: TableColumnSizing,
  stored?: unknown,
): 'content' | 'flex' | 'fixed' {
  const width = isColumnSize(stored) ? stored : (column.width ?? defaultWidth);
  if (width === 'content') return 'content';
  return typeof width === 'string' && width.endsWith('fr') ? 'flex' : 'fixed';
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
  // No prototype: a column id such as `__proto__` is a key like any other.
  const widths = Object.create(null) as Record<string, Exclude<TableColumnSize, 'content'>>;
  for (const [key, value] of listEntries(source)) {
    const column = byId.get(String(key));
    if (column && isColumnSize(value)) widths[column.id] = clampColumnWidth(value, column);
  }
  return widths;
}
