import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import {
  DropIndicator,
  useDragAndDrop,
  type DragAndDropHooks,
  type DragAndDropOptions,
  type DropTarget,
  type Key,
} from 'react-aria-components';
import {
  resolveTreeDrop,
  resolveTreeKeyboardMove,
  type TreeMove,
  type TreeMoveDirection,
  type TreeMoveRow,
} from '../../utils/tree-reorder.js';

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
}

export interface UseTreeReorderOptions<T> {
  /** The visible rows, in order, with their movability. */
  rows: readonly TreeMoveRow<T>[];
  /** Reordering options; without them the hook reports nothing. */
  reorder: TreeReorderOptions<T> | undefined;
  /** Shows a row's children, so a row moved inside a collapsed row stays in view. */
  expand: (key: Key) => void;
  /** The text a dragged row carries for other drop targets. */
  getTextValue: (item: T) => string;
  /** The hook class of the drop indicator drawn between rows. */
  dropIndicatorClassName: string;
}

export interface TreeReorder {
  /** React Aria drag and drop hooks for the `Tree`. */
  dragAndDropHooks: DragAndDropHooks;
  /** Whether the visible row `key` can be moved. */
  isMovable(key: Key): boolean;
  /** The row's `aria-keyshortcuts` value for the keyboard moves. */
  keyShortcuts: string;
  /** Reports the keyboard move of row `key`; returns whether the chord belongs to reordering. */
  moveByKeyboard(key: Key, direction: TreeMoveDirection): boolean;
}

const SIBLING_SHORTCUTS = 'Alt+ArrowUp Alt+ArrowDown';
const PARENT_SHORTCUTS = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight';

function onlyKey(keys: Set<Key>): Key | null {
  if (keys.size !== 1) return null;
  const [key] = keys;
  return key ?? null;
}

/**
 * Reordering for a React Aria `Tree`: pointer and keyboard drag and drop through `useDragAndDrop`,
 * plus Alt+Arrow moves. Every check reads the rows the tree last rendered, so a drop is validated
 * against the current items rather than the ones the drag started on.
 */
export function useTreeReorder<T>({
  rows,
  reorder,
  expand,
  getTextValue,
  dropIndicatorClassName,
}: UseTreeReorderOptions<T>): TreeReorder {
  const latest = useRef({ rows, reorder, expand, getTextValue });
  useLayoutEffect(() => {
    latest.current = { rows, reorder, expand, getTextValue };
  });
  const dragging = useRef<Key | null>(null);

  const report = useCallback((move: TreeMove) => {
    if (move.position === 'inside') latest.current.expand(move.targetKey);
    latest.current.reorder?.onMove(move);
  }, []);

  const resolveTarget = useCallback((target: DropTarget, key: Key | null): TreeMove | null => {
    const { rows: current, reorder: owner } = latest.current;
    if (!owner || key === null || target.type !== 'item') return null;
    const position = target.dropPosition === 'on' ? 'inside' : target.dropPosition;
    return resolveTreeDrop(current, key, target.key, position, owner);
  }, []);

  const options = useMemo<DragAndDropOptions<T>>(
    () => ({
      getItems: (keys) =>
        [...keys].map((key) => {
          const row = latest.current.rows.find((entry) => entry.key === key);
          return { 'text/plain': row ? latest.current.getTextValue(row.item) : String(key) };
        }),
      getAllowedDropOperations: () => ['move'],
      onDragStart: (event) => {
        // One row moves at a time; dragging several selected rows offers no drop.
        dragging.current = onlyKey(event.keys);
      },
      onDragEnd: () => {
        dragging.current = null;
      },
      getDropOperation: (target) => (resolveTarget(target, dragging.current) ? 'move' : 'cancel'),
      onMove: (event) => {
        const move = resolveTarget(event.target, onlyKey(event.keys));
        if (move) report(move);
      },
      renderDropIndicator: (target) => (
        <DropIndicator
          target={target}
          className={dropIndicatorClassName}
          render={(props) => (
            <div
              {...props}
              data-position={target.type === 'item' ? target.dropPosition : undefined}
            />
          )}
        />
      ),
    }),
    [report, resolveTarget, dropIndicatorClassName],
  );
  const { dragAndDropHooks } = useDragAndDrop<T>(options);

  const moveByKeyboard = useCallback(
    (key: Key, direction: TreeMoveDirection): boolean => {
      const { rows: current, reorder: owner } = latest.current;
      if (!owner) return false;
      const move = resolveTreeKeyboardMove(current, key, direction, owner);
      if (move === undefined) return false;
      if (move) report(move);
      return true;
    },
    [report],
  );

  const movable = useMemo(
    () => new Set(rows.filter((row) => row.isMovable).map((row) => row.key)),
    [rows],
  );
  const isMovable = useCallback((key: Key) => movable.has(key), [movable]);

  return {
    dragAndDropHooks: dragAndDropHooks as DragAndDropHooks,
    isMovable,
    keyShortcuts: reorder?.canMoveInto ? PARENT_SHORTCUTS : SIBLING_SHORTCUTS,
    moveByKeyboard,
  };
}
