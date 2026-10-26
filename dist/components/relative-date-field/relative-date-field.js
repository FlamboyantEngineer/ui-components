import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { DateFormatter, getLocalTimeZone, parseIsoDate, useLocale, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl, } from '../field/field.js';
import { PresetCalendar } from './relative-date-calendar.js';
import { PresetSelect } from './relative-date-select.js';
import { describeRelativeDate, describeRelativeRange, findRelativeBoundIssue, formatRelativePeriod, formatRelativePreset, resolvePickedDate, resolveRelativePreset, resolveRelativeRange, toLocalDay, } from './relative-date.js';
const DEFAULT_PRESETS = [
    { amount: 0, unit: 'day' },
    { amount: 1, unit: 'day' },
    { amount: -1, unit: 'day' },
    { amount: 1, unit: 'week' },
    { amount: -1, unit: 'week' },
];
const DEFAULT_RANGE_PRESETS = [
    { amount: 0, unit: 'day' },
    { amount: -7, unit: 'day' },
    { amount: -30, unit: 'day' },
    { amount: 7, unit: 'day' },
];
const hooks = createHooks('relative-date-field', ['preview']);
const currentTime = () => new Date();
function resolvePreset(preset, { now, kind }) {
    if ('getValue' in preset)
        return preset.getValue(now);
    if (kind === 'date-range')
        return resolveRelativeRange(preset, now);
    return resolveRelativePreset(preset, { now, kind });
}
function labelPreset(preset, context, strings) {
    if ('getValue' in preset)
        return preset.label;
    if (context.kind !== 'date-range' || preset.label || preset.amount === 0) {
        return formatRelativePreset(preset, context.locale);
    }
    const period = formatRelativePeriod(preset, context.locale);
    return preset.amount < 0 ? strings.lastPeriod(period) : strings.nextPeriod(period);
}
/** The value read relative to now: a date or instant, or a range of dates. */
function describeValue(value, options) {
    if (!value)
        return null;
    const describe = { now: options.now, locale: options.locale, fallbackAfterDays: options.days };
    return typeof value === 'string'
        ? describeRelativeDate(value, describe)
        : describeRelativeRange(value, describe);
}
/** A `YYYY-MM-DD` date as a localized date; unreadable text is kept. */
function formatDay(text, locale) {
    const date = parseIsoDate(text);
    if (!date)
        return text;
    return new DateFormatter(locale, { dateStyle: 'medium' }).format(date.toDate(getLocalTimeZone()));
}
/** The field's own check: a value outside the bounds is invalid, with the bound in the message. */
function useBoundCheck(bounds) {
    const strings = useUiStrings();
    const { locale } = useLocale();
    return (value) => {
        const issue = findRelativeBoundIssue(value, bounds);
        if (!issue)
            return null;
        const limit = formatDay(issue.limit, locale);
        const message = issue.bound === 'min' ? strings.dateTooEarly(limit) : strings.dateTooLate(limit);
        return { severity: 'error', message };
    };
}
/**
 * The absolute value after the trigger: a `<time>` element, or for a range a `<span>` holding a
 * `<time>` element per end.
 */
function Preview({ value, absolute }) {
    const { locale } = useLocale();
    if (typeof value === 'string') {
        return (_jsx("time", { ...hooks.slot('preview'), dateTime: value, children: absolute }));
    }
    return (_jsxs("span", { ...hooks.slot('preview'), children: [_jsx("time", { dateTime: value.start, children: formatDay(value.start, locale) }), " \u2013", ' ', _jsx("time", { dateTime: value.end, children: formatDay(value.end, locale) })] }));
}
/**
 * A field that sets a date, an instant or a range of dates from relative presets (React Aria
 * `Select`), and with `showCalendar` from a calendar beside them: the trigger reads the value
 * relative to now, such as `Tomorrow` or `3 days ago`, and a preview after it gives the absolute
 * date. Picking a preset commits the value it stands for; presets outside the bounds are disabled.
 */
export function RelativeDateField(props) {
    const strings = useUiStrings();
    const { locale } = useLocale();
    const kind = props.valueKind ?? 'date';
    const bounds = { minValue: props.minValue, maxValue: props.maxValue };
    const check = useBoundCheck(bounds);
    const { state, field } = useFieldControl(props, { initialValue: null, emptyValue: null, check });
    const getNow = props.getNow ?? currentTime;
    const presets = (props.presets ??
        (kind === 'date-range' ? DEFAULT_RANGE_PRESETS : DEFAULT_PRESETS));
    const context = { now: getNow(), kind, locale };
    const value = (state.value ?? null);
    const text = describeValue(value, { ...context, days: props.fallbackAfterDays ?? 7 });
    const items = presets.map((preset, index) => ({
        id: String(index),
        label: labelPreset(preset, context, strings),
        isDisabled: findRelativeBoundIssue(resolvePreset(preset, context), bounds) !== null,
    }));
    const commit = (next) => {
        state.setValue(next);
        state.commit();
    };
    const pickDate = (picked) => {
        const now = getNow();
        if (typeof picked !== 'string')
            commit(picked);
        else
            commit(resolvePickedDate(picked, { now, kind: kind === 'date-time' ? kind : 'date' }));
    };
    const data = { valueKind: kind, relation: text?.relation };
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className, props: field, data }), state: state, children: (control) => (_jsxs(_Fragment, { children: [_jsx(PresetSelect, { isOpen: props.isOpen, defaultOpen: props.defaultOpen, onOpenChange: props.onOpenChange, control: control, state: state, items: items, text: text, placeholder: props.placeholder ?? strings.selectPlaceholder, onPick: (id) => {
                        const preset = presets[Number(id)];
                        if (preset)
                            commit(resolvePreset(preset, { ...context, now: getNow() }));
                    }, aside: props.showCalendar ? (_jsx(PresetCalendar, { kind: kind, value: value, bounds: bounds, today: toLocalDay(context.now), onPick: pickDate })) : null }), text && value ? _jsx(Preview, { value: value, absolute: text.absolute }) : null] })) }));
}
//# sourceMappingURL=relative-date-field.js.map