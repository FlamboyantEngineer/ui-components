'use client';

import { useLocale } from '../../primitives/index.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { CalendarDayCell, findDayEvents, type CalendarDayContext } from './calendar-day.js';
import {
  CalendarEventButton,
  CalendarEventLanes,
  type CalendarEventContext,
} from './calendar-event.js';
import { layoutDay, layoutWeek, type PlacedEvent, type WeekSegment } from './calendar-layout.js';
import { getWeekDays } from './calendar-days.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
import type { CalendarGrid } from './use-calendar-grid.js';

interface CalendarWeekProps {
  events: readonly PlacedEvent[];
  grid: CalendarGrid;
  titleId: string;
  timeZone: string;
  day: CalendarDayContext;
  event: CalendarEventContext;
}

interface WeekDayProps extends Pick<CalendarWeekProps, 'events' | 'timeZone' | 'day' | 'event'> {
  date: string;
  column: number;
  segments: readonly WeekSegment[];
  laneCount: number;
}

const hours = Array.from({ length: 24 }, (_, hour) => hour);

/** The hour labels beside the time grid, decorative: each day's events read their own times. */
function WeekGutter({ day }: Pick<CalendarWeekProps, 'day'>) {
  const strings = useUiStrings();
  return (
    <div aria-hidden="true" {...hooks.slot('gutter')}>
      <div {...hooks.slot('all-day')}>{strings.allDay}</div>
      <div {...hooks.slot('timed')} style={{ position: 'relative' }}>
        {hours.map((hour) => (
          <span
            key={hour}
            {...hooks.slot('hour')}
            style={{ position: 'absolute', top: `${(hour / 24) * 100}%` }}
          >
            {day.format.formatHour(hour)}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * One day of the week: its bars lane by lane in the all-day area, padded with spacers to the week's
 * lane count so the areas line up, then its timed events placed in the time grid.
 */
function WeekDay({
  date,
  column,
  segments,
  laneCount,
  events,
  timeZone,
  day,
  event,
}: WeekDayProps) {
  const isActive = date === day.focused;
  // Concurrent events pack from the inline start, which is the right edge right to left.
  const inlineStart = useLocale().direction === 'rtl' ? 'right' : 'left';
  return (
    <CalendarDayCell
      day={date}
      context={day}
      events={findDayEvents(events, date)}
      isOutsideMonth={false}
      showNumber={false}
    >
      <div {...hooks.slot('all-day')}>
        <CalendarEventLanes
          segments={segments}
          column={column}
          laneCount={laneCount}
          context={event}
          isTabbable={isActive}
          time="none"
        />
      </div>
      <div {...hooks.slot('timed')} style={{ position: 'relative' }}>
        {layoutDay(date, events, timeZone).map((block) => (
          <CalendarEventButton
            key={toKeyIdentity(block.placed.event.id)}
            placed={block.placed}
            context={event}
            isTabbable={isActive}
            time="range"
            continuesBefore={block.continuesBefore}
            continuesAfter={block.continuesAfter}
            style={{
              position: 'absolute',
              top: `${block.top}%`,
              height: `${block.height}%`,
              [inlineStart]: `${block.left}%`,
              width: `${block.width}%`,
            }}
          />
        ))}
      </div>
    </CalendarDayCell>
  );
}

/** The week view: day headers, then the days of the focused day's week with all-day bars and a time grid. */
export function CalendarWeek({ grid, titleId, ...rest }: CalendarWeekProps) {
  const { ref, onKeyDown, onFocus } = grid;
  const days = getWeekDays(rest.day.focused, rest.day.format.locale);
  const { segments, laneCount } = layoutWeek(days, rest.events, { spansOnly: true });
  return (
    <div
      ref={ref}
      role="grid"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      {...hooks.slot('grid')}
    >
      <div role="row" {...hooks.slot('weekdays')}>
        <div aria-hidden="true" {...hooks.slot('gutter')} />
        {days.map((date) => {
          const isToday = date === rest.day.today;
          return (
            <div key={date} role="columnheader" {...hooks.slot('weekday', { today: isToday })}>
              <span aria-hidden="true">
                {rest.day.format.formatWeekday(date).short}{' '}
                <span {...hooks.slot('day-number')}>{rest.day.format.formatDayNumber(date)}</span>
              </span>
              <VisuallyHidden elementType="span">{rest.day.format.formatDay(date)}</VisuallyHidden>
            </div>
          );
        })}
      </div>
      <div role="row" {...hooks.slot('week')}>
        <WeekGutter day={rest.day} />
        {days.map((date, column) => (
          <WeekDay
            key={date}
            {...rest}
            date={date}
            column={column}
            segments={segments}
            laneCount={laneCount}
          />
        ))}
      </div>
    </div>
  );
}
