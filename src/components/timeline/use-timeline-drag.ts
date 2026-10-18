import { useRef, useState, type PointerEvent } from 'react';
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
  pointerId: number;
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
  const drag = useRef<Drag | null>(null);
  const moved = useRef(false);
  const [isDragging, setDragging] = useState(false);

  const finish = (event: PointerEvent<HTMLElement>, shouldCommit: boolean) => {
    const active = drag.current;
    if (active?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    const target = event.currentTarget;
    if (target.hasPointerCapture?.(event.pointerId)) target.releasePointerCapture(event.pointerId);
    if (shouldCommit && active.days !== 0) {
      onCommit(resolveDragChange(active.origin, active.edge, active.days));
    }
    onDraft(null);
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    moved.current = false;
    if (!isEditable || event.button !== 0 || event.isPrimary === false || drag.current) return;
    const edge = readEdge(event.target, read.kind);
    drag.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      edge,
      origin: read,
      days: 0,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const active = drag.current;
    if (active?.pointerId !== event.pointerId) return;
    const travel = event.clientX - active.originX;
    if (Math.abs(travel) >= dragThreshold) moved.current = true;
    const days = Math.round(travel / dayWidth);
    if (days === active.days) return;
    active.days = days;
    onDraft(resolveDragChange(active.origin, active.edge, days));
  };

  return {
    isDragging,
    /** Whether the last press dragged, so the click it ends does not select; reading resets it. */
    consumeDrag: () => {
      const hasMoved = moved.current;
      moved.current = false;
      return hasMoved;
    },
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLElement>) => {
        onPointerMove(event);
        finish(event, true);
      },
      onPointerCancel: (event: PointerEvent<HTMLElement>) => finish(event, false),
      onLostPointerCapture: (event: PointerEvent<HTMLElement>) => finish(event, false),
    },
  };
}
