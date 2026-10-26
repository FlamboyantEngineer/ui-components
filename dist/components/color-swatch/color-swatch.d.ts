import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Size } from '../../core/props.js';
export interface ColorSwatchProps extends BaseProps, AriaLabellingProps {
    /**
     * A hex, `rgb()`, `hsl()` or `hsb()` colour string. Nothing, empty text or a colour in another
     * notation draws an empty swatch.
     */
    color?: string | null | undefined;
    /** Names the colour instead of its name in the locale. */
    colorName?: string | undefined;
    /** Box size. Defaults to `md`. */
    size?: Size | undefined;
}
/** Whether the swatch can draw `color`: a hex, `rgb()`, `hsl()` or `hsb()` colour string. */
export declare function isSwatchColor(color: string | null | undefined): color is string;
/** A colour shown on its own, named by its colour so assistive technology can read it. */
export declare function ColorSwatch({ color, size, className, colorName, ...rest }: ColorSwatchProps): import("react").JSX.Element;
export { ColorSwatchPicker, ColorSwatchPickerItem } from './color-swatch-picker.js';
export type { ColorSwatchPickerItemProps, ColorSwatchPickerLayout, ColorSwatchPickerProps, } from './color-swatch-picker.js';
//# sourceMappingURL=color-swatch.d.ts.map