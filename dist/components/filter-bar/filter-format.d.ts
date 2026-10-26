import { type FilterCondition, type FilterField } from './filter-model.js';
/** A condition read as text, in its three parts. */
export interface FilterConditionText {
    field: string;
    operator: string;
    /** Empty for an operator that takes no value and for a condition missing its value. */
    value: string;
}
/** Reads a condition as text, in the provider's locale and strings: `Status`, `is any of`, `Open`. */
export declare function useFilterConditionText(): (condition: FilterCondition, field: FilterField) => FilterConditionText;
/** A condition's parts joined into one line, as a chip reads it. */
export declare function joinFilterConditionText({ field, operator, value }: FilterConditionText): string;
//# sourceMappingURL=filter-format.d.ts.map