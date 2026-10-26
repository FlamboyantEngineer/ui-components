import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type FilterCondition, type FilterField } from './filter-model.js';
export interface FilterBarProps extends BaseProps, AriaLabellingProps {
    /** The fields records can be filtered by, in the order the add menu lists them. */
    fields: readonly FilterField[];
    /** The active filters, controlled. */
    value?: readonly FilterCondition[] | undefined;
    /** The filters to start with, uncontrolled. */
    defaultValue?: readonly FilterCondition[] | undefined;
    /** Called with the new filters after each change. */
    onChange?: ((value: FilterCondition[]) => void) | undefined;
    /** A free-text search, such as a `SearchField`, drawn first in the bar. */
    search?: ReactNode;
}
/**
 * A row of active filters as chips, each reading `Field operator value` and opening its editor in a
 * popover: the operators and the value control follow the field's type. An add menu lists the
 * fields; choosing one adds a filter and opens its editor. Each chip has a remove button, and a
 * clear button removes every filter. A free-text search can lead the row.
 */
export declare function FilterBar({ fields, value: controlledValue, defaultValue, onChange, search, className, 'aria-label': ariaLabel, ...rest }: FilterBarProps): import("react").JSX.Element;
export { FilterConditionFields } from './filter-editor.js';
export { createFilterMatcher, matchesFilterCondition } from './filter-matching.js';
export type { FilterRecordValue, FilterValueGetter } from './filter-matching.js';
export { createFilterCondition, isFilterConditionComplete } from './filter-model.js';
export type { FilterCondition, FilterField, FilterFieldType, FilterNumberRange, FilterOption, FilterValue, } from './filter-model.js';
export type { FilterOperator } from '../../core/query-strings.js';
//# sourceMappingURL=filter-bar.d.ts.map