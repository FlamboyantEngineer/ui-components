'use client';

import { ChevronLeftGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
// A month or week calendar of events: a toolbar to move between periods and views, then a grid of
// days the reader navigates by keyboard, holding all-day bars, timed events and `+n more` lists.

import { useId, useMemo, type ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import { toPlanningDate } from '../../utils/planning-dates.js';
import { useGetNow, useNow, useTimeZone } from '../../core/clock.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { BaseProps, Key, Tone, RefProps } from '../../core/props.js';
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
import type { CalendarEventChange, CalendarEventDragMode } from './calendar-event-handles.js';
import { useEventChanges } from './use-event-changes.js';
import type { CalendarEventMenuEntry } from './calendar-event-menu.js';

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
  /** Keeps the reader from changing the event, even when the calendar takes changes. */
  isReadOnly?: boolean | undefined;
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

export interface CalendarViewProps extends BaseProps, RefProps<HTMLDivElement> {
  /** The events, as plain data. */
  events: readonly CalendarViewEvent[];
  /** The view on show, controlled. */
  view?: CalendarViewMode | undefined;
  /** The view on show at first, uncontrolled. Defaults to `month`, or the first of `views` without it. */
  defaultView?: CalendarViewMode | undefined;
  /** Called with the view the reader picks. */
  onViewChange?: ((view: CalendarViewMode) => void) | undefined;
  /**
   * The views the reader may pick between, in order; one view hides the choice. Repeats are ignored,
   * and an empty list allows both. A `view` or `defaultView` outside them draws the first allowed
   * view instead, without calling `onViewChange`. Defaults to both.
   */
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
  /**
   * The least length of the week view's ruler a timed event is drawn over, in minutes, so a short
   * or zero-duration event stays large enough to read and press; overlapping events are packed
   * by what is drawn, so none covers another. Size the ruler so this length is a comfortable
   * target. Defaults to 30.
   */
  minEventMinutes?: number | undefined;
  /** Called with the key of the event the reader presses, before an editable event opens its editor. */
  onEventAction?: ((key: Key) => void) | undefined;
  /**
   * Called with an event the reader changed and the event as it was, such as from the event
   * editor. The host owns the events: the calendar shows the change once `events` holds it. Without
   * it, or for an event marked `isReadOnly`, the reader cannot change events.
   */
  onEventChange?: ((next: CalendarViewEvent, previous: CalendarViewEvent) => void) | undefined;
  /**
   * The entries of each event's context menu, or a function of the event that returns them:
   * `'edit'` for the built-in Edit, which opens the event editor while the event is editable, and
   * any menu entry. No entry leaves the browser's menu. Defaults to `['edit']`.
   */
  eventMenu?:
    | readonly CalendarEventMenuEntry[]
    | ((event: CalendarViewEvent) => readonly CalendarEventMenuEntry[])
    | undefined;
  /**
   * What dragging an editable event does: `move` (the default) drags the event to move it, keeping
   * its length, and its end edge to change its end; `resize` drags its start edge and its end edge
   * to change each alone. No handle is drawn: the edges are invisible targets with their own focus.
   */
  eventDragMode?: CalendarEventDragMode | undefined;
  /**
   * Whether the reader may make a change to an event: `edit` it in the editor, `move` it, or
   * `resize` it by its start or end edge. Asked only while `onEventChange` is given, for events not marked
   * `isReadOnly`. Defaults to allowing every change.
   */
  canChangeEvent?: ((event: CalendarViewEvent, change: CalendarEventChange) => boolean) | undefined;
  /** Called with the key of the event menu entry the reader chose, Edit included, and its event. */
  onEventMenuAction?: ((key: Key, event: CalendarViewEvent) => void) | undefined;
  /** Draws extra content in each day cell, such as a marker or a count. */
  renderDay?: ((day: CalendarViewDay) => ReactNode) | undefined;
  /** The clock that decides today. Defaults to the provider's, else the current time. */
  getNow?: (() => Date) | undefined;
}

const allViews: readonly CalendarViewMode[] = ['month', 'week'];

const defaultEventMenu: readonly CalendarEventMenuEntry[] = ['edit'];

/** The allowed views: `views` without repeats or unknown views, or both when none is left. */
function toAllowedViews(views: readonly CalendarViewMode[]): readonly CalendarViewMode[] {
  const allowed = [...new Set(views)].filter((entry) => allViews.includes(entry));
  return allowed.length > 0 ? allowed : allViews;
}

/**
 * The view on show: the chosen one (controlled or the reader's pick) while it is allowed, else the
 * default view when allowed, else the first allowed view. A view that stops being allowed is not
 * reported through `onViewChange`; it shows again if it is allowed again.
 */
function useCalendarMode({
  view,
  defaultView = 'month',
  onViewChange,
  views,
}: Pick<CalendarViewProps, 'view' | 'defaultView' | 'onViewChange'> & {
  views: readonly CalendarViewMode[];
}) {
  const allowed = toAllowedViews(views);
  const fallback = allowed.includes(defaultView) ? defaultView : (allowed[0] ?? 'month');
  const [chosen, setMode] = useControllableState(view, fallback, onViewChange);
  return { mode: allowed.includes(chosen) ? chosen : fallback, setMode, allowed };
}

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
  defaultView,
  onViewChange,
  views = allViews,
  date,
  defaultDate,
  onDateChange,
  timeZone,
  maxEvents = 3,
  minEventMinutes = 30,
  onEventAction,
  onEventChange,
  canChangeEvent,
  eventDragMode = 'move',
  eventMenu = defaultEventMenu,
  onEventMenuAction,
  renderDay,
  getNow,
  className,
  ...rest
}: CalendarViewProps) {
  const zone = useTimeZone(timeZone);
  const readNow = useGetNow(getNow);
  const now = useNow(getNow);
  const today = now ? getDayOf(now.getTime(), zone) : null;
  const { mode, setMode, allowed } = useCalendarMode({ view, defaultView, onViewChange, views });
  const [focusedText, setFocused] = useControllableState<string | null>(
    date,
    defaultDate ?? null,
    (next) => {
      if (next !== null) onDateChange?.(next);
    },
  );
  // Days outside the supported planning range move to its nearer end, so a week or month around
  // the focused day is always made of real days.
  const focused = toPlanningDate(focusedText) ?? toPlanningDate(today);
  const root = { ...rest, ...hooks.root({ className, props: rest, data: { view: mode } }) };
  // Without a date the calendar opens on today, which a server render and its hydration cannot
  // know: the calendar draws once the clock may be read.
  if (focused === null) return <div {...root} aria-busy="true" />;
  return (
    <div {...root}>
      <CalendarContent
        {...{ events, mode, views: allowed, focused, today, maxEvents, onEventAction, renderDay }}
        {...{ onEventChange, canChangeEvent, eventMenu, onEventMenuAction, eventDragMode }}
        minEventMinutes={minEventMinutes}
        timeZone={zone}
        onFocusedChange={(next) => {
          const day = toPlanningDate(next);
          if (day !== null && day !== focused) setFocused(day);
        }}
        onModeChange={setMode}
        getToday={() => getDayOf(readNow().getTime(), zone)}
      />
    </div>
  );
}

/** The toolbar and the grid of a calendar whose focused day is known. */
function CalendarContent(
  props: Required<Pick<CalendarViewProps, 'events' | 'views' | 'maxEvents' | 'minEventMinutes'>> &
    Pick<
      CalendarViewProps,
      'onEventAction' | 'renderDay' | 'onEventChange' | 'onEventMenuAction' | 'canChangeEvent'
    > & {
      eventMenu: NonNullable<CalendarViewProps['eventMenu']>;
      eventDragMode: CalendarEventDragMode;
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
  const { minEventMinutes, renderDay, onFocusedChange, onModeChange, getToday } = props;
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
  const changes = useEventChanges(props, { placed, gridRef: grid.ref });
  const day = { focused, today, format, renderDay };
  const event = {
    format,
    onEventAction,
    menu: changes.menu,
    register: changes.register,
    handles: changes.handles,
  };
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
          events={changes.drawn}
          grid={grid}
          titleId={titleId}
          maxEvents={maxEvents}
          day={day}
          event={event}
        />
      ) : (
        <CalendarWeek
          events={changes.drawn}
          grid={grid}
          titleId={titleId}
          timeZone={timeZone}
          minEventMinutes={minEventMinutes}
          day={day}
          event={event}
        />
      )}
      {changes.editor}
    </>
  );
}
