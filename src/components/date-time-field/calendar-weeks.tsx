'use client';

import {
  Children,
  cloneElement,
  type ComponentProps,
  isValidElement,
  type ReactNode,
  useContext,
} from 'react';
import { useUiStrings } from '../../core/provider.js';
import {
  CalendarStateContext,
  RangeCalendarStateContext,
  useLocale,
} from '../../primitives/index.js';
import { getDateFormatter, getNumberFormat } from '../../utils/intl-format.js';
import { dateTimeFieldHooks as hooks } from './date-time-field-hooks.js';
import {
  type DateTimeFieldWeekNumbers,
  getMinimalWeekDays,
  getWeekNumber,
} from './week-numbers.js';

/** The calendar state of the nearest calendar or range calendar. */
function useCalendarState() {
  const single = useContext(CalendarStateContext);
  const range = useContext(RangeCalendarStateContext);
  const state = single ?? range;
  if (!state) throw new Error('A calendar body renders inside a calendar or a range calendar.');
  return state;
}

/** Each row of a table section with one more cell before its own. */
function withLeadingCell(rows: ReactNode, renderCell: (index: number) => ReactNode) {
  return Children.map(rows, (row, index) =>
    isValidElement<{ children?: ReactNode }>(row)
      ? cloneElement(row, undefined, renderCell(index), row.props.children)
      : row,
  );
}

/**
 * A row's week number as its row header, named in words (`Week 15`) so moving between rows reads
 * the week; it is no date, so it takes no focus and no selection.
 */
function WeekNumber({ rowStart, rule }: { rowStart: string; rule: DateTimeFieldWeekNumbers }) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const week = getWeekNumber(rowStart, getMinimalWeekDays(rule, locale));
  return (
    <th {...hooks.slot('calendar-week')} scope="row" aria-label={strings.weekNumber(week)}>
      {getNumberFormat(locale, {}).format(week)}
    </th>
  );
}

/** The first day of a grid row, as a Gregorian `YYYY-MM-DD` date, whatever the calendar system. */
function useRowStarts(offset: number) {
  const state = useCalendarState();
  const month = state.visibleRange.start.add({ months: offset });
  return Array.from({ length: state.getWeeksInMonth(month) }, (_, row) => {
    const days = state.getDatesInWeek(row, month);
    const index = days.findIndex(Boolean);
    const day = days[index];
    return day ? day.subtract({ days: index }).toDate('UTC').toISOString().slice(0, 10) : null;
  });
}

/**
 * The month and year a grid shows, written above it when several months show together. The grid's
 * own accessible name already says it, so assistive technology skips the caption.
 */
export function MonthCaption({ offset, months }: { offset: number; months: number }) {
  const { locale } = useLocale();
  const state = useCalendarState();
  if (months === 1) return null;
  const month = state.visibleRange.start.add({ months: offset });
  const text = getDateFormatter(locale, {
    month: 'long',
    year: 'numeric',
    calendar: month.calendar.identifier,
    timeZone: state.timeZone,
  }).format(month.toDate(state.timeZone));
  return (
    <caption {...hooks.slot('calendar-month')} aria-hidden="true">
      {text}
    </caption>
  );
}

/** Renders a grid's weekday header row after a week column header. */
export function WeekHead(props: ComponentProps<'thead'>) {
  const strings = useUiStrings();
  return (
    <thead {...props}>
      {withLeadingCell(props.children, () => (
        <th {...hooks.slot('calendar-week-label')}>{strings.weekColumn}</th>
      ))}
    </thead>
  );
}

/** Renders a grid's weeks, each after its week number. */
export function WeekRows({
  offset,
  rule,
  ...props
}: ComponentProps<'tbody'> & { offset: number; rule: DateTimeFieldWeekNumbers }) {
  const starts = useRowStarts(offset);
  return (
    <tbody {...props}>
      {withLeadingCell(props.children, (index) => {
        const start = starts[index];
        return start ? <WeekNumber rowStart={start} rule={rule} /> : <th scope="row" />;
      })}
    </tbody>
  );
}
