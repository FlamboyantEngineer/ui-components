'use client';

// The move and resize handles of an editable event: buttons that drag the event by pointer, with a
// preview where it would land, and step it by the arrow keys (specs/CALENDAR-VIEW.md,
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
import { DragHandleGlyph } from '../../core/glyphs.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { parseIsoDate, useLocale } from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { isFocused } from '../../utils/focus-target.js';
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

/** What every event's handles need from its calendar. */
export interface CalendarEventHandlesContext {
  mode: CalendarViewMode;
  timeZone: string;
  /** Whether the host lets the reader move or resize the event. */
  allows: (event: CalendarViewEvent, gesture: CalendarEventGesture) => boolean;
  /** Shows where a dragged event would land, or nothing. */
  preview: (next: CalendarViewEvent | null) => void;
  /** Hands the host a changed event; a keyboard step then keeps focus on its handle. */
  commit: (
    next: CalendarViewEvent,
    previous: CalendarViewEvent,
    refocus: CalendarEventGesture | null,
  ) => void;
  /** The handle to focus once its event is drawn again after a keyboard step. */
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
 * `snapMinutes` on a time grid, else a week. A resize of a bar moves its end by days only.
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
  shift: EventShift;
}

interface EventHandleProps {
  placed: PlacedEvent;
  gesture: CalendarEventGesture;
  placement: EventPlacement;
  context: CalendarEventHandlesContext;
  isTabbable: boolean;
}

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

/** Gives focus back to a handle drawn again after its keyboard step moved the event. */
function useRefocus(
  ref: RefObject<HTMLButtonElement | null>,
  context: CalendarEventHandlesContext,
  target: { identity: string; gesture: CalendarEventGesture },
) {
  const { refocus: refocusRef } = context;
  useLayoutEffect(() => {
    const pending = refocusRef.current;
    if (pending?.identity !== target.identity || pending.gesture !== target.gesture) return;
    refocusRef.current = null;
    if (ref.current && !isFocused(ref.current)) ref.current.focus();
  });
}

/**
 * A move or resize handle of an event: a pointer drag previews where the event would land and
 * hands the host the change on release; Escape, a cancelled pointer, or a change of the event or
 * its editability abandons it. The arrow keys step the event and hand each step to the host.
 */
export function EventHandle({ placed, gesture, placement, context, isTabbable }: EventHandleProps) {
  const strings = useUiStrings();
  const isRtl = useLocale().direction === 'rtl';
  const ref = useRef<HTMLButtonElement>(null);
  const { event } = placed;
  const [cancelCount, setCancelCount] = useState(0);
  const [isDragging, setDragging] = useState(false);
  const resetKey = useMemo(() => ({ event, cancelCount }), [event, cancelCount]);
  const change = (shift: EventShift) => changeEvent(placed, { gesture, shift }, context.timeZone);
  const drag = usePointerDrag<HTMLButtonElement, DragState>({
    resetKey,
    // A handle that leaves mid-drag, as when its event stops being editable, clears its preview.
    cancelsOnUnmount: true,
    onStart: (pointer: PointerEvent<HTMLButtonElement>) => {
      const grid = pointer.currentTarget.closest('[role="grid"]');
      const origin = grid ? readPlace(grid, pointer.clientX, pointer.clientY) : null;
      if (!grid || !origin) return null;
      pointer.preventDefault();
      setDragging(true);
      return { grid, origin, shift: { days: 0, minutes: 0 } };
    },
    onMove: (pointer, state) => {
      const place = readPlace(state.grid, pointer.clientX, pointer.clientY);
      if (!place) return;
      const shift = readShift(state.origin, place, state.shift);
      state.shift = placement === 'bar' ? { days: shift.days, minutes: 0 } : shift;
      context.preview(change(state.shift));
    },
    onEnd: (_pointer, state, isCancelled) => {
      setDragging(false);
      context.preview(null);
      const next = isCancelled ? null : change(state.shift);
      if (next) context.commit(next, event, null);
    },
    onCancel: () => {
      setDragging(false);
      context.preview(null);
    },
  });
  useEscapeCancel(isDragging, () => setCancelCount((count) => count + 1), ref);
  useRefocus(ref, context, { identity: toKeyIdentity(event.id), gesture });
  const onKeyDown = (key: KeyboardEvent<HTMLButtonElement>) => {
    const shift = readKeyShift(key.key, placement, isRtl);
    if (!shift) return;
    key.preventDefault();
    key.stopPropagation();
    const next = change(placement === 'bar' ? { ...shift, minutes: 0 } : shift);
    if (next) context.commit(next, event, gesture);
  };
  return (
    <button
      {...drag}
      {...hooks.slot(gesture === 'move' ? 'event-move' : 'event-resize', { dragging: isDragging })}
      ref={ref}
      type="button"
      tabIndex={isTabbable ? 0 : -1}
      aria-label={
        gesture === 'move' ? strings.moveEvent(event.title) : strings.resizeEvent(event.title)
      }
      onKeyDown={onKeyDown}
    >
      {gesture === 'move' ? <Glyph icon={DragHandleGlyph} /> : null}
    </button>
  );
}

/**
 * The gestures an event's handles offer where it is drawn: a move handle on its first part and a
 * resize handle on its last, while the host allows each; a resize only on a bar across days or a
 * block on a time grid. An event in a crowded day's list offers none.
 */
export function readGestures(
  placed: PlacedEvent,
  where: { placement: EventPlacement | 'list'; continuesBefore: boolean; continuesAfter: boolean },
  context: CalendarEventHandlesContext,
): CalendarEventGesture[] {
  const { placement } = where;
  if (placement === 'list' || placed.isPreview) return [];
  const canMove = !where.continuesBefore && context.allows(placed.event, 'move');
  const fitsResize = placement === 'block' || placed.isSpan;
  const canResize = fitsResize && !where.continuesAfter && context.allows(placed.event, 'resize');
  return [...(canMove ? ['move' as const] : []), ...(canResize ? ['resize' as const] : [])];
}

/** The change of an event the host is asked to allow: editing it, moving it or resizing it. */
export type CalendarEventChange = 'edit' | CalendarEventGesture;

interface EventHandlesOptions {
  events: readonly PlacedEvent[];
  mode: CalendarViewMode;
  timeZone: string;
  onEventChange: ((next: CalendarViewEvent, previous: CalendarViewEvent) => void) | undefined;
  allows: (event: CalendarViewEvent, change: CalendarEventChange) => boolean;
  /** Shows the day an event a keyboard step moved now starts on. */
  onMoved: (day: string) => void;
}

/**
 * The handles' contract with the calendar, and the events to draw: the host's, with the preview of
 * a dragged event added where it would land.
 */
export function useEventHandles(options: EventHandlesOptions) {
  const { events, mode, timeZone, onEventChange, allows, onMoved } = options;
  const [preview, setPreview] = useState<CalendarViewEvent | null>(null);
  const refocus = useRef<{ identity: string; gesture: CalendarEventGesture } | null>(null);
  const context = useMemo<CalendarEventHandlesContext>(
    () => ({
      mode,
      timeZone,
      allows,
      preview: setPreview,
      refocus,
      commit: (next, previous, gesture) => {
        if (gesture) refocus.current = { identity: toKeyIdentity(next.id), gesture };
        onEventChange?.(next, previous);
        const [placed] = readEvents([next], timeZone);
        if (gesture && placed) onMoved(placed.startDay);
      },
    }),
    [mode, timeZone, allows, onEventChange, onMoved],
  );
  const drawn = useMemo(() => {
    const [placed] = preview ? readEvents([preview], timeZone) : [];
    return placed ? [...events, { ...placed, isPreview: true }] : events;
  }, [events, preview, timeZone]);
  return { context, drawn };
}
