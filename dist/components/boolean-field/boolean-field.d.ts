import { type FieldInputProps } from '../field/field.js';
import { type BooleanFieldVariant } from './boolean-controls.js';
export interface BooleanFieldProps extends FieldInputProps<boolean | null> {
    /** How the value is drawn. Defaults to `checkbox`. */
    variant?: BooleanFieldVariant | undefined;
    /**
     * Names the true value: a segment, an option, the toggle button's caption and the switch caption.
     * Defaults to the provider's `valueTrue`.
     */
    trueLabel?: string | undefined;
    /** Names the false value. Defaults to the provider's `valueFalse`. */
    falseLabel?: string | undefined;
    /** Names the unset value where a variant shows it. Defaults to the provider's `valueUnset`. */
    unsetLabel?: string | undefined;
    /**
     * Pressing can return the value to unset (`null`): the checkbox, switch and toggle button cycle
     * unset, true and false, the segmented variant offers an explicit unset segment, and the dropdown lists
     * an unset option.
     */
    allowsUnset?: boolean | undefined;
    /** The form name: checkbox and switch submit `true` while on; the other variants submit `true` or `false`, and nothing while unset. */
    name?: string | undefined;
}
/**
 * A field for a true-or-false value, drawn as a checkbox, a switch, two named segments, a select or
 * a toggle button. It may also hold no value (`null`): required, it is then invalid; with
 * `allowsUnset`, pressing returns to it.
 */
export declare function BooleanField({ variant, trueLabel, falseLabel, unsetLabel, allowsUnset, ...props }: BooleanFieldProps): import("react").JSX.Element;
export type { BooleanFieldVariant } from './boolean-controls.js';
//# sourceMappingURL=boolean-field.d.ts.map