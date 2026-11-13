'use client';

import { type RefObject, useRef } from 'react';
import { useDragType } from '../../utils/use-drag-type.js';
import { useItemDrag } from '../../utils/use-item-drag.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';

export interface ChatQueueReorder {
  draggingRef: RefObject<string | null>;
  dragType: string;
  queue: readonly ChatQueuedMessage[];
  onMove: ((queue: readonly ChatQueuedMessage[]) => void) | undefined;
}

/** The queue alone owns this drag type, so another chat cannot take its messages. */
export function useQueueReorder(
  queue: ChatQueueReorder['queue'],
  onMove: ChatQueueReorder['onMove'],
): ChatQueueReorder {
  const draggingRef = useRef<string | null>(null);
  return { draggingRef, dragType: useDragType('chat-queue'), queue, onMove };
}

/** Moves a queued message to another's place, keeping the rest in their relative order. */
function moveQueuedMessage(reorder: ChatQueueReorder, id: string, targetId: string) {
  const from = reorder.queue.findIndex((entry) => entry.id === id);
  const to = reorder.queue.findIndex((entry) => entry.id === targetId);
  const entry = reorder.queue[from];
  if (!entry || to < 0 || from === to) return;
  const next = reorder.queue.filter((item) => item.id !== id);
  next.splice(to, 0, entry);
  reorder.onMove?.(next);
}

/** React Aria pointer and keyboard dragging, armed only by this row's handle. */
export function useQueueRowDrag(entry: ChatQueuedMessage, reorder: ChatQueueReorder) {
  const ref = useRef<HTMLLIElement>(null);
  const resolveMove = () => {
    const from = reorder.queue.findIndex((item) => item.id === reorder.draggingRef.current);
    const to = reorder.queue.findIndex((item) => item.id === entry.id);
    return from < 0 || to < 0 || from === to
      ? null
      : { position: from < to ? ('after' as const) : ('before' as const) };
  };
  const drag = useItemDrag({
    ref,
    key: entry.id,
    textValue: entry.text,
    dragType: reorder.dragType,
    dragging: reorder.draggingRef,
    isDisabled: !reorder.onMove,
    resolveMove,
    onMove: () => {
      const id = reorder.draggingRef.current;
      if (id !== null) moveQueuedMessage(reorder, id, entry.id);
    },
  });
  return { ref, ...drag };
}
