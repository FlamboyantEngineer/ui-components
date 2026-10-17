import { useLayoutEffect, useMemo, useRef, type JSX, type KeyboardEvent } from 'react';
import {
  useDragAndDrop,
  type DragAndDropHooks,
  type DragAndDropOptions,
  type DropTarget,
  type Key,
} from 'react-aria-components';

/** How a reorderable collection turns drops into moves. */
export interface ReorderDragAndDropOptions<Move> {
  /** The move a drop of `keys` on `target` makes, or `null` where nothing may land. */
  resolveMove: (target: DropTarget, keys: ReadonlySet<Key>) => Move | null;
  /** Reports the move of an accepted drop. */
  onMove: (move: Move) => void;
  /** The text a dragged item carries to other drop targets. */
  getTextValue: (key: Key) => string;
  /** Draws the collection's drop indicator between items. */
  renderDropIndicator: (target: DropTarget) => JSX.Element;
}

/** Whether a keydown holds Alt and no other modifier, as a collection's keyboard moves do. */
export function isMoveChord(event: KeyboardEvent): boolean {
  return event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

/**
 * React Aria drag and drop that reorders a collection: one move operation, and a drop target
 * wherever `resolveMove` lets the dragged keys land. Every check reads the latest options, so a drop
 * is validated against the items shown when it happens, not those shown when the drag started.
 */
export function useReorderDragAndDrop<T, Move>(
  options: ReorderDragAndDropOptions<Move>,
): DragAndDropHooks<T> {
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  const dragging = useRef<ReadonlySet<Key>>(new Set());
  const { renderDropIndicator } = options;
  const dragAndDrop = useMemo<DragAndDropOptions<T>>(
    () => ({
      getItems: (keys) =>
        [...keys].map((key) => ({ 'text/plain': latest.current.getTextValue(key) })),
      getAllowedDropOperations: () => ['move'],
      onDragStart: ({ keys }) => {
        dragging.current = keys;
      },
      onDragEnd: () => {
        dragging.current = new Set();
      },
      getDropOperation: (target) =>
        latest.current.resolveMove(target, dragging.current) ? 'move' : 'cancel',
      onMove: ({ target, keys }) => {
        const move = latest.current.resolveMove(target, keys);
        if (move) latest.current.onMove(move);
      },
      renderDropIndicator,
    }),
    [renderDropIndicator],
  );
  return useDragAndDrop<T>(dragAndDrop).dragAndDropHooks;
}
