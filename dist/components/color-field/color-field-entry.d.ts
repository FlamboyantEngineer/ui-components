import { type FieldControlProps, type FieldState } from '../field/field.js';
import { type ColorFieldFormat } from './color-values.js';
export interface ColorEntryProps {
    control: FieldControlProps;
    state: FieldState<string | null>;
    label: string;
    /** The value as a CSS colour, or `null` without one. */
    color: string | null;
    format: ColorFieldFormat;
    valueFormat: ColorFieldFormat;
    placeholder: string;
}
/**
 * The typeable closed control: a swatch button that opens the picker, then a text input showing the
 * colour in its format. Typed text applies when focus leaves the input and commits on Enter, or once
 * focus leaves the field: a colour in any CSS form sets the value, empty text clears an optional
 * one, and anything else is put back.
 */
export declare function ColorEntry({ control, state, label, color, format, valueFormat, placeholder, }: ColorEntryProps): import("react").JSX.Element;
//# sourceMappingURL=color-field-entry.d.ts.map