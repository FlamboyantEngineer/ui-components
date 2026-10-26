import { type FilterCondition, type FilterField } from './filter-model.js';
export interface FilterChipProps {
    field: FilterField;
    condition: FilterCondition;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onChange: (condition: FilterCondition) => void;
    onRemove: () => void;
}
/**
 * One active filter: a button reading the field, operator and value that opens the condition's
 * editor in a popover, and a button that removes the filter.
 */
export declare function FilterChip({ field, condition, isOpen, onOpenChange, ...actions }: FilterChipProps): import("react").JSX.Element;
//# sourceMappingURL=filter-chip.d.ts.map