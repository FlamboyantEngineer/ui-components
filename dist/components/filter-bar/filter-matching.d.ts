import { type FilterCondition, type FilterField } from './filter-model.js';
/** A record's value for one field: a scalar, a date, a list of values or nothing. */
export type FilterRecordValue = string | number | boolean | Date | readonly (string | number)[] | null | undefined;
/** Reads a record's value for a field. */
export type FilterValueGetter<T> = (record: T, fieldId: string) => FilterRecordValue;
/**
 * Whether a record's value passes a condition on `field`. A condition missing its value passes
 * every record. A list value passes when one of its entries does, and fails a negated operator
 * (`not-contains`, `not-equals`, `none-of`) when one of its entries matches. Text compares without
 * case; dates compare by day.
 */
export declare function matchesFilterCondition(value: FilterRecordValue, condition: FilterCondition, field: FilterField): boolean;
/**
 * A test of a record against every condition, reading each field's value with `getValue`.
 * Conditions on unknown fields and conditions missing their value pass every record.
 */
export declare function createFilterMatcher<T>(options: {
    conditions: readonly FilterCondition[];
    fields: readonly FilterField[];
    getValue: FilterValueGetter<T>;
}): (record: T) => boolean;
//# sourceMappingURL=filter-matching.d.ts.map