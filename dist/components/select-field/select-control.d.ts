import type { FieldControlProps, FieldState } from '../field/field.js';
import { type SelectConfig, type SelectKeysValue } from './select-model.js';
export type { SelectConfig, SelectKeysValue } from './select-model.js';
export interface SelectControlProps extends SelectConfig {
    control: FieldControlProps;
    state: FieldState<SelectKeysValue>;
    /** The field's label, which names the chips and the clear button. */
    label: string;
    isMultiple: boolean;
}
/**
 * A select field's control: React Aria's `Select` with the framed trigger, the open list and, for a
 * multiple select, the chips. Every pick, chip removal, clear and restore commits at once.
 */
export declare function SelectControl({ control, label, ...props }: SelectControlProps): import("react").JSX.Element;
//# sourceMappingURL=select-control.d.ts.map