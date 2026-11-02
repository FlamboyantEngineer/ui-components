'use client';

// Dragging an editable event: its body moves it, or its start and end edges move those alone, by
// pointer with a preview where it would land, and by the arrow keys (specs/CALENDAR-VIEW.md,
// UIC-CALENDAR-VIEW-6).

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { useUiStrings } from '../../core/provider.js';
import { parseIsoDate, useLocale } from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { isFocused } from '../../utils/focus-target.js';
import { capturePointer } from '../../utils/pointer-drag.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import {
  changeEvent,
  type CalendarEventGesture,
  type EventShift,
} from './calendar-event-change.js';
import { readEvents, type PlacedEvent } from './calendar-layout.js';
import type { CalendarViewEvent, CalendarViewMode } from './calendar-view.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
import { dayCellSelector } from './use-calendar-grid.js';

/** Where an event is drawn: a bar across days, or a block on a day's time grid. */
export type EventPlacement = 'bar' | 'block';

/**
 * What dragging an editable event does: `move` drags the event to move it and its end to change
 * the end; `resize` drags its start and its end to change each alone.
 */
export type CalendarEventDragMode = 'move' | 'resize';

/** The change of an event the host is asked to allow: editing it, moving it, or moving an end. */
export type CalendarEventChange = 'edit' | 'move' | 'resize';

/** A drag in progress: the event as it is, and the event where it would land, if it changed. */
export interface EventDrag {
  event: CalendarViewEvent;
  next: CalendarViewEvent | null;
}

/** What every event's drags need from its calendar. */
export interface CalendarEventHandlesContext {
  mode: CalendarViewMode;
  dragMode: CalendarEventDragMode;
  timeZone: string;
  /** Whether the host lets the reader make the change. */
  allows: (event: CalendarViewEvent, change: CalendarEventChange) => boolean;
  /**
   * Starts or updates a drag of `event` with where it would land (`null` while that is where it
   * is), or ends it.
   */
  preview: (drag: EventDrag | null) => void;
  /** The key identity of the event being dragged, past the drag threshold, or `null`. */
  dragged: string | null;
  /** Hands the host a changed event; a keyboard step then keeps focus on what it stepped. */
  commit: (
    next: CalendarViewEvent,
    previous: CalendarViewEvent,
    refocus: CalendarEventGesture | null,
  ) => void;
  /** The event or edge to focus once its event is drawn again after a keyboard step. */
  refocus: RefObject<{ identity: string; gesture: CalendarEventGesture } | null>;
}

/** The snap of a dragged timed event, in minutes. */
const snapMinutes = 15;

const timedSelector = `.${hooks.slotClass('timed')}`;

interface PointerPlace {
  day: string;
  /** The wall-clock minute under the pointer on a day's time grid, or `null` off it. */
  minutes: number | null;
}

/**
 * The day under a point of the grid, and the minute of its time grid when over it. Days are found
 * by their boxes, not by the element hit: a bar drawn across days sits in the cell it starts in.
 */
function readPlace(grid: Element, x: number, y: number): PointerPlace | null {
  const cells = grid.querySelectorAll<HTMLElement>(dayCellSelector);
  for (const cell of cells) {
    const box = cell.getBoundingClientRect();
    const day = cell.dataset.date;
    if (!day || x < box.left || x >= box.right || y < box.top || y >= box.bottom) continue;
    const time = cell.querySelector(timedSelector)?.getBoundingClientRect();
    const isOverTime = time !== undefined && time.height > 0 && y >= time.top;
    const minutes = isOverTime ? clamp(((y - time.top) / time.height) * 1440, 0, 1440) : null;
    return { day, minutes };
  }
  return null;
}

function countDays(from: string, to: string): number {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  return start && end ? end.compare(start) : 0;
}

/** The shift from where a drag began to where the pointer is, timed minutes snapped. */
function readShift(origin: PointerPlace, place: PointerPlace, last: EventShift): EventShift {
  const days = countDays(origin.day, place.day);
  if (origin.minutes === null || place.minutes === null) return { days, minutes: last.minutes };
  const minutes = Math.round((place.minutes - origin.minutes) / snapMinutes) * snapMinutes;
  return { days, minutes };
}

/**
 * The shift one arrow key asks for: Left and Right a day (mirrored right to left); Up and Down
 * `snapMinutes` on a time grid, else a week. A bar changes by whole days only.
 */
function readKeyShift(key: string, placement: EventPlacement, isRtl: boolean): EventShift | null {
  const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
  const back = isRtl ? 'ArrowRight' : 'ArrowLeft';
  if (key === forward) return { days: 1, minutes: 0 };
  if (key === back) return { days: -1, minutes: 0 };
  const step = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
  if (step === 0) return null;
  return placement === 'block'
    ? { days: 0, minutes: step * snapMinutes }
    : { days: step * 7, minutes: 0 };
}

interface DragState {
  grid: Element;
  origin: PointerPlace;
  /** Where the press began, to tell a drag from a click. */
  x: number;
  y: number;
  hasMoved: boolean;
  shift: EventShift;
}

/** How far the pointer travels before a press becomes a drag, in pixels. */
const dragThreshold = 4;

/** Escape abandons a drag in progress, wherever focus is. */
function useEscapeCancel(
  isDragging: boolean,
  cancel: () => void,
  owner: RefObject<Element | null>,
) {
  useEffect(() => {
    const document = owner.current?.ownerDocument;
    if (!isDragging || !document) return undefined;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isDragging, cancel, owner]);
}

/** Gives focus back to an event or edge drawn again after its keyboard step changed the event. */
export function useRefocus(
  ref: RefObject<HTMLElement | null>,
  context: CalendarEventHandlesContext,
  target: { id: CalendarViewEvent['id']; gesture: CalendarEventGesture },
) {
  const { refocus: refocusRef } = context;
  const identity = toKeyIdentity(target.id);
  useLayoutEffect(() => {
    const pending = refocusRef.current;
    if (pending?.identity !== identity || pending.gesture !== target.gesture) return;
    refocusRef.current = null;
    if (ref.current && !isFocused(ref.current)) ref.current.focus();
  });
}

interface EventDragOptions {
  placed: PlacedEvent;
  gesture: CalendarEventGesture;
  placement: EventPlacement;
  context: CalendarEventHandlesContext;
  isDisabled: boolean;
  /** The dragged element, for Escape while dragging. */
  ownerRef: RefObject<Element | null>;
}

/**
 * One drag of an event, by pointer and by the arrow keys. A press becomes a drag once the pointer
 * travels `dragThreshold` pixels; it then previews where the event would land and hands the host
 * the change on release. Escape, a cancelled pointer, or a change of the event or of what the host
 * allows abandons it. `consumeClick` tells, once, whether the press that just ended was a drag, so
 * its release does not also count as a click.
 */
export function useEventDrag(options: EventDragOptions) {
  const { placed, gesture, placement, context, isDisabled, ownerRef } = options;
  const isRtl = useLocale().direction === 'rtl';
  const { event } = placed;
  const [cancelCount, setCancelCount] = useState(0);
  const [isDragging, setDragging] = useState(false);
  const dragged = useRef(false);
  const resetKey = useMemo(() => ({ event, cancelCount }), [event, cancelCount]);
  const change = (shift: EventShift) =>
    changeEvent(
      placed,
      { gesture, shift: placement === 'bar' ? { ...shift, minutes: 0 } : shift },
      context.timeZone,
    );
  const pointer = usePointerDrag<HTMLElement, DragState>({
    isDisabled,
    resetKey,
    // An event or edge that leaves mid-drag, as when it stops being editable, clears its preview.
    cancelsOnUnmount: true,
    onStart: (press: PointerEvent<HTMLElement>) => {
      dragged.current = false;
      const grid = press.currentTarget.closest('[role="grid"]');
      const origin = grid ? readPlace(grid, press.clientX, press.clientY) : null;
      if (!grid || !origin) return null;
      const { clientX: x, clientY: y, currentTarget, pointerId } = press;
      // React Aria's press releases the capture during pointerdown, before this microtask runs.
      queueMicrotask(() => capturePointer({ currentTarget, pointerId }));
      return { grid, origin, x, y, hasMoved: false, shift: { days: 0, minutes: 0 } };
    },
    onMove: (move, state) => {
      if (
        !state.hasMoved &&
        Math.hypot(move.clientX - state.x, move.clientY - state.y) < dragThreshold
      )
        return;
      if (!state.hasMoved) setDragging(true);
      state.hasMoved = true;
      dragged.current = true;
      const place = readPlace(state.grid, move.clientX, move.clientY);
      if (!place) return;
      state.shift = readShift(state.origin, place, state.shift);
      context.preview({ event, next: change(state.shift) });
    },
    onEnd: (_release, state, isCancelled) => {
      setDragging(false);
      context.preview(null);
      const next = isCancelled || !state.hasMoved ? null : change(state.shift);
      if (next) context.commit(next, event, null);
    },
    onCancel: () => {
      setDragging(false);
      context.preview(null);
    },
  });
  useEscapeCancel(isDragging, () => setCancelCount((count) => count + 1), ownerRef);
  return {
    pointer,
    isDragging,
    consumeClick() {
      const wasDrag = dragged.current;
      dragged.current = false;
      return wasDrag;
    },
    /** Steps the event by an arrow key; whether the key was one. */
    onKey(key: KeyboardEvent<HTMLElement>) {
      const shift = isDisabled ? null : readKeyShift(key.key, placement, isRtl);
      if (!shift) return false;
      key.preventDefault();
      const next = change(shift);
      if (next) context.commit(next, event, gesture);
      return true;
    },
  };
}

interface EventEdgeProps {
  placed: PlacedEvent;
  edge: 'start' | 'end';
  placement: EventPlacement;
  context: CalendarEventHandlesContext;
  isTabbable: boolean;
}

/**
 * An event's start or end edge: an invisible button over that edge of the event that drags it, or
 * steps it by the arrow keys, changing that end of the event alone.
 */
export function EventEdge({ placed, edge, placement, context, isTabbable }: EventEdgeProps) {
  const strings = useUiStrings();
  const ref = useRef<HTMLButtonElement>(null);
  const { event } = placed;
  const drag = useEventDrag({
    placed,
    gesture: edge,
    placement,
    context,
    isDisabled: false,
    ownerRef: ref,
  });
  useRefocus(ref, context, { id: event.id, gesture: edge });
  return (
    <button
      {...drag.pointer}
      {...hooks.slot(edge === 'start' ? 'event-start' : 'event-end', { dragging: drag.isDragging })}
      ref={ref}
      type="button"
      tabIndex={isTabbable ? 0 : -1}
      aria-label={
        edge === 'start'
          ? strings.changeEventStart(event.title)
          : strings.changeEventEnd(event.title)
      }
      onKeyDown={(key) => {
        if (drag.onKey(key)) key.stopPropagation();
      }}
    />
  );
}

/**
 * What an event offers to drag where it is drawn, as the host allows: in the `move` mode its body
 * moves it and its last part's end edge changes its end; in the `resize` mode its first part's
 * start edge and its last part's end edge change those alone. Edges show only on a bar across days
 * or a block on a time grid. An event in a crowded day's list, or a preview, offers nothing.
 */
export function readGestures(
  placed: PlacedEvent,
  where: { placement: EventPlacement | 'list'; continuesBefore: boolean; continuesAfter: boolean },
  context: CalendarEventHandlesContext,
): { move: boolean; edges: Array<'start' | 'end'> } {
  if (where.placement === 'list' || placed.isPreview) return { move: false, edges: [] };
  const { event } = placed;
  const fits = where.placement === 'block' || placed.isSpan;
  const resizes = fits && context.allows(event, 'resize');
  const isMoveMode = context.dragMode === 'move';
  const edges: Array<'start' | 'end'> = [];
  if (resizes && !isMoveMode && !where.continuesBefore) edges.push('start');
  if (resizes && !where.continuesAfter) edges.push('end');
  return { move: isMoveMode && context.allows(event, 'move'), edges };
}

interface EventHandlesOptions {
  events: readonly PlacedEvent[];
  mode: CalendarViewMode;
  dragMode: CalendarEventDragMode;
  timeZone: string;
  onEventChange: ((next: CalendarViewEvent, previous: CalendarViewEvent) => void) | undefined;
  allows: (event: CalendarViewEvent, change: CalendarEventChange) => boolean;
  /** Shows the day an event a keyboard step moved now starts on. */
  onMoved: (day: string) => void;
}

/**
 * The drags' contract with the calendar, and the events to draw: the host's, with the preview of
 * a dragged event added where it would land.
 */
export function useEventHandles(options: EventHandlesOptions) {
  const { events, mode, dragMode, timeZone, onEventChange, allows, onMoved } = options;
  const [drag, setDrag] = useState<EventDrag | null>(null);
  const dragged = drag ? toKeyIdentity(drag.event.id) : null;
  const refocus = useRef<{ identity: string; gesture: CalendarEventGesture } | null>(null);
  const context = useMemo<CalendarEventHandlesContext>(
    () => ({
      mode,
      dragMode,
      timeZone,
      allows,
      preview: setDrag,
      dragged,
      refocus,
      commit: (next, previous, gesture) => {
        if (gesture) refocus.current = { identity: toKeyIdentity(next.id), gesture };
        onEventChange?.(next, previous);
        const [placed] = readEvents([next], timeZone);
        if (gesture && placed) onMoved(placed.startDay);
      },
    }),
    [mode, dragMode, timeZone, allows, dragged, onEventChange, onMoved],
  );
  const drawn = useMemo(() => {
    const [placed] = drag?.next ? readEvents([drag.next], timeZone) : [];
    return placed ? [...events, { ...placed, isPreview: true }] : events;
  }, [events, drag, timeZone]);
  return { context, drawn };
}
