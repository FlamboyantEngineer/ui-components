import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type DragEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import {
  DropIndicator,
  useDragAndDrop,
  type DragAndDropHooks,
  type DragAndDropOptions,
  type DropTarget,
  type Key,
} from 'react-aria-components';
import { tableHooks } from './table-hooks.js';
import { isEffectiveTableMove, type TableMove, type TableRow } from './table-rows.js';

/** Opt-in row reordering: which rows move and what to do with a move. */
export interface TableReorderOptions<T> {
  /** Whether a row can be dragged or moved by keyboard. Defaults to every row. */
  canMove?: ((row: T) => boolean) | undefined;
  /** Reports one move. The table never reorders its rows itself: apply the move and re-render. */
  onMove: (move: TableMove) => void;
}

export interface TableReorder<T> {
  dragAndDropHooks: DragAndDropHooks<T>;
  isMovable: (row: T) => boolean;
  /** Handlers for the table root: Alt+ArrowUp/Down moves, and refused drags of fixed rows. */
  rootProps: {
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
    onDragStartCapture: (event: DragEvent<HTMLElement>) => void;
  };
}

interface ReorderSnapshot<T> {
  rows: readonly T[];
  reorder: TableReorderOptions<T> | undefined;
}

const moveKeys: Readonly<Record<string, -1 | 1>> = { ArrowUp: -1, ArrowDown: 1 };

/** The key of the row of this table that holds `target`, or null. */
function rowKeyOf(target: EventTarget, root: Element): string | null {
  const row = target instanceof Element ? target.closest('[role="row"]') : null;
  if (!row || row.closest(`.${tableHooks.className}`) !== root) return null;
  return row.getAttribute('data-key');
}

function canMoveRow<T>(reorder: TableReorderOptions<T> | undefined, row: T): boolean {
  return reorder?.canMove?.(row) ?? true;
}

function isMoveChord(event: KeyboardEvent<HTMLElement>): boolean {
  return event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

function findMovableRow<T extends TableRow>(snapshot: ReorderSnapshot<T>, key: Key): T | undefined {
  const row = snapshot.rows.find((candidate) => String(candidate.id) === String(key));
  return row && canMoveRow(snapshot.reorder, row) ? row : undefined;
}

/** The move a drop on `target` makes, or null when it is not allowed or changes nothing. */
function resolveDrop<T extends TableRow>(
  snapshot: ReorderSnapshot<T>,
  target: DropTarget,
  keys: Iterable<Key>,
): TableMove | null {
  if (target.type !== 'item' || target.dropPosition === 'on') return null;
  const move = { keys: [...keys], targetKey: target.key, position: target.dropPosition };
  return isEffectiveTableMove(snapshot.rows, move) ? move : null;
}

function useReorderDragAndDrop<T extends TableRow>(latest: RefObject<ReorderSnapshot<T>>) {
  const dragging = useRef<Set<Key>>(new Set());
  const options = useMemo<DragAndDropOptions<T>>(
    () => ({
      getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
      getAllowedDropOperations: () => ['move'],
      onDragStart: ({ keys }) => {
        dragging.current = keys;
      },
      getDropOperation: (target) =>
        resolveDrop(latest.current, target, dragging.current) ? 'move' : 'cancel',
      onReorder: ({ keys, target }) => {
        const move = resolveDrop(latest.current, target, keys);
        if (move) latest.current.reorder?.onMove(move);
      },
      renderDropIndicator: (target) => (
        <DropIndicator target={target} className={tableHooks.slotClass('drop-indicator')} />
      ),
    }),
    [latest],
  );
  return useDragAndDrop<T>(options).dragAndDropHooks;
}

/**
 * Reordering for a table: pointer and keyboard drag and drop through React Aria, plus Alt+Arrow
 * moves of the focused row. Every check reads the rows last rendered.
 */
export function useTableReorder<T extends TableRow>(snapshot: ReorderSnapshot<T>): TableReorder<T> {
  const latest = useRef(snapshot);
  useLayoutEffect(() => {
    latest.current = snapshot;
  });
  const dragAndDropHooks = useReorderDragAndDrop(latest);
  const { reorder } = snapshot;
  const isMovable = useCallback((row: T) => canMoveRow(reorder, row), [reorder]);
  const findMovable = (key: Key) => findMovableRow(latest.current, key);

  const moveByKeyboard = (key: string, step: -1 | 1) => {
    const { rows, reorder } = latest.current;
    const index = rows.findIndex((row) => String(row.id) === key);
    const row = findMovable(key);
    const target = rows[index + step];
    if (!reorder || !row) return false;
    if (target) {
      reorder.onMove({
        keys: [row.id],
        targetKey: target.id,
        position: step === 1 ? 'after' : 'before',
      });
    }
    return true;
  };

  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    const step = moveKeys[event.key];
    const key = step && isMoveChord(event) ? rowKeyOf(event.target, event.currentTarget) : null;
    if (key !== null && step && moveByKeyboard(key, step)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const onDragStartCapture = (event: DragEvent<HTMLElement>) => {
    const key = rowKeyOf(event.target, event.currentTarget);
    if (key !== null && !findMovable(key)) event.preventDefault();
  };

  return {
    dragAndDropHooks,
    isMovable,
    rootProps: { onKeyDownCapture, onDragStartCapture },
  };
}
