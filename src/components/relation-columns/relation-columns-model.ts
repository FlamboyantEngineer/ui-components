import type { Key } from '../../core/props.js';

/** Which way a relation walk goes from an item. */
export type RelationDirection = 'upstream' | 'downstream';

/** The items chosen on each side of the start item, nearest first. */
export interface RelationColumnsPath {
  upstream: readonly Key[];
  downstream: readonly Key[];
}

/** One column of a relation walk: the items related to `source`, and the one chosen among them. */
export interface RelationColumn<T> {
  /** `item` for the column of the start item. */
  direction: RelationDirection | 'item';
  /** 1 for the columns beside the start item, 2 for the next ones, 0 for the start item's. */
  depth: number;
  /** The item whose related items the column lists (the start item itself in its own column). */
  source: T;
  items: readonly T[];
  /** The chosen item's key, or null. */
  selectedKey: Key | null;
}

interface RelationColumnsOptions<T extends { id: Key }> {
  item: T;
  path: RelationColumnsPath;
  getRelated: (item: T, direction: RelationDirection) => readonly T[];
}

export const emptyRelationPath: RelationColumnsPath = { upstream: [], downstream: [] };

/** The columns of one side, nearest first: one per chosen item, plus the one after the last. */
function resolveSide<T extends { id: Key }>(
  options: RelationColumnsOptions<T>,
  direction: RelationDirection,
): RelationColumn<T>[] {
  const columns: RelationColumn<T>[] = [];
  const keys = options.path[direction];
  let source: T | undefined = options.item;
  for (let depth = 1; source !== undefined; depth += 1) {
    const items = options.getRelated(source, direction);
    const key = keys[depth - 1];
    const selected = key === undefined ? undefined : items.find((entry) => entry.id === key);
    columns.push({ direction, depth, source, items, selectedKey: selected?.id ?? null });
    source = selected;
  }
  return columns;
}

/**
 * The columns of a relation walk from `item`, in reading order: the upstream columns, furthest
 * first, the start item's column, then the downstream columns. Each side walks the chosen keys of
 * `path` while each is among the related items of the one before, and ends with the column of
 * the last chosen item's related items.
 */
export function resolveRelationColumns<T extends { id: Key }>(
  options: RelationColumnsOptions<T>,
): RelationColumn<T>[] {
  const own: RelationColumn<T> = {
    ...{ direction: 'item', depth: 0, source: options.item },
    ...{ items: [options.item], selectedKey: null },
  };
  return [
    ...resolveSide(options, 'upstream').reverse(),
    own,
    ...resolveSide(options, 'downstream'),
  ];
}

/** The chosen items along the walk, in reading order: furthest upstream to furthest downstream. */
export function listRelationTrail<T extends { id: Key }>(
  columns: readonly RelationColumn<T>[],
): { item: T; column: RelationColumn<T> }[] {
  return columns.flatMap((column) => {
    const key = column.direction === 'item' ? column.source.id : column.selectedKey;
    const item = column.items.find((entry) => entry.id === key);
    return item ? [{ item, column }] : [];
  });
}

/** `path` with `key` chosen in the column at `depth` of `direction`, dropping the choices past it. */
export function chooseRelation(
  path: RelationColumnsPath,
  choice: { direction: RelationDirection; depth: number; key: Key | null },
): RelationColumnsPath {
  const kept = path[choice.direction].slice(0, choice.depth - 1);
  return { ...path, [choice.direction]: choice.key === null ? kept : [...kept, choice.key] };
}
