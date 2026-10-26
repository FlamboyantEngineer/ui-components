import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
/** The events of `events` that cover `day`. */
export function findDayEvents(events, day) {
    return events.filter((placed) => placed.startDay <= day && placed.endDay >= day);
}
/**
 * A day of a calendar grid: a grid cell whose name starts with the day in full (hidden text), the
 * grid's tab stop while it is the focused day, marked as today with `aria-current="date"`, holding
 * the caller's `renderDay` content and the day's events.
 */
export function CalendarDayCell({ day, context, events, isOutsideMonth, showNumber, children, }) {
    const { focused, today, format, renderDay } = context;
    const isToday = day === today;
    const content = renderDay?.({
        date: day,
        isToday,
        isOutsideMonth,
        events: events.map((placed) => placed.event),
    });
    return (_jsxs("div", { role: "gridcell", tabIndex: day === focused ? 0 : -1, "aria-current": isToday ? 'date' : undefined, "data-date": day, ...hooks.slot('day', { today: isToday, outsideMonth: isOutsideMonth }), children: [_jsx(VisuallyHidden, { elementType: "span", children: format.formatDay(day) }), showNumber ? (_jsx("span", { "aria-hidden": "true", ...hooks.slot('day-number'), children: format.formatDayNumber(day) })) : null, isEmptyNode(content) ? null : _jsx("div", { ...hooks.slot('day-content'), children: content }), children] }));
}
//# sourceMappingURL=calendar-day.js.map