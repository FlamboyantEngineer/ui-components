import type { ReactNode } from 'react';
import { requireDefined } from '../../utils/require-defined.js';
import type { TableColumn, TableColumnPin } from './table-rows.js';

/** What the reader changes about the columns: their order and which ones are hidden. */
export interface TableColumnLayout {
  /** Column ids in display order; columns it does not list follow in their declared order. */
  order?: readonly string[] | undefined;
  /** The ids of the hidden columns. */
  hidden?: readonly string[] | undefined;
}

/** A header above several columns. */
export interface TableColumnGroup {
  /** The group's id, unique among the groups. */
  id: string;
  /** The group header's content, which names it. */
  header: ReactNode;
  /** The ids of the columns under the header. */
  columns: readonly string[];
}

/** A column move: the column `id` lands before or after the column `targetId`. */
export interface TableColumnMove {
  id: string;
  targetId: string;
  position: 'before' | 'after';
}

/** One cell of the group header row: a group over a run of columns, or a gap over ungrouped ones. */
interface TableGroupCell {
  key: string;
  group: TableColumnGroup | null;
  span: number;
}

type PinnedColumn = Pick<TableColumn<unknown>, 'id' | 'pin'>;

const pinRanks: Readonly<Record<TableColumnPin | 'none', number>> = { start: 0, none: 1, end: 2 };

function pinRank(column: PinnedColumn): number {
  return pinRanks[column.pin ?? 'none'];
}

function readIds(source: unknown, known: ReadonlySet<string>): string[] | undefined {
  if (!Array.isArray(source)) return undefined;
  const ids = source.filter((id): id is string => typeof id === 'string' && known.has(id));
  return [...new Set(ids)];
}

/** The columns in `order`: the listed ones first, then the others in their declared order. */
export function orderColumns<C extends PinnedColumn>(
  columns: readonly C[],
  order: readonly string[] | undefined,
): C[] {
  if (!order || order.length === 0) return [...columns];
  const rank = new Map(order.map((id, index) => [id, index]));
  return columns
    .map((column, index) => ({ column, index: rank.get(column.id) ?? order.length + index }))
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.column);
}

/**
 * The columns a table draws, in display order: the layout's order, without its hidden columns, with
 * the columns pinned to the start first and those pinned to the end last.
 */
export function arrangeColumns<C extends PinnedColumn>(
  columns: readonly C[],
  layout: TableColumnLayout,
): C[] {
  const hidden = new Set(layout.hidden ?? []);
  return orderColumns(columns, layout.order)
    .filter((column) => !hidden.has(column.id))
    .sort((left, right) => pinRank(left) - pinRank(right));
}

/** The full column order after a move, or null when the columns are pinned to different edges. */
export function applyColumnMove(
  columns: readonly PinnedColumn[],
  layout: TableColumnLayout,
  move: TableColumnMove,
): string[] | null {
  const ordered = orderColumns(columns, layout.order);
  const moving = ordered.find((column) => column.id === move.id);
  const target = ordered.find((column) => column.id === move.targetId);
  if (!moving || !target || moving === target || pinRank(moving) !== pinRank(target)) return null;
  const rest = ordered.filter((column) => column !== moving).map((column) => column.id);
  const at = rest.indexOf(target.id) + (move.position === 'after' ? 1 : 0);
  return [...rest.slice(0, at), moving.id, ...rest.slice(at)];
}

/**
 * The move of `id` one step towards the end (`1`) or the start (`-1`) among the drawn columns, or
 * null at the edge of its pinned group.
 */
export function stepColumnMove(
  columns: readonly PinnedColumn[],
  id: string,
  step: -1 | 1,
): TableColumnMove | null {
  const index = columns.findIndex((column) => column.id === id);
  const target = index === -1 ? undefined : columns[index + step];
  if (!target || pinRank(target) !== pinRank(requireDefined(columns[index]))) return null;
  return { id, targetId: target.id, position: step === 1 ? 'after' : 'before' };
}

/** The usable part of a stored layout: arrays of known column ids, each listed once. */
export function readColumnLayout(
  source: unknown,
  columns: readonly PinnedColumn[],
): TableColumnLayout {
  if (typeof source !== 'object' || source === null) return {};
  const known = new Set(columns.map((column) => column.id));
  const { order, hidden } = source as Record<string, unknown>;
  return { order: readIds(order, known), hidden: readIds(hidden, known) };
}

/**
 * The cells of the group header row over the drawn columns: one per run of neighbouring columns of
 * the same group, and gaps over ungrouped columns and the `leading` and `trailing` fixed columns.
 */
export function groupColumnCells(
  columns: readonly PinnedColumn[],
  groups: readonly TableColumnGroup[],
  edges: { leading: number; trailing: number },
): TableGroupCell[] {
  const groupOf = new Map(
    groups.flatMap((group) => group.columns.map((id) => [id, group] as const)),
  );
  const entries = [
    ...Array.from({ length: edges.leading }, () => null),
    ...columns.map((column) => groupOf.get(column.id) ?? null),
    ...Array.from({ length: edges.trailing }, () => null),
  ];
  const cells: TableGroupCell[] = [];
  for (const group of entries) {
    const last = cells.at(-1);
    if (last && last.group === group) last.span += 1;
    else cells.push({ key: `${group?.id ?? 'ui-table-gap'}:${cells.length}`, group, span: 1 });
  }
  return cells;
}

/** The accessible name of a column. */
export function getColumnText<T>(column: TableColumn<T>): string {
  if (column.textValue) return column.textValue;
  const { header } = column;
  return typeof header === 'string' || typeof header === 'number' ? String(header) : column.id;
}
