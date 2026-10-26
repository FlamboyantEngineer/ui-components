import type { ReactNode } from 'react';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { CalendarViewDay } from './calendar-view.js';
import type { PlacedEvent } from './calendar-layout.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
import type { CalendarFormat } from './use-calendar-format.js';

/** What a calendar grid's day cells share. */
export interface CalendarDayContext {
  focused: string;
  today: string;
  format: CalendarFormat;
  renderDay: ((day: CalendarViewDay) => ReactNode) | undefined;
}

interface CalendarDayCellProps {
  day: string;
  context: CalendarDayContext;
  /** The events that cover the day. */
  events: readonly PlacedEvent[];
  /** The day belongs to a neighbouring month of a month view. */
  isOutsideMonth: boolean;
  /** Shows the day of the month in the cell (a week view shows it in the column header). */
  showNumber: boolean;
  children?: ReactNode;
}

/** The events of `events` that cover `day`. */
export function findDayEvents(events: readonly PlacedEvent[], day: string): PlacedEvent[] {
  return events.filter((placed) => placed.startDay <= day && placed.endDay >= day);
}

/**
 * A day of a calendar grid: a grid cell whose name starts with the day in full (hidden text), the
 * grid's tab stop while it is the focused day, marked as today with `aria-current="date"`, holding
 * the caller's `renderDay` content and the day's events.
 */
export function CalendarDayCell({
  day,
  context,
  events,
  isOutsideMonth,
  showNumber,
  children,
}: CalendarDayCellProps) {
  const { focused, today, format, renderDay } = context;
  const isToday = day === today;
  const content = renderDay?.({
    date: day,
    isToday,
    isOutsideMonth,
    events: events.map((placed) => placed.event),
  });
  return (
    <div
      role="gridcell"
      tabIndex={day === focused ? 0 : -1}
      aria-current={isToday ? 'date' : undefined}
      data-date={day}
      {...hooks.slot('day', { today: isToday, outsideMonth: isOutsideMonth })}
    >
      <VisuallyHidden elementType="span">{format.formatDay(day)}</VisuallyHidden>
      {showNumber ? (
        <span aria-hidden="true" {...hooks.slot('day-number')}>
          {format.formatDayNumber(day)}
        </span>
      ) : null}
      {isEmptyNode(content) ? null : <div {...hooks.slot('day-content')}>{content}</div>}
      {children}
    </div>
  );
}
