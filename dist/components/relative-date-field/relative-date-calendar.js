import { jsx as _jsx } from "react/jsx-runtime";
import { parseIsoDate, Calendar, RangeCalendar, SelectStateContext, } from '../../primitives/index.js';
import { useContext, useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { CalendarBody } from '../date-time-field/date-time-field.js';
import { toValueDate, } from './relative-date.js';
const hooks = createHooks('relative-date-field', ['calendar']);
function useCalendarValues(value, bounds) {
    const range = typeof value === 'object' ? value : null;
    const single = typeof value === 'string' ? value : null;
    const start = range?.start;
    const end = range?.end;
    return useMemo(() => {
        const startDate = parseIsoDate(start);
        const endDate = parseIsoDate(end);
        return {
            date: single ? parseIsoDate(toValueDate(single)) : null,
            range: startDate && endDate ? { start: startDate, end: endDate } : null,
            minValue: parseIsoDate(bounds.minValue),
            maxValue: parseIsoDate(bounds.maxValue),
        };
    }, [single, start, end, bounds.minValue, bounds.maxValue]);
}
/**
 * The calendar beside the presets (the Date Time Field's calendar parts): picking a day, or a range
 * of days, commits it and closes the popover. Days outside the bounds cannot be picked.
 */
export function PresetCalendar({ kind, value, bounds, today, onPick }) {
    const select = useContext(SelectStateContext);
    const values = useCalendarValues(value, bounds);
    const pick = (picked) => {
        onPick(picked);
        select?.close();
    };
    const limits = {
        minValue: values.minValue,
        maxValue: values.maxValue,
        defaultFocusedValue: parseIsoDate(today),
    };
    if (kind === 'date-range') {
        return (_jsx(RangeCalendar, { className: hooks.slotClass('calendar'), ...limits, value: values.range, onChange: (range) => {
                if (range)
                    pick({ start: range.start.toString(), end: range.end.toString() });
            }, children: _jsx(CalendarBody, { months: 1, heading: "text" }) }));
    }
    return (_jsx(Calendar, { className: hooks.slotClass('calendar'), ...limits, value: values.date, onChange: (date) => pick(date.toString()), children: _jsx(CalendarBody, { months: 1, heading: "text" }) }));
}
//# sourceMappingURL=relative-date-calendar.js.map