import { useMemo } from 'react';
import { DateFormatter, useLocale } from '../../primitives/index.js';
import { getDayStart } from './calendar-days.js';
/** The formatters of a calendar view, made once per locale and time zone. */
export function useCalendarFormat(timeZone) {
    const { locale } = useLocale();
    return useMemo(() => {
        const make = (options) => new DateFormatter(locale, { timeZone, ...options });
        const month = make({ month: 'long', year: 'numeric' });
        const weekRange = make({ month: 'short', day: 'numeric', year: 'numeric' });
        const day = make({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        const shortDay = make({ month: 'long', day: 'numeric' });
        const weekdayShort = make({ weekday: 'short' });
        const weekdayLong = make({ weekday: 'long' });
        const dayNumber = make({ day: 'numeric' });
        const time = make({ hour: 'numeric', minute: '2-digit' });
        const dateTime = make({ month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        const hour = new DateFormatter(locale, { hour: 'numeric', timeZone: 'UTC' });
        const toDate = (date) => new Date(getDayStart(date, timeZone));
        const formatWhen = (placed) => {
            if (placed.isAllDay) {
                if (placed.startDay === placed.endDay)
                    return shortDay.format(toDate(placed.startDay));
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
//# sourceMappingURL=use-calendar-format.js.map