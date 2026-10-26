import type { InputHTMLAttributes } from 'react';
import { type FieldInputProps } from '../field/field.js';
import type { PinInputType } from './pin-value.js';
export type { PinInputType } from './pin-value.js';
export interface PinInputProps extends FieldInputProps<string> {
    /** How many characters the code has: one cell each. */
    length: number;
    /** The characters a cell takes. Defaults to `numeric`. */
    type?: PinInputType | undefined;
    /** Hides the characters, as a password input does. */
    mask?: boolean | undefined;
    /** Shown in each empty cell. */
    placeholder?: string | undefined;
    /** The first cell's autocomplete hint, such as `one-time-code` for a code sent by message. Defaults to `off`. */
    autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete'];
    /** Called with the code each time a change fills every cell. */
    onComplete?: ((value: string) => void) | undefined;
}
/**
 * A field for a short code, such as a PIN or a one-time code: one single-character input per
 * character, in a group named by the label. Typing advances, Backspace erases and moves back, the
 * arrow keys move, and a paste fills the cells from the focused one. It has the field base's
 * validation, dirty state, restore, undo and menu, and reports a partly filled code.
 */
export declare function PinInput({ length, type, mask, placeholder, autoComplete, onComplete, ...props }: PinInputProps): import("react").JSX.Element;
//# sourceMappingURL=pin-input.d.ts.map