// Tests records against filter conditions, so a host filters its own data the way the bar reads.
import { getFilterValueKind, isDateRange, isFilterConditionComplete, isNumberRange, } from './filter-model.js';
const isoDay = /^\d{4}-\d{2}-\d{2}/;
function isEmptyRecordValue(value) {
    if (value === null || value === undefined || value === '')
        return true;
    return Array.isArray(value) && value.length === 0;
}
function toScalars(value) {
    if (value === null || value === undefined)
        return [];
    return Array.isArray(value) ? [...value] : [value];
}
/** A record value's day as `YYYY-MM-DD`, from a date (in local time) or a text starting with one. */
function toDay(value) {
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime()))
            return null;
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${value.getFullYear()}-${month}-${day}`;
    }
    return typeof value === 'string' && isoDay.test(value) ? value.slice(0, 10) : null;
}
function testText(operator, wanted, value) {
    const text = String(value).toLowerCase();
    const needle = wanted.trim().toLowerCase();
    if (operator === 'equals' || operator === 'not-equals')
        return text === needle;
    if (operator === 'starts-with')
        return text.startsWith(needle);
    return text.includes(needle);
}
function testNumber(condition, value) {
    if (typeof value !== 'number')
        return false;
    const wanted = condition.value;
    if (isNumberRange(wanted))
        return value >= (wanted.min ?? 0) && value <= (wanted.max ?? 0);
    const bound = wanted;
    switch (condition.operator) {
        case 'less-than':
            return value < bound;
        case 'at-most':
            return value <= bound;
        case 'greater-than':
            return value > bound;
        case 'at-least':
            return value >= bound;
        default:
            return value === bound;
    }
}
function testDate(condition, value) {
    const day = toDay(value);
    const wanted = condition.value;
    if (day === null)
        return false;
    if (isDateRange(wanted))
        return day >= wanted.start && day <= wanted.end;
    if (condition.operator === 'before')
        return day < String(wanted);
    if (condition.operator === 'after')
        return day > String(wanted);
    return day === wanted;
}
/** Whether one of the record's values passes the condition, before negation. */
function testValue(condition, field, value) {
    const kind = getFilterValueKind(field.type, condition.operator);
    if (kind === 'list')
        return condition.value.includes(String(value));
    if (kind === 'boolean')
        return value === condition.value;
    if (kind === 'number' || kind === 'number-range')
        return testNumber(condition, value);
    if (kind === 'date' || kind === 'date-range')
        return testDate(condition, value);
    return testText(condition.operator, condition.value, value);
}
const negated = new Set(['not-contains', 'not-equals', 'none-of']);
/**
 * Whether a record's value passes a condition on `field`. A condition missing its value passes
 * every record. A list value passes when one of its entries does, and fails a negated operator
 * (`not-contains`, `not-equals`, `none-of`) when one of its entries matches. Text compares without
 * case; dates compare by day.
 */
export function matchesFilterCondition(value, condition, field) {
    if (!isFilterConditionComplete(condition, field))
        return true;
    if (condition.operator === 'empty')
        return isEmptyRecordValue(value);
    if (condition.operator === 'not-empty')
        return !isEmptyRecordValue(value);
    const passes = toScalars(value).some((entry) => testValue(condition, field, entry));
    return negated.has(condition.operator) ? !passes : passes;
}
/**
 * A test of a record against every condition, reading each field's value with `getValue`.
 * Conditions on unknown fields and conditions missing their value pass every record.
 */
export function createFilterMatcher(options) {
    const { conditions, fields, getValue } = options;
    const tests = conditions.flatMap((condition) => {
        const field = fields.find((candidate) => candidate.id === condition.field);
        return field ? [{ condition, field }] : [];
    });
    return (record) => tests.every(({ condition, field }) => matchesFilterCondition(getValue(record, field.id), condition, field));
}
//# sourceMappingURL=filter-matching.js.map