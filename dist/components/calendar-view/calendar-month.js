import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { findMaximum } from '../../utils/find-maximum.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { CalendarDayCell, findDayEvents } from './calendar-day.js';
import { CalendarEventButton, CalendarMoreEvents, } from './calendar-event.js';
import { countVisibleLanes, findColumnSegments, layoutWeek, } from './calendar-layout.js';
import { getMonthWeeks, isSameMonth } from './calendar-days.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
/** One day of the month: its bars lane by lane, spacers where a lane is taken or empty, then `+n more`. */
function MonthDay({ date, column, segments, visibleLanes, events, day, event }) {
    const covering = findColumnSegments(segments, column);
    const shown = covering.filter((segment) => segment.lane < visibleLanes);
    const laneCount = findMaximum(shown, (segment) => segment.lane + 1, 0);
    const isActive = date === day.focused;
    const isOutsideMonth = !isSameMonth(date, day.focused);
    return (_jsx(CalendarDayCell, { day: date, context: day, events: findDayEvents(events, date), isOutsideMonth: isOutsideMonth, showNumber: true, children: _jsxs("div", { ...hooks.slot('events'), children: [Array.from({ length: laneCount }, (_, lane) => {
                    const segment = shown.find((entry) => entry.lane === lane);
                    if (!segment || segment.column !== column) {
                        return _jsx("div", { "aria-hidden": "true", ...hooks.slot('spacer') }, lane);
                    }
                    return (_jsx(CalendarEventButton, { placed: segment.placed, context: event, isTabbable: isActive, time: "start", continuesBefore: segment.continuesBefore, continuesAfter: segment.continuesAfter, style: { width: `${segment.span * 100}%` } }, lane));
                }), covering.length > shown.length ? (_jsx(CalendarMoreEvents, { events: covering.map((segment) => segment.placed), hidden: covering.length - shown.length, dayLabel: day.format.formatDay(date), isTabbable: isActive, context: event })) : null] }) }));
}
/** One week row of the month, its events packed into lanes across its days. */
function MonthWeek(props) {
    const { days, ...rest } = props;
    const { segments } = layoutWeek(days, rest.events, { spansOnly: false });
    const visibleLanes = countVisibleLanes(segments, rest.maxEvents);
    return (_jsx("div", { role: "row", ...hooks.slot('week'), children: days.map((date, column) => (_jsx(MonthDay, { ...rest, date: date, column: column, segments: segments, visibleLanes: visibleLanes }, date))) }));
}
/** The month view: weekday headers, then one row per week of the focused day's month. */
export function CalendarMonth({ grid, titleId, ...rest }) {
    const weeks = getMonthWeeks(rest.day.focused, rest.day.format.locale);
    return (_jsxs("div", { ref: grid.ref, role: "grid", "aria-labelledby": titleId, onKeyDown: grid.onKeyDown, onFocus: grid.onFocus, ...hooks.slot('grid'), children: [_jsx("div", { role: "row", ...hooks.slot('weekdays'), children: (weeks[0] ?? []).map((date) => {
                    const names = rest.day.format.formatWeekday(date);
                    return (_jsxs("div", { role: "columnheader", ...hooks.slot('weekday'), children: [_jsx("span", { "aria-hidden": "true", children: names.short }), _jsx(VisuallyHidden, { elementType: "span", children: names.long })] }, date));
                }) }), weeks.map((days) => (_jsx(MonthWeek, { days: days, ...rest }, days[0])))] }));
}
//# sourceMappingURL=calendar-month.js.map