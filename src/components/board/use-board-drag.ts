import { useMemo, useRef, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { useDragType } from '../../utils/use-drag-type.js';
import { useLatest } from '../../utils/use-latest.js';
import type { CollectionDropTarget } from '../../utils/use-reorder-drag-and-drop.js';
import {
  resolveBoardDrop,
  resolveColumnDrop,
  type BoardCellAddress,
  type BoardColumnMove,
  type BoardLayout,
  type BoardMove,
} from './board-moves.js';

/** What every cell's drag and drop shares while the board takes card moves. */
export interface BoardCardDrag {
  /** The media type the board's cards carry, unique to the board, so other boards refuse them. */
  dragType: string;
  /** The move a drop of the dragged card on `target` in the cell `address` makes. */
  resolveDrop: (address: BoardCellAddress, target: CollectionDropTarget) => BoardMove | null;
  /** Records the card a drag started from. */
  setDragging: (key: Key | null) => void;
  /** Reports the move of an accepted drop. */
  drop: (address: BoardCellAddress, target: CollectionDropTarget) => void;
  /** The text a dragged card carries to other drop targets. */
  getTextValue: (key: Key) => string;
}

/** What every column header's drag and drop shares while the board takes column moves. */
export interface BoardColumnDrag {
  dragType: string;
  /** The column being dragged. */
  dragging: RefObject<Key | null>;
  /** The move a drop of the dragged column on `targetKey` makes. */
  resolveDrop: (targetKey: Key) => BoardColumnMove | null;
  onMove: (move: BoardColumnMove) => void;
}

interface CardDragSource {
  layout: BoardLayout;
  onMove: ((move: BoardMove) => void) | undefined;
  getTextValue: (key: Key) => string;
}

interface ColumnDragSource {
  columns: readonly Key[];
  onMove: ((move: BoardColumnMove) => void) | undefined;
}

/**
 * The board's card drag and drop, shared by its cells: one move operation on a media type of its
 * own, each drop checked against the cards the board last rendered. `null` without `onMove`.
 */
export function useBoardCardDrag(source: CardDragSource): BoardCardDrag | null {
  const latest = useLatest(source);
  const dragType = useDragType('board-card');
  const dragging = useRef<Key | null>(null);
  const drag = useMemo<BoardCardDrag>(() => {
    const resolveDrop = (address: BoardCellAddress, target: CollectionDropTarget) => {
      const key = dragging.current;
      return key === null
        ? null
        : resolveBoardDrop(latest.current.layout, { key, address, target });
    };
    return {
      dragType,
      resolveDrop,
      setDragging: (key) => {
        dragging.current = key;
      },
      drop: (address, target) => {
        const move = resolveDrop(address, target);
        if (move) latest.current.onMove?.(move);
      },
      getTextValue: (key) => latest.current.getTextValue(key),
    };
  }, [dragType, latest]);
  return source.onMove ? drag : null;
}

/** The board's column drag and drop, shared by its column headers. `null` without `onMove`. */
export function useBoardColumnDrag(source: ColumnDragSource): BoardColumnDrag | null {
  const latest = useLatest(source);
  const dragType = useDragType('board-column');
  const dragging = useRef<Key | null>(null);
  const drag = useMemo<BoardColumnDrag>(
    () => ({
      dragType,
      dragging,
      resolveDrop: (targetKey) => {
        const key = dragging.current;
        return key === null ? null : resolveColumnDrop(latest.current.columns, { key, targetKey });
      },
      onMove: (move) => latest.current.onMove?.(move),
    }),
    [dragType, latest],
  );
  return source.onMove ? drag : null;
}
