'use client';

import { useMemo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { getDateFormatter, normalizeIntlSpaces } from '../../utils/intl-format.js';
import { type CalendarPeriod, getDayStart, isRepeatedTime } from './calendar-days.js';
import type { PlacedEvent } from './calendar-layout.js';

/** The texts a calendar view shows and reads out, in the provider's locale and the view's time zone. */
export interface CalendarFormat {
  locale: string;
  /** The period on show: the month (`March 2026`), the week (`Mar 1 – 7, 2026`), or the day in full. */
  formatTitle: (period: CalendarPeriod, days: readonly string[], focused: string) => string;
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
  const { valueRange } = useUiStrings();
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
    // A repeated wall-clock time names its offset, so the two passes of the hour read apart.
    const zonedTime = make({ hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    const zonedDateTime = make({
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    const isRepeated = (instant: number) => isRepeatedTime(instant, timeZone);
    const hour = getDateFormatter(locale, { hour: 'numeric', timeZone: 'UTC' });
    const toDate = (date: string) => new Date(getDayStart(date, timeZone));
    const formatWhen = (placed: PlacedEvent) => {
      if (placed.isAllDay) {
        if (placed.startDay === placed.endDay) return shortDay.format(toDate(placed.startDay));
        return shortDay.formatRange(toDate(placed.startDay), toDate(placed.endDay));
      }
      const isSameDay = placed.startDay === placed.endDay;
      if (isRepeated(placed.start) || isRepeated(placed.end)) {
        // A range format names one zone for both ends; each end names its own instead.
        const zoned = isSameDay ? zonedTime : zonedDateTime;
        return valueRange(zoned.format(new Date(placed.start)), zoned.format(new Date(placed.end)));
      }
      return (isSameDay ? time : dateTime).formatRange(
        new Date(placed.start),
        new Date(placed.end),
      );
    };
    // Runtimes space dates, times and ranges differently, so every text is normalized before it
    // renders: a server's text then hydrates against the browser's unchanged.
    const n = normalizeIntlSpaces;
    return {
      locale,
      formatTitle: (period, days, focused) => {
        const [first, last] = [days[0] ?? focused, days.at(-1) ?? focused];
        if (period === 'month') return n(month.format(toDate(focused)));
        if (period === 'day') return n(day.format(toDate(focused)));
        return n(weekRange.formatRange(toDate(first), toDate(last)));
      },
      formatDay: (date) => n(day.format(toDate(date))),
      formatWeekday: (date) => ({
        short: n(weekdayShort.format(toDate(date))),
        long: n(weekdayLong.format(toDate(date))),
      }),
      formatDayNumber: (date) => n(dayNumber.format(toDate(date))),
      formatTime: (instant) =>
        n((isRepeated(instant) ? zonedTime : time).format(new Date(instant))),
      formatHour: (value) => n(hour.format(new Date(Date.UTC(2000, 0, 1, value)))),
      formatWhen: (placed) => n(formatWhen(placed)),
    };
  }, [locale, timeZone, valueRange]);
}
