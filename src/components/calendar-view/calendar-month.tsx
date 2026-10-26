import { findMaximum } from '../../utils/find-maximum.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { CalendarDayCell, findDayEvents, type CalendarDayContext } from './calendar-day.js';
import {
  CalendarEventButton,
  CalendarMoreEvents,
  type CalendarEventContext,
} from './calendar-event.js';
import {
  countVisibleLanes,
  findColumnSegments,
  layoutWeek,
  type PlacedEvent,
  type WeekSegment,
} from './calendar-layout.js';
import { getMonthWeeks, isSameMonth } from './calendar-days.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
import type { CalendarGrid } from './use-calendar-grid.js';

export interface CalendarMonthProps {
  events: readonly PlacedEvent[];
  grid: CalendarGrid;
  titleId: string;
  /** The most rows of events a day shows, the `+n more` button included. */
  maxEvents: number;
  day: CalendarDayContext;
  event: CalendarEventContext;
}

interface MonthDayProps extends Omit<CalendarMonthProps, 'grid' | 'titleId'> {
  date: string;
  column: number;
  segments: readonly WeekSegment[];
  visibleLanes: number;
}

/** One day of the month: its bars lane by lane, spacers where a lane is taken or empty, then `+n more`. */
function MonthDay({ date, column, segments, visibleLanes, events, day, event }: MonthDayProps) {
  const covering = findColumnSegments(segments, column);
  const shown = covering.filter((segment) => segment.lane < visibleLanes);
  const laneCount = findMaximum(shown, (segment) => segment.lane + 1, 0);
  const isActive = date === day.focused;
  const isOutsideMonth = !isSameMonth(date, day.focused);
  return (
    <CalendarDayCell
      day={date}
      context={day}
      events={findDayEvents(events, date)}
      isOutsideMonth={isOutsideMonth}
      showNumber
    >
      <div {...hooks.slot('events')}>
        {Array.from({ length: laneCount }, (_, lane) => {
          const segment = shown.find((entry) => entry.lane === lane);
          if (!segment || segment.column !== column) {
            return <div key={lane} aria-hidden="true" {...hooks.slot('spacer')} />;
          }
          return (
            <CalendarEventButton
              key={lane}
              placed={segment.placed}
              context={event}
              isTabbable={isActive}
              time="start"
              continuesBefore={segment.continuesBefore}
              continuesAfter={segment.continuesAfter}
              style={{ width: `${segment.span * 100}%` }}
            />
          );
        })}
        {covering.length > shown.length ? (
          <CalendarMoreEvents
            events={covering.map((segment) => segment.placed)}
            hidden={covering.length - shown.length}
            dayLabel={day.format.formatDay(date)}
            isTabbable={isActive}
            context={event}
          />
        ) : null}
      </div>
    </CalendarDayCell>
  );
}

/** One week row of the month, its events packed into lanes across its days. */
function MonthWeek(
  props: Omit<MonthDayProps, 'date' | 'column' | 'segments' | 'visibleLanes'> & {
    days: string[];
  },
) {
  const { days, ...rest } = props;
  const { segments } = layoutWeek(days, rest.events, { spansOnly: false });
  const visibleLanes = countVisibleLanes(segments, rest.maxEvents);
  return (
    <div role="row" {...hooks.slot('week')}>
      {days.map((date, column) => (
        <MonthDay
          key={date}
          {...rest}
          date={date}
          column={column}
          segments={segments}
          visibleLanes={visibleLanes}
        />
      ))}
    </div>
  );
}

/** The month view: weekday headers, then one row per week of the focused day's month. */
export function CalendarMonth({ grid, titleId, ...rest }: CalendarMonthProps) {
  const weeks = getMonthWeeks(rest.day.focused, rest.day.format.locale);
  return (
    <div
      ref={grid.ref}
      role="grid"
      aria-labelledby={titleId}
      onKeyDown={grid.onKeyDown}
      onFocus={grid.onFocus}
      {...hooks.slot('grid')}
    >
      <div role="row" {...hooks.slot('weekdays')}>
        {(weeks[0] ?? []).map((date) => {
          const names = rest.day.format.formatWeekday(date);
          return (
            <div key={date} role="columnheader" {...hooks.slot('weekday')}>
              <span aria-hidden="true">{names.short}</span>
              <VisuallyHidden elementType="span">{names.long}</VisuallyHidden>
            </div>
          );
        })}
      </div>
      {weeks.map((days) => (
        <MonthWeek key={days[0]} days={days} {...rest} />
      ))}
    </div>
  );
}
