// Pure move computations for reordering a tree's rows: which moves are allowed, and the items
// that result from one. Components report moves; owners apply and persist them.

/** A tree item key, as React Aria collections use it. */
export type TreeKey = string | number;

/** Where a moved row lands: beside the target row, or inside it as its last child. */
export type TreeDropPosition = 'before' | 'after' | 'inside';

/** One move: the row `key` takes the slot before or after `targetKey`, or goes inside it. */
export interface TreeMove {
  key: TreeKey;
  targetKey: TreeKey;
  position: TreeDropPosition;
}

/** The direction of a keyboard move: past a sibling, into the sibling above, or out of the parent. */
export type TreeMoveDirection = 'up' | 'down' | 'in' | 'out';

/** A visible row as the move rules see it. */
export interface TreeMoveRow<T> {
  key: TreeKey;
  /** The parent row's key; `null` at the top level. */
  parentKey: TreeKey | null;
  item: T;
  /** Whether the row can be moved and can take a moved row right now. */
  isMovable: boolean;
  /** Whether the row's children are listed below it. */
  isExpanded: boolean;
}

/** The owner's consent for moves to another parent. */
export interface TreeMoveRules<T> {
  /**
   * Whether `item` may be placed among `parent`'s children (`null`: the top level). Without it, rows
   * only move among their own siblings.
   */
  canMoveInto?: ((item: T, parent: T | null) => boolean) | undefined;
}

/** The minimal shape of nested tree data: a key and optional children of the same shape. */
export interface TreeMoveItem<T> {
  id: TreeKey;
  children?: readonly T[] | undefined;
}

export interface VisibleTreeRowsOptions<T> {
  /** The keys of rows whose children are shown. */
  expandedKeys: Iterable<TreeKey>;
  /** Children of an item. Defaults to its `children` property. */
  getChildren?: ((item: T) => readonly T[] | undefined) | undefined;
  /** Whether a row can move. Defaults to every row. */
  isMovable?: ((item: T) => boolean) | undefined;
}

function defaultChildren<T>(item: T): readonly T[] | undefined {
  return (item as TreeMoveItem<T>).children;
}

/** The rows a tree shows, in order: top-level items and the children of expanded items. */
export function getVisibleTreeRows<T extends { id: TreeKey }>(
  items: readonly T[],
  {
    expandedKeys,
    getChildren = defaultChildren,
    isMovable = () => true,
  }: VisibleTreeRowsOptions<T>,
): TreeMoveRow<T>[] {
  const expanded = new Set(expandedKeys);
  const rows: TreeMoveRow<T>[] = [];
  const visit = (level: readonly T[], parentKey: TreeKey | null) => {
    for (const item of level) {
      const children = getChildren(item);
      const isExpanded = expanded.has(item.id) && Boolean(children?.length);
      rows.push({ key: item.id, parentKey, item, isMovable: isMovable(item), isExpanded });
      if (isExpanded && children) visit(children, item.id);
    }
  };
  visit(items, null);
  return rows;
}

/**
 * The move that puts row `key` at `position` relative to `targetKey`, or `null` when it is not
 * allowed or changes nothing. Both rows must be movable. A row never lands inside or beside its own
 * descendants, inside the parent it is already in, or in the slot it already holds. A different
 * parent needs the owner's `canMoveInto`.
 */
export function resolveTreeMove<T>(
  rows: readonly TreeMoveRow<T>[],
  key: TreeKey,
  targetKey: TreeKey,
  position: TreeDropPosition,
  rules: TreeMoveRules<T> = {},
): TreeMove | null {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const source = byKey.get(key);
  const target = byKey.get(targetKey);
  if (!source || !target || source === target || !source.isMovable || !target.isMovable) {
    return null;
  }
  for (let ancestor = target.parentKey; ancestor !== null; ) {
    if (ancestor === source.key) return null;
    ancestor = byKey.get(ancestor)?.parentKey ?? null;
  }
  const parentKey = position === 'inside' ? target.key : target.parentKey;
  if (parentKey === source.parentKey) {
    if (position === 'inside') return null;
    const siblings = rows.filter((row) => row.parentKey === source.parentKey);
    const offset = siblings.indexOf(target) - siblings.indexOf(source);
    if (offset === (position === 'before' ? 1 : -1)) return null;
  } else {
    const parent = parentKey === null ? null : byKey.get(parentKey);
    if (parent === undefined || !rules.canMoveInto?.(source.item, parent ? parent.item : null)) {
      return null;
    }
  }
  return { key, targetKey, position };
}

/**
 * The move a drop makes. As `resolveTreeMove`, except that nothing lands just after a row whose
 * children are listed below it: a line there reads as inside that row.
 */
export function resolveTreeDrop<T>(
  rows: readonly TreeMoveRow<T>[],
  key: TreeKey,
  targetKey: TreeKey,
  position: TreeDropPosition,
  rules: TreeMoveRules<T> = {},
): TreeMove | null {
  if (position === 'after' && rows.find((row) => row.key === targetKey)?.isExpanded) return null;
  return resolveTreeMove(rows, key, targetKey, position, rules);
}

/**
 * The move a keyboard chord makes on row `key`. `up` and `down` pass the neighbouring movable
 * sibling. With `canMoveInto`, `in` moves the row into the sibling above it as its last child and
 * `out` moves it to just after its parent.
 *
 * Returns `undefined` when the chord is not a move for this row (the row cannot move, or `in`/`out`
 * without `canMoveInto`), so the caller can treat the key as ordinary navigation; `null` when the
 * chord is a move that cannot happen here (at either end, or refused).
 */
export function resolveTreeKeyboardMove<T>(
  rows: readonly TreeMoveRow<T>[],
  key: TreeKey,
  direction: TreeMoveDirection,
  rules: TreeMoveRules<T> = {},
): TreeMove | null | undefined {
  const row = rows.find((entry) => entry.key === key);
  if (!row?.isMovable) return undefined;
  const siblings = rows.filter((entry) => entry.parentKey === row.parentKey);
  if (direction === 'up' || direction === 'down') {
    const movable = siblings.filter((entry) => entry.isMovable);
    const target = movable[movable.indexOf(row) + (direction === 'up' ? -1 : 1)];
    if (!target) return null;
    return { key, targetKey: target.key, position: direction === 'up' ? 'before' : 'after' };
  }
  if (!rules.canMoveInto) return undefined;
  if (direction === 'in') {
    const above = siblings[siblings.indexOf(row) - 1];
    return above ? resolveTreeMove(rows, key, above.key, 'inside', rules) : null;
  }
  const parent = row.parentKey === null ? undefined : rows.find((e) => e.key === row.parentKey);
  return parent ? resolveTreeMove(rows, key, parent.key, 'after', rules) : null;
}

function findItem<T extends TreeMoveItem<T>>(items: readonly T[], key: TreeKey): T | undefined {
  for (const item of items) {
    if (item.id === key) return item;
    const found = item.children ? findItem(item.children, key) : undefined;
    if (found) return found;
  }
  return undefined;
}

function withoutItem<T extends TreeMoveItem<T>>(items: readonly T[], key: TreeKey): readonly T[] {
  let changed = false;
  const next: T[] = [];
  for (const item of items) {
    if (item.id === key) {
      changed = true;
      continue;
    }
    const children = item.children ? withoutItem(item.children, key) : undefined;
    if (children !== item.children) {
      changed = true;
      next.push({ ...item, children });
    } else {
      next.push(item);
    }
  }
  return changed ? next : items;
}

function withItem<T extends TreeMoveItem<T>>(
  items: readonly T[],
  moved: T,
  move: TreeMove,
): readonly T[] {
  let changed = false;
  const next: T[] = [];
  for (const item of items) {
    if (item.id === move.targetKey) {
      changed = true;
      if (move.position === 'before') next.push(moved, item);
      else if (move.position === 'after') next.push(item, moved);
      else next.push({ ...item, children: [...(item.children ?? []), moved] });
      continue;
    }
    const children = item.children ? withItem(item.children, moved, move) : undefined;
    if (children !== item.children) {
      changed = true;
      next.push({ ...item, children });
    } else {
      next.push(item);
    }
  }
  return changed ? next : items;
}

/**
 * Nested items after `move`, leaving the input unchanged. Subtrees the move does not touch keep
 * their identity. A move whose row or target is missing, or whose target lies inside the moved row,
 * returns the items as they were.
 */
export function applyTreeMove<T extends TreeMoveItem<T>>(
  items: readonly T[],
  move: TreeMove,
): readonly T[] {
  const moved = findItem(items, move.key);
  if (!moved || move.key === move.targetKey) return items;
  if (
    !findItem(items, move.targetKey) ||
    (moved.children && findItem(moved.children, move.targetKey))
  ) {
    return items;
  }
  return withItem(withoutItem(items, move.key), moved, move);
}
