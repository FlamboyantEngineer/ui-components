'use client';

// A calendar of events by month, week or day, or as an agenda: a toolbar to move between periods
// and views, then a grid of days the reader navigates by keyboard, holding all-day bars, timed
// events and `+n more` lists, or the agenda's list of events by day.
import { type ReactNode, useId, useMemo } from 'react';
import { useGetNow, useNow, useTimeZone } from '../../core/clock.js';
import { useControllableState } from '../../core/controllable-state.js';
import { ChevronLeftGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
import type { BaseProps, Key, RefProps, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { toPlanningDate } from '../../utils/planning-dates.js';
import { Button } from '../button/button.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { CalendarAgenda } from './calendar-agenda.js';
import {
  type CalendarPeriod,
  getDayOf,
  getMonthDays,
  getWeekDays,
  isSameMonth,
  shiftPeriod,
} from './calendar-days.js';
import type { CalendarEventChange, CalendarEventDragMode } from './calendar-event-handles.js';
import type { CalendarEventMenuEntry, CalendarEventMenuIcons } from './calendar-event-menu.js';
import { readEvents } from './calendar-layout.js';
import { CalendarMonth } from './calendar-month.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
import { CalendarWeek } from './calendar-week.js';
import { useCalendarFormat } from './use-calendar-format.js';
import { useCalendarGrid } from './use-calendar-grid.js';
import { useEventChanges } from './use-event-changes.js';

/** The period a calendar view shows, and how: a month, week or day grid, or an agenda. */
export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

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
  /** The day belongs to a neighbouring month of the month view; always `false` in other views. */
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
   * and an empty list allows every view. A `view` or `defaultView` outside them draws the first
   * allowed view instead, without calling `onViewChange`. Defaults to every view: month, week, day
   * and agenda.
   */
  views?: readonly CalendarViewMode[] | undefined;
  /** The focused day as `YYYY-MM-DD`, controlled; its month, week or day is on show. */
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
   * The least length of the week and day views' ruler a timed event is drawn over, in minutes, so a short
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
  /**
   * Icons for the event menu's built-in actions, by action: an icon for `edit`, which has none by
   * default. The host's own entries take theirs from the entry.
   */
  eventMenuIcons?: CalendarEventMenuIcons | undefined;
  /** Called with the key of the event menu entry the reader chose, Edit included, and its event. */
  onEventMenuAction?: ((key: Key, event: CalendarViewEvent) => void) | undefined;
  /** Draws extra content in each day cell, and under each agenda day's heading, such as a marker or a count. */
  renderDay?: ((day: CalendarViewDay) => ReactNode) | undefined;
  /**
   * The period the agenda lists and its toolbar moves by: the focused day's `week` (the default)
   * or its `month`.
   */
  agendaRange?: 'week' | 'month' | undefined;
  /**
   * Whether the agenda lists the days of its period that hold no event, each under its heading:
   * `hide` (the default) leaves them out, `show` lists every day.
   */
  agendaEmptyDays?: 'hide' | 'show' | undefined;
  /** Draws the agenda while its period holds no event. Defaults to the provider's `noEvents` string. */
  renderEmptyState?: (() => ReactNode) | undefined;
  /** The clock that decides today. Defaults to the provider's, else the current time. */
  getNow?: (() => Date) | undefined;
}

const allViews: readonly CalendarViewMode[] = ['month', 'week', 'day', 'agenda'];

/** Whether a value is a view of the calendar, as the view choice reports it. */
function isViewMode(value: string): value is CalendarViewMode {
  return (allViews as readonly string[]).includes(value);
}

/** The period a view shows and moves by: the agenda's range, else the view's own. */
function toPeriod(mode: CalendarViewMode, agendaRange: 'week' | 'month'): CalendarPeriod {
  return mode === 'agenda' ? agendaRange : mode;
}

const defaultEventMenu: readonly CalendarEventMenuEntry[] = ['edit'];

/** The allowed views: `views` without repeats or unknown views, or every view when none is left. */
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
  period: CalendarPeriod;
  views: readonly CalendarViewMode[];
  title: string;
  titleId: string;
  onMove: (step: -1 | 0 | 1) => void;
  onModeChange: (mode: CalendarViewMode) => void;
}) {
  const { mode, period, views, title, titleId, onMove, onModeChange } = props;
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
        label={strings.previousRange(period)}
        className={hooks.slotClass('previous')}
        onPress={() => onMove(-1)}
      />
      <Button
        icon={isRightToLeft ? ChevronLeftGlyph : ChevronRightGlyph}
        size="sm"
        label={strings.nextRange(period)}
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
            if (value !== null && isViewMode(value)) onModeChange(value);
          }}
          className={hooks.slotClass('views')}
        />
      ) : null}
    </div>
  );
}

/**
 * A calendar of events in a month, week, day or agenda view. Events are plain data: all-day events
 * on dates and timed events on ISO 8601 date-times, placed in `timeZone`. The month view packs each
 * week's events into lanes, multi-day events as bars across days, and lists a crowded day's hidden
 * events behind `+n more`; the week and day views show all-day bars above a time grid of timed
 * events; the agenda lists the week's or month's events by day. The toolbar moves by month, week or day, back
 * to today and between views; in the grids the arrow keys, Home, End, PageUp and PageDown move
 * between days. Pressing an event calls `onEventAction`.
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
  eventMenuIcons,
  onEventMenuAction,
  renderDay,
  agendaRange = 'week',
  agendaEmptyDays = 'hide',
  renderEmptyState,
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
        {...{ onEventChange, canChangeEvent, eventMenu, eventMenuIcons }}
        {...{ onEventMenuAction, eventDragMode, agendaEmptyDays, renderEmptyState }}
        period={toPeriod(mode, agendaRange)}
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

/** The days of the period on show: the focused day's month or week, or the focused day alone. */
function getPeriodDays(period: CalendarPeriod, focused: string, locale: string): string[] {
  if (period === 'day') return [focused];
  return period === 'month' ? getMonthDays(focused) : getWeekDays(focused, locale);
}

/** The calendar's props its content passes on to the events, unchanged. */
type CalendarEventOptions = Pick<
  CalendarViewProps,
  | 'onEventAction'
  | 'renderDay'
  | 'onEventChange'
  | 'onEventMenuAction'
  | 'eventMenuIcons'
  | 'canChangeEvent'
  | 'renderEmptyState'
>;

/** The toolbar and the grid of a calendar whose focused day is known. */
function CalendarContent(
  props: Required<Pick<CalendarViewProps, 'events' | 'views' | 'maxEvents' | 'minEventMinutes'>> &
    CalendarEventOptions & {
      eventMenu: NonNullable<CalendarViewProps['eventMenu']>;
      eventDragMode: CalendarEventDragMode;
      agendaEmptyDays: NonNullable<CalendarViewProps['agendaEmptyDays']>;
      mode: CalendarViewMode;
      /** The period on show, which the toolbar moves by. */
      period: CalendarPeriod;
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
  const { events, mode, period, views, focused, today, timeZone, maxEvents, onEventAction } = props;
  const { minEventMinutes, renderDay, onFocusedChange, onModeChange, getToday } = props;
  const titleId = useId();
  const format = useCalendarFormat(timeZone);
  const placed = useMemo(() => readEvents(events, timeZone), [events, timeZone]);
  const grid = useCalendarGrid({
    focused,
    setFocused: onFocusedChange,
    period,
    isInPeriod: (day) => mode !== 'month' || isSameMonth(day, focused),
  });
  const days = getPeriodDays(period, focused, format.locale);
  const onMove = (direction: -1 | 0 | 1) =>
    onFocusedChange(direction === 0 ? getToday() : shiftPeriod(focused, period, direction));
  const changes = useEventChanges(props, { placed, gridRef: grid.ref });
  const day = { focused, today, format, renderDay };
  const event = {
    format,
    onEventAction,
    menu: changes.menu,
    register: changes.register,
    handles: changes.handles,
  };
  const shared = { events: changes.drawn, titleId, day, event };
  return (
    <>
      <CalendarToolbar
        mode={mode}
        period={period}
        views={views}
        title={format.formatTitle(period, days, focused)}
        titleId={titleId}
        onMove={onMove}
        onModeChange={onModeChange}
      />
      {mode === 'month' ? <CalendarMonth {...shared} grid={grid} maxEvents={maxEvents} /> : null}
      {mode === 'week' || mode === 'day' ? (
        <CalendarWeek
          {...shared}
          days={days}
          grid={grid}
          timeZone={timeZone}
          minEventMinutes={minEventMinutes}
        />
      ) : null}
      {mode === 'agenda' ? (
        <CalendarAgenda
          {...shared}
          days={days}
          emptyDays={props.agendaEmptyDays}
          renderEmptyState={props.renderEmptyState}
        />
      ) : null}
      {changes.editor}
    </>
  );
}
