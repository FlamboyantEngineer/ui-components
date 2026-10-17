import { useCallback, type DragEvent, type KeyboardEvent } from 'react';
import {
  DropIndicator,
  type DragAndDropHooks,
  type DropTarget,
  type Key,
} from 'react-aria-components';
import { isMoveChord, useReorderDragAndDrop } from '../../utils/use-reorder-drag-and-drop.js';
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
function findRowKey(target: EventTarget, root: Element): string | null {
  const row = target instanceof Element ? target.closest('[role="row"]') : null;
  if (!row || row.closest(`.${tableHooks.className}`) !== root) return null;
  return row.getAttribute('data-key');
}

function canMoveRow<T>(reorder: TableReorderOptions<T> | undefined, row: T): boolean {
  return reorder?.canMove?.(row) ?? true;
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

/** The move of `row` one step up or down, or null at either end. */
function resolveStep<T extends TableRow>(
  snapshot: ReorderSnapshot<T>,
  row: T,
  step: -1 | 1,
): TableMove | null {
  const target = snapshot.rows[snapshot.rows.indexOf(row) + step];
  if (!target) return null;
  return { keys: [row.id], targetKey: target.id, position: step === 1 ? 'after' : 'before' };
}

function renderDropIndicator(target: DropTarget) {
  return <DropIndicator target={target} className={tableHooks.slotClass('drop-indicator')} />;
}

function getKeyText(key: Key): string {
  return String(key);
}

/**
 * Reordering for a table: pointer and keyboard drag and drop through React Aria, plus Alt+Arrow
 * moves of the focused row. Every check reads the rows last rendered.
 */
export function useTableReorder<T extends TableRow>(snapshot: ReorderSnapshot<T>): TableReorder<T> {
  const { reorder } = snapshot;
  const dragAndDropHooks = useReorderDragAndDrop<T, TableMove>({
    resolveMove: (target, keys) => resolveDrop(snapshot, target, keys),
    onMove: (move) => reorder?.onMove(move),
    getTextValue: getKeyText,
    renderDropIndicator,
  });
  const isMovable = useCallback((row: T) => canMoveRow(reorder, row), [reorder]);

  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    const step = moveKeys[event.key];
    const key = step && isMoveChord(event) ? findRowKey(event.target, event.currentTarget) : null;
    const row = key === null ? undefined : findMovableRow(snapshot, key);
    if (!reorder || !row || !step) return;
    const move = resolveStep(snapshot, row, step);
    if (move) reorder.onMove(move);
    event.preventDefault();
    event.stopPropagation();
  };

  const onDragStartCapture = (event: DragEvent<HTMLElement>) => {
    const key = findRowKey(event.target, event.currentTarget);
    if (key !== null && !findMovableRow(snapshot, key)) event.preventDefault();
  };

  return {
    dragAndDropHooks,
    isMovable,
    rootProps: { onKeyDownCapture, onDragStartCapture },
  };
}
