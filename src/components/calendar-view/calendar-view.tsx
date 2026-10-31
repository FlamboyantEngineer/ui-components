'use client';

import { ChevronLeftGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
// A month or week calendar of events: a toolbar to move between periods and views, then a grid of
// days the reader navigates by keyboard, holding all-day bars, timed events and `+n more` lists.

import { useId, useMemo, type ReactNode } from 'react';
import { parseIsoDate, useLocale } from '../../primitives/index.js';
import { useGetNow, useNow, useTimeZone } from '../../core/clock.js';
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
  /**
   * The focused day at first, uncontrolled. Defaults to today, so without it a server render draws
   * an empty, busy calendar that fills in once hydrated.
   */
  defaultDate?: string | undefined;
  /** Called with the day the reader moves to, by keyboard, navigation or focus. */
  onDateChange?: ((date: string) => void) | undefined;
  /**
   * The IANA time zone that places events on days and hours. Defaults to the provider's, else the
   * browser's.
   */
  timeZone?: string | undefined;
  /** The most rows of events a month cell shows, its `+n more` button included. Defaults to 3. */
  maxEvents?: number | undefined;
  /** Called with the key of the event the reader presses. */
  onEventAction?: ((key: Key) => void) | undefined;
  /** Draws extra content in each day cell, such as a marker or a count. */
  renderDay?: ((day: CalendarViewDay) => ReactNode) | undefined;
  /** The clock that decides today. Defaults to the provider's, else the current time. */
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
        icon={isRightToLeft ? ChevronRightGlyph : ChevronLeftGlyph}
        size="sm"
        label={strings.previousRange(mode)}
        className={hooks.slotClass('previous')}
        onPress={() => onMove(-1)}
      />
      <Button
        icon={isRightToLeft ? ChevronLeftGlyph : ChevronRightGlyph}
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
  const zone = useTimeZone(timeZone);
  const readNow = useGetNow(getNow);
  const now = useNow(getNow);
  const today = now ? getDayOf(now.getTime(), zone) : null;
  const [mode, setMode] = useControllableState(view, defaultView, onViewChange);
  const [focusedText, setFocused] = useControllableState<string | null>(
    date,
    defaultDate ?? null,
    (next) => {
      if (next !== null) onDateChange?.(next);
    },
  );
  const focused = parseIsoDate(focusedText ?? '')?.toString() ?? today;
  const root = { ...rest, ...hooks.root({ className, props: rest, data: { view: mode } }) };
  // Without a date the calendar opens on today, which a server render and its hydration cannot
  // know: the calendar draws once the clock may be read.
  if (focused === null) return <div {...root} aria-busy="true" />;
  return (
    <div {...root}>
      <CalendarContent
        {...{ events, mode, views, focused, today, maxEvents, onEventAction, renderDay }}
        timeZone={zone}
        onFocusedChange={setFocused}
        onModeChange={setMode}
        getToday={() => getDayOf(readNow().getTime(), zone)}
      />
    </div>
  );
}

/** The toolbar and the grid of a calendar whose focused day is known. */
function CalendarContent(
  props: Required<Pick<CalendarViewProps, 'events' | 'views' | 'maxEvents'>> &
    Pick<CalendarViewProps, 'onEventAction' | 'renderDay'> & {
      mode: CalendarViewMode;
      focused: string;
      /** Today in the calendar's zone; `null` until the clock may be read. */
      today: string | null;
      timeZone: string;
      onFocusedChange: (date: string) => void;
      onModeChange: (mode: CalendarViewMode) => void;
      /** Reads today from the clock, for the Today button. */
      getToday: () => string;
    },
) {
  const { events, mode, views, focused, today, timeZone, maxEvents, onEventAction } = props;
  const { renderDay, onFocusedChange, onModeChange, getToday } = props;
  const titleId = useId();
  const format = useCalendarFormat(timeZone);
  const placed = useMemo(() => readEvents(events, timeZone), [events, timeZone]);
  const grid = useCalendarGrid({
    focused,
    setFocused: onFocusedChange,
    mode,
    isInPeriod: (day) => mode === 'week' || isSameMonth(day, focused),
  });
  const days = mode === 'week' ? getWeekDays(focused, format.locale) : [];
  const onMove = (direction: -1 | 0 | 1) =>
    onFocusedChange(
      direction === 0
        ? getToday()
        : shiftDay(focused, { [mode === 'month' ? 'months' : 'weeks']: direction }),
    );
  const day = { focused, today, format, renderDay };
  const event = { format, onEventAction };
  return (
    <>
      <CalendarToolbar
        mode={mode}
        views={views}
        title={format.formatTitle(mode, days, focused)}
        titleId={titleId}
        onMove={onMove}
        onModeChange={onModeChange}
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
          timeZone={timeZone}
          day={day}
          event={event}
        />
      )}
    </>
  );
}
