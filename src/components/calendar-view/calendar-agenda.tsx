'use client';

import { type ReactNode, useId } from 'react';
import { useHeadingLevel } from '../../core/heading-level.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { CalendarDayContext } from './calendar-day.js';
import { CalendarEventButton, type CalendarEventContext, toEventKey } from './calendar-event.js';
import { type AgendaDay, layoutAgenda, type PlacedEvent } from './calendar-layout.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';

interface CalendarAgendaProps {
  /** The days of the period on show. */
  days: readonly string[];
  events: readonly PlacedEvent[];
  titleId: string;
  /** Whether days without events are listed, under their heading with no events. */
  emptyDays: 'hide' | 'show';
  /** Draws the agenda while its period holds no event; defaults to the provider's `noEvents`. */
  renderEmptyState: (() => ReactNode) | undefined;
  day: CalendarDayContext;
  event: CalendarEventContext;
}

/**
 * One day of the agenda: a group named by its heading, the day in full, holding the caller's
 * `renderDay` content and a list of its events. It takes focus from a focused event that leaves.
 */
function AgendaDaySection({
  entry,
  day,
  event,
}: { entry: AgendaDay } & Pick<CalendarAgendaProps, 'day' | 'event'>) {
  const headingId = useId();
  const Heading = `h${useHeadingLevel(undefined)}` as const;
  const isToday = entry.date === day.today;
  const content = day.renderDay?.({
    date: entry.date,
    isToday,
    isOutsideMonth: false,
    events: entry.events.map((placed) => placed.event),
  });
  return (
    <div
      role="group"
      aria-labelledby={headingId}
      aria-current={isToday ? 'date' : undefined}
      data-date={entry.date}
      tabIndex={-1}
      {...hooks.slot('agenda-day', { today: isToday })}
    >
      <Heading id={headingId} {...hooks.slot('agenda-heading')}>
        {day.format.formatDay(entry.date)}
      </Heading>
      {isEmptyNode(content) ? null : <div {...hooks.slot('day-content')}>{content}</div>}
      {entry.events.length > 0 ? (
        <ul {...hooks.slot('agenda-events')}>
          {entry.events.map((placed) => (
            <li key={toEventKey(placed)} {...hooks.slot('agenda-item')}>
              <CalendarEventButton
                placed={placed}
                context={event}
                isTabbable
                time="agenda"
                placement="list"
                continuesBefore={placed.startDay < entry.date}
                continuesAfter={placed.endDay > entry.date}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * The agenda view: the events of the focused day's week or month listed by day, each day under a
 * heading, all-day events first and then by start time; with no event in the period, the empty state.
 */
export function CalendarAgenda({
  days,
  events,
  titleId,
  emptyDays,
  renderEmptyState,
  day,
  event,
}: CalendarAgendaProps) {
  const strings = useUiStrings();
  const listed = layoutAgenda(days, events, { emptyDays });
  const hasEvents = listed.some((entry) => entry.events.length > 0);
  const empty = renderEmptyState?.();
  return (
    <div role="group" aria-labelledby={titleId} {...hooks.slot('agenda')}>
      {hasEvents ? null : (
        // An empty period says so, whether or not its empty days are listed.
        <div {...hooks.slot('agenda-empty')}>{isEmptyNode(empty) ? strings.noEvents : empty}</div>
      )}
      {listed.map((entry) => (
        <AgendaDaySection key={entry.date} entry={entry} day={day} event={event} />
      ))}
    </div>
  );
}
