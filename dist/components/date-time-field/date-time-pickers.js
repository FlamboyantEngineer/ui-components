import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatIsoDate, now, parseIsoDate, parseIsoDateTime, parseIsoTime, toCalendarDate, Button as AriaButton, Calendar, DateInput, DatePicker, DateRangePicker, DateSegment, Group, RangeCalendar, TimeField, } from '../../primitives/index.js';
import { useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { FieldPreviousValue, toAriaControlProps, } from '../field/field.js';
import { CalendarBody, CalendarPopover, } from './date-time-calendar.js';
import { toSingleMode, } from './date-values.js';
const hooks = createHooks('date-time-field', [
    'picker',
    'group',
    'previous',
    'input',
    'segment',
    'separator',
    'button',
    'calendar',
]);
/** A date or a date and time text as the value the date pickers edit, or `null`. */
function toPickerValue(text, mode, zone) {
    return mode === 'date' ? parseIsoDate(text) : parseIsoDateTime(text, zone);
}
/** The building block's unavailable-date check, asking the caller's about the calendar date. */
function toUnavailableCheck(isDateUnavailable) {
    if (!isDateUnavailable)
        return undefined;
    return (date) => isDateUnavailable(toCalendarDate(date).toString());
}
function pickerProps({ control, settings }) {
    return {
        ...toAriaControlProps(control),
        className: hooks.slotClass('picker'),
        hourCycle: settings.hourCycle,
    };
}
/** The props the date pickers share: open state, the time settings and unavailable dates. */
function datePickerProps(props) {
    const { isOpen, defaultOpen, onOpenChange, settings, mode } = props;
    const hasTime = toSingleMode(mode) === 'date-time';
    return {
        ...pickerProps(props),
        isOpen,
        defaultOpen,
        onOpenChange,
        granularity: hasTime ? (settings.granularity ?? 'minute') : 'day',
        hideTimeZone: settings.hideTimeZone,
        isDateUnavailable: toUnavailableCheck(settings.isDateUnavailable),
    };
}
/** A zoned starting point, so an empty date-time field in a time zone types zoned values. */
function usePlaceholderValue({ mode, settings }) {
    const zone = toSingleMode(mode) === 'date-time' ? settings.timeZone : undefined;
    return useMemo(() => (zone ? now(zone).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }) : undefined), [zone]);
}
function useBoundValues({ mode, bounds, settings }) {
    const single = toSingleMode(mode) === 'date' ? 'date' : 'date-time';
    const { timeZone } = settings;
    const { minValue, maxValue } = bounds;
    return useMemo(() => ({
        minValue: toPickerValue(minValue, single, timeZone),
        maxValue: toPickerValue(maxValue, single, timeZone),
    }), [single, timeZone, minValue, maxValue]);
}
function PreviousValue({ previous }) {
    return previous ? (_jsx(FieldPreviousValue, { className: hooks.slotClass('previous'), children: previous })) : null;
}
/** A picker's framed group: the previous value while dirty, the segments and the button. */
function DateGroup({ control, previous, children, }) {
    return (_jsxs(Group, { className: hooks.slotClass('group'), ref: control.ref, children: [_jsx(PreviousValue, { previous: previous }), children] }));
}
function Segments({ slot }) {
    return (_jsx(DateInput, { slot: slot, className: hooks.slotClass('input'), children: (segment) => _jsx(DateSegment, { segment: segment, className: hooks.slotClass('segment') }) }));
}
function CalendarButton() {
    return (_jsx(AriaButton, { className: hooks.slotClass('button'), children: _jsx(Glyph, { name: "calendar" }) }));
}
/** A date, or a date and time, typed in segments or picked from a calendar. */
export function DateControl(props) {
    const { state, mode, settings, onPick } = props;
    const single = mode === 'date' ? 'date' : 'date-time';
    const text = typeof state.value === 'string' ? state.value : null;
    const { timeZone, granularity } = settings;
    const value = useMemo(() => toPickerValue(text, single, timeZone), [text, single, timeZone]);
    return (_jsxs(DatePicker, { ...datePickerProps(props), ...useBoundValues(props), placeholderValue: usePlaceholderValue(props), value: value, onChange: (next) => onPick(next ? formatIsoDate(next, granularity) : null), children: [_jsxs(DateGroup, { ...props, children: [_jsx(Segments, {}), _jsx(CalendarButton, {})] }), _jsx(CalendarPopover, { mode: mode, settings: settings, onPick: onPick, children: _jsx(Calendar, { className: hooks.slotClass('calendar'), children: _jsx(CalendarBody, { getDateState: settings.getDateState, months: 1, heading: settings.calendarHeading }) }) })] }));
}
/** A range of dates, or of dates and times, typed in two segment groups or picked from a calendar. */
export function DateRangeControl(props) {
    const { state, mode, settings, onPick } = props;
    const single = mode === 'date-range' ? 'date' : 'date-time';
    const range = typeof state.value === 'object' ? state.value : null;
    const start = range?.start;
    const end = range?.end;
    const { timeZone, granularity } = settings;
    const value = useMemo(() => {
        const first = toPickerValue(start, single, timeZone);
        const last = toPickerValue(end, single, timeZone);
        return first && last ? { start: first, end: last } : null;
    }, [start, end, single, timeZone]);
    const toText = (date) => formatIsoDate(date, granularity);
    return (_jsxs(DateRangePicker, { ...datePickerProps(props), ...useBoundValues(props), placeholderValue: usePlaceholderValue(props), value: value, onChange: (next) => {
            const picked = next
                ? { start: toText(next.start), end: toText(next.end) }
                : null;
            onPick(picked);
        }, children: [_jsxs(DateGroup, { ...props, children: [_jsx(Segments, { slot: "start" }), _jsx("span", { ...hooks.slot('separator'), "aria-hidden": "true", children: "\u2013" }), _jsx(Segments, { slot: "end" }), _jsx(CalendarButton, {})] }), _jsx(CalendarPopover, { mode: mode, settings: settings, onPick: onPick, children: _jsx(RangeCalendar, { className: hooks.slotClass('calendar'), visibleDuration: { months: 2 }, children: _jsx(CalendarBody, { getDateState: settings.getDateState, months: 2, heading: settings.calendarHeading }) }) })] }));
}
/** A time of day typed in segments, with no picker. */
export function TimeControl(props) {
    const { state, bounds, settings, onPick } = props;
    const granularity = settings.granularity ?? 'minute';
    const text = typeof state.value === 'string' ? state.value : null;
    const value = useMemo(() => parseIsoTime(text), [text]);
    const minValue = useMemo(() => parseIsoTime(bounds.minValue), [bounds.minValue]);
    const maxValue = useMemo(() => parseIsoTime(bounds.maxValue), [bounds.maxValue]);
    return (_jsx(TimeField, { ...pickerProps(props), granularity: granularity, value: value, minValue: minValue, maxValue: maxValue, onChange: (next) => onPick(next ? formatIsoDate(next, granularity) : null), children: _jsxs("div", { ...hooks.slot('group'), ref: props.control.ref, children: [_jsx(PreviousValue, { previous: props.previous }), _jsx(Segments, {})] }) }));
}
//# sourceMappingURL=date-time-pickers.js.map