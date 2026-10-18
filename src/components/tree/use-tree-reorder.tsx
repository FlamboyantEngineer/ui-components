import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import {
  DropIndicator,
  type DragAndDropHooks,
  type DropTarget,
  type Key,
} from '../../primitives/index.js';
import {
  getVisibleTreeRows,
  resolveTreeDrop,
  resolveTreeDropMany,
  resolveTreeKeyboardMove,
  type TreeKeyboardMove,
  type TreeMove,
  type TreeMoveRow,
} from '../../utils/tree-reorder.js';
import { useReorderDragAndDrop } from '../../utils/use-reorder-drag-and-drop.js';
import type { TreeItemData } from './tree.js';
import { treeHooks as hooks } from './tree-hooks.js';
import type { TreeExpansion } from './use-tree-expansion.js';

/** The owner's half of a reorderable tree: which rows move, where they may go, and what to do. */
export interface TreeReorderOptions<T> {
  /** Whether a row can be moved. Defaults to every row. Disabled rows never move. */
  canMove?: ((item: T) => boolean) | undefined;
  /**
   * Whether `item` may be placed among `parent`'s children (`null`: the top level). Without it,
   * rows only move among their own siblings.
   */
  canMoveInto?: ((item: T, parent: T | null) => boolean) | undefined;
  /** Reports one move. The tree never reorders its own items: apply the move and render the result. */
  onMove: (move: TreeMove) => void;
  /**
   * Reports the moves of several selected rows dragged together, in the order they apply. Without
   * it, a drag of several rows reports nothing.
   */
  onMoveMany?: ((moves: readonly TreeMove[]) => void) | undefined;
}

/** What reordering reads from the tree. */
export interface TreeReorderSource<T extends TreeItemData> {
  items: readonly T[];
  reorder: TreeReorderOptions<T> | undefined;
  disabledKeys: Iterable<Key> | undefined;
  expansion: TreeExpansion;
  getChildren: (item: T) => readonly T[] | undefined;
  getTextValue: (item: T) => string;
}

/** A reorderable tree's drag and drop hooks and keyboard moves. */
export interface TreeReorder<T> {
  dragAndDropHooks: DragAndDropHooks<T>;
  /** Whether the visible row `key` can be moved. */
  isMovable: (key: Key) => boolean;
  /** The `aria-keyshortcuts` value of a movable row. */
  keyShortcuts: string;
  /** Reports the move a chord makes; returns whether the chord belongs to reordering. */
  moveByKeyboard: (request: TreeKeyboardMove) => boolean;
}

const siblingShortcuts = 'Alt+ArrowUp Alt+ArrowDown';
const parentShortcuts = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight';

/**
 * The moves a drop on `target` makes: one for a single row, or one per row for several rows when
 * the owner takes them. React Aria's `on` position is `inside`.
 */
function resolveDropMoves<T>(
  rows: readonly TreeMoveRow<T>[],
  reorder: TreeReorderOptions<T> | undefined,
  { target, keys }: { target: DropTarget; keys: ReadonlySet<Key> },
): readonly TreeMove[] | null {
  const [key] = keys;
  if (!reorder || key === undefined || target.type !== 'item') return null;
  const position = target.dropPosition === 'on' ? 'inside' : target.dropPosition;
  if (keys.size > 1) {
    if (!reorder.onMoveMany) return null;
    return resolveTreeDropMany(rows, { keys, targetKey: target.key, position }, reorder);
  }
  const move = resolveTreeDrop(rows, { key, targetKey: target.key, position }, reorder);
  return move ? [move] : null;
}

function renderDropIndicator(target: DropTarget) {
  return (
    <DropIndicator
      target={target}
      className={hooks.slotClass('drop-indicator')}
      render={(props) => (
        <div {...props} data-position={target.type === 'item' ? target.dropPosition : undefined} />
      )}
    />
  );
}

/** The visible rows with their movability, while the tree is reorderable. */
function useMoveRows<T extends TreeItemData>(source: TreeReorderSource<T>) {
  const { items, reorder, disabledKeys, expansion, getChildren } = source;
  const canMove = reorder?.canMove;
  const hasReorder = reorder !== undefined;
  const disabled = useMemo(() => new Set<Key>(disabledKeys ?? []), [disabledKeys]);
  const { expandedKeys } = expansion;
  return useMemo(
    () =>
      hasReorder
        ? getVisibleTreeRows(items, {
            expandedKeys,
            getChildren,
            isMovable: (item) => !disabled.has(item.id) && (canMove?.(item) ?? true),
          })
        : [],
    [hasReorder, canMove, items, expandedKeys, getChildren, disabled],
  );
}

/**
 * Reordering for the tree: pointer and keyboard drag and drop, plus Alt+Arrow moves, each checked
 * against the rows the tree last rendered. `null` while the tree is not reorderable.
 */
export function useTreeReorder<T extends TreeItemData>(
  source: TreeReorderSource<T>,
): TreeReorder<T> | null {
  const rows = useMoveRows(source);
  const latest = useRef({ rows, source });
  useLayoutEffect(() => {
    latest.current = { rows, source };
  });
  const report = useCallback((moves: readonly TreeMove[]) => {
    const { expansion, reorder } = latest.current.source;
    const [first] = moves;
    if (first?.position === 'inside') expansion.expand(first.targetKey);
    if (moves.length > 1) reorder?.onMoveMany?.(moves);
    else if (first) reorder?.onMove(first);
  }, []);
  const dragAndDropHooks = useReorderDragAndDrop<T, readonly TreeMove[]>({
    resolveMove: (target, keys) => resolveDropMoves(rows, source.reorder, { target, keys }),
    onMove: report,
    getTextValue: (key) => {
      const row = rows.find((entry) => entry.key === key);
      return row ? source.getTextValue(row.item) : String(key);
    },
    renderDropIndicator,
  });
  const moveByKeyboard = useCallback(
    (request: TreeKeyboardMove) => {
      const { rows: current, source: owner } = latest.current;
      const move = owner.reorder && resolveTreeKeyboardMove(current, request, owner.reorder);
      if (move) report([move]);
      return move !== undefined;
    },
    [report],
  );
  const movable = useMemo(
    () => new Set(rows.filter((row) => row.isMovable).map((row) => row.key)),
    [rows],
  );
  const isMovable = useCallback((key: Key) => movable.has(key), [movable]);
  const hasReorder = source.reorder !== undefined;
  const keyShortcuts = source.reorder?.canMoveInto ? parentShortcuts : siblingShortcuts;
  return useMemo(
    () => (hasReorder ? { dragAndDropHooks, isMovable, keyShortcuts, moveByKeyboard } : null),
    [hasReorder, dragAndDropHooks, isMovable, keyShortcuts, moveByKeyboard],
  );
}
