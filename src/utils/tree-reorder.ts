// Pure move computations for reordering a tree's rows: which moves are allowed, and the items
// that result from one. Components report moves; owners apply and persist them.

import type { Key } from '../core/props.js';
import { requireDefined } from './require-defined.js';

/** Where a moved row lands: beside the target row, or inside it as its last child. */
export type TreeDropPosition = 'before' | 'after' | 'inside';

/** One move: the row `key` takes the slot before or after `targetKey`, or goes inside it. */
export interface TreeMove {
  /** The moved row. */
  key: Key;
  /** The row the moved row lands beside or inside. */
  targetKey: Key;
  /** Where the moved row lands relative to the target. */
  position: TreeDropPosition;
}

/** A drop of several rows: the rows `keys` land together before or after `targetKey`, or inside it. */
export interface TreeMultipleMove {
  /** The dragged rows. */
  keys: Iterable<Key>;
  /** The row the dragged rows land beside or inside. */
  targetKey: Key;
  /** Where the dragged rows land relative to the target. */
  position: TreeDropPosition;
}

/** The direction of a keyboard move: past a sibling, into the sibling above, or out of the parent. */
export type TreeMoveDirection = 'up' | 'down' | 'in' | 'out';

/** A keyboard chord on a row: which row, and which way it asks to move. */
export interface TreeKeyboardMove {
  /** The focused row. */
  key: Key;
  /** The direction the chord asks for. */
  direction: TreeMoveDirection;
}

/** A visible row as the move rules see it. */
export interface TreeMoveRow<T> {
  /** The row's key. */
  key: Key;
  /** The parent row's key; `null` at the top level. */
  parentKey: Key | null;
  /** The caller's item. */
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
  /** The item's key, unique in the tree. */
  id: Key;
  /** The item's children. */
  children?: readonly T[] | undefined;
}

export interface VisibleTreeRowsOptions<T> {
  /** The keys of rows whose children are shown. */
  expandedKeys: Iterable<Key>;
  /** Children of an item. Defaults to its `children` property. */
  getChildren?: ((item: T) => readonly T[] | undefined) | undefined;
  /** Whether a row can move. Defaults to every row. */
  isMovable?: ((item: T) => boolean) | undefined;
}

type RowIndex<T> = ReadonlyMap<Key, TreeMoveRow<T>>;

/** A row placed beside or inside a target row. */
interface Placement<T> {
  source: TreeMoveRow<T>;
  target: TreeMoveRow<T>;
  position: TreeDropPosition;
}

/**
 * The rows by key, each parent's rows in order, each row's place among its siblings, and its place
 * among all the rows.
 */
interface RowModel<T> {
  index: RowIndex<T>;
  siblings: ReadonlyMap<Key | null, readonly TreeMoveRow<T>[]>;
  places: ReadonlyMap<Key, number>;
  order: ReadonlyMap<Key, number>;
}

/** The model of each rows snapshot, built once however many moves check against it. */
const rowModels = new WeakMap<readonly TreeMoveRow<unknown>[], RowModel<unknown>>();

function buildRowModel<T>(rows: readonly TreeMoveRow<T>[]): RowModel<T> {
  const index = new Map<Key, TreeMoveRow<T>>();
  const siblings = new Map<Key | null, TreeMoveRow<T>[]>();
  const places = new Map<Key, number>();
  const order = new Map<Key, number>();
  for (const row of rows) {
    index.set(row.key, row);
    order.set(row.key, order.size);
    const level = siblings.get(row.parentKey) ?? [];
    if (level.length === 0) siblings.set(row.parentKey, level);
    places.set(row.key, level.length);
    level.push(row);
  }
  return { index, siblings, places, order };
}

/**
 * The model of `rows`. Rows are a snapshot (`getVisibleTreeRows` makes a new array for each change),
 * so a drag that checks every row as a target builds the model once.
 */
function getRowModel<T>(rows: readonly TreeMoveRow<T>[]): RowModel<T> {
  const known = rowModels.get(rows) as RowModel<T> | undefined;
  if (known) return known;
  const model = buildRowModel(rows);
  rowModels.set(rows, model as RowModel<unknown>);
  return model;
}

function indexRows<T>(rows: readonly TreeMoveRow<T>[]): RowIndex<T> {
  return getRowModel(rows).index;
}

function findSiblings<T>(
  rows: readonly TreeMoveRow<T>[],
  row: TreeMoveRow<T>,
): readonly TreeMoveRow<T>[] {
  return getRowModel(rows).siblings.get(row.parentKey) ?? [];
}

/** The row's place among its siblings. */
function findPlace<T>(rows: readonly TreeMoveRow<T>[], row: TreeMoveRow<T>): number {
  return getRowModel(rows).places.get(row.key) ?? -1;
}

/** Whether the row `key`, or one of its ancestors, is one of `ancestors`. */
function isWithinAny<T>(index: RowIndex<T>, key: Key | null, ancestors: ReadonlySet<Key>): boolean {
  for (let current = key; current !== null; current = index.get(current)?.parentKey ?? null) {
    if (ancestors.has(current)) return true;
  }
  return false;
}

/** Whether the row `key`, or one of its ancestors, is `ancestor`. */
function isWithin<T>(index: RowIndex<T>, key: Key | null, ancestor: Key): boolean {
  return isWithinAny(index, key, new Set([ancestor]));
}

/** Whether a placement among the row's own siblings leaves it where it is. */
function isSameSlot<T>(rows: readonly TreeMoveRow<T>[], placement: Placement<T>): boolean {
  const { source, target, position } = placement;
  if (position === 'inside') return true;
  const offset = findPlace(rows, target) - findPlace(rows, source);
  return offset === (position === 'before' ? 1 : -1);
}

/** Whether the owner lets the row leave its siblings for `parentKey`'s children. */
function canEnter<T>(
  index: RowIndex<T>,
  { source, parentKey }: { source: TreeMoveRow<T>; parentKey: Key | null },
  rules: TreeMoveRules<T>,
): boolean {
  const parent = parentKey === null ? null : index.get(parentKey);
  if (parent === undefined || !rules.canMoveInto) return false;
  return rules.canMoveInto(source.item, parent ? parent.item : null);
}

function findSiblingAbove<T>(rows: readonly TreeMoveRow<T>[], row: TreeMoveRow<T>) {
  return findSiblings(rows, row)[findPlace(rows, row) - 1];
}

function findParent<T>(rows: readonly TreeMoveRow<T>[], row: TreeMoveRow<T>) {
  return row.parentKey === null ? undefined : indexRows(rows).get(row.parentKey);
}

/** The move past the neighbouring movable sibling, or `null` at either end. */
function resolveSiblingStep<T>(
  rows: readonly TreeMoveRow<T>[],
  row: TreeMoveRow<T>,
  direction: 'up' | 'down',
): TreeMove | null {
  const movable = findSiblings(rows, row).filter((entry) => entry.isMovable);
  const target = movable[movable.indexOf(row) + (direction === 'up' ? -1 : 1)];
  if (!target) return null;
  return { key: row.key, targetKey: target.key, position: direction === 'up' ? 'before' : 'after' };
}

/** Where an item sits: the list holding it and its place there, from the top level down. */
type ItemPath<T> = readonly { list: readonly T[]; at: number }[];

/**
 * The path to the item `key` among `items` and their descendants, searched in preorder without
 * recursion, so a deep tree cannot overflow the call stack.
 */
function findPath<T extends TreeMoveItem<T>>(items: readonly T[], key: Key): ItemPath<T> | null {
  const frames = [{ list: items, at: -1 }];
  while (frames.length > 0) {
    const frame = requireDefined(frames.at(-1));
    frame.at += 1;
    if (frame.at >= frame.list.length) {
      frames.pop();
      continue;
    }
    const item = requireDefined(frame.list[frame.at]);
    if (item.id === key) return frames.map(({ list, at }) => ({ list, at }));
    if (item.children?.length) frames.push({ list: item.children, at: -1 });
  }
  return null;
}

function itemAt<T>(path: ItemPath<T>, depth = path.length - 1): T {
  const { list, at } = requireDefined(path[depth]);
  return requireDefined(list[at]);
}

/**
 * The items with the one at `path` replaced by `replacement`, rebuilding only its ancestors from the
 * bottom up, so subtrees off the path keep their identity.
 */
function replaceAtPath<T extends TreeMoveItem<T>>(
  path: ItemPath<T>,
  replacement: readonly T[],
): readonly T[] {
  let placed = replacement;
  for (let depth = path.length - 1; depth > 0; depth -= 1) {
    const { list, at } = requireDefined(path[depth]);
    const children = [...list.slice(0, at), ...placed, ...list.slice(at + 1)];
    placed = [{ ...itemAt(path, depth - 1), children }];
  }
  const { list, at } = requireDefined(path[0]);
  return [...list.slice(0, at), ...placed, ...list.slice(at + 1)];
}

function placeAround<T extends TreeMoveItem<T>>(target: T, moved: T, position: TreeDropPosition) {
  if (position === 'before') return [moved, target];
  if (position === 'after') return [target, moved];
  return [{ ...target, children: [...(target.children ?? []), moved] }];
}

/** An item's `children` property, the children trees read by default. */
export function readTreeChildren<T>(item: T): readonly T[] | undefined {
  return (item as TreeMoveItem<T>).children;
}

/**
 * The rows a tree shows, in order: top-level items and the children of expanded items. It walks
 * without recursion, so a deep tree cannot overflow the call stack.
 */
export function getVisibleTreeRows<T extends { id: Key }>(
  items: readonly T[],
  {
    expandedKeys,
    getChildren = readTreeChildren,
    isMovable = () => true,
  }: VisibleTreeRowsOptions<T>,
): TreeMoveRow<T>[] {
  const expanded = new Set(expandedKeys);
  const rows: TreeMoveRow<T>[] = [];
  const levels = [{ items: items[Symbol.iterator](), parentKey: null as Key | null }];
  while (levels.length > 0) {
    const level = requireDefined(levels.at(-1));
    const next = level.items.next();
    if (next.done) {
      levels.pop();
      continue;
    }
    const item = next.value;
    const children = getChildren(item);
    const isExpanded = expanded.has(item.id) && Boolean(children?.length);
    rows.push({
      key: item.id,
      parentKey: level.parentKey,
      item,
      isMovable: isMovable(item),
      isExpanded,
    });
    if (isExpanded && children)
      levels.push({ items: children[Symbol.iterator](), parentKey: item.id });
  }
  return rows;
}

/**
 * `move`, or `null` when it is not allowed or changes nothing. Both rows must be movable. A row never
 * lands inside or beside its own descendants, inside the parent it is already in, or in the slot it
 * already holds. A different parent needs the owner's `canMoveInto`.
 */
export function resolveTreeMove<T>(
  rows: readonly TreeMoveRow<T>[],
  move: TreeMove,
  rules: TreeMoveRules<T> = {},
): TreeMove | null {
  const index = indexRows(rows);
  const source = index.get(move.key);
  const target = index.get(move.targetKey);
  if (!source?.isMovable || !target?.isMovable || source === target) return null;
  if (isWithin(index, target.parentKey, source.key)) return null;
  const parentKey = move.position === 'inside' ? target.key : target.parentKey;
  const isAllowed =
    parentKey === source.parentKey
      ? !isSameSlot(rows, { source, target, position: move.position })
      : canEnter(index, { source, parentKey }, rules);
  return isAllowed ? move : null;
}

/**
 * The move a drop makes. As `resolveTreeMove`, except that nothing lands just after a row whose
 * children are listed below it: a line there reads as inside that row.
 */
export function resolveTreeDrop<T>(
  rows: readonly TreeMoveRow<T>[],
  move: TreeMove,
  rules: TreeMoveRules<T> = {},
): TreeMove | null {
  const target = indexRows(rows).get(move.targetKey);
  if (move.position === 'after' && target?.isExpanded) return null;
  return resolveTreeMove(rows, move, rules);
}

/** The dragged rows in the order shown, leaving out rows inside another dragged row. */
function findOutermostRows<T>(rows: readonly TreeMoveRow<T>[], keys: ReadonlySet<Key>) {
  const { index, order } = getRowModel(rows);
  const found: TreeMoveRow<T>[] = [];
  for (const key of keys) {
    const row = index.get(key);
    if (row && !isWithinAny(index, row.parentKey, keys)) found.push(row);
  }
  return found.sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0));
}

/** Whether the rows already sit together in this order at the spot a drop of them names. */
function isSameArrangement<T>(
  rows: readonly TreeMoveRow<T>[],
  { moved, first }: { moved: readonly TreeMoveRow<T>[]; first: Placement<T> },
): boolean {
  if (first.position === 'inside' || first.target.parentKey !== first.source.parentKey)
    return false;
  const siblings = findSiblings(rows, first.source);
  const start = findPlace(rows, first.source);
  const isRun = moved.every((row, offset) => siblings[start + offset] === row);
  const after = siblings[start + moved.length];
  const before = siblings[start - 1];
  return isRun && (first.position === 'before' ? after : before) === first.target;
}

/**
 * The moves a drop of several rows makes, in the order they apply: the first row lands where the
 * drop says and each other row just after the row before it, so the rows keep their order. Rows
 * inside another dragged row move with it. `null` when one of the rows cannot go there under the
 * rules of `resolveTreeDrop`, or when the drop leaves every row where it is.
 */
export function resolveTreeDropMany<T>(
  rows: readonly TreeMoveRow<T>[],
  { keys, targetKey, position }: TreeMultipleMove,
  rules: TreeMoveRules<T> = {},
): TreeMove[] | null {
  const index = indexRows(rows);
  const dragged = new Set(keys);
  const moved = findOutermostRows(rows, dragged);
  const target = index.get(targetKey);
  const [source] = moved;
  if (!source || !target?.isMovable || isWithinAny(index, target.key, dragged)) return null;
  if (position === 'after' && target.isExpanded) return null;
  const parentKey = position === 'inside' ? target.key : target.parentKey;
  const canGo = (row: TreeMoveRow<T>) =>
    row.isMovable &&
    (row.parentKey === parentKey || canEnter(index, { source: row, parentKey }, rules));
  if (!moved.every(canGo)) return null;
  if (isSameArrangement(rows, { moved, first: { source, target, position } })) return null;
  return moved.map((row, offset) =>
    offset === 0
      ? { key: row.key, targetKey, position }
      : { key: row.key, targetKey: moved[offset - 1]?.key ?? targetKey, position: 'after' },
  );
}

/**
 * The move a keyboard chord makes. `up` and `down` pass the neighbouring movable sibling. With
 * `canMoveInto`, `in` moves the row into the sibling above it as its last child and `out` moves it
 * to just after its parent.
 *
 * Returns `undefined` when the chord is not a move for this row (the row cannot move, or `in`/`out`
 * without `canMoveInto`), so the caller can treat the key as ordinary navigation; `null` when the
 * chord is a move that cannot happen here (at either end, or refused).
 */
export function resolveTreeKeyboardMove<T>(
  rows: readonly TreeMoveRow<T>[],
  { key, direction }: TreeKeyboardMove,
  rules: TreeMoveRules<T> = {},
): TreeMove | null | undefined {
  const row = indexRows(rows).get(key);
  if (!row?.isMovable) return undefined;
  if (direction === 'up' || direction === 'down') return resolveSiblingStep(rows, row, direction);
  if (!rules.canMoveInto) return undefined;
  const target = direction === 'in' ? findSiblingAbove(rows, row) : findParent(rows, row);
  if (!target) return null;
  const position = direction === 'in' ? 'inside' : 'after';
  return resolveTreeMove(rows, { key, targetKey: target.key, position }, rules);
}

/**
 * Nested items after `move`, leaving the input unchanged. Subtrees the move does not touch keep
 * their identity. It searches and rebuilds without recursion, so any depth of loaded items works. A move whose row or target is missing, or whose target lies inside the moved row,
 * returns the items as they were.
 */
export function applyTreeMove<T extends TreeMoveItem<T>>(
  items: readonly T[],
  move: TreeMove,
): readonly T[] {
  const source = findPath(items, move.key);
  if (!source || move.key === move.targetKey || !findPath(items, move.targetKey)) return items;
  const moved = itemAt(source);
  if (moved.children && findPath(moved.children, move.targetKey)) return items;
  const remaining = replaceAtPath(source, []);
  const target = requireDefined(findPath(remaining, move.targetKey));
  return replaceAtPath(target, placeAround(itemAt(target), moved, move.position));
}
