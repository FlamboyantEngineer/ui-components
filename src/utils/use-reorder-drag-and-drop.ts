import {
  createElement,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
} from 'react';
import {
  useDragAndDrop,
  type DragAndDropHooks,
  type DragAndDropOptions,
  type DropTarget,
  type Key,
} from 'react-aria-components';

/** A dragged item: its data by media type. */
export type ReorderDragItem = Record<string, string>;

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
  /**
   * Draws the image that follows the pointer during a drag, from the dragged items, instead of the
   * browser's picture of the dragged element. Read when the hook first renders.
   */
  renderDragPreview?: ((items: ReorderDragItem[]) => JSX.Element) | undefined;
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
  // React Aria reads whether a preview exists once, so only its content follows later renders.
  const [hasPreview] = useState(options.renderDragPreview !== undefined);
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
      ...(hasPreview
        ? {
            renderDragPreview: (items: ReorderDragItem[]) =>
              latest.current.renderDragPreview?.(items) ?? createElement('span'),
          }
        : {}),
    }),
    [renderDropIndicator, hasPreview],
  );
  return useDragAndDrop<T>(dragAndDrop).dragAndDropHooks;
}
