import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckboxContext, CheckboxFieldContext, DialogTrigger, Provider, } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ChoiceGroup, Choice } from '../choice-group/choice-group.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { Modal } from '../modal/modal.js';
import { NumberField } from '../number-field/number-field.js';
import { TextField } from '../text-field/text-field.js';
import { listFilterOptions, } from './table-filters.js';
import { tableHooks as hooks } from './table-hooks.js';
function isRange(value) {
    return typeof value === 'object' && !Array.isArray(value);
}
function toRange(value) {
    return isRange(value) && !('start' in value) ? value : {};
}
function toDateRange(value) {
    return isRange(value) && 'start' in value ? value : null;
}
/** Two bounds for a `number` filter; either may stay empty. */
function NumberRangeFields({ value, onChange }) {
    const strings = useUiStrings();
    const range = toRange(value);
    const min = range.min ?? null;
    const max = range.max ?? null;
    return (_jsxs(_Fragment, { children: [_jsx(NumberField, { label: strings.rangeFrom, value: min, committedValue: min, onChange: (next) => onChange({ ...range, min: next }) }), _jsx(NumberField, { label: strings.rangeTo, value: max, committedValue: max, onChange: (next) => onChange({ ...range, max: next }) })] }));
}
/** The field a column's filter type edits its value with. */
function TableFilterField(props) {
    const strings = useUiStrings();
    const { column, label, value, onChange } = props;
    switch (column.filter?.type) {
        case 'number':
            return _jsx(NumberRangeFields, { ...props });
        case 'date': {
            const range = toDateRange(value);
            return (_jsx(DateTimeField, { mode: "date-range", label: label, value: range, committedValue: range, onChange: (next) => onChange(next) }));
        }
        case 'set': {
            const ticked = Array.isArray(value) ? [...value] : [];
            const options = listFilterOptions(props.rows, column).map((option) => ({
                value: option,
                label: option,
            }));
            return (_jsx(ChoiceGroup, { selectionMode: "multiple", label: label, value: ticked, committedValue: ticked, onChange: onChange, children: options.map((option) => (_jsx(Choice, { value: option.value, children: option.label }, option.value))) }));
        }
        default: {
            const text = typeof value === 'string' ? value : '';
            return (_jsx(TextField, { label: strings.contains, value: text, committedValue: text, onChange: onChange }));
        }
    }
}
/**
 * A column header's filter button, which opens a popover holding the field of the column's filter
 * type and a button that clears it. The rows follow each change as it is made.
 */
export function TableColumnFilter(props) {
    const strings = useUiStrings();
    const title = strings.filterLabel(props.label);
    return (_jsxs(DialogTrigger, { children: [_jsx(Button, { icon: "filter", label: title, size: "xs", excludeFromTabOrder: true, className: hooks.slotClass('column-filter') }), _jsx(Modal, { title: title, placement: "bottom start", size: "sm", isDismissable: true, className: hooks.slotClass('column-filter-dialog'), actions: _jsx(Button, { variant: "ghost", size: "sm", onPress: () => props.onChange(null), children: strings.clearFilter }), children: _jsx(Provider, { values: [
                        [CheckboxContext, null],
                        [CheckboxFieldContext, null],
                    ], children: _jsx(TableFilterField, { ...props }) }) })] }));
}
//# sourceMappingURL=table-column-filter.js.map