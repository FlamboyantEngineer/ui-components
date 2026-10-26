import type { FilterOperator } from '../../core/query-strings.js';
import type { DateRangeValue } from '../date-time-field/date-time-field.js';
/** The kind of value a field holds, which sets its operators and its value control. */
export type FilterFieldType = 'text' | 'number' | 'date' | 'choice' | 'person' | 'boolean';
/** One value a `choice` or `person` field offers. */
export interface FilterOption {
    /** The stored value. */
    value: string;
    /** The visible text, also the person's name. */
    label: string;
    /** A secondary line, such as a person's role. */
    description?: string | undefined;
    /** A person's picture URL. */
    src?: string | undefined;
}
/** A field records can be filtered by. */
export interface FilterField {
    id: string;
    label: string;
    type: FilterFieldType;
    /** The operators offered, in order. Defaults to every operator of the type. */
    operators?: readonly FilterOperator[] | undefined;
    /** The values a `choice` or `person` field offers. */
    options?: readonly FilterOption[] | undefined;
}
/** A `between` range of numbers. */
export interface FilterNumberRange {
    min: number | null;
    max: number | null;
}
/**
 * A condition's value: text, a number, a `YYYY-MM-DD` date, a boolean, a list of option values, a
 * range of numbers or dates, or `null` for an operator that takes none.
 */
export type FilterValue = string | number | boolean | readonly string[] | FilterNumberRange | DateRangeValue | null;
/** One condition on one field, as plain data. */
export interface FilterCondition {
    /** The field's `id`. */
    field: string;
    operator: FilterOperator;
    value: FilterValue;
}
/** The shape of value an operator takes on a field type. */
export type FilterValueKind = 'none' | 'text' | 'number' | 'number-range' | 'date' | 'date-range' | 'list' | 'boolean';
/** The operators a field offers, in order. */
export declare function getFilterOperators(field: FilterField): readonly FilterOperator[];
/** The shape of value `operator` takes on a field of `type`. */
export declare function getFilterValueKind(type: FilterFieldType, operator: FilterOperator): FilterValueKind;
/** A new condition on `field`: its first operator and that operator's empty value. */
export declare function createFilterCondition(field: FilterField): FilterCondition;
/** `condition` with another operator, keeping its value when the new operator takes the same shape. */
export declare function changeFilterOperator(condition: FilterCondition, field: FilterField, operator: FilterOperator): FilterCondition;
/** Whether a value is a range of numbers. */
export declare function isNumberRange(value: FilterValue): value is FilterNumberRange;
/** Whether a value is a range of dates. */
export declare function isDateRange(value: FilterValue): value is DateRangeValue;
/** Whether a condition has every value its operator needs, so that it filters. */
export declare function isFilterConditionComplete(condition: FilterCondition, field: FilterField): boolean;
//# sourceMappingURL=filter-model.d.ts.map