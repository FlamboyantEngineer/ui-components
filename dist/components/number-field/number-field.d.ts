import type { ReactNode } from 'react';
import { type FieldInputProps } from '../field/field.js';
import { type NumberFieldRadix } from './radix-number.js';
/**
 * What a commit does with a value outside the range or off the step: `snap` clamps it into the
 * range and snaps it to the nearest step; `validate` keeps it and reports an error.
 */
export type NumberFieldCommitBehavior = 'snap' | 'validate';
export interface NumberFieldProps extends FieldInputProps<number | null> {
    /** Number base. Nondecimal bases edit integers and show 0b, 0o or 0x prefixes. Defaults to 10. */
    radix?: NumberFieldRadix | undefined;
    /** The smallest value. */
    minValue?: number | undefined;
    /** The largest value. */
    maxValue?: number | undefined;
    /** The step of the buttons and the arrow keys, counted from `minValue` (or zero). Defaults to 1. */
    step?: number | undefined;
    /** How the value is formatted and parsed in the locale: decimals, grouping, currency, percent, units. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
    /** What a commit does with a value outside the rules. Defaults to `snap`. */
    commitBehavior?: NumberFieldCommitBehavior | undefined;
    /** A hint shown while the control is empty. */
    placeholder?: string | undefined;
    /** Leave out the decrement and increment buttons; the arrow keys still step the value. */
    hideStepper?: boolean | undefined;
    /** Content inside the frame before the number, such as a literal prefix (`$`). */
    startAdornment?: ReactNode;
    /** Content inside the frame after the number, such as a literal suffix (`/mo`). */
    endAdornment?: ReactNode;
    /** The step of Alt with Arrow Up or Arrow Down, and of a scrub with Alt held. */
    smallStep?: number | undefined;
    /** The step of Shift with Arrow Up or Arrow Down, and of a scrub with Shift held. */
    largeStep?: number | undefined;
    /** Draws a scrub handle before the number: dragging it sideways steps the value. */
    showScrubber?: boolean | undefined;
}
export type NumberControlConfig = Pick<NumberFieldProps, 'name' | 'minValue' | 'maxValue' | 'step' | 'formatOptions' | 'placeholder' | 'hideStepper' | 'startAdornment' | 'endAdornment' | 'showScrubber' | 'commitBehavior'>;
/**
 * A field for a number, parsed and formatted for the locale, with steppers. It commits when focus
 * leaves the field, on Enter and on each step, and reports a value outside its range or off its
 * step. Adornments sit inside its frame; Shift and Alt step by larger and smaller amounts, and a
 * scrub handle steps by dragging.
 */
export declare function NumberField({ radix, placeholder, hideStepper, startAdornment, endAdornment, smallStep, largeStep, showScrubber, commitBehavior, ...props }: NumberFieldProps): import("react").JSX.Element;
export type { NumberFieldRadix } from './radix-number.js';
//# sourceMappingURL=number-field.d.ts.map