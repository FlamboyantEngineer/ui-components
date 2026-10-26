import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A month or week calendar of events: a toolbar to move between periods and views, then a grid of
// days the reader navigates by keyboard, holding all-day bars, timed events and `+n more` lists.
import { useId, useMemo } from 'react';
import { getLocalTimeZone, parseIsoDate, useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
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
const allViews = ['month', 'week'];
/** The toolbar: Today, previous and next, the period on show (a polite live region) and the views. */
function CalendarToolbar(props) {
    const { mode, views, title, titleId, onMove, onModeChange } = props;
    const strings = useUiStrings();
    const { direction } = useLocale();
    const isRightToLeft = direction === 'rtl';
    return (_jsxs("div", { ...hooks.slot('toolbar'), children: [_jsx(Button, { size: "sm", className: hooks.slotClass('today'), onPress: () => onMove(0), children: strings.today }), _jsx(Button, { icon: isRightToLeft ? 'chevron-right' : 'chevron-left', size: "sm", label: strings.previousRange(mode), className: hooks.slotClass('previous'), onPress: () => onMove(-1) }), _jsx(Button, { icon: isRightToLeft ? 'chevron-left' : 'chevron-right', size: "sm", label: strings.nextRange(mode), className: hooks.slotClass('next'), onPress: () => onMove(1) }), _jsx("span", { id: titleId, "aria-live": "polite", ...hooks.slot('title'), children: title }), views.length > 1 ? (_jsx(SegmentedChoice, { "aria-label": strings.calendarViews, size: "sm", sizing: "content", options: views.map((value) => ({ value, label: strings[value] })), value: mode, onChange: (value) => {
                    if (value === 'month' || value === 'week')
                        onModeChange(value);
                }, className: hooks.slotClass('views') })) : null] }));
}
/**
 * A calendar of events in a month or week view. Events are plain data: all-day events on dates and
 * timed events on ISO 8601 date-times, placed in `timeZone`. The month view packs each week's events
 * into lanes, multi-day events as bars across days, and lists a crowded day's hidden events behind
 * `+n more`; the week view shows all-day bars above a time grid of timed events. The toolbar moves
 * by month or week, back to today and between views; the arrow keys, Home, End, PageUp and PageDown
 * move between days. Pressing an event calls `onEventAction`.
 */
export function CalendarView({ events, view, defaultView = 'month', onViewChange, views = allViews, date, defaultDate, onDateChange, timeZone, maxEvents = 3, onEventAction, renderDay, getNow, className, ...rest }) {
    const zone = timeZone ?? getLocalTimeZone();
    const today = getDayOf((getNow?.() ?? new Date()).getTime(), zone);
    const titleId = useId();
    const format = useCalendarFormat(zone);
    const [mode, setMode] = useControllableState(view, defaultView, onViewChange);
    const [focusedText, setFocused] = useControllableState(date, defaultDate ?? today, onDateChange);
    const focused = parseIsoDate(focusedText)?.toString() ?? today;
    const placed = useMemo(() => readEvents(events, zone), [events, zone]);
    const grid = useCalendarGrid({
        focused,
        setFocused,
        mode,
        isInPeriod: (day) => mode === 'week' || isSameMonth(day, focused),
    });
    const days = mode === 'week' ? getWeekDays(focused, format.locale) : [];
    const onMove = (direction) => setFocused(direction === 0
        ? today
        : shiftDay(focused, { [mode === 'month' ? 'months' : 'weeks']: direction }));
    const day = { focused, today, format, renderDay };
    const event = { format, onEventAction };
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { view: mode } }), children: [_jsx(CalendarToolbar, { mode: mode, views: views, title: format.formatTitle(mode, days, focused), titleId: titleId, onMove: onMove, onModeChange: setMode }), mode === 'month' ? (_jsx(CalendarMonth, { events: placed, grid: grid, titleId: titleId, maxEvents: maxEvents, day: day, event: event })) : (_jsx(CalendarWeek, { events: placed, grid: grid, titleId: titleId, timeZone: zone, day: day, event: event }))] }));
}
//# sourceMappingURL=calendar-view.js.map