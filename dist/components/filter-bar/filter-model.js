// The filter model shared by the filter bar and the condition builder: fields, operators, values.
const defaultOperators = {
    text: ['contains', 'not-contains', 'equals', 'not-equals', 'starts-with', 'empty', 'not-empty'],
    number: [
        'equals',
        'not-equals',
        'less-than',
        'at-most',
        'greater-than',
        'at-least',
        'between',
        'empty',
        'not-empty',
    ],
    date: ['equals', 'before', 'after', 'between', 'empty', 'not-empty'],
    choice: ['any-of', 'none-of', 'empty', 'not-empty'],
    person: ['any-of', 'none-of', 'empty', 'not-empty'],
    boolean: ['equals'],
};
/** The operators a field offers, in order. */
export function getFilterOperators(field) {
    return field.operators ?? defaultOperators[field.type];
}
/** The shape of value `operator` takes on a field of `type`. */
export function getFilterValueKind(type, operator) {
    if (operator === 'empty' || operator === 'not-empty')
        return 'none';
    if (type === 'choice' || type === 'person')
        return 'list';
    if (type === 'boolean')
        return 'boolean';
    if (type === 'number')
        return operator === 'between' ? 'number-range' : 'number';
    if (type === 'date')
        return operator === 'between' ? 'date-range' : 'date';
    return 'text';
}
const emptyValues = {
    none: null,
    text: '',
    number: null,
    'number-range': { min: null, max: null },
    date: null,
    'date-range': null,
    list: [],
    boolean: true,
};
/** A new condition on `field`: its first operator and that operator's empty value. */
export function createFilterCondition(field) {
    const operator = getFilterOperators(field)[0] ?? 'equals';
    return {
        field: field.id,
        operator,
        value: emptyValues[getFilterValueKind(field.type, operator)],
    };
}
/** `condition` with another operator, keeping its value when the new operator takes the same shape. */
export function changeFilterOperator(condition, field, operator) {
    const kind = getFilterValueKind(field.type, operator);
    const isSameKind = kind === getFilterValueKind(field.type, condition.operator);
    return { ...condition, operator, value: isSameKind ? condition.value : emptyValues[kind] };
}
function isNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
/** Whether a value is a range of numbers. */
export function isNumberRange(value) {
    return typeof value === 'object' && value !== null && 'min' in value && 'max' in value;
}
/** Whether a value is a range of dates. */
export function isDateRange(value) {
    return typeof value === 'object' && value !== null && 'start' in value && 'end' in value;
}
const completeValueTests = {
    none: () => true,
    text: (value) => typeof value === 'string' && value.trim() !== '',
    number: isNumber,
    'number-range': (value) => isNumberRange(value) && isNumber(value.min) && isNumber(value.max),
    date: (value) => typeof value === 'string' && value !== '',
    'date-range': (value) => isDateRange(value) && Boolean(value.start) && Boolean(value.end),
    list: (value) => Array.isArray(value) && value.length > 0,
    boolean: (value) => typeof value === 'boolean',
};
/** Whether a condition has every value its operator needs, so that it filters. */
export function isFilterConditionComplete(condition, field) {
    return completeValueTests[getFilterValueKind(field.type, condition.operator)](condition.value);
}
//# sourceMappingURL=filter-model.js.map