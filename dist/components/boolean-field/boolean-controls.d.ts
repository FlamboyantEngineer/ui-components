import type { ControlSize } from '../../core/props.js';
import { type FieldControlProps, type FieldState } from '../field/field.js';
/**
 * How a boolean is drawn: a tick box, a switch, a pair of named segments, a select of the named
 * values, or a toggle button showing the current value's name.
 */
export type BooleanFieldVariant = 'checkbox' | 'switch' | 'segmented' | 'dropdown' | 'toggle-button';
/** The names of the three states, and whether the caller named true or false. */
export interface BooleanLabels {
    true: string;
    false: string;
    unset: string;
    hasCustom: boolean;
}
export interface BooleanControlProps {
    control: FieldControlProps;
    state: FieldState<boolean | null>;
    variant: BooleanFieldVariant;
    /** The field's label. */
    label: string;
    labels: BooleanLabels;
    allowsUnset: boolean;
    name: string | undefined;
    /** The field's size, which the checkbox and segments take. */
    size: ControlSize;
}
/** The control the variant draws, bound to the field state. Every pick commits at once. */
export declare function BooleanControl(props: BooleanControlProps): import("react").JSX.Element;
//# sourceMappingURL=boolean-controls.d.ts.map