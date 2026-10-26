import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { CalendarDayCell, findDayEvents } from './calendar-day.js';
import { CalendarEventButton } from './calendar-event.js';
import { layoutDay, layoutWeek } from './calendar-layout.js';
import { getWeekDays } from './calendar-days.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
const hours = Array.from({ length: 24 }, (_, hour) => hour);
/** The hour labels beside the time grid, decorative: each day's events read their own times. */
function WeekGutter({ day }) {
    const strings = useUiStrings();
    return (_jsxs("div", { "aria-hidden": "true", ...hooks.slot('gutter'), children: [_jsx("div", { ...hooks.slot('all-day'), children: strings.allDay }), _jsx("div", { ...hooks.slot('timed'), style: { position: 'relative' }, children: hours.map((hour) => (_jsx("span", { ...hooks.slot('hour'), style: { position: 'absolute', top: `${(hour / 24) * 100}%` }, children: day.format.formatHour(hour) }, hour))) })] }));
}
/**
 * One day of the week: its bars lane by lane in the all-day area, padded with spacers to the week's
 * lane count so the areas line up, then its timed events placed in the time grid.
 */
function WeekDay({ date, column, segments, laneCount, events, timeZone, day, event, }) {
    const isActive = date === day.focused;
    return (_jsxs(CalendarDayCell, { day: date, context: day, events: findDayEvents(events, date), isOutsideMonth: false, showNumber: false, children: [_jsx("div", { ...hooks.slot('all-day'), children: Array.from({ length: laneCount }, (_, lane) => {
                    const segment = segments.find((entry) => entry.lane === lane && entry.column === column);
                    if (!segment)
                        return _jsx("div", { "aria-hidden": "true", ...hooks.slot('spacer') }, lane);
                    return (_jsx(CalendarEventButton, { placed: segment.placed, context: event, isTabbable: isActive, time: "none", continuesBefore: segment.continuesBefore, continuesAfter: segment.continuesAfter, style: { width: `${segment.span * 100}%` } }, lane));
                }) }), _jsx("div", { ...hooks.slot('timed'), style: { position: 'relative' }, children: layoutDay(date, events, timeZone).map((block) => (_jsx(CalendarEventButton, { placed: block.placed, context: event, isTabbable: isActive, time: "range", continuesBefore: block.continuesBefore, continuesAfter: block.continuesAfter, style: {
                        position: 'absolute',
                        top: `${block.top}%`,
                        height: `${block.height}%`,
                        left: `${block.left}%`,
                        width: `${block.width}%`,
                    } }, toKeyIdentity(block.placed.event.id)))) })] }));
}
/** The week view: day headers, then the days of the focused day's week with all-day bars and a time grid. */
export function CalendarWeek({ grid, titleId, ...rest }) {
    const days = getWeekDays(rest.day.focused, rest.day.format.locale);
    const { segments, laneCount } = layoutWeek(days, rest.events, { spansOnly: true });
    return (_jsxs("div", { ref: grid.ref, role: "grid", "aria-labelledby": titleId, onKeyDown: grid.onKeyDown, onFocus: grid.onFocus, ...hooks.slot('grid'), children: [_jsxs("div", { role: "row", ...hooks.slot('weekdays'), children: [_jsx("div", { "aria-hidden": "true", ...hooks.slot('gutter') }), days.map((date) => {
                        const isToday = date === rest.day.today;
                        return (_jsxs("div", { role: "columnheader", ...hooks.slot('weekday', { today: isToday }), children: [_jsxs("span", { "aria-hidden": "true", children: [rest.day.format.formatWeekday(date).short, ' ', _jsx("span", { ...hooks.slot('day-number'), children: rest.day.format.formatDayNumber(date) })] }), _jsx(VisuallyHidden, { elementType: "span", children: rest.day.format.formatDay(date) })] }, date));
                    })] }), _jsxs("div", { role: "row", ...hooks.slot('week'), children: [_jsx(WeekGutter, { day: rest.day }), days.map((date, column) => (_jsx(WeekDay, { ...rest, date: date, column: column, segments: segments, laneCount: laneCount }, date)))] })] }));
}
//# sourceMappingURL=calendar-week.js.map