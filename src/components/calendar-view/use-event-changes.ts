'use client';

// A calendar's event changes: whether the host allows each, the event menus and editor, and the
// event drags (specs/CALENDAR-VIEW.md, UIC-CALENDAR-VIEW-5 and 6).

import { type RefObject, useCallback } from 'react';
import { useEventEditing } from './calendar-event-editor.js';
import {
  type CalendarEventChange,
  type CalendarEventDragMode,
  useEventHandles,
} from './calendar-event-handles.js';
import type { PlacedEvent } from './calendar-layout.js';
import type { CalendarViewEvent, CalendarViewMode, CalendarViewProps } from './calendar-view.js';
import { dayCellSelector } from './use-calendar-grid.js';

/**
 * Whether the reader may make a change to an event: only while the host takes changes, never to a
 * read-only event, and as `canChangeEvent` answers.
 */
function useChangeCheck({
  onEventChange,
  canChangeEvent,
}: Pick<CalendarViewProps, 'onEventChange' | 'canChangeEvent'>) {
  const takesChanges = onEventChange !== undefined;
  return useCallback(
    (event: CalendarViewEvent, change: CalendarEventChange) =>
      takesChanges && event.isReadOnly !== true && (canChangeEvent?.(event, change) ?? true),
    [takesChanges, canChangeEvent],
  );
}

/** The event menus, editor and handles of a calendar, from its props. */
export function useEventChanges(
  props: Pick<
    CalendarViewProps,
    'onEventChange' | 'canChangeEvent' | 'onEventMenuAction' | 'eventMenuIcons' | 'timeZone'
  > & {
    eventMenu: NonNullable<CalendarViewProps['eventMenu']>;
    eventDragMode: CalendarEventDragMode;
    mode: CalendarViewMode;
    timeZone: string;
    onFocusedChange: (date: string) => void;
  },
  { placed, gridRef }: { placed: PlacedEvent[]; gridRef: RefObject<HTMLElement | null> },
) {
  const { mode, timeZone, onFocusedChange } = props;
  const allows = useChangeCheck(props);
  const handles = useEventHandles({
    events: placed,
    mode,
    dragMode: props.eventDragMode,
    timeZone,
    onEventChange: props.onEventChange,
    allows,
    onMoved: onFocusedChange,
  });
  const editing = useEventEditing({
    events: placed,
    timeZone,
    onEventChange: props.onEventChange,
    isEditable: (event) => allows(event, 'edit'),
    eventMenu: props.eventMenu,
    onEventMenuAction: props.onEventMenuAction,
    eventMenuIcons: props.eventMenuIcons,
    findDayCell: () =>
      gridRef.current?.querySelector<HTMLElement>(`${dayCellSelector}[tabindex="0"]`) ?? null,
    onMoved: onFocusedChange,
  });
  return { ...editing, handles: handles.context, drawn: handles.drawn };
}
