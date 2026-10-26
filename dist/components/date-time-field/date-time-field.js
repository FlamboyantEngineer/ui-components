import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl, } from '../field/field.js';
import { createDateUnavailableCheck } from './date-states.js';
import { DateFormInputs } from './date-time-form.js';
import { DateControl, DateRangeControl, TimeControl, } from './date-time-pickers.js';
import { findBoundIssue, formatDateValue, isUnavailableValue, } from './date-values.js';
const hooks = createHooks('date-time-field');
const controls = {
    date: DateControl,
    'date-time': DateControl,
    'date-range': DateRangeControl,
    'date-time-range': DateRangeControl,
    time: TimeControl,
};
/**
 * The field's own check: a value outside the bounds, or on a date `isDateUnavailable` refuses, is
 * invalid with a message naming the reason.
 */
function useDateCheck(props, mode) {
    const strings = useUiStrings();
    const { locale } = useLocale();
    const options = { timeZone: props.timeZone, granularity: props.granularity };
    return (value) => {
        const issue = findBoundIssue(value, mode, { ...props, ...options });
        if (issue) {
            const limit = formatDateValue(issue.limit, mode, { ...options, locale });
            const message = issue.bound === 'min' ? strings.dateTooEarly(limit) : strings.dateTooLate(limit);
            return { severity: 'error', message };
        }
        const isDateUnavailable = createDateUnavailableCheck(props);
        if (isUnavailableValue(value, mode, { ...options, isDateUnavailable })) {
            return { severity: 'error', message: strings.dateUnavailable };
        }
        return null;
    };
}
function toSettings(props, isPickable, state) {
    return {
        isRequired: state.isRequired,
        canClear: state.canClear,
        timeZone: props.timeZone,
        granularity: props.granularity,
        hourCycle: props.hourCycle,
        hideTimeZone: props.hideTimeZone,
        getDateState: props.getDateState,
        isDateUnavailable: createDateUnavailableCheck(props),
        presets: props.presets ?? [],
        calendarHeading: props.calendarHeading ?? 'text',
        isPickable,
    };
}
/**
 * A field for a date, a time of day, a date and time, or a range of dates or of dates and times
 * (React Aria `DatePicker`, `TimeField` and `DateRangePicker`), with the field base's label,
 * validation, dirty state, restore, undo and menu. A value outside `minValue` and `maxValue`, or on
 * an unavailable date, stays on screen, invalid and uncommitted, until it is corrected.
 */
export function DateTimeField(props) {
    const { locale } = useLocale();
    const all = props;
    const mode = props.mode ?? 'date';
    const check = useDateCheck(all, mode);
    const empty = null;
    const { state, field } = useFieldControl(props, {
        initialValue: empty,
        emptyValue: empty,
        check,
    });
    const committed = state.committedValue;
    const previous = state.isDirty && committed
        ? formatDateValue(committed, mode, { locale, timeZone: props.timeZone })
        : null;
    const Control = controls[mode];
    const pick = (value) => {
        state.setValue(value);
        if (!check(value))
            state.commit();
    };
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className, props: field, data: { mode } }), state: state, children: (control) => (_jsxs(_Fragment, { children: [_jsx(Control, { isOpen: props.isOpen, defaultOpen: props.defaultOpen, onOpenChange: props.onOpenChange, control: control, state: state, mode: mode, bounds: props, settings: toSettings(all, (value) => !check(value), state), previous: previous, onPick: pick }), _jsx(DateFormInputs, { value: state.value, names: props, isDisabled: state.isDisabled })] })) }));
}
export { CalendarBody } from './date-time-calendar.js';
export { formatDateValue } from './date-values.js';
//# sourceMappingURL=date-time-field.js.map