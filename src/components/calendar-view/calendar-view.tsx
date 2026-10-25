// A month or week calendar of events: a toolbar to move between periods and views, then a grid of
// days the reader navigates by keyboard, holding all-day bars, timed events and `+n more` lists.

import { useId, useMemo, type ReactNode } from 'react';
import { getLocalTimeZone, parseIsoDate, useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { BaseProps, Key, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';

import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { CalendarMonth } from './calendar-month.js';
import { CalendarWeek } from './calendar-week.js';
import { getDayOf, getWeekDays, isSameMonth, shiftDay } from './calendar-days.js';
import { readEvents } from './calendar-layout.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
import { useCalendarFormat } from './use-calendar-format.js';
import { useCalendarGrid } from './use-calendar-grid.js';

/** The period a calendar view shows. */
export type CalendarViewMode = 'month' | 'week';

/** An event on the calendar. */
export interface CalendarViewEvent {
  id: Key;
  title: string;
  /** A `YYYY-MM-DD` date for an all-day event, or an ISO 8601 date-time. */
  start: string;
  /**
   * The last day of an all-day event (inclusive), or the end of a timed event (exclusive). Defaults
   * to the start day, or an hour after the start.
   */
  end?: string | undefined;
  /** Semantic emphasis, published as `data-tone`. Defaults to `neutral`. */
  tone?: Tone | undefined;
}

/** A day as `renderDay` receives it. */
export interface CalendarViewDay {
  /** The day, as `YYYY-MM-DD`. */
  date: string;
  isToday: boolean;
  /** The day belongs to a neighbouring month of the month view. */
  isOutsideMonth: boolean;
  /** The events that cover the day. */
  events: CalendarViewEvent[];
}

export interface CalendarViewProps extends BaseProps {
  /** The events, as plain data. */
  events: readonly CalendarViewEvent[];
  /** The view on show, controlled. */
  view?: CalendarViewMode | undefined;
  /** The view on show at first, uncontrolled. Defaults to `month`. */
  defaultView?: CalendarViewMode | undefined;
  /** Called with the view the reader picks. */
  onViewChange?: ((view: CalendarViewMode) => void) | undefined;
  /** The views the reader may pick between; one view hides the choice. Defaults to both. */
  views?: readonly CalendarViewMode[] | undefined;
  /** The focused day as `YYYY-MM-DD`, controlled; its month or week is on show. */
  date?: string | undefined;
  /** The focused day at first, uncontrolled. Defaults to today. */
  defaultDate?: string | undefined;
  /** Called with the day the reader moves to, by keyboard, navigation or focus. */
  onDateChange?: ((date: string) => void) | undefined;
  /** The IANA time zone that places events on days and hours. Defaults to the runtime's. */
  timeZone?: string | undefined;
  /** The most rows of events a month cell shows, its `+n more` button included. Defaults to 3. */
  maxEvents?: number | undefined;
  /** Called with the key of the event the reader presses. */
  onEventAction?: ((key: Key) => void) | undefined;
  /** Draws extra content in each day cell, such as a marker or a count. */
  renderDay?: ((day: CalendarViewDay) => ReactNode) | undefined;
  /** The clock that decides today. Defaults to `new Date()`. */
  getNow?: (() => Date) | undefined;
}

const allViews: readonly CalendarViewMode[] = ['month', 'week'];

/** The toolbar: Today, previous and next, the period on show (a polite live region) and the views. */
function CalendarToolbar(props: {
  mode: CalendarViewMode;
  views: readonly CalendarViewMode[];
  title: string;
  titleId: string;
  onMove: (step: -1 | 0 | 1) => void;
  onModeChange: (mode: CalendarViewMode) => void;
}) {
  const { mode, views, title, titleId, onMove, onModeChange } = props;
  const strings = useUiStrings();
  const { direction } = useLocale();
  const isRightToLeft = direction === 'rtl';
  return (
    <div {...hooks.slot('toolbar')}>
      <Button size="sm" className={hooks.slotClass('today')} onPress={() => onMove(0)}>
        {strings.today}
      </Button>
      <Button
        icon={isRightToLeft ? 'chevron-right' : 'chevron-left'}
        size="sm"
        label={strings.previousRange(mode)}
        className={hooks.slotClass('previous')}
        onPress={() => onMove(-1)}
      />
      <Button
        icon={isRightToLeft ? 'chevron-left' : 'chevron-right'}
        size="sm"
        label={strings.nextRange(mode)}
        className={hooks.slotClass('next')}
        onPress={() => onMove(1)}
      />
      <span id={titleId} aria-live="polite" {...hooks.slot('title')}>
        {title}
      </span>
      {views.length > 1 ? (
        <SegmentedChoice
          aria-label={strings.calendarViews}
          size="sm"
          sizing="content"
          options={views.map((value) => ({ value, label: strings[value] }))}
          value={mode}
          onChange={(value) => {
            if (value === 'month' || value === 'week') onModeChange(value);
          }}
          className={hooks.slotClass('views')}
        />
      ) : null}
    </div>
  );
}

/**
 * A calendar of events in a month or week view. Events are plain data: all-day events on dates and
 * timed events on ISO 8601 date-times, placed in `timeZone`. The month view packs each week's events
 * into lanes, multi-day events as bars across days, and lists a crowded day's hidden events behind
 * `+n more`; the week view shows all-day bars above a time grid of timed events. The toolbar moves
 * by month or week, back to today and between views; the arrow keys, Home, End, PageUp and PageDown
 * move between days. Pressing an event calls `onEventAction`.
 */
export function CalendarView({
  events,
  view,
  defaultView = 'month',
  onViewChange,
  views = allViews,
  date,
  defaultDate,
  onDateChange,
  timeZone,
  maxEvents = 3,
  onEventAction,
  renderDay,
  getNow,
  className,
  ...rest
}: CalendarViewProps) {
  const zone = timeZone ?? getLocalTimeZone();
  const today = getDayOf((getNow?.() ?? new Date()).getTime(), zone);
  const titleId = useId();
  const format = useCalendarFormat(zone);
  const [mode, setMode] = useControllableState(view, defaultView, onViewChange);
  const [focusedText, setFocused] = useControllableState(date, defaultDate ?? today, onDateChange);
  const focused = parseIsoDate(focusedText)?.toString() ?? today;
  const placed = useMemo(() => readEvents(events, zone), [events, zone]);
  const grid = useCalendarGrid({
    focused,
    setFocused,
    mode,
    isInPeriod: (day) => mode === 'week' || isSameMonth(day, focused),
  });
  const days = mode === 'week' ? getWeekDays(focused, format.locale) : [];
  const onMove = (direction: -1 | 0 | 1) =>
    setFocused(
      direction === 0
        ? today
        : shiftDay(focused, { [mode === 'month' ? 'months' : 'weeks']: direction }),
    );
  const day = { focused, today, format, renderDay };
  const event = { format, onEventAction };
  return (
    <div {...rest} {...hooks.root({ className, props: rest, data: { view: mode } })}>
      <CalendarToolbar
        mode={mode}
        views={views}
        title={format.formatTitle(mode, days, focused)}
        titleId={titleId}
        onMove={onMove}
        onModeChange={setMode}
      />
      {mode === 'month' ? (
        <CalendarMonth
          events={placed}
          grid={grid}
          titleId={titleId}
          maxEvents={maxEvents}
          day={day}
          event={event}
        />
      ) : (
        <CalendarWeek
          events={placed}
          grid={grid}
          titleId={titleId}
          timeZone={zone}
          day={day}
          event={event}
        />
      )}
    </div>
  );
}
