'use client';

import { measureScale } from '../../utils/element-scale.js';
import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import {
  resolveDragChange,
  type ReadItem,
  type TimelineDragEdge,
  type TimelineItemChange,
} from './timeline-geometry.js';
import { isElement } from '../../utils/is-element.js';

interface TimelineDragOptions {
  read: ReadItem;
  /** The item's own days as the host gives them, without a draft; `null` when they are unreadable. */
  source: ReadItem | null;
  dayWidth: number;
  /** The axis runs right to left, so a drag to the left moves later. */
  isRtl: boolean;
  isEditable: boolean;
  /** The change a drag in progress shows, or `null` when it ends. */
  onDraft: (change: TimelineItemChange | null) => void;
  /** The change a finished drag asks for. */
  onCommit: (change: TimelineItemChange) => void;
}

interface Drag {
  /** Viewport pixels per chart pixel, so pointer travel counts days at any ancestor scale. */
  scale: number;
  originX: number;
  edge: TimelineDragEdge;
  origin: ReadItem;
  days: number;
}

/** Pointer travel, in pixels, past which a press becomes a drag and does not select. */
const dragThreshold = 3;

function readEdge(target: EventTarget, kind: ReadItem['kind']): TimelineDragEdge {
  if (kind === 'milestone' || !isElement(target)) return 'move';
  const edge = target.closest('[data-edge]')?.getAttribute('data-edge');
  return edge === 'start' || edge === 'end' ? edge : 'move';
}

/**
 * Moves an item, or one end of a bar, by whole days under a captured pointer. The days follow the
 * pointer as a draft and are committed when the pointer is released; a cancelled drag drops them.
 */
export function useTimelineDrag({
  read,
  source,
  dayWidth,
  isRtl,
  isEditable,
  onDraft,
  onCommit,
}: TimelineDragOptions) {
  const moved = useRef(false);
  const [isDragging, setDragging] = useState(false);
  // The draft lives above this item. When the item leaves the chart mid-drag (a switch to the
  // table, a collapsed group, a removed row), the pointer helper ends the gesture silently, so the
  // item drops its own draft as it unmounts and the chart comes back to the source dates.
  const owned = useRef<{ hasDraft: boolean; onDraft: TimelineDragOptions['onDraft'] }>({
    hasDraft: false,
    onDraft,
  });
  useLayoutEffect(() => {
    owned.current.onDraft = onDraft;
  });
  useLayoutEffect(() => {
    const current = owned.current;
    return () => {
      if (current.hasDraft) current.onDraft(null);
      current.hasDraft = false;
    };
  }, []);
  const showDraft = (change: TimelineItemChange | null) => {
    owned.current.hasDraft = change !== null;
    onDraft(change);
  };

  const move = (event: PointerEvent<HTMLElement>, active: Drag) => {
    // Later days lie to the left of a right-to-left axis.
    const travel = (event.clientX - active.originX) * (isRtl ? -1 : 1);
    if (Math.abs(travel) >= dragThreshold) moved.current = true;
    const days = Math.round(travel / (dayWidth * active.scale));
    if (days === active.days) return;
    active.days = days;
    showDraft(resolveDragChange(active.origin, active.edge, days));
  };
  const handlers = usePointerDrag<HTMLElement, Drag>({
    isDisabled: !isEditable,
    // A gesture belongs to the dates, kind and geometry it started from. When the host replaces
    // them mid-drag the gesture is given up, so its draft never overwrites the newer dates.
    resetKey: [source?.kind, source?.start, source?.end, dayWidth, isRtl].join('|'),
    onCancel: () => {
      setDragging(false);
      showDraft(null);
    },
    onStart: (event) => {
      moved.current = false;
      setDragging(true);
      const chart = event.currentTarget.closest('.ui-timeline') ?? event.currentTarget;
      return {
        scale: measureScale(chart).x,
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
      showDraft(null);
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
