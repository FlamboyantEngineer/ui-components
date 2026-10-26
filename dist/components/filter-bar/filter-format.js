import { useLocale, useNumberFormatter } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { formatDateValue } from '../date-time-field/date-time-field.js';
import { getFilterValueKind, isDateRange, isFilterConditionComplete, isNumberRange, } from './filter-model.js';
function formatList(values, field) {
    const labels = values.map((value) => field.options?.find((option) => option.value === value)?.label ?? value);
    return labels.join(', ');
}
function formatValue(condition, field, context) {
    const { value } = condition;
    const { strings, locale, number } = context;
    switch (getFilterValueKind(field.type, condition.operator)) {
        case 'none':
            return '';
        case 'number':
            return number.format(value);
        case 'number-range':
            return isNumberRange(value)
                ? strings.filterRange(number.format(value.min ?? 0), number.format(value.max ?? 0))
                : '';
        case 'date':
            return formatDateValue(value, 'date', { locale });
        case 'date-range':
            return isDateRange(value) ? formatDateValue(value, 'date-range', { locale }) : '';
        case 'list':
            return formatList(value, field);
        case 'boolean':
            return value ? strings.valueTrue : strings.valueFalse;
        case 'text':
            return String(value);
    }
}
/** Reads a condition as text, in the provider's locale and strings: `Status`, `is any of`, `Open`. */
export function useFilterConditionText() {
    const strings = useUiStrings();
    const { locale } = useLocale();
    const number = useNumberFormatter();
    return (condition, field) => ({
        field: field.label,
        operator: strings.filterOperator(condition.operator),
        value: isFilterConditionComplete(condition, field)
            ? formatValue(condition, field, { strings, locale, number })
            : '',
    });
}
/** A condition's parts joined into one line, as a chip reads it. */
export function joinFilterConditionText({ field, operator, value }) {
    return [field, operator, value].filter(Boolean).join(' ');
}
//# sourceMappingURL=filter-format.js.map