import { type InputHTMLAttributes } from 'react';
import type { FieldControlProps, FieldState } from '../field/field.js';
import { type PinInputType } from './pin-value.js';
/** How the cells look and what they take. */
export interface PinCellOptions {
    length: number;
    type: PinInputType;
    mask: boolean;
    placeholder: string | undefined;
    /** The first cell's autocomplete hint; the others never autocomplete. */
    autoComplete: InputHTMLAttributes<HTMLInputElement>['autoComplete'];
}
export interface PinInputCellsProps {
    control: FieldControlProps;
    state: FieldState<string>;
    cells: PinCellOptions;
    /** The form name the joined value submits under. */
    name: string | undefined;
    onComplete: ((value: string) => void) | undefined;
}
export declare const pinInputHooks: import("../../core/hooks.js").ComponentHooks<"cell" | "group">;
/**
 * The cells of a code, one input each, in a group named by the field's label. One cell is in the
 * tab order, and focus never lands past the cell that takes the next character, so the value has
 * no gaps. A hidden input submits the joined value.
 */
export declare function PinInputCells({ control, state, cells, name, onComplete }: PinInputCellsProps): import("react").JSX.Element;
//# sourceMappingURL=pin-input-cells.d.ts.map