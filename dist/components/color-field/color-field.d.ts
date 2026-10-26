import { type FieldInputProps } from '../field/field.js';
import { type ColorFieldFormat } from './color-values.js';
export interface ColorFieldProps extends FieldInputProps<string | null> {
    /**
     * How the colour is written beside the swatch and edited in the picker (controlled). An alpha
     * format (`hexa`, `rgba`, `hsla`, `hsba`) adds an alpha slider and input.
     */
    format?: ColorFieldFormat | undefined;
    /** The initial format when uncontrolled. Defaults to `hex`. */
    defaultFormat?: ColorFieldFormat | undefined;
    /** Called with the format chosen in the picker. */
    onFormatChange?: ((format: ColorFieldFormat) => void) | undefined;
    /** The formats the picker offers to switch between; two or more draw a format choice. */
    formats?: readonly ColorFieldFormat[] | undefined;
    /**
     * How the value is stored. Defaults to lowercase hex: `#rrggbb`, or `#rrggbbaa` while the format
     * has alpha.
     */
    valueFormat?: ColorFieldFormat | undefined;
    /** Preset colours the picker offers as swatches. */
    swatches?: readonly string[] | undefined;
    /** Adds a picker button that samples a colour from the screen, where the browser can. */
    allowsEyeDropper?: boolean | undefined;
    /** Draws a text input to type a colour into beside a swatch button, instead of a text trigger. */
    allowsTyping?: boolean | undefined;
    /** The text shown while no colour is set. Defaults to the provider's `noColor`. */
    placeholder?: string | undefined;
}
/**
 * A field for a colour value, stored as lowercase hex (or in `valueFormat`) or `null`. Its trigger
 * shows a swatch and the colour text (or, with `allowsTyping`, a swatch button and a text input) and
 * opens a picker: a format choice, a saturation and brightness area, hue and alpha sliders, the
 * format's inputs, an eye dropper, preset swatches and, unless required, a Clear button. The picked
 * colour commits when the picker closes. With `name`, a hidden input submits the stored value.
 */
export declare function ColorField({ format, defaultFormat, onFormatChange, formats, valueFormat, swatches, allowsEyeDropper, allowsTyping, placeholder, ...props }: ColorFieldProps): import("react").JSX.Element;
export type { ColorFieldFormat } from './color-values.js';
//# sourceMappingURL=color-field.d.ts.map