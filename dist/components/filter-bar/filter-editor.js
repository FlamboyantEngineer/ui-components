import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { BooleanField } from '../boolean-field/boolean-field.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { NumberField } from '../number-field/number-field.js';
import { PeoplePicker, } from '../people-picker/people-picker.js';
import { SelectField } from '../select-field/select-field.js';
import { TextField } from '../text-field/text-field.js';
import { changeFilterOperator, getFilterOperators, getFilterValueKind, isDateRange, isNumberRange, } from './filter-model.js';
function toPeople(options) {
    return (options ?? []).map((option) => ({
        id: option.value,
        name: option.label,
        description: option.description,
        src: option.src,
    }));
}
/** Searches a person field's own options by name; it changes only with the options. */
function usePeopleLoader({ options }) {
    return useCallback((query) => {
        const needle = query.trim().toLowerCase();
        const people = toPeople(options).filter((person) => person.name.toLowerCase().includes(needle));
        return Promise.resolve(people);
    }, [options]);
}
function PersonValue({ field, condition, labelLayout, slotClass, setValue }) {
    const strings = useUiStrings();
    const loadItems = usePeopleLoader(field);
    const value = condition.value;
    const name = labelLayout === 'control-only' ? { 'aria-label': strings.filterValue } : {};
    // The chosen people are known from the field's options, so they show by name before a search.
    const chosen = toPeople(field.options).filter((person) => value.includes(String(person.id)));
    return (_jsx(PeoplePicker, { ...name, className: slotClass('value'), label: labelLayout === 'label-control' ? strings.filterValue : undefined, selectionMode: "multiple", loadItems: loadItems, knownPeople: chosen, value: [...value], onChange: (keys) => setValue(keys.map(String)) }));
}
function RangeValue({ condition, labelLayout, slotClass, setValue }) {
    const strings = useUiStrings();
    const range = isNumberRange(condition.value) ? condition.value : { min: null, max: null };
    return (_jsxs("div", { className: slotClass('value'), role: "group", "aria-label": strings.filterValue, children: [_jsx(NumberField, { label: strings.rangeFrom, labelLayout: labelLayout, value: range.min, committedValue: range.min, onChange: (min) => setValue({ ...range, min }) }), _jsx(NumberField, { label: strings.rangeTo, labelLayout: labelLayout, value: range.max, committedValue: range.max, onChange: (max) => setValue({ ...range, max }) })] }));
}
/** The control for the condition's value, chosen by the shape its operator takes. */
function ValueControl(props) {
    const strings = useUiStrings();
    const { field, condition, labelLayout, slotClass, setValue } = props;
    const shared = { label: strings.filterValue, labelLayout, className: slotClass('value') };
    const value = condition.value;
    switch (getFilterValueKind(field.type, condition.operator)) {
        case 'none':
            return null;
        case 'number':
            return (_jsx(NumberField, { ...shared, value: value, committedValue: value, onChange: setValue }));
        case 'number-range':
            return _jsx(RangeValue, { ...props });
        case 'date':
            return (_jsx(DateTimeField, { ...shared, value: value, committedValue: value, onChange: setValue }));
        case 'date-range': {
            const range = isDateRange(value) ? value : null;
            return (_jsx(DateTimeField, { ...shared, mode: "date-range", value: range, committedValue: range, onChange: setValue }));
        }
        case 'list':
            return field.type === 'person' ? _jsx(PersonValue, { ...props }) : _jsx(ChoiceValue, { ...props });
        case 'boolean':
            return (_jsx(BooleanField, { ...shared, variant: "segmented", value: value, committedValue: value, onChange: (next) => setValue(next ?? true) }));
        case 'text':
            return (_jsx(TextField, { ...shared, value: value, committedValue: value, onChange: setValue }));
    }
}
function ChoiceValue({ field, condition, labelLayout, slotClass, setValue }) {
    const strings = useUiStrings();
    const options = (field.options ?? []).map((option) => ({
        id: option.value,
        label: option.label,
        description: option.description,
    }));
    const value = [...condition.value];
    return (_jsx(SelectField, { label: strings.filterValue, labelLayout: labelLayout, className: slotClass('value'), selectionMode: "multiple", options: options, value: value, committedValue: value, onChange: (keys) => setValue(keys.map(String)) }));
}
/**
 * The operator and value of one condition: a select of the field's operators (left out when the
 * field offers one), then the value control its operator takes. Each change reports a new condition.
 */
export function FilterConditionFields(props) {
    const strings = useUiStrings();
    const { field, condition, onChange, labelLayout, slotClass } = props;
    const operators = getFilterOperators(field);
    const setValue = (value) => onChange({ ...condition, value });
    return (_jsxs(_Fragment, { children: [operators.length > 1 ? (_jsx(SelectField, { label: strings.filterCondition, labelLayout: labelLayout, className: slotClass('operator'), options: operators.map((operator) => ({
                    id: operator,
                    label: strings.filterOperator(operator),
                })), value: condition.operator, committedValue: condition.operator, onChange: (operator) => operator === null
                    ? undefined
                    : onChange(changeFilterOperator(condition, field, operator)) })) : null, _jsx(ValueControl, { ...props, setValue: setValue })] }));
}
//# sourceMappingURL=filter-editor.js.map