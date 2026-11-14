'use client';

// A calendar's event changes: whether the host allows each, the event menus, and the
// event drags (specs/CALENDAR-VIEW.md, UIC-CALENDAR-VIEW-5 and 6).

import { useCallback, useMemo } from 'react';
import {
  type CalendarEventChange,
  type CalendarEventDragMode,
  useEventHandles,
} from './calendar-event-handles.js';
import type { CalendarEventMenuContext } from './calendar-event-menu.js';
import type { PlacedEvent } from './calendar-layout.js';
import type { CalendarViewEvent, CalendarViewMode, CalendarViewProps } from './calendar-view.js';

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

/** The event menus and handles of a calendar, from its props. */
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
  { placed }: { placed: PlacedEvent[] },
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
  const { eventMenu, onEventMenuAction, eventMenuIcons } = props;
  const menu = useMemo<CalendarEventMenuContext>(
    () => ({
      entries: eventMenu,
      onAction: onEventMenuAction,
      icons: eventMenuIcons,
      isEditable: (event) => allows(event, 'edit'),
    }),
    [eventMenu, onEventMenuAction, eventMenuIcons, allows],
  );
  return { menu, handles: handles.context, drawn: handles.drawn };
}
