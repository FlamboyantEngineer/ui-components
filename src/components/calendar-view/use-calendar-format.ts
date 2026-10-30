'use client';

import { useMemo } from 'react';
import { useLocale } from '../../primitives/index.js';
import { getDateFormatter } from '../../utils/intl-format.js';
import type { CalendarViewMode } from './calendar-view.js';
import { getDayStart } from './calendar-days.js';
import type { PlacedEvent } from './calendar-layout.js';

/** The texts a calendar view shows and reads out, in the provider's locale and the view's time zone. */
export interface CalendarFormat {
  locale: string;
  /** The month (`March 2026`) or the week (`Mar 1 – 7, 2026`) on show. */
  formatTitle: (mode: CalendarViewMode, days: readonly string[], focused: string) => string;
  /** A day in full, such as `Monday, March 2, 2026`. */
  formatDay: (day: string) => string;
  /** A weekday's short and long names. */
  formatWeekday: (day: string) => { short: string; long: string };
  /** A day of the month, such as `2`. */
  formatDayNumber: (day: string) => string;
  /** An instant's time of day, such as `10:00 AM`. */
  formatTime: (instant: number) => string;
  /** An hour of the day, such as `9 AM`, for the time grid. */
  formatHour: (hour: number) => string;
  /** When an event happens: its days, or its times. */
  formatWhen: (placed: PlacedEvent) => string;
}

/** The formatters of a calendar view, made once per locale and time zone. */
export function useCalendarFormat(timeZone: string): CalendarFormat {
  const { locale } = useLocale();
  return useMemo(() => {
    const make = (options: Intl.DateTimeFormatOptions) =>
      getDateFormatter(locale, { timeZone, ...options });
    const month = make({ month: 'long', year: 'numeric' });
    const weekRange = make({ month: 'short', day: 'numeric', year: 'numeric' });
    const day = make({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const shortDay = make({ month: 'long', day: 'numeric' });
    const weekdayShort = make({ weekday: 'short' });
    const weekdayLong = make({ weekday: 'long' });
    const dayNumber = make({ day: 'numeric' });
    const time = make({ hour: 'numeric', minute: '2-digit' });
    const dateTime = make({ month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const hour = getDateFormatter(locale, { hour: 'numeric', timeZone: 'UTC' });
    const toDate = (date: string) => new Date(getDayStart(date, timeZone));
    const formatWhen = (placed: PlacedEvent) => {
      if (placed.isAllDay) {
        if (placed.startDay === placed.endDay) return shortDay.format(toDate(placed.startDay));
        return shortDay.formatRange(toDate(placed.startDay), toDate(placed.endDay));
      }
      const formatter = placed.startDay === placed.endDay ? time : dateTime;
      return formatter.formatRange(new Date(placed.start), new Date(placed.end));
    };
    return {
      locale,
      formatTitle: (mode, days, focused) => {
        const [first, last] = [days[0] ?? focused, days.at(-1) ?? focused];
        return mode === 'month'
          ? month.format(toDate(focused))
          : weekRange.formatRange(toDate(first), toDate(last));
      },
      formatDay: (date) => day.format(toDate(date)),
      formatWeekday: (date) => ({
        short: weekdayShort.format(toDate(date)),
        long: weekdayLong.format(toDate(date)),
      }),
      formatDayNumber: (date) => dayNumber.format(toDate(date)),
      formatTime: (instant) => time.format(new Date(instant)),
      formatHour: (value) => hour.format(new Date(Date.UTC(2000, 0, 1, value))),
      formatWhen,
    };
  }, [locale, timeZone]);
}
