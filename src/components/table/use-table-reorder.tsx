'use client';

import {
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react';
import type { Key } from '../../core/props.js';
import { DropIndicator } from '../../primitives/index.js';
import { createKeyIndex } from '../../utils/create-key-index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { isElement } from '../../utils/is-element.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import {
  type CollectionDragAndDropOptions,
  type CollectionDropTarget,
  isMoveChord,
  useReorderDragAndDrop,
} from '../../utils/use-reorder-drag-and-drop.js';
import { armHandleDrag, keepHandleCellDraggable } from '../drag-handle/drag-handle.js';
import { tableHooks } from './table-hooks.js';
import { isWithinReorderGroup } from './table-reorder-groups.js';
import {
  indexRowPositions,
  isEffectiveTableMove,
  type TableMove,
  type TableRow,
} from './table-rows.js';

/** Opt-in row reordering: which rows move and what to do with a move. */
export interface TableReorderOptions<T> {
  /** Whether a row can be dragged or moved by keyboard. Defaults to every row. */
  canMove?: ((row: T) => boolean) | undefined;
  /** Reports one move. The table never reorders its rows itself: apply the move and re-render. */
  onMove: (move: TableMove) => void;
  /**
   * What starts a pointer drag: anywhere on the row (`row`, the default), or only its drag handle
   * (`handle`), which leaves presses elsewhere in the row to the row.
   */
  dragTrigger?: TableDragTrigger | undefined;
  /** Allows visible data-row moves inside their leaf group; grouping otherwise suspends moves. */
  grouped?: 'within-group' | undefined;
  /** The image that follows the pointer during a drag, from the dragged rows. */
  renderDragPreview?: ((rows: T[]) => ReactNode) | undefined;
}

/** What starts a row's pointer drag. */
export type TableDragTrigger = 'row' | 'handle';

export interface TableReorder<T> {
  /** The options the grid hands to `useDragAndDrop`. */
  dragAndDrop: CollectionDragAndDropOptions;
  isMovable: (row: T) => boolean;
  /** Handlers for the table root: Alt+ArrowUp/Down moves, and refused drags of fixed rows. */
  rootProps: {
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
    onDragStartCapture: (event: DragEvent<HTMLElement>) => void;
    onPointerDownCapture: (event: PointerEvent<HTMLElement>) => void;
  };
}

interface ReorderSnapshot<T> {
  rows: readonly T[];
  reorder: TableReorderOptions<T> | undefined;
  /** Whether a row is disabled, which keeps it from moving. */
  isRowDisabled: (row: T) => boolean;
  groupKeys?: ReadonlyMap<Key, Key>;
}

/** The rows indexed once per render, so checking each drop position reads no row list. */
interface RowIndex<T> {
  /** Each row's `id` by its collection key. */
  keys: ReadonlyMap<string, Key>;
  /** Each row by its collection key. */
  rows: ReadonlyMap<string, T>;
  /** Each row's position, by `id`. */
  positions: ReadonlyMap<Key, number>;
}

interface IndexedReorderSnapshot<T> extends ReorderSnapshot<T> {
  index: RowIndex<T>;
}

function indexRows<T extends TableRow>(rows: readonly T[]): RowIndex<T> {
  return {
    keys: createKeyIndex(rows.map((row) => row.id)),
    rows: new Map(rows.map((row) => [toCollectionKey(row.id), row])),
    positions: indexRowPositions(rows),
  };
}

const moveKeys: Readonly<Record<string, -1 | 1>> = { ArrowUp: -1, ArrowDown: 1 };

/**
 * The key of the body or footer row of this table that holds `target`, or null. A text control in
 * a row, such as the cell editor, keeps Alt+Arrow for its caret.
 */
function findRowKey(target: EventTarget, root: Element): string | null {
  if (isEditableTarget(target)) return null;
  const row = isElement(target) ? target.closest('[role="row"]') : null;
  if (!row || row.closest(`.${tableHooks.className}`) !== root) return null;
  return row.closest('thead') ? null : row.getAttribute('data-key');
}

function canMoveRow<T>(reorder: TableReorderOptions<T> | undefined, row: T): boolean {
  return reorder?.canMove?.(row) ?? true;
}

function findMovableRow<T extends TableRow>(
  snapshot: IndexedReorderSnapshot<T>,
  key: Key,
): T | undefined {
  const row = snapshot.index.rows.get(String(key));
  return row && canMoveRow(snapshot.reorder, row) && !snapshot.isRowDisabled(row) ? row : undefined;
}

/**
 * The move a drop on `target` makes, or null when it is not allowed or changes nothing. Only the
 * dragged rows that may move now go: a row gone, disabled or refused by `canMove` stays.
 */
function resolveDrop<T extends TableRow>(
  snapshot: IndexedReorderSnapshot<T>,
  target: CollectionDropTarget,
  keys: Iterable<Key>,
): TableMove | null {
  if (target.type !== 'item' || target.dropPosition === 'on') return null;
  const index = snapshot.index.keys;
  const targetKey = index.get(String(target.key));
  if (targetKey === undefined) return null;
  const moved = [...keys].flatMap((key) => {
    const original = index.get(String(key));
    return original !== undefined && findMovableRow(snapshot, String(key)) ? [original] : [];
  });
  if (moved.length === 0) return null;
  const move = { keys: moved, targetKey, position: target.dropPosition };
  return isWithinReorderGroup(snapshot.groupKeys, move) &&
    isEffectiveTableMove(snapshot.index.positions, move)
    ? move
    : null;
}

/** The move of `row` one step up or down, or null at either end. */
function resolveStep<T extends TableRow>(
  snapshot: IndexedReorderSnapshot<T>,
  row: T,
  step: -1 | 1,
): TableMove | null {
  const position = snapshot.index.positions.get(row.id) ?? -2;
  const target = snapshot.rows[position + step];
  if (!target) return null;
  const move: TableMove = {
    keys: [row.id],
    targetKey: target.id,
    position: step === 1 ? 'after' : 'before',
  };
  return isWithinReorderGroup(snapshot.groupKeys, move) ? move : null;
}

function renderDropIndicator(target: CollectionDropTarget) {
  return <DropIndicator target={target} className={tableHooks.slotClass('drop-indicator')} />;
}

/** The text a dragged row carries to other drop targets: its own `id`, not its collection key. */
function getKeyText(key: Key): string {
  return String(fromCollectionKey(key));
}

/** The drag preview: the caller's content for the dragged rows, in the table's preview slot. */
function createDragPreview<T extends TableRow>(snapshot: ReorderSnapshot<T>) {
  const render = snapshot.reorder?.renderDragPreview;
  if (!render) return undefined;
  return (keys: ReadonlySet<Key>) => {
    const rows = snapshot.rows.filter((row) => keys.has(toCollectionKey(row.id)));
    return <div {...tableHooks.slot('drag-preview', { count: rows.length })}>{render(rows)}</div>;
  };
}

/**
 * Reordering for a table: pointer and keyboard drag and drop through React Aria, plus Alt+Arrow
 * moves of the focused row. Every check reads the rows last rendered.
 */
export function useTableReorder<T extends TableRow>(snapshot: ReorderSnapshot<T>): TableReorder<T> {
  const { reorder, isRowDisabled } = snapshot;
  const index = useMemo(() => indexRows(snapshot.rows), [snapshot.rows]);
  const indexed = { ...snapshot, index };
  const dragAndDrop = useReorderDragAndDrop<TableMove>({
    resolveMove: (target, keys) => resolveDrop(indexed, target, keys),
    onMove: (move) => reorder?.onMove(move),
    getTextValue: getKeyText,
    renderDropIndicator,
    renderDragPreview: createDragPreview(snapshot),
  });
  // Only the top-level rows of the page move, so nested rows draw disabled handles.
  const topLevel = useMemo(() => new Set(snapshot.rows), [snapshot.rows]);
  const isMovable = useCallback(
    (row: T) => topLevel.has(row) && canMoveRow(reorder, row) && !isRowDisabled(row),
    [topLevel, reorder, isRowDisabled],
  );

  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    const step = moveKeys[event.key];
    const key = step && isMoveChord(event) ? findRowKey(event.target, event.currentTarget) : null;
    const row = key === null ? undefined : findMovableRow(indexed, key);
    if (!reorder || !row || !step) return;
    const move = resolveStep(indexed, row, step);
    if (move) reorder.onMove(move);
    event.preventDefault();
    event.stopPropagation();
  };

  const onDragStartCapture = (event: DragEvent<HTMLElement>) => {
    const key = findRowKey(event.target, event.currentTarget);
    if (key !== null && !findMovableRow(indexed, key)) event.preventDefault();
  };

  const isHandleTrigger = reorder?.dragTrigger === 'handle';
  return {
    dragAndDrop,
    isMovable,
    rootProps: {
      onKeyDownCapture,
      onDragStartCapture,
      onPointerDownCapture: isHandleTrigger ? armHandleDrag : keepHandleCellDraggable,
    },
  };
}
