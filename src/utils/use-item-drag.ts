'use client';

import { useState, type HTMLAttributes, type RefObject } from 'react';
import { useDrag, useDrop } from '../primitives/index.js';
import type { PressEvent } from '../core/events.js';
import type { Key } from '../core/props.js';
import { mergeProps } from './merge-props.js';

interface ItemMove {
  position: 'before' | 'after' | 'on';
}

interface ItemDragOptions<K extends Key, Move extends ItemMove> {
  ref: RefObject<HTMLElement | null>;
  key: K;
  textValue: string;
  dragType: string;
  dragging: RefObject<K | null> | null;
  isDisabled: boolean;
  /** A disabled tab may still be a landing target for another tab. */
  isDropDisabled?: boolean | undefined;
  resolveMove: (point: { x: number; y: number }) => Move | null;
  onMove: (move: Move) => void;
}

interface ItemDragState<Move extends ItemMove> {
  dragProps: HTMLAttributes<HTMLElement>;
  startDrag: (event: PressEvent) => void;
  /** The id of the building block's description of the drag button, for its `aria-describedby`. */
  describedBy: string | undefined;
  isDragging: boolean;
  dropPosition: Move['position'] | null;
}

/** One item's native move drag and drop, including shared validation and the landing indicator. */
export function useItemDrag<K extends Key, Move extends ItemMove>(
  options: ItemDragOptions<K, Move>,
): ItemDragState<Move> {
  const { ref, key, textValue, dragType, dragging, isDisabled, resolveMove, onMove } = options;
  const [dropPosition, setDropPosition] = useState<Move['position'] | null>(null);
  const { dragProps, dragButtonProps, isDragging } = useDrag({
    hasDragButton: true,
    isDisabled,
    getItems: () => [{ [dragType]: String(key), 'text/plain': textValue }],
    getAllowedDropOperations: () => ['move'],
    onDragStart: () => {
      if (dragging) dragging.current = key;
    },
    onDragEnd: () => {
      if (dragging) dragging.current = null;
    },
  });
  const showDrop = (point: { x: number; y: number }) =>
    setDropPosition(resolveMove(point)?.position ?? null);
  const operationAt = (
    types: { has: (type: string) => boolean },
    allowed: readonly string[],
    point: { x: number; y: number },
  ): 'move' | 'cancel' =>
    types.has(dragType) && allowed.includes('move') && resolveMove(point) ? 'move' : 'cancel';
  const { dropProps } = useDrop({
    ref,
    isDisabled: options.isDropDisabled ?? isDisabled,
    // Keyboard targets are registered separately from pointer hit testing by the building block.
    getDropOperation: (types, allowed) => {
      const box = ref.current?.getBoundingClientRect();
      return operationAt(types, allowed, { x: (box?.width ?? 0) / 2, y: (box?.height ?? 0) / 2 });
    },
    getDropOperationForPoint: (...[types, allowed, x, y]) => operationAt(types, allowed, { x, y }),
    onDropEnter: showDrop,
    onDropMove: showDrop,
    onDropExit: () => setDropPosition(null),
    onDrop: (point) => {
      setDropPosition(null);
      const move = resolveMove(point);
      if (move) onMove(move);
    },
  });
  return {
    dragProps: mergeProps(dragProps, dropProps),
    startDrag: (event) => dragButtonProps.onPress?.(event as never),
    describedBy: dragButtonProps['aria-describedby'],
    isDragging,
    dropPosition,
  };
}
