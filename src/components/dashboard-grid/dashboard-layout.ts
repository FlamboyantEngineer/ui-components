// Tile layouts on a column grid: normalising, placing with push-down, and reflowing to fewer
// columns (specs/DASHBOARD-GRID.md).

import type { PersistCodec } from '../../core/provider.js';
import type { Key } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';
import { isKey } from '../../utils/is-key.js';
import { createListCodec } from '../../utils/json-codec.js';

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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Whether stored data is a layout item: a key `id` and finite `x`, `y`, `w` and `h`. */
function isDashboardGridItem(value: unknown): value is DashboardGridItem {
  if (typeof value !== 'object' || value === null) return false;
  const { id, x, y, w, h } = value as Partial<Record<keyof DashboardGridItem, unknown>>;
  return isKey(id) && [x, y, w, h].every(isFiniteNumber);
}

/** A stored layout; one entry that is not a layout item refuses the whole layout. */
export const dashboardLayoutCodec: PersistCodec<DashboardGridItem[]> =
  createListCodec(isDashboardGridItem);

function toWhole(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

/** An item made whole and kept inside `columns`: at least one cell, never past either edge. */
function fitItem(item: DashboardGridItem, columns: number): DashboardGridItem {
  const w = clamp(toWhole(item.w, 1), 1, columns);
  const h = Math.max(toWhole(item.h, 1), 1);
  const x = clamp(toWhole(item.x, 0), 0, columns - w);
  const y = Math.max(toWhole(item.y, 0), 0);
  return { ...item, x, y, w, h };
}

function overlaps(a: DashboardGridItem, b: DashboardGridItem): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function byPosition(a: DashboardGridItem, b: DashboardGridItem): number {
  return a.y - b.y || a.x - b.x;
}

/**
 * Settles items in order: each stays where it is unless it overlaps one settled before it, and then
 * moves down just below that one, again until it overlaps none.
 */
function settle(ordered: readonly DashboardGridItem[]): Map<Key, DashboardGridItem> {
  const settled = new Map<Key, DashboardGridItem>();
  for (const item of ordered) {
    let placed = item;
    for (let blocker = findBlocker(settled, placed); blocker; ) {
      placed = { ...placed, y: blocker.y + blocker.h };
      blocker = findBlocker(settled, placed);
    }
    settled.set(placed.id, placed);
  }
  return settled;
}

function findBlocker(settled: ReadonlyMap<Key, DashboardGridItem>, item: DashboardGridItem) {
  for (const other of settled.values()) if (overlaps(other, item)) return other;
  return undefined;
}

/** The items in their given order, positioned as `settled` says. */
function inOrder(
  items: readonly DashboardGridItem[],
  settled: ReadonlyMap<Key, DashboardGridItem>,
) {
  return items.map((item) => settled.get(item.id) ?? item);
}

/** The column count made whole and at least 1. */
export function toColumnCount(columns: number): number {
  return Math.max(1, toWhole(columns, 1));
}

/**
 * A layout every tile of which fits `columns` with whole coordinates, and in which no two tiles
 * overlap: where tiles overlap, the lower one (or the later in reading order) moves down. The
 * first item with a repeated id wins; the order of the items is kept.
 */
export function normalizeDashboardLayout(
  layout: readonly DashboardGridItem[],
  columns: number,
): DashboardGridItem[] {
  const count = toColumnCount(columns);
  const unique = new Map<Key, DashboardGridItem>();
  for (const item of layout) if (!unique.has(item.id)) unique.set(item.id, item);
  const items = [...unique.values()].map((item) => fitItem(item, count));
  return inOrder(items, settle([...items].sort(byPosition)));
}

/**
 * The layout with one tile moved or resized to `next`, kept inside `columns`; tiles it now
 * overlaps move down out of its way, pushing the tiles below them in turn. The order of the
 * items is kept.
 */
export function placeDashboardItem(
  layout: readonly DashboardGridItem[],
  next: DashboardGridItem,
  columns: number,
): DashboardGridItem[] {
  const placed = fitItem(next, toColumnCount(columns));
  const others = layout.filter((item) => item.id !== next.id).sort(byPosition);
  const settled = settle([placed, ...others]);
  return inOrder(layout, settled);
}

/**
 * The layout for a narrower grid of `to` columns instead of `from`: each tile's column and span
 * scale in proportion (spanning at least one column), and tiles then settle in reading order.
 */
export function reflowDashboardLayout(
  layout: readonly DashboardGridItem[],
  { from, to }: { from: number; to: number },
): DashboardGridItem[] {
  const count = toColumnCount(to);
  const ratio = count / toColumnCount(from);
  const scaled = layout.map((item) =>
    fitItem(
      { ...item, x: Math.round(item.x * ratio), w: Math.max(1, Math.round(item.w * ratio)) },
      count,
    ),
  );
  return inOrder(scaled, settle([...scaled].sort(byPosition)));
}
