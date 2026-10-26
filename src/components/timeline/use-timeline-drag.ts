import { useRef, useState, type PointerEvent } from 'react';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import {
  resolveDragChange,
  type ReadItem,
  type TimelineDragEdge,
  type TimelineItemChange,
} from './timeline-geometry.js';

export interface TimelineDragOptions {
  read: ReadItem;
  dayWidth: number;
  isEditable: boolean;
  /** The change a drag in progress shows, or `null` when it ends. */
  onDraft: (change: TimelineItemChange | null) => void;
  /** The change a finished drag asks for. */
  onCommit: (change: TimelineItemChange) => void;
}

interface Drag {
  originX: number;
  edge: TimelineDragEdge;
  origin: ReadItem;
  days: number;
}

/** Pointer travel, in pixels, past which a press becomes a drag and does not select. */
const dragThreshold = 3;

function readEdge(target: EventTarget, kind: ReadItem['kind']): TimelineDragEdge {
  if (kind === 'milestone' || !(target instanceof Element)) return 'move';
  const edge = target.closest('[data-edge]')?.getAttribute('data-edge');
  return edge === 'start' || edge === 'end' ? edge : 'move';
}

/**
 * Moves an item, or one end of a bar, by whole days under a captured pointer. The days follow the
 * pointer as a draft and are committed when the pointer is released; a cancelled drag drops them.
 */
export function useTimelineDrag({
  read,
  dayWidth,
  isEditable,
  onDraft,
  onCommit,
}: TimelineDragOptions) {
  const moved = useRef(false);
  const [isDragging, setDragging] = useState(false);

  const move = (event: PointerEvent<HTMLElement>, active: Drag) => {
    const travel = event.clientX - active.originX;
    if (Math.abs(travel) >= dragThreshold) moved.current = true;
    const days = Math.round(travel / dayWidth);
    if (days === active.days) return;
    active.days = days;
    onDraft(resolveDragChange(active.origin, active.edge, days));
  };
  const handlers = usePointerDrag<HTMLElement, Drag>({
    isDisabled: !isEditable,
    onCancel: () => {
      setDragging(false);
      onDraft(null);
    },
    onStart: (event) => {
      moved.current = false;
      setDragging(true);
      return {
        originX: event.clientX,
        edge: readEdge(event.target, read.kind),
        origin: read,
        days: 0,
      };
    },
    onMove: move,
    onEnd: (event, active, isCancelled) => {
      if (!isCancelled) move(event, active);
      // No click follows a cancelled gesture or lost capture to consume the flag, and a stale one
      // would swallow the next Enter or Space on the item.
      if (event.type !== 'pointerup') moved.current = false;
      setDragging(false);
      if (!isCancelled && active.days !== 0) {
        onCommit(resolveDragChange(active.origin, active.edge, active.days));
      }
      onDraft(null);
    },
  });

  return {
    isDragging,
    /** Whether the last press dragged, so the click it ends does not select; reading resets it. */
    consumeDrag: () => {
      const hasMoved = moved.current;
      moved.current = false;
      return hasMoved;
    },
    handlers,
  };
}
